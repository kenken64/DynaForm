import asyncio
import aiohttp
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import hashlib
from config import config
from mongodb_service import mongodb_service
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service

logger = logging.getLogger(__name__)

class ConversationInterceptor:
    def __init__(self):
        self.ollama_host = config.OLLAMA_HOST
        self.keywords = config.LISTEN_KEYWORDS
        self.processed_conversations = set()  # Track processed conversation hashes
        self.monitoring = False
        
    def _generate_conversation_hash(self, prompt: str, response: str) -> str:
        """Generate a unique hash for a conversation to avoid duplicate processing"""
        content = f"{prompt}:{response}:{datetime.now().strftime('%Y%m%d%H%M')}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def _monitor_ollama_api(self):
        """Monitor Ollama API for new conversations"""
        logger.info("🔍 Starting Ollama API conversation monitoring...")
        
        while self.monitoring:
            try:
                # Check for recent conversations by monitoring the generate endpoint
                # This is a simplified approach - in practice, you might need to hook into Ollama's logs
                await asyncio.sleep(5)  # Check every 5 seconds
                
                # For demonstration, we'll monitor a hypothetical conversation log
                # In real implementation, you'd hook into Ollama's actual conversation stream
                
            except Exception as e:
                logger.error(f"Error monitoring Ollama API: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    async def _intercept_conversation(self, prompt: str, response: str) -> bool:
        """Intercept and analyze a conversation for form publishing intent"""
        try:
            # Generate conversation hash to avoid duplicate processing
            conv_hash = self._generate_conversation_hash(prompt, response)
            if conv_hash in self.processed_conversations:
                return False
            
            # Check if the conversation contains publishing keywords
            full_text = f"{prompt} {response}"
            contains_keywords = any(keyword.lower() in full_text.lower() for keyword in self.keywords)
            
            if not contains_keywords:
                return False
            
            logger.info(f"🎯 Detected potential form publishing conversation: {prompt[:100]}...")
            
            # Analyze the conversation for form publishing intent
            analysis = await ollama_service.analyze_publish_intent(full_text)
            
            if analysis.get('wants_to_publish') and analysis.get('form_id'):
                form_id = analysis['form_id']
                logger.info(f"📋 Intercepted form publishing request for: {form_id}")
                
                # Mark as processed to avoid duplicates
                self.processed_conversations.add(conv_hash)
                
                # Perform the form publishing
                success = await self._auto_publish_form(form_id, prompt)
                
                if success:
                    logger.info(f"✅ Successfully auto-published form {form_id}")
                    # Optionally inject a response back to the conversation
                    await self._inject_success_response(form_id)
                else:
                    logger.error(f"❌ Failed to auto-publish form {form_id}")
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error intercepting conversation: {e}")
            return False
    
    async def _auto_publish_form(self, form_id: str, original_prompt: str) -> bool:
        """Automatically publish a form to the blockchain"""
        try:
            logger.info(f"🚀 Auto-publishing form {form_id}...")
            
            # Connect to MongoDB if needed
            if not mongodb_service.client:
                await mongodb_service.connect()
            
            # Fetch form data
            form_data = await mongodb_service.get_form_by_id(form_id)
            if not form_data:
                logger.error(f"Form {form_id} not found in database")
                return False
            
            # Get JSON fingerprint
            fingerprint = await mongodb_service.get_form_fingerprint(form_id)
            if not fingerprint:
                logger.error(f"JSON fingerprint not found for form {form_id}")
                return False
            
            # Register with blockchain
            result = await verifiable_contract_service.register_url(form_id, fingerprint)
            
            if result.get('success'):
                logger.info(f"🎉 Form {form_id} successfully registered on blockchain!")
                logger.info(f"📄 Public URL: {result.get('url')}")
                logger.info(f"🔗 Transaction: {result.get('transaction_hash')}")
                
                # Log the auto-publication event
                await self._log_auto_publication(form_id, result, original_prompt)
                return True
            else:
                logger.error(f"Blockchain registration failed: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error in auto-publish: {e}")
            return False
    
    async def _inject_success_response(self, form_id: str):
        """Inject a success response back to the conversation flow"""
        try:
            # This could be implemented to send a follow-up message to Ollama
            # or update a conversation log that the user can see
            success_message = f"✅ Form {form_id} has been automatically published to the blockchain!"
            logger.info(f"💬 Injecting response: {success_message}")
            
            # In a real implementation, you might:
            # 1. Send a notification to the user
            # 2. Update a conversation log
            # 3. Send a webhook to your frontend
            # 4. Store the result in a database for user retrieval
            
        except Exception as e:
            logger.error(f"Error injecting response: {e}")
    
    async def _log_auto_publication(self, form_id: str, result: Dict[str, Any], original_prompt: str):
        """Log the auto-publication event for audit trail"""
        try:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "form_id": form_id,
                "original_prompt": original_prompt[:500],  # Truncate for storage
                "public_url": result.get('url'),
                "transaction_hash": result.get('transaction_hash'),
                "block_number": result.get('block_number'),
                "gas_used": result.get('gas_used'),
                "auto_published": True
            }
            
            # Store in MongoDB for audit trail
            if mongodb_service.client:
                audit_collection = mongodb_service.db['publication_audit']
                await audit_collection.insert_one(log_entry)
                logger.info(f"📊 Logged auto-publication event for form {form_id}")
            
        except Exception as e:
            logger.error(f"Error logging auto-publication: {e}")
    
    async def start_monitoring(self):
        """Start the conversation monitoring service"""
        self.monitoring = True
        logger.info("🎧 Starting conversation interceptor service...")
        
        # Initialize services
        await mongodb_service.connect()
        ollama_available = await ollama_service.check_ollama_status()
        api_status = await verifiable_contract_service.get_api_status()
        
        if not ollama_available:
            logger.warning("⚠️ Ollama not available - monitoring may be limited")
        
        if not api_status.get('success'):
            logger.warning("⚠️ Verifiable contract API not available")
        
        # Start monitoring task
        monitor_task = asyncio.create_task(self._monitor_ollama_api())
        
        try:
            await monitor_task
        except asyncio.CancelledError:
            logger.info("📴 Monitoring task cancelled")
        except Exception as e:
            logger.error(f"Monitoring task failed: {e}")
    
    async def stop_monitoring(self):
        """Stop the conversation monitoring service"""
        self.monitoring = False
        logger.info("🛑 Stopping conversation interceptor service...")
        await mongodb_service.disconnect()
    
    async def simulate_conversation(self, prompt: str, response: str = None):
        """Simulate a conversation for testing purposes"""
        if response is None:
            response = "I'll help you with that form publishing request."
        
        logger.info(f"🧪 Simulating conversation intercept...")
        result = await self._intercept_conversation(prompt, response)
        return result

# Global instance
conversation_interceptor = ConversationInterceptor()

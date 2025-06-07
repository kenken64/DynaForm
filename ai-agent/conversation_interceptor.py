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
        self.pending_response_injections = {}  # Track successful publications for response injection
        
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
            logger.debug(f"🔍 [DEBUG] Intercepting conversation:")
            logger.debug(f"🔍 [DEBUG] Prompt: {prompt}")
            logger.debug(f"🔍 [DEBUG] Response: {response}")
            
            # Generate conversation hash to avoid duplicate processing
            conv_hash = self._generate_conversation_hash(prompt, response)
            logger.debug(f"🔍 [DEBUG] Conversation hash: {conv_hash}")
            
            if conv_hash in self.processed_conversations:
                logger.debug(f"🔍 [DEBUG] Conversation already processed, skipping")
                return False
            
            # Check if the conversation contains publishing keywords
            full_text = f"{prompt} {response}"
            logger.debug(f"🔍 [DEBUG] Full conversation text: {full_text}")
            logger.debug(f"🔍 [DEBUG] Checking for keywords: {self.keywords}")
            
            matching_keywords = [keyword for keyword in self.keywords if keyword.lower() in full_text.lower()]
            contains_keywords = len(matching_keywords) > 0
            
            logger.debug(f"🔍 [DEBUG] Matching keywords found: {matching_keywords}")
            logger.debug(f"🔍 [DEBUG] Contains keywords: {contains_keywords}")
            
            if not contains_keywords:
                logger.debug(f"🔍 [DEBUG] No publishing keywords found, skipping analysis")
                return False
            
            logger.info(f"🎯 Detected potential form publishing conversation: {prompt[:100]}...")
            logger.info(f"🎯 Matched keywords: {matching_keywords}")
            
            # Analyze the conversation for form publishing intent
            # Focus only on the user's prompt, not the AI's response, to avoid refusal bias
            logger.debug(f"🔍 [DEBUG] Analyzing user prompt for publishing intent...")
            analysis = await ollama_service.analyze_publish_intent(prompt)
            logger.debug(f"🔍 [DEBUG] Analysis result: {analysis}")
            
            if analysis.get('wants_to_publish') and analysis.get('form_id'):
                form_id = analysis['form_id']
                logger.info(f"📋 Intercepted form publishing request for: {form_id}")
                logger.info(f"📋 Analysis confidence: {analysis.get('confidence', 'unknown')}")
                
                # Mark as processed to avoid duplicates
                self.processed_conversations.add(conv_hash)
                logger.debug(f"🔍 [DEBUG] Marked conversation as processed")
                
                # Perform the form publishing
                logger.info(f"🚀 Starting auto-publication process for form {form_id}")
                success = await self._auto_publish_form(form_id, prompt)
                
                if success:
                    logger.info(f"✅ Successfully auto-published form {form_id}")
                    
                    # Store for response injection using just the prompt as key for simpler matching
                    prompt_key = prompt.strip().lower()
                    self.pending_response_injections[prompt_key] = {
                        "form_id": form_id,
                        "success_message": f"✅ Form {form_id} has been successfully published to the blockchain!\n\n🔗 Your form is now available at the public URL and verified on the blockchain.\n\n📋 Form ID: {form_id}\n🎯 Status: Published\n⛓️ Blockchain: Verified",
                        "timestamp": datetime.now()
                    }
                    logger.info(f"🔄 Stored response injection for prompt: {prompt[:50]}...")
                    
                    # Also inject a response back to the conversation
                    await self._inject_success_response(form_id)
                else:
                    logger.error(f"❌ Failed to auto-publish form {form_id}")
                
                return True
            else:
                logger.info(f"🤔 Conversation contains keywords but no valid publishing intent detected")
                logger.debug(f"🔍 [DEBUG] wants_to_publish: {analysis.get('wants_to_publish')}")
                logger.debug(f"🔍 [DEBUG] form_id: {analysis.get('form_id')}")
            
            return False
            
        except Exception as e:
            logger.error(f"Error intercepting conversation: {e}")
            logger.exception("Full exception details:")
            return False
    
    async def _auto_publish_form(self, form_id: str, original_prompt: str) -> bool:
        """Automatically publish a form to the blockchain"""
        try:
            logger.info(f"🚀 [AUTO-PUBLISH] Starting auto-publication for form {form_id}")
            logger.debug(f"🚀 [AUTO-PUBLISH] Original prompt: {original_prompt}")
            
            # Connect to MongoDB if needed
            if not mongodb_service.client:
                logger.debug(f"🚀 [AUTO-PUBLISH] MongoDB not connected, connecting...")
                await mongodb_service.connect()
            else:
                logger.debug(f"🚀 [AUTO-PUBLISH] MongoDB already connected")
            
            # Fetch form data
            logger.debug(f"🚀 [AUTO-PUBLISH] Fetching form data for {form_id}")
            form_data = await mongodb_service.get_form_by_id(form_id)
            if not form_data:
                logger.error(f"🚀 [AUTO-PUBLISH] ❌ Form {form_id} not found in database")
                return False
            
            logger.info(f"🚀 [AUTO-PUBLISH] ✅ Form data found for {form_id}")
            logger.debug(f"🚀 [AUTO-PUBLISH] Form title: {form_data.get('title', 'Unknown')}")
            
            # Get JSON fingerprint
            logger.debug(f"🚀 [AUTO-PUBLISH] Getting JSON fingerprint for {form_id}")
            fingerprint = await mongodb_service.get_form_fingerprint(form_id)
            if not fingerprint:
                logger.error(f"🚀 [AUTO-PUBLISH] ❌ JSON fingerprint not found for form {form_id}")
                return False
            
            logger.info(f"🚀 [AUTO-PUBLISH] ✅ JSON fingerprint found: {fingerprint}")
            
            # Register with blockchain
            logger.info(f"🚀 [AUTO-PUBLISH] Registering with verifiable contract service...")
            result = await verifiable_contract_service.register_url(form_id, fingerprint)
            
            logger.debug(f"🚀 [AUTO-PUBLISH] Verifiable contract response: {result}")
            
            if result.get('success'):
                logger.info(f"🚀 [AUTO-PUBLISH] 🎉 Form {form_id} successfully registered on blockchain!")
                logger.info(f"🚀 [AUTO-PUBLISH] 📄 Public URL: {result.get('url')}")
                logger.info(f"🚀 [AUTO-PUBLISH] 🔗 Transaction: {result.get('transaction_hash')}")
                logger.info(f"🚀 [AUTO-PUBLISH] 📦 Block: {result.get('block_number')}")
                logger.info(f"🚀 [AUTO-PUBLISH] ⛽ Gas: {result.get('gas_used')}")
                
                # Update MongoDB with verified status
                logger.info(f"🚀 [AUTO-PUBLISH] Updating form status to 'verified' in database...")
                update_success = await self._update_form_status(form_id, "verified", result)
                if update_success:
                    logger.info(f"🚀 [AUTO-PUBLISH] ✅ Form status updated to 'verified' in database")
                else:
                    logger.warning(f"🚀 [AUTO-PUBLISH] ⚠️ Failed to update form status in database")
                
                # Log the auto-publication event
                await self._log_auto_publication(form_id, result, original_prompt)
                return True
            else:
                logger.error(f"🚀 [AUTO-PUBLISH] ❌ Blockchain registration failed: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"🚀 [AUTO-PUBLISH] ❌ Error in auto-publish: {e}")
            logger.exception("🚀 [AUTO-PUBLISH] Full exception details:")
            return False
    
    async def _update_form_status(self, form_id: str, status: str, blockchain_result: Dict[str, Any]) -> bool:
        """Update the form status in MongoDB after successful blockchain registration"""
        try:
            if not mongodb_service.client:
                logger.debug(f"🗄️ [STATUS-UPDATE] MongoDB not connected, connecting...")
                await mongodb_service.connect()
            
            # Import ObjectId for MongoDB operations
            from bson import ObjectId
            
            # Prepare the update data
            update_data = {
                "status": status,
                "blockchainInfo": {
                    "publicUrl": blockchain_result.get('url'),
                    "transactionHash": blockchain_result.get('transaction_hash'),
                    "blockNumber": blockchain_result.get('block_number'),
                    "gasUsed": blockchain_result.get('gas_used'),
                    "verifiedAt": datetime.now().isoformat(),
                    "contractResponse": blockchain_result.get('contract_response', {})
                }
            }
            
            logger.debug(f"🗄️ [STATUS-UPDATE] Updating form {form_id} with data: {update_data}")
            
            # Try to convert to ObjectId if it looks like one
            try:
                if len(form_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in form_id):
                    result = await mongodb_service.forms_collection.update_one(
                        {"_id": ObjectId(form_id)},
                        {"$set": update_data}
                    )
                else:
                    result = await mongodb_service.forms_collection.update_one(
                        {"_id": form_id},
                        {"$set": update_data}
                    )
            except Exception:
                # Fallback to string search
                result = await mongodb_service.forms_collection.update_one(
                    {"_id": form_id},
                    {"$set": update_data}
                )
            
            if result.modified_count > 0:
                logger.info(f"🗄️ [STATUS-UPDATE] ✅ Successfully updated form {form_id} status to '{status}'")
                logger.info(f"🗄️ [STATUS-UPDATE] 🔗 Public URL: {blockchain_result.get('url')}")
                logger.info(f"🗄️ [STATUS-UPDATE] 📝 Transaction Hash: {blockchain_result.get('transaction_hash')}")
                return True
            else:
                logger.warning(f"🗄️ [STATUS-UPDATE] ⚠️ No document was modified for form {form_id}")
                return False
                
        except Exception as e:
            logger.error(f"🗄️ [STATUS-UPDATE] ❌ Error updating form status: {e}")
            logger.exception("🗄️ [STATUS-UPDATE] Full exception details:")
            return False
    
    def should_inject_response(self, prompt: str) -> Optional[str]:
        """Check if we should inject a custom response for this prompt"""
        try:
            # Use the same simple key matching approach
            prompt_key = prompt.strip().lower()
            
            logger.debug(f"🔄 Checking for response injection with key: {prompt_key[:50]}...")
            logger.debug(f"🔄 Available injection keys: {list(self.pending_response_injections.keys())}")
            
            if prompt_key in self.pending_response_injections:
                injection_data = self.pending_response_injections[prompt_key]
                logger.info(f"🔄 Found pending response injection for prompt: {prompt[:50]}...")
                
                # Remove from pending (use only once)
                del self.pending_response_injections[prompt_key]
                
                return injection_data["success_message"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking response injection: {e}")
            return None

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

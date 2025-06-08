import asyncio
import logging
import signal
import sys
from datetime import datetime

# Local imports
from config import config
from mongodb_service import mongodb_service
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service
from conversation_interceptor import conversation_interceptor
from ollama_monitor import OllamaConversationMonitor
from ollama_interceptor import get_ollama_interceptor

# Configure logging with DEBUG level for detailed interception logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('passive_agent.log')
    ]
)
logger = logging.getLogger(__name__)

class PassiveFormPublishingAgent:
    """
    Passive AI agent that monitors Ollama conversations and automatically
    publishes forms to blockchain when publishing intent is detected
    """
    
    def __init__(self):
        self.running = False
        self.monitor = None
        self.interceptor = None
        self.interceptor = None
        
    async def _conversation_callback(self, prompt: str, response: str):
        """Callback function called when a conversation is intercepted"""
        try:
            logger.info(f"💬 [CALLBACK] Intercepted conversation:")
            logger.info(f"💬 [CALLBACK] Prompt: {prompt}")
            logger.info(f"💬 [CALLBACK] Response: {response}")
            logger.info(f"💬 [CALLBACK] Prompt length: {len(prompt)} chars")
            logger.info(f"💬 [CALLBACK] Response length: {len(response)} chars")
            
            # Use the conversation interceptor to process
            logger.info(f"🔄 [CALLBACK] Passing to conversation interceptor...")
            result = await conversation_interceptor._intercept_conversation(prompt, response)
            
            if result:
                logger.info("✅ [CALLBACK] Successfully processed publishing request")
            else:
                logger.info("ℹ️ [CALLBACK] No publishing action needed for this conversation")
                
        except Exception as e:
            logger.error(f"Error in conversation callback: {e}")
    
    async def initialize_services(self):
        """Initialize all required services"""
        logger.info("🔧 Initializing services...")
        
        # Connect to MongoDB
        mongo_connected = await mongodb_service.connect()
        if not mongo_connected:
            logger.warning("⚠️ MongoDB connection failed - form data may not be available")
        else:
            logger.info("✅ MongoDB connected successfully")
        
        # Check Ollama status
        ollama_available = await ollama_service.check_ollama_status()
        if not ollama_available:
            logger.warning("⚠️ Ollama not available - conversation monitoring may be limited")
        else:
            logger.info("✅ Ollama is available and responding")
        
        # Check verifiable contract API
        api_status = await verifiable_contract_service.get_api_status()
        if not api_status.get("success"):
            logger.warning("⚠️ Verifiable contract API not available - publishing will fail")
        else:
            logger.info("✅ Verifiable contract API is available")
        
        logger.info("🎯 Service initialization complete")
    
    async def start_passive_monitoring(self):
        """Start the passive monitoring system"""
        self.running = True
        logger.info("🎧 Starting Passive Form Publishing Agent...")
        logger.info("📋 Monitoring for keywords: " + ", ".join(config.LISTEN_KEYWORDS))
        
        try:
            # Initialize services
            await self.initialize_services()
            
            # Start the real-time interceptor
            self.interceptor = get_ollama_interceptor(self._conversation_callback)
            
            # Connect the response injector for custom response handling
            self.interceptor.set_response_injector(conversation_interceptor)
            logger.info("🔄 Connected response injector for successful publication handling")
            
            logger.info("🎯 Starting real-time Ollama conversation interception...")
            
            # Start interception in the background
            interception_task = asyncio.create_task(self.interceptor.start_interception())
            
            # Also start the legacy monitor for backup
            self.monitor = OllamaConversationMonitor(self._conversation_callback)
            monitor_task = asyncio.create_task(self.monitor.start_monitoring())
            
            # Start conversation interceptor service
            interceptor_service_task = asyncio.create_task(conversation_interceptor.start_monitoring())
            
            logger.info("🚀 Passive agent is now actively monitoring conversations...")
            logger.info("💡 Say something like 'I want to publish form abc123' in any Ollama conversation")
            logger.info("🔧 Proxy server available at http://localhost:11435 (configure clients to use this)")
            
            # Wait for tasks to complete or for shutdown signal
            try:
                await asyncio.gather(
                    interception_task, 
                    monitor_task, 
                    interceptor_service_task,
                    return_exceptions=True
                )
            except asyncio.CancelledError:
                logger.info("📴 Monitoring tasks cancelled")
            
        except KeyboardInterrupt:
            logger.info("⌨️ Received keyboard interrupt")
        except Exception as e:
            logger.error(f"💥 Error in passive monitoring: {e}")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources"""
        self.running = False
        logger.info("🧹 Cleaning up resources...")
        
        if self.monitor:
            await self.monitor.stop_monitoring()
        
        await conversation_interceptor.stop_monitoring()
        await mongodb_service.disconnect()
        
        logger.info("✅ Cleanup complete")
    
    async def simulate_conversation(self, prompt: str):
        """Simulate a conversation for testing and continue monitoring"""
        logger.info(f"🧪 Simulating conversation: {prompt}")
        
        # Generate a mock response
        mock_response = "I'll help you with that request."
        
        # Process through the callback
        await self._conversation_callback(prompt, mock_response)
        
        logger.info("🧪 Simulation completed, continuing to monitor for more conversations...")
    
    async def test_form_publishing(self, form_id: str):
        """Test form publishing directly and continue monitoring"""
        logger.info(f"🧪 Testing direct form publishing for: {form_id}")
        
        try:
            # Simulate a publishing conversation
            test_prompt = f"Please publish form {form_id} to the blockchain"
            await self.simulate_conversation(test_prompt)
            
            logger.info("🧪 Test completed, continuing to monitor for more conversations...")
            
        except Exception as e:
            logger.error(f"Error in test: {e}")
            logger.info("🧪 Test failed, but continuing to monitor for conversations...")
    
    async def start_continuous_monitoring(self):
        """Start continuous monitoring that never stops unless interrupted"""
        self.running = True
        restart_count = 0
        max_restarts = 10
        
        while self.running and restart_count < max_restarts:
            try:
                logger.info(f"🎧 Starting Continuous Form Publishing Agent... (attempt {restart_count + 1})")
                logger.info("📋 Monitoring for keywords: " + ", ".join(config.LISTEN_KEYWORDS))
                logger.info("🔄 Agent will run continuously until manually stopped (Ctrl+C)")
                
                # Initialize services
                await self.initialize_services()
                
                # Start the real-time interceptor
                self.interceptor = get_ollama_interceptor(self._conversation_callback)
                
                # Connect the response injector for custom response handling
                self.interceptor.set_response_injector(conversation_interceptor)
                logger.info("🔄 Connected response injector for successful publication handling")
                
                logger.info("🎯 Starting real-time Ollama conversation interception...")
                
                # Start all monitoring tasks
                tasks = []
                
                # Real-time interceptor
                interception_task = asyncio.create_task(self.interceptor.start_interception())
                tasks.append(interception_task)
                
                # Legacy monitor for backup
                self.monitor = OllamaConversationMonitor(self._conversation_callback)
                monitor_task = asyncio.create_task(self.monitor.start_monitoring())
                tasks.append(monitor_task)
                
                # Conversation interceptor service
                interceptor_service_task = asyncio.create_task(conversation_interceptor.start_monitoring())
                tasks.append(interceptor_service_task)
                
                logger.info("🚀 Passive agent is now actively monitoring conversations...")
                logger.info("💡 Say something like 'I want to publish form abc123' in any Ollama conversation")
                logger.info("🔧 Proxy server available at http://localhost:11435 (configure clients to use this)")
                logger.info("🔄 Monitoring continuously - use Ctrl+C to stop")
                
                # Run all tasks concurrently - this will run indefinitely
                await asyncio.gather(*tasks, return_exceptions=True)
                
                # If we reach here, tasks completed unexpectedly
                logger.warning("⚠️ Monitoring tasks completed unexpectedly, will restart...")
                restart_count += 1
                
            except KeyboardInterrupt:
                logger.info("⌨️ Received keyboard interrupt")
                break
            except Exception as e:
                restart_count += 1
                logger.error(f"💥 Error in continuous monitoring (attempt {restart_count}): {e}")
                logger.exception("Full error details:")
                
                if restart_count < max_restarts:
                    logger.info(f"🔄 Attempting to restart monitoring in 5 seconds... ({restart_count}/{max_restarts})")
                    await asyncio.sleep(5)  # Wait before restart
                    await self.cleanup()  # Clean up before restart
                else:
                    logger.error(f"❌ Maximum restart attempts ({max_restarts}) reached. Stopping agent.")
                    break
            finally:
                if self.interceptor:
                    await self.interceptor.stop_interception()
        
        if restart_count >= max_restarts:
            logger.error("❌ Agent stopped due to too many restart attempts")
        else:
            logger.info("✅ Agent stopped gracefully")
        
        await self.cleanup()

# Global shutdown flag
shutdown_event = asyncio.Event()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"📡 Received signal {signum}, initiating shutdown...")
    shutdown_event.set()

async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Passive Form Publishing AI Agent")
    parser.add_argument("--test-form", help="Test publishing a specific form ID")
    parser.add_argument("--simulate", help="Simulate a conversation with the given text")
    
    args = parser.parse_args()
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create the passive agent
    agent = PassiveFormPublishingAgent()
    
    try:
        if args.test_form:
            # Test mode - publish a specific form
            logger.info(f"🧪 Test mode: Publishing form {args.test_form}")
            await agent.initialize_services()
            await agent.test_form_publishing(args.test_form)
            
        elif args.simulate:
            # Simulation mode
            logger.info(f"🧪 Simulation mode: {args.simulate}")
            await agent.initialize_services()
            await agent.simulate_conversation(args.simulate)
            
        else:
            # Normal passive monitoring mode
            logger.info("🎧 Starting in passive monitoring mode...")
            logger.info("💡 The agent will automatically detect form publishing requests in Ollama conversations")
            logger.info("🔍 Monitoring keywords: " + ", ".join(config.LISTEN_KEYWORDS))
            
            # Run until shutdown signal
            monitoring_task = asyncio.create_task(agent.start_passive_monitoring())
            wait_shutdown_task = asyncio.create_task(shutdown_event.wait())
            
            done, pending = await asyncio.wait(
                [monitoring_task, wait_shutdown_task],
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel pending tasks
            for task in pending:
                task.cancel()
            
            logger.info("🛑 Shutting down passive agent...")
    
    except Exception as e:
        logger.error(f"💥 Application error: {e}")
        sys.exit(1)
    
    finally:
        if 'agent' in locals():
            await agent.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Goodbye!")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

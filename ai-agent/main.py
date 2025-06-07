import asyncio
import logging
import signal
import sys
from contextlib import asynccontextmanager

# Local imports
from config import config
from mongodb_service import mongodb_service
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service
from conversation_interceptor import conversation_interceptor
from ollama_monitor import OllamaConversationMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ai_agent.log')
    ]
)
logger = logging.getLogger(__name__)

# Pydantic models
class MessageRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    response: str
    success: bool

class HealthResponse(BaseModel):
    status: str
    services: dict

# Global shutdown flag
shutdown_event = asyncio.Event()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    logger.info("Starting AI Agent application...")
    
    # Initialize services
    try:
        # Connect to MongoDB
        mongo_connected = await mongodb_service.connect()
        if not mongo_connected:
            logger.warning("MongoDB connection failed, some features may not work")
        
        # Check Ollama status
        ollama_available = await ollama_service.check_ollama_status()
        if not ollama_available:
            logger.warning("Ollama is not available, AI features may be limited")
        
        # Check verifiable contract API
        api_status = await verifiable_contract_service.get_api_status()
        if not api_status.get("success"):
            logger.warning("Verifiable contract API is not available")
        
        logger.info("AI Agent initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Agent...")
    await mongodb_service.disconnect()
    logger.info("AI Agent shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Form Publishing AI Agent",
    description="AI Agent for publishing forms to blockchain using LangGraph and Ollama",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB
        mongo_status = "connected" if mongodb_service.client else "disconnected"
        
        # Check Ollama
        ollama_status = "available" if await ollama_service.check_ollama_status() else "unavailable"
        
        # Check verifiable contract API
        api_check = await verifiable_contract_service.get_api_status()
        contract_api_status = "available" if api_check.get("success") else "unavailable"
        
        return HealthResponse(
            status="healthy",
            services={
                "mongodb": mongo_status,
                "ollama": ollama_status,
                "contract_api": contract_api_status
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.post("/chat", response_model=MessageResponse)
async def chat_endpoint(request: MessageRequest):
    """Main chat endpoint for processing user messages"""
    try:
        logger.info(f"Received message: {request.message}")
        
        # Process message through AI agent
        response = await form_publishing_agent.process_message(request.message)
        
        logger.info(f"Generated response: {response}")
        
        return MessageResponse(
            response=response,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        return MessageResponse(
            response=f"❌ Sorry, I encountered an error: {str(e)}",
            success=False
        )

@app.get("/forms/{form_id}")
async def get_form_info(form_id: str):
    """Get information about a specific form"""
    try:
        form_data = await mongodb_service.get_form_by_id(form_id)
        if not form_data:
            raise HTTPException(status_code=404, detail="Form not found")
        
        fingerprint = await mongodb_service.get_form_fingerprint(form_id)
        
        return {
            "form_id": form_id,
            "form_data": form_data,
            "json_fingerprint": fingerprint,
            "public_url": f"{config.FRONTEND_BASE_URL}/public/form/{form_id}/{fingerprint}" if fingerprint else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting form info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/forms")
async def list_forms():
    """List all available forms"""
    try:
        forms = await mongodb_service.get_all_forms()
        return {
            "forms": forms,
            "count": len(forms)
        }
    except Exception as e:
        logger.error(f"Error listing forms: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/publish/{form_id}")
async def publish_form_endpoint(form_id: str):
    """Direct endpoint to publish a specific form"""
    try:
        # Create a message to process through the agent
        message = f"publish form {form_id}"
        response = await form_publishing_agent.process_message(message)
        
        return {
            "form_id": form_id,
            "message": response,
            "success": "successfully published" in response.lower()
        }
        
    except Exception as e:
        logger.error(f"Error publishing form {form_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Form Publishing AI Agent is running!",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat",
            "health": "/health",
            "forms": "/forms",
            "publish": "/publish/{form_id}"
        }
    }

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, initiating shutdown...")
    shutdown_event.set()

async def run_interactive_chat():
    """Run interactive chat mode"""
    logger.info("Starting interactive chat mode...")
    logger.info("Type 'quit', 'exit', or 'bye' to stop the agent")
    logger.info("Example commands:")
    logger.info("  - 'publish form abc123'")
    logger.info("  - 'register form xyz789'")
    logger.info("  - 'deploy form with id 12345'")
    
    while not shutdown_event.is_set():
        try:
            user_input = input("\n🤖 You: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'bye', 'stop']:
                logger.info("Goodbye!")
                break
            
            if not user_input:
                continue
            
            logger.info("Processing your request...")
            response = await form_publishing_agent.process_message(user_input)
            print(f"🤖 Agent: {response}")
            
        except KeyboardInterrupt:
            logger.info("\nReceived keyboard interrupt, shutting down...")
            break
        except Exception as e:
            logger.error(f"Error in interactive chat: {e}")
            print(f"🤖 Agent: ❌ An error occurred: {str(e)}")

async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Form Publishing AI Agent")
    parser.add_argument("--mode", choices=["server", "chat"], default="server",
                       help="Run mode: server (FastAPI) or chat (interactive)")
    parser.add_argument("--host", default=config.HOST, help="Host to bind to")
    parser.add_argument("--port", type=int, default=config.PORT, help="Port to bind to")
    
    args = parser.parse_args()
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        if args.mode == "chat":
            # Initialize services manually for chat mode
            await mongodb_service.connect()
            await ollama_service.check_ollama_status()
            await run_interactive_chat()
        else:
            # Run FastAPI server
            import uvicorn
            await uvicorn.run(
                "main:app",
                host=args.host,
                port=args.port,
                reload=False,
                log_level="info"
            )
    
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)
    
    finally:
        await mongodb_service.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

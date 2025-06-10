import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

# LangGraph imports
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict

# Local imports
from config import config
from mongodb_service import mongodb_service
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AgentState(Enum):
    LISTENING = "listening"
    ANALYZING = "analyzing"
    FETCHING_FORM = "fetching_form"
    PUBLISHING = "publishing"
    RESPONDING = "responding"
    ERROR = "error"

@dataclass
class AgentStateData(TypedDict):
    messages: Annotated[list, add_messages]
    user_input: str
    analysis_result: Optional[Dict[str, Any]]
    form_id: Optional[str]
    form_data: Optional[Dict[str, Any]]
    json_fingerprint: Optional[str]
    publish_result: Optional[Dict[str, Any]]
    response_message: str
    current_state: str
    error: Optional[str]

class FormPublishingAgent:
    def __init__(self):
        self.workflow = None
        self.app = None
        self._build_workflow()
        
    def _build_workflow(self):
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentStateData)
        
        # Add nodes
        workflow.add_node("analyze_input", self.analyze_input)
        workflow.add_node("fetch_form_data", self.fetch_form_data)
        workflow.add_node("publish_to_blockchain", self.publish_to_blockchain)
        workflow.add_node("generate_response", self.generate_response)
        workflow.add_node("handle_error", self.handle_error)
        
        # Set entry point
        workflow.set_entry_point("analyze_input")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "analyze_input",
            self._should_publish,
            {
                "publish": "fetch_form_data",
                "no_publish": "generate_response",
                "error": "handle_error"
            }
        )
        
        workflow.add_conditional_edges(
            "fetch_form_data",
            self._form_fetch_result,
            {
                "success": "publish_to_blockchain",
                "error": "handle_error"
            }
        )
        
        workflow.add_conditional_edges(
            "publish_to_blockchain",
            self._publish_result,
            {
                "success": "generate_response",
                "error": "handle_error"
            }
        )
        
        # Add edges to END
        workflow.add_edge("generate_response", END)
        workflow.add_edge("handle_error", END)
        
        self.app = workflow.compile()
    
    async def analyze_input(self, state: AgentStateData) -> AgentStateData:
        """Analyze user input for publishing intent"""
        logger.info(f"Analyzing input: {state['user_input']}")
        
        try:
            state["current_state"] = AgentState.ANALYZING.value
            
            # Use Ollama to analyze the intent
            analysis = await ollama_service.analyze_publish_intent(state["user_input"])
            state["analysis_result"] = analysis
            
            if analysis.get("form_id"):
                state["form_id"] = analysis["form_id"]
            
            logger.info(f"Analysis complete: {analysis}")
            return state
            
        except Exception as e:
            logger.error(f"Error in analyze_input: {e}")
            state["error"] = str(e)
            state["current_state"] = AgentState.ERROR.value
            return state
    
    async def fetch_form_data(self, state: AgentStateData) -> AgentStateData:
        """Fetch form data from MongoDB"""
        logger.info(f"Fetching form data for ID: {state['form_id']}")
        
        try:
            state["current_state"] = AgentState.FETCHING_FORM.value
            
            # Connect to MongoDB if not already connected
            if not mongodb_service.client:
                await mongodb_service.connect()
            
            # Fetch form data
            form_data = await mongodb_service.get_form_by_id(state["form_id"])
            if not form_data:
                state["error"] = f"Form with ID {state['form_id']} not found in database"
                state["current_state"] = AgentState.ERROR.value
                return state
            
            state["form_data"] = form_data
            
            # Extract JSON fingerprint
            fingerprint = await mongodb_service.get_form_fingerprint(state["form_id"])
            if not fingerprint:
                state["error"] = f"JSON fingerprint not found for form {state['form_id']}"
                state["current_state"] = AgentState.ERROR.value
                return state
            
            state["json_fingerprint"] = fingerprint
            logger.info(f"Form data fetched successfully. Fingerprint: {fingerprint}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in fetch_form_data: {e}")
            state["error"] = str(e)
            state["current_state"] = AgentState.ERROR.value
            return state
    
    async def publish_to_blockchain(self, state: AgentStateData) -> AgentStateData:
        """Publish form to blockchain via verifiable contract"""
        logger.info(f"Publishing form {state['form_id']} to blockchain")
        
        try:
            state["current_state"] = AgentState.PUBLISHING.value
            
            # Check for group mentions in the user prompt
            user_prompt = state.get("user_input", "")
            group_mentions = await mongodb_service.detect_group_mentions(user_prompt)
            
            # Get user ID from form data for notifications
            form_data = state.get("form_data", {})
            user_id = None
            if form_data and form_data.get("metadata", {}).get("createdBy"):
                created_by = form_data["metadata"]["createdBy"]
                if isinstance(created_by, str):
                    user_id = created_by
                elif isinstance(created_by, dict):
                    user_id = created_by.get("userId")
            
            # Register URL with the verifiable contract
            result = await verifiable_contract_service.register_url(
                state["form_id"],
                state["json_fingerprint"]
            )
            
            state["publish_result"] = result
            
            if result.get("success"):
                logger.info(f"Successfully published form to blockchain. TX: {result.get('transaction_hash')}")
                
                # Create notifications for group mentions if any
                if group_mentions and user_id:
                    logger.info(f"Processing group mentions for form {state['form_id']}: {group_mentions}")
                    notification_ids = await mongodb_service.create_notification_records(
                        state["form_id"],
                        group_mentions,
                        user_id,
                        user_prompt
                    )
                    
                    if notification_ids:
                        # Add notification info to publish result
                        result["notifications"] = {
                            "created": len(notification_ids),
                            "groups_mentioned": group_mentions,
                            "notification_ids": notification_ids
                        }
                        
                        # Get notification summary
                        notification_summary = await mongodb_service.get_notification_summary(state["form_id"])
                        result["notification_summary"] = notification_summary
                        
                        logger.info(f"Created {len(notification_ids)} notification records for groups: {group_mentions}")
                    else:
                        logger.warning(f"No notifications were created for mentioned groups: {group_mentions}")
                elif group_mentions and not user_id:
                    logger.warning(f"Group mentions detected but no user ID found in form data: {group_mentions}")
                
                state["publish_result"] = result
            else:
                logger.error(f"Failed to publish form: {result.get('error')}")
                state["error"] = result.get("error")
                state["current_state"] = AgentState.ERROR.value
            
            return state
            
        except Exception as e:
            logger.error(f"Error in publish_to_blockchain: {e}")
            state["error"] = str(e)
            state["current_state"] = AgentState.ERROR.value
            return state
    
    async def generate_response(self, state: AgentStateData) -> AgentStateData:
        """Generate response message for the user"""
        logger.info("Generating response message")
        
        try:
            state["current_state"] = AgentState.RESPONDING.value
            
            analysis = state.get("analysis_result", {})
            
            if not analysis.get("wants_to_publish"):
                # Not a publish request
                response = await ollama_service.generate_response(
                    f"The user said: '{state['user_input']}'. This doesn't appear to be a request to publish a form. Respond helpfully and ask if they need help with form publishing.",
                    "You are a helpful AI assistant for form publishing. Be friendly and offer guidance."
                )
                state["response_message"] = response or "I'm here to help you publish forms to the blockchain. Just say 'publish form [form_id]' when you're ready!"
            
            elif state.get("publish_result", {}).get("success"):
                # Successful publish - use custom success message template
                result = state["publish_result"]
                form_id = state["form_id"]
                json_fingerprint = state["json_fingerprint"]
                tx_hash = result.get("transaction_hash", "")
                
                # Construct the public URL using form ID and JSON fingerprint
                public_url = f"{config.FRONTEND_BASE_URL}/public/form/{form_id}/{json_fingerprint}"
                
                # Detect the type of operation from user input for message variation
                user_input = state.get("user_input", "").lower()
                operation_verb = "published"
                if "deploy" in user_input:
                    operation_verb = "deployed"
                elif "register" in user_input:
                    operation_verb = "registered"
                elif "send" in user_input:
                    operation_verb = "sent"
                
                # Custom success message template with operation-specific wording
                state["response_message"] = f"""✅ Form {form_id} has been successfully {operation_verb} to the blockchain!

🔗 Your form is now available at the public URL and verified on the blockchain.

📋 Form ID: {form_id}
🎯 Status: Published  
⛓️ Blockchain: Verified
🌐 Public URL: {public_url}
🔖 Transaction Hash: {tx_hash}

🎉 Your form is now immutably stored and publicly accessible!"""
            
            else:
                # Failed or error case handled in handle_error
                pass
            
            return state
            
        except Exception as e:
            logger.error(f"Error in generate_response: {e}")
            state["error"] = str(e)
            state["current_state"] = AgentState.ERROR.value
            return state
    
    async def handle_error(self, state: AgentStateData) -> AgentStateData:
        """Handle errors and generate error response"""
        logger.info(f"Handling error: {state.get('error')}")
        
        try:
            state["current_state"] = AgentState.ERROR.value
            
            error_msg = state.get("error", "Unknown error occurred")
            form_id = state.get("form_id", "unknown")
            
            response = await ollama_service.generate_response_message(
                success=False,
                form_id=form_id,
                url=None,
                error=error_msg
            )
            
            state["response_message"] = response
            
            return state
            
        except Exception as e:
            logger.error(f"Error in handle_error: {e}")
            state["response_message"] = f"❌ An error occurred: {error_msg}"
            return state
    
    def _should_publish(self, state: AgentStateData) -> str:
        """Determine if we should proceed with publishing"""
        if state.get("error"):
            return "error"
        
        analysis = state.get("analysis_result", {})
        if analysis.get("wants_to_publish") and analysis.get("form_id"):
            return "publish"
        elif analysis.get("wants_to_publish") and not analysis.get("form_id"):
            state["error"] = "Form ID is required for publishing"
            return "error"
        else:
            return "no_publish"
    
    def _form_fetch_result(self, state: AgentStateData) -> str:
        """Check form fetch result"""
        if state.get("error"):
            return "error"
        elif state.get("form_data") and state.get("json_fingerprint"):
            return "success"
        else:
            return "error"
    
    def _publish_result(self, state: AgentStateData) -> str:
        """Check publish result"""
        if state.get("error"):
            return "error"
        elif state.get("publish_result", {}).get("success"):
            return "success"
        else:
            return "error"
    
    async def process_message(self, user_input: str) -> str:
        """Process a user message and return response"""
        logger.info(f"Processing message: {user_input}")
        
        # Initialize state
        initial_state = AgentStateData(
            messages=[],
            user_input=user_input,
            analysis_result=None,
            form_id=None,
            form_data=None,
            json_fingerprint=None,
            publish_result=None,
            response_message="",
            current_state=AgentState.LISTENING.value,
            error=None
        )
        
        try:
            # Run the workflow
            result = await self.app.ainvoke(initial_state)
            return result.get("response_message", "I couldn't process your request. Please try again.")
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return f"❌ An error occurred while processing your request: {str(e)}"

# Global instance
form_publishing_agent = FormPublishingAgent()

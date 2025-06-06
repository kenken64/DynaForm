import asyncio
import aiohttp
import json
import logging
from typing import Optional, Dict, Any, List
from config import config

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        self.host = config.OLLAMA_HOST
        self.model = config.OLLAMA_MODEL
        self.keywords = config.LISTEN_KEYWORDS
        
    async def check_ollama_status(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.host}/api/tags") as response:
                    if response.status == 200:
                        models = await response.json()
                        logger.info(f"Ollama is running. Available models: {len(models.get('models', []))}")
                        return True
                    else:
                        logger.error(f"Ollama returned status {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return False
    
    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Generate a response using Ollama"""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.host}/api/generate",
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', '').strip()
                    else:
                        error_text = await response.text()
                        logger.error(f"Ollama generation failed: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Error generating response with Ollama: {e}")
            return None
    
    def contains_publish_keyword(self, text: str) -> bool:
        """Check if text contains any of the publish keywords"""
        text_lower = text.lower()
        for keyword in self.keywords:
            if keyword.lower() in text_lower:
                logger.info(f"Found keyword '{keyword}' in text")
                return True
        return False
    
    def extract_form_id_from_text(self, text: str) -> Optional[str]:
        """Extract form ID from natural language text using patterns"""
        text_lower = text.lower()
        
        # Common patterns for form ID mentions
        patterns = [
            "form id", "form_id", "formid", "id", "form number", 
            "form #", "form", "document id", "doc id"
        ]
        
        words = text.split()
        for i, word in enumerate(words):
            word_lower = word.lower()
            for pattern in patterns:
                if pattern in word_lower and i + 1 < len(words):
                    # Next word might be the form ID
                    potential_id = words[i + 1].strip('.,!?:;')
                    if len(potential_id) > 5:  # Reasonable form ID length
                        logger.info(f"Extracted potential form ID: {potential_id}")
                        return potential_id
        
        # Look for UUID-like patterns (common in MongoDB ObjectIds)
        import re
        uuid_pattern = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
        objectid_pattern = r'[0-9a-fA-F]{24}'
        
        uuid_match = re.search(uuid_pattern, text)
        if uuid_match:
            logger.info(f"Found UUID pattern: {uuid_match.group()}")
            return uuid_match.group()
        
        objectid_match = re.search(objectid_pattern, text)
        if objectid_match:
            logger.info(f"Found ObjectId pattern: {objectid_match.group()}")
            return objectid_match.group()
        
        return None
    
    async def analyze_publish_intent(self, text: str) -> Dict[str, Any]:
        """Analyze text to understand publishing intent and extract relevant information"""
        system_prompt = """You are a JSON-only response AI. You MUST respond with valid JSON only, no other text.

Analyze user requests for publishing forms to blockchain and respond with this exact JSON structure:

{
  "wants_to_publish": boolean,
  "form_id": "string or null",
  "confidence": 0.8,
  "extracted_info": "brief description"
}

Keywords indicating publishing: publish, deploy, register, submit, upload, share, make public

Example inputs and responses:
- "publish form abc123" → {"wants_to_publish": true, "form_id": "abc123", "confidence": 0.9, "extracted_info": "User wants to publish form abc123"}
- "hello" → {"wants_to_publish": false, "form_id": null, "confidence": 0.1, "extracted_info": "General greeting, no publish intent"}

RESPOND ONLY WITH VALID JSON."""
        
        try:
            response = await self.generate_response(
                f"Analyze: '{text}'",
                system_prompt
            )
            
            if response:
                try:
                    # Clean the response - remove any non-JSON content
                    response = response.strip()
                    if response.startswith('```json'):
                        response = response.replace('```json', '').replace('```', '').strip()
                    
                    # Find JSON object in response
                    start_idx = response.find('{')
                    end_idx = response.rfind('}') + 1
                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = response[start_idx:end_idx]
                        analysis = json.loads(json_str)
                        
                        # Fallback extraction if AI didn't find form ID
                        if not analysis.get('form_id'):
                            extracted_id = self.extract_form_id_from_text(text)
                            if extracted_id:
                                analysis['form_id'] = extracted_id
                        
                        logger.info(f"Intent analysis result: {analysis}")
                        return analysis
                    else:
                        raise json.JSONDecodeError("No JSON object found", response, 0)
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON response: {e}")
                    # Fallback to simple analysis
                    return {
                        "wants_to_publish": self.contains_publish_keyword(text),
                        "form_id": self.extract_form_id_from_text(text),
                        "confidence": 0.7 if self.contains_publish_keyword(text) else 0.3,
                        "extracted_info": "Fallback analysis - JSON parsing failed"
                    }
            else:
                # Fallback when Ollama fails
                return {
                    "wants_to_publish": self.contains_publish_keyword(text),
                    "form_id": self.extract_form_id_from_text(text),
                    "confidence": 0.5,
                    "extracted_info": "Fallback analysis - Ollama unavailable"
                }
        
        except Exception as e:
            logger.error(f"Error in intent analysis: {e}")
            return {
                "wants_to_publish": False,
                "form_id": None,
                "confidence": 0.0,
                "extracted_info": f"Error: {str(e)}"
            }
    
    async def generate_response_message(self, success: bool, form_id: str, url: str = None, error: str = None) -> str:
        """Generate a user-friendly response message"""
        if success:
            prompt = f"Generate a friendly confirmation message that form {form_id} has been successfully published to the blockchain at URL {url}. Keep it concise and positive."
        else:
            prompt = f"Generate a helpful error message explaining that form {form_id} could not be published. Error: {error}. Suggest possible solutions."
        
        system_prompt = "You are a helpful AI assistant. Generate clear, concise, and user-friendly messages. Be encouraging and professional."
        
        response = await self.generate_response(prompt, system_prompt)
        
        if not response:
            # Fallback messages
            if success:
                return f"✅ Form {form_id} has been successfully published to the blockchain! URL: {url}"
            else:
                return f"❌ Failed to publish form {form_id}. Error: {error}"
        
        return response

# Global instance
ollama_service = OllamaService()

# filepath: /Users/kennethphang/Projects/doc2formjson/ai-agent/verifiable_contract_service.py
import aiohttp
import logging
from typing import Optional, Dict, Any
from config import config

logger = logging.getLogger(__name__)

class VerifiableContractService:
    def __init__(self):
        self.api_url = config.VERIFIABLE_CONTRACT_API
        self.frontend_base_url = config.FRONTEND_BASE_URL
    
    def _build_form_url(self, form_id: str, json_fingerprint: str) -> str:
        """Build the form URL in the required format"""
        return f"{self.frontend_base_url}/public/form/{form_id}/{json_fingerprint}"
    
    async def register_url(self, form_id: str, json_fingerprint: str) -> Dict[str, Any]:
        """Register a form URL with the verifiable contract"""
        try:
            form_url = self._build_form_url(form_id, json_fingerprint)
            
            payload = {
                "url": form_url,
                "metadata": {
                    "form_id": form_id,
                    "json_fingerprint": json_fingerprint,
                    "timestamp": None  # Will be set by the contract
                }
            }
            
            logger.info(f"Registering URL: {form_url}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Successfully registered URL. Transaction hash: {result.get('transactionHash')}")
                        return {
                            "success": True,
                            "url": form_url,
                            "transaction_hash": result.get('transactionHash'),
                            "block_number": result.get('blockNumber'),
                            "gas_used": result.get('gasUsed'),
                            "contract_response": result
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to register URL. Status: {response.status}, Error: {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}",
                            "url": form_url
                        }
        
        except aiohttp.ClientError as e:
            logger.error(f"Network error while registering URL: {e}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "url": form_url if 'form_url' in locals() else None
            }
        except Exception as e:
            logger.error(f"Unexpected error while registering URL: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "url": form_url if 'form_url' in locals() else None
            }
    
    async def verify_url(self, url: str) -> Dict[str, Any]:
        """Verify if a URL is registered on the blockchain"""
        try:
            verify_url = f"{self.api_url}/verify"
            params = {"url": url}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(verify_url, params=params) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"URL verification result: {result}")
                        return {
                            "success": True,
                            "verified": result.get('verified', False),
                            "url": url,
                            "verification_data": result
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to verify URL. Status: {response.status}, Error: {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}",
                            "url": url
                        }
        
        except aiohttp.ClientError as e:
            logger.error(f"Network error while verifying URL: {e}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "url": url
            }
        except Exception as e:
            logger.error(f"Unexpected error while verifying URL: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "url": url
            }
    
    async def get_api_status(self) -> Dict[str, Any]:
        """Check the status of the verifiable contract API"""
        try:
            status_url = f"{self.api_url.replace('/urls', '/status')}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(status_url) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info("API status check successful")
                        return {
                            "success": True,
                            "status": result
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"API status check failed. Status: {response.status}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}"
                        }
        
        except Exception as e:
            logger.error(f"Error checking API status: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Global instance
verifiable_contract_service = VerifiableContractService()
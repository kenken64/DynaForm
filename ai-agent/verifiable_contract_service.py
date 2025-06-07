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
            logger.debug(f"🔗 [VERIFIABLE API] Starting URL registration process")
            logger.debug(f"🔗 [VERIFIABLE API] Form ID: {form_id}")
            logger.debug(f"🔗 [VERIFIABLE API] JSON Fingerprint: {json_fingerprint}")
            logger.debug(f"🔗 [VERIFIABLE API] API URL: {self.api_url}")
            logger.debug(f"🔗 [VERIFIABLE API] Frontend Base URL: {self.frontend_base_url}")
            
            form_url = self._build_form_url(form_id, json_fingerprint)
            logger.info(f"🔗 [VERIFIABLE API] Built form URL: {form_url}")
            
            payload = {
                "url": form_url,
                "metadata": {
                    "form_id": form_id,
                    "json_fingerprint": json_fingerprint,
                    "timestamp": None  # Will be set by the contract
                }
            }
            
            logger.info(f"🔗 [VERIFIABLE API] Registering URL with payload:")
            logger.info(f"🔗 [VERIFIABLE API] Payload: {payload}")
            
            logger.debug(f"🔗 [VERIFIABLE API] Making POST request to: {self.api_url}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    logger.debug(f"🔗 [VERIFIABLE API] Response status: {response.status}")
                    logger.debug(f"🔗 [VERIFIABLE API] Response headers: {dict(response.headers)}")
                    
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"🔗 [VERIFIABLE API] ✅ Successfully registered URL!")
                        logger.info(f"🔗 [VERIFIABLE API] Full response: {result}")
                        logger.info(f"🔗 [VERIFIABLE API] Transaction hash: {result.get('transactionHash')}")
                        logger.info(f"🔗 [VERIFIABLE API] Block number: {result.get('blockNumber')}")
                        logger.info(f"🔗 [VERIFIABLE API] Gas used: {result.get('gasUsed')}")
                        
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
                        logger.error(f"🔗 [VERIFIABLE API] ❌ Failed to register URL!")
                        logger.error(f"🔗 [VERIFIABLE API] Status: {response.status}")
                        logger.error(f"🔗 [VERIFIABLE API] Error response: {error_text}")
                        logger.error(f"🔗 [VERIFIABLE API] Response headers: {dict(response.headers)}")
                        
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}",
                            "url": form_url
                        }
        
        except aiohttp.ClientError as e:
            logger.error(f"🔗 [VERIFIABLE API] ❌ Network error while registering URL: {e}")
            logger.exception("🔗 [VERIFIABLE API] Full network error details:")
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "url": form_url if 'form_url' in locals() else None
            }
        except Exception as e:
            logger.error(f"🔗 [VERIFIABLE API] ❌ Unexpected error while registering URL: {e}")
            logger.exception("🔗 [VERIFIABLE API] Full exception details:")
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
            logger.debug(f"🔗 [VERIFIABLE API] Checking API status at: {status_url}")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(status_url) as response:
                    logger.debug(f"🔗 [VERIFIABLE API] Status check response: {response.status}")
                    
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"🔗 [VERIFIABLE API] ✅ API status check successful: {result}")
                        logger.debug(f"🔗 [VERIFIABLE API] Full status response: {result}")
                        return {
                            "success": True,
                            "status": result
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"🔗 [VERIFIABLE API] ❌ API status check failed!")
                        logger.error(f"🔗 [VERIFIABLE API] Status: {response.status}")
                        logger.error(f"🔗 [VERIFIABLE API] Error response: {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}"
                        }
        
        except aiohttp.ClientError as e:
            logger.error(f"🔗 [VERIFIABLE API] ❌ Network error checking API status: {e}")
            logger.exception("🔗 [VERIFIABLE API] Full network error details:")
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"🔗 [VERIFIABLE API] ❌ Unexpected error checking API status: {e}")
            logger.exception("🔗 [VERIFIABLE API] Full exception details:")
            return {
                "success": False,
                "error": str(e)
            }

# Global instance
verifiable_contract_service = VerifiableContractService()
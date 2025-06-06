#!/usr/bin/env python3
"""
Real-time Ollama Interception Test
Tests the real-time conversation interception capabilities
"""

import asyncio
import aiohttp
import json
import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OllamaInterceptionTester:
    """Test the real-time Ollama interception system"""
    
    def __init__(self):
        self.ollama_host = "http://localhost:11434"
        self.proxy_host = "http://localhost:11435"
        self.test_results = []
    
    async def test_direct_ollama_connection(self):
        """Test direct connection to Ollama"""
        logger.info("🔍 Testing direct Ollama connection...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Test basic connectivity
                async with session.get(f"{self.ollama_host}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        models = [model['name'] for model in data.get('models', [])]
                        logger.info(f"✅ Ollama connected. Available models: {models}")
                        return True, models
                    else:
                        logger.error(f"❌ Ollama connection failed: {response.status}")
                        return False, []
        except Exception as e:
            logger.error(f"❌ Ollama connection error: {e}")
            return False, []
    
    async def test_proxy_server_connection(self):
        """Test connection to proxy server"""
        logger.info("🔍 Testing proxy server connection...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Test proxy connectivity
                async with session.get(f"{self.proxy_host}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("✅ Proxy server is forwarding requests correctly")
                        return True
                    else:
                        logger.error(f"❌ Proxy server error: {response.status}")
                        return False
        except Exception as e:
            logger.warning(f"⚠️ Proxy server not available: {e}")
            return False
    
    async def run_comprehensive_test(self):
        """Run all tests"""
        logger.info("🚀 Starting comprehensive Ollama interception test...")
        
        # Test 1: Direct Ollama connection
        ollama_connected, models = await self.test_direct_ollama_connection()
        
        # Test 2: Proxy server connection
        proxy_available = await self.test_proxy_server_connection()
        
        # Print results summary
        logger.info("📊 Test Results Summary:")
        logger.info("=" * 50)
        
        if ollama_connected:
            logger.info("✅ Direct Ollama connection: Working")
        else:
            logger.error("❌ Direct Ollama connection: Failed")
        
        if proxy_available:
            logger.info("✅ Proxy server: Available")
        else:
            logger.warning("⚠️ Proxy server: Not available (agent may not be running)")

async def main():
    """Main test function"""
    tester = OllamaInterceptionTester()
    
    try:
        await tester.run_comprehensive_test()
    except KeyboardInterrupt:
        logger.info("⌨️ Test interrupted by user")
    except Exception as e:
        logger.error(f"💥 Test error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
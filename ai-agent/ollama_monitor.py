import asyncio
import aiohttp
import json
import logging
import websockets
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import threading
import time
from config import config

logger = logging.getLogger(__name__)

class OllamaConversationMonitor:
    """
    Advanced monitor that hooks into Ollama's conversation streams
    """
    
    def __init__(self, interceptor_callback: Callable[[str, str], None]):
        self.ollama_host = config.OLLAMA_HOST
        self.interceptor_callback = interceptor_callback
        self.monitoring = False
        self.session = None
        
    async def _monitor_generate_endpoint(self):
        """Monitor Ollama's generate endpoint by intercepting requests"""
        logger.info("🔍 Monitoring Ollama generate endpoint...")
        
        # This is a middleware approach - we intercept calls to Ollama
        while self.monitoring:
            try:
                await asyncio.sleep(1)  # Check frequently
                
                # In a real implementation, you would:
                # 1. Set up a proxy server between clients and Ollama
                # 2. Hook into Ollama's logs
                # 3. Use Ollama's streaming API if available
                # 4. Monitor file system changes in Ollama's conversation logs
                
            except Exception as e:
                logger.error(f"Error monitoring generate endpoint: {e}")
                await asyncio.sleep(5)
    
    async def _setup_proxy_server(self):
        """Set up a proxy server to intercept Ollama API calls"""
        from aiohttp import web
        
        async def proxy_generate(request):
            """Proxy handler for /api/generate endpoint"""
            try:
                # Get the original request data
                data = await request.json()
                prompt = data.get('prompt', '')
                
                # Forward the request to actual Ollama
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.ollama_host}/api/generate",
                        json=data,
                        headers={'Content-Type': 'application/json'}
                    ) as response:
                        result = await response.json()
                        
                        # Extract response
                        ai_response = result.get('response', '')
                        
                        # Trigger intercept callback
                        if prompt and ai_response:
                            try:
                                await self.interceptor_callback(prompt, ai_response)
                            except Exception as e:
                                logger.error(f"Error in intercept callback: {e}")
                        
                        # Return the original response
                        return web.json_response(result)
                        
            except Exception as e:
                logger.error(f"Error in proxy handler: {e}")
                return web.json_response({'error': str(e)}, status=500)
        
        # Set up the proxy server
        app = web.Application()
        app.router.add_post('/api/generate', proxy_generate)
        
        # Run on a different port (e.g., 11435) and redirect clients to use this proxy
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 11435)
        await site.start()
        
        logger.info("🔧 Proxy server started on port 11435")
        logger.info("📝 Configure clients to use http://localhost:11435 instead of 11434")
        
    async def _monitor_ollama_logs(self):
        """Monitor Ollama's log files for conversations"""
        import os
        import time
        from pathlib import Path
        
        # Common Ollama log locations
        possible_log_paths = [
            os.path.expanduser("~/.ollama/logs"),
            "/var/log/ollama",
            "/usr/local/var/log/ollama",
            "/tmp/ollama.log"
        ]
        
        log_file = None
        for path in possible_log_paths:
            if os.path.exists(path):
                if os.path.isdir(path):
                    # Look for log files in directory
                    for file in os.listdir(path):
                        if file.endswith('.log'):
                            log_file = os.path.join(path, file)
                            break
                else:
                    log_file = path
                break
        
        if not log_file:
            logger.warning("📄 Could not find Ollama log files")
            return
        
        logger.info(f"📄 Monitoring Ollama logs: {log_file}")
        
        try:
            with open(log_file, 'r') as f:
                # Go to end of file
                f.seek(0, 2)
                
                while self.monitoring:
                    line = f.readline()
                    if line:
                        await self._parse_log_line(line)
                    else:
                        await asyncio.sleep(0.1)
                        
        except Exception as e:
            logger.error(f"Error monitoring logs: {e}")
    
    async def _parse_log_line(self, line: str):
        """Parse a log line for conversation data"""
        try:
            # This would depend on Ollama's actual log format
            # Example parsing for hypothetical log format
            if '"prompt":' in line and '"response":' in line:
                # Try to extract JSON data from log line
                start_idx = line.find('{')
                if start_idx != -1:
                    json_part = line[start_idx:]
                    try:
                        data = json.loads(json_part)
                        prompt = data.get('prompt', '')
                        response = data.get('response', '')
                        
                        if prompt and response:
                            await self.interceptor_callback(prompt, response)
                            
                    except json.JSONDecodeError:
                        pass  # Not valid JSON, skip
                        
        except Exception as e:
            logger.error(f"Error parsing log line: {e}")
    
    async def _poll_ollama_status(self):
        """Periodically poll Ollama for active conversations"""
        logger.info("🔄 Starting Ollama status polling...")
        
        while self.monitoring:
            try:
                # Check if there are any active sessions or recent activity
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{self.ollama_host}/api/ps") as response:
                        if response.status == 200:
                            data = await response.json()
                            models = data.get('models', [])
                            
                            # If models are loaded, there might be active conversations
                            if models:
                                logger.debug(f"Active models: {[m.get('name') for m in models]}")
                
                await asyncio.sleep(10)  # Poll every 10 seconds
                
            except Exception as e:
                logger.error(f"Error polling Ollama status: {e}")
                await asyncio.sleep(30)  # Wait longer on error
    
    async def start_monitoring(self):
        """Start all monitoring methods"""
        self.monitoring = True
        logger.info("🎧 Starting comprehensive Ollama monitoring...")
        
        # Start multiple monitoring approaches
        tasks = [
            asyncio.create_task(self._monitor_generate_endpoint()),
            asyncio.create_task(self._poll_ollama_status()),
            asyncio.create_task(self._monitor_ollama_logs()),
        ]
        
        # Optionally start proxy server (commented out by default)
        # tasks.append(asyncio.create_task(self._setup_proxy_server()))
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Monitoring tasks failed: {e}")
    
    async def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring = False
        logger.info("🛑 Stopping Ollama monitoring...")
    
    async def inject_test_conversation(self, prompt: str, response: str = None):
        """Inject a test conversation for testing"""
        if response is None:
            response = "I understand you want to publish a form. Let me help you with that."
        
        logger.info("🧪 Injecting test conversation...")
        await self.interceptor_callback(prompt, response)

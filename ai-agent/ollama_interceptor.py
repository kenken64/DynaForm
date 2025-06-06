#!/usr/bin/env python3
"""
Real-time Ollama Conversation Interceptor
Actively monitors and intercepts Ollama API calls using multiple methods
"""

import asyncio
import aiohttp
import json
import logging
import threading
import time
import os
import re
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime
from pathlib import Path
from aiohttp import web
import websockets
from config import config

logger = logging.getLogger(__name__)

class OllamaRealTimeInterceptor:
    """
    Real-time interceptor that actively hooks into Ollama conversations
    Uses multiple methods to ensure reliable conversation capture
    """
    
    def __init__(self, conversation_callback: Callable[[str, str], None]):
        self.ollama_host = config.OLLAMA_HOST
        self.ollama_port = 11434
        self.proxy_port = 11435
        self.conversation_callback = conversation_callback
        self.intercepting = False
        self.proxy_app = None
        self.log_monitor_thread = None
        self.recent_conversations = []
        
    async def start_interception(self):
        """Start all interception methods"""
        self.intercepting = True
        logger.info("🎧 Starting real-time Ollama conversation interception...")
        
        # Start multiple interception methods concurrently
        tasks = [
            asyncio.create_task(self._start_proxy_server()),
            asyncio.create_task(self._monitor_network_traffic()),
            asyncio.create_task(self._monitor_ollama_processes()),
        ]
        
        # Start log monitoring in a separate thread
        self._start_log_monitoring()
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Interception tasks failed: {e}")
    
    async def _start_proxy_server(self):
        """Start transparent proxy server to intercept API calls"""
        logger.info("🔧 Starting Ollama proxy server...")
        
        async def proxy_handler(request):
            """Handle all Ollama API requests"""
            try:
                # Get the original path and method
                path = request.path
                method = request.method
                
                # Forward to actual Ollama
                url = f"{self.ollama_host}{path}"
                
                # Get request data
                if method in ['POST', 'PUT']:
                    data = await request.read()
                    headers = dict(request.headers)
                    headers.pop('host', None)  # Remove host header
                    
                    # Intercept generate requests
                    if path == '/api/generate' and data:
                        await self._intercept_generate_request(data)
                    elif path == '/api/chat' and data:
                        await self._intercept_chat_request(data)
                    
                    # Forward request
                    async with aiohttp.ClientSession() as session:
                        async with session.request(
                            method, url, data=data, headers=headers
                        ) as response:
                            result = await response.read()
                            
                            # Intercept response for streaming
                            if path in ['/api/generate', '/api/chat']:
                                await self._intercept_response(data, result)
                            
                            return web.Response(
                                body=result,
                                status=response.status,
                                headers=response.headers
                            )
                else:
                    # GET requests
                    async with aiohttp.ClientSession() as session:
                        async with session.request(method, url) as response:
                            result = await response.read()
                            return web.Response(
                                body=result,
                                status=response.status,
                                headers=response.headers
                            )
                            
            except Exception as e:
                logger.error(f"Proxy handler error: {e}")
                return web.json_response({'error': str(e)}, status=500)
        
        # Set up the proxy app
        self.proxy_app = web.Application()
        self.proxy_app.router.add_route('*', '/{path:.*}', proxy_handler)
        
        # Start the proxy server
        runner = web.AppRunner(self.proxy_app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.proxy_port)
        await site.start()
        
        logger.info(f"🚀 Proxy server running on port {self.proxy_port}")
        logger.info(f"💡 To intercept conversations, configure clients to use:")
        logger.info(f"   http://localhost:{self.proxy_port} instead of http://localhost:{self.ollama_port}")
        
        # Keep the proxy running
        while self.intercepting:
            await asyncio.sleep(1)
    
    async def _intercept_generate_request(self, data: bytes):
        """Intercept /api/generate requests"""
        try:
            json_data = json.loads(data.decode('utf-8'))
            prompt = json_data.get('prompt', '')
            model = json_data.get('model', '')
            
            if prompt:
                logger.debug(f"🔍 Intercepted generate request: {prompt[:100]}...")
                # Store for matching with response
                self.recent_conversations.append({
                    'timestamp': datetime.now(),
                    'prompt': prompt,
                    'model': model,
                    'type': 'generate'
                })
        except Exception as e:
            logger.error(f"Error intercepting generate request: {e}")
    
    async def _intercept_chat_request(self, data: bytes):
        """Intercept /api/chat requests"""
        try:
            json_data = json.loads(data.decode('utf-8'))
            messages = json_data.get('messages', [])
            model = json_data.get('model', '')
            
            if messages:
                # Get the last user message
                user_messages = [msg for msg in messages if msg.get('role') == 'user']
                if user_messages:
                    prompt = user_messages[-1].get('content', '')
                    logger.debug(f"🔍 Intercepted chat request: {prompt[:100]}...")
                    
                    self.recent_conversations.append({
                        'timestamp': datetime.now(),
                        'prompt': prompt,
                        'messages': messages,
                        'model': model,
                        'type': 'chat'
                    })
        except Exception as e:
            logger.error(f"Error intercepting chat request: {e}")
    
    async def _intercept_response(self, request_data: bytes, response_data: bytes):
        """Match responses with requests and trigger callback"""
        try:
            # Parse response
            response_text = response_data.decode('utf-8')
            
            # Handle streaming responses (one JSON per line)
            response_parts = []
            for line in response_text.strip().split('\n'):
                if line.strip():
                    try:
                        part = json.loads(line)
                        if 'response' in part:
                            response_parts.append(part['response'])
                    except json.JSONDecodeError:
                        continue
            
            if response_parts:
                full_response = ''.join(response_parts)
                
                # Match with recent conversation
                if self.recent_conversations:
                    recent = self.recent_conversations[-1]
                    prompt = recent.get('prompt', '')
                    
                    if prompt and full_response:
                        logger.info(f"✅ Matched conversation pair - triggering callback")
                        await self.conversation_callback(prompt, full_response)
                        
                        # Clean up old conversations
                        self.recent_conversations = self.recent_conversations[-5:]
            
        except Exception as e:
            logger.error(f"Error intercepting response: {e}")
    
    async def _monitor_network_traffic(self):
        """Monitor network traffic to detect Ollama API calls"""
        logger.info("🌐 Starting network traffic monitoring...")
        
        try:
            import psutil
            
            while self.intercepting:
                # Monitor network connections to Ollama port
                connections = psutil.net_connections(kind='inet')
                ollama_connections = [
                    conn for conn in connections 
                    if conn.laddr and conn.laddr.port == self.ollama_port
                ]
                
                if ollama_connections:
                    logger.debug(f"🔗 Found {len(ollama_connections)} connections to Ollama")
                
                await asyncio.sleep(5)
                
        except ImportError:
            logger.warning("psutil not available for network monitoring")
        except Exception as e:
            logger.error(f"Network monitoring error: {e}")
    
    async def _monitor_ollama_processes(self):
        """Monitor Ollama processes for activity"""
        logger.info("🔍 Starting Ollama process monitoring...")
        
        try:
            import psutil
            
            while self.intercepting:
                # Find Ollama processes
                ollama_processes = []
                for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                    try:
                        if 'ollama' in proc.info['name'].lower():
                            ollama_processes.append(proc)
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                
                if ollama_processes:
                    logger.debug(f"🏃 Found {len(ollama_processes)} Ollama processes")
                
                await asyncio.sleep(10)
                
        except ImportError:
            logger.warning("psutil not available for process monitoring")
        except Exception as e:
            logger.error(f"Process monitoring error: {e}")
    
    def _start_log_monitoring(self):
        """Start log file monitoring in a separate thread"""
        def monitor_logs():
            logger.info("📄 Starting log file monitoring...")
            
            # Find Ollama log files
            log_paths = [
                os.path.expanduser("~/.ollama/logs"),
                "/var/log/ollama",
                "/usr/local/var/log/ollama",
                "/tmp/ollama.log",
                os.path.expanduser("~/Library/Logs/Ollama")  # macOS
            ]
            
            log_files = []
            for path in log_paths:
                if os.path.exists(path):
                    if os.path.isdir(path):
                        for file in os.listdir(path):
                            if file.endswith('.log'):
                                log_files.append(os.path.join(path, file))
                    else:
                        log_files.append(path)
            
            if not log_files:
                logger.warning("No Ollama log files found")
                return
            
            logger.info(f"📄 Monitoring {len(log_files)} log files")
            
            # Monitor each log file
            for log_file in log_files:
                try:
                    self._tail_log_file(log_file)
                except Exception as e:
                    logger.error(f"Error monitoring {log_file}: {e}")
        
        self.log_monitor_thread = threading.Thread(target=monitor_logs, daemon=True)
        self.log_monitor_thread.start()
    
    def _tail_log_file(self, log_file: str):
        """Tail a log file for new content"""
        try:
            with open(log_file, 'r') as f:
                # Go to end of file
                f.seek(0, 2)
                
                while self.intercepting:
                    line = f.readline()
                    if line:
                        self._parse_log_line(line)
                    else:
                        time.sleep(0.1)
                        
        except Exception as e:
            logger.error(f"Error tailing {log_file}: {e}")
    
    def _parse_log_line(self, line: str):
        """Parse log line for conversation data"""
        try:
            # Look for API request patterns
            if 'POST /api/generate' in line or 'POST /api/chat' in line:
                logger.debug(f"📄 Log: API request detected")
            
            # Look for JSON data containing prompts/responses
            json_match = re.search(r'\{.*\}', line)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    
                    # Check for prompt/response patterns
                    if 'prompt' in data and 'response' in data:
                        prompt = data['prompt']
                        response = data['response']
                        
                        if prompt and response:
                            logger.info("📄 Log: Found conversation pair")
                            # Use asyncio to call the async callback
                            asyncio.create_task(
                                self.conversation_callback(prompt, response)
                            )
                            
                except json.JSONDecodeError:
                    pass
                    
        except Exception as e:
            logger.error(f"Error parsing log line: {e}")
    
    async def inject_test_conversation(self, prompt: str, response: str = None):
        """Inject a test conversation for testing purposes"""
        if response is None:
            response = "I understand you want to publish a form. Let me help you with that."
        
        logger.info("🧪 Injecting test conversation...")
        await self.conversation_callback(prompt, response)
    
    async def stop_interception(self):
        """Stop all interception methods"""
        self.intercepting = False
        logger.info("🛑 Stopping Ollama interception...")
        
        if self.proxy_app:
            await self.proxy_app.cleanup()

# Singleton instance
ollama_interceptor = None

def get_ollama_interceptor(callback):
    """Get or create the global interceptor instance"""
    global ollama_interceptor
    if ollama_interceptor is None:
        ollama_interceptor = OllamaRealTimeInterceptor(callback)
    return ollama_interceptor

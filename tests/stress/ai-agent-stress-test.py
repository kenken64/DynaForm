#!/usr/bin/env python3
"""
AI Agent Interceptor Stress Testing Framework

This script specifically tests the AI Agent Interceptor proxy server
that runs on port 11435 and intercepts Ollama API calls.

Tests include:
1. Direct proxy performance testing
2. Conversation interception reliability
3. Response injection testing
4. Concurrent connection handling
5. Memory and resource monitoring
6. Failover and error handling
"""

import asyncio
import aiohttp
import json
import time
import sys
import os
import threading
import statistics
import psutil
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, asdict
import argparse

# Add the ai-agent directory to the path to import configuration
sys.path.append('/Users/kennethphang/Projects/doc2formjson/ai-agent')

try:
    from config import config
    OLLAMA_HOST = config.OLLAMA_HOST
    DEEPSEEK_MODEL = config.DEEPSEEK_MODEL_NAME
except ImportError:
    print("⚠️  Could not import AI agent config, using defaults")
    OLLAMA_HOST = "http://localhost"
    DEEPSEEK_MODEL = "qwen2.5:0.5b"  # Use available model

# Test configuration
AI_AGENT_PROXY_PORT = 11435
OLLAMA_DIRECT_PORT = 11434
PROXY_URL = f"{OLLAMA_HOST}:{AI_AGENT_PROXY_PORT}"
DIRECT_URL = f"{OLLAMA_HOST}:{OLLAMA_DIRECT_PORT}"

@dataclass
class TestResult:
    """Individual test result"""
    success: bool
    response_time: float
    error_message: Optional[str] = None
    status_code: Optional[int] = None
    response_size: Optional[int] = None
    intercepted: bool = False

@dataclass
class StressTestStats:
    """Statistics for stress test results"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    intercepted_requests: int = 0
    avg_response_time: float = 0.0
    min_response_time: float = float('inf')
    max_response_time: float = 0.0
    p95_response_time: float = 0.0
    p99_response_time: float = 0.0
    errors_by_type: Dict[str, int] = None
    start_time: float = 0.0
    end_time: float = 0.0
    peak_memory_mb: float = 0.0
    peak_cpu_percent: float = 0.0
    
    def __post_init__(self):
        if self.errors_by_type is None:
            self.errors_by_type = {}

class AIAgentStressTester:
    """Main stress testing class for AI Agent Interceptor"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.results: List[TestResult] = []
        self.stats = StressTestStats()
        self.is_running = False
        self.system_monitor_task: Optional[asyncio.Task] = None
        self.memory_usage: List[float] = []
        self.cpu_usage: List[float] = []
        
        # Test message templates
        self.test_prompts = [
            "Hello, I need help with form creation",
            "Can you analyze this document and create a form?",
            "What are the best practices for dynamic forms?",
            "Create a form with name, email, and phone fields",
            "How do I set up field validation?",
            "Explain different input field types",
            "I need help with conditional logic",
            "Generate a complex multi-step form",
            "What's the best way to handle file uploads?",
            "Help me integrate forms with a database"
        ]
        
        # Long prompt for payload testing
        self.long_prompt = ("This is a comprehensive test prompt that simulates a complex user query. " * 100)
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=180)  # 3 minutes timeout
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def check_services(self) -> Dict[str, bool]:
        """Check if required services are running"""
        results = {}
        
        # Check AI Agent Proxy
        try:
            async with self.session.get(f"{PROXY_URL}/api/tags") as response:
                results['ai_agent_proxy'] = response.status == 200
        except Exception as e:
            print(f"❌ AI Agent Proxy check failed: {e}")
            results['ai_agent_proxy'] = False
        
        # Check Ollama Direct
        try:
            async with self.session.get(f"{DIRECT_URL}/api/tags") as response:
                results['ollama_direct'] = response.status == 200
        except Exception as e:
            print(f"❌ Ollama Direct check failed: {e}")
            results['ollama_direct'] = False
        
        return results
    
    async def send_request_to_proxy(self, prompt: str, stream: bool = False) -> TestResult:
        """Send a request through the AI Agent Proxy"""
        start_time = time.time()
        
        payload = {
            "model": DEEPSEEK_MODEL,
            "prompt": prompt,
            "stream": stream
        }
        
        try:
            async with self.session.post(
                f"{PROXY_URL}/api/generate",
                json=payload,
                headers={'Content-Type': 'application/json'}
            ) as response:
                
                response_data = await response.text()
                end_time = time.time()
                response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                
                # Check if response was intercepted (look for AI agent fingerprints)
                intercepted = (
                    "auto-publisher" in response_data or
                    "✅" in response_data or
                    "form published" in response_data.lower()
                )
                
                return TestResult(
                    success=response.status == 200,
                    response_time=response_time,
                    status_code=response.status,
                    response_size=len(response_data),
                    intercepted=intercepted
                )
                
        except asyncio.TimeoutError:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return TestResult(
                success=False,
                response_time=response_time,
                error_message="Request timeout"
            )
        except Exception as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return TestResult(
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def send_request_to_ollama_direct(self, prompt: str, stream: bool = False) -> TestResult:
        """Send a request directly to Ollama (bypassing proxy)"""
        start_time = time.time()
        
        payload = {
            "model": DEEPSEEK_MODEL,
            "prompt": prompt,
            "stream": stream
        }
        
        try:
            async with self.session.post(
                f"{DIRECT_URL}/api/generate",
                json=payload,
                headers={'Content-Type': 'application/json'}
            ) as response:
                
                response_data = await response.text()
                end_time = time.time()
                response_time = (end_time - start_time) * 1000
                
                return TestResult(
                    success=response.status == 200,
                    response_time=response_time,
                    status_code=response.status,
                    response_size=len(response_data),
                    intercepted=False  # Direct requests are never intercepted
                )
                
        except asyncio.TimeoutError:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return TestResult(
                success=False,
                response_time=response_time,
                error_message="Request timeout"
            )
        except Exception as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return TestResult(
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def monitor_system_resources(self):
        """Monitor system resources during testing"""
        while self.is_running:
            try:
                # Get memory usage
                memory = psutil.virtual_memory()
                self.memory_usage.append(memory.percent)
                
                # Get CPU usage
                cpu = psutil.cpu_percent(interval=1)
                self.cpu_usage.append(cpu)
                
                await asyncio.sleep(1)
            except Exception as e:
                print(f"⚠️  System monitoring error: {e}")
                break
    
    async def run_concurrent_test(
        self, 
        concurrent_users: int, 
        requests_per_user: int, 
        use_proxy: bool = True,
        message_delay: float = 1.0
    ) -> StressTestStats:
        """Run concurrent load test"""
        
        print(f"\n🚀 Starting concurrent test:")
        print(f"   Users: {concurrent_users}")
        print(f"   Requests per user: {requests_per_user}")
        print(f"   Target: {'AI Agent Proxy' if use_proxy else 'Ollama Direct'}")
        print(f"   Message delay: {message_delay}s\n")
        
        self.results.clear()
        self.is_running = True
        
        # Start system monitoring
        self.system_monitor_task = asyncio.create_task(self.monitor_system_resources())
        
        start_time = time.time()
        
        async def user_session(user_id: int):
            """Simulate a single user session"""
            print(f"👤 User {user_id}: Starting session")
            
            for request_num in range(requests_per_user):
                try:
                    # Select random prompt
                    if request_num % 10 == 0:  # Every 10th request uses long prompt
                        prompt = self.long_prompt
                    else:
                        prompt = random.choice(self.test_prompts)
                    
                    # Send request
                    if use_proxy:
                        result = await self.send_request_to_proxy(prompt)
                    else:
                        result = await self.send_request_to_ollama_direct(prompt)
                    
                    self.results.append(result)
                    
                    if result.success:
                        intercepted_msg = " (intercepted)" if result.intercepted else ""
                        print(f"✅ User {user_id}: Request {request_num + 1} completed "
                              f"({result.response_time:.2f}ms){intercepted_msg}")
                    else:
                        print(f"❌ User {user_id}: Request {request_num + 1} failed - "
                              f"{result.error_message}")
                    
                    # Delay between requests
                    if request_num < requests_per_user - 1:
                        await asyncio.sleep(message_delay + random.uniform(0, 0.5))
                        
                except Exception as e:
                    print(f"💥 User {user_id}: Unexpected error - {str(e)}")
                    self.results.append(TestResult(
                        success=False,
                        response_time=0,
                        error_message=str(e)
                    ))
            
            print(f"👤 User {user_id}: Session completed")
        
        # Run all user sessions concurrently
        tasks = [user_session(i + 1) for i in range(concurrent_users)]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        self.is_running = False
        
        # Stop system monitoring
        if self.system_monitor_task:
            self.system_monitor_task.cancel()
            try:
                await self.system_monitor_task
            except asyncio.CancelledError:
                pass
        
        # Calculate statistics
        return self._calculate_stats(start_time, end_time)
    
    async def run_interception_test(self, num_requests: int = 20) -> StressTestStats:
        """Test the interception capabilities specifically"""
        
        print(f"\n🔍 Starting interception test with {num_requests} requests...\n")
        
        self.results.clear()
        start_time = time.time()
        
        # Test prompts that might trigger form publishing
        form_prompts = [
            "Create a contact form with name and email fields",
            "Generate a registration form for an event",
            "I need a feedback form for my website",
            "Build a survey form with multiple choice questions",
            "Create a job application form",
            "Generate a customer onboarding form",
            "Make a form for collecting user preferences",
            "Create a product review form",
            "Generate a newsletter signup form",
            "Build a support ticket form"
        ]
        
        for i in range(num_requests):
            prompt = random.choice(form_prompts)
            print(f"🧪 Test {i + 1}/{num_requests}: Testing interception with prompt...")
            
            # Send through proxy
            result = await self.send_request_to_proxy(prompt)
            self.results.append(result)
            
            if result.success:
                if result.intercepted:
                    print(f"   ✅ Request intercepted and processed by AI agent")
                else:
                    print(f"   📡 Request passed through to Ollama")
            else:
                print(f"   ❌ Request failed: {result.error_message}")
            
            # Small delay between tests
            await asyncio.sleep(0.5)
        
        end_time = time.time()
        return self._calculate_stats(start_time, end_time)
    
    async def run_proxy_vs_direct_comparison(self, num_requests: int = 10) -> Dict[str, StressTestStats]:
        """Compare proxy performance vs direct Ollama"""
        
        print(f"\n⚖️  Starting proxy vs direct comparison ({num_requests} requests each)...\n")
        
        # Test through proxy
        print("🔄 Testing through AI Agent Proxy...")
        self.results.clear()
        start_time = time.time()
        
        for i in range(num_requests):
            prompt = random.choice(self.test_prompts)
            result = await self.send_request_to_proxy(prompt)
            self.results.append(result)
            print(f"   Proxy request {i + 1}/{num_requests}: {result.response_time:.2f}ms")
        
        end_time = time.time()
        proxy_stats = self._calculate_stats(start_time, end_time)
        
        # Test direct to Ollama
        print("\n🎯 Testing direct to Ollama...")
        self.results.clear()
        start_time = time.time()
        
        for i in range(num_requests):
            prompt = random.choice(self.test_prompts)
            result = await self.send_request_to_ollama_direct(prompt)
            self.results.append(result)
            print(f"   Direct request {i + 1}/{num_requests}: {result.response_time:.2f}ms")
        
        end_time = time.time()
        direct_stats = self._calculate_stats(start_time, end_time)
        
        return {
            'proxy': proxy_stats,
            'direct': direct_stats
        }
    
    def _calculate_stats(self, start_time: float, end_time: float) -> StressTestStats:
        """Calculate comprehensive statistics from test results"""
        
        if not self.results:
            return StressTestStats()
        
        response_times = [r.response_time for r in self.results if r.response_time > 0]
        successful_results = [r for r in self.results if r.success]
        failed_results = [r for r in self.results if not r.success]
        intercepted_results = [r for r in self.results if r.intercepted]
        
        stats = StressTestStats()
        stats.total_requests = len(self.results)
        stats.successful_requests = len(successful_results)
        stats.failed_requests = len(failed_results)
        stats.intercepted_requests = len(intercepted_results)
        stats.start_time = start_time
        stats.end_time = end_time
        
        if response_times:
            stats.avg_response_time = statistics.mean(response_times)
            stats.min_response_time = min(response_times)
            stats.max_response_time = max(response_times)
            
            # Calculate percentiles
            sorted_times = sorted(response_times)
            stats.p95_response_time = sorted_times[int(len(sorted_times) * 0.95)]
            stats.p99_response_time = sorted_times[int(len(sorted_times) * 0.99)]
        
        # Error breakdown
        for result in failed_results:
            error_type = result.error_message or "Unknown"
            stats.errors_by_type[error_type] = stats.errors_by_type.get(error_type, 0) + 1
        
        # System metrics
        if self.memory_usage:
            stats.peak_memory_mb = max(self.memory_usage)
        if self.cpu_usage:
            stats.peak_cpu_percent = max(self.cpu_usage)
        
        return stats
    
    def print_stats_report(self, stats: StressTestStats, title: str = "Test Results"):
        """Print a detailed statistics report"""
        
        duration = stats.end_time - stats.start_time
        requests_per_second = stats.total_requests / duration if duration > 0 else 0
        success_rate = (stats.successful_requests / stats.total_requests * 100) if stats.total_requests > 0 else 0
        interception_rate = (stats.intercepted_requests / stats.total_requests * 100) if stats.total_requests > 0 else 0
        
        print(f"\n{'=' * 80}")
        print(f"📊 {title.upper()}")
        print('=' * 80)
        
        print(f"\n📈 SUMMARY:")
        print(f"   Duration: {duration:.2f}s")
        print(f"   Total Requests: {stats.total_requests}")
        print(f"   Successful: {stats.successful_requests}")
        print(f"   Failed: {stats.failed_requests}")
        print(f"   Intercepted: {stats.intercepted_requests}")
        print(f"   Success Rate: {success_rate:.2f}%")
        print(f"   Interception Rate: {interception_rate:.2f}%")
        print(f"   Requests/Second: {requests_per_second:.2f}")
        
        print(f"\n⚡ PERFORMANCE:")
        print(f"   Average Response Time: {stats.avg_response_time:.2f}ms")
        print(f"   Min Response Time: {stats.min_response_time:.2f}ms")
        print(f"   Max Response Time: {stats.max_response_time:.2f}ms")
        print(f"   95th Percentile: {stats.p95_response_time:.2f}ms")
        print(f"   99th Percentile: {stats.p99_response_time:.2f}ms")
        
        if stats.errors_by_type:
            print(f"\n❌ ERROR BREAKDOWN:")
            for error_type, count in stats.errors_by_type.items():
                print(f"   {error_type}: {count}")
        
        print(f"\n💾 SYSTEM METRICS:")
        print(f"   Peak Memory Usage: {stats.peak_memory_mb:.2f}%")
        print(f"   Peak CPU Usage: {stats.peak_cpu_percent:.2f}%")
        
        print('=' * 80)
    
    def save_results(self, stats: StressTestStats, test_name: str):
        """Save test results to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"ai_agent_stress_test_{test_name}_{timestamp}.json"
        
        # Create results directory if it doesn't exist
        results_dir = "/Users/kennethphang/Projects/doc2formjson/tests/stress/results"
        os.makedirs(results_dir, exist_ok=True)
        
        filepath = os.path.join(results_dir, filename)
        
        # Convert to dict for JSON serialization
        result_data = {
            'test_name': test_name,
            'timestamp': timestamp,
            'stats': asdict(stats),
            'individual_results': [asdict(r) for r in self.results[-100:]]  # Last 100 results
        }
        
        with open(filepath, 'w') as f:
            json.dump(result_data, f, indent=2)
        
        print(f"📊 Results saved to: {filepath}")
        return filepath

async def main():
    """Main function with CLI interface"""
    
    parser = argparse.ArgumentParser(description="AI Agent Interceptor Stress Test")
    parser.add_argument('--test-type', choices=[
        'quick', 'concurrent', 'interception', 'comparison', 'all'
    ], default='quick', help='Type of test to run')
    parser.add_argument('--users', type=int, default=10, help='Number of concurrent users')
    parser.add_argument('--requests', type=int, default=5, help='Requests per user')
    parser.add_argument('--delay', type=float, default=1.0, help='Delay between requests (seconds)')
    
    args = parser.parse_args()
    
    print("🚀 AI Agent Interceptor Stress Testing Framework")
    print("=" * 60)
    
    async with AIAgentStressTester() as tester:
        
        # Check services
        print("🔍 Checking services...")
        service_status = await tester.check_services()
        
        for service, status in service_status.items():
            status_symbol = "✅" if status else "❌"
            print(f"   {status_symbol} {service.replace('_', ' ').title()}")
        
        if not all(service_status.values()):
            print("\n❌ Some services are not available. Please ensure:")
            print("   - AI Agent Proxy is running on port 11435")
            print("   - Ollama is running on port 11434")
            return
        
        print("\n✅ All services are available. Starting tests...\n")
        
        if args.test_type == 'quick':
            stats = await tester.run_concurrent_test(5, 3, use_proxy=True, message_delay=1.0)
            tester.print_stats_report(stats, "Quick Stress Test")
            tester.save_results(stats, "quick")
            
        elif args.test_type == 'concurrent':
            stats = await tester.run_concurrent_test(
                args.users, args.requests, use_proxy=True, message_delay=args.delay
            )
            tester.print_stats_report(stats, f"Concurrent Test ({args.users} users)")
            tester.save_results(stats, f"concurrent_{args.users}u_{args.requests}r")
            
        elif args.test_type == 'interception':
            stats = await tester.run_interception_test(args.requests)
            tester.print_stats_report(stats, "Interception Test")
            tester.save_results(stats, "interception")
            
        elif args.test_type == 'comparison':
            comparison_stats = await tester.run_proxy_vs_direct_comparison(args.requests)
            
            tester.print_stats_report(comparison_stats['proxy'], "Proxy Performance")
            tester.print_stats_report(comparison_stats['direct'], "Direct Ollama Performance")
            
            # Calculate overhead
            proxy_avg = comparison_stats['proxy'].avg_response_time
            direct_avg = comparison_stats['direct'].avg_response_time
            overhead = proxy_avg - direct_avg
            overhead_percent = (overhead / direct_avg) * 100 if direct_avg > 0 else 0
            
            print(f"\n🔍 PROXY OVERHEAD ANALYSIS:")
            print(f"   Direct Ollama Average: {direct_avg:.2f}ms")
            print(f"   AI Agent Proxy Average: {proxy_avg:.2f}ms")
            print(f"   Overhead: {overhead:.2f}ms ({overhead_percent:.2f}%)")
            
            tester.save_results(comparison_stats['proxy'], "comparison_proxy")
            tester.save_results(comparison_stats['direct'], "comparison_direct")
            
        elif args.test_type == 'all':
            print("🎯 Running comprehensive test suite...")
            
            tests = [
                ('Quick Test', lambda: tester.run_concurrent_test(5, 3)),
                ('Interception Test', lambda: tester.run_interception_test(10)),
                ('Medium Load', lambda: tester.run_concurrent_test(15, 5)),
                ('High Load', lambda: tester.run_concurrent_test(25, 3))
            ]
            
            for test_name, test_func in tests:
                print(f"\n🧪 Running {test_name}...")
                stats = await test_func()
                tester.print_stats_report(stats, test_name)
                tester.save_results(stats, test_name.lower().replace(' ', '_'))
                
                # Brief pause between tests
                await asyncio.sleep(3)
            
            # Final comparison test
            print("\n🧪 Running final proxy vs direct comparison...")
            comparison_stats = await tester.run_proxy_vs_direct_comparison(10)
            tester.print_stats_report(comparison_stats['proxy'], "Final Proxy Test")
            tester.print_stats_report(comparison_stats['direct'], "Final Direct Test")
            
            print("\n🎉 Comprehensive test suite completed!")
        
        print(f"\n✅ AI Agent Interceptor stress testing completed!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        sys.exit(1)

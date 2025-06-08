#!/usr/bin/env python3

"""
Real-time System Monitoring for Stress Testing
Monitors system resources during stress tests and generates detailed reports
"""

import psutil
import time
import json
import os
import requests
import asyncio
import aiohttp
from datetime import datetime
import argparse
import threading
import signal
import sys

class SystemMonitor:
    def __init__(self, output_dir="results"):
        self.output_dir = output_dir
        self.monitoring = False
        self.data = {
            'start_time': None,
            'end_time': None,
            'system_metrics': [],
            'service_health': [],
            'network_metrics': [],
            'process_metrics': []
        }
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Service endpoints to monitor
        self.services = {
            'backend': 'http://localhost:3000/api/health',
            'ai_agent': 'http://localhost:11435/api/tags',
            'ollama': 'http://localhost:11434/api/tags'
        }
        
        self.processes_to_monitor = ['node', 'python', 'ollama']
        
    def signal_handler(self, signum, frame):
        """Handle graceful shutdown"""
        print(f"\n⚠️  Received signal {signum}. Stopping monitoring...")
        self.stop_monitoring()
        self.save_report()
        sys.exit(0)
    
    def start_monitoring(self, interval=1):
        """Start system monitoring"""
        print("🔍 Starting system monitoring...")
        self.monitoring = True
        self.data['start_time'] = datetime.now().isoformat()
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        while self.monitoring:
            try:
                # Collect system metrics
                self.collect_system_metrics()
                
                # Check service health
                self.check_service_health()
                
                # Monitor specific processes
                self.monitor_processes()
                
                # Network statistics
                self.collect_network_metrics()
                
                time.sleep(interval)
                
            except Exception as e:
                print(f"❌ Error during monitoring: {e}")
                time.sleep(interval)
    
    def stop_monitoring(self):
        """Stop monitoring and finalize data"""
        self.monitoring = False
        self.data['end_time'] = datetime.now().isoformat()
        print("✅ Monitoring stopped")
    
    def collect_system_metrics(self):
        """Collect CPU, memory, disk, and other system metrics"""
        timestamp = datetime.now().isoformat()
        
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=None)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        disk_io = psutil.disk_io_counters()
        
        # Load average (Unix-like systems)
        try:
            load_avg = os.getloadavg()
        except AttributeError:
            load_avg = [0, 0, 0]  # Windows doesn't have load average
        
        metrics = {
            'timestamp': timestamp,
            'cpu': {
                'percent': cpu_percent,
                'count': cpu_count,
                'frequency': cpu_freq.current if cpu_freq else 0,
                'load_average': {
                    '1min': load_avg[0],
                    '5min': load_avg[1],
                    '15min': load_avg[2]
                }
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent,
                'used': memory.used,
                'free': memory.free,
                'cached': getattr(memory, 'cached', 0),
                'buffers': getattr(memory, 'buffers', 0)
            },
            'swap': {
                'total': swap.total,
                'used': swap.used,
                'free': swap.free,
                'percent': swap.percent
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent,
                'io': {
                    'read_bytes': disk_io.read_bytes if disk_io else 0,
                    'write_bytes': disk_io.write_bytes if disk_io else 0,
                    'read_count': disk_io.read_count if disk_io else 0,
                    'write_count': disk_io.write_count if disk_io else 0
                }
            }
        }
        
        self.data['system_metrics'].append(metrics)
    
    def check_service_health(self):
        """Check health of monitored services"""
        timestamp = datetime.now().isoformat()
        health_status = {'timestamp': timestamp, 'services': {}}
        
        for service_name, url in self.services.items():
            try:
                response = requests.get(url, timeout=5)
                health_status['services'][service_name] = {
                    'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                    'response_code': response.status_code,
                    'response_time': response.elapsed.total_seconds() * 1000
                }
            except Exception as e:
                health_status['services'][service_name] = {
                    'status': 'unreachable',
                    'error': str(e),
                    'response_time': 0
                }
        
        self.data['service_health'].append(health_status)
    
    def monitor_processes(self):
        """Monitor specific processes by name"""
        timestamp = datetime.now().isoformat()
        process_data = {'timestamp': timestamp, 'processes': {}}
        
        for proc_name in self.processes_to_monitor:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'create_time']):
                try:
                    if proc_name.lower() in proc.info['name'].lower():
                        processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'cpu_percent': proc.info['cpu_percent'],
                            'memory_mb': proc.info['memory_info'].rss / 1024 / 1024,
                            'create_time': proc.info['create_time']
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            process_data['processes'][proc_name] = processes
        
        self.data['process_metrics'].append(process_data)
    
    def collect_network_metrics(self):
        """Collect network I/O statistics"""
        timestamp = datetime.now().isoformat()
        
        try:
            net_io = psutil.net_io_counters()
            net_connections = len(psutil.net_connections())
            
            network_data = {
                'timestamp': timestamp,
                'io': {
                    'bytes_sent': net_io.bytes_sent,
                    'bytes_recv': net_io.bytes_recv,
                    'packets_sent': net_io.packets_sent,
                    'packets_recv': net_io.packets_recv,
                    'errin': net_io.errin,
                    'errout': net_io.errout,
                    'dropin': net_io.dropin,
                    'dropout': net_io.dropout
                },
                'connections': net_connections
            }
            
            self.data['network_metrics'].append(network_data)
        except Exception as e:
            print(f"⚠️  Error collecting network metrics: {e}")
    
    def save_report(self):
        """Save monitoring data to JSON file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"system_monitoring_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(self.data, f, indent=2)
        
        print(f"📊 System monitoring report saved to: {filepath}")
        
        # Generate summary report
        self.generate_summary_report(filepath.replace('.json', '_summary.md'))
        
        return filepath
    
    def generate_summary_report(self, output_file):
        """Generate a human-readable summary report"""
        if not self.data['system_metrics']:
            print("⚠️  No system metrics collected")
            return
        
        # Calculate summary statistics
        cpu_values = [m['cpu']['percent'] for m in self.data['system_metrics']]
        memory_values = [m['memory']['percent'] for m in self.data['system_metrics']]
        
        max_cpu = max(cpu_values) if cpu_values else 0
        avg_cpu = sum(cpu_values) / len(cpu_values) if cpu_values else 0
        max_memory = max(memory_values) if memory_values else 0
        avg_memory = sum(memory_values) / len(memory_values) if memory_values else 0
        
        # Service availability
        service_stats = {}
        for health_check in self.data['service_health']:
            for service, status in health_check['services'].items():
                if service not in service_stats:
                    service_stats[service] = {'healthy': 0, 'total': 0}
                service_stats[service]['total'] += 1
                if status['status'] == 'healthy':
                    service_stats[service]['healthy'] += 1
        
        # Generate markdown report
        with open(output_file, 'w') as f:
            f.write("# System Monitoring Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            if self.data['start_time'] and self.data['end_time']:
                f.write(f"**Monitoring Period:** {self.data['start_time']} to {self.data['end_time']}\n\n")
            
            f.write("## System Performance Summary\n\n")
            f.write(f"- **Peak CPU Usage:** {max_cpu:.2f}%\n")
            f.write(f"- **Average CPU Usage:** {avg_cpu:.2f}%\n")
            f.write(f"- **Peak Memory Usage:** {max_memory:.2f}%\n")
            f.write(f"- **Average Memory Usage:** {avg_memory:.2f}%\n\n")
            
            f.write("## Service Availability\n\n")
            for service, stats in service_stats.items():
                availability = (stats['healthy'] / stats['total'] * 100) if stats['total'] > 0 else 0
                f.write(f"- **{service.capitalize()}:** {availability:.2f}% ({stats['healthy']}/{stats['total']})\n")
            
            f.write("\n## Key Findings\n\n")
            
            # Add performance insights
            if max_cpu > 80:
                f.write("⚠️  **High CPU Usage Detected:** Peak CPU usage exceeded 80%\n")
            if max_memory > 80:
                f.write("⚠️  **High Memory Usage Detected:** Peak memory usage exceeded 80%\n")
            
            # Service health insights
            for service, stats in service_stats.items():
                availability = (stats['healthy'] / stats['total'] * 100) if stats['total'] > 0 else 0
                if availability < 95:
                    f.write(f"⚠️  **{service.capitalize()} Service Issues:** Availability below 95%\n")
            
            if max_cpu < 50 and max_memory < 50:
                f.write("✅ **System Performance Good:** CPU and memory usage remained within acceptable limits\n")
        
        print(f"📄 Summary report saved to: {output_file}")

async def run_concurrent_health_checks(duration=60):
    """Run concurrent health checks to stress test service endpoints"""
    print(f"🏥 Starting concurrent health checks for {duration} seconds...")
    
    services = {
        'backend': 'http://localhost:3000/api/health',
        'ai_agent': 'http://localhost:11435/api/tags',
        'ollama': 'http://localhost:11434/api/tags'
    }
    
    results = {service: {'successful': 0, 'failed': 0, 'total': 0} for service in services}
    
    async def check_service(session, service_name, url):
        """Check a single service"""
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                results[service_name]['total'] += 1
                if response.status == 200:
                    results[service_name]['successful'] += 1
                else:
                    results[service_name]['failed'] += 1
        except Exception:
            results[service_name]['total'] += 1
            results[service_name]['failed'] += 1
    
    end_time = time.time() + duration
    
    async with aiohttp.ClientSession() as session:
        while time.time() < end_time:
            tasks = []
            for service_name, url in services.items():
                task = check_service(session, service_name, url)
                tasks.append(task)
            
            await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(1)  # Wait 1 second between rounds
    
    print("\n🏥 Health Check Results:")
    for service, stats in results.items():
        success_rate = (stats['successful'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"   {service}: {success_rate:.2f}% ({stats['successful']}/{stats['total']})")
    
    return results

def main():
    parser = argparse.ArgumentParser(description='System Monitor for Stress Testing')
    parser.add_argument('--duration', type=int, default=300, help='Monitoring duration in seconds')
    parser.add_argument('--interval', type=int, default=1, help='Monitoring interval in seconds')
    parser.add_argument('--output-dir', default='results', help='Output directory for reports')
    parser.add_argument('--health-checks', action='store_true', help='Run concurrent health checks')
    
    args = parser.parse_args()
    
    monitor = SystemMonitor(args.output_dir)
    
    if args.health_checks:
        # Run health checks concurrently with monitoring
        def run_health_checks():
            asyncio.run(run_concurrent_health_checks(args.duration))
        
        health_thread = threading.Thread(target=run_health_checks)
        health_thread.start()
    
    try:
        # Start monitoring for specified duration
        start_time = time.time()
        monitor.start_monitoring(args.interval)
        
        # Monitor for specified duration
        while monitor.monitoring and (time.time() - start_time) < args.duration:
            time.sleep(1)
        
        monitor.stop_monitoring()
        monitor.save_report()
        
        if args.health_checks:
            health_thread.join()
        
    except KeyboardInterrupt:
        print("\n⚠️  Monitoring interrupted by user")
        monitor.stop_monitoring()
        monitor.save_report()

if __name__ == "__main__":
    main()

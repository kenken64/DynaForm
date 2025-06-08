#!/bin/bash
RESULTS_DIR="$1"
MONITOR_FILE="$RESULTS_DIR/system_monitoring.log"

echo "timestamp,cpu_percent,memory_percent,disk_io_read,disk_io_write,network_bytes_sent,network_bytes_recv" > "$MONITOR_FILE"

while true; do
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Get CPU usage
    cpu_percent=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' 2>/dev/null || echo "0")
    
    # Get memory usage
    memory_percent=$(ps -A -o %mem | awk '{s+=$1} END {print s}' 2>/dev/null || echo "0")
    
    # Get disk I/O (simplified for macOS/Linux compatibility)
    disk_io_read="0"
    disk_io_write="0"
    
    # Get network stats (simplified)
    network_sent="0"
    network_recv="0"
    
    echo "$timestamp,$cpu_percent,$memory_percent,$disk_io_read,$disk_io_write,$network_sent,$network_recv" >> "$MONITOR_FILE"
    
    sleep 5
done

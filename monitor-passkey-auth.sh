#!/bin/bash

echo "🔍 Real-time Passkey Authentication Monitoring"
echo "============================================="

# Monitor API logs in real-time for passkey-related operations
echo "🔍 Monitoring API logs for passkey operations..."
echo "Try a failed passkey authentication now, and watch for:"
echo "- User insertion operations"
echo "- Authentication failures"
echo "- Registration attempts"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor logs with specific filters
docker compose -f docker-compose.ssl.yml logs -f doc2formjson-api 2>/dev/null | \
grep --line-buffered -E "(passkey|authentication|register|User|insertOne|verifyPasskeyAuthentication|registerUser)" | \
while read line; do
    echo "[$(date '+%H:%M:%S')] $line"
done

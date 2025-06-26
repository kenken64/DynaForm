#!/bin/bash

echo "🔍 Validating Environment Variables in docker-compose.ssl.yml"
echo "============================================================="

echo "📋 Checking if all server/.env variables are included in docker-compose.ssl.yml..."
echo ""

# Extract environment variables from server/.env (excluding comments and empty lines)
ENV_VARS=$(grep -v '^#' server/.env | grep -v '^$' | cut -d'=' -f1)

echo "🔍 Environment variables found in server/.env:"
for var in $ENV_VARS; do
    echo "  - $var"
done

echo ""
echo "🔍 Checking docker-compose.ssl.yml for missing variables..."

MISSING_VARS=()
FOUND_VARS=()

for var in $ENV_VARS; do
    if grep -q "$var" docker-compose.ssl.yml; then
        FOUND_VARS+=("$var")
    else
        MISSING_VARS+=("$var")
    fi
done

echo ""
echo "✅ Variables found in docker-compose.ssl.yml:"
for var in "${FOUND_VARS[@]}"; do
    echo "  ✓ $var"
done

echo ""
if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "🎉 All environment variables are properly configured!"
else
    echo "❌ Missing variables in docker-compose.ssl.yml:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  ✗ $var"
    done
    
    echo ""
    echo "📋 Add these missing variables to the doc2formjson-api service environment section:"
    for var in "${MISSING_VARS[@]}"; do
        # Get the value from server/.env
        value=$(grep "^$var=" server/.env | cut -d'=' -f2-)
        echo "      - $var=$value"
    done
fi

echo ""
echo "🔍 Current docker-compose.ssl.yml doc2formjson-api environment section:"
echo "=================================================================="
grep -A 30 "doc2formjson-api:" docker-compose.ssl.yml | grep -A 25 "environment:" | head -25

echo ""
echo "🏁 Validation complete!"

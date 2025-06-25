#!/bin/bash

echo "🧪 Testing PDF Converter Permissions"
echo "===================================="

echo "📁 Current generated_pngs permissions:"
ls -ld ./pdf-png/generated_pngs/

echo ""
echo "📁 Testing write access to generated_pngs..."
TEST_DIR="./pdf-png/generated_pngs/test-$(date +%s)"

if mkdir "$TEST_DIR" 2>/dev/null; then
    echo "✅ Successfully created test directory: $TEST_DIR"
    rmdir "$TEST_DIR"
    echo "✅ Test directory removed"
else
    echo "❌ Failed to create test directory - permission issue exists"
fi

echo ""
echo "🔍 Current directory contents:"
ls -la ./pdf-png/generated_pngs/ | head -5

echo ""
echo "📋 Summary:"
echo "- Host directory permissions: $(ls -ld ./pdf-png/generated_pngs/ | cut -d' ' -f1)"
echo "- Owner: $(ls -ld ./pdf-png/generated_pngs/ | cut -d' ' -f3-4)"
echo ""
echo "To fix permissions run: ./fix-pdf-permissions.sh"

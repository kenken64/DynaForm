#!/usr/bin/env python3
"""
Simple test script for the AI Agent
"""

import asyncio
import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_agent import form_publishing_agent
from mongodb_service import mongodb_service
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service

async def test_services():
    """Test individual services"""
    print("🔧 Testing individual services...")
    
    # Test MongoDB connection
    print("\n📊 Testing MongoDB connection...")
    try:
        mongo_connected = await mongodb_service.connect()
        if mongo_connected:
            print("✅ MongoDB: Connected successfully")
        else:
            print("❌ MongoDB: Connection failed")
    except Exception as e:
        print(f"❌ MongoDB: Error - {e}")
    
    # Test Ollama
    print("\n🤖 Testing Ollama...")
    try:
        ollama_available = await ollama_service.check_ollama_status()
        if ollama_available:
            print("✅ Ollama: Available and responding")
        else:
            print("❌ Ollama: Not available")
    except Exception as e:
        print(f"❌ Ollama: Error - {e}")
    
    # Test Verifiable Contract API
    print("\n⛓️  Testing Verifiable Contract API...")
    try:
        api_status = await verifiable_contract_service.get_api_status()
        if api_status.get("success"):
            print("✅ Contract API: Available and responding")
        else:
            print(f"❌ Contract API: Error - {api_status.get('error')}")
    except Exception as e:
        print(f"❌ Contract API: Error - {e}")

async def test_simple_interaction():
    """Test a simple non-publish interaction"""
    print("\n💬 Testing simple interaction...")
    try:
        response = await form_publishing_agent.process_message("Hello, what can you help me with?")
        print(f"Agent Response: {response}")
    except Exception as e:
        print(f"❌ Error testing interaction: {e}")

async def test_publish_intent():
    """Test publish intent detection without actual publishing"""
    print("\n🎯 Testing publish intent detection...")
    try:
        # Test publish intent analysis
        analysis = await ollama_service.analyze_publish_intent("I want to publish form abc123")
        print(f"Intent Analysis: {analysis}")
        
        # Test with a non-publish message
        analysis2 = await ollama_service.analyze_publish_intent("What's the weather like?")
        print(f"Non-publish Analysis: {analysis2}")
        
    except Exception as e:
        print(f"❌ Error testing intent: {e}")

async def main():
    print("🚀 AI Agent Test Suite")
    print("=" * 50)
    
    try:
        await test_services()
        await test_simple_interaction()
        await test_publish_intent()
        
        print("\n" + "=" * 50)
        print("✅ Test suite completed!")
        print("\n💡 To test form publishing, ensure:")
        print("   1. MongoDB is running with form data")
        print("   2. Verifiable contract API is running on port 3002")
        print("   3. You have valid form IDs in the database")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
    
    finally:
        await mongodb_service.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

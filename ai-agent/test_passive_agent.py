#!/usr/bin/env python3
"""
Test script for the Passive AI Agent
"""

import asyncio
import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from passive_agent import PassiveFormPublishingAgent
from mongodb_service import mongodb_service
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service

async def test_passive_agent():
    """Test the passive agent functionality"""
    print("🧪 Testing Passive Form Publishing Agent")
    print("=" * 60)
    
    agent = PassiveFormPublishingAgent()
    
    try:
        # Initialize services
        print("\n🔧 Initializing services...")
        await agent.initialize_services()
        
        # Test conversation scenarios
        test_conversations = [
            "Hello, how are you?",  # Should not trigger
            "I want to publish form abc123",  # Should trigger
            "Please deploy form xyz789 to the blockchain",  # Should trigger
            "What's the weather like?",  # Should not trigger
            "Can you register form test001?",  # Should trigger
            "Help me publish form id 67890abcdef1234567890123"  # Should trigger with ObjectId-like pattern
        ]
        
        print("\n💬 Testing conversation interception...")
        for i, conversation in enumerate(test_conversations, 1):
            print(f"\n--- Test {i} ---")
            print(f"Input: {conversation}")
            
            try:
                await agent.simulate_conversation(conversation)
                await asyncio.sleep(1)  # Brief pause between tests
            except Exception as e:
                print(f"❌ Error in test {i}: {e}")
        
        print("\n" + "=" * 60)
        print("✅ Passive agent testing completed!")
        print("\n💡 To run the actual passive monitoring:")
        print("   ./start-passive-agent.sh")
        print("\n💡 To test with a real form ID:")
        print("   ./start-passive-agent.sh test <your_form_id>")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
    
    finally:
        await agent.cleanup()

async def test_form_data_retrieval():
    """Test form data retrieval from MongoDB"""
    print("\n📊 Testing MongoDB form retrieval...")
    
    try:
        # Connect to MongoDB
        await mongodb_service.connect()
        
        # Get all forms to see what's available
        forms = await mongodb_service.get_all_forms()
        print(f"Found {len(forms)} forms in database")
        
        if forms:
            # Test with first available form
            first_form = forms[0]
            form_id = str(first_form.get('_id'))
            print(f"Testing with form ID: {form_id}")
            
            # Get form data
            form_data = await mongodb_service.get_form_by_id(form_id)
            if form_data:
                print("✅ Successfully retrieved form data")
                
                # Get fingerprint
                fingerprint = await mongodb_service.get_form_fingerprint(form_id)
                if fingerprint:
                    print(f"✅ Successfully retrieved fingerprint: {fingerprint[:20]}...")
                    
                    # Test URL building
                    url = f"{os.getenv('FRONTEND_BASE_URL', 'http://localhost:4200')}/public/form/{form_id}/{fingerprint}"
                    print(f"📄 Public URL would be: {url}")
                else:
                    print("⚠️ No fingerprint found for this form")
            else:
                print("❌ Could not retrieve form data")
        else:
            print("⚠️ No forms found in database")
            print("💡 Make sure you have some form data in MongoDB")
    
    except Exception as e:
        print(f"❌ MongoDB test failed: {e}")
    
    finally:
        await mongodb_service.disconnect()

async def test_services_connectivity():
    """Test connectivity to all required services"""
    print("\n🔍 Testing service connectivity...")
    
    # Test MongoDB
    try:
        connected = await mongodb_service.connect()
        if connected:
            print("✅ MongoDB: Connected")
        else:
            print("❌ MongoDB: Connection failed")
    except Exception as e:
        print(f"❌ MongoDB: Error - {e}")
    
    # Test Ollama
    try:
        available = await ollama_service.check_ollama_status()
        if available:
            print("✅ Ollama: Available")
        else:
            print("❌ Ollama: Not available")
    except Exception as e:
        print(f"❌ Ollama: Error - {e}")
    
    # Test Verifiable Contract API
    try:
        status = await verifiable_contract_service.get_api_status()
        if status.get('success'):
            print("✅ Contract API: Available")
        else:
            print(f"❌ Contract API: {status.get('error')}")
    except Exception as e:
        print(f"❌ Contract API: Error - {e}")

async def main():
    print("🚀 Passive AI Agent Test Suite")
    print("Testing all components and functionality...")
    
    try:
        await test_services_connectivity()
        await test_form_data_retrieval()
        await test_passive_agent()
        
    except KeyboardInterrupt:
        print("\n⌨️ Testing interrupted by user")
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())

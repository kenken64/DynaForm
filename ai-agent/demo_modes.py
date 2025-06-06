#!/usr/bin/env python3
"""
Demonstration of AI Agent modes
"""

import asyncio
import sys
import os
import signal
import time

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_agent import form_publishing_agent
from mongodb_service import mongodb_service

# Global flag for demo control
demo_running = True

def signal_handler(signum, frame):
    global demo_running
    print("\n\n🛑 Demo interrupted by user")
    demo_running = False

async def demo_chat_mode():
    """Demonstrate the interactive chat mode"""
    print("\n" + "="*60)
    print("🎯 DEMO: Interactive Chat Mode (No API)")
    print("="*60)
    print("This mode runs as a command-line chat interface")
    print("Perfect for testing and direct interaction")
    print("\n💬 Simulating chat interactions...")
    
    # Test messages
    test_messages = [
        "Hello, what can you help me with?",
        "I want to publish form abc123",
        "Can you help me deploy form xyz789?",
        "What forms are available?"
    ]
    
    for i, message in enumerate(test_messages, 1):
        if not demo_running:
            break
            
        print(f"\n[{i}/4] 🤖 You: {message}")
        print("🔄 Processing...")
        
        try:
            response = await form_publishing_agent.process_message(message)
            print(f"🤖 Agent: {response[:200]}{'...' if len(response) > 200 else ''}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        await asyncio.sleep(1)  # Pause between messages

async def demo_api_endpoints():
    """Demonstrate the API endpoints available in server mode"""
    print("\n" + "="*60)
    print("🌐 DEMO: Server Mode API Endpoints")
    print("="*60)
    print("When running in server mode, these endpoints are available:")
    print()
    
    endpoints = [
        ("POST /chat", "Chat with the agent", '{"message": "publish form abc123"}'),
        ("GET /health", "Check service status", "No body required"),
        ("GET /forms", "List all forms", "No body required"),
        ("GET /forms/{form_id}", "Get specific form", "No body required"),
        ("POST /publish/{form_id}", "Direct form publishing", "No body required"),
    ]
    
    for endpoint, description, example in endpoints:
        print(f"📍 {endpoint}")
        print(f"   📝 {description}")
        print(f"   💾 Example: {example}")
        print()

async def demo_workflow():
    """Demonstrate the complete workflow"""
    print("\n" + "="*60)
    print("⚙️ DEMO: Complete Publishing Workflow")
    print("="*60)
    print("1. Listen for publish keywords")
    print("2. Extract form ID from natural language")
    print("3. Fetch form data from MongoDB")
    print("4. Generate verifiable URL")
    print("5. Register on blockchain")
    print("6. Return confirmation")
    print()
    
    # Demo workflow with a real publish request
    workflow_message = "I need to publish form 123abc to the blockchain"
    print(f"🎯 Testing workflow with: '{workflow_message}'")
    print("🔄 Processing through LangGraph workflow...")
    
    try:
        response = await form_publishing_agent.process_message(workflow_message)
        print(f"✅ Workflow result: {response}")
    except Exception as e:
        print(f"❌ Workflow error: {e}")

async def main():
    global demo_running
    
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    print("🚀 AI Agent Modes Demonstration")
    print("Press Ctrl+C to stop the demo at any time")
    
    try:
        # Initialize services
        print("\n🔧 Initializing services...")
        await mongodb_service.connect()
        print("✅ Services initialized")
        
        # Demo chat mode
        if demo_running:
            await demo_chat_mode()
        
        # Demo API endpoints
        if demo_running:
            await demo_api_endpoints()
        
        # Demo workflow
        if demo_running:
            await demo_workflow()
        
        print("\n" + "="*60)
        print("🎉 DEMO COMPLETE!")
        print("="*60)
        print()
        print("📋 HOW TO RUN THE AI AGENT:")
        print()
        print("🔹 Interactive Chat Mode (No API):")
        print("   python main.py --mode chat")
        print()
        print("🔹 Server Mode (With API):")
        print("   python main.py --mode server")
        print("   # Available at: http://localhost:8001")
        print()
        print("🔹 Using the startup script:")
        print("   ./start-agent.sh        # Server mode")
        print("   ./start-agent.sh chat   # Chat mode")
        print()
        print("💡 TIP: Use chat mode for testing and debugging")
        print("💡 TIP: Use server mode for integration with other services")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
    
    finally:
        await mongodb_service.disconnect()
        print("\n👋 Demo finished!")

if __name__ == "__main__":
    asyncio.run(main())

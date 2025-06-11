#!/usr/bin/env python3
"""
Test script for recipient notification functionality in conversation interceptor
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from conversation_interceptor import conversation_interceptor
from mongodb_service import mongodb_service
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def test_recipient_notifications():
    """Test the recipient notification functionality"""
    
    # Test prompts with different alias patterns
    test_cases = [
        {
            "prompt": "Please publish form ABC123 and notify @Family about the new form",
            "form_id": "ABC123",
            "expected_aliases": ["Family"]
        },
        {
            "prompt": "Publish this form to @Team and @Managers for review",
            "form_id": "DEF456", 
            "expected_aliases": ["Team", "Managers"]
        },
        {
            "prompt": "Share the form with @Students @Parents @Teachers",
            "form_id": "GHI789",
            "expected_aliases": ["Students", "Parents", "Teachers"]
        },
        {
            "prompt": "Just publish the form without any notifications",
            "form_id": "JKL012",
            "expected_aliases": []
        }
    ]
    
    try:
        # Connect to MongoDB
        logger.info("🔌 Connecting to MongoDB...")
        await mongodb_service.connect()
        
        # Create test data if needed
        await setup_test_data()
        
        # Test each case
        for i, test_case in enumerate(test_cases, 1):
            logger.info(f"\n🧪 Test Case {i}: {test_case['prompt'][:50]}...")
            
            # Mock blockchain result
            mock_result = {
                "url": f"https://example.com/form/{test_case['form_id']}",
                "transaction_hash": f"0x123abc{i}def456",
                "block_number": 12345 + i,
                "gas_used": 21000 + (i * 1000)
            }
            
            # Test the notification processing
            await conversation_interceptor._process_recipient_notifications(
                test_case['form_id'], 
                test_case['prompt'], 
                mock_result
            )
            
            # Check if notifications were created
            notification_count = await mongodb_service.notifications_collection.count_documents({
                "formId": test_case['form_id']  # Fixed: was "form_id"
            })
            
            logger.info(f"✅ Created {notification_count} notifications for form {test_case['form_id']}")
        
        # Display all notifications created
        await show_test_notifications()
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        logger.exception("Full exception details:")
    
    finally:
        # Cleanup
        await cleanup_test_data()
        await mongodb_service.disconnect()

async def setup_test_data():
    """Clean existing test notifications"""
    logger.info("🛠️ Setting up test data...")
    
    # Clean any existing test notifications
    await mongodb_service.notifications_collection.delete_many({
        "formId": {"$in": ["ABC123", "DEF456", "GHI789", "JKL012"]}
    })
    
    logger.info("✅ Test data setup complete")

async def show_test_notifications():
    """Display all notifications created during testing"""
    logger.info("\n📋 Notifications created during testing:")
    
    cursor = mongodb_service.notifications_collection.find({
        "formId": {"$in": ["ABC123", "DEF456", "GHI789", "JKL012"]}  # Fixed: was "form_id"
    })
    
    notifications = await cursor.to_list(length=None)
    
    for notification in notifications:
        logger.info(f"📧 Form: {notification['formId']} | "  # Fixed: was "form_id"
                   f"Group: {notification.get('recipientGroupAlias', 'N/A')} | "  # Fixed: was "recipient_group_alias"
                   f"Email: {notification['recipientEmail']} | "  # Fixed: was "recipient_email"
                   f"Status: {notification['status']}")  # Fixed: was "sent"

async def cleanup_test_data():
    """Clean up test data"""
    logger.info("🧹 Cleaning up test data...")
    
    # Remove test notifications
    await mongodb_service.notifications_collection.delete_many({
        "formId": {"$in": ["ABC123", "DEF456", "GHI789", "JKL012"]}
    })
    
    logger.info("✅ Cleanup complete")

if __name__ == "__main__":
    asyncio.run(test_recipient_notifications())

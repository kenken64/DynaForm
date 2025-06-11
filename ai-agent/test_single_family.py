#!/usr/bin/env python3
"""
Single test for Family alias to check notification creation
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from conversation_interceptor import ConversationInterceptor
from mongodb_service import mongodb_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_family_notifications():
    """Test single Family alias notification creation"""
    
    try:
        # Connect to MongoDB
        await mongodb_service.connect()
        
        # Clear any existing notifications
        await mongodb_service.notifications_collection.delete_many({})
        logger.info("🧹 Cleared existing notifications")
        
        # Create interceptor
        interceptor = ConversationInterceptor()
        
        # Test prompt with @Family alias
        test_prompt = "Please publish form TEST123 and notify @Family about this test"
        form_id = "TEST123"
        result = {"status": "published"}
        
        logger.info(f"🧪 Testing prompt: {test_prompt}")
        
        # Call the notification processing directly
        await interceptor._process_recipient_notifications(form_id, test_prompt, result)
        
        # Check what was created
        notifications = await mongodb_service.notifications_collection.find({}).to_list(length=None)
        logger.info(f"📊 Total notifications created: {len(notifications)}")
        
        for i, notif in enumerate(notifications, 1):
            logger.info(f"📧 {i}. Form: {notif.get('formId')} | Group: {notif.get('recipientGroupAlias')} | Email: {notif.get('recipientEmail')} | Status: {notif.get('status')}")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        logger.exception("Full exception details:")
        
    finally:
        await mongodb_service.disconnect()

if __name__ == "__main__":
    asyncio.run(test_family_notifications())

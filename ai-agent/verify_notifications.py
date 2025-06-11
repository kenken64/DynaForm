#!/usr/bin/env python3
"""
Verify the notification collection structure and show sample documents
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mongodb_service import mongodb_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_notifications_collection():
    """Verify and show the notifications collection structure"""
    
    try:
        # Connect to MongoDB
        await mongodb_service.connect()
        
        # Check if notifications collection exists
        collections = await mongodb_service.db.list_collection_names()
        
        if 'notifications' in collections:
            logger.info("✅ Notifications collection exists")
            
            # Count documents
            count = await mongodb_service.notifications_collection.count_documents({})
            logger.info(f"📊 Total notifications: {count}")
            
            # Show sample documents
            if count > 0:
                logger.info("\n📋 Sample notification documents:")
                cursor = mongodb_service.notifications_collection.find({}).limit(3)
                notifications = await cursor.to_list(length=3)
                
                for i, notification in enumerate(notifications, 1):
                    logger.info(f"\n🔸 Sample {i}:")
                    logger.info(f"   Form ID: {notification.get('form_id')}")
                    logger.info(f"   Recipient Group: @{notification.get('recipient_group_alias')}")
                    logger.info(f"   Email: {notification.get('recipient_email')}")
                    logger.info(f"   Status: {notification.get('sent')}")
                    logger.info(f"   Timestamp: {notification.get('timestamp')}")
                    logger.info(f"   Public URL: {notification.get('public_url')}")
                    logger.info(f"   Transaction: {notification.get('transaction_hash')}")
            
            # Show notifications by status
            pending_count = await mongodb_service.notifications_collection.count_documents({"sent": "pending"})
            sent_count = await mongodb_service.notifications_collection.count_documents({"sent": "sent"})
            failed_count = await mongodb_service.notifications_collection.count_documents({"sent": "failed"})
            
            logger.info(f"\n📈 Notification Status Summary:")
            logger.info(f"   Pending: {pending_count}")
            logger.info(f"   Sent: {sent_count}")
            logger.info(f"   Failed: {failed_count}")
            
        else:
            logger.warning("⚠️ Notifications collection does not exist yet")
            
        # Show recipient groups and recipients for reference
        await show_recipient_info()
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        
    finally:
        await mongodb_service.disconnect()

async def show_recipient_info():
    """Show available recipient groups and recipients"""
    
    # Show recipient groups
    groups_count = await mongodb_service.recipient_groups_collection.count_documents({})
    logger.info(f"\n👥 Recipient Groups ({groups_count}):")
    
    if groups_count > 0:
        cursor = mongodb_service.recipient_groups_collection.find({})
        groups = await cursor.to_list(length=None)
        
        for group in groups:
            recipients_count = len(group.get('recipients', []))
            logger.info(f"   @{group.get('name')} - {recipients_count} recipients")
    
    # Show recipients
    recipients_count = await mongodb_service.recipients_collection.count_documents({})
    logger.info(f"\n📧 Recipients ({recipients_count}):")
    
    if recipients_count > 0:
        cursor = mongodb_service.recipients_collection.find({}).limit(5)
        recipients = await cursor.to_list(length=5)
        
        for recipient in recipients:
            logger.info(f"   {recipient.get('name')} <{recipient.get('email')}>")
        
        if recipients_count > 5:
            logger.info(f"   ... and {recipients_count - 5} more")

if __name__ == "__main__":
    asyncio.run(verify_notifications_collection())

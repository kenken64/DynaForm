#!/usr/bin/env python3
"""
Debug script to check recipient groups and recipients in MongoDB
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

async def debug_recipient_data():
    """Debug recipient groups and recipients in the database"""
    
    try:
        # Connect to MongoDB
        await mongodb_service.connect()
        
        # Check recipient groups
        logger.info("📋 Checking recipientGroups collection...")
        groups_cursor = mongodb_service.recipient_groups_collection.find({})
        groups = await groups_cursor.to_list(length=None)
        
        logger.info(f"📊 Found {len(groups)} recipient groups:")
        for group in groups:
            logger.info(f"  🔸 Group ID: {group.get('_id')}")
            logger.info(f"     Name: '{group.get('name')}'")
            logger.info(f"     Alias Name: '{group.get('aliasName')}'") 
            logger.info(f"     Recipients: {group.get('recipients', [])}")
            logger.info(f"     Raw document: {group}")
            logger.info("")
        
        # Check recipients
        logger.info("👥 Checking recipients collection...")
        recipients_cursor = mongodb_service.recipients_collection.find({})
        recipients = await recipients_cursor.to_list(length=None)
        
        logger.info(f"📊 Found {len(recipients)} recipients:")
        for recipient in recipients:
            logger.info(f"  🔸 Recipient ID: {recipient.get('_id')}")
            logger.info(f"     Name: '{recipient.get('name')}'")
            logger.info(f"     Email: '{recipient.get('email')}'")
            logger.info(f"     Raw document: {recipient}")
            logger.info("")
        
        # Test the exact query that's failing
        logger.info("🔍 Testing the exact query used in the code...")
        test_alias = "Family"
        test_query = {"name": {"$regex": f"^{test_alias}$", "$options": "i"}}
        logger.info(f"🔍 Query: {test_query}")
        
        result = await mongodb_service.recipient_groups_collection.find_one(test_query)
        if result:
            logger.info(f"✅ Query found group: {result}")
        else:
            logger.info(f"❌ Query found no results")
            
            # Try alternative queries
            logger.info("🔍 Trying alternative queries...")
            
            # Try aliasName field
            alt_query1 = {"aliasName": {"$regex": f"^{test_alias}$", "$options": "i"}}
            logger.info(f"🔍 Alternative query 1 (aliasName): {alt_query1}")
            result1 = await mongodb_service.recipient_groups_collection.find_one(alt_query1)
            if result1:
                logger.info(f"✅ Alternative query 1 found: {result1}")
            else:
                logger.info(f"❌ Alternative query 1 found no results")
            
            # Try case-sensitive name match
            alt_query2 = {"name": test_alias}
            logger.info(f"🔍 Alternative query 2 (exact name): {alt_query2}")
            result2 = await mongodb_service.recipient_groups_collection.find_one(alt_query2)
            if result2:
                logger.info(f"✅ Alternative query 2 found: {result2}")
            else:
                logger.info(f"❌ Alternative query 2 found no results")
            
            # Try partial match
            alt_query3 = {"name": {"$regex": test_alias, "$options": "i"}}
            logger.info(f"🔍 Alternative query 3 (partial match): {alt_query3}")
            result3 = await mongodb_service.recipient_groups_collection.find_one(alt_query3)
            if result3:
                logger.info(f"✅ Alternative query 3 found: {result3}")
            else:
                logger.info(f"❌ Alternative query 3 found no results")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        logger.exception("Full exception details:")
        
    finally:
        await mongodb_service.disconnect()

if __name__ == "__main__":
    asyncio.run(debug_recipient_data())

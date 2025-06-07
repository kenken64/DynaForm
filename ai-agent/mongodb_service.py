import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from typing import Optional, Dict, Any, List
import logging
from config import config

logger = logging.getLogger(__name__)

class MongoDBService:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.forms_collection = None
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(config.MONGODB_URI)
            self.db = self.client[config.MONGODB_DATABASE]
            self.forms_collection = self.db[config.FORMS_COLLECTION]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {config.MONGODB_URI}")
            return True
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def get_form_by_id(self, form_id: str) -> Optional[Dict[str, Any]]:
        """Get form document by form ID"""
        try:
            if self.forms_collection is None:
                await self.connect()
            
            form = await self.forms_collection.find_one({"_id": form_id})
            if form:
                logger.info(f"Found form with ID: {form_id}")
                return form
            else:
                logger.warning(f"No form found with ID: {form_id}")
                return None
        except Exception as e:
            logger.error(f"Error fetching form {form_id}: {e}")
            return None
    
    async def get_all_forms(self) -> List[Dict[str, Any]]:
        """Get all forms from the collection"""
        try:
            if self.forms_collection is None:
                await self.connect()
            
            cursor = self.forms_collection.find({})
            forms = await cursor.to_list(length=100)  # Limit to 100 forms
            logger.info(f"Retrieved {len(forms)} forms from database")
            return forms
        except Exception as e:
            logger.error(f"Error fetching all forms: {e}")
            return []
    
    async def get_form_fingerprint(self, form_id: str) -> Optional[str]:
        """Get the JSON fingerprint for a specific form"""
        try:
            form = await self.get_form_by_id(form_id)
            if form and 'metadata' in form and 'jsonFingerprint' in form['metadata']:
                fingerprint = form['metadata']['jsonFingerprint']
                logger.info(f"Retrieved fingerprint for form {form_id}: {fingerprint}")
                return fingerprint
            else:
                logger.warning(f"No fingerprint found for form {form_id}")
                return None
        except Exception as e:
            logger.error(f"Error getting fingerprint for form {form_id}: {e}")
            return None
    
    async def search_forms_by_name(self, name_pattern: str) -> List[Dict[str, Any]]:
        """Search forms by name pattern"""
        try:
            if self.forms_collection is None:
                await self.connect()
            
            regex_pattern = {"$regex": name_pattern, "$options": "i"}
            cursor = self.forms_collection.find({
                "$or": [
                    {"metadata.formName": regex_pattern},
                    {"metadata.title": regex_pattern}
                ]
            })
            forms = await cursor.to_list(length=50)
            logger.info(f"Found {len(forms)} forms matching pattern: {name_pattern}")
            return forms
        except Exception as e:
            logger.error(f"Error searching forms by name {name_pattern}: {e}")
            return []

# Global instance
mongodb_service = MongoDBService()
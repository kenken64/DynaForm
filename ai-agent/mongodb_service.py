import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from typing import Optional, Dict, Any, List
import logging
import hashlib
import json
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
            
            # Import ObjectId here to handle MongoDB ObjectId conversion
            from bson import ObjectId
            
            # Try to convert to ObjectId if it looks like one
            try:
                if len(form_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in form_id):
                    form = await self.forms_collection.find_one({"_id": ObjectId(form_id)})
                else:
                    form = await self.forms_collection.find_one({"_id": form_id})
            except Exception:
                # Fallback to string search
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
    
    def _generate_json_fingerprint(self, form_data: Dict[str, Any]) -> str:
        """Generate a JSON fingerprint from form data"""
        try:
            # Create a canonical representation of the form structure
            canonical_data = {
                "formData": form_data.get("formData", []),
                "originalJson": form_data.get("originalJson", {}),
                "metadata": {
                    "formName": form_data.get("metadata", {}).get("formName", ""),
                    "version": form_data.get("metadata", {}).get("version", "1.0.0")
                }
            }
            
            # Convert to JSON string with sorted keys for consistency
            json_string = json.dumps(canonical_data, sort_keys=True, separators=(',', ':'))
            
            # Generate SHA256 hash
            fingerprint = hashlib.sha256(json_string.encode('utf-8')).hexdigest()
            logger.info(f"Generated JSON fingerprint: {fingerprint}")
            return fingerprint
            
        except Exception as e:
            logger.error(f"Error generating JSON fingerprint: {e}")
            # Fallback to a simple hash of the form ID and current timestamp
            import time
            fallback_data = f"{form_data.get('_id', 'unknown')}_{int(time.time())}"
            return hashlib.sha256(fallback_data.encode('utf-8')).hexdigest()

    async def get_form_fingerprint(self, form_id: str) -> Optional[str]:
        """Get the JSON fingerprint for a specific form, generate if not found"""
        try:
            form = await self.get_form_by_id(form_id)
            if form:
                # Check for fingerprint in pdfMetadata.hashes.json_fingerprint (new location)
                if 'pdfMetadata' in form and 'hashes' in form['pdfMetadata'] and 'json_fingerprint' in form['pdfMetadata']['hashes']:
                    fingerprint = form['pdfMetadata']['hashes']['json_fingerprint']
                    logger.info(f"Retrieved existing fingerprint for form {form_id}: {fingerprint}")
                    return fingerprint
                # Fallback to old location for backward compatibility
                elif 'metadata' in form and 'jsonFingerprint' in form['metadata']:
                    fingerprint = form['metadata']['jsonFingerprint']
                    logger.info(f"Retrieved fingerprint (legacy) for form {form_id}: {fingerprint}")
                    return fingerprint
                else:
                    # Generate fingerprint if not found
                    logger.info(f"No existing fingerprint found for form {form_id}, generating new one...")
                    fingerprint = self._generate_json_fingerprint(form)
                    
                    # Optionally save the generated fingerprint back to the database
                    try:
                        from bson import ObjectId
                        if len(form_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in form_id):
                            update_result = await self.forms_collection.update_one(
                                {"_id": ObjectId(form_id)},
                                {"$set": {"pdfMetadata.hashes.json_fingerprint": fingerprint}}
                            )
                            if update_result.modified_count > 0:
                                logger.info(f"Saved generated fingerprint to database for form {form_id}")
                            else:
                                logger.warning(f"Failed to save generated fingerprint to database for form {form_id}")
                    except Exception as save_error:
                        logger.warning(f"Could not save generated fingerprint to database: {save_error}")
                    
                    logger.info(f"Generated fingerprint for form {form_id}: {fingerprint}")
                    return fingerprint
            else:
                logger.warning(f"No form found with ID: {form_id}")
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
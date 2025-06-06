import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
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
    
    def _generate_json_fingerprint(self, form_data: Dict[str, Any]) -> str:
        """Generate a JSON fingerprint for form data that doesn't have existing fingerprints"""
        try:
            # Create a simplified form structure for fingerprinting
            fingerprint_data = {
                'formData': form_data.get('formData', []),
                'fieldConfigurations': form_data.get('fieldConfigurations', {}),
                'originalJson': form_data.get('originalJson', {}),
                'metadata': {
                    'formName': form_data.get('metadata', {}).get('formName', ''),
                    'version': form_data.get('metadata', {}).get('version', '1.0.0')
                }
            }
            
            # Sort keys and create deterministic JSON string
            fingerprint_json = json.dumps(fingerprint_data, sort_keys=True, separators=(',', ':'))
            
            # Generate SHA256 hash
            hash_value = hashlib.sha256(fingerprint_json.encode('utf-8')).hexdigest()
            
            # Return first 16 characters as fingerprint
            fingerprint = hash_value[:16]
            logger.info(f"Generated JSON fingerprint: {fingerprint}")
            return fingerprint
            
        except Exception as e:
            logger.error(f"Error generating JSON fingerprint: {e}")
            # Return a fallback fingerprint based on form ID
            fallback = hashlib.md5(str(form_data.get('_id', 'unknown')).encode()).hexdigest()[:16]
            logger.warning(f"Using fallback fingerprint: {fallback}")
            return fallback
    
    async def get_form_by_id(self, form_id: str) -> Optional[Dict[str, Any]]:
        """Get form document by form ID"""
        try:
            if self.forms_collection is None:
                await self.connect()
            
            # Try to convert string to ObjectId for MongoDB lookup
            try:
                object_id = ObjectId(form_id)
                form = await self.forms_collection.find_one({"_id": object_id})
            except Exception:
                # If ObjectId conversion fails, try as string
                form = await self.forms_collection.find_one({"_id": form_id})
            
            if form:
                # Convert ObjectId to string for JSON serialization
                if '_id' in form and isinstance(form['_id'], ObjectId):
                    form['_id'] = str(form['_id'])
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
            
            # Convert ObjectIds to strings for JSON serialization
            for form in forms:
                if '_id' in form and isinstance(form['_id'], ObjectId):
                    form['_id'] = str(form['_id'])
            
            logger.info(f"Retrieved {len(forms)} forms from database")
            return forms
        except Exception as e:
            logger.error(f"Error fetching all forms: {e}")
            return []
    
    async def get_form_fingerprint(self, form_id: str) -> Optional[str]:
        """Get the JSON fingerprint for a specific form, generating one if it doesn't exist"""
        try:
            form = await self.get_form_by_id(form_id)
            if not form:
                logger.warning(f"Form {form_id} not found")
                return None
            
            # Check for existing fingerprint in metadata
            if form.get('metadata', {}).get('jsonFingerprint'):
                fingerprint = form['metadata']['jsonFingerprint']
                logger.info(f"Retrieved existing fingerprint for form {form_id}: {fingerprint}")
                return fingerprint
            
            # Check for fingerprint in pdfMetadata hashes
            if form.get('pdfMetadata', {}).get('hashes', {}).get('json_fingerprint'):
                fingerprint = form['pdfMetadata']['hashes']['json_fingerprint']
                logger.info(f"Retrieved PDF fingerprint for form {form_id}: {fingerprint}")
                return fingerprint
            
            # Generate new fingerprint if none exists
            logger.info(f"No existing fingerprint found for form {form_id}, generating new one")
            fingerprint = self._generate_json_fingerprint(form)
            
            # Update the form with the generated fingerprint
            await self.update_form_fingerprint(form_id, fingerprint)
            
            return fingerprint
            
        except Exception as e:
            logger.error(f"Error getting fingerprint for form {form_id}: {e}")
            return None
    
    async def update_form_fingerprint(self, form_id: str, fingerprint: str) -> bool:
        """Update a form with a generated JSON fingerprint"""
        try:
            if self.forms_collection is None:
                await self.connect()
            
            # Try to convert string to ObjectId for MongoDB lookup
            try:
                object_id = ObjectId(form_id)
                filter_query = {"_id": object_id}
            except Exception:
                filter_query = {"_id": form_id}
            
            # Update the form with the fingerprint in metadata
            update_query = {
                "$set": {
                    "metadata.jsonFingerprint": fingerprint,
                    "metadata.updatedAt": json.dumps({"$date": {"$numberLong": str(int(__import__('time').time() * 1000))}})
                }
            }
            
            result = await self.forms_collection.update_one(filter_query, update_query)
            
            if result.modified_count > 0:
                logger.info(f"Successfully updated form {form_id} with fingerprint {fingerprint}")
                return True
            else:
                logger.warning(f"No form updated for ID {form_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating form {form_id} with fingerprint: {e}")
            return False

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
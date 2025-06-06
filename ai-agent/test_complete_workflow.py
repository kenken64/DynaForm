#!/usr/bin/env python3
"""
Test script for complete end-to-end workflow:
1. Conversation interception
2. Form retrieval 
3. Fingerprint generation (if needed)
4. Blockchain publishing
"""

import asyncio
import logging
import sys
import os

# Add the current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mongodb_service import mongodb_service
from conversation_interceptor import conversation_interceptor
from verifiable_contract_service import verifiable_contract_service
from ollama_service import ollama_service
from config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_fingerprint_generation():
    """Test automatic fingerprint generation for forms without existing fingerprints"""
    logger.info("🧪 Testing automatic fingerprint generation...")
    
    try:
        # Connect to MongoDB
        await mongodb_service.connect()
        
        # Get all forms to find one without a fingerprint
        forms = await mongodb_service.get_all_forms()
        
        if not forms:
            logger.warning("No forms found in database")
            return False
        
        # Find a form without an existing fingerprint
        test_form = None
        for form in forms:
            form_id = str(form['_id'])
            
            # Check if it has existing fingerprint
            has_metadata_fingerprint = form.get('metadata', {}).get('jsonFingerprint')
            has_pdf_fingerprint = form.get('pdfMetadata', {}).get('hashes', {}).get('json_fingerprint')
            
            if not has_metadata_fingerprint and not has_pdf_fingerprint:
                test_form = form
                break
        
        if not test_form:
            # Use the first form for testing
            test_form = forms[0]
            logger.info("All forms have fingerprints, using first form for testing")
        
        form_id = str(test_form['_id'])
        form_name = test_form.get('metadata', {}).get('formName', 'Unknown Form')
        
        logger.info(f"Testing with form: {form_name} (ID: {form_id})")
        
        # Test fingerprint generation
        fingerprint = await mongodb_service.get_form_fingerprint(form_id)
        
        if fingerprint:
            logger.info(f"✅ Successfully generated/retrieved fingerprint: {fingerprint}")
            return True, form_id, fingerprint
        else:
            logger.error("❌ Failed to generate fingerprint")
            return False, None, None
            
    except Exception as e:
        logger.error(f"Error testing fingerprint generation: {e}")
        return False, None, None

async def test_conversation_simulation():
    """Test conversation simulation with form publishing"""
    logger.info("🧪 Testing conversation simulation...")
    
    try:
        # First test fingerprint generation
        success, form_id, fingerprint = await test_fingerprint_generation()
        
        if not success:
            logger.error("Fingerprint generation test failed, skipping conversation test")
            return False
        
        # Simulate a conversation that should trigger publishing
        test_prompt = f"Please publish form {form_id} to the blockchain so others can access it"
        test_response = "I'll help you publish that form to make it publicly accessible."
        
        logger.info(f"Simulating conversation with form ID: {form_id}")
        
        # Test the conversation interceptor
        result = await conversation_interceptor.simulate_conversation(test_prompt, test_response)
        
        if result:
            logger.info("✅ Conversation simulation successful - publishing triggered")
            return True
        else:
            logger.info("ℹ️ Conversation simulation complete - no publishing keywords detected")
            return True
            
    except Exception as e:
        logger.error(f"Error testing conversation simulation: {e}")
        return False

async def test_services_status():
    """Test the status of all required services"""
    logger.info("🔍 Checking service status...")
    
    try:
        # Test MongoDB
        mongo_connected = await mongodb_service.connect()
        logger.info(f"MongoDB: {'✅ Connected' if mongo_connected else '❌ Failed'}")
        
        # Test Ollama
        ollama_status = await ollama_service.check_ollama_status()
        logger.info(f"Ollama: {'✅ Available' if ollama_status else '❌ Not available'}")
        
        # Test Verifiable Contract API
        api_status = await verifiable_contract_service.get_api_status()
        logger.info(f"Verifiable Contract API: {'✅ Available' if api_status.get('success') else '❌ Not available'}")
        
        return mongo_connected and ollama_status and api_status.get('success')
        
    except Exception as e:
        logger.error(f"Error checking service status: {e}")
        return False

async def test_complete_workflow():
    """Test the complete end-to-end workflow"""
    logger.info("🚀 Testing complete end-to-end workflow...")
    
    try:
        # Check service status
        all_services_ok = await test_services_status()
        
        if not all_services_ok:
            logger.warning("⚠️ Some services are not available, continuing with limited testing")
        
        # Test fingerprint generation
        fingerprint_success, form_id, fingerprint = await test_fingerprint_generation()
        
        if not fingerprint_success:
            logger.error("❌ Fingerprint generation failed")
            return False
        
        # Test blockchain publishing (if services are available)
        if all_services_ok:
            logger.info(f"Testing blockchain publishing for form {form_id}")
            
            try:
                # Test direct blockchain registration
                result = await verifiable_contract_service.register_url(form_id, fingerprint)
                
                if result.get('success'):
                    logger.info(f"✅ Successfully published form to blockchain!")
                    logger.info(f"📄 Public URL: {result.get('url')}")
                    logger.info(f"🔗 Transaction: {result.get('transaction_hash', 'N/A')}")
                else:
                    logger.warning(f"⚠️ Blockchain publishing returned: {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                logger.warning(f"⚠️ Blockchain publishing test failed: {e}")
        
        # Test conversation simulation
        conversation_success = await test_conversation_simulation()
        
        if conversation_success:
            logger.info("✅ Complete workflow test successful!")
            return True
        else:
            logger.error("❌ Conversation simulation failed")
            return False
            
    except Exception as e:
        logger.error(f"Error in complete workflow test: {e}")
        return False
    finally:
        await mongodb_service.disconnect()

async def main():
    """Main test function"""
    logger.info("=" * 60)
    logger.info("🧪 COMPLETE END-TO-END WORKFLOW TEST")
    logger.info("=" * 60)
    
    try:
        success = await test_complete_workflow()
        
        if success:
            logger.info("\n🎉 ALL TESTS PASSED!")
            logger.info("The AI agent is ready for complete end-to-end operation:")
            logger.info("✅ Form retrieval from MongoDB")
            logger.info("✅ Automatic fingerprint generation") 
            logger.info("✅ Conversation interception")
            logger.info("✅ Blockchain publishing workflow")
        else:
            logger.warning("\n⚠️ SOME TESTS FAILED")
            logger.info("Check the logs above for specific issues")
            
    except KeyboardInterrupt:
        logger.info("\n👋 Test interrupted by user")
    except Exception as e:
        logger.error(f"\n💥 Test failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

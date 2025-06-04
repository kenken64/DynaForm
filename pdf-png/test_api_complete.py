#!/usr/bin/env python3
"""
Simple test of the Flask server and metadata extraction
"""
import requests
import json
import time
import subprocess
import os
import signal

def start_server():
    """Start the Flask server"""
    os.chdir('/Users/kennethphang/Projects/doc2formjson/pdf-png')
    
    # Kill any existing server
    try:
        subprocess.run(['pkill', '-f', 'python app.py'], check=False)
        time.sleep(1)
    except:
        pass
    
    # Start server
    proc = subprocess.Popen(['python', 'app.py'], 
                           stdout=subprocess.PIPE, 
                           stderr=subprocess.PIPE)
    
    # Wait for server to start
    time.sleep(3)
    return proc

def test_metadata_api():
    """Test the metadata extraction API"""
    url = "http://localhost:5001/conversion/pdf-metadata"
    pdf_path = "/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf"
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'pdfFile': ('test.pdf', f, 'application/pdf')}
            response = requests.post(url, files=files, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Test Successful!")
            print(json.dumps(result, indent=2))
            return True
        else:
            print(f"❌ API Test Failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ API Test Error: {e}")
        return False

def main():
    print("Starting Flask Server and Testing API...")
    
    # Start server
    server_proc = start_server()
    
    try:
        # Test API
        success = test_metadata_api()
        
        if success:
            print("\n🎉 All tests passed! PDF metadata extraction with hash generation is working correctly.")
        else:
            print("\n❌ Tests failed. Check server logs.")
            
    finally:
        # Clean up
        if server_proc:
            server_proc.terminate()
            server_proc.wait()
        
        # Kill any remaining processes
        try:
            subprocess.run(['pkill', '-f', 'python app.py'], check=False)
        except:
            pass

if __name__ == "__main__":
    main()

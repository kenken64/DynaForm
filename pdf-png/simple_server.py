#!/usr/bin/env python3
"""
Simple test server for PDF metadata extraction
"""
import os
import io
import json
from flask import Flask, request, jsonify, render_template
import PyPDF2
from datetime import datetime

app = Flask(__name__)

def extract_pdf_metadata(pdf_bytes):
    """Extract metadata from PDF bytes"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        metadata = pdf_reader.metadata
        
        if not metadata:
            return {"message": "No metadata found in PDF"}
        
        extracted_metadata = {}
        
        # Extract common metadata fields
        if '/Title' in metadata:
            extracted_metadata['title'] = metadata['/Title']
        if '/Author' in metadata:
            extracted_metadata['author'] = metadata['/Author']
        if '/Subject' in metadata:
            extracted_metadata['subject'] = metadata['/Subject']
        if '/Creator' in metadata:
            extracted_metadata['creator'] = metadata['/Creator']
        if '/Producer' in metadata:
            extracted_metadata['producer'] = metadata['/Producer']
        
        # Handle dates
        for date_field, key in [('/CreationDate', 'creation_date'), ('/ModDate', 'modification_date')]:
            if date_field in metadata:
                date_value = metadata[date_field]
                try:
                    if date_value.startswith('D:'):
                        date_str = date_value[2:16]
                        parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                        extracted_metadata[key] = parsed_date.isoformat()
                    else:
                        extracted_metadata[key] = str(date_value)
                except:
                    extracted_metadata[key] = str(date_value)
        
        extracted_metadata['page_count'] = len(pdf_reader.pages)
        
        # Print to console
        print("=" * 50)
        print("PDF METADATA EXTRACTED:")
        print("=" * 50)
        for key, value in extracted_metadata.items():
            print(f"{key.replace('_', ' ').title()}: {value}")
        print("=" * 50)
        
        return extracted_metadata
        
    except Exception as e:
        print(f"Error extracting PDF metadata: {e}")
        return {"error": f"Failed to extract metadata: {str(e)}"}

@app.route('/metadata', methods=['POST'])
def pdf_metadata():
    """Extract and return PDF metadata"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request. Use key 'file'."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400

    if file and file.filename.lower().endswith('.pdf'):
        try:
            pdf_bytes = file.read()
            metadata = extract_pdf_metadata(pdf_bytes)
            
            return jsonify({
                "filename": file.filename,
                "metadata": metadata,
                "message": "PDF metadata extracted successfully"
            }), 200

        except Exception as e:
            return jsonify({"error": "Failed to extract PDF metadata.", "message": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

@app.route('/', methods=['GET'])
def index():
    """Serve the HTML interface"""
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "message": "PDF Metadata Service is active"})

if __name__ == '__main__':
    print("Starting PDF Metadata Service on http://localhost:5002")
    print("Upload a PDF to /metadata endpoint")
    app.run(host='0.0.0.0', port=5002, debug=True)

import os
import io
import base64
from flask import Flask, request, jsonify, send_from_directory
from pdf2image import convert_from_bytes
from werkzeug.utils import secure_filename
from flask_cors import CORS
import uuid
import PyPDF2
from datetime import datetime
import hashlib
import json

app = Flask(__name__)
CORS(app, resources={
    r"/conversion/*": {
        "origins": ["http://localhost:4201", "http://dynaform.xyz", "https://dynaform.xyz"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Configuration
PORT = 5001
GENERATED_IMAGES_DIR = 'generated_pngs'
ALLOWED_EXTENSIONS = {'pdf'}
POPPLER_PATH = None

# Ensure the directory for generated images exists
if not os.path.exists(GENERATED_IMAGES_DIR):
    os.makedirs(GENERATED_IMAGES_DIR)
    print(f"Created directory: {GENERATED_IMAGES_DIR}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_metadata_hash(metadata):
    """Generate various hashes from PDF metadata for identification and comparison"""
    try:
        # Extract key fields for hashing
        title = metadata.get('title', '')
        creator = metadata.get('creator', '')
        producer = metadata.get('producer', '')
        creation_date = metadata.get('creation_date', '')
        modification_date = metadata.get('modification_date', '')
        
        # Concatenate key metadata fields
        metadata_string = f"{title}|{creator}|{producer}|{creation_date}|{modification_date}"
        
        # Generate different types of hashes
        hashes = {}
        
        # MD5 hash
        hashes['md5'] = hashlib.md5(metadata_string.encode('utf-8')).hexdigest()
        
        # SHA1 hash
        hashes['sha1'] = hashlib.sha1(metadata_string.encode('utf-8')).hexdigest()
        
        # SHA256 hash
        hashes['sha256'] = hashlib.sha256(metadata_string.encode('utf-8')).hexdigest()
        
        # Short ID (first 8 characters of SHA256)
        hashes['short_id'] = hashes['sha256'][:8]
        
        # JSON fingerprint hash (for structured comparison)
        json_metadata = json.dumps(metadata, sort_keys=True, default=str)
        hashes['json_fingerprint'] = hashlib.sha256(json_metadata.encode('utf-8')).hexdigest()
        
        # Print hash information to console
        print("METADATA HASHES GENERATED:")
        print("-" * 30)
        for hash_type, hash_value in hashes.items():
            print(f"{hash_type.upper()}: {hash_value}")
        print("-" * 30)
        
        return hashes
        
    except Exception as e:
        print(f"Error generating metadata hash: {e}")
        return {"error": f"Failed to generate hash: {str(e)}"}

def extract_pdf_metadata(pdf_bytes):
    """Extract metadata from PDF bytes"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        metadata = pdf_reader.metadata
        
        if not metadata:
            print("No metadata found in PDF")
            return {"message": "No metadata found in PDF"}
        
        # Extract common metadata fields
        extracted_metadata = {}
        
        # Title
        if '/Title' in metadata:
            extracted_metadata['title'] = metadata['/Title']
        
        # Author
        if '/Author' in metadata:
            extracted_metadata['author'] = metadata['/Author']
        
        # Subject
        if '/Subject' in metadata:
            extracted_metadata['subject'] = metadata['/Subject']
        
        # Creator (application that created the PDF)
        if '/Creator' in metadata:
            extracted_metadata['creator'] = metadata['/Creator']
        
        # Producer (application that produced the PDF)
        if '/Producer' in metadata:
            extracted_metadata['producer'] = metadata['/Producer']
        
        # Creation date
        if '/CreationDate' in metadata:
            creation_date = metadata['/CreationDate']
            try:
                # PDF dates are in format D:YYYYMMDDHHmmSSOHH'mm'
                if creation_date.startswith('D:'):
                    date_str = creation_date[2:16]  # Extract YYYYMMDDHHMMSS
                    parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                    extracted_metadata['creation_date'] = parsed_date.isoformat()
                else:
                    extracted_metadata['creation_date'] = str(creation_date)
            except:
                extracted_metadata['creation_date'] = str(creation_date)
        
        # Modification date
        if '/ModDate' in metadata:
            mod_date = metadata['/ModDate']
            try:
                if mod_date.startswith('D:'):
                    date_str = mod_date[2:16]  # Extract YYYYMMDDHHMMSS
                    parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                    extracted_metadata['modification_date'] = parsed_date.isoformat()
                else:
                    extracted_metadata['modification_date'] = str(mod_date)
            except:
                extracted_metadata['modification_date'] = str(mod_date)
        
        # Additional info
        extracted_metadata['page_count'] = len(pdf_reader.pages)
        
        # Generate hashes from metadata
        metadata_hashes = generate_metadata_hash(extracted_metadata)
        extracted_metadata['hashes'] = metadata_hashes
        
        # Print metadata to console
        print("=" * 50)
        print("PDF METADATA EXTRACTED:")
        print("=" * 50)
        for key, value in extracted_metadata.items():
            if key != 'hashes':  # Print hashes separately
                print(f"{key.replace('_', ' ').title()}: {value}")
        print("=" * 50)
        
        return extracted_metadata
        
    except Exception as e:
        print(f"Error extracting PDF metadata: {e}")
        return {"error": f"Failed to extract metadata: {str(e)}"}

@app.route('/conversion/pdf-metadata', methods=['POST'])
def pdf_metadata():
    """Extract and return PDF metadata"""
    if 'pdfFile' not in request.files:
        return jsonify({"error": "No PDF file part in the request. Use key 'pdfFile'."}), 400

    file = request.files['pdfFile']

    if file.filename == '':
        return jsonify({"error": "No PDF file selected."}), 400

    if file and allowed_file(file.filename):
        try:
            pdf_bytes = file.read()
            metadata = extract_pdf_metadata(pdf_bytes)
            
            return jsonify({
                "filename": file.filename,
                "metadata": metadata,
                "message": "PDF metadata extracted successfully"
            }), 200

        except Exception as e:
            app.logger.error(f"Error during PDF metadata extraction: {e}")
            return jsonify({"error": "Failed to extract PDF metadata.", "message": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

@app.route('/conversion/pdf-to-png-save', methods=['POST'])
def pdf_to_png_save():
    if 'pdfFile' not in request.files:
        return jsonify({"error": "No PDF file part in the request. Use key 'pdfFile'."}), 400

    file = request.files['pdfFile']

    if file.filename == '':
        return jsonify({"error": "No PDF file selected."}), 400

    if file and allowed_file(file.filename):
        original_filename_base = os.path.splitext(secure_filename(file.filename))[0]
        unique_subdir_name = str(uuid.uuid4())
        output_dir_for_this_pdf = os.path.join(GENERATED_IMAGES_DIR, unique_subdir_name)
        os.makedirs(output_dir_for_this_pdf, exist_ok=True)

        try:
            pdf_bytes = file.read()
            
            # Extract and print metadata
            metadata = extract_pdf_metadata(pdf_bytes)
            
            images = convert_from_bytes(
                pdf_bytes,
                dpi=200,
                fmt='png',
                thread_count=4,
                poppler_path=POPPLER_PATH
            )

            if not images:
                return jsonify({"error": "Could not convert PDF to images. The PDF might be empty or corrupted."}), 500

            saved_file_paths = []
            saved_file_urls = []

            for i, image in enumerate(images):
                output_filename = f"{original_filename_base}_page_{i + 1}.png"
                output_filepath = os.path.join(output_dir_for_this_pdf, output_filename)

                image.save(output_filepath, 'PNG')
                saved_file_paths.append(output_filepath)

                file_url = f"/conversion/generated_images/{unique_subdir_name}/{output_filename}"
                saved_file_urls.append(request.host_url.rstrip('/') + file_url)

            return jsonify({
                "message": f"Successfully converted PDF to {len(saved_file_paths)} PNG images.",
                "saved_files_count": len(saved_file_paths),
                "output_directory_on_server": output_dir_for_this_pdf,
                "saved_file_paths_on_server": saved_file_paths,
                "accessible_urls": saved_file_urls,
                "metadata": metadata
            }), 200

        except Exception as e:
            app.logger.error(f"Error during PDF conversion and save: {e}")
            return jsonify({"error": "Failed to convert PDF and save images.", "message": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

@app.route('/conversion/generated_images/<path:subpath_to_file>')
def serve_generated_image(subpath_to_file):
    return send_from_directory(GENERATED_IMAGES_DIR, subpath_to_file)

@app.route('/conversion/health-check', methods=['GET'])
def index():
    return f"""
    <h1>PDF to PNG Conversion API (Flask)</h1>
    <h2>Option 1: Get Base64 Images (JSON Response)</h2>
    <p>Send a POST request to <code>/api/pdf-to-png</code> (from previous example) with a PDF file (key <code>pdfFile</code>).</p>
    
    <h2>Option 2: Save Images on Server & Get Info (JSON Response)</h2>
    <p>Send a POST request to <code>/conversion/pdf-to-png-save</code> with a PDF file (key <code>pdfFile</code>).</p>
    <p>PNG images will be saved in the '{GENERATED_IMAGES_DIR}' directory on the server within a unique subfolder.</p>
    
    <h2>Option 3: Extract PDF Metadata (JSON Response)</h2>
    <p>Send a POST request to <code>/conversion/pdf-metadata</code> with a PDF file (key <code>pdfFile</code>).</p>
    <p>Returns metadata including title, author, creation date, modification date, and more.</p>
    
    <h3>Example using cURL for saving on server:</h3>
    <pre>
curl -X POST \\
     -F "pdfFile=@/path/to/your/document.pdf" \\
     http://localhost:{PORT}/conversion/pdf-to-png-save
    </pre>
    
    <h3>Example using cURL for metadata extraction:</h3>
    <pre>
curl -X POST \\
     -F "pdfFile=@/path/to/your/document.pdf" \\
     http://localhost:{PORT}/conversion/pdf-metadata
    </pre>
    
    <p>If you enable the '/generated_images/' route, you can access saved images via URLs provided in the response.</p>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
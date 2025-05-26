import os
import io
import base64
from flask import Flask, request, jsonify, send_from_directory # Added send_from_directory
from pdf2image import convert_from_bytes
from werkzeug.utils import secure_filename
import tempfile
import uuid # For generating unique filenames/directories

app = Flask(__name__)

# Configuration
PORT = 5001
# Directory to save the generated PNG images
# Ensure this directory exists and your application has write permissions to it.
# For simplicity, create it in the same directory as app.py or use an absolute path.
GENERATED_IMAGES_DIR = 'generated_pngs'
ALLOWED_EXTENSIONS = {'pdf'}
POPPLER_PATH = None # Set if Poppler is not in PATH

# Ensure the directory for generated images exists
if not os.path.exists(GENERATED_IMAGES_DIR):
    os.makedirs(GENERATED_IMAGES_DIR)
    print(f"Created directory: {GENERATED_IMAGES_DIR}")

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/pdf-to-png-save', methods=['POST'])
def pdf_to_png_save():
    if 'pdfFile' not in request.files:
        return jsonify({"error": "No PDF file part in the request. Use key 'pdfFile'."}), 400

    file = request.files['pdfFile']

    if file.filename == '':
        return jsonify({"error": "No PDF file selected."}), 400

    if file and allowed_file(file.filename):
        original_filename_base = os.path.splitext(secure_filename(file.filename))[0]
        # Create a unique subdirectory for this conversion's images to avoid filename clashes
        unique_subdir_name = str(uuid.uuid4())
        output_dir_for_this_pdf = os.path.join(GENERATED_IMAGES_DIR, unique_subdir_name)
        os.makedirs(output_dir_for_this_pdf, exist_ok=True)

        try:
            pdf_bytes = file.read()
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
            saved_file_urls = [] # If you want to serve them later

            for i, image in enumerate(images):
                # Create a filename for each page
                output_filename = f"{original_filename_base}_page_{i + 1}.png"
                output_filepath = os.path.join(output_dir_for_this_pdf, output_filename)

                # Save the PIL image object directly to a file
                image.save(output_filepath, 'PNG')
                saved_file_paths.append(output_filepath)

                # Construct a URL if you plan to serve these files
                # This assumes you'll set up a route to serve files from GENERATED_IMAGES_DIR
                file_url = f"/generated_images/{unique_subdir_name}/{output_filename}"
                saved_file_urls.append(request.host_url.rstrip('/') + file_url)


            return jsonify({
                "message": f"Successfully converted PDF to {len(saved_file_paths)} PNG images.",
                "saved_files_count": len(saved_file_paths),
                "output_directory_on_server": output_dir_for_this_pdf, # Path on the server
                "saved_file_paths_on_server": saved_file_paths, # Full paths on the server
                "accessible_urls": saved_file_urls # URLs if serving static files
            }), 200

        except Exception as e:
            app.logger.error(f"Error during PDF conversion and save: {e}")
            return jsonify({"error": "Failed to convert PDF and save images.", "message": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

# Optional: Add a route to serve the generated images
# This is a simple way for development/testing. For production, use a proper web server (Nginx, Apache)
# to serve static files.
@app.route('/generated_images/<path:subpath_to_file>')
def serve_generated_image(subpath_to_file):
    # subpath_to_file will be like "unique_subdir_name/original_filename_base_page_1.png"
    return send_from_directory(GENERATED_IMAGES_DIR, subpath_to_file)


@app.route('/', methods=['GET'])
def index():
    return f"""
    <h1>PDF to PNG Conversion API (Flask)</h1>
    <h2>Option 1: Get Base64 Images (JSON Response)</h2>
    <p>Send a POST request to <code>/api/pdf-to-png</code> (from previous example) with a PDF file (key <code>pdfFile</code>).</p>
    
    <h2>Option 2: Save Images on Server & Get Info (JSON Response)</h2>
    <p>Send a POST request to <code>/api/pdf-to-png-save</code> with a PDF file (key <code>pdfFile</code>).</p>
    <p>PNG images will be saved in the '{GENERATED_IMAGES_DIR}' directory on the server within a unique subfolder.</p>
    <h3>Example using cURL for saving on server:</h3>
    <pre>
curl -X POST \\
     -F "pdfFile=@/path/to/your/document.pdf" \\
     http://localhost:{PORT}/api/pdf-to-png-save
    </pre>
    <p>If you enable the '/generated_images/' route, you can access saved images via URLs provided in the response.</p>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
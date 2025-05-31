"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const mongodb_1 = require("mongodb");
// --- Application Configuration from Environment Variables ---
const NODE_ENV = process.env.NODE_ENV || 'development';
// --- MongoDB Configuration from Environment Variables ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'doc2formjson';
// --- Ollama Configuration from Environment Variables ---
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL_NAME = process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen:7b'; // <<< Use variable from .env
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || "3000", 10);
// --- Add JSON body parser middleware ---
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// --- CORS Configuration ---
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// --- MongoDB Connection ---
let db;
let client;
async function connectToMongoDB() {
    try {
        client = new mongodb_1.MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(MONGODB_DB_NAME);
        console.log(`Connected to MongoDB at ${MONGODB_URI}, database: ${MONGODB_DB_NAME}`);
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}
// --- Multer Configuration ---
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
// --- Helper Function to call Ollama ---
async function callOllamaWithImage(imageBase64, prompt, modelName) {
    const payload = {
        model: modelName,
        prompt: prompt,
        images: [imageBase64],
        stream: false,
    };
    console.log(`Sending request to Ollama. Model: ${modelName}. Prompt: "${prompt}". Image: (provided)`);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error from Ollama: ${response.status} ${response.statusText}`);
        console.error("Ollama Response body:", errorBody);
        const err = new Error(`Ollama request failed with status ${response.status}`);
        err.ollamaError = errorBody;
        err.status = response.status;
        throw err;
    }
    const result = await response.json(); // Type assertion
    console.log("Ollama generation complete.");
    return result;
}
// --- Express Endpoint ---
app.post('/api/describe-image', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            // No 'return' here, just send the response and the function continues
            res.status(400).json({ error: 'No image file uploaded. Please include a file with the key "imageFile".' });
            return; // Add a simple return to exit the function after sending the response
        }
        const prompt = req.body.prompt || "Describe this image in detail.";
        const model = req.body.model || DEFAULT_MODEL_NAME;
        console.log(`Received request for model: ${model}, prompt: "${prompt}"`);
        if (model === 'qwen:7b' && model === DEFAULT_MODEL_NAME) {
            console.warn("⚠️ WARNING: You might be using a placeholder model name...");
        }
        const imageBuffer = req.file.buffer;
        const imageBase64 = imageBuffer.toString('base64');
        const ollamaResult = await callOllamaWithImage(imageBase64, prompt, model);
        res.json({
            description: ollamaResult.response,
            modelUsed: ollamaResult.model,
            createdAt: ollamaResult.created_at,
            timings: {
                totalDuration: ollamaResult.total_duration,
                promptEvalDuration: ollamaResult.prompt_eval_duration,
                evalDuration: ollamaResult.eval_duration,
            },
            tokenCounts: {
                promptEvalCount: ollamaResult.prompt_eval_count,
                evalCount: ollamaResult.eval_count,
            }
        });
        // Implicit return undefined here, which matches Promise<void>
    }
    catch (error) {
        console.error('Error processing image description request:', error);
        const typedError = error;
        if (typedError.ollamaError) {
            res.status(typedError.status || 500).json({
                error: 'Failed to get description from Ollama.',
                ollamaDetails: typedError.ollamaError,
                message: typedError.message
            });
            return; // Add a simple return to exit the function after sending the response
        }
        res.status(500).json({ error: 'Internal server error.', message: error.message }); // No 'return' here
        // Implicit return undefined here
    }
});
// --- Save Form Endpoint ---
app.post('/api/save-form', async (req, res) => {
    try {
        const { formData, fieldConfigurations, originalJson, metadata } = req.body;
        // Validate required fields
        if (!formData || !Array.isArray(formData)) {
            res.status(400).json({
                error: 'Invalid form data. Expected formData to be an array.'
            });
            return;
        }
        if (!fieldConfigurations || typeof fieldConfigurations !== 'object') {
            res.status(400).json({
                error: 'Invalid field configurations. Expected fieldConfigurations to be an object.'
            });
            return;
        }
        // Prepare document to save
        const formDocument = {
            formData,
            fieldConfigurations,
            originalJson,
            metadata: {
                createdAt: new Date().toISOString(),
                formName: metadata?.formName || 'Untitled Form',
                version: '1.0.0',
                ...metadata
            }
        };
        // Get collection and insert document
        const collection = db.collection('generated_form');
        const result = await collection.insertOne(formDocument);
        console.log(`Form saved successfully with ID: ${result.insertedId}`);
        res.status(201).json({
            success: true,
            message: 'Form saved successfully',
            formId: result.insertedId,
            savedAt: formDocument.metadata.createdAt
        });
    }
    catch (error) {
        console.error('Error saving form:', error);
        res.status(500).json({
            error: 'Failed to save form',
            message: error.message
        });
    }
});
// --- Get Saved Forms Endpoint with Pagination ---
app.get('/api/forms', async (req, res) => {
    try {
        const collection = db.collection('generated_form');
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        // Get total count
        const totalCount = await collection.countDocuments({});
        // Get paginated forms
        const forms = await collection
            .find({})
            .sort({ 'metadata.createdAt': -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();
        res.status(200).json({
            success: true,
            count: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            forms: forms
        });
    }
    catch (error) {
        console.error('Error retrieving forms:', error);
        res.status(500).json({
            error: 'Failed to retrieve forms',
            message: error.message
        });
    }
});
// --- Get Single Form Endpoint ---
app.get('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const collection = db.collection('generated_form');
        // Use MongoDB ObjectId
        const { ObjectId } = require('mongodb');
        const form = await collection.findOne({ _id: new ObjectId(id) });
        if (!form) {
            res.status(404).json({
                error: 'Form not found',
                message: `No form found with ID: ${id}`
            });
            return;
        }
        res.status(200).json({
            success: true,
            form: form
        });
    }
    catch (error) {
        console.error('Error retrieving form:', error);
        res.status(500).json({
            error: 'Failed to retrieve form',
            message: error.message
        });
    }
});
// --- Search Forms Endpoint ---
app.get('/api/forms/search', async (req, res) => {
    try {
        const collection = db.collection('generated_form');
        const searchQuery = req.query.search || '';
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        // Create search filter
        const searchFilter = searchQuery ? {
            $or: [
                { 'metadata.formName': { $regex: searchQuery, $options: 'i' } },
                { 'formData.name': { $regex: searchQuery, $options: 'i' } }
            ]
        } : {};
        // Get total count for search
        const totalCount = await collection.countDocuments(searchFilter);
        // Get paginated search results
        const forms = await collection
            .find(searchFilter)
            .sort({ 'metadata.createdAt': -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();
        res.status(200).json({
            success: true,
            count: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            forms: forms,
            searchQuery: searchQuery
        });
    }
    catch (error) {
        console.error('Error searching forms:', error);
        res.status(500).json({
            error: 'Failed to search forms',
            message: error.message
        });
    }
});
// --- Delete Form Endpoint ---
app.delete('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const collection = db.collection('generated_form');
        // Use MongoDB ObjectId
        const { ObjectId } = require('mongodb');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            res.status(404).json({
                error: 'Form not found',
                message: `No form found with ID: ${id}`
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Form deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({
            error: 'Failed to delete form',
            message: error.message
        });
    }
});
// --- Save Form Data Endpoint (Upsert to forms_data collection) ---
app.post('/api/forms-data', async (req, res) => {
    try {
        const { formId, formData, formTitle, userInfo, submissionMetadata } = req.body;
        // Validate required fields
        if (!formId) {
            res.status(400).json({
                error: 'Form ID is required'
            });
            return;
        }
        if (!formData || typeof formData !== 'object') {
            res.status(400).json({
                error: 'Invalid form data. Expected formData to be an object.'
            });
            return;
        }
        // Prepare document for upsert
        const formDataDocument = {
            formId: formId,
            formTitle: formTitle || null,
            formData: formData,
            userInfo: userInfo || null,
            submissionMetadata: {
                submittedAt: new Date().toISOString(),
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                ...submissionMetadata
            },
            updatedAt: new Date().toISOString()
        };
        // Get collection and perform upsert
        const collection = db.collection('forms_data');
        // Use upsert based on formId and optionally userInfo
        const filter = userInfo?.userId
            ? { formId: formId, 'userInfo.userId': userInfo.userId }
            : { formId: formId };
        const result = await collection.replaceOne(filter, formDataDocument, { upsert: true });
        console.log(`Form data ${result.upsertedCount > 0 ? 'created' : 'updated'} successfully for form ID: ${formId}`);
        res.status(result.upsertedCount > 0 ? 201 : 200).json({
            success: true,
            message: result.upsertedCount > 0 ? 'Form data saved successfully' : 'Form data updated successfully',
            formId: formId,
            isNewSubmission: result.upsertedCount > 0,
            submittedAt: formDataDocument.submissionMetadata.submittedAt
        });
    }
    catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({
            error: 'Failed to save form data',
            message: error.message
        });
    }
});
// --- Get Form Data Endpoint ---
app.get('/api/forms-data/:formId', async (req, res) => {
    try {
        const { formId } = req.params;
        const { userId } = req.query;
        const collection = db.collection('forms_data');
        // Build filter
        const filter = { formId: formId };
        if (userId) {
            filter['userInfo.userId'] = userId;
        }
        const formData = await collection.findOne(filter);
        if (!formData) {
            res.status(404).json({
                error: 'Form data not found',
                message: `No form data found for form ID: ${formId}`
            });
            return;
        }
        res.status(200).json({
            success: true,
            formData: formData
        });
    }
    catch (error) {
        console.error('Error retrieving form data:', error);
        res.status(500).json({
            error: 'Failed to retrieve form data',
            message: error.message
        });
    }
});
// --- Get All Form Data Submissions for a Form ---
app.get('/api/forms-data/submissions/:formId', async (req, res) => {
    try {
        const { formId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const collection = db.collection('forms_data');
        // Get total count
        const totalCount = await collection.countDocuments({ formId: formId });
        // Get paginated submissions
        const submissions = await collection
            .find({ formId: formId })
            .sort({ 'submissionMetadata.submittedAt': -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();
        res.status(200).json({
            success: true,
            count: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            submissions: submissions
        });
    }
    catch (error) {
        console.error('Error retrieving form submissions:', error);
        res.status(500).json({
            error: 'Failed to retrieve form submissions',
            message: error.message
        });
    }
});
// --- Get All Form Data Submissions (across all forms) ---
app.get('/api/form-data', async (req, res) => {
    try {
        const { formId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const collection = db.collection('forms_data');
        // Build filter - if formId is provided, filter by it
        const filter = formId ? { formId: formId } : {};
        // Get total count
        const totalCount = await collection.countDocuments(filter);
        // Get paginated submissions
        const submissions = await collection
            .find(filter)
            .sort({ 'submissionMetadata.submittedAt': -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();
        res.status(200).json({
            success: true,
            count: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            submissions: submissions
        });
    }
    catch (error) {
        console.error('Error retrieving all form data submissions:', error);
        res.status(500).json({
            error: 'Failed to retrieve form data submissions',
            message: error.message
        });
    }
});
// Health check endpoint
app.get('/api/healthcheck', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'doc2formjson-api',
        version: '1.0.0'
    });
});
app.listen(port, async () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Ollama endpoint configured at: ${OLLAMA_BASE_URL}`);
    console.log(`Default Qwen VL model for API: ${DEFAULT_MODEL_NAME}`);
    if (DEFAULT_MODEL_NAME === 'qwen:7b') {
        console.warn("⚠️ WARNING: Update DEFAULT_MODEL_NAME in src/server.ts.");
    }
    // Connect to MongoDB
    await connectToMongoDB();
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    if (client) {
        await client.close();
        console.log('MongoDB connection closed.');
    }
    process.exit(0);
});
//# sourceMappingURL=server.js.map
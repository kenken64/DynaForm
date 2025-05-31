import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import multer, { Multer } from 'multer';
import { MongoClient, Db, Collection } from 'mongodb';


// --- Application Configuration from Environment Variables ---
const NODE_ENV: string = process.env.NODE_ENV || 'development';

// --- MongoDB Configuration from Environment Variables ---
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME: string = process.env.MONGODB_DB_NAME || 'doc2formjson';

// --- Ollama Configuration from Environment Variables ---
const OLLAMA_BASE_URL: string = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL_NAME: string = process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen:7b'; // <<< Use variable from .env

const app = express();
const port: number = parseInt(process.env.PORT || "3000", 10);

// --- Add JSON body parser middleware ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- CORS Configuration ---
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// --- MongoDB Connection ---
let db: Db;
let client: MongoClient;

async function connectToMongoDB(): Promise<void> {
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(MONGODB_DB_NAME);
        console.log(`Connected to MongoDB at ${MONGODB_URI}, database: ${MONGODB_DB_NAME}`);
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}


// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload: Multer = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Ollama API Response Structure (example, adjust as needed) ---
interface OllamaError extends Error {
    ollamaError?: string;
    status?: number;
}

interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

// --- Form Data Interfaces ---
interface FieldConfiguration {
    mandatory: boolean;
    validation: boolean;
}

interface FormField {
    name: string;
    type: string;
    value?: any;
    options?: string[];
    configuration?: FieldConfiguration;
}

interface SaveFormRequest {
    formData: FormField[];
    fieldConfigurations: Record<string, FieldConfiguration>;
    originalJson?: any;
    metadata?: {
        createdAt?: string;
        formName?: string;
        version?: string;
    };
}

interface GeneratedForm {
    _id?: any;
    formData: FormField[];
    fieldConfigurations: Record<string, FieldConfiguration>;
    originalJson?: any;
    metadata: {
        createdAt: string;
        formName?: string;
        version: string;
        updatedAt?: string;
    };
}


// --- Helper Function to call Ollama ---
async function callOllamaWithImage(
    imageBase64: string,
    prompt: string,
    modelName: string
): Promise<OllamaGenerateResponse> { // Specify return type
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
        const err = new Error(`Ollama request failed with status ${response.status}`) as OllamaError;
        err.ollamaError = errorBody;
        err.status = response.status;
        throw err;
    }

    const result = await response.json() as OllamaGenerateResponse; // Type assertion
    console.log("Ollama generation complete.");
    return result;
}

// --- Express Endpoint ---
app.post('/api/describe-image', upload.single('imageFile'), async (req: Request, res: Response): Promise<void> => { // <--- Explicitly type return as Promise<void>
    try {
        if (!req.file) {
            // No 'return' here, just send the response and the function continues
            res.status(400).json({ error: 'No image file uploaded. Please include a file with the key "imageFile".' });
            return; // Add a simple return to exit the function after sending the response
        }

        const prompt: string = (req.body.prompt as string) || "Describe this image in detail.";
        const model: string = (req.body.model as string) || DEFAULT_MODEL_NAME;

        console.log(`Received request for model: ${model}, prompt: "${prompt}"`);
        if (model === 'qwen:7b' && model === DEFAULT_MODEL_NAME) {
            console.warn("⚠️ WARNING: You might be using a placeholder model name...");
        }

        const imageBuffer: Buffer = req.file.buffer;
        const imageBase64: string = imageBuffer.toString('base64');

        const ollamaResult = await callOllamaWithImage(imageBase64, prompt, model);

        res.json({ // No 'return' here
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

    } catch (error: any) {
        console.error('Error processing image description request:', error);
        const typedError = error as OllamaError;
        if (typedError.ollamaError) {
            res.status(typedError.status || 500).json({ // No 'return' here
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
app.post('/api/save-form', async (req: Request, res: Response): Promise<void> => {
    try {
        const { formData, fieldConfigurations, originalJson, metadata }: SaveFormRequest = req.body;

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
        const formDocument: GeneratedForm = {
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
        const collection: Collection<GeneratedForm> = db.collection('generated_form');
        const result = await collection.insertOne(formDocument);

        console.log(`Form saved successfully with ID: ${result.insertedId}`);

        res.status(201).json({
            success: true,
            message: 'Form saved successfully',
            formId: result.insertedId,
            savedAt: formDocument.metadata.createdAt
        });

    } catch (error: any) {
        console.error('Error saving form:', error);
        res.status(500).json({ 
            error: 'Failed to save form', 
            message: error.message 
        });
    }
});

// --- Get Saved Forms Endpoint with Pagination ---
app.get('/api/forms', async (req: Request, res: Response): Promise<void> => {
    try {
        const collection: Collection<GeneratedForm> = db.collection('generated_form');
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
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

    } catch (error: any) {
        console.error('Error retrieving forms:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve forms', 
            message: error.message 
        });
    }
});

// --- Get Single Form Endpoint ---
app.get('/api/forms/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const collection: Collection<GeneratedForm> = db.collection('generated_form');
        
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

    } catch (error: any) {
        console.error('Error retrieving form:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve form', 
            message: error.message 
        });
    }
});

// --- Search Forms Endpoint ---
app.get('/api/forms/search', async (req: Request, res: Response): Promise<void> => {
    try {
        const collection: Collection<GeneratedForm> = db.collection('generated_form');
        const searchQuery = req.query.search as string || '';
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
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

    } catch (error: any) {
        console.error('Error searching forms:', error);
        res.status(500).json({ 
            error: 'Failed to search forms', 
            message: error.message 
        });
    }
});

// --- Delete Form Endpoint ---
app.delete('/api/forms/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const collection: Collection<GeneratedForm> = db.collection('generated_form');
        
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

    } catch (error: any) {
        console.error('Error deleting form:', error);
        res.status(500).json({ 
            error: 'Failed to delete form', 
            message: error.message 
        });
    }
});

// --- Save Form Data Endpoint (Upsert to forms_data collection) ---
app.post('/api/forms-data', async (req: Request, res: Response): Promise<void> => {
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

        const result = await collection.replaceOne(
            filter,
            formDataDocument,
            { upsert: true }
        );

        console.log(`Form data ${result.upsertedCount > 0 ? 'created' : 'updated'} successfully for form ID: ${formId}`);

        res.status(result.upsertedCount > 0 ? 201 : 200).json({
            success: true,
            message: result.upsertedCount > 0 ? 'Form data saved successfully' : 'Form data updated successfully',
            formId: formId,
            isNewSubmission: result.upsertedCount > 0,
            submittedAt: formDataDocument.submissionMetadata.submittedAt
        });

    } catch (error: any) {
        console.error('Error saving form data:', error);
        res.status(500).json({ 
            error: 'Failed to save form data', 
            message: error.message 
        });
    }
});

// --- Get Form Data Endpoint ---
app.get('/api/forms-data/:formId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { formId } = req.params;
        const { userId } = req.query;

        const collection = db.collection('forms_data');
        
        // Build filter
        const filter: any = { formId: formId };
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

    } catch (error: any) {
        console.error('Error retrieving form data:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve form data', 
            message: error.message 
        });
    }
});

// --- Get All Form Data Submissions for a Form ---
app.get('/api/forms-data/submissions/:formId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { formId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
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

    } catch (error: any) {
        console.error('Error retrieving form submissions:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve form submissions', 
            message: error.message 
        });
    }
});

// --- Get All Form Data Submissions (across all forms) ---
app.get('/api/form-data', async (req: Request, res: Response): Promise<void> => {
    try {
        const { formId } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const skip = (page - 1) * pageSize;

        const collection = db.collection('forms_data');
        
        // Build filter - if formId is provided, filter by it
        const filter: any = formId ? { formId: formId } : {};
        
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

    } catch (error: any) {
        console.error('Error retrieving all form data submissions:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve form data submissions', 
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/healthcheck', (req: Request, res: Response) => {
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

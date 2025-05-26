import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import multer, { Multer } from 'multer';


// --- Application Configuration from Environment Variables ---
const NODE_ENV: string = process.env.NODE_ENV || 'development';

// --- Ollama Configuration from Environment Variables ---
const OLLAMA_BASE_URL: string = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL_NAME: string = process.env.DEFAULT_QWEN_MODEL_NAME || 'qwen:7b'; // <<< Use variable from .env

const app = express();
const port: number = parseInt(process.env.PORT || "3000", 10);


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


app.get('/', (req: Request, res: Response) => {
    res.send(`
        <h1>Ollama Image Description API (TypeScript)</h1>
        <p>Send a POST request to <code>/api/describe-image</code>...</p>
        <!-- ... rest of your HTML ... -->
    `);
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Ollama endpoint configured at: ${OLLAMA_BASE_URL}`);
    console.log(`Default Qwen VL model for API: ${DEFAULT_MODEL_NAME}`);
    if (DEFAULT_MODEL_NAME === 'qwen:7b') {
        console.warn("⚠️ WARNING: Update DEFAULT_MODEL_NAME in src/server.ts.");
    }
});

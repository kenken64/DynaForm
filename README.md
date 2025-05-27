## Install Ollama with Qwen Multimodal

```
ollama run qwen2.5vl:latest
```

https://ollama.com/blog/multimodal-models


## Server side that convert pdf to png

Linux
```
sudo apt-get update
sudo apt-get install poppler-utils
```

Macos
```
brew install poppler
```

Install python libraries

```
pip install Flask pdf2image Pillow
```

```
python app.py
```

```
curl -X POST \
     -F "pdfFile=@/path/to/your/document.pdf" \
     http://localhost:5001/conversion/pdf-to-png-save
```



## Server side with LLM Models
```
npm i 
```

Okay, let's set up your Node.js Express project to be TypeScript-compatible. This involves installing TypeScript, configuring it, and adjusting your scripts.

Here's a step-by-step guide:

**1. Initialize your project (if you haven't already):**

```bash
npm init -y
```

**2. Install Dependencies:**

*   **Core Dependencies (for your application):**
    ```bash
    npm install express multer
    # npm install node-fetch # If you were using this for Node < 18
    ```
*   **Development Dependencies (for TypeScript and tooling):**
    ```bash
    npm install --save-dev typescript ts-node nodemon @types/node @types/express @types/multer
    ```
    *   `typescript`: The TypeScript compiler.
    *   `ts-node`: Allows you to run TypeScript files directly without pre-compiling (great for development).
    *   `nodemon`: Automatically restarts your server when files change (works well with `ts-node`).
    *   `@types/node`: Type definitions for Node.js built-in modules.
    *   `@types/express`: Type definitions for Express.
    *   `@types/multer`: Type definitions for Multer.

**3. Create a TypeScript Configuration File (`tsconfig.json`):**

Run this command in your project root:

```bash
npx tsc --init
```


**7. Running Your TypeScript Application:**

*   **For Development:**
    ```bash
    npm run dev
    ```
    `nodemon` will start your server using `ts-node`. Any changes you make to `.ts` files in `src` will cause the server to automatically restart.

*   **For Production:**
    1.  **Build the project:**
        ```bash
        npm run build
        ```
        This will compile your TypeScript code from `src` into JavaScript in the `dist` folder.
    2.  **Run the compiled code:**
        ```bash
        npm run start
        ```
        This runs the `dist/server.js` file using Node.js.

Now your Express API is set up with TypeScript, providing better code organization, type safety, and an improved development experience! Remember to change `DEFAULT_MODEL_NAME` in `src/server.ts`.

```
curl -X POST \
     -F "imageFile=@/path/to/your/my_test_image.jpg" \
     -F "prompt=Describe this image in a few sentences." \
     -F "model=qwen:7b" \
     http://localhost:3001/api/describe-image
```


```
curl -X POST \                         
     -F "imageFile=@sampleform_page_1.png" \               
     -F "prompt=List all the form fields format the output in json (make sure sure it looks pretty on terminal )  and also provide the field type whether is a textbox or checkbox" \
     -F "model=qwen2.5vl:latest" \
     http://localhost:3001/api/describe-image

```

```
curl -X POST \
     -F "imageFile=@sampleform_page_1.png" \
     -F "prompt=List all the form fields format the output in csv and also provide the field type whether is a textbox or checkbox" \ 
     -F "model=qwen2.5vl:latest" \
     http://localhost:3001/api/describe-image


{"description":"Sure, here is the list of form fields in CSV format with their respective types:\n\n| Field Name | Field Type |\n|------------|------------|\n| Given Name | Textbox    |\n| Family Name | Textbox    |\n| Address 1 | Textbox    |\n| Address 2 | Textbox    |\n| House nr | Textbox    |\n| Postcode | Textbox    |\n| City | Textbox    |\n| Country | Textbox    |\n| Gender | Textbox    |\n| Height (cm) | Textbox    |\n| Driving License | Checkbox   |\n| I speak and understand (tick all that apply) | Checkbox   |\n| Deutsch | Checkbox   |\n| English | Checkbox   |\n| Français | Checkbox   |\n| Esperanto | Checkbox   |\n| Latin | Checkbox   |\n| Favourite colour | Textbox    |\n\nThis CSV format lists the field names and their corresponding types.","modelUsed":"qwen2.5vl:latest","createdAt":"2025-05-26T19:19:28.563265Z","timings":{"totalDuration":8454185958,"promptEvalDuration":1119861291,"evalDuration":7290537000},"tokenCounts":{"promptEvalCount":1311,"evalCount":185}}%                                 
```
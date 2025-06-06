# Form Publishing AI Agent

A Python AI agent built with LangGraph and Ollama that listens for "publish" keywords, retrieves form data from MongoDB, and registers URLs on a verifiable blockchain contract.

## Features

- 🤖 **Natural Language Processing**: Uses Ollama for understanding user intent
- 🔗 **LangGraph Workflow**: Structured agent workflow for reliable form publishing
- 🗄️ **MongoDB Integration**: Retrieves form data and JSON fingerprints
- ⛓️ **Blockchain Publishing**: Registers form URLs on Ethereum via smart contracts
- 🌐 **REST API**: FastAPI server with multiple endpoints
- 💬 **Interactive Chat**: Command-line chat interface
- 📊 **Health Monitoring**: Service status endpoints

## Architecture

The agent uses a LangGraph state machine with the following workflow:

1. **Analyze Input** → Parse user message for publish intent
2. **Fetch Form Data** → Retrieve form from MongoDB
3. **Publish to Blockchain** → Register URL with verifiable contract
4. **Generate Response** → Create user-friendly response

## Prerequisites

- Python 3.8+
- MongoDB (running on localhost:27017)
- Ollama (running on localhost:11434)
- Verifiable URL Contract API (running on localhost:3002)

## Quick Start

1. **Clone and Setup**:
   ```bash
   cd ai-agent
   ./start-agent.sh
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Server Mode (Default)

Start the FastAPI server:
```bash
python main.py --mode server
```

The server will be available at `http://localhost:8001`

#### API Endpoints

- `POST /chat` - Main chat interface
- `GET /health` - Service health check
- `GET /forms` - List all forms
- `GET /forms/{form_id}` - Get specific form info
- `POST /publish/{form_id}` - Direct form publishing

#### Example API Usage

```bash
# Chat with the agent
curl -X POST "http://localhost:8001/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "publish form abc123"}'

# Direct form publishing
curl -X POST "http://localhost:8001/publish/abc123"

# Health check
curl "http://localhost:8001/health"
```

### Chat Mode

Start interactive chat:
```bash
python main.py --mode chat
```

Example interactions:
```
🤖 You: publish form abc123
🤖 Agent: ✅ Form abc123 has been successfully published to the blockchain!

🤖 You: register form with id xyz789
🤖 Agent: ✅ Form xyz789 has been registered successfully!

🤖 You: deploy form 12345
🤖 Agent: ✅ Form 12345 is now live on the blockchain!
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | Database name | `dynaform` |
| `FORMS_COLLECTION` | Collection name | `generated_forms` |
| `OLLAMA_HOST` | Ollama API host | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model to use | `llama3.2:3b` |
| `VERIFIABLE_CONTRACT_API` | Contract API endpoint | `http://localhost:3002/api/urls` |
| `FRONTEND_BASE_URL` | Frontend base URL | `http://localhost:4200` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8001` |

### Keywords

The agent responds to these keywords:
- `publish`
- `deploy` 
- `register`

## Form Data Structure

The agent expects forms in MongoDB with this structure:

```json
{
  "_id": "form_id",
  "metadata": {
    "formName": "Example Form",
    "jsonFingerprint": "abc123def456...",
    "title": "Form Title"
  },
  "formData": {
    // Form fields and data
  }
}
```

## URL Format

Published forms are accessible at:
```
http://localhost:4200/public/form/{form_id}/{json_fingerprint}
```

## Dependencies

- **LangGraph**: State machine for AI workflows
- **Ollama**: Local LLM for natural language processing
- **FastAPI**: Web framework for REST API
- **Motor**: Async MongoDB driver
- **aiohttp**: Async HTTP client
- **pymongo**: MongoDB driver

## Logging

Logs are written to:
- Console (stdout)
- `ai_agent.log` file

Log levels can be configured via the `LOG_LEVEL` environment variable.

## Error Handling

The agent handles various error scenarios:
- MongoDB connection failures
- Ollama unavailability
- Contract API errors
- Invalid form IDs
- Missing JSON fingerprints

## Development

### Project Structure

```
ai-agent/
├── main.py                     # Main application entry point
├── ai_agent.py                 # LangGraph workflow implementation
├── config.py                   # Configuration management
├── mongodb_service.py          # MongoDB integration
├── verifiable_contract_service.py # Blockchain contract integration
├── ollama_service.py           # Ollama LLM integration
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── start-agent.sh             # Startup script
└── README.md                  # This file
```

### Testing

Test individual components:

```bash
# Test MongoDB connection
python -c "import asyncio; from mongodb_service import mongodb_service; asyncio.run(mongodb_service.connect())"

# Test Ollama
python -c "import asyncio; from ollama_service import ollama_service; asyncio.run(ollama_service.check_ollama_status())"

# Test contract API
python -c "import asyncio; from verifiable_contract_service import verifiable_contract_service; asyncio.run(verifiable_contract_service.get_api_status())"
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `brew services start mongodb-community`
   - Check connection string in `.env`

2. **Ollama Not Available**
   - Start Ollama: `ollama serve`
   - Pull required model: `ollama pull llama3.2:3b`

3. **Contract API Unreachable**
   - Ensure verifiable-url-contract server is running on port 3002
   - Check API endpoint configuration

4. **Form Not Found**
   - Verify form exists in MongoDB collection
   - Check form ID format and spelling

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=DEBUG python main.py
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the logs in `ai_agent.log`
- Verify all services are running
- Test individual components
- Open an issue with error details

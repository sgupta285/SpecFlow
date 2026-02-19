# SpecFlow - Codebase Analysis API

API bridge that reads the codebase book and queries Gemini Brain for answers.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Ensure `.env.local` contains your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

## Usage

Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:4000`

## API Endpoint

### POST `/api/analyze`

Analyzes the codebase based on a user's message.

**Request Body:**
```json
{
  "message": "How does the WebSocket connection work?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Based on the codebase book...",
  "message": "How does the WebSocket connection work?"
}
```

### GET `/health`

Health check endpoint.

## How It Works

1. Receives a message via POST request
2. Reads the `codebase_context.txt` file (the "codebase book")
3. Sends both the codebase book and user's message to Gemini AI
4. Returns Gemini's analysis and answer

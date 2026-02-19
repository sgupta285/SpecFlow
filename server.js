import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = 4000;
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// LOG: The "Founder A" Diagnostic
console.log("------------------------------------");
console.log(process.env.GEMINI_API_KEY ? "✅ BRAIN CONNECTED (2.5-FLASH)" : "❌ BRAIN DISCONNECTED");
console.log("------------------------------------");

app.post('/api/analyze', async (req, res) => {
  try {
    const { message } = req.body;
    const codebase = await fs.readFile(path.join(__dirname, 'codebase_context.txt'), 'utf-8');

    // UPGRADE: We are using a System Instruction to force the AI to act like a CTO.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are the Lead Architect for BuckyConnect. 
      Your goal is to help the developers maintain a sub-500ms latency and high scalability.
      When providing code:
      1. Use TypeScript/React for frontend.
      2. Use GraphQL/Node.js for backend.
      3. Mention the specific file paths found in the context.
      4. Always highlight if a fix helps with the 'Known Gaps' (like Rate Limiting or E2E tests).`
    });

    const prompt = `
    CODEBASE CONTEXT:
    ${codebase}

    ---
    DEVELOPER REQUEST:
    ${message}

    ---
    FINAL INSTRUCTIONS:
    Provide a "Summary," a "Code Fix" section, and a "Potential Risks" section.
    `;

    const result = await model.generateContent(prompt);
    
    res.json({ 
      success: true, 
      answer: result.response.text(),
      metadata: { status: "Senior Architect Active", version: "2.0" }
    });

  } catch (error) {
    console.error("❌ ARCHITECT ERROR:", error.message);
    res.status(500).json({ error: "Architect is offline", details: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Ultimate Brain Live at http://localhost:${PORT}`));
import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '100mb' })); // Higher limit for enterprise-scale files

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * PRODUCTION SYSTEM PROMPT: Universal Stack Detection & Architect Persona
 */
const SYSTEM_PROMPT = `
You are SpecFlow, an Elite AI Technical Lead. You are integrated into the user's local environment.

### OPERATIONAL PHASES:
1. STACK DETECTION: First, scan the provided context for config files (package.json, requirements.txt, go.mod, etc.). Identify the language and framework.
2. CONTEXTUAL ARCHITECTURE: Provide solutions that follow the specific idioms of the detected stack (e.g., React Hooks, Pythonic patterns, Go concurrency).
3. SECURITY & PERFORMANCE AUDIT: Every change must be audited for vulnerabilities and latency bottlenecks.

### STRICT RULES:
- ALWAYS return a valid JSON object.
- ATOMIC UPDATES: Return the FULL source code for every file. Never use placeholders like "// rest of code...".
- NO PROSE: Do not explain outside the JSON structure.

### RESPONSE SCHEMA:
{
  "summary": "High-level summary for the user.",
  "technical_rationale": "Detailed explanation for a Senior Developer.",
  "project_type": "Detected stack (e.g., React/Node.js, Flask/Python)",
  "risks": ["Specific technical risks"],
  "files_to_modify": [
    {
      "fileName": "Path from root",
      "explanation": "Why this change is necessary",
      "fullCode": "Complete runnable file content"
    }
  ],
  "next_steps": ["Specific terminal commands or follow-up actions"]
}
`;

/**
 * ENDPOINT 1: Advanced Analysis with Stack Detection
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { message } = req.body;
    const codebase = await fs.readFile(path.join(__dirname, 'codebase_context.txt'), 'utf-8');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: SYSTEM_PROMPT
    });

    const result = await model.generateContent(`PROJECT CONTEXT:\n${codebase}\n\nUSER REQUEST: ${message}`);
    const jsonResponse = JSON.parse(result.response.text());
    
    res.json({ success: true, data: jsonResponse });
  } catch (error) {
    console.error("❌ Architect Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ENDPOINT 2: The "Apply" Agent
 * Writes the AI-generated code directly to the local disk.
 */
app.post('/api/save', async (req, res) => {
  try {
    const { fileName, fullCode } = req.body;
    const targetPath = path.resolve(__dirname, fileName);

    // Security: Path Traversal Protection
    if (!targetPath.startsWith(__dirname)) {
      return res.status(403).json({ success: false, error: "Access Denied: Path outside project root." });
    }

    // Create directories if they don't exist (important for new files)
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, fullCode, 'utf-8');
    
    console.log(`💾 Applied Changes: ${fileName}`);
    res.json({ success: true, message: `Updated ${fileName}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ENDPOINT 3: Native Context Synchronizer
 * Re-reads the entire directory and updates the AI's "Brain"
 */
app.post('/api/sync', async (req, res) => {
  try {
    const IGNORE_LIST = ['node_modules', '.git', 'dist', '.env', 'codebase_context.txt', '.DS_Store', 'package-lock.json'];
    const ALLOWED_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.py', '.go', '.html', '.css', '.md'];
    let context = "--- SPECFLOW DYNAMIC CONTEXT ---\n\n";

    async function walk(dir) {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (IGNORE_LIST.includes(file.name)) continue;
        const resPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          await walk(resPath);
        } else if (ALLOWED_EXTS.includes(path.extname(file.name))) {
          const content = await fs.readFile(resPath, 'utf-8');
          context += `\n--- FILE: ${path.relative(__dirname, resPath)} ---\n${content}\n`;
        }
      }
    }

    await walk(__dirname);
    await fs.writeFile(path.join(__dirname, 'codebase_context.txt'), context);
    
    console.log("🔄 Project Context Re-Indexed");
    res.json({ success: true, message: "Project indexed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SpecFlow Production Engine Online | http://localhost:${PORT}`);
});
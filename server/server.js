import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

/* ------------------------------------------------ */
/* Setup */
/* ------------------------------------------------ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: ".env.local" }); // DO NOT use .env.local override

const app = express();
const PORT = process.env.PORT || 4000;

/* ------------------------------------------------ */
/* Middleware */
/* ------------------------------------------------ */

app.use(
  cors({
    origin: ["http://localhost:8080"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "2mb" }));

/* ------------------------------------------------ */
/* Gemini Init */
/* ------------------------------------------------ */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("------------------------------------");
console.log(
  process.env.GEMINI_API_KEY
    ? "✅ BRAIN CONNECTED (Gemini Active)"
    : "❌ BRAIN DISCONNECTED"
);
console.log("------------------------------------");

/* ------------------------------------------------ */
/* Routes */
/* ------------------------------------------------ */

app.post("/api/analyze", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const codebase = await fs.readFile(
      path.join(__dirname, "codebase_context.txt"),
      "utf-8"
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
      You are the Lead Architect for SpecFlow.
      Focus on scalable architecture and clean production-ready fixes.
      `,
    });

    const prompt = `
    CODEBASE CONTEXT:
    ${codebase}

    ---
    DEVELOPER REQUEST:
    ${message}

    ---
    FINAL INSTRUCTIONS:
    Provide:
    1. Summary
    2. Code Fix
    3. Potential Risks
    `;

    const result = await model.generateContent(prompt);

    res.json({
      success: true,
      answer: result.response.text(),
    });
  } catch (error) {
    console.error("❌ ARCHITECT ERROR:", error.message);

    res.status(500).json({
      error: "Architect is offline",
      details: error.message,
    });
  }
});

/* ------------------------------------------------ */
/* Start Server */
/* ------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`🚀 Ultimate Brain Live at http://localhost:${PORT}`);
});

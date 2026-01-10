require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// --- CONFIGURATION ---
const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static frontend files

// File Upload Configuration (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// Gemini API Setup
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("Error: GOOGLE_API_KEY is not set in environment or .env file.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// --- SYSTEM PROMPT (STRICT PIPELINE) ---
const SYSTEM_PROMPT = `
You are an **AI medical report processing engine**.
Your task is to **convert raw medical report text or OCR-extracted text into structured, safe, and patient-friendly output**.

You must follow this **STRICT PIPELINE**:

---

## 🔹 STEP 1 — OCR / TEXT CLEANING & EXTRACTION

Input can contain:
* Typos
* OCR mistakes
* Formatting issues

Your job:
* Extract only tests that actually appear in the input.
* Fix small OCR spelling mistakes (e.g., "Hemglobin" → "Hemoglobin", "Hgh" → "High")
* DO NOT invent or assume any missing tests.
* Output:

\`\`\`json
{
  "tests_raw": ["<test line 1>", "<test line 2>", ...],
  "confidence": <0 to 1>
}
\`\`\`

---

## 🔹 STEP 2 — NORMALIZATION

Convert extracted tests into **standard structured JSON**:

Rules:
* Standardize test names (e.g., WBC → WBC, Hemglobin → Hemoglobin)
* Convert values to numbers
* Normalize units
* Add reference ranges
* Decide status: "low", "normal", "high"
* Output:

\`\`\`json
{
  "tests": [
    {
      "name": "Hemoglobin",
      "value": 10.2,
      "unit": "g/dL",
      "status": "low",
      "ref_range": { "low": 12.0, "high": 15.0 }
    }
  ],
  "normalization_confidence": 0.0
}
\`\`\`

---

## 🔹 STEP 3 — PATIENT FRIENDLY SUMMARY

Rules:
* DO NOT diagnose.
* Use simple language.
* Only explain what is present in the input.
* No new tests, no assumptions.

Output:

\`\`\`json
{
  "summary": "Short simple summary sentence",
  "explanations": [
    "Simple explanation line 1",
    "Simple explanation line 2"
  ]
}
\`\`\`

---

## 🛑 STRICT GUARDRAIL

If **ANY test appears in your output that was NOT present in input**, you MUST immediately return:

\`\`\`json
{
  "status": "unprocessed",
  "reason": "hallucinated tests not present in input"
}
\`\`\`

---

## 🔹 STEP 4 — FINAL RESPONSE FORMAT

If everything is valid, return a JSON object containing the details of all steps:

\`\`\`json
{
  "step_1_extraction": {
    "tests_raw": ["<test line 1>", "<test line 2>"],
    "confidence": <0 to 1>
  },
  "step_2_normalization": {
    "tests": [
      {
        "name": "Hemoglobin",
        "value": 10.2,
        "unit": "g/dL",
        "status": "low",
        "ref_range": { "low": 12.0, "high": 15.0 }
      }
    ],
    "normalization_confidence": <0 to 1>
  },
  "step_3_summary": {
    "summary": "Short simple summary sentence",
    "explanations": [
      "Simple explanation line 1",
      "Simple explanation line 2"
    ]
  },
  "final_response": {
    "tests": [...normalized tests from step 2...],
    "summary": "Short simple summary sentence from step 3",
    "status": "ok"
  }
}
\`\`\`

---

## 🧠 HARD RULES (VERY IMPORTANT)

* ❌ NEVER hallucinate tests
* ❌ NEVER add medical diagnosis
* ❌ NEVER assume missing values
* ✅ Only process what is in input
* ✅ Be conservative and safe
* ✅ If unsure → return "unprocessed"

---

## 🎯 SYSTEM ROLE

You are:
* A **medical data structuring engine**
* Not a doctor
* Not a diagnostic system
* Only a **report simplifier and structurer**
`;

// --- HELPER FUNCTION: CALL GEMINI ---
async function processReport(inputData, modelName = "gemini-1.5-flash-latest") {
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: "application/json" }
    });

    const parts = [];

    // Handle Input Type (Text or Image Buffer)
    if (Buffer.isBuffer(inputData)) {
      parts.push({
        inlineData: {
          data: inputData.toString("base64"),
          mimeType: "image/jpeg" // Adjust if needed, but jpeg usually works for generic image inputs
        }
      });
      parts.push({ text: "Here is an image of a medical report. Extract and process the data." });
    } else {
      // Assume text
      parts.push({ text: inputData });
    }

    // Safety Settings (Block None)
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
      safetySettings: safetySettings
    });

    const responseText = result.response.text();

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      return { status: "error", message: "Failed to parse JSON", raw: responseText };
    }

  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// --- API ENDPOINTS ---

// Root
app.get('/', (req, res) => {
  res.send({ message: "Medical Report Simplifier API (Node.js) is running." });
});

// Process Text
app.post('/process', async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text field is required." });
    }

    console.log(`Processing text with model: ${model || "default"}`);
    const result = await processReport(text, model);
    res.json(result);

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Process Image
app.post('/process-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const imageBuffer = req.file.buffer;
    const model = req.body.model;

    console.log(`Processing image with model: ${model || "default"}`);
    const result = await processReport(imageBuffer, model);
    res.json(result);

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

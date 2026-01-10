# AI-Powered Medical Report Simplifier

A smart web application that converts medical reports (text or images) into structured, patient-friendly JSON using Google Gemini's AI.

![Frontend UI](https://dummyimage.com/800x400/0f172a/3b82f6.png&text=Medical+Report+Simplifier+UI)

## 🚀 Key Features

*   **Web Interface**: Clean, glassmorphism-style UI for easy interaction (Mobile Responsive).
*   **Multi-Modal Input**: Accepts raw text OR images (OCR via Gemini Vision).
*   **Structured Output**: Normalizes test names, values, units, and status (High/Low/Normal).
*   **Patient-Friendly Summary**: Generates simple, non-diagnostic explanations.
*   **Strict Guardrails**: Prevents hallucination of tests not present in the input.

---

## 🛠️ Quick Start (Recommended)

This project is a **Node.js** application.

### 1. Prerequisites
*   Node.js 18+ installed.
*   Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)).

### 2. Setup
```bash
# Clone repository
git clone https://github.com/dk2430098/MedicalReportApp.git
cd MedicalReportApp

# Install dependencies
npm install

# Configure API Key
echo "GOOGLE_API_KEY=your_actual_api_key_here" > .env
```

### 3. Run the App
```bash
node server.js
```
Open your browser to: **http://localhost:8000**

---

## ☁️ Deployment (Vercel)

This project is configured for one-click deployment on [Vercel](https://vercel.com).

1.  **Install Vercel CLI**: `npm i -g vercel`
2.  **Deploy**: Run `vercel` in the project directory.
    *   *Select "Other" as the framework preset if asked.*
3.  **Environment Variables**: Add `GOOGLE_API_KEY` in your Vercel Project Settings.

---

## 🐍 Advanced: Using Python (CLI / Backend)

*(Optional) If you prefer a Python-only environment.*

### Setup
```bash
pip install -r requirements.txt
```

### CLI Usage
**Process Text:**
```bash
python3 main.py --text "CBC: Hemoglobin 10.2 g/dL (Low)"
```

**Process Image:**
```bash
python3 main.py --image path/to/report.jpg
```

### Python API Server
Start the FastAPI server (backend only, no UI):
```bash
python3 app.py
```
*(Runs at `http://0.0.0.0:8000`)*

---

## 📁 Project Structure

```
├── server.js           # PRIMARY: Node.js Express Backend & Static Server
├── public/             # PRIMARY: Frontend Web App (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── vercel.json         # Deployment Configuration
├── main.py             # SECONDARY: Python CLI Tool
├── app.py              # SECONDARY: Python FastAPI Backend
├── prompts.py          # Shared AI Logic & Systems Prompt
└── requirements.txt    # Python Dependencies
```

## 📝 License
MIT

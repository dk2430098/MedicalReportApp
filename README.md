# AI-Powered Medical Report Simplifier

A backend service and CLI tool that converts medical reports (text or images) into structured, patient-friendly JSON using Google Gemini's AI.

## 🚀 Key Features

*   **Multi-Modal Input**: Accepts raw text OR images (OCR via Gemini Vision).
*   **Structured Output**: Normalizes test names, values, units, and status (High/Low/Normal).
*   **Patient-Friendly Summary**: Generates simple, non-diagnostic explanations.
*   **Strict Guardrails**: Prevents hallucination of tests not present in the input.
*   **API Ready**: Includes a FastAPI server for integration.

## 🛠️ Setup & Installation

### Prerequisites
*   Python 3.10+
*   Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Key
Create a `.env` file in the root directory:
```bash
GOOGLE_API_KEY=your_api_key_here
```

## 💻 Usage

### A. CLI (Command Line)

**Process Text:**
```bash
python3 main.py --text "CBC: Hemglobin 10.2 g/dL (Low)"
```

**Process Image:**
```bash
python3 main.py --image path/to/report.jpg
```

### B. API Server (FastAPI)

1.  **Start the Server:**
    ```bash
    python3 app.py
    ```
    server runs at `http://0.0.0.0:8000`

2.  **API Endpoints:**

    *   `POST /process` (JSON Body):
        ```json
        {
          "text": "CBC: Hemglobin 10.2 g/dL (Low)"
        }
        ```

    *   `POST /process-image` (Form Data):
    *   `POST /process-image` (Form Data):
        *   `file`: (Upload your image file)
        *   `model`: `gemini-flash-latest` (optional)

### 3. Node.js/Express Version

This project also supports a Node.js backend.

**Setup:**
1.  Install dependencies: `npm install`
2.  Start server: `node server.js`
    *(Runs on port 8000, same as Python verison)*
3.  Use the exact same API endpoints as above.

### C. Output Format

The API returns a detailed JSON object showing the full pipeline:

```json
{
  "step_1_extraction": {
    "tests_raw": [ "Hemoglobin 10.2 g/dL (Low)" ],
    "confidence": 0.95
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
    "normalization_confidence": 0.98
  },
  "step_3_summary": {
    "summary": "Hemoglobin is low, indicating anemia.",
    "explanations": [ "Low hemoglobin..." ]
  },
  "final_response": {
    "tests": [...],
    "summary": "Hemoglobin is low, indicating anemia.",
    "status": "ok"
  }
}
```

## 📁 Project Structure

*   `main.py`: Core processing engine (CLI + Logic).
*   `app.py`: FastAPI web server wrapper.
*   `prompts.py`: strict System Prompt and pipeline definition.
*   `requirements.txt`: Python dependencies.

## 🤖 Architecture

1.  **Input**: Text or Image.
2.  **Processing**: Google Gemini (Flash Model) with a strict System Prompt.
    *   *Step 1*: OCR/Text Cleaning.
    *   *Step 2*: Normalization (JSON).
    *   *Step 3*: Summary Generation.
3.  **Guardrails**: Returns "unprocessed" if hallucinations are detected.
4.  **Output**: Standardized JSON.

## 📝 License
MIT

import os
import sys
import warnings
from typing import Optional
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image
import io

# Import the processing logic from main.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import process_medical_report
    import google.generativeai as genai
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

# Load environment variables
load_dotenv()

# Configure GenAI
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: GOOGLE_API_KEY not set. API will not function correctly.")
else:
    genai.configure(api_key=api_key)

app = FastAPI(
    title="Medical Report Simplifier API",
    description="API to convert raw medical text OR images into structured, patient-friendly JSON.",
    version="1.1.0"
)

class ReportRequest(BaseModel):
    text: str
    model: str = "gemini-2.5-flash"

@app.get("/")
def read_root():
    return {"message": "Medical Report Simplifier API is running."}

@app.post("/process", status_code=status.HTTP_200_OK)
def process_report(request: ReportRequest):
    """Process raw text input."""
    if not request.text:
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")
    
    result = process_medical_report(request.text, request.model)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
        
    return result

@app.post("/process-image", status_code=status.HTTP_200_OK)
async def process_image_report(
    file: UploadFile = File(...),
    model: str = Form("gemini-flash-latest")
):
    """Process an image file (OCR)."""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        result = process_medical_report(image, model)
        
        if result.get("status") == "error":
             raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

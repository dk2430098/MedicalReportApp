import os
import sys
import json
import argparse
from typing import Optional, Union
from dotenv import load_dotenv
import warnings
from PIL import Image
import io

# Suppress warnings from google.generativeai
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

# Import the system prompt from prompts.py
from prompts import SYSTEM_PROMPT

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError:
    print("Error: 'google-generativeai' module not found. Please run: pip install -r requirements.txt")
    sys.exit(1)

def load_text_from_file(file_path: str) -> str:
    """Reads text content from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        sys.exit(1)

def process_medical_report(input_data: Union[str, Image.Image], model_name: str = "gemini-flash-latest") -> dict:
    """
    Sends the medical report (text or image) to the LLM for processing according to the pipeline.
    """
    # Configure safety settings to avoid blocking medical content
    safety_settings = {
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }

    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"}
        )

        content_parts = []
        if isinstance(input_data, str):
            content_parts.append(input_data)
        elif isinstance(input_data, Image.Image):
             content_parts.append("Here is an image of a medical report. Extract and process the data.")
             content_parts.append(input_data)

        response = model.generate_content(
            content_parts,
            safety_settings=safety_settings
        )
        
        content = response.text
        if not content:
            return {"status": "error", "message": "Empty response from LLM"}
            
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"status": "error", "message": "Failed to parse JSON response", "raw_content": content}

    except Exception as e:
        return {"status": "error", "message": str(e)}

def main():
    load_dotenv()
    
    parser = argparse.ArgumentParser(description="Medical Report Simplifier Engine (Gemini Powered)")
    parser.add_argument("--text", type=str, help="Raw medical report text to process")
    parser.add_argument("--file", type=str, help="Path to a text file containing the report")
    parser.add_argument("--image", type=str, help="Path to an image file (JPG/PNG) containing the report")
    parser.add_argument("--model", type=str, default="gemini-1.5-flash-latest", help="Gemini model to use (default: gemini-1.5-flash-latest)")
    
    args = parser.parse_args()

    # Input validation
    if not args.text and not args.file and not args.image:
        parser.error("You must provide either --text, --file, or --image")
    
    input_data = ""
    if args.image:
        try:
            input_data = Image.open(args.image)
        except Exception as e:
            print(f"Error opening image: {e}")
            sys.exit(1)
    elif args.file:
        input_data = load_text_from_file(args.file)
    else:
        input_data = args.text

    # Check for API Key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
         print("Error: GOOGLE_API_KEY not found in environment variables or .env file.")
         sys.exit(1)

    genai.configure(api_key=api_key)

    print(f"Processing report using {args.model}...")
    result = process_medical_report(input_data, args.model)
    
    # pretty print output
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()

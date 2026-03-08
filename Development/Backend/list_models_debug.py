import os
import google.generativeai as genai

# Setup API Key
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    # Try to read from .env manually if not in os.environ
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.split('=')[1].strip()
                    break
    except:
        pass

if not api_key:
    print("No API key found.")
else:
    genai.configure(api_key=api_key)
    print("Available Models:")
    try:
        for m in genai.list_models():
            print(f"Name: {m.name}, Display: {m.display_name}, Methods: {m.supported_generation_methods}")
    except Exception as e:
        print(f"Error: {e}")

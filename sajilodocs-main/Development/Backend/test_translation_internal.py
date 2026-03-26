import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from api.translation import TranslationProcessor

def test_manual_translation():
    test_text = "The quick brown fox jumps over the lazy dog."
    target_lang = "Nepali"
    
    from google import genai
    client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
    print("Available Models:")
    try:
        for m in client.models.list():
            print(m.name)
    except Exception as e:
        print(f"Could not list models: {e}")
    print("-" * 20)
    
    print(f"Original Text: {test_text}")
    print(f"Target Language: {target_lang}")
    print("-" * 20)
    
    try:
        translated = TranslationProcessor.translate_text(test_text, target_lang)
        print(f"Translated Text: {translated}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during translation: {e}")

if __name__ == "__main__":
    if not os.environ.get('GEMINI_API_KEY'):
        print("Error: GEMINI_API_KEY environment variable not set.")
    else:
        test_manual_translation()

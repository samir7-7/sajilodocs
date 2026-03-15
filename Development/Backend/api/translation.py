from google import genai
from google.genai import types
import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class TranslationProcessor:
    @staticmethod
    def translate_text(text, target_language):
        """
        Translates text to the target language using Gemini LLM.
        Ensures the translation is natural and culturally appropriate.
        """
        try:
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                logger.error("GEMINI_API_KEY not found in environment variables.")
                raise ValueError("Gemini API Key is not configured.")

            # Initialize the client
            client = genai.Client(api_key=api_key)
            
            # List of models to try in order of preference
            models_to_try = [
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash',
                'gemini-1.5-pro',
                'gemini-1.5-flash-latest',
                'gemini-pro',
            ]
            
            prompt = f"""
Task: Translate the following text into {target_language}.

Guidelines:
- Do not provide a literal word-for-word translation.
- Ensure the translation is natural, fluent, and suitable for a native speaker of {target_language}.
- Maintain the original meaning and tone of the text.
- If the text contains technical terms, use the appropriate equivalents in {target_language}.
- Understand the context of the whole text before translating.

Input Text:
\"\"\"{text}\"\"\"

Translated Text:
"""
            
            last_error = None
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting translation with model: {model_name}")
                    
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    
                    if response and response.text:
                        logger.info(f"Translation successful using model: {model_name}")
                        return response.text.strip()
                    else:
                        logger.warning(f"Model {model_name} returned empty response.")
                except Exception as e:
                    last_error = e
                    logger.warning(f"Model {model_name} failed: {str(e)}")
                    continue
            
            if last_error:
                raise last_error
            
            raise ValueError("All translation models failed or returned empty responses.")

        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            raise e

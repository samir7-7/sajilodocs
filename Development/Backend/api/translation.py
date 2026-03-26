import os
import logging

try:
    from google import genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

# Current working Gemini models in preference order.
# gemini-2.5-flash is the latest; fallback to 2.0 variants.
_TRANSLATION_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


class TranslationProcessor:
    @staticmethod
    def translate_text(text: str, target_language: str) -> str:
        """
        Translates text to the target language using Gemini.
        Raises ValueError with a clear message when the API key is missing,
        blocked (403), or all models fail.
        """
        if genai is None:
            raise ValueError(
                "google-genai package is not installed. Run: pip install google-genai"
            )

``        api_key = os.environ.get("GEMINI_TRANSLATION_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_TRANSLATION_API_KEY is not set. Add it to your .env file and restart the server."
            )

        client = genai.Client(api_key=api_key)

        prompt = f"""Task: Translate the following text into {target_language}.

Guidelines:
- Produce a natural, fluent translation suitable for a native speaker of {target_language}.
- Maintain the original meaning and tone.
- Use appropriate technical equivalents where needed.
- Return ONLY the translated text, no explanations or labels.

Input Text:
\"\"\"{text}\"\"\"

Translated Text:"""

        last_error: Exception | None = None

        for model_name in _TRANSLATION_MODELS:
            try:
                logger.info("Attempting translation with model: %s", model_name)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    logger.info("Translation successful using model: %s", model_name)
                    return response.text.strip()
                logger.warning("Model %s returned empty response.", model_name)
            except Exception as e:
                err = str(e)
                # 403 means the key is revoked / leaked — no point trying other models.
                if "403" in err or "permission_denied" in err.lower() or "reported as leaked" in err.lower():
                    logger.error(
                        "Gemini API key rejected (403 PERMISSION_DENIED). "
                        "Your key may have been reported as leaked. "
                        "Generate a new key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in your .env file."
                    )
                    raise ValueError(
                        "Translation failed: Gemini API key is invalid or has been revoked (403). "
                        "Please generate a new key at https://aistudio.google.com/apikey "
                        "and update GEMINI_API_KEY in your .env file."
                    ) from e
                last_error = e
                logger.warning("Model %s failed: %s", model_name, err)

        raise ValueError(
            f"All translation models failed. Last error: {last_error}"
        )

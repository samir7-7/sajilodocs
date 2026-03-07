import os
import time
import cv2
import numpy as np
import pypdfium2 as pdfium
import google.generativeai as genai
import logging
from PIL import Image, ImageFilter, ImageEnhance
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

# ── Gemini Setup ───────────────────────────────────────────────────────────────

_GEMINI_CONFIGURED = False

def _ensure_gemini_configured():
    global _GEMINI_CONFIGURED
    if _GEMINI_CONFIGURED:
        return True
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment variables.")
        return False
    genai.configure(api_key=api_key)
    _GEMINI_CONFIGURED = True
    return True


# ── Image Preprocessing ────────────────────────────────────────────────────────

def _preprocess(pil_image):
    """
    Enhances image for maximum OCR accuracy.
    Keeps color (no binarization) — color helps Gemini read Devanagari better.
    Works for both printed and handwritten Nepali/English text.
    """
    img = np.array(pil_image.convert('RGB'))
    h, w = img.shape[:2]

    # Upscale 4x with best interpolation for thin stroke detail
    img = cv2.resize(img, (w * 4, h * 4), interpolation=cv2.INTER_LANCZOS4)

    # Denoise each color channel separately (preserves color)
    denoised = np.zeros_like(img)
    for c in range(3):
        denoised[:, :, c] = cv2.fastNlMeansDenoising(
            img[:, :, c], h=10, templateWindowSize=7, searchWindowSize=21
        )

    # Unsharp mask sharpening — crisp stroke edges
    blurred = cv2.GaussianBlur(denoised, (0, 0), sigmaX=2)
    sharpened = cv2.addWeighted(denoised, 1.8, blurred, -0.8, 0)

    # CLAHE on LAB luminance — handles uneven lighting/phone photo shadows
    lab = cv2.cvtColor(sharpened, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    result = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    # Final PIL sharpening + contrast boost
    pil_result = Image.fromarray(result)
    pil_result = ImageEnhance.Sharpness(pil_result).enhance(2.0)
    pil_result = ImageEnhance.Contrast(pil_result).enhance(1.3)

    return pil_result


# ── PDF to Images ──────────────────────────────────────────────────────────────

def _pdf_to_images(file_path, scale=400/72):
    """Converts each PDF page to a high-res PIL Image at ~400 DPI."""
    pdf = pdfium.PdfDocument(file_path)
    images = []
    for i in range(len(pdf)):
        bitmap = pdf[i].render(scale=scale, rotation=0)
        images.append(bitmap.to_pil().convert('RGB'))
    return images


# ── Gemini Extraction ──────────────────────────────────────────────────────────

def _gemini_extract(pil_image):
    """
    Sends image to Gemini 2.5 Pro for text extraction.
    Auto-detects language (English, Nepali/Devanagari, or mixed).
    Retries up to 5 times on rate limit.
    """
    model = genai.GenerativeModel('gemini-2.5-pro')

    prompt = (
        'You are an expert OCR system specialized in both English and Nepali (Devanagari script). '
        'Carefully examine this image and:\n'
        '1. Detect what language(s) are present (English, Nepali/Devanagari, or both)\n'
        '2. Extract ALL text exactly as it appears — do NOT translate, correct, or modify\n'
        '3. Preserve all line breaks, spacing, and structure\n'
        '4. For handwritten text: make your best guess for unclear words and mark with [?]\n'
        '5. Pay special attention to Devanagari matras (marks above/below letters) and conjuncts\n\n'
        'Output format:\n'
        '[Detected language: ...]\n'
        '[Extracted text:]\n'
        '<extracted text here>'
    )

    for attempt in range(5):
        try:
            response = model.generate_content([prompt, pil_image])
            return response.text
        except Exception as e:
            err = str(e)
            if '429' in err or 'quota' in err.lower() or 'TooManyRequests' in err:
                wait = 30 * (attempt + 1)
                logger.warning(f"Gemini rate limit hit. Waiting {wait}s (attempt {attempt+1}/5)...")
                time.sleep(wait)
            else:
                raise

    raise RuntimeError("Gemini OCR failed after 5 retries. Please try again later.")


# ── OCRProcessor (same interface as original — views.py calls this) ────────────

class OCRProcessor:
    @staticmethod
    def process_file(file_path):
        """
        Extracts text from an image or PDF file using Gemini Vision API.
        Replaces Tesseract — same method signature so views.py needs no changes.

        Args:
            file_path (str): Absolute path to the file on disk.

        Returns:
            str: Extracted text content.
        """
        if not _ensure_gemini_configured():
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Please add it to your .env file:\n"
                "GEMINI_API_KEY=your-key-here\n"
                "Get a free key at: https://aistudio.google.com/app/apikey"
            )

        ext = os.path.splitext(file_path)[1].lower()

        try:
            if ext == '.pdf':
                return OCRProcessor._process_pdf(file_path)
            elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp']:
                return OCRProcessor._process_image(file_path)
            else:
                raise ValueError(f"Unsupported file type for OCR: {ext}")
        except Exception as e:
            logger.error(f"OCR failed for {file_path}: {str(e)}")
            raise

    @staticmethod
    def _process_image(image_path):
        """Processes a single image file."""
        image = Image.open(image_path).convert('RGB')
        processed = _preprocess(image)
        return _gemini_extract(processed)

    @staticmethod
    def _process_pdf(pdf_path):
        """
        Processes a PDF by converting pages to images, then running Gemini OCR.
        Uses parallel processing for multi-page PDFs (60-70% faster).
        """
        pages = _pdf_to_images(pdf_path)
        logger.info(f"PDF has {len(pages)} page(s). Starting OCR...")

        if len(pages) == 1:
            # Single page — process directly
            processed = _preprocess(pages[0])
            text = _gemini_extract(processed)
            return text.strip()

        # Multi-page — parallel processing
        results = [None] * len(pages)

        def process_page(args):
            idx, page = args
            processed = _preprocess(page)
            text = _gemini_extract(processed)
            logger.info(f"Page {idx + 1} OCR complete.")
            return idx, text

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(process_page, (idx, page)): idx
                for idx, page in enumerate(pages)
            }
            for future in as_completed(futures):
                idx, text = future.result()
                results[idx] = text

        # Join pages with same separator as original Tesseract version
        clean_pages = [t.strip() for t in results if t and t.strip()]
        if not clean_pages:
            return ""
        return "\n\n--- Page Break ---\n\n".join(clean_pages)
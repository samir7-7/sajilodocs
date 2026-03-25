import os
import logging
import time
import shutil

from PIL import Image, ImageFilter, ImageOps
import pytesseract
from pytesseract import Output
try:
    from google import genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

# Optional OpenCV for Colab-style preprocessing (better for handwritten/Nepali)
try:
    import cv2
    import numpy as np
    _HAS_CV2 = True
except ImportError:
    _HAS_CV2 = False

# Lazy import: fitz (PyMuPDF) is only needed for PDFs. Import when first needed
# so image-only OCR works even if pymupdf is not installed.
_fitz_module = None
_TESSERACT_CONFIGURED = False


def _get_fitz():
    """Import PyMuPDF (fitz) on first use. Raises clear error if not installed."""
    global _fitz_module
    if _fitz_module is not None:
        return _fitz_module
    try:
        import fitz
        _fitz_module = fitz
        return fitz
    except ImportError:
        pass
    try:
        import pymupdf as fitz
        _fitz_module = fitz
        return fitz
    except ImportError:
        raise ImportError(
            "PyMuPDF is required for PDF OCR. In your Backend folder run: pip install pymupdf"
        ) from None

# Default to English + Nepali (Devanagari) if language data is installed.
# You can override this via environment variable OCR_LANGS, e.g. "eng+nep".
OCR_LANGS = os.environ.get("OCR_LANGS", "eng+nep")
OCR_PREFER_GEMINI = os.environ.get("OCR_PREFER_GEMINI", "1").lower() not in ("0", "false", "no")


def _validate_tesseract_runtime() -> bool:
    """Return True only if pytesseract can successfully invoke tesseract."""
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def _ensure_tesseract_configured() -> bool:
    """
    Ensure pytesseract can find the tesseract binary.
    On Windows, also checks common install locations when PATH is missing.
    """
    global _TESSERACT_CONFIGURED
    if _TESSERACT_CONFIGURED:
        return _validate_tesseract_runtime()

    # 1) Respect explicit env override first.
    configured_cmd = os.environ.get("TESSERACT_CMD")
    if configured_cmd and os.path.exists(configured_cmd):
        pytesseract.pytesseract.tesseract_cmd = configured_cmd
        if _validate_tesseract_runtime():
            _TESSERACT_CONFIGURED = True
            return True

    # 2) If binary is in PATH, pytesseract can invoke it directly.
    if shutil.which("tesseract"):
        if _validate_tesseract_runtime():
            _TESSERACT_CONFIGURED = True
            return True

    # 3) Common Windows paths.
    common_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Tesseract-OCR", "tesseract.exe"),
    ]
    for path in common_paths:
        if path and os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            if _validate_tesseract_runtime():
                _TESSERACT_CONFIGURED = True
                logger.info("Tesseract configured at %s", path)
                return True

    return False


# ── Gemini setup (used ONLY for low-quality handwritten English) ──────────────
_gemini_client = None
_gemini_disabled = False


def _ensure_gemini_configured() -> bool:
    """
    Configure Gemini client from GEMINI_API_KEY.
    Returns False if no key is set so we can safely stay fully local.
    """
    global _gemini_client, _gemini_disabled
    if _gemini_disabled:
        return False
    if _gemini_client is not None:
        return True

    if genai is None:
        logger.info("google-genai not installed; skipping handwriting API fallback.")
        return False

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.info("GEMINI_API_KEY not set; skipping handwriting API fallback.")
        return False

    try:
        _gemini_client = genai.Client(api_key=api_key)
        return True
    except Exception as e:
        logger.error(f"Failed to configure Gemini client: {e}")
        _gemini_client = None
        _gemini_disabled = True
        return False


def _preprocess_image(image: Image.Image) -> Image.Image:
    """
    Preprocessing tuned for Tesseract:
    - Upscale smaller images for sharper glyphs
    - Gentle denoise + contrast for both English and Devanagari
    """
    # Work in grayscale 8‑bit
    img = image.convert("L")

    # If the image is small, upscale to give Tesseract more pixels per character
    min_dim = min(img.size)
    if min_dim < 1200:
        scale = 1200 / float(min_dim)
        new_size = (int(img.width * scale), int(img.height * scale))
        img = img.resize(new_size, Image.LANCZOS)

    # Slight contrast normalization
    img = ImageOps.autocontrast(img, cutoff=2)

    # Light denoising
    img = img.filter(ImageFilter.MedianFilter(size=3))

    return img


def _preprocess_for_gemini(pil_image: Image.Image) -> Image.Image:
    """
    Colab-style preprocessing before sending to Gemini: upscale, denoise, CLAHE,
    adaptive threshold. Great for handwritten and Nepali/Devanagari text.
    Uses OpenCV if available; otherwise falls back to simple upscale + contrast.
    """
    if not _HAS_CV2:
        rgb = pil_image.convert("RGB")
        w, h = rgb.size
        if min(w, h) < 1400:
            scale = 1400 / min(w, h)
            rgb = rgb.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        return ImageOps.autocontrast(rgb, cutoff=2)

    img = np.array(pil_image.convert("RGB"))
    h, w = img.shape[:2]
    # Upscale for thin stroke visibility (same as Colab)
    img = cv2.resize(img, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=15, templateWindowSize=7, searchWindowSize=21)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    contrasted = clahe.apply(denoised)
    binary = cv2.adaptiveThreshold(
        contrasted, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, blockSize=31, C=10
    )
    out = Image.fromarray(binary).filter(ImageFilter.SHARPEN)
    return out


def _score_text_quality(text: str) -> float:
    """
    Rough heuristic score for how "real" the extracted text is.
    Higher is better. Used to decide when to try a handwriting‑tuned fallback.
    """
    if not text:
        return 0.0

    letters = sum(ch.isalpha() for ch in text)
    digits = sum(ch.isdigit() for ch in text)
    useful = letters + digits
    total = len(text)
    if total == 0:
        return 0.0

    density = useful / total
    # Reward both overall length and density of useful characters
    return useful * density


def _extract_with_tesseract(image: Image.Image, config: str) -> tuple[str, float]:
    """Run one tesseract pass and return (text, avg_confidence)."""
    text = pytesseract.image_to_string(image, lang=OCR_LANGS, config=config) or ""
    avg_conf = 0.0
    try:
        data = pytesseract.image_to_data(image, lang=OCR_LANGS, config=config, output_type=Output.DICT)
        conf_values = [float(c) for c in data.get("conf", []) if c not in ("-1", -1, None)]
        if conf_values:
            avg_conf = sum(conf_values) / len(conf_values)
    except Exception:
        # Confidence extraction can fail for some images/configs; text is still usable.
        pass
    return text, avg_conf


def _best_tesseract_text(image: Image.Image) -> tuple[str, float]:
    """Try a few OCR modes and keep the strongest result by confidence+quality."""
    candidates = [
        "--oem 3 --psm 6",
        "--oem 3 --psm 11",
        "--oem 3 --psm 4",
    ]

    best_text = ""
    best_score = -1.0
    best_conf = 0.0

    for cfg in candidates:
        txt, conf = _extract_with_tesseract(image, cfg)
        score = _score_text_quality(txt) + (conf * 1.5)
        if score > best_score:
            best_score = score
            best_text = txt
            best_conf = conf

    return best_text, best_conf


def _image_to_text(image: Image.Image) -> str:
    """
    Run Tesseract on a PIL image.

    Strategy (for both PDFs and images):
    1) First pass tuned for printed blocks of text.
    2) If the result looks like noise/empty, retry with a config that
       tends to work slightly better for handwriting / sparse text.
    """
    if not _ensure_tesseract_configured():
        raise RuntimeError(
            "Tesseract OCR engine was not found. Install Tesseract or set TESSERACT_CMD to the full tesseract.exe path."
        )

    # Respect camera EXIF orientation so ID cards are not OCR'd sideways/upside-down.
    image = ImageOps.exif_transpose(image).convert("RGB")
    processed = _preprocess_image(image)

    # Use configured languages (default "eng+nep") and select best OCR pass by confidence.
    text, local_conf = _best_tesseract_text(processed)
    score = _score_text_quality(text)

    # Final step: Gemini (same approach as your Colab) — best for ID cards, handwritten, Nepali
    if _ensure_gemini_configured():
        try:
            prompt = (
                "Look at this image carefully. "
                "First detect what language(s) the text is written in (English, Nepali/Devanagari, or both). "
                "Then extract ALL the text exactly as it appears in its original language — do NOT translate. "
                "Preserve line breaks and structure. "
                "If any word is unclear or handwritten and hard to read, write your best guess and mark it with [?]. "
                "Output format:\n"
                "[Detected language: ...]\n"
                "[Extracted text:]\n"
                "<the text here>"
            )
            img_to_send = _preprocess_for_gemini(image)
            for model_name in ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"):
                try:
                    for attempt in range(5):
                        try:
                            response = _gemini_client.models.generate_content(
                                model=model_name,
                                contents=[prompt, img_to_send],
                            )
                            api_text = (response.text or "").strip()
                            if api_text:
                                # Use only the content after "[Extracted text:]" if present (Colab format)
                                if "[Extracted text:]" in api_text:
                                    api_text = api_text.split("[Extracted text:]", 1)[-1].strip()
                                if api_text:
                                    api_score = _score_text_quality(api_text)
                                    if OCR_PREFER_GEMINI or local_conf < 55.0 or api_score >= (score * 0.8):
                                        text = api_text
                                        score = api_score
                            break
                        except Exception as e:
                            err = str(e)
                            if "403" in err or "permission_denied" in err.lower() or "reported as leaked" in err.lower():
                                logger.error("Gemini API key rejected (403). Disable model fallback until process restart.")
                                global _gemini_disabled
                                _gemini_disabled = True
                                return text.strip()
                            if "429" in err or "quota" in err.lower() or "TooManyRequests" in err:
                                wait = 30 * (attempt + 1)
                                logger.warning("Gemini rate limit, waiting %ds (attempt %d/5)...", wait, attempt + 1)
                                time.sleep(wait)
                            else:
                                raise
                    break
                except Exception as model_err:
                    logger.debug("Gemini model %s failed: %s", model_name, model_err)
                    continue
        except Exception as e:
            logger.warning("Gemini OCR fallback failed: %s", e)

    return text.strip()


def _pdf_extract_text_layer(pdf_path: str) -> str:
    """
    First try to extract the embedded text layer from a PDF.
    For digitally-generated PDFs this is vastly more accurate than OCR
    and completely language‑agnostic.
    """
    texts = []
    fitz = _get_fitz()
    with fitz.open(pdf_path) as doc:
        for page in doc:
            txt = page.get_text("text")
            if txt:
                texts.append(txt.strip())
    combined = "\n\n--- Page Break ---\n\n".join(t for t in texts if t)
    # If almost nothing was extracted, treat as 'no text layer' and fall back to OCR.
    return combined if len(combined) > 50 else ""


def _pdf_to_images_with_pymupdf(pdf_path: str, dpi: int = 400):
    """
    Uses PyMuPDF to render each page of a PDF to a PIL image.
    This is used as a fallback when no reliable text layer exists.
    """
    images = []
    fitz = _get_fitz()
    with fitz.open(pdf_path) as doc:
        for page_index in range(len(doc)):
            page = doc[page_index]
            zoom = dpi / 72  # 72 DPI is PyMuPDF's default
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)

            mode = "RGB" if pix.alpha == 0 else "RGBA"
            img = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
            if mode == "RGBA":
                img = img.convert("RGB")
            images.append(img)
    return images


class OCRProcessor:
    @staticmethod
    def process_file(file_path: str) -> str:
        """
        Extracts text from an image or PDF file using ONLY
        local, free libraries:
        - Tesseract OCR (via pytesseract) for images
        - PyMuPDF (fitz) + Tesseract for PDFs

        This keeps the original interface used in views.py.
        """
        ext = os.path.splitext(file_path)[1].lower()

        try:
            if ext == ".pdf":
                return OCRProcessor._process_pdf(file_path)
            elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"]:
                return OCRProcessor._process_image(file_path)
            else:
                raise ValueError(f"Unsupported file type for OCR: {ext}")
        except Exception as e:
            logger.error(f"OCR failed for {file_path}: {str(e)}")
            raise

    @staticmethod
    def _process_image(image_path: str) -> str:
        """Processes a single image file with Tesseract."""
        image = Image.open(image_path)
        text = _image_to_text(image)
        return text.strip()

    @staticmethod
    def _process_pdf(pdf_path: str) -> str:
        """
        Processes a PDF in two stages:
        1) Try to read the embedded text layer directly (perfect for normal PDFs).
        2) If that fails or is basically empty, render pages and OCR them.
        """
        # Stage 1: direct text layer extraction (no OCR needed)
        direct_text = _pdf_extract_text_layer(pdf_path)
        if direct_text:
            logger.info("PDF text layer detected; using direct extraction instead of OCR.")
            return direct_text

        # Stage 2: fallback to OCR for scanned PDFs
        pages = _pdf_to_images_with_pymupdf(pdf_path)
        logger.info(f"PDF has {len(pages)} page(s). Starting OCR with Tesseract...")

        if not pages:
            return ""

        page_texts = []
        for idx, page_img in enumerate(pages, start=1):
            try:
                text = _image_to_text(page_img).strip()
                page_texts.append(text)
                logger.info(f"OCR completed for page {idx}")
            except Exception as e:
                logger.error(f"OCR failed for page {idx}: {e}")
                page_texts.append("")

        # Filter out completely empty pages
        non_empty_pages = [t for t in page_texts if t]
        if not non_empty_pages:
            return ""

        return "\n\n--- Page Break ---\n\n".join(non_empty_pages)
import pytesseract
from PIL import Image
import pypdfium2 as pdfium
import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

# Tesseract Discovery Cache
_TESSERACT_CONFIGURED = False

def _ensure_tesseract_configured():
    global _TESSERACT_CONFIGURED
    if _TESSERACT_CONFIGURED:
        return True
        
    common_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Tesseract-OCR', 'tesseract.exe'),
    ]
    
    # Also check if it's already in PATH
    import subprocess
    try:
        subprocess.run(['tesseract', '--version'], capture_output=True, check=True)
        _TESSERACT_CONFIGURED = True
        return True
    except:
        pass

    for path in common_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info(f"Tesseract found and configured at: {path}")
            _TESSERACT_CONFIGURED = True
            return True
            
    return False

class OCRProcessor:
    @staticmethod
    def process_file(file_path):
        """
        Extracts text from an image or PDF file.
        Returns the extracted text.
        """
        if not _ensure_tesseract_configured():
            logger.warning("Tesseract OCR not found in common Windows paths or system PATH.")
            # We don't raise yet, as pytesseract might still work if in PATH 
            # (though we checked above, it's safer to let the try/except handle it)
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext in ['.pdf']:
                return OCRProcessor._process_pdf(file_path)
            elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                return OCRProcessor._process_image(file_path)
            else:
                raise ValueError(f"Unsupported file type for OCR: {ext}")
        except Exception as e:
            logger.error(f"OCR failed for {file_path}: {str(e)}")
            raise e

    @staticmethod
    def _process_image(image_path):
        """Processes a single image file."""
        try:
            text = pytesseract.image_to_string(Image.open(image_path))
            return text.strip()
        except Exception as e:
            if "tesseract is not installed" in str(e).lower() or "not found" in str(e).lower():
                searched_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                    os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Tesseract-OCR', 'tesseract.exe'),
                ]
                msg = "Tesseract OCR engine not found. Searched in PATH and common locations: " + ", ".join(searched_paths)
                raise RuntimeError(msg)
            raise e

    @staticmethod
    def _process_pdf(pdf_path):
        """Processes a PDF file by converting pages to images using pypdfium2 and then running OCR."""
        try:
            # pypdfium2 is a great alternative to pdf2image as it doesn't require Poppler
            pdf = pdfium.PdfDocument(pdf_path)
            full_text = []
            
            for i in range(len(pdf)):
                # Render page to image (default scale is 1, which is 72 DPI, 
                # we increase it for better OCR accuracy)
                page = pdf.get_page(i)
                bitmap = page.render(scale=2) # 144 DPI
                pil_image = bitmap.to_pil()
                
                text = pytesseract.image_to_string(pil_image)
                full_text.append(text.strip())
                
                # Cleanup
                page.close()
            
            pdf.close()
            # Filter out empty pages and join
            clean_pages = [t for t in full_text if t.strip()]
            if not clean_pages:
                return ""
            return "\n\n--- Page Break ---\n\n".join(clean_pages)
        except Exception as e:
            logger.error(f"PDF OCR Error: {str(e)}")
            raise e

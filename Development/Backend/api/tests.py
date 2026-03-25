from django.test import SimpleTestCase

from .document_reconstruction import analyze_document, extract_expiry_metadata


class DocumentReconstructionTests(SimpleTestCase):
    def test_detects_passport_from_tags_and_text(self):
        analysis = analyze_document(
            tags=["passport", "travel"],
            metadata={"category": "identity"},
            text="Passport No: PA1234567\nFull Name: Samir Nepal\nExpiry Date: 2030-06-15",
            file_name="passport_scan.pdf",
        )

        self.assertEqual(analysis["document_type"], "passport")
        self.assertGreaterEqual(analysis["document_type_confidence"], 0.72)
        self.assertEqual(analysis["extracted_fields"]["passport_number"], "PA1234567")

    def test_extracts_expiry_date_from_english_phrase(self):
        expiry = extract_expiry_metadata("This passport is valid until 15 June 2030.")

        self.assertTrue(expiry["matched"])
        self.assertEqual(expiry["iso_date"], "2030-06-15")

    def test_keeps_unparsed_nepali_expiry_as_raw_metadata(self):
        expiry = extract_expiry_metadata("म्याद समाप्ति मिति: २०८४/०२/१०")

        self.assertTrue(expiry["matched"])
        self.assertEqual(expiry["raw_value"], "2084/02/10")
        self.assertIsNone(expiry["iso_date"])

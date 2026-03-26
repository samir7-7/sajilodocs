from __future__ import annotations

import io
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

from django.core.files.base import ContentFile
from django.utils import timezone
from PIL import Image, ImageColor, ImageDraw, ImageFont


DOCUMENT_TYPE_CONFIDENCE_THRESHOLD = 0.72
NEPALI_DIGIT_TRANSLATION = str.maketrans("०१२३४५६७८९", "0123456789")

SUPPORTED_DOCUMENT_TYPES: dict[str, dict[str, Any]] = {
    "citizenship_certificate": {
        "label": "Citizenship Certificate",
        "nepali_label": "नागरिकता प्रमाणपत्र",
        "template": "citizenship_certificate",
        "keywords": [
            "citizenship",
            "citizenship certificate",
            "citizenship no",
            "certificate no",
            "nagarikta",
            "nationality",
            "नागरिकता",
            "नागरिकता प्रमाणपत्र",
            "प्रमाणपत्र नं",
            "नागरिकता नं",
            "जिल्ला प्रशासन कार्यालय",
        ],
        "accent": "#1d4ed8",
        "secondary": "#dbeafe",
    },
    "passport": {
        "label": "Passport",
        "nepali_label": "राहदानी",
        "template": "passport",
        "keywords": [
            "passport",
            "passport no",
            "passport number",
            "machine readable passport",
            "mrp",
            "department of passports",
            "राहदानी",
            "पासपोर्ट",
            "राहदानी नं",
        ],
        "accent": "#7c2d12",
        "secondary": "#ffedd5",
    },
    "birth_certificate": {
        "label": "Birth Certificate",
        "nepali_label": "जन्म दर्ता प्रमाणपत्र",
        "template": "birth_certificate",
        "keywords": [
            "birth certificate",
            "birth registration",
            "certificate of birth",
            "birth no",
            "जन्म दर्ता",
            "जन्म प्रमाणपत्र",
            "जन्म मिति",
            "ward office",
            "municipality",
        ],
        "accent": "#15803d",
        "secondary": "#dcfce7",
    },
    "land_document": {
        "label": "Land Lease / Land Document",
        "nepali_label": "जग्गा सम्बन्धी कागजात",
        "template": "land_document",
        "keywords": [
            "land",
            "land lease",
            "land revenue",
            "land document",
            "lease deed",
            "plot no",
            "parcel no",
            "kitta",
            "lalpurja",
            "जग्गा",
            "लालपुर्जा",
            "कित्ता",
            "मोही",
            "भाडा",
            "पट्टा",
            "भूमि",
            "मालपोत",
        ],
        "accent": "#92400e",
        "secondary": "#fef3c7",
    },
    "other": {
        "label": "Other Official Document",
        "nepali_label": "अन्य आधिकारिक कागजात",
        "template": "other",
        "keywords": [],
        "accent": "#334155",
        "secondary": "#e2e8f0",
    },
}

FIELD_LABELS: dict[str, tuple[str, str]] = {
    "document_number": ("Document Number", "कागजात नं."),
    "citizenship_number": ("Citizenship Number", "नागरिकता नं."),
    "passport_number": ("Passport Number", "राहदानी नं."),
    "registration_number": ("Registration Number", "दर्ता नं."),
    "full_name": ("Full Name", "पूरा नाम"),
    "father_name": ("Father's Name", "बुवाको नाम"),
    "mother_name": ("Mother's Name", "आमाको नाम"),
    "spouse_name": ("Spouse Name", "श्रीमान/श्रीमतीको नाम"),
    "date_of_birth": ("Date of Birth", "जन्म मिति"),
    "birth_place": ("Place of Birth", "जन्म स्थान"),
    "gender": ("Gender", "लिङ्ग"),
    "nationality": ("Nationality", "राष्ट्रियता"),
    "address": ("Address", "ठेगाना"),
    "district": ("District", "जिल्ला"),
    "ward": ("Ward", "वडा"),
    "municipality": ("Municipality", "पालिका"),
    "issued_date": ("Issued Date", "जारी मिति"),
    "expiry_date": ("Expiry Date", "म्याद समाप्ति"),
    "issued_by": ("Issued By", "जारी गर्ने निकाय"),
    "authority": ("Authority", "अधिकृत निकाय"),
    "parcel_number": ("Parcel / Kitta Number", "कित्ता नं."),
    "plot_number": ("Plot Number", "प्लट नं."),
    "land_area": ("Land Area", "क्षेत्रफल"),
    "lease_period": ("Lease Period", "पट्टा अवधि"),
    "lease_holder": ("Lease Holder", "पट्टाधारी"),
    "office": ("Office", "कार्यालय"),
}

FIELD_ALIASES: dict[str, list[str]] = {
    "document_number": [
        "document number",
        "document no",
        "doc number",
        "doc no",
        "certificate number",
        "certificate no",
        "प्रमाणपत्र नं",
        "कागजात नं",
        "नं",
    ],
    "citizenship_number": ["citizenship number", "citizenship no", "नागरिकता नं", "नागरिकता नम्बर"],
    "passport_number": ["passport number", "passport no", "पासपोर्ट नं", "राहदानी नं"],
    "registration_number": ["registration number", "registration no", "birth registration no", "दर्ता नं", "दर्ता नम्बर"],
    "full_name": ["full name", "name", "holder name", "नाम", "नाम थर", "व्यक्तिको नाम"],
    "father_name": ["father's name", "father name", "name of father", "बुवाको नाम", "पिताको नाम"],
    "mother_name": ["mother's name", "mother name", "name of mother", "आमाको नाम", "माताको नाम"],
    "spouse_name": ["spouse name", "husband name", "wife name", "पति/पत्नीको नाम", "श्रीमानको नाम", "श्रीमतीको नाम"],
    "date_of_birth": ["date of birth", "dob", "birth date", "जन्म मिति", "जन्मको मिति"],
    "birth_place": ["place of birth", "birth place", "जन्म स्थान", "जन्म ठाउँ"],
    "gender": ["gender", "sex", "लिङ्ग"],
    "nationality": ["nationality", "राष्ट्रियता"],
    "address": ["address", "permanent address", "resident of", "ठेगाना", "स्थायी ठेगाना", "बसोबास"],
    "district": ["district", "जिल्ला"],
    "ward": ["ward", "ward no", "वडा", "वडा नं"],
    "municipality": ["municipality", "rural municipality", "metropolitan", "पालिका", "नगरपालिका", "गाउँपालिका"],
    "issued_date": ["issued date", "date of issue", "issued on", "जारी मिति", "जारी भएको मिति"],
    "expiry_date": ["expiry date", "expiration date", "expires on", "valid until", "valid till", "म्याद समाप्ति", "समाप्ति मिति", "वैध मिति"],
    "issued_by": ["issued by", "issuing authority", "जारी गर्ने", "जारी गर्ने निकाय"],
    "authority": ["authority", "office", "कार्यालय", "कार्यालयको नाम", "निकाय"],
    "parcel_number": ["parcel number", "parcel no", "kitta no", "kitta number", "कित्ता नं", "पार्सल नं"],
    "plot_number": ["plot number", "plot no", "प्लट नं"],
    "land_area": ["land area", "area", "क्षेत्रफल"],
    "lease_period": ["lease period", "validity period", "पट्टा अवधि", "बहाल अवधि"],
    "lease_holder": ["lease holder", "lessee", "पट्टाधारी", "मोहियानी"],
    "office": ["office", "कार्यालय", "ward office", "municipality office", "land revenue office", "मालपोत कार्यालय"],
}

SECTION_LAYOUTS: dict[str, list[dict[str, Any]]] = {
    "passport": [
        {"title": ("Identity Details", "पहिचान विवरण"), "fields": ["passport_number", "full_name", "date_of_birth", "gender", "nationality", "birth_place"]},
        {"title": ("Validity", "वैधता"), "fields": ["issued_date", "expiry_date", "issued_by", "authority"]},
        {"title": ("Address & References", "ठेगाना तथा सन्दर्भ"), "fields": ["address", "district", "office", "document_number"]},
    ],
    "citizenship_certificate": [
        {"title": ("Personal Details", "व्यक्तिगत विवरण"), "fields": ["citizenship_number", "full_name", "date_of_birth", "gender", "nationality"]},
        {"title": ("Family Details", "पारिवारिक विवरण"), "fields": ["father_name", "mother_name", "spouse_name"]},
        {"title": ("Residence & Issuance", "ठेगाना तथा जारी विवरण"), "fields": ["address", "district", "municipality", "ward", "issued_date", "issued_by", "office"]},
    ],
    "birth_certificate": [
        {"title": ("Birth Registration", "जन्म दर्ता विवरण"), "fields": ["registration_number", "full_name", "date_of_birth", "birth_place", "gender"]},
        {"title": ("Parents", "अभिभावक"), "fields": ["father_name", "mother_name", "address"]},
        {"title": ("Local Office", "स्थानीय कार्यालय"), "fields": ["municipality", "ward", "issued_date", "issued_by", "office"]},
    ],
    "land_document": [
        {"title": ("Land Record", "जग्गा विवरण"), "fields": ["document_number", "parcel_number", "plot_number", "land_area", "lease_period", "expiry_date"]},
        {"title": ("Holder Details", "धारकको विवरण"), "fields": ["lease_holder", "full_name", "address", "district"]},
        {"title": ("Authority", "कार्यालय"), "fields": ["issued_date", "issued_by", "office", "authority"]},
    ],
    "other": [
        {"title": ("Document Snapshot", "कागजात सारांश"), "fields": ["document_number", "full_name", "issued_date", "expiry_date", "issued_by", "authority", "address"]},
    ],
}


def _normalize_digits(value: str) -> str:
    return (value or "").translate(NEPALI_DIGIT_TRANSLATION)


def _normalize_for_match(value: str) -> str:
    if not value:
        return ""
    value = _normalize_digits(value)
    value = unicodedata.normalize("NFKC", value).lower()
    value = re.sub(r"[_\-]+", " ", value)
    value = re.sub(r"[^\w\s\u0900-\u097F/]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _display_name_from_key(document_type: str | None) -> str:
    if not document_type:
        return "Unspecified Document"
    if document_type in SUPPORTED_DOCUMENT_TYPES:
        return SUPPORTED_DOCUMENT_TYPES[document_type]["label"]
    return document_type.strip().title()


def _supported_type_value(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    normalized = _normalize_for_match(raw_value)
    if not normalized:
        return None

    for key, config in SUPPORTED_DOCUMENT_TYPES.items():
        aliases = {key, config["label"], config["nepali_label"], *config.get("keywords", [])}
        if any(_normalize_for_match(alias) == normalized for alias in aliases if alias):
            return key
    return None


def get_supported_document_types() -> list[dict[str, str]]:
    return [
        {
            "value": key,
            "label": config["label"],
            "nepali_label": config["nepali_label"],
        }
        for key, config in SUPPORTED_DOCUMENT_TYPES.items()
        if key != "other"
    ]


def get_document_type_label(document_type: str | None) -> str:
    return _display_name_from_key(document_type)


REGEX_FIELD_PATTERNS: dict[str, list[str]] = {
    "passport_number": [
        r"(?:passport(?:\s+number|\s+no\.?)?|राहदानी\s*नं\.?|पासपोर्ट\s*नं\.?)\s*[:\-]?\s*([A-Z0-9\/\-]{4,})",
        r"\b([A-Z]{1,2}\d{7,8})\b",
    ],
    "citizenship_number": [
        r"(?:citizenship(?:\s+number|\s+no\.?)?|नागरिकता\s*नं\.?|नागरिकता\s*नम्बर)\s*[:\-]?\s*([A-Z0-9\/\-]{4,})",
    ],
    "registration_number": [
        r"(?:registration(?:\s+number|\s+no\.?)?|दर्ता\s*नं\.?|दर्ता\s*नम्बर)\s*[:\-]?\s*([A-Z0-9\/\-]{3,})",
    ],
    "document_number": [
        r"(?:document(?:\s+number|\s+no\.?)?|certificate(?:\s+number|\s+no\.?)?|प्रमाणपत्र\s*नं\.?|कागजात\s*नं\.?)\s*[:\-]?\s*([A-Z0-9\/\-]{3,})",
    ],
    "date_of_birth": [
        r"(?:date\s+of\s+birth|birth\s+date|dob|जन्म\s*मिति)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "issued_date": [
        r"(?:issued\s+date|date\s+of\s+issue|issued\s+on|जारी\s*मिति)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "full_name": [
        r"(?:full\s+name|holder\s+name|name|नाम\s*थर|व्यक्तिको\s*नाम|नाम)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "father_name": [
        r"(?:father(?:'s)?\s+name|name\s+of\s+father|बुवाको\s*नाम|पिताको\s*नाम)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "mother_name": [
        r"(?:mother(?:'s)?\s+name|name\s+of\s+mother|आमाको\s*नाम|माताको\s*नाम)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "address": [
        r"(?:address|permanent\s+address|resident\s+of|ठेगाना|स्थायी\s*ठेगाना)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "birth_place": [
        r"(?:place\s+of\s+birth|birth\s+place|जन्म\s*स्थान)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "issued_by": [
        r"(?:issued\s+by|issuing\s+authority|जारी\s*गर्ने(?:\s*निकाय)?)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "parcel_number": [
        r"(?:parcel\s+number|parcel\s+no\.?|kitta\s+number|kitta\s+no\.?|कित्ता\s*नं\.?)\s*[:\-]?\s*([A-Z0-9\/\-]{1,})",
    ],
    "plot_number": [
        r"(?:plot\s+number|plot\s+no\.?|प्लट\s*नं\.?)\s*[:\-]?\s*([A-Z0-9\/\-]{1,})",
    ],
    "land_area": [
        r"(?:land\s+area|area|क्षेत्रफल)\s*[:\-]?\s*([^\n\r]+)",
    ],
    "lease_period": [
        r"(?:lease\s+period|validity\s+period|पट्टा\s*अवधि|बहाल\s*अवधि)\s*[:\-]?\s*([^\n\r]+)",
    ],
}

EXPIRY_KEYWORD_PATTERN = re.compile(
    r"(expiry\s+date|expiration\s+date|expires\s+on|valid\s+until|valid\s+till|expiry|म्याद\s*समाप्ति\s*मिति|समाप्ति\s*मिति|वैध\s*मिति|म्याद\s*सम्म)",
    re.IGNORECASE,
)

DATE_PATTERNS = [
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%d.%m.%Y",
    "%m/%d/%Y",
    "%m-%d-%Y",
    "%d %B %Y",
    "%d %b %Y",
    "%B %d, %Y",
    "%b %d, %Y",
    "%d %B, %Y",
    "%d %b, %Y",
]


def detect_document_type(
    *,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
    text: str = "",
    file_name: str = "",
) -> dict[str, Any]:
    tags = tags or []
    metadata = metadata or {}

    tag_corpus = _normalize_for_match(" ".join(str(tag) for tag in tags))
    metadata_corpus = _normalize_for_match(
        " ".join(
            str(metadata.get(key, ""))
            for key in ("category", "description", "document_type", "documentType")
        )
    )
    text_corpus = _normalize_for_match(text[:12000])
    name_corpus = _normalize_for_match(file_name)

    scores: dict[str, float] = {}
    evidence: dict[str, list[str]] = {}
    for key, config in SUPPORTED_DOCUMENT_TYPES.items():
        if key == "other":
            continue
        score = 0.0
        matched_evidence: list[str] = []
        for keyword in config.get("keywords", []):
            normalized_keyword = _normalize_for_match(keyword)
            if not normalized_keyword:
                continue
            if normalized_keyword in tag_corpus:
                score += 0.55
                matched_evidence.append(f"tag:{keyword}")
            if normalized_keyword in metadata_corpus:
                score += 0.32
                matched_evidence.append(f"metadata:{keyword}")
            if normalized_keyword in name_corpus:
                score += 0.25
                matched_evidence.append(f"filename:{keyword}")
            if normalized_keyword in text_corpus:
                occurrences = max(1, text_corpus.count(normalized_keyword))
                score += min(0.28, 0.08 * occurrences)
                matched_evidence.append(f"text:{keyword}")

        if key == "passport" and re.search(r"\b[A-Z]{1,2}\d{7,8}\b", text):
            score += 0.24
            matched_evidence.append("pattern:passport-number")
        if key == "citizenship_certificate" and ("district administration office" in text_corpus or "जिल्ला प्रशासन" in text_corpus):
            score += 0.18
            matched_evidence.append("pattern:district-administration")
        if key == "birth_certificate" and ("birth registration" in text_corpus or "जन्म दर्ता" in text_corpus):
            score += 0.18
            matched_evidence.append("pattern:birth-registration")
        if key == "land_document" and ("land revenue" in text_corpus or "मालपोत" in text_corpus):
            score += 0.18
            matched_evidence.append("pattern:land-revenue")

        scores[key] = score
        evidence[key] = matched_evidence

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    top_key, top_score = ranked[0] if ranked else (None, 0.0)
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0
    confidence = round(
        min(0.99, max(0.0, (top_score * 0.88) + max(0.0, (top_score - second_score) * 0.45))),
        2,
    )
    is_confident = confidence >= DOCUMENT_TYPE_CONFIDENCE_THRESHOLD

    source = None
    if top_key:
        evidence_blob = " ".join(evidence.get(top_key, []))
        if "tag:" in evidence_blob:
            source = "TAG"
        elif "metadata:" in evidence_blob:
            source = "METADATA"
        elif "filename:" in evidence_blob:
            source = "FILENAME"
        else:
            source = "CONTENT"

    candidates = [
        {
            "value": key,
            "label": SUPPORTED_DOCUMENT_TYPES[key]["label"],
            "confidence": round(min(0.99, score), 2),
        }
        for key, score in ranked
        if score > 0
    ][:4]

    return {
        "document_type": top_key,
        "document_type_label": _display_name_from_key(top_key),
        "confidence": confidence,
        "source": source,
        "candidates": candidates,
        "requires_manual_selection": not is_confident,
    }


def _extract_line_pairs(text: str) -> dict[str, str]:
    alias_pool = {
        _normalize_for_match(alias)
        for aliases in FIELD_ALIASES.values()
        for alias in aliases
        if alias
    }
    pairs: dict[str, str] = {}
    previous_label: str | None = None
    for raw_line in text.splitlines():
        line = raw_line.strip().strip("|")
        if not line:
            previous_label = None
            continue

        if ":" in line:
            label, value = line.split(":", 1)
            normalized_label = _normalize_for_match(label)
            if normalized_label and value.strip():
                pairs[normalized_label] = value.strip()
                previous_label = None
                continue

        if re.search(r"\s+-\s+", line):
            label, value = re.split(r"\s+-\s+", line, maxsplit=1)
            normalized_label = _normalize_for_match(label)
            if normalized_label and value.strip():
                pairs[normalized_label] = value.strip()
                previous_label = None
                continue

        normalized_line = _normalize_for_match(line)
        if normalized_line in alias_pool:
            previous_label = normalized_line
            continue

        if previous_label and normalized_line:
            pairs[previous_label] = line
            previous_label = None

    return pairs


def _clean_field_value(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().strip("-").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    if not cleaned:
        return None
    if len(cleaned) > 180:
        cleaned = cleaned[:177].rstrip() + "..."
    return cleaned


def _match_pair_value(pairs: dict[str, str], aliases: list[str]) -> str | None:
    normalized_aliases = [_normalize_for_match(alias) for alias in aliases]
    for pair_label, pair_value in pairs.items():
        if any(alias and alias == pair_label for alias in normalized_aliases):
            return _clean_field_value(pair_value)
    for pair_label, pair_value in pairs.items():
        if any(alias and alias in pair_label for alias in normalized_aliases):
            return _clean_field_value(pair_value)
    return None


def _match_regex_value(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return _clean_field_value(match.group(1))
    return None


def _parse_date_value(raw_value: str | None) -> dict[str, Any]:
    if not raw_value:
        return {"raw": None, "date": None, "calendar": None}

    raw_value = raw_value.strip().strip(".,;")
    normalized = _normalize_digits(raw_value)
    normalized = re.sub(r"\s+", " ", normalized)

    date_candidate_match = re.search(
        r"(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}|(?:\d{1,2}\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{1,2},?\s+\d{4}|(?:\d{1,2}\s+)(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})",
        normalized,
        re.IGNORECASE,
    )
    candidate = date_candidate_match.group(1) if date_candidate_match else normalized
    candidate = candidate.strip().rstrip(".,;)")

    for fmt in DATE_PATTERNS:
        try:
            parsed = datetime.strptime(candidate, fmt).date()
            if parsed.year > timezone.now().year + 30:
                return {
                    "raw": candidate,
                    "date": None,
                    "calendar": "LIKELY_BS",
                }
            return {
                "raw": candidate,
                "date": parsed,
                "calendar": "AD",
            }
        except ValueError:
            continue

    return {
        "raw": candidate,
        "date": None,
        "calendar": "UNPARSED",
    }


def extract_expiry_metadata(text: str) -> dict[str, Any]:
    text = text or ""
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if EXPIRY_KEYWORD_PATTERN.search(line):
            parsed = _parse_date_value(line)
            return {
                "matched": True,
                "source_text": line,
                "raw_value": parsed["raw"],
                "iso_date": parsed["date"].isoformat() if parsed["date"] else None,
                "calendar": parsed["calendar"],
                "confidence": 0.92 if parsed["date"] else 0.62,
            }

    normalized_text = _normalize_digits(text)
    keyword_match = EXPIRY_KEYWORD_PATTERN.search(normalized_text)
    if keyword_match:
        snippet = normalized_text[keyword_match.start() : keyword_match.start() + 120]
        parsed = _parse_date_value(snippet)
        return {
            "matched": True,
            "source_text": snippet.strip(),
            "raw_value": parsed["raw"],
            "iso_date": parsed["date"].isoformat() if parsed["date"] else None,
            "calendar": parsed["calendar"],
            "confidence": 0.88 if parsed["date"] else 0.55,
        }

    return {
        "matched": False,
        "source_text": None,
        "raw_value": None,
        "iso_date": None,
        "calendar": None,
        "confidence": 0.0,
    }


def extract_structured_fields(document_type: str | None, text: str, metadata: dict[str, Any] | None = None) -> dict[str, str]:
    pairs = _extract_line_pairs(text)
    metadata = metadata or {}
    extracted: dict[str, str] = {}

    for field_name, aliases in FIELD_ALIASES.items():
        value = _match_pair_value(pairs, aliases)
        if not value:
            value = _match_regex_value(text, REGEX_FIELD_PATTERNS.get(field_name, []))
        if value:
            extracted[field_name] = value

    if document_type == "passport" and not extracted.get("document_number"):
        extracted["document_number"] = extracted.get("passport_number")
    if document_type == "citizenship_certificate" and not extracted.get("document_number"):
        extracted["document_number"] = extracted.get("citizenship_number")
    if document_type == "birth_certificate" and not extracted.get("document_number"):
        extracted["document_number"] = extracted.get("registration_number")

    if not extracted.get("authority"):
        extracted["authority"] = _clean_field_value(
            metadata.get("author")
            or metadata.get("category")
            or extracted.get("issued_by")
            or extracted.get("office")
        )

    expiry_meta = extract_expiry_metadata(text)
    if expiry_meta["raw_value"] and not extracted.get("expiry_date"):
        extracted["expiry_date"] = expiry_meta["raw_value"]

    issued_date = extracted.get("issued_date")
    if issued_date:
        issued_parsed = _parse_date_value(issued_date)
        if issued_parsed["raw"]:
            extracted["issued_date"] = issued_parsed["raw"]

    return extracted


def analyze_document(
    *,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
    text: str = "",
    file_name: str = "",
    selected_document_type: str | None = None,
    preserve_manual_document_type: str | None = None,
    preferred_document_type_source: str | None = None,
) -> dict[str, Any]:
    detection = detect_document_type(tags=tags, metadata=metadata, text=text, file_name=file_name)
    supported_key = _supported_type_value(selected_document_type or "")

    if selected_document_type:
        resolved_type = supported_key or selected_document_type.strip()
        document_type_source = "MANUAL"
        confidence = 1.0
    elif preserve_manual_document_type:
        resolved_type = preserve_manual_document_type
        document_type_source = preferred_document_type_source or "MANUAL"
        confidence = 1.0 if document_type_source == "MANUAL" else max(
            detection["confidence"],
            DOCUMENT_TYPE_CONFIDENCE_THRESHOLD,
        )
    else:
        resolved_type = detection["document_type"]
        document_type_source = detection["source"]
        confidence = detection["confidence"]

    extracted_fields = extract_structured_fields(resolved_type, text, metadata)
    expiry_meta = extract_expiry_metadata(text)

    return {
        "document_type": resolved_type,
        "document_type_label": _display_name_from_key(resolved_type),
        "document_type_confidence": confidence,
        "document_type_source": document_type_source,
        "detected_document_type": detection["document_type"],
        "detected_document_type_label": detection["document_type_label"],
        "detection_candidates": detection["candidates"],
        "requires_manual_selection": bool(
            not selected_document_type
            and not preserve_manual_document_type
            and detection["requires_manual_selection"]
        ),
        "expiry": expiry_meta,
        "extracted_fields": extracted_fields,
    }


def merge_analysis_into_metadata(existing_metadata: dict[str, Any] | None, analysis: dict[str, Any]) -> dict[str, Any]:
    metadata = dict(existing_metadata or {})
    metadata["document_analysis"] = {
        "document_type": analysis.get("document_type"),
        "document_type_label": analysis.get("document_type_label"),
        "document_type_confidence": analysis.get("document_type_confidence"),
        "document_type_source": analysis.get("document_type_source"),
        "detected_document_type": analysis.get("detected_document_type"),
        "detected_document_type_label": analysis.get("detected_document_type_label"),
        "detection_candidates": analysis.get("detection_candidates", []),
        "expiry": analysis.get("expiry", {}),
        "extracted_fields": analysis.get("extracted_fields", {}),
        "updated_at": timezone.now().isoformat(),
    }
    return metadata


def should_require_manual_document_type(file_obj, analysis: dict[str, Any], explicit_document_type: str | None = None) -> bool:
    if explicit_document_type:
        return False
    if file_obj.document_type and file_obj.document_type_source == "MANUAL":
        return False
    if file_obj.document_type and (file_obj.document_type_confidence or 0) >= DOCUMENT_TYPE_CONFIDENCE_THRESHOLD:
        return False
    return analysis.get("requires_manual_selection", False)


def apply_analysis_to_file(file_obj, analysis: dict[str, Any], *, reviewed_text: str | None = None) -> None:
    previous_expiry_date = file_obj.expiry_date
    if reviewed_text is not None:
        file_obj.corrected_ocr_text = reviewed_text
    file_obj.document_type = analysis.get("document_type")
    file_obj.document_type_confidence = analysis.get("document_type_confidence")
    file_obj.document_type_source = analysis.get("document_type_source")
    file_obj.extracted_fields = analysis.get("extracted_fields", {})
    expiry = analysis.get("expiry", {})
    file_obj.expiry_text = expiry.get("raw_value")
    file_obj.expiry_date = datetime.fromisoformat(expiry["iso_date"]).date() if expiry.get("iso_date") else None
    if previous_expiry_date != file_obj.expiry_date:
        file_obj.expiry_notification_sent_at = None
    file_obj.metadata = merge_analysis_into_metadata(file_obj.metadata, analysis)


def _resolve_font_path() -> str | None:
    candidate_paths = [
        Path(r"C:\Windows\Fonts\Nirmala.ttc"),
        Path(r"C:\Windows\Fonts\Mangal.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
    ]
    for path in candidate_paths:
        if path.exists():
            return str(path)
    return None


class ReconstructionRenderer:
    page_width = 1240
    page_height = 1754
    margin = 86
    footer_height = 88

    def __init__(self, *, template_key: str, document_title: str, file_name: str):
        self.template = SUPPORTED_DOCUMENT_TYPES.get(template_key, SUPPORTED_DOCUMENT_TYPES["other"])
        self.document_title = document_title
        self.file_name = file_name
        self.font_path = _resolve_font_path()
        self.page_number = 0
        self.pages: list[Image.Image] = []
        self.current_image: Image.Image | None = None
        self.draw: ImageDraw.ImageDraw | None = None
        self.cursor_y = 0

        self.font_small = self._font(22)
        self.font_body = self._font(28)
        self.font_body_bold = self._font(30)
        self.font_label = self._font(21)
        self.font_title = self._font(46)
        self.font_subtitle = self._font(26)
        self.font_watermark = self._font(66)
        self._new_page(continuation=False)

    def _font(self, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
        if self.font_path:
            try:
                return ImageFont.truetype(self.font_path, size=size)
            except OSError:
                pass
        return ImageFont.load_default()

    def _line_height(self, font: ImageFont.ImageFont, fallback: int) -> int:
        return getattr(font, "size", fallback) + 8

    def _new_page(self, *, continuation: bool) -> None:
        background = Image.new("RGB", (self.page_width, self.page_height), "#f8fafc")
        accent = ImageColor.getrgb(self.template["accent"])
        secondary = ImageColor.getrgb(self.template["secondary"])
        draw = ImageDraw.Draw(background)

        draw.rectangle([(0, 0), (self.page_width, 170)], fill=accent)
        draw.rectangle([(0, 170), (self.page_width, 210)], fill=secondary)
        draw.rounded_rectangle(
            [(28, 28), (self.page_width - 28, self.page_height - 28)],
            radius=28,
            outline=accent,
            width=4,
        )
        draw.rounded_rectangle(
            [(48, 48), (self.page_width - 48, self.page_height - 48)],
            radius=24,
            outline=secondary,
            width=2,
        )

        seal_center = (self.page_width - 155, 105)
        draw.ellipse((seal_center[0] - 58, seal_center[1] - 58, seal_center[0] + 58, seal_center[1] + 58), outline="white", width=4)
        draw.ellipse((seal_center[0] - 44, seal_center[1] - 44, seal_center[0] + 44, seal_center[1] + 44), outline="white", width=2)
        draw.text((seal_center[0] - 38, seal_center[1] - 14), "SD", fill="white", font=self.font_body_bold)

        header_title = self.document_title
        if continuation:
            header_title = f"{header_title} (Continuation)"

        draw.text((self.margin, 58), header_title, fill="white", font=self.font_title)
        draw.text(
            (self.margin, 116),
            "Digitally reconstructed copy | कानुनी नोटरीकृत प्रति होइन",
            fill="white",
            font=self.font_subtitle,
        )

        watermark = "RECONSTRUCTED COPY"
        bbox = draw.textbbox((0, 0), watermark, font=self.font_watermark)
        watermark_width = bbox[2] - bbox[0]
        draw.text(
            ((self.page_width - watermark_width) / 2, self.page_height - 220),
            watermark,
            fill=(226, 232, 240),
            font=self.font_watermark,
        )

        self.page_number += 1
        draw.text(
            (self.margin, self.page_height - 62),
            f"{self.file_name} | Page {self.page_number}",
            fill="#475569",
            font=self.font_small,
        )
        draw.text(
            (self.page_width - 455, self.page_height - 62),
            "Generated by SajiloDocs reconstruction workflow",
            fill="#475569",
            font=self.font_small,
        )

        self.current_image = background
        self.draw = draw
        self.cursor_y = 250
        self.pages.append(background)

    def _ensure_space(self, required_height: int) -> None:
        if self.cursor_y + required_height > self.page_height - self.footer_height - self.margin:
            self._new_page(continuation=True)

    def _wrap_text(self, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
        if not text:
            return [""]
        lines: list[str] = []
        for paragraph in text.splitlines():
            if not paragraph.strip():
                lines.append("")
                continue
            words = paragraph.split()
            current = ""
            for word in words:
                tentative = word if not current else f"{current} {word}"
                bbox = self.draw.textbbox((0, 0), tentative, font=font)
                if bbox[2] - bbox[0] <= max_width:
                    current = tentative
                else:
                    if current:
                        lines.append(current)
                    current = word
            if current:
                lines.append(current)
        return lines or [""]

    def add_metadata_summary(self, items: list[tuple[str, str]]) -> None:
        badge_x = self.margin
        badge_y = self.cursor_y
        for label, value in items:
            if not value:
                continue
            badge_text = f"{label}: {value}"
            bbox = self.draw.textbbox((0, 0), badge_text, font=self.font_small)
            badge_width = (bbox[2] - bbox[0]) + 36
            if badge_x + badge_width > self.page_width - self.margin:
                badge_x = self.margin
                badge_y += 62
            self.draw.rounded_rectangle(
                [(badge_x, badge_y), (badge_x + badge_width, badge_y + 42)],
                radius=16,
                fill="white",
                outline=self.template["accent"],
                width=2,
            )
            self.draw.text((badge_x + 18, badge_y + 8), badge_text, fill="#0f172a", font=self.font_small)
            badge_x += badge_width + 12
        self.cursor_y = badge_y + 78

    def add_section_title(self, title_en: str, title_ne: str) -> None:
        self._ensure_space(74)
        self.draw.rounded_rectangle(
            [(self.margin, self.cursor_y), (self.page_width - self.margin, self.cursor_y + 58)],
            radius=18,
            fill=self.template["secondary"],
            outline=self.template["accent"],
            width=2,
        )
        self.draw.text((self.margin + 24, self.cursor_y + 12), f"{title_en} | {title_ne}", fill="#0f172a", font=self.font_body_bold)
        self.cursor_y += 74

    def add_field_rows(self, items: list[tuple[str, str, str]]) -> None:
        label_width = 325
        value_width = self.page_width - (self.margin * 2) - label_width - 48
        for english_label, nepali_label, value in items:
            wrapped_lines = self._wrap_text(value, self.font_body, value_width)
            line_height = self._line_height(self.font_body, 28)
            row_height = max(84, 28 + len(wrapped_lines) * line_height)
            self._ensure_space(row_height + 12)

            top = self.cursor_y
            bottom = top + row_height
            self.draw.rounded_rectangle(
                [(self.margin, top), (self.page_width - self.margin, bottom)],
                radius=16,
                fill="white",
                outline="#cbd5e1",
                width=2,
            )
            self.draw.text((self.margin + 22, top + 18), english_label, fill="#0f172a", font=self.font_label)
            self.draw.text((self.margin + 22, top + 44), nepali_label, fill="#64748b", font=self.font_small)

            value_x = self.margin + label_width
            for index, line in enumerate(wrapped_lines):
                self.draw.text(
                    (value_x, top + 16 + (index * line_height)),
                    line,
                    fill="#0f172a",
                    font=self.font_body,
                )
            self.cursor_y = bottom + 12

    def add_text_block(self, title_en: str, title_ne: str, body: str) -> None:
        self.add_section_title(title_en, title_ne)
        lines = self._wrap_text(body, self.font_body, self.page_width - (self.margin * 2) - 36)
        line_height = self._line_height(self.font_body, 28) + 2
        for chunk_start in range(0, len(lines), 18):
            chunk = lines[chunk_start : chunk_start + 18]
            box_height = 42 + (len(chunk) * line_height)
            self._ensure_space(box_height + 12)
            top = self.cursor_y
            bottom = top + box_height
            self.draw.rounded_rectangle(
                [(self.margin, top), (self.page_width - self.margin, bottom)],
                radius=20,
                fill="white",
                outline="#cbd5e1",
                width=2,
            )
            for index, line in enumerate(chunk):
                self.draw.text(
                    (self.margin + 18, top + 18 + (index * line_height)),
                    line,
                    fill="#1e293b",
                    font=self.font_body,
                )
            self.cursor_y = bottom + 12

    def to_pdf_bytes(self) -> bytes:
        buffer = io.BytesIO()
        rgb_pages = [page.convert("RGB") for page in self.pages]
        rgb_pages[0].save(buffer, format="PDF", save_all=True, append_images=rgb_pages[1:])
        return buffer.getvalue()


def _build_render_sections(document_type: str | None, extracted_fields: dict[str, str], corrected_text: str, translated_text: str | None) -> list[dict[str, Any]]:
    template_key = document_type if document_type in SECTION_LAYOUTS else "other"
    sections = []
    for section in SECTION_LAYOUTS.get(template_key, SECTION_LAYOUTS["other"]):
        items = []
        for field_key in section["fields"]:
            value = extracted_fields.get(field_key)
            if value:
                english_label, nepali_label = FIELD_LABELS.get(field_key, (field_key.replace("_", " ").title(), field_key))
                items.append((english_label, nepali_label, value))
        if items:
            sections.append(
                {
                    "kind": "fields",
                    "title": section["title"],
                    "items": items,
                }
            )

    sections.append(
        {
            "kind": "text",
            "title": ("Corrected Extracted Content", "सच्याइएको OCR सामग्री"),
            "body": corrected_text.strip(),
        }
    )

    if translated_text and translated_text.strip():
        sections.append(
            {
                "kind": "text",
                "title": ("Translated Support Copy", "अनुवादित सहायक प्रति"),
                "body": translated_text.strip(),
            }
        )

    return sections


def generate_reconstructed_pdf(file_obj) -> bytes:
    corrected_text = (file_obj.corrected_ocr_text or file_obj.ocr_text or "").strip()
    extracted_fields = file_obj.extracted_fields or {}
    template_key = file_obj.document_type if file_obj.document_type in SUPPORTED_DOCUMENT_TYPES else "other"
    display_title = _display_name_from_key(file_obj.document_type)

    renderer = ReconstructionRenderer(
        template_key=template_key,
        document_title=display_title,
        file_name=file_obj.name,
    )

    summary_items = [
        ("Document Type", display_title),
        ("Source", file_obj.document_type_source or "OCR"),
        ("Generated", timezone.localtime(timezone.now()).strftime("%d %b %Y %H:%M")),
        ("Expiry", file_obj.expiry_text or "Not detected"),
    ]
    if extracted_fields.get("document_number"):
        summary_items.insert(1, ("Reference", extracted_fields["document_number"]))
    renderer.add_metadata_summary(summary_items)

    for section in _build_render_sections(file_obj.document_type, extracted_fields, corrected_text, file_obj.translated_text):
        title_en, title_ne = section["title"]
        if section["kind"] == "fields":
            renderer.add_section_title(title_en, title_ne)
            renderer.add_field_rows(section["items"])
        else:
            renderer.add_text_block(title_en, title_ne, section["body"])

    return renderer.to_pdf_bytes()


def save_reconstructed_pdf(file_obj) -> None:
    pdf_bytes = generate_reconstructed_pdf(file_obj)
    stem = Path(file_obj.name).stem or "document"
    target_name = f"{stem}_reconstructed.pdf"
    if file_obj.notarized_file:
        try:
            storage = file_obj.notarized_file.storage
            if file_obj.notarized_file.name and storage.exists(file_obj.notarized_file.name):
                storage.delete(file_obj.notarized_file.name)
        except OSError:
            pass

    file_obj.notarized_file.save(target_name, ContentFile(pdf_bytes), save=False)
    file_obj.is_notarized = True
    file_obj.notarized_generated_at = timezone.now()

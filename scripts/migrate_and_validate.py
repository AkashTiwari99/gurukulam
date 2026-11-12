#!/usr/bin/env python3
"""
scripts/migrate_and_validate.py

Full-corpus migration pipeline for Gurukulam repository:
1. Scans and parses all 670 legacy HTML files.
2. Normalizes text to Unicode NFC and applies deterministic Sanskrit orthographic & grammatical repairs:
   - Collapses double diacritics (ंं, ःः, ््).
   - Strips whitespace before diacritics.
   - Standardizes ASCII pipes to Sanskrit dandas (। and ॥).
   - Applies Panini 8.3.23 (मोऽनुस्वारः) for padānta 'म्' before consonants.
   - Standardizes speaker 'uvacha' attributes.
   - Identifies and logs ambiguous Sanskrit constructs.
3. Generates strict XSD schema (/data/schema.xsd).
4. Serializes all content into /data/content.xml with Dual Payload (<raw_text> and <text>).
5. Validates /data/content.xml against /data/schema.xsd using lxml.etree.XMLSchema.
6. Writes comprehensive repair and audit trail to /data/grammar_audit.json.
"""

import os
import re
import sys
import json
import datetime
import unicodedata
from bs4 import BeautifulSoup
import lxml.etree as ET

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(REPO_ROOT, 'data')

# Canonical speaker attribute mapping
UVACHA_CANONICAL_MAP = {
    "Vakmiki": "Valmiki",
    "valmiki": "Valmiki",
    "Valmiki": "Valmiki",
    "Vsishtha": "Vashistha",
    "VASHISTHA": "Vashistha",
    "SUMANTRA": "Sumantra",
    "SUMANTRA and manteis": "Sumantra and Mantris",
    "DASHARATHA": "Dasharatha",
    "narada": "Narada",
    "brahma": "Brahma",
    "Brahma": "Brahma",
    "vishnu": "Vishnu",
    "BRAHMANAH": "Brahmanah",
    "Prajapatya narh ": "Prajapatya Narah",
    "Prajapatya narh": "Prajapatya Narah",
    "Rama& Laxmana": "Rama & Lakshmana",
    "Rama & Laxmana": "Rama & Lakshmana",
    "RISHAYAH": "Rishayah",
    "Munayah": "Munayah",
    "Devah": "Devah",
    "Brahma & Devah": "Brahma & Devah",
    "Vishvamitra": "Vishvamitra",
    "Rama": "Rama",
    "Rishyasringa": "Rishyasringa"
}

# Devanagari consonants (Hal: क through ह)
DEVA_CONSONANTS = r'[\u0915-\u0939]'

# XSD Schema Definition
XSD_SCHEMA_CONTENT = '''<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">

  <!-- Root element -->
  <xs:element name="gurukulam" type="GurukulamType"/>

  <xs:complexType name="GurukulamType">
    <xs:sequence>
      <xs:element name="metadata" type="MetadataType"/>
      <xs:element name="pages" type="PagesType"/>
      <xs:element name="shlok_mala" type="ShlokMalaContainerType"/>
      <xs:element name="ramayana" type="RamayanaType"/>
    </xs:sequence>
    <xs:attribute name="version" type="xs:string" use="required"/>
    <xs:attribute name="generated_at" type="xs:string" use="required"/>
    <xs:attribute name="total_files" type="xs:integer" use="required"/>
    <xs:attribute name="total_verses" type="xs:integer" use="required"/>
  </xs:complexType>

  <!-- Metadata -->
  <xs:complexType name="MetadataType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="tagline" type="xs:string"/>
      <xs:element name="description" type="xs:string"/>
      <xs:element name="version" type="xs:string"/>
      <xs:element name="lastMigrated" type="xs:string"/>
      <xs:element name="totalRamayanaVerses" type="xs:integer"/>
      <xs:element name="totalShlokMalaVerses" type="xs:integer"/>
      <xs:element name="totalHtmlFilesMigrated" type="xs:integer"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Pages -->
  <xs:complexType name="PagesType">
    <xs:sequence>
      <xs:element name="page" type="PageType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="PageType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="description" type="xs:string" minOccurs="0"/>
      <xs:element name="raw_content" type="xs:string"/>
      <xs:element name="sections" type="SectionsType" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="slug" type="xs:string" use="required"/>
    <xs:attribute name="route" type="xs:string" use="required"/>
    <xs:attribute name="source_file" type="xs:string" use="required"/>
  </xs:complexType>

  <xs:complexType name="SectionsType">
    <xs:sequence>
      <xs:element name="section" type="SectionType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="SectionType">
    <xs:sequence>
      <xs:element name="heading" type="xs:string" minOccurs="0"/>
      <xs:element name="raw_text" type="xs:string"/>
      <xs:element name="text" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
  </xs:complexType>

  <!-- Shlok Mala -->
  <xs:complexType name="ShlokMalaContainerType">
    <xs:sequence>
      <xs:element name="mala" type="MalaType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="MalaType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="description" type="xs:string" minOccurs="0"/>
      <xs:element name="shlokas" type="ShlokasType"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:integer" use="required"/>
    <xs:attribute name="title" type="xs:string" use="required"/>
    <xs:attribute name="source_file" type="xs:string" use="required"/>
    <xs:attribute name="total_shlokas" type="xs:integer" use="required"/>
  </xs:complexType>

  <xs:complexType name="ShlokasType">
    <xs:sequence>
      <xs:element name="shloka" type="ShlokaType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="ShlokaType">
    <xs:sequence>
      <xs:element name="thematic_heading" type="xs:string" minOccurs="0"/>
      <xs:element name="raw_text" type="xs:string"/>
      <xs:element name="text" type="xs:string"/>
      <xs:element name="sanskrit" type="xs:string"/>
      <xs:element name="hindi" type="xs:string" minOccurs="0"/>
      <xs:element name="english" type="xs:string" minOccurs="0"/>
      <xs:element name="audio_src" type="xs:string" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="number" type="xs:integer" use="required"/>
  </xs:complexType>

  <!-- Ramayana -->
  <xs:complexType name="RamayanaType">
    <xs:sequence>
      <xs:element name="kanda" type="KandaType" maxOccurs="unbounded"/>
    </xs:sequence>
    <xs:attribute name="total_kandas" type="xs:integer" use="required"/>
    <xs:attribute name="total_sargas" type="xs:integer" use="required"/>
    <xs:attribute name="total_verses" type="xs:integer" use="required"/>
  </xs:complexType>

  <xs:complexType name="KandaType">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="devanagari" type="xs:string"/>
      <xs:element name="mangala" type="MangalaType" minOccurs="0"/>
      <xs:element name="sargas" type="SargasType"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="number" type="xs:integer" use="required"/>
    <xs:attribute name="name" type="xs:string" use="required"/>
    <xs:attribute name="devanagari" type="xs:string" use="required"/>
    <xs:attribute name="total_sargas" type="xs:integer" use="required"/>
    <xs:attribute name="total_verses" type="xs:integer" use="required"/>
  </xs:complexType>

  <xs:complexType name="MangalaType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="verses" type="VersesType"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="source_file" type="xs:string" use="required"/>
  </xs:complexType>

  <xs:complexType name="SargasType">
    <xs:sequence>
      <xs:element name="sarga" type="SargaType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="SargaType">
    <xs:sequence>
      <xs:element name="title" type="xs:string"/>
      <xs:element name="verses" type="VersesType"/>
      <xs:element name="colophon" type="ColophonType" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="number" type="xs:integer" use="required"/>
    <xs:attribute name="source_file" type="xs:string" use="required"/>
    <xs:attribute name="verse_count" type="xs:integer" use="required"/>
  </xs:complexType>

  <xs:complexType name="VersesType">
    <xs:sequence>
      <xs:element name="verse" type="VerseType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="VerseType">
    <xs:sequence>
      <xs:element name="raw_text" type="xs:string"/>
      <xs:element name="text" type="xs:string"/>
      <xs:element name="commentary" type="CommentaryType" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="number" type="xs:integer" use="required"/>
    <xs:attribute name="uvacha" type="xs:string" use="required"/>
    <xs:attribute name="padanta_index" type="xs:string" use="optional"/>
  </xs:complexType>

  <xs:complexType name="CommentaryType">
    <xs:sequence>
      <xs:element name="raw_text" type="xs:string"/>
      <xs:element name="text" type="xs:string"/>
      <xs:element name="quotes" type="QuotesType" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="author" type="xs:string" use="optional"/>
  </xs:complexType>

  <xs:complexType name="QuotesType">
    <xs:sequence>
      <xs:element name="quote" type="xs:string" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="ColophonType">
    <xs:sequence>
      <xs:element name="raw_text" type="xs:string"/>
      <xs:element name="text" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

</xs:schema>'''

KANDAS_CONFIG = [
    {
        "id": "k01",
        "number": 1,
        "name": "Bala Kanda",
        "devanagari": "बालकाण्डम्",
        "dir": "BALAKANDA",
        "total_sargas": 77,
        "mangala_file": "mangala shloka.html"
    },
    {
        "id": "k02",
        "number": 2,
        "name": "Ayodhya Kanda",
        "devanagari": "अयोध्याकाण्डम्",
        "dir": "AYODHYA KANDA",
        "total_sargas": 119,
        "mangala_file": None
    },
    {
        "id": "k03",
        "number": 3,
        "name": "Aranya Kanda",
        "devanagari": "आरण्यकाण्डम्",
        "dir": "ARANAYKANDA",
        "total_sargas": 75,
        "mangala_file": None
    },
    {
        "id": "k04",
        "number": 4,
        "name": "Kishkindha Kanda",
        "devanagari": "किष्किन्धाकाण्डम्",
        "dir": "KISHKINDHAKANDA",
        "total_sargas": 67,
        "mangala_file": None
    },
    {
        "id": "k05",
        "number": 5,
        "name": "Sundara Kanda",
        "devanagari": "सुन्दरकाण्डम्",
        "dir": "SUNDARAKANDA",
        "total_sargas": 68,
        "mangala_file": None
    },
    {
        "id": "k06",
        "number": 6,
        "name": "Yuddha Kanda",
        "devanagari": "युद्धकाण्डम्",
        "dir": "YUDHAKANDA",
        "total_sargas": 128,
        "mangala_file": None
    },
    {
        "id": "k07",
        "number": 7,
        "name": "Uttara Kanda",
        "devanagari": "उत्तरकाण्डम्",
        "dir": "UTTARAKANDA",
        "total_sargas": 111,
        "mangala_file": None
    }
]

PAGE_CONFIGS = [
    {"file": "index.html", "id": "home", "slug": "", "route": "/"},
    {"file": "about.html", "id": "about", "slug": "about", "route": "/about"},
    {"file": "Campus.html", "id": "campus", "slug": "campus", "route": "/campus"},
    {"file": "contact.html", "id": "contact", "slug": "contact", "route": "/contact"},
    {"file": "programs.html", "id": "programs", "slug": "programs", "route": "/programs"},
    {"file": "team.html", "id": "team", "slug": "team", "route": "/team"},
    {"file": "Sanatan Dharma.html", "id": "sanatan-dharma", "slug": "sanatan-dharma", "route": "/sanatan-dharma"},
    {"file": "Sanatan Dharma_Vision & Mission.html", "id": "sanatan-dharma-vision-mission", "slug": "sanatan-dharma-vision-mission", "route": "/sanatan-dharma/vision-mission"},
    {"file": "books.html", "id": "books", "slug": "books", "route": "/books"},
    {"file": "meta-tags-template.html", "id": "meta-tags-template", "slug": "meta-tags-template", "route": "/meta-tags-template"},
    {"file": "Books/book_link/Bala_Srga.html", "id": "book-link-bala", "slug": "books/bala", "route": "/books/bala"},
    {"file": "Books/book_link/Ay_Sarga.html", "id": "book-link-ayodhya", "slug": "books/ayodhya", "route": "/books/ayodhya"},
    {"file": "Books/book_link/Ara_sarga.html", "id": "book-link-aranya", "slug": "books/aranya", "route": "/books/aranya"},
    {"file": "Books/book_link/KIs_Sraga.html", "id": "book-link-kishkindha", "slug": "books/kishkindha", "route": "/books/kishkindha"},
    {"file": "Books/book_link/SU_Sraga.html", "id": "book-link-sundara", "slug": "books/sundara", "route": "/books/sundara"},
    {"file": "Books/book_link/YU_Sarga.html", "id": "book-link-yuddha", "slug": "books/yuddha", "route": "/books/yuddha"},
    {"file": "Books/book_link/utt_sarga.html", "id": "book-link-uttara", "slug": "books/uttara", "route": "/books/uttara"},
    {"file": "Books/book_link/Vedic Wisdom.html", "id": "vedic-wisdom", "slug": "vedic-wisdom", "route": "/vedic-wisdom"},
    {"file": "keyboard/keyboard_01.html", "id": "keyboard", "slug": "keyboard", "route": "/keyboard"},
    {"file": "Gallery/Gallery.html", "id": "gallery", "slug": "gallery", "route": "/gallery"},
    {"file": "Gallery/admin.html", "id": "gallery-admin", "slug": "gallery-admin", "route": "/gallery/admin"},
    {"file": "graphify-out/graph.html", "id": "graphify", "slug": "graphify", "route": "/graphify"}
]

class SanskritRepairEngine:
    def __init__(self):
        self.audit_log = []
        self.rule_counts = {}

    def record_repair(self, file_path, element_id, rule, before, after):
        entry = {
            "file": file_path,
            "element_id": element_id,
            "rule": rule,
            "before": before,
            "after": after
        }
        self.audit_log.append(entry)
        self.rule_counts[rule] = self.rule_counts.get(rule, 0) + 1

    def sanitize_xml_chars(self, text):
        if not text:
            return ""
        # Remove XML 1.0 disallowed control characters
        return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)

    def canonicalize_uvacha(self, uvacha_raw, file_path, element_id):
        if not uvacha_raw:
            return "Valmiki"
        clean = uvacha_raw.strip()
        canonical = UVACHA_CANONICAL_MAP.get(clean, UVACHA_CANONICAL_MAP.get(uvacha_raw, clean))
        if canonical != uvacha_raw:
            self.record_repair(file_path, element_id, "CANONICALIZE_UVACHA", uvacha_raw, canonical)
        return canonical

    def repair_text(self, text, file_path, element_id, is_verse=False):
        if not text:
            return ""
        text = self.sanitize_xml_chars(text)
        # 1. Unicode NFC
        norm = unicodedata.normalize('NFC', text)
        curr = norm

        # 2. Collapse double diacritics
        for char, rule_name in [('ं', 'COLLAPSE_DOUBLE_ANUSVARA'), ('ः', 'COLLAPSE_DOUBLE_VISARGA'), ('्', 'COLLAPSE_DOUBLE_VIRAMA')]:
            pat = char + '{2,}'
            matches = list(re.finditer(pat, curr))
            if matches:
                for m in matches:
                    self.record_repair(file_path, element_id, rule_name, m.group(0), char)
                curr = re.sub(pat, char, curr)

        # 3. Strip whitespace before diacritics
        pat_ws = r'\s+([ंः्])'
        matches = list(re.finditer(pat_ws, curr))
        if matches:
            for m in matches:
                self.record_repair(file_path, element_id, "STRIP_WHITESPACE_BEFORE_DIACRITICS", m.group(0), m.group(1))
            curr = re.sub(pat_ws, r'\1', curr)

        # 4. Standardize ASCII pipes to Sanskrit dandas
        if '||' in curr or '|' in curr:
            matches_double = list(re.finditer(r'\|{2,}', curr))
            for m in matches_double:
                self.record_repair(file_path, element_id, "STANDARDIZE_DANDAS_DOUBLE", m.group(0), '॥')
            curr = re.sub(r'\|{2,}', '॥', curr)

            matches_single = list(re.finditer(r'\|', curr))
            for m in matches_single:
                self.record_repair(file_path, element_id, "STANDARDIZE_DANDAS_SINGLE", m.group(0), '।')
            curr = re.sub(r'\|', '।', curr)

        # 5. Panini 8.3.23 Mo'nusvara: Padanta M before consonant
        pat_mo = rf'म्(\s+)({DEVA_CONSONANTS})'
        matches_mo = list(re.finditer(pat_mo, curr))
        if matches_mo:
            for m in matches_mo:
                b_str = m.group(0)
                a_str = 'ं' + m.group(1) + m.group(2)
                self.record_repair(file_path, element_id, "PANINI_8_3_23_MO_ANUSVARA", b_str, a_str)
            curr = re.sub(pat_mo, r'ं\1\2', curr)

        # 5b. Post-Mo'nusvara double anusvara cleanup pass (handle cases where input had typo 'ंम्' -> 'ंं')
        matches_post_mo = list(re.finditer(r'ं{2,}', curr))
        if matches_post_mo:
            for m in matches_post_mo:
                self.record_repair(file_path, element_id, "COLLAPSE_DOUBLE_ANUSVARA", m.group(0), 'ं')
        curr = re.sub(r'ं{2,}', 'ं', curr)

        # 6. Ambiguous constructs check (audit logging without destructive change)
        if "सुझावं" in curr:
            self.record_repair(file_path, element_id, "AMBIGUOUS_SANSKRIT_HYBRID", "सुझावं", "सुझावं (Recommended: परामर्शम् / अभिप्रायम्)")
        if "वल्मीकीय" in curr:
            self.record_repair(file_path, element_id, "AMBIGUOUS_COLOPHON_TYPO", "वल्मीकीय", "वाल्मीकीये")

        return curr


def parse_verse_text_safely(v_tag):
    """
    Safely extract verse text from a div.verse tag, handling cases where
    div.versetext was closed prematurely in legacy HTML.
    """
    vt = v_tag.find('div', class_='versetext')
    uvacha = vt.get('uvacha', 'Valmiki') if vt else 'Valmiki'
    
    verse_text = vt.get_text() if vt else ""
    if not verse_text.strip():
        # Tag was closed prematurely; gather text in div.verse preceding div.vyakhya
        vy = v_tag.find('div', class_='vyakhya')
        parts = []
        for elem in v_tag.contents:
            if elem == vt:
                continue
            if elem == vy:
                break
            if isinstance(elem, str):
                parts.append(elem)
            elif elem.name == 'br':
                parts.append('\n')
            elif elem.name != 'div':
                parts.append(elem.get_text())
        verse_text = "".join(parts)
        
    return uvacha, verse_text


def migrate_corpus():
    print(f"Starting Gurukulam Sanskrit Migration Pipeline...")
    print(f"Repository Root: {REPO_ROOT}")
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 1. Write strict XSD Schema
    schema_path = os.path.join(DATA_DIR, 'schema.xsd')
    with open(schema_path, 'w', encoding='utf-8') as f:
        f.write(XSD_SCHEMA_CONTENT)
    print(f"Generated XSD schema: {schema_path}")

    repair_engine = SanskritRepairEngine()

    total_files_migrated = 0
    total_ramayana_verses = 0
    total_shlok_mala_verses = 0

    # Initialize XML root element
    root = ET.Element(
        'gurukulam',
        version="1.0",
        generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        total_files="670",
        total_verses="23358"
    )

    metadata_el = ET.SubElement(root, 'metadata')
    ET.SubElement(metadata_el, 'title').text = "Gurukulam"
    ET.SubElement(metadata_el, 'tagline').text = "Reviving Ancient Wisdom"
    ET.SubElement(metadata_el, 'description').text = "Digital repository of Valmiki Ramayana, Vedic teachings, and Sanskrit studies"
    ET.SubElement(metadata_el, 'version').text = "1.0"
    ET.SubElement(metadata_el, 'lastMigrated').text = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    # ==========================================
    # 1. PROCESS INSTITUTIONAL & SPECIAL PAGES
    # ==========================================
    pages_el = ET.SubElement(root, 'pages')
    print(f"\n[1/3] Migrating {len(PAGE_CONFIGS)} Institutional & Special Pages...")

    for page_cfg in PAGE_CONFIGS:
        fpath = os.path.join(REPO_ROOT, page_cfg["file"])
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Page file not found: {fpath}")

        with open(fpath, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'lxml')

        # Decompose scripts and styles for content extraction
        for tag in soup(['script', 'style']):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else page_cfg["id"]
        body = soup.body if soup.body else soup
        raw_body_text = repair_engine.sanitize_xml_chars(body.get_text())

        page_el = ET.SubElement(
            pages_el, 'page',
            id=page_cfg["id"],
            slug=page_cfg["slug"],
            route=page_cfg["route"],
            source_file=page_cfg["file"]
        )
        ET.SubElement(page_el, 'title').text = repair_engine.repair_text(title, page_cfg["file"], page_cfg["id"])
        ET.SubElement(page_el, 'raw_content').text = raw_body_text

        # Extract structured sections if present
        sections_nodes = soup.find_all('section')
        sections_container = ET.SubElement(page_el, 'sections')

        if sections_nodes:
            for s_idx, sec in enumerate(sections_nodes):
                sec_id = sec.get('id', f"{page_cfg['id']}_sec_{s_idx+1}")
                h_tag = sec.find(['h1', 'h2', 'h3', 'h4'])
                heading_text = h_tag.get_text(strip=True) if h_tag else ""
                raw_s_text = repair_engine.sanitize_xml_chars(sec.get_text())
                repaired_s_text = repair_engine.repair_text(raw_s_text, page_cfg["file"], sec_id)

                sec_el = ET.SubElement(sections_container, 'section', id=sec_id)
                if heading_text:
                    ET.SubElement(sec_el, 'heading').text = repair_engine.repair_text(heading_text, page_cfg["file"], sec_id)
                ET.SubElement(sec_el, 'raw_text').text = raw_s_text
                ET.SubElement(sec_el, 'text').text = repaired_s_text
        else:
            # Fallback single section preserving entire body content
            sec_el = ET.SubElement(sections_container, 'section', id=f"{page_cfg['id']}_main")
            ET.SubElement(sec_el, 'heading').text = title
            ET.SubElement(sec_el, 'raw_text').text = raw_body_text
            ET.SubElement(sec_el, 'text').text = repair_engine.repair_text(raw_body_text, page_cfg["file"], page_cfg["id"])

        total_files_migrated += 1

    print(f"Migrated {len(PAGE_CONFIGS)} pages.")

    # ==========================================
    # 2. PROCESS SHLOK MALA ANTHOLOGIES (2 files)
    # ==========================================
    shlok_mala_container = ET.SubElement(root, 'shlok_mala')
    print(f"\n[2/3] Migrating Shlok Mala Anthologies (2 files)...")

    # Shlok Mala 1
    sm1_path = os.path.join(REPO_ROOT, 'Books', 'Shlok mala', 'shlok_mala_1.html')
    with open(sm1_path, 'r', encoding='utf-8') as f:
        soup_sm1 = BeautifulSoup(f.read(), 'lxml')

    mala1_el = ET.SubElement(
        shlok_mala_container, 'mala',
        id="1",
        title="Shlok Mala 1",
        source_file="Books/Shlok mala/shlok_mala_1.html",
        total_shlokas="120"
    )
    ET.SubElement(mala1_el, 'title').text = "प्रथम श्लोक माला"
    ET.SubElement(mala1_el, 'description').text = "Selected Ramayana Shlokas with Audio Recitations by Dr. Ranganji (WEBOLIM)"
    shlokas1_el = ET.SubElement(mala1_el, 'shlokas')

    sm1_count = 0
    for tag in soup_sm1.find_all('div'):
        tid = tag.get('id', '')
        if tid.startswith('SH_S') and tid[4:].isdigit():
            num = int(tid[4:])
            sm1_count += 1
            prev = tag.find_previous(['h3', 'h2'])
            heading = prev.get_text(strip=True) if prev else ""

            hindi_el = tag.find('div', class_='hindi')
            english_el = tag.find('div', class_='english')
            hindi_text = hindi_el.get_text(strip=True) if hindi_el else ""
            english_text = english_el.get_text(strip=True) if english_el else ""

            # Sanskrit text excluding hindi and english child divs
            sanskrit_parts = []
            for c in tag.contents:
                if c in (hindi_el, english_el):
                    continue
                if isinstance(c, str):
                    sanskrit_parts.append(c)
                elif c.name == 'br':
                    sanskrit_parts.append('\n')
                elif c.name != 'div':
                    sanskrit_parts.append(c.get_text())
            raw_sanskrit = repair_engine.sanitize_xml_chars("".join(sanskrit_parts).strip())
            repaired_sanskrit = repair_engine.repair_text(raw_sanskrit, "Books/Shlok mala/shlok_mala_1.html", tid, is_verse=True)

            raw_full = repair_engine.sanitize_xml_chars(tag.get_text())
            repaired_full = repair_engine.repair_text(raw_full, "Books/Shlok mala/shlok_mala_1.html", tid)

            shl_el = ET.SubElement(shlokas1_el, 'shloka', id=tid, number=str(num))
            if heading:
                ET.SubElement(shl_el, 'thematic_heading').text = repair_engine.repair_text(heading, "Books/Shlok mala/shlok_mala_1.html", tid)
            ET.SubElement(shl_el, 'raw_text').text = raw_full
            ET.SubElement(shl_el, 'text').text = repaired_full
            ET.SubElement(shl_el, 'sanskrit').text = repaired_sanskrit
            if hindi_text:
                ET.SubElement(shl_el, 'hindi').text = repair_engine.sanitize_xml_chars(hindi_text)
            if english_text:
                ET.SubElement(shl_el, 'english').text = repair_engine.sanitize_xml_chars(english_text)
            ET.SubElement(shl_el, 'audio_src').text = f"Books/Shlok mala/Shlok_audio/shlok_{num}.m4a"

    total_files_migrated += 1
    total_shlok_mala_verses += sm1_count
    print(f"Migrated Shlok Mala 1: {sm1_count} shlokas with audio mapping.")

    # Shlok Mala 2
    sm2_path = os.path.join(REPO_ROOT, 'Books', 'Shlok mala', 'shlok_mala_2.html')
    with open(sm2_path, 'r', encoding='utf-8') as f:
        soup_sm2 = BeautifulSoup(f.read(), 'lxml')

    mala2_el = ET.SubElement(
        shlok_mala_container, 'mala',
        id="2",
        title="Shlok Mala 2",
        source_file="Books/Shlok mala/shlok_mala_2.html",
        total_shlokas="229"
    )
    ET.SubElement(mala2_el, 'title').text = "द्वितीय श्लोक माला"
    ET.SubElement(mala2_el, 'description').text = "Comprehensive 229 Shlokas from Valmiki Ramayana with Hindi and English meanings"
    shlokas2_el = ET.SubElement(mala2_el, 'shlokas')

    sm2_count = 0
    for idx, tag in enumerate(soup_sm2.find_all('div', class_='shlok')):
        num_el = tag.find('div', class_='shlok-number')
        num = int(num_el.get_text(strip=True)) if num_el and num_el.get_text(strip=True).isdigit() else (idx + 1)
        sm2_count += 1
        shl_id = f"SM2_{num:03d}"

        prev = tag.find_previous(['h2', 'h1'])
        heading = prev.get_text(strip=True) if prev else ""

        sanskrit_el = tag.find('div', class_='sanskrit-text')
        raw_sanskrit = repair_engine.sanitize_xml_chars(sanskrit_el.get_text(strip=True) if sanskrit_el else "")
        repaired_sanskrit = repair_engine.repair_text(raw_sanskrit, "Books/Shlok mala/shlok_mala_2.html", shl_id, is_verse=True)

        hindi_el = tag.find('div', class_='hindi-meaning')
        if not hindi_el:
            tr = tag.find('div', class_='translation')
            if tr:
                hindi_el = tr.find('div', class_='hindi-meaning')
        hindi_text = hindi_el.get_text(strip=True) if hindi_el else ""

        english_el = tag.find('div', class_='english-meaning')
        if not english_el:
            tr = tag.find('div', class_='translation')
            if tr:
                english_el = tr.find('div', class_='english-meaning')
        english_text = english_el.get_text(strip=True) if english_el else ""

        raw_full = repair_engine.sanitize_xml_chars(tag.get_text())
        repaired_full = repair_engine.repair_text(raw_full, "Books/Shlok mala/shlok_mala_2.html", shl_id)

        shl_el = ET.SubElement(shlokas2_el, 'shloka', id=shl_id, number=str(num))
        if heading:
            ET.SubElement(shl_el, 'thematic_heading').text = repair_engine.repair_text(heading, "Books/Shlok mala/shlok_mala_2.html", shl_id)
        ET.SubElement(shl_el, 'raw_text').text = raw_full
        ET.SubElement(shl_el, 'text').text = repaired_full
        ET.SubElement(shl_el, 'sanskrit').text = repaired_sanskrit
        if hindi_text:
            ET.SubElement(shl_el, 'hindi').text = repair_engine.sanitize_xml_chars(hindi_text)
        if english_text:
            ET.SubElement(shl_el, 'english').text = repair_engine.sanitize_xml_chars(english_text)

    total_files_migrated += 1
    total_shlok_mala_verses += sm2_count
    print(f"Migrated Shlok Mala 2: {sm2_count} shlokas.")

    # ==========================================
    # 3. PROCESS VALMIKI RAMAYANA (646 files)
    # ==========================================
    ramayana_el = ET.SubElement(
        root, 'ramayana',
        total_kandas=str(len(KANDAS_CONFIG)),
        total_sargas="645",
        total_verses="23358"
    )
    print(f"\n[3/3] Migrating Valmiki Ramayana across 7 Kandas (646 files)...")

    for kanda_cfg in KANDAS_CONFIG:
        kdir = os.path.join(REPO_ROOT, 'Books', kanda_cfg["dir"])
        kanda_el = ET.SubElement(
            ramayana_el, 'kanda',
            id=kanda_cfg["id"],
            number=str(kanda_cfg["number"]),
            name=kanda_cfg["name"],
            devanagari=kanda_cfg["devanagari"],
            total_sargas=str(kanda_cfg["total_sargas"]),
            total_verses="0"  # updated later
        )
        ET.SubElement(kanda_el, 'name').text = kanda_cfg["name"]
        ET.SubElement(kanda_el, 'devanagari').text = kanda_cfg["devanagari"]

        kanda_verse_count = 0

        # Handle Mangala Shloka if present
        if kanda_cfg["mangala_file"]:
            m_path = os.path.join(kdir, kanda_cfg["mangala_file"])
            if os.path.exists(m_path):
                total_files_migrated += 1
                with open(m_path, 'r', encoding='utf-8') as mf:
                    m_soup = BeautifulSoup(mf.read(), 'lxml')
                name_el = m_soup.find('div', class_='name')
                m_title = name_el.get_text(strip=True) if name_el else "॥ श्रीगणेशाय नमः ॥"
                
                mangala_el = ET.SubElement(
                    kanda_el, 'mangala',
                    id=f"RAM_{kanda_cfg['id']}_M00",
                    source_file=f"Books/{kanda_cfg['dir']}/{kanda_cfg['mangala_file']}"
                )
                ET.SubElement(mangala_el, 'title').text = repair_engine.repair_text(m_title, m_path, "mangala_title")
                m_verses_el = ET.SubElement(mangala_el, 'verses')

                m_shlokas = m_soup.find_all('div', class_='mangala')
                for m_idx, m_shl in enumerate(m_shlokas):
                    m_vid = f"RAM_{kanda_cfg['id']}_M00_V{m_idx+1:03d}"
                    m_raw = repair_engine.sanitize_xml_chars(m_shl.get_text())
                    m_rep = repair_engine.repair_text(m_raw, m_path, m_vid, is_verse=True)
                    mv_el = ET.SubElement(m_verses_el, 'verse', id=m_vid, number=str(m_idx+1), uvacha="Valmiki")
                    ET.SubElement(mv_el, 'raw_text').text = m_raw
                    ET.SubElement(mv_el, 'text').text = m_rep

        # Sargas in this Kanda
        sargas_el = ET.SubElement(kanda_el, 'sargas')
        sarga_files = [f for f in os.listdir(kdir) if f.endswith('.html') and 'mangala' not in f]
        # Sort numerically by sarga number
        sarga_files.sort(key=lambda x: int(re.search(r'(\d+)\.html$', x).group(1)))

        for sf in sarga_files:
            s_num = int(re.search(r'(\d+)\.html$', sf).group(1))
            s_rel_path = f"Books/{kanda_cfg['dir']}/{sf}"
            s_abs_path = os.path.join(kdir, sf)
            total_files_migrated += 1

            with open(s_abs_path, 'r', encoding='utf-8') as sfp:
                s_soup = BeautifulSoup(sfp.read(), 'lxml')

            # Extract Sarga title
            title_node = s_soup.find('div', class_='section')
            if title_node and title_node.find('h1'):
                s_title = title_node.find('h1').get_text(strip=True)
            elif s_soup.find('h1'):
                s_title = s_soup.find('h1').get_text(strip=True)
            else:
                s_title = f"{kanda_cfg['name']} Sarga {s_num}"

            verses_tags = s_soup.find_all('div', class_='verse')
            s_id = f"RAM_{kanda_cfg['id']}_S{s_num:03d}"

            sarga_el = ET.SubElement(
                sargas_el, 'sarga',
                id=s_id,
                number=str(s_num),
                source_file=s_rel_path,
                verse_count=str(len(verses_tags))
            )
            ET.SubElement(sarga_el, 'title').text = repair_engine.repair_text(s_title, s_rel_path, s_id)
            verses_container = ET.SubElement(sarga_el, 'verses')

            for v_idx, v_tag in enumerate(verses_tags):
                v_num = v_idx + 1
                kanda_verse_count += 1
                total_ramayana_verses += 1
                v_id = v_tag.get('id', f"{s_id}_V{v_num:03d}")

                raw_uvacha, raw_versetext = parse_verse_text_safely(v_tag)
                canon_uvacha = repair_engine.canonicalize_uvacha(raw_uvacha, s_rel_path, v_id)
                raw_versetext = repair_engine.sanitize_xml_chars(raw_versetext)
                repaired_versetext = repair_engine.repair_text(raw_versetext, s_rel_path, v_id, is_verse=True)

                # Padanta index extraction (e.g. ॥ 1.1.1 ॥)
                padanta_match = re.search(r'॥\s*([0-9\.]+)\s*॥', raw_versetext)
                padanta_index = padanta_match.group(1) if padanta_match else f"{kanda_cfg['number']}.{s_num}.{v_num}"

                v_el = ET.SubElement(
                    verses_container, 'verse',
                    id=v_id,
                    number=str(v_num),
                    uvacha=canon_uvacha,
                    padanta_index=padanta_index
                )
                ET.SubElement(v_el, 'raw_text').text = raw_versetext
                ET.SubElement(v_el, 'text').text = repaired_versetext

                # Vyakhya commentary
                vy_tag = v_tag.find('div', class_='vyakhya')
                if vy_tag:
                    raw_vy_id = vy_tag.get('id', '')
                    # If id contains leaked commentary text due to unclosed quote in legacy HTML
                    if re.search(r'[\u0900-\u097F]', raw_vy_id):
                        leaked_match = re.search(r'RAM_k02_S050_V023_B001(.*?)<span', raw_vy_id)
                        if not leaked_match:
                            leaked_match = re.search(rf'{re.escape(v_id)}_B\d+(.*?)<span', raw_vy_id)
                        leaked_text = leaked_match.group(1).strip() if leaked_match else ""
                        raw_vy = leaked_text + " " + vy_tag.get_text()
                        vy_id = f"{v_id}_B001"
                    else:
                        raw_vy = vy_tag.get_text()
                        vy_id = raw_vy_id if raw_vy_id else f"{v_id}_B001"

                    # Clean trailing leaked markup like 'div>'
                    raw_vy = re.sub(r'\s*div>\s*$', '', raw_vy.strip())
                    raw_vy = repair_engine.sanitize_xml_chars(raw_vy)

                    if raw_vy.strip():
                        repaired_vy = repair_engine.repair_text(raw_vy, s_rel_path, vy_id)

                        comm_el = ET.SubElement(v_el, 'commentary', id=vy_id, author="Tilaka")
                        ET.SubElement(comm_el, 'raw_text').text = raw_vy
                        ET.SubElement(comm_el, 'text').text = repaired_vy

                        # Preserved root quotes
                        quotes_tags = vy_tag.find_all('span', class_='quote')
                        if quotes_tags:
                            quotes_el = ET.SubElement(comm_el, 'quotes')
                            for q in quotes_tags:
                                raw_q = repair_engine.sanitize_xml_chars(q.get_text())
                                rep_q = repair_engine.repair_text(raw_q, s_rel_path, vy_id)
                                ET.SubElement(quotes_el, 'quote').text = rep_q

            # Colophon
            authorline = s_soup.find('div', class_='authorline')
            if authorline:
                raw_col = repair_engine.sanitize_xml_chars(authorline.get_text())
                if raw_col.strip():
                    rep_col = repair_engine.repair_text(raw_col, s_rel_path, f"{s_id}_colophon")
                    col_el = ET.SubElement(sarga_el, 'colophon')
                    ET.SubElement(col_el, 'raw_text').text = raw_col
                    ET.SubElement(col_el, 'text').text = rep_col

        kanda_el.set('total_verses', str(kanda_verse_count))
        print(f"Migrated {kanda_cfg['name']}: {len(sarga_files)} sargas, {kanda_verse_count} verses.")

    # Update metadata tallies
    ET.SubElement(metadata_el, 'totalRamayanaVerses').text = str(total_ramayana_verses)
    ET.SubElement(metadata_el, 'totalShlokMalaVerses').text = str(total_shlok_mala_verses)
    ET.SubElement(metadata_el, 'totalHtmlFilesMigrated').text = str(total_files_migrated)
    root.set('total_files', str(total_files_migrated))
    root.set('total_verses', str(total_ramayana_verses))

    # ==========================================
    # 4. SERIALIZE /data/content.xml
    # ==========================================
    xml_path = os.path.join(DATA_DIR, 'content.xml')
    print(f"\nSerializing XML tree to {xml_path}...")
    tree = ET.ElementTree(root)
    tree.write(
        xml_path,
        pretty_print=True,
        xml_declaration=True,
        encoding='utf-8'
    )
    xml_size_mb = os.path.getsize(xml_path) / (1024 * 1024)
    print(f"Created {xml_path} ({xml_size_mb:.2f} MB)")

    # ==========================================
    # 5. VALIDATE /data/content.xml AGAINST XSD
    # ==========================================
    print(f"\nValidating /data/content.xml against /data/schema.xsd...")
    schema_doc = ET.parse(schema_path)
    xml_schema = ET.XMLSchema(schema_doc)

    doc_to_validate = ET.parse(xml_path)
    is_valid = xml_schema.validate(doc_to_validate)

    if not is_valid:
        print("XSD VALIDATION FAILED!")
        for error in xml_schema.error_log:
            print(f"Line {error.line}: {error.message}")
        sys.exit(1)
    else:
        print("SUCCESS: /data/content.xml is 100% compliant with /data/schema.xsd! (Exit Code 0)")

    # ==========================================
    # 6. WRITE /data/grammar_audit.json
    # ==========================================
    audit_path = os.path.join(DATA_DIR, 'grammar_audit.json')
    audit_data = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "total_files_migrated": total_files_migrated,
        "total_ramayana_verses": total_ramayana_verses,
        "total_shlok_mala_verses": total_shlok_mala_verses,
        "total_repairs_and_anomalies": len(repair_engine.audit_log),
        "rule_summary": repair_engine.rule_counts,
        "repairs": repair_engine.audit_log
    }
    with open(audit_path, 'w', encoding='utf-8') as f:
        json.dump(audit_data, f, ensure_ascii=False, indent=2)

    audit_size_kb = os.path.getsize(audit_path) / 1024
    print(f"Created {audit_path} ({audit_size_kb:.1f} KB, {len(repair_engine.audit_log)} audit records)")
    print(f"Rule breakdown:")
    for rule, count in sorted(repair_engine.rule_counts.items(), key=lambda x: -x[1]):
        print(f"  - {rule}: {count}")

    print("\n=======================================================")
    print(f"MIGRATION COMPLETE:")
    print(f"  Files Migrated: {total_files_migrated} / 670")
    print(f"  Ramayana Verses: {total_ramayana_verses} / 23358")
    print(f"  Shlok Mala Verses: {total_shlok_mala_verses}")
    print(f"  XML File Size: {xml_size_mb:.2f} MB")
    print(f"  XSD Validation: PASSED (Exit Code 0)")
    print("=======================================================\n")
    return 0


if __name__ == '__main__':
    sys.exit(migrate_corpus())

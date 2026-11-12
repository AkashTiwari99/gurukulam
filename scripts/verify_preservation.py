#!/usr/bin/env python3
"""
scripts/verify_preservation.py

Rigorous Gatekeeper for Milestone 2 Safe Legacy Cleanup.
Verifies:
1. /data/content.xml exists, is well-formed, and validates against /data/schema.xsd
   using lxml.etree.XMLSchema.
2. Complete inventory of all 670 legacy HTML files on disk, mapped 1-to-1 with
   source_file attributes in content.xml.
3. 100.000% textual preservation between legacy HTML files and XML nodes:
   - Sarga verses, titles, vyakhya commentaries, and colophons across all 7 Kandas.
   - Mangala shlokas and titles.
   - Shlok Mala anthologies, shlokas, and referenced audio files.
   - Institutional and special pages, titles, body content, and structured sections.
4. Safe handling of legacy HTML edge cases:
   - Premature div.versetext closures across 9 Sargas (parse_verse_text_safely).
   - Malformed commentary attribute leakage in Asarga_50.html:23.
   - File-scoped mapping to avoid duplicate legacy ID collisions.
   - XML 1.0 disallowed character sanitization ([\x00-\x08\x0b\x0c\x0e-\x1f]).
5. Strict exit code: Exit Code 0 if and only if 100.000% preservation is achieved
   with zero mismatches and valid schema. Non-zero exit code on any failure.
"""

import os
import sys
import re
import time
from bs4 import BeautifulSoup
import lxml.etree as ET

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(REPO_ROOT, 'data')
XML_PATH = os.path.join(DATA_DIR, 'content.xml')
SCHEMA_PATH = os.path.join(DATA_DIR, 'schema.xsd')


def sanitize_xml_chars(text: str) -> str:
    """Strip XML 1.0 disallowed control characters."""
    if not text:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)


def normalize_whitespace(text: str) -> str:
    """Normalize internal and external whitespace."""
    if not text:
        return ""
    return " ".join(text.split())


def parse_verse_text_safely(v_tag):
    """
    Safely extract verse text from a div.verse tag, handling cases where
    div.versetext was closed prematurely in legacy HTML across 9 Sargas.
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


class PreservationVerifier:
    def __init__(self, xml_path=XML_PATH, schema_path=SCHEMA_PATH):
        self.xml_path = xml_path
        self.schema_path = schema_path
        self.metrics = {
            "total_files_verified": 0,
            "pages": 0,
            "page_sections": 0,
            "shlok_mala_shlokas": 0,
            "audio_files": 0,
            "ramayana_sargas": 0,
            "ramayana_verses": 0,
            "mangala_verses": 0,
            "commentaries": 0,
            "colophons": 0,
            "total_chars_html": 0,
            "total_chars_xml": 0,
            "exact_matches": 0,
            "normalized_matches": 0,
            "mismatches": 0,
        }
        self.errors = []

    def validate_schema(self):
        """Validate content.xml against schema.xsd using lxml.etree.XMLSchema."""
        print("[Step 1/4] Checking XML & Schema Existence, Well-Formedness, and XSD Compliance...")
        if not os.path.exists(self.xml_path):
            self.errors.append(f"Missing XML file at {self.xml_path}")
            return False, None
        if not os.path.exists(self.schema_path):
            self.errors.append(f"Missing Schema file at {self.schema_path}")
            return False, None

        xml_size_mb = os.path.getsize(self.xml_path) / (1024 * 1024)
        schema_size = os.path.getsize(self.schema_path)
        print(f"  - Found content.xml ({xml_size_mb:.2f} MB)")
        print(f"  - Found schema.xsd ({schema_size:,} bytes)")

        try:
            xml_tree = ET.parse(self.xml_path)
            print("  - content.xml is well-formed XML (Parsed successfully).")
        except ET.XMLSyntaxError as e:
            self.errors.append(f"content.xml XML syntax error: {e}")
            return False, None

        try:
            schema_tree = ET.parse(self.schema_path)
            xml_schema = ET.XMLSchema(schema_tree)
            if not xml_schema.validate(xml_tree):
                for err in xml_schema.error_log:
                    self.errors.append(f"XSD Validation Error line {err.line}: {err.message}")
                return False, None
            print("  - XSD Validation: PASSED (100% schema compliant via lxml.etree.XMLSchema)")
            return True, xml_tree
        except Exception as e:
            self.errors.append(f"Schema validation error: {e}")
            return False, None

    def inventory_corpus(self, xml_tree):
        """Inventory all legacy HTML files on disk and confirm 1-to-1 XML mapping."""
        print("\n[Step 2/4] Inventorying Legacy HTML Corpus & Validating XML Mapping...")
        disk_html_files = []
        for root, dirs, files in os.walk(REPO_ROOT):
            # Skip agent state directories, git, and build outputs
            if any(skip in root for skip in ['.agents', '.git', 'node_modules']):
                continue
            for f in files:
                if f.endswith('.html'):
                    rel_path = os.path.normpath(os.path.relpath(os.path.join(root, f), REPO_ROOT))
                    disk_html_files.append(rel_path)

        print(f"  - Found {len(disk_html_files)} legacy .html files on disk.")
        if len(disk_html_files) != 670:
            self.errors.append(f"Expected exactly 670 HTML files, found {len(disk_html_files)}")

        # Index XML structures by normalized source_file
        xml_pages = {os.path.normpath(p.get('source_file')): p for p in xml_tree.xpath('//page')}
        xml_malas = {os.path.normpath(m.get('source_file')): m for m in xml_tree.xpath('//mala')}
        xml_mangalas = {os.path.normpath(m.get('source_file')): m for m in xml_tree.xpath('//mangala')}
        xml_sargas = {os.path.normpath(s.get('source_file')): s for s in xml_tree.xpath('//sarga')}

        total_xml_sources = len(xml_pages) + len(xml_malas) + len(xml_mangalas) + len(xml_sargas)
        print(f"  - Mapped {total_xml_sources} source_file entries in content.xml:")
        print(f"      Institutional / Special Pages: {len(xml_pages)}")
        print(f"      Shlok Mala Anthologies:        {len(xml_malas)}")
        print(f"      Mangala Shloka Files:          {len(xml_mangalas)}")
        print(f"      Valmiki Ramayana Sargas:       {len(xml_sargas)}")

        all_xml_files = set(xml_pages.keys()) | set(xml_malas.keys()) | set(xml_mangalas.keys()) | set(xml_sargas.keys())
        missing_in_xml = set(disk_html_files) - all_xml_files
        missing_on_disk = all_xml_files - set(disk_html_files)

        if missing_in_xml:
            self.errors.append(f"{len(missing_in_xml)} HTML files on disk are missing from XML source mapping!")
            for m in sorted(missing_in_xml)[:10]:
                print(f"      Missing from XML: {m}")
        if missing_on_disk:
            self.errors.append(f"{len(missing_on_disk)} XML source_file targets do not exist on disk!")
            for m in sorted(missing_on_disk)[:10]:
                print(f"      Missing on disk: {m}")

        if not missing_in_xml and not missing_on_disk:
            print("  - Corpus Inventory: PASSED (Exact 670-file 1-to-1 bijection)")

        return xml_pages, xml_malas, xml_mangalas, xml_sargas

    def compare_nodes(self, file_path: str, element_id: str, element_type: str, raw_html: str, raw_xml: str):
        """Compare HTML text against XML raw_text node with exact and normalized passes."""
        san_html = sanitize_xml_chars(raw_html)
        raw_xml = raw_xml or ""

        self.metrics["total_chars_html"] += len(san_html)
        self.metrics["total_chars_xml"] += len(raw_xml)

        if san_html == raw_xml:
            self.metrics["exact_matches"] += 1
            return True
        elif normalize_whitespace(san_html) == normalize_whitespace(raw_xml):
            self.metrics["normalized_matches"] += 1
            return True
        else:
            self.metrics["mismatches"] += 1
            diff_msg = (
                f"MISMATCH in {file_path} [{element_type} {element_id}]:\n"
                f"  HTML: {repr(san_html[:80])} (len {len(san_html)})\n"
                f"  XML : {repr(raw_xml[:80])} (len {len(raw_xml)})"
            )
            self.errors.append(diff_msg)
            return False

    def verify_pages(self, xml_pages):
        """Verify Institutional and Special Pages (22 files, 50 sections)."""
        print("  -> Verifying 22 Institutional & Special Pages...")
        for rel_path, p_node in xml_pages.items():
            self.metrics["total_files_verified"] += 1
            self.metrics["pages"] += 1
            full_path = os.path.join(REPO_ROOT, rel_path)

            with open(full_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'lxml')

            for tag in soup(['script', 'style']):
                tag.decompose()

            body = soup.body if soup.body else soup
            body_text = body.get_text()
            xml_raw_content = p_node.find('raw_content').text or ''

            self.compare_nodes(rel_path, p_node.get('id'), "page_raw_content", body_text, xml_raw_content)

            # Check sections
            sec_tags = soup.find_all('section')
            xml_sections = p_node.xpath('.//section')
            if sec_tags:
                for st, sx in zip(sec_tags, xml_sections):
                    self.metrics["page_sections"] += 1
                    self.compare_nodes(rel_path, sx.get('id'), "section", st.get_text(), sx.find('raw_text').text or '')
            else:
                fallback_sec = p_node.find('.//section')
                if fallback_sec is not None:
                    self.metrics["page_sections"] += 1
                    self.compare_nodes(rel_path, fallback_sec.get('id'), "fallback_section", body_text, fallback_sec.find('raw_text').text or '')

    def verify_shlok_mala(self, xml_malas):
        """Verify Shlok Mala 1 & 2 (2 files, 349 shlokas, 120 audio files)."""
        print("  -> Verifying 2 Shlok Mala Anthologies (349 shlokas)...")

        # Mala 1
        m1_path = os.path.normpath('Books/Shlok mala/shlok_mala_1.html')
        m1_node = xml_malas[m1_path]
        self.metrics["total_files_verified"] += 1
        with open(os.path.join(REPO_ROOT, m1_path), 'r', encoding='utf-8') as f:
            soup1 = BeautifulSoup(f.read(), 'lxml')

        m1_xml_shlokas = {s.get('id'): s for s in m1_node.xpath('.//shloka')}
        for tag in soup1.find_all('div'):
            tid = tag.get('id', '')
            if tid.startswith('SH_S') and tid[4:].isdigit():
                self.metrics["shlok_mala_shlokas"] += 1
                s_el = m1_xml_shlokas.get(tid)
                actual = s_el.find('raw_text').text if s_el is not None else ''
                self.compare_nodes(m1_path, tid, "shloka", tag.get_text(), actual)

                # Check audio file mapping
                if s_el is not None:
                    asrc = s_el.find('audio_src')
                    if asrc is not None and asrc.text:
                        self.metrics["audio_files"] += 1
                        audio_disk_path = os.path.join(REPO_ROOT, os.path.normpath(asrc.text))
                        if not os.path.exists(audio_disk_path) or os.path.getsize(audio_disk_path) == 0:
                            self.errors.append(f"Missing or empty audio file: {asrc.text}")

        # Mala 2
        m2_path = os.path.normpath('Books/Shlok mala/shlok_mala_2.html')
        m2_node = xml_malas[m2_path]
        self.metrics["total_files_verified"] += 1
        with open(os.path.join(REPO_ROOT, m2_path), 'r', encoding='utf-8') as f:
            soup2 = BeautifulSoup(f.read(), 'lxml')

        m2_xml_shlokas = {s.get('id'): s for s in m2_node.xpath('.//shloka')}
        for idx, tag in enumerate(soup2.find_all('div', class_='shlok')):
            num_el = tag.find('div', class_='shlok-number')
            num = int(num_el.get_text(strip=True)) if num_el and num_el.get_text(strip=True).isdigit() else (idx + 1)
            shl_id = f"SM2_{num:03d}"
            self.metrics["shlok_mala_shlokas"] += 1
            s_el = m2_xml_shlokas.get(shl_id)
            actual = s_el.find('raw_text').text if s_el is not None else ''
            self.compare_nodes(m2_path, shl_id, "shloka", tag.get_text(), actual)

    def verify_ramayana(self, xml_mangalas, xml_sargas):
        """Verify Valmiki Ramayana across 7 Kandas (646 files, 23,375 verses, 18,989 commentaries, 645 colophons)."""
        print("  -> Verifying Valmiki Ramayana across 7 Kandas (646 files)...")

        # Mangala Shloka
        for rel_path, m_node in xml_mangalas.items():
            self.metrics["total_files_verified"] += 1
            with open(os.path.join(REPO_ROOT, rel_path), 'r', encoding='utf-8') as mf:
                msoup = BeautifulSoup(mf.read(), 'lxml')
            m_xml_verses = m_node.xpath('.//verse')
            for midx, mshl in enumerate(msoup.find_all('div', class_='mangala')):
                self.metrics["mangala_verses"] += 1
                v_node = m_xml_verses[midx] if midx < len(m_xml_verses) else None
                actual = v_node.find('raw_text').text if v_node is not None else ''
                self.compare_nodes(rel_path, f"M00_V{midx+1:03d}", "mangala_verse", mshl.get_text(), actual)

        # Sargas
        for rel_path, s_node in xml_sargas.items():
            self.metrics["total_files_verified"] += 1
            self.metrics["ramayana_sargas"] += 1
            full_path = os.path.join(REPO_ROOT, rel_path)

            with open(full_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'lxml')

            v_tags = soup.find_all('div', class_='verse')
            xml_verses_list = s_node.xpath('./verses/verse')

            if len(v_tags) != len(xml_verses_list):
                self.errors.append(f"Verse count mismatch in {rel_path}: HTML {len(v_tags)} vs XML {len(xml_verses_list)}")
                continue

            for v_idx, v_tag in enumerate(v_tags):
                self.metrics["ramayana_verses"] += 1
                _, raw_vtext = parse_verse_text_safely(v_tag)

                v_node = xml_verses_list[v_idx]
                actual_v = v_node.find('raw_text').text if v_node is not None else ''
                self.compare_nodes(rel_path, v_node.get('id'), "verse", raw_vtext, actual_v)

                # Commentary
                vy_tag = v_tag.find('div', class_='vyakhya')
                if vy_tag:
                    raw_vy_id = vy_tag.get('id', '')
                    # Handle leaked commentary in id attribute
                    if re.search(r'[\u0900-\u097F]', raw_vy_id):
                        leaked_match = re.search(r'RAM_k02_S050_V023_B001(.*?)<span', raw_vy_id)
                        if not leaked_match:
                            leaked_match = re.search(rf'{re.escape(v_node.get("id"))}_B\d+(.*?)<span', raw_vy_id)
                        leaked_text = leaked_match.group(1).strip() if leaked_match else ""
                        raw_vy = leaked_text + " " + vy_tag.get_text()
                    else:
                        raw_vy = vy_tag.get_text()

                    raw_vy = re.sub(r'\s*div>\s*$', '', raw_vy.strip())
                    san_vy = sanitize_xml_chars(raw_vy)

                    if san_vy.strip():
                        self.metrics["commentaries"] += 1
                        comm_node = v_node.find('commentary')
                        actual_c = comm_node.find('raw_text').text if comm_node is not None and comm_node.find('raw_text') is not None else ''
                        comm_id = comm_node.get('id') if comm_node is not None else f"{v_node.get('id')}_comm"
                        self.compare_nodes(rel_path, comm_id, "commentary", raw_vy, actual_c)

            # Colophon
            authorline = soup.find('div', class_='authorline')
            if authorline:
                raw_col = sanitize_xml_chars(authorline.get_text())
                if raw_col.strip():
                    self.metrics["colophons"] += 1
                    col_node = s_node.find('colophon')
                    actual_col = col_node.find('raw_text').text if col_node is not None and col_node.find('raw_text') is not None else ''
                    col_id = f"{s_node.get('id')}_colophon"
                    self.compare_nodes(rel_path, col_id, "colophon", authorline.get_text(), actual_col)

    def run(self):
        start_time = time.time()
        print("=" * 70)
        print("GURUKULAM MODERNIZATION: TEXT PRESERVATION VERIFICATION GATE")
        print("=" * 70)

        # Step 1: Schema validation
        is_valid, xml_tree = self.validate_schema()
        if not is_valid:
            print("\nGATE STATUS: FAILED (Exit Code 1) — Schema Validation Failed")
            for err in self.errors:
                print(f"  ERROR: {err}")
            return 1

        # Step 2: Inventory corpus
        xml_pages, xml_malas, xml_mangalas, xml_sargas = self.inventory_corpus(xml_tree)
        if self.errors:
            print("\nGATE STATUS: FAILED (Exit Code 1) — Corpus Inventory Failed")
            for err in self.errors:
                print(f"  ERROR: {err}")
            return 1

        # Step 3: Deep content comparison
        print("\n[Step 3/4] Verifying 100.000% Text Preservation Across All 670 Files...")
        self.verify_pages(xml_pages)
        self.verify_shlok_mala(xml_malas)
        self.verify_ramayana(xml_mangalas, xml_sargas)

        elapsed = time.time() - start_time

        total_nodes = (
            self.metrics["pages"] +
            self.metrics["page_sections"] +
            self.metrics["shlok_mala_shlokas"] +
            self.metrics["ramayana_verses"] +
            self.metrics["mangala_verses"] +
            self.metrics["commentaries"] +
            self.metrics["colophons"]
        )
        total_matched = self.metrics["exact_matches"] + self.metrics["normalized_matches"]
        preservation_pct = (total_matched / total_nodes * 100.0) if total_nodes > 0 else 0.0

        # Invariant checks
        invariant_failures = []
        if self.metrics["total_files_verified"] != 670:
            invariant_failures.append(f"Expected 670 files verified, got {self.metrics['total_files_verified']}")
        if self.metrics["pages"] != 22:
            invariant_failures.append(f"Expected 22 pages, got {self.metrics['pages']}")
        if self.metrics["page_sections"] != 50:
            invariant_failures.append(f"Expected 50 page sections, got {self.metrics['page_sections']}")
        if self.metrics["shlok_mala_shlokas"] != 349:
            invariant_failures.append(f"Expected 349 shlok mala shlokas, got {self.metrics['shlok_mala_shlokas']}")
        if self.metrics["audio_files"] != 120:
            invariant_failures.append(f"Expected 120 audio files, got {self.metrics['audio_files']}")
        if self.metrics["ramayana_sargas"] != 645:
            invariant_failures.append(f"Expected 645 ramayana sargas, got {self.metrics['ramayana_sargas']}")
        if self.metrics["ramayana_verses"] != 23358:
            invariant_failures.append(f"Expected 23358 ramayana sarga verses, got {self.metrics['ramayana_verses']}")
        if self.metrics["mangala_verses"] != 17:
            invariant_failures.append(f"Expected 17 mangala verses, got {self.metrics['mangala_verses']}")
        if self.metrics["commentaries"] != 18989:
            invariant_failures.append(f"Expected 18989 commentaries, got {self.metrics['commentaries']}")
        if self.metrics["colophons"] != 645:
            invariant_failures.append(f"Expected 645 colophons, got {self.metrics['colophons']}")

        for inv_err in invariant_failures:
            self.errors.append(f"INVARIANT VIOLATION: {inv_err}")

        # Step 4: Summary and gate decision
        print("\n" + "=" * 70)
        print("VERIFICATION GATE SUMMARY")
        print("=" * 70)
        print(f"  Files Checked:                  {self.metrics['total_files_verified']} / 670 (100.0%)")
        print(f"  Institutional Pages:            {self.metrics['pages']} / 22")
        print(f"  Page Sections:                  {self.metrics['page_sections']} / 50")
        print(f"  Shlok Mala Shlokas:             {self.metrics['shlok_mala_shlokas']} / 349")
        print(f"  Shlok Mala Audio Files (.m4a):  {self.metrics['audio_files']} / 120 (100.0% present)")
        print(f"  Valmiki Ramayana Sargas:        {self.metrics['ramayana_sargas']} / 645")
        print(f"  Valmiki Ramayana Verses:        {self.metrics['ramayana_verses']} / 23,358")
        print(f"  Bala Kanda Mangala Verses:      {self.metrics['mangala_verses']} / 17")
        print(f"  Total Ramayana Verses Verified: {self.metrics['ramayana_verses'] + self.metrics['mangala_verses']} / 23,375")
        print(f"  Vyakhya Commentaries Verified:  {self.metrics['commentaries']} / 18,989")
        print(f"  Sarga Colophons Verified:       {self.metrics['colophons']} / 645")
        print(f"  Total Content Nodes Compared:   {total_nodes:,}")
        print(f"  Exact Text Matches:             {self.metrics['exact_matches']:,}")
        print(f"  Whitespace-Normalized Matches:  {self.metrics['normalized_matches']:,}")
        print(f"  Total Text Mismatches:          {self.metrics['mismatches']}")
        print(f"  Total HTML Characters Checked:  {self.metrics['total_chars_html']:,}")
        print(f"  Total XML Characters Checked:   {self.metrics['total_chars_xml']:,}")
        print(f"  Preservation Accuracy:          {preservation_pct:.5f}%")
        print(f"  XML Schema Validation:          PASSED (lxml.etree.XMLSchema)")
        print(f"  Execution Time:                 {elapsed:.2f} seconds")
        print("=" * 70)

        if self.metrics["mismatches"] == 0 and preservation_pct == 100.0 and len(self.errors) == 0:
            print("\nGATE STATUS: PASSED (Exit Code 0)")
            print("100.000% textual preservation verified. Safe legacy cleanup is AUTHORIZED.")
            return 0
        else:
            print("\nGATE STATUS: FAILED (Exit Code 1)")
            print(f"Preservation verification failed with {len(self.errors)} error(s). Legacy cleanup is BLOCKED.")
            for e in self.errors[:25]:
                print(f"  ERROR: {e}")
            return 1


if __name__ == '__main__':
    verifier = PreservationVerifier()
    sys.exit(verifier.run())

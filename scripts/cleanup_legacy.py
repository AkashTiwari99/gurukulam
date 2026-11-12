#!/usr/bin/env python3
"""
scripts/cleanup_legacy.py

Safe Legacy Cleanup Gate Executor for Gurukulam Modernization (Feature 6).
Enforces:
1. Strict pre-cleanup verification gate: runs `scripts/verify_preservation.py`.
   Aborts immediately with non-zero exit code if verification fails.
2. Safe deletion of all 670 legacy .html files and obsolete legacy CSS stylesheets.
3. Clean removal of empty directories in Books/ and Gallery/.
4. Absolute preservation of:
   - All data files (/data/content.xml, /data/schema.xsd, /data/grammar_audit.json)
   - All scripts (/scripts/migrate_and_validate.py, /scripts/verify_preservation.py, /scripts/cleanup_legacy.py)
   - 120 audio files in Books/Shlok mala/Shlok_audio/*.m4a
   - Vedic font in keyboard/font/AdishilaSanVedic.ttf
   - 45 visual media assets in assets/ and images/
   - 8 literature reference files in Books/Books.pdf/
   - Virtual keyboard mapping scripts in keyboard/script/
5. Post-cleanup assertions:
   - Confirms exactly 0 .html files remain in the repository.
   - Asserts all protected assets and data files are 100% intact.
   - Re-validates data/content.xml against data/schema.xsd using lxml.etree.XMLSchema.
"""

import os
import sys
import subprocess
import lxml.etree as ET

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(REPO_ROOT, 'data')
SCRIPTS_DIR = os.path.join(REPO_ROOT, 'scripts')

PROTECTED_DIRS = [
    os.path.normpath(os.path.join(REPO_ROOT, 'data')),
    os.path.normpath(os.path.join(REPO_ROOT, 'scripts')),
    os.path.normpath(os.path.join(REPO_ROOT, 'assets')),
    os.path.normpath(os.path.join(REPO_ROOT, 'images')),
    os.path.normpath(os.path.join(REPO_ROOT, 'keyboard', 'font')),
    os.path.normpath(os.path.join(REPO_ROOT, 'keyboard', 'script')),
    os.path.normpath(os.path.join(REPO_ROOT, 'Books', 'Shlok mala', 'Shlok_audio')),
    os.path.normpath(os.path.join(REPO_ROOT, 'Books', 'Books.pdf')),
]

PROTECTED_FILES = [
    os.path.normpath(os.path.join(REPO_ROOT, 'data', 'content.xml')),
    os.path.normpath(os.path.join(REPO_ROOT, 'data', 'schema.xsd')),
    os.path.normpath(os.path.join(REPO_ROOT, 'data', 'grammar_audit.json')),
    os.path.normpath(os.path.join(REPO_ROOT, 'scripts', 'migrate_and_validate.py')),
    os.path.normpath(os.path.join(REPO_ROOT, 'scripts', 'verify_preservation.py')),
    os.path.normpath(os.path.join(REPO_ROOT, 'keyboard', 'font', 'AdishilaSanVedic.ttf')),
    os.path.normpath(os.path.join(REPO_ROOT, 'keyboard', 'script', 'Character_data.js')),
    os.path.normpath(os.path.join(REPO_ROOT, 'keyboard', 'script', 'keyboard.js')),
]

FORBIDDEN_EXTENSIONS_TO_DELETE = {
    '.m4a', '.mp3', '.wav',
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.ttf', '.woff', '.woff2',
    '.pdf',
    '.xml', '.xsd', '.json',
    '.py'
}


def run_pre_cleanup_gate():
    """Enforce the verification gate prior to any file removal."""
    print("=" * 70)
    print("PHASE 1: ENFORCING PRE-CLEANUP VERIFICATION GATE")
    print("=" * 70)

    verify_script = os.path.join(SCRIPTS_DIR, 'verify_preservation.py')
    if not os.path.exists(verify_script):
        print(f"FATAL: Verification script missing at {verify_script}")
        sys.exit(1)

    print(f"Executing: {sys.executable} {verify_script}")
    result = subprocess.run([sys.executable, verify_script], cwd=REPO_ROOT)

    if result.returncode != 0:
        print("\n" + "!" * 70)
        print("GATE REJECTED: scripts/verify_preservation.py exited with non-zero code!")
        print("Legacy cleanup is STRICTLY FORBIDDEN and has been aborted.")
        print("!" * 70)
        sys.exit(result.returncode)

    print("\nGATE APPROVED: 100.000% textual preservation verified.")
    print("Proceeding to Phase 2: Safe Legacy File Cleanup.\n")


def execute_legacy_cleanup():
    """Safely remove legacy .html files and obsolete CSS stylesheets."""
    print("=" * 70)
    print("PHASE 2: EXECUTING SAFE LEGACY CLEANUP")
    print("=" * 70)

    # Double-check critical XML file before deleting anything
    xml_path = os.path.join(DATA_DIR, 'content.xml')
    if not os.path.exists(xml_path) or os.path.getsize(xml_path) < 30_000_000:
        print("FATAL: data/content.xml is missing or suspiciously small (< 30 MB)! Aborting.")
        sys.exit(1)

    removed_html = []
    removed_css = []

    for root, dirs, files in os.walk(REPO_ROOT):
        # Never touch git or agent state
        if any(skip in root for skip in ['.git', '.agents']):
            continue

        norm_root = os.path.normpath(root)

        for f in files:
            full_path = os.path.normpath(os.path.join(root, f))
            rel_path = os.path.relpath(full_path, REPO_ROOT).replace("\\", "/")
            ext = os.path.splitext(f)[1].lower()

            # Safety check 1: Invariant extension protection
            if ext in FORBIDDEN_EXTENSIONS_TO_DELETE:
                continue

            # Safety check 2: Protected specific files
            if full_path in PROTECTED_FILES:
                continue

            # Safety check 3: Protected directories
            if any(full_path.startswith(pdir + os.sep) for pdir in PROTECTED_DIRS):
                continue

            # 1. Target: HTML files
            if ext in ['.html', '.htm']:
                os.remove(full_path)
                removed_html.append(rel_path)

            # 2. Target: Obsolete stylesheets
            elif ext == '.css':
                is_obsolete = False
                if rel_path.startswith('styles/'):
                    is_obsolete = True
                elif rel_path.startswith('Books/') and not rel_path.startswith('Books/Shlok mala/'):
                    is_obsolete = True
                elif rel_path == 'keyboard/css/CSS_key.css':
                    is_obsolete = True

                if is_obsolete:
                    os.remove(full_path)
                    removed_css.append(rel_path)

    print(f"  - Removed {len(removed_html)} legacy .html files.")
    print(f"  - Removed {len(removed_css)} obsolete .css stylesheets.")

    # Clean up obsolete directories that are now empty
    # Target folders: Books subfolders that contained only HTML/CSS, Gallery/, styles/, keyboard/css/
    candidate_empty_dirs = [
        os.path.join(REPO_ROOT, 'styles'),
        os.path.join(REPO_ROOT, 'Gallery'),
        os.path.join(REPO_ROOT, 'keyboard', 'css'),
        os.path.join(REPO_ROOT, 'Books', 'BALAKANDA'),
        os.path.join(REPO_ROOT, 'Books', 'AYODHYA KANDA'),
        os.path.join(REPO_ROOT, 'Books', 'ARANAYKANDA'),
        os.path.join(REPO_ROOT, 'Books', 'KISHKINDHAKANDA'),
        os.path.join(REPO_ROOT, 'Books', 'SUNDARAKANDA'),
        os.path.join(REPO_ROOT, 'Books', 'YUDHAKANDA'),
        os.path.join(REPO_ROOT, 'Books', 'UTTARAKANDA'),
        os.path.join(REPO_ROOT, 'Books', 'book_link'),
        os.path.join(REPO_ROOT, 'graphify-out'),
    ]

    removed_dirs = []
    for d in candidate_empty_dirs:
        norm_d = os.path.normpath(d)
        if os.path.exists(norm_d):
            # Only remove if directory is completely empty
            try:
                if len(os.listdir(norm_d)) == 0:
                    os.rmdir(norm_d)
                    removed_dirs.append(os.path.relpath(norm_d, REPO_ROOT).replace("\\", "/"))
            except OSError as e:
                print(f"    Notice: could not remove {norm_d}: {e}")

    print(f"  - Removed {len(removed_dirs)} empty directories: {', '.join(removed_dirs)}")


def post_cleanup_verification():
    """Run rigorous assertions to confirm clean state and preserved assets."""
    print("\n" + "=" * 70)
    print("PHASE 3: RIGOROUS POST-CLEANUP VERIFICATION")
    print("=" * 70)

    # 1. Assert exactly 0 HTML files remain in repository
    remaining_html = []
    for root, dirs, files in os.walk(REPO_ROOT):
        if any(skip in root for skip in ['.git', '.agents']):
            continue
        for f in files:
            if f.lower().endswith(('.html', '.htm')):
                remaining_html.append(os.path.relpath(os.path.join(root, f), REPO_ROOT).replace("\\", "/"))

    print(f"  [Assertion 1/6] Remaining HTML files count: {len(remaining_html)}")
    if len(remaining_html) != 0:
        print(f"  FATAL: Expected 0 HTML files, found {len(remaining_html)}: {remaining_html[:5]}")
        sys.exit(1)
    print("      PASS: Exactly 0 .html files remain in repository.")

    # 2. Assert 120 audio files intact in Books/Shlok mala/Shlok_audio/
    audio_dir = os.path.join(REPO_ROOT, 'Books', 'Shlok mala', 'Shlok_audio')
    audio_files = [f for f in os.listdir(audio_dir) if f.endswith('.m4a')] if os.path.exists(audio_dir) else []
    print(f"  [Assertion 2/6] Shlok Mala audio files (.m4a): {len(audio_files)} / 120")
    if len(audio_files) != 120:
        print(f"  FATAL: Expected 120 audio files, found {len(audio_files)}")
        sys.exit(1)
    print("      PASS: All 120 Shlok Mala audio files are intact.")

    # 3. Assert 45 images intact in assets/ and images/
    assets_dir = os.path.join(REPO_ROOT, 'assets')
    images_dir = os.path.join(REPO_ROOT, 'images')
    assets_count = len([f for f in os.listdir(assets_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]) if os.path.exists(assets_dir) else 0
    images_count = len([f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]) if os.path.exists(images_dir) else 0
    total_images = assets_count + images_count
    print(f"  [Assertion 3/6] Image assets (assets/: {assets_count}, images/: {images_count}): {total_images} / 45")
    if total_images != 45:
        print(f"  FATAL: Expected 45 image files, found {total_images}")
        sys.exit(1)
    print("      PASS: All 45 visual media assets are intact.")

    # 4. Assert Vedic font intact
    font_path = os.path.join(REPO_ROOT, 'keyboard', 'font', 'AdishilaSanVedic.ttf')
    font_exists = os.path.exists(font_path)
    font_size = os.path.getsize(font_path) if font_exists else 0
    print(f"  [Assertion 4/6] Vedic font AdishilaSanVedic.ttf: {font_size:,} bytes")
    if not font_exists or font_size != 455_356:
        print(f"  FATAL: Vedic font missing or corrupt (size: {font_size})")
        sys.exit(1)
    print("      PASS: Vedic font AdishilaSanVedic.ttf is intact.")

    # 5. Assert literature PDFs intact (8 files)
    pdf_dir = os.path.join(REPO_ROOT, 'Books', 'Books.pdf')
    pdf_files = os.listdir(pdf_dir) if os.path.exists(pdf_dir) else []
    print(f"  [Assertion 5/6] Literature reference files in Books.pdf/: {len(pdf_files)} / 8")
    if len(pdf_files) != 8:
        print(f"  FATAL: Expected 8 literature reference files, found {len(pdf_files)}")
        sys.exit(1)
    print("      PASS: All 8 literature reference files in Books/Books.pdf/ are intact.")

    # 6. Assert data layer intact and validates against XSD
    print("  [Assertion 6/6] Validating /data artifacts and XML Schema...")
    for f in ['content.xml', 'schema.xsd', 'grammar_audit.json']:
        fp = os.path.join(DATA_DIR, f)
        if not os.path.exists(fp):
            print(f"  FATAL: Missing data artifact {f}")
            sys.exit(1)

    schema_doc = ET.parse(os.path.join(DATA_DIR, 'schema.xsd'))
    xml_schema = ET.XMLSchema(schema_doc)
    content_doc = ET.parse(os.path.join(DATA_DIR, 'content.xml'))
    if not xml_schema.validate(content_doc):
        print("  FATAL: content.xml failed schema validation after cleanup!")
        sys.exit(1)
    print("      PASS: /data/content.xml validates 100% against /data/schema.xsd.")

    print("\n" + "=" * 70)
    print("POST-CLEANUP VERIFICATION COMPLETE: ALL ASSERTIONS PASSED (Exit Code 0)")
    print("=" * 70)


def main():
    run_pre_cleanup_gate()
    execute_legacy_cleanup()
    post_cleanup_verification()
    return 0


if __name__ == '__main__':
    sys.exit(main())

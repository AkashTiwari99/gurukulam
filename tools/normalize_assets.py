"""
Safe asset filename normalizer for Gurukulam repo.

Usage:
    python tools/normalize_assets.py         # dry-run, prints suggested renames and sample sed commands
    python tools/normalize_assets.py --apply # actually perform renames and update references (use with caution)

This script:
- Finds files under the repo with spaces or uppercase characters in `images/` and root-level assets.
- Proposes normalized names (lowercase, spaces -> hyphens).
- Optionally applies renames and does a best-effort textual replace across .html, .js, .css files.

Note: This is a best-effort tool; manual review recommended before --apply.
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET_EXTS = {'.html', '.htm', '.js', '.css'}

def normalize_name(name: str) -> str:
    # Lowercase, replace spaces and consecutive spaces with single hyphen, remove unsafe chars
    new = name.strip().lower()
    new = re.sub(r"\s+", "-", new)
    new = re.sub(r"[^a-z0-9._-]", "", new)
    return new


def find_assets_with_issues():
    results = []
    for path in ROOT.rglob('*'):
        if path.is_file():
            if 'images' in map(str, path.parts) or path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']:
                filename = path.name
                normalized = normalize_name(filename)
                if filename != normalized:
                    results.append((path, normalized))
    return results


def scan_references(old_name):
    matches = []
    for file in ROOT.rglob('*'):
        if file.suffix.lower() in TARGET_EXTS:
            try:
                text = file.read_text(encoding='utf-8')
            except Exception:
                continue
            if old_name in text:
                matches.append(file)
    return matches


def main():
    apply = '--apply' in sys.argv
    issues = find_assets_with_issues()
    if not issues:
        print('No asset filename issues found.')
        return

    print('Found candidate files to normalize:')
    for src_path, new_name in issues:
        rel = src_path.relative_to(ROOT)
        print(f'- {rel} -> {new_name}')

    print('\nReference scan (where the old name appears):')
    for src_path, new_name in issues:
        files = scan_references(src_path.name)
        print(f'\n{src_path.name} referenced in {len(files)} files:')
        for f in files:
            print('  -', f.relative_to(ROOT))

    if not apply:
        print('\nDry run complete. To apply these changes run:\n')
        print('    python tools/normalize_assets.py --apply')
        print('\nWhen applying, the script will:')
        print(' - rename files in-place')
        print(' - perform string replacements of the old filename to the new filename in .html/.js/.css files')
        return

    # Apply changes
    print('\nApplying changes...')
    for src_path, new_name in issues:
        new_path = src_path.with_name(new_name)
        # Avoid overwriting existing file
        if new_path.exists():
            print(f'WARNING: target {new_path.relative_to(ROOT)} already exists; skipping {src_path.relative_to(ROOT)}')
            continue
        src_path.rename(new_path)
        print(f'Renamed {src_path.relative_to(ROOT)} -> {new_path.relative_to(ROOT)}')

        # Update references
        for file in scan_references(src_path.name):
            try:
                text = file.read_text(encoding='utf-8')
                new_text = text.replace(src_path.name, new_name)
                if new_text != text:
                    file.write_text(new_text, encoding='utf-8')
                    print(f'Updated references in {file.relative_to(ROOT)}')
            except Exception as e:
                print(f'Failed to update {file.relative_to(ROOT)}: {e}')

    print('\nApply complete. Please review changes and run your local server to verify.')

if __name__ == '__main__':
    main()

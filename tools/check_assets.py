"""
Check for asset filenames that contain spaces or unsafe characters.
Exit with code 1 if any problematic files are found (so CI can fail).

Usage:
    python tools/check_assets.py

This is a non-destructive check and will only print findings.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
issues = []

def normalize_name(name: str) -> str:
    new = name.strip().lower()
    new = re.sub(r"\s+", "-", new)
    new = re.sub(r"[^a-z0-9._-]", "", new)
    return new

for path in ROOT.rglob('*'):
    if path.is_file():
        if path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] or 'images' in map(str, path.parts):
            filename = path.name
            if filename != normalize_name(filename):
                issues.append((path.relative_to(ROOT), filename, normalize_name(filename)))

if not issues:
    print('No asset filename issues found.')
    sys.exit(0)

print('Asset filename issues detected:')
for p, old, new in issues:
    print(f'- {p} -> suggested: {new}')

print('\nRun tools/normalize_assets.py locally to preview and optionally apply fixes.')
sys.exit(1)

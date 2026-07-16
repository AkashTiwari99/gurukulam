"""
Simple CSS selector auditor.
Reports selectors that appear in multiple CSS files (candidates for extraction to global.css)

Usage:
    python tools/audit_css.py
"""
from pathlib import Path
import re
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
css_files = list(ROOT.glob('styles/*.css'))
selector_map = defaultdict(set)
selector_re = re.compile(r'([^{}]+)\{')

for css in css_files:
    try:
        text = css.read_text(encoding='utf-8')
    except Exception:
        continue
    for m in selector_re.finditer(text):
        raw = m.group(1).strip()
        # split comma-separated selectors
        parts = [s.strip() for s in raw.split(',') if s.strip()]
        for p in parts:
            selector_map[p].add(css.name)

shared = {s: files for s, files in selector_map.items() if len(files) > 1}

if not shared:
    print('No common selectors found across CSS files.')
else:
    print('Selectors found in multiple CSS files (consider moving to styles/global.css):')
    for s, files in sorted(shared.items(), key=lambda x: -len(x[1])):
        print(f'- "{s}" appears in {len(files)} files: {", ".join(sorted(files))}')

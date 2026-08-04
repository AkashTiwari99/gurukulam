#!/usr/bin/env python3
"""
Fix chapter HTML files - Version 4: Fix extra closing div tags
"""

import re
from pathlib import Path

base_dir = Path(__file__).parent.parent

KANDA_DIRS = [
    'BALAKANDA', 'AYODHYA KANDA', 'ARANAYKANDA', 'KISHKINDHAKANDA',
    'SUNDARAKANDA', 'YUDHAKANDA', 'UTTARAKANDA'
]

def fix_chapter_file(file_path):
    """Fix a single chapter HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix 1: Replace Textsheet typo AND fix the href
        content = re.sub(
            r'<link rel="Textsheet"[^>]*>',
            '<link rel="stylesheet" type="text/css" href="../style.css">',
            content
        )
        
        # Fix 2: Remove any self-referencing stylesheet links
        content = re.sub(
            r'<link rel="stylesheet"[^>]*href="[^"]*(?:Yu_sarga_\d+\.html|sarga_\d+\.html|Asarga_\d+\.html|Ar_sarga_\d+\.html|ki_sarga_\d+\.html|Su_sarga_\d+\.html|utt_sarga_\d+\.html)[^"]*"[^>]*>',
            '',
            content
        )
        
        # Fix 3: Remove invalid <strong> tags that wrap block elements
        content = re.sub(r'<strong>\s*<h1>', '<h1>', content)
        content = re.sub(r'</h1>\s*</strong>', '</h1>', content)
        content = re.sub(r'</strong>\s*</div>\s*</body>', '</div>\n</body>', content)
        content = re.sub(r'</strong>\s*</body>', '</body>', content)
        
        # Fix 4: Fix the extra closing div before </body>
        # Pattern: after authorline, there should be exactly one </div> before </body>
        # Current broken pattern has two </div> before </body>
        
        # Find the pattern: <div class="authorline">...</div>\s*</div>\s*</div>\s*</body>
        # This means: authorline, close section, close page, close body
        # We want: authorline, close section, close page, close body
        # But currently we have an extra close div
        
        # Strategy: Replace double </div></div> with single </div>
        # But only when it's right before </body>
        content = re.sub(
            r'</div>\s*\n\s*</div>\s*\n\s*</body>',
            '</div>\n</body>',
            content
        )
        
        # Fix 5: Ensure proper DOCTYPE and html structure
        if not content.strip().startswith('<!DOCTYPE'):
            content = '<!DOCTYPE html>\n<html lang="en">\n' + content
        
        # Only write if changes were made
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False

def main():
    fixed_count = 0
    
    for kanda_name in KANDA_DIRS:
        kanda_path = base_dir / 'Books' / kanda_name
        if not kanda_path.exists():
            print(f"Warning: Directory not found: {kanda_path}")
            continue
        
        print(f"\nProcessing {kanda_name}...")
        kanda_fixed = 0
        
        for html_file in sorted(kanda_path.glob('*.html')):
            if fix_chapter_file(html_file):
                print(f"  Fixed: {html_file.name}")
                kanda_fixed += 1
                fixed_count += 1
        
        print(f"  Fixed {kanda_fixed} files in {kanda_name}")
    
    print(f"\n{'='*60}")
    print(f"Total files fixed: {fixed_count}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
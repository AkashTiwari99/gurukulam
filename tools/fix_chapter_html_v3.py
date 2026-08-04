#!/usr/bin/env python3
"""
Fix chapter HTML files across all Kanda directories - Version 3
Fixes structural issues with proper tag balance.
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
        
        # Fix 4: Fix missing closing tags - ensure proper structure
        # Count opening and closing divs before </body>
        # We need to balance the divs properly
        
        # Strategy: Find the last </div> before </body> and ensure we have proper nesting
        # The structure should be: <div class="page"> ... <div class="section"> ... </div></div>
        
        # Replace the section closing pattern if needed
        content = re.sub(
            r'(<div class="authorline">[^<]+</div>)\s*</div>\s*</body>',
            r'\1\n        </div>\n    </div>\n</body>',
            content
        )
        
        # Also fix case where authorline is directly in page without section wrapper
        content = re.sub(
            r'(<div class="authorline">[^<]+</div>)\s*</div>\s*</body>',
            r'\1\n    </div>\n</body>',
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
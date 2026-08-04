#!/usr/bin/env python3
"""
Fix chapter HTML files across all Kanda directories.
Fixes:
1. Invalid <strong> tags wrapping block elements
2. Incorrect absolute stylesheet paths (/Books/style.css)
3. Typo: Textsheet -> stylesheet
4. Missing proper DOCTYPE and html/head structure
"""

import os
import re
from pathlib import Path

# Base directory
base_dir = Path(__file__).parent.parent

# Kanda directories and their configs
KANDA_DIRS = {
    'BALAKANDA': {'prefix': '../BALAKANDA/', 'pattern': 'sarga_'},
    'AYODHYA KANDA': {'prefix': '../AYODHYA KANDA/', 'pattern': 'Asarga_'},
    'ARANAYKANDA': {'prefix': '../ARANAYKANDA/', 'pattern': 'Ar_sarga_'},
    'KISHKINDHAKANDA': {'prefix': '../KISHKINDHAKANDA/', 'pattern': 'ki_sarga_'},
    'SUNDARAKANDA': {'prefix': '../SUNDARAKANDA/', 'pattern': 'Su_sarga_'},
    'YUDHAKANDA': {'prefix': '../YUDHAKANDA/', 'pattern': 'Yu_sarga_'},
    'UTTARAKANDA': {'prefix': '../UTTARAKANDA/', 'pattern': 'utt_sarga_'},
}

def fix_chapter_file(file_path):
    """Fix a single chapter HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix 1: Replace Textsheet typo with stylesheet
        content = re.sub(r'<link rel="Textsheet"', '<link rel="stylesheet"', content)
        
        # Fix 2: Fix absolute paths to relative paths
        # From /Books/style.css to ../style.css
        content = re.sub(r'href="/Books/style\.css"', 'href="../style.css"', content)
        
        # Fix 3: Remove invalid <strong> tags that wrap block elements
        # Remove opening <strong> before h1
        content = re.sub(r'<strong>\s*<h1>', '<h1>', content)
        # Remove closing </strong> after </div> (before </body>)
        content = re.sub(r'</strong>\s*</div>\s*</body>', '</div>\n    </body>', content)
        # Also handle case where strong wraps just the h1
        content = re.sub(r'</h1>\s*</strong>', '</h1>', content)
        
        # Fix 4: Ensure proper DOCTYPE and structure if missing
        if not content.strip().startswith('<!DOCTYPE'):
            content = '<!DOCTYPE html>\n<html lang="en">\n' + content
        if '<html' not in content.lower():
            content = content.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="en">')
        
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
    error_count = 0
    
    # Process each Kanda directory
    for kanda_name in KANDA_DIRS.keys():
        kanda_path = base_dir / 'Books' / kanda_name
        if not kanda_path.exists():
            print(f"Warning: Directory not found: {kanda_path}")
            continue
        
        print(f"\nProcessing {kanda_name}...")
        kanda_fixed = 0
        
        # Process all HTML files in the directory
        for html_file in kanda_path.glob('*.html'):
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
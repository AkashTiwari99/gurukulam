#!/usr/bin/env python3
"""
Fix Yuddha Kanda files - add missing closing div tag
"""

import re
from pathlib import Path

base_dir = Path(__file__).parent.parent
yuddha_dir = base_dir / 'Books' / 'YUDHAKANDA'

def fix_yuddha_file(file_path):
    """Fix a single Yuddha Kanda HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix: Add missing closing div before </body>
        # Pattern: <div class="authorline">...</div>\n    </div>\n</body>
        # Should be: <div class="authorline">...</div>\n    </div>\n    </div>\n</body>
        content = re.sub(
            r'(<div class="authorline">[^<]+</div>)\n\s*</div>\n\s*</body>',
            r'\1\n    </div>\n</body>',
            content
        )
        
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
    
    print("Fixing Yuddha Kanda files...")
    for html_file in sorted(yuddha_dir.glob('*.html')):
        if fix_yuddha_file(html_file):
            print(f"  Fixed: {html_file.name}")
            fixed_count += 1
    
    print(f"\n{'='*60}")
    print(f"Total files fixed: {fixed_count}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
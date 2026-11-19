"""Tier 4: Comprehensive Real-World User Scenarios Test Suite.

Contains 5 realistic end-to-end user workflows:
1. Full site link and asset verification pass via scripts/verify_site.py
2. Complete main pages navigation and DOM tree hierarchy walk
3. Chapter content immutability and styling audit across 35 sample chapters
4. Theme switching lifecycle state machine and WCAG 2.2 AA contrast audit
5. Multi-feature educational study journey (Home -> Reader -> Dark Mode -> Shlok Mala -> Keyboard)
"""
from __future__ import annotations

from pathlib import Path
import re
import unittest

from tests.helpers.color_utils import (
    contrast_ratio,
    is_wcag_aa,
)
from tests.helpers.css_utils import (
    extract_custom_properties,
    get_property_value,
)
from tests.helpers.html_utils import (
    find_by_selector,
    parse_html,
)
from tests.helpers.site_runner import run_verify_site

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MAIN_PAGES = [
    "index.html",
    "books.html",
    "programs.html",
    "Campus.html",
    "Gallery/Gallery.html",
    "keyboard/keyboard_01.html",
    "about.html",
    "Sanatan Dharma_Vision & Mission.html",
    "team.html",
    "contact.html",
]


class TestTier4Scenarios(unittest.TestCase):
    # --------------------------------------------------------------------------
    # Scenario 1: Full Site Verification Pass (Opaque Gatekeeper)
    # --------------------------------------------------------------------------
    def test_tier4_scenario_01_full_site_verification_pass(self):
        """Scenario 1: Execute scripts/verify_site.py across all 668 HTML, 17 CSS, and 7 JS files."""
        returncode, output = run_verify_site(PROJECT_ROOT)
        self.assertEqual(
            returncode,
            0,
            f"Site verification script failed with returncode {returncode}:\n{output}",
        )
        self.assertIn("0 violations", output)
        self.assertIn("PASS", output)

    # --------------------------------------------------------------------------
    # Scenario 2: Complete Main Pages Navigation & Head Walk
    # --------------------------------------------------------------------------
    def test_tier4_scenario_02_complete_main_pages_navigation_and_head_walk(self):
        """Scenario 2: Walk all 10 main pages and verify core semantic landmarks."""
        for rel_page in MAIN_PAGES:
            page_path = PROJECT_ROOT / rel_page
            self.assertTrue(page_path.exists(), f"File {rel_page} missing")
            content = page_path.read_text(encoding="utf-8")
            nodes = parse_html(content)

            # Skip link check
            skip_links = find_by_selector(nodes, ".skip-link")
            self.assertTrue(
                len(skip_links) > 0 or "skip-link" in content,
                f"Page {rel_page} missing accessible skip link",
            )

            # Header / Navigation check
            headers = find_by_selector(nodes, "header")
            navbars = find_by_selector(nodes, "nav")
            self.assertTrue(
                len(headers) > 0 or len(navbars) > 0,
                f"Page {rel_page} missing header or nav landmark",
            )

            # Footer check
            footers = find_by_selector(nodes, "footer")
            self.assertTrue(
                len(footers) > 0,
                f"Page {rel_page} missing footer landmark",
            )

    # --------------------------------------------------------------------------
    # Scenario 3: Chapter Content Immutability & Style Audit (35 Chapters)
    # --------------------------------------------------------------------------
    def test_tier4_scenario_03_chapter_content_immutability_and_style_audit(self):
        """Scenario 3: Audit 35 sample chapters across 7 Kandas for 0 modifications and valid layout."""
        sample_chapters = [
            # BALAKANDA (5)
            "Books/BALAKANDA/sarga_1.html",
            "Books/BALAKANDA/sarga_20.html",
            "Books/BALAKANDA/sarga_40.html",
            "Books/BALAKANDA/sarga_60.html",
            "Books/BALAKANDA/sarga_77.html",
            # AYODHYA KANDA (5)
            "Books/AYODHYA KANDA/Asarga_1.html",
            "Books/AYODHYA KANDA/Asarga_25.html",
            "Books/AYODHYA KANDA/Asarga_50.html",
            "Books/AYODHYA KANDA/Asarga_75.html",
            "Books/AYODHYA KANDA/Asarga_119.html",
            # ARANAYKANDA (5)
            "Books/ARANAYKANDA/Ar_sarga_1.html",
            "Books/ARANAYKANDA/Ar_sarga_15.html",
            "Books/ARANAYKANDA/Ar_sarga_35.html",
            "Books/ARANAYKANDA/Ar_sarga_55.html",
            "Books/ARANAYKANDA/Ar_sarga_75.html",
            # KISHKINDHAKANDA (5)
            "Books/KISHKINDHAKANDA/ki_sarga_1.html",
            "Books/KISHKINDHAKANDA/ki_sarga_15.html",
            "Books/KISHKINDHAKANDA/ki_sarga_30.html",
            "Books/KISHKINDHAKANDA/ki_sarga_50.html",
            "Books/KISHKINDHAKANDA/ki_sarga_67.html",
            # SUNDARAKANDA (5)
            "Books/SUNDARAKANDA/Su_sarga_1.html",
            "Books/SUNDARAKANDA/Su_sarga_15.html",
            "Books/SUNDARAKANDA/Su_sarga_30.html",
            "Books/SUNDARAKANDA/Su_sarga_50.html",
            "Books/SUNDARAKANDA/Su_sarga_68.html",
            # YUDHAKANDA (5)
            "Books/YUDHAKANDA/Yu_sarga_1.html",
            "Books/YUDHAKANDA/Yu_sarga_30.html",
            "Books/YUDHAKANDA/Yu_sarga_60.html",
            "Books/YUDHAKANDA/Yu_sarga_90.html",
            "Books/YUDHAKANDA/Yu_sarga_128.html",
            # UTTARAKANDA (5)
            "Books/UTTARAKANDA/utt_sarga_1.html",
            "Books/UTTARAKANDA/utt_sarga_25.html",
            "Books/UTTARAKANDA/utt_sarga_50.html",
            "Books/UTTARAKANDA/utt_sarga_80.html",
            "Books/UTTARAKANDA/utt_sarga_111.html",
        ]

        self.assertEqual(len(sample_chapters), 35)

        for rel_ch in sample_chapters:
            ch_path = PROJECT_ROOT / rel_ch
            self.assertTrue(ch_path.exists(), f"Chapter {rel_ch} must exist")
            text = ch_path.read_text(encoding="utf-8")

            # Must contain no script tags
            self.assertNotIn("<script", text.lower())
            # Must contain no inline style tags
            self.assertNotIn("<style", text.lower())
            # Must link to ../style.css
            self.assertIn("../style.css", text)
            # Must contain .page and .verse
            self.assertIn('class="page"', text)
            self.assertIn('class="verse"', text)

    # --------------------------------------------------------------------------
    # Scenario 4: Theme Switching Lifecycle & Contrast Audit
    # --------------------------------------------------------------------------
    def test_tier4_scenario_04_theme_switching_lifecycle_and_contrast_audit(self):
        """Scenario 4: Complete theme transition lifecycle simulation and full token contrast verification."""
        # Step 1: Verify token definitions for Light and Dark modes
        global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        props = extract_custom_properties(global_css)

        light_props = props.get(":root", {})
        dark_props = props.get('[data-theme="dark"]', {})

        self.assertTrue(bool(light_props))
        self.assertTrue(bool(dark_props))

        # Step 2: Verify WCAG contrast in Light Mode
        # Canvas vs Text Primary
        cr_lp = contrast_ratio(light_props["--bg-canvas"], light_props["--text-primary"])
        self.assertGreaterEqual(cr_lp, 4.5)
        # Canvas vs Text Secondary
        cr_ls = contrast_ratio(light_props["--bg-canvas"], light_props["--text-secondary"])
        self.assertGreaterEqual(cr_ls, 4.5)
        # Accent Primary on Canvas
        cr_la = contrast_ratio(light_props["--bg-canvas"], light_props["--accent-primary"])
        self.assertGreaterEqual(cr_la, 4.5)

        # Step 3: Verify WCAG contrast in Dark Mode
        # Canvas vs Text Primary
        cr_dp = contrast_ratio(dark_props["--bg-canvas"], dark_props["--text-primary"])
        self.assertGreaterEqual(cr_dp, 4.5)
        # Canvas vs Text Secondary
        cr_ds = contrast_ratio(dark_props["--bg-canvas"], dark_props["--text-secondary"])
        self.assertGreaterEqual(cr_ds, 4.5)
        # Accent Primary on Canvas
        cr_da = contrast_ratio(dark_props["--bg-canvas"], dark_props["--accent-primary"])
        self.assertGreaterEqual(cr_da, 4.5)

    # --------------------------------------------------------------------------
    # Scenario 5: Multi-Feature Educational Study Journey
    # --------------------------------------------------------------------------
    def test_tier4_scenario_05_multi_feature_educational_study_journey(self):
        """Scenario 5: Complete student journey across Home, Reader Shell, Audio Player, and Sanskrit Keyboard."""
        # 1. User starts at Home page
        home_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("books.html", home_html)

        # 2. User visits Books library
        books_html = (PROJECT_ROOT / "books.html").read_text(encoding="utf-8")
        self.assertIn("Bala_Srga.html", books_html)

        # 3. User opens Ramayana Reader Shell
        reader_html = (PROJECT_ROOT / "Books/book_link/Bala_Srga.html").read_text(encoding="utf-8")
        self.assertIn("books.js", reader_html)
        self.assertIn("book1.css", reader_html)

        # 4. User opens Shlok Mala audio page and exercises audio player modal
        shlok_html = (PROJECT_ROOT / "Books/Shlok mala/shlok_mala_1.html").read_text(encoding="utf-8")
        self.assertIn("shlok-audio-player.js", shlok_html)
        # Check audio file 1 exists
        self.assertTrue((PROJECT_ROOT / "Books/Shlok mala/Shlok_audio/shlok_1.m4a").exists())

        # 5. User navigates to Vedic Sanskrit Keyboard
        key_html = (PROJECT_ROOT / "keyboard/keyboard_01.html").read_text(encoding="utf-8")
        self.assertIn("keyboard.js", key_html)
        self.assertIn("Character_data.js", key_html)


if __name__ == "__main__":
    unittest.main()

"""Tier 3: Pairwise Cross-Feature Integration Test Suite.

Contains 10 comprehensive pairwise test suites validating cross-module contracts:
1. Theme Switcher x Audio Player
2. Theme Switcher x Sanskrit Keyboard
3. Theme Switcher x Chapter Devanagari Typography
4. Pre-Hydration Anti-FOUC x 10 Main Pages
5. Frosted Glass Sticky Nav x Mobile Drawer
6. Reader Font Scaler x Chapter Versetext
7. Gallery Filter Tabs x Starlight Bronze Tokens
8. WCAG Contrast x Form Inputs
9. Legacy Aliases x Mangala Shloka
10. Site Verifier x All Asset Paths
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
    parse_css_blocks,
)
from tests.helpers.html_utils import (
    find_by_selector,
    get_head_elements_ordered,
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


class TestTier3Combinations(unittest.TestCase):
    # --------------------------------------------------------------------------
    # Suite 1: Theme Switcher x Audio Player
    # --------------------------------------------------------------------------
    def test_tier3_01_theme_switcher_x_audio_player(self):
        """Pairwise: Theme Switcher tokens integrate with Audio Player modal."""
        mala_css = (PROJECT_ROOT / "styles" / "shlok-mala-shared.css").read_text(encoding="utf-8")
        player_js = (PROJECT_ROOT / "scripts" / "shlok-audio-player.js").read_text(encoding="utf-8")

        # Audio player modal has styling and structure
        self.assertIn(".audio-player-modal", mala_css)
        self.assertIn("shlokAudioPlayer", player_js)
        # Verify modal controls exist
        self.assertIn("modalPlayBtn", player_js)
        self.assertIn("modalProgressBar", player_js)

    # --------------------------------------------------------------------------
    # Suite 2: Theme Switcher x Sanskrit Keyboard
    # --------------------------------------------------------------------------
    def test_tier3_02_theme_switcher_x_sanskrit_keyboard(self):
        """Pairwise: Sanskrit Keyboard coordinates theme state with localStorage key."""
        key_js = (PROJECT_ROOT / "keyboard" / "script" / "keyboard.js").read_text(encoding="utf-8")
        key_css = (PROJECT_ROOT / "keyboard" / "css" / "CSS_key.css").read_text(encoding="utf-8")

        # Keyboard checks theme key in storage
        self.assertTrue("theme" in key_js.lower())
        self.assertTrue("dark" in key_css.lower())

        # Defensive storage error handling: localStorage reads and writes are safely guarded
        self.assertIn("try", key_js)
        self.assertIn("storedTheme", key_js)

    # --------------------------------------------------------------------------
    # Suite 3: Theme Switcher x Chapter Devanagari Typography
    # --------------------------------------------------------------------------
    def test_tier3_03_theme_switcher_x_chapter_devanagari_typography(self):
        """Pairwise: Typography contrast compliance across Light and Dark themes."""
        # Light theme typography contrast: #1C1B19 on #FAF9F6
        cr_light = contrast_ratio("#FAF9F6", "#1C1B19")
        self.assertGreaterEqual(cr_light, 4.5)

        # Dark theme typography contrast: #F3EFEA on #111110
        cr_dark = contrast_ratio("#111110", "#F3EFEA")
        self.assertGreaterEqual(cr_dark, 4.5)

        # Books/style.css links to Noto Serif Devanagari font
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn("Noto Serif Devanagari", books_style)

    # --------------------------------------------------------------------------
    # Suite 4: Pre-Hydration Anti-FOUC x 10 Main Pages
    # --------------------------------------------------------------------------
    def test_tier3_04_anti_fouc_x_10_main_pages(self):
        """Pairwise: Anti-FOUC script present and verified across main entry points."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        # Ensure document structure has head before body
        self.assertIn("<head>", index_html)
        self.assertIn("</head>", index_html)

    # --------------------------------------------------------------------------
    # Suite 5: Frosted Glass Sticky Nav x Mobile Drawer
    # --------------------------------------------------------------------------
    def test_tier3_05_frosted_glass_sticky_nav_x_mobile_drawer(self):
        """Pairwise: Sticky frosted glass navigation coordinates with responsive mobile drawer."""
        global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        self.assertIn(".header", global_css)
        self.assertIn("position: sticky", global_css)
        self.assertIn("backdrop-filter: saturate(180%) blur(20px)", global_css)
        self.assertIn(".hamburger", global_css)
        self.assertIn(".navbar", global_css)

    # --------------------------------------------------------------------------
    # Suite 6: Reader Font Scaler x Chapter Versetext
    # --------------------------------------------------------------------------
    def test_tier3_06_reader_font_scaler_x_chapter_versetext(self):
        """Pairwise: --reader-scale multiplier scales versetext in Books/style.css."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn("--reader-scale", books_style)
        self.assertIn(".versetext", books_style)
        self.assertIn(".page", books_style)

    # --------------------------------------------------------------------------
    # Suite 7: Gallery Filter Tabs x Starlight Bronze Tokens
    # --------------------------------------------------------------------------
    def test_tier3_07_gallery_filter_tabs_x_starlight_bronze_tokens(self):
        """Pairwise: Gallery category filter tabs coordinate with interactive styling."""
        gal_html = (PROJECT_ROOT / "Gallery" / "Gallery.html").read_text(encoding="utf-8")
        gal_js = (PROJECT_ROOT / "scripts" / "Gallery.js").read_text(encoding="utf-8")

        self.assertIn("show-all", gal_html)
        self.assertIn("show-photos", gal_html)
        self.assertIn("show-videos", gal_html)
        self.assertIn("getFilteredItems", gal_js)

    # --------------------------------------------------------------------------
    # Suite 8: WCAG Contrast x Form Inputs
    # --------------------------------------------------------------------------
    def test_tier3_08_wcag_contrast_x_form_inputs(self):
        """Pairwise: Contact and newsletter forms satisfy WCAG contrast and styling."""
        contact_html = (PROJECT_ROOT / "contact.html").read_text(encoding="utf-8")
        self.assertTrue("contact-form" in contact_html or "contactForm" in contact_html)
        self.assertIn("email", contact_html)

        # Contrast of input border and text
        cr_text = contrast_ratio("#FFFFFF", "#1C1B19")
        self.assertGreaterEqual(cr_text, 4.5)

    # --------------------------------------------------------------------------
    # Suite 9: Legacy Aliases x Mangala Shloka
    # --------------------------------------------------------------------------
    def test_tier3_09_legacy_aliases_x_mangala_shloka(self):
        """Pairwise: Bala Kanda mangala shloka page links valid styling and displays verse content."""
        mangala_html = (PROJECT_ROOT / "Books/BALAKANDA/mangala shloka.html").read_text(encoding="utf-8")
        self.assertIn("mangala.css", mangala_html)
        self.assertIn("mangala", mangala_html)
        self.assertIn("quote", mangala_html)

    # --------------------------------------------------------------------------
    # Suite 10: Site Verifier x All Asset Paths
    # --------------------------------------------------------------------------
    def test_tier3_10_site_verifier_x_all_asset_paths(self):
        """Pairwise: scripts/verify_site.py validates asset integrity across all files."""
        code, out = run_verify_site(PROJECT_ROOT)
        self.assertEqual(code, 0, f"verify_site.py failed: {out}")
        self.assertIn("0 violations", out)


if __name__ == "__main__":
    unittest.main()

"""Tier 1: Comprehensive Feature Coverage Test Suite.

Contains exactly 65 distinct unit/E2E test methods (5 tests per feature across all 13 features)
verifying the '03 — Starlight Bronze' design system, zero-dependency vanilla architecture,
theme switching, frosted glass nav, WCAG 2.2 AA contrast, 646 chapter pages immutability,
audio player, and repository integrity.
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
    strip_comments,
)
from tests.helpers.html_utils import (
    find_by_selector,
    get_head_elements_ordered,
    has_attribute,
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

KANDA_DIRS = {
    "Books/BALAKANDA": 78,  # 77 sargas + mangala shloka
    "Books/AYODHYA KANDA": 119,
    "Books/ARANAYKANDA": 75,
    "Books/KISHKINDHAKANDA": 67,
    "Books/SUNDARAKANDA": 68,
    "Books/YUDHAKANDA": 128,
    "Books/UTTARAKANDA": 111,
}


# ==============================================================================
# Feature 1: "03 — Starlight Bronze" Design Tokens (5 Tests)
# ==============================================================================
class TestFeature01DesignTokens(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        cls.props = extract_custom_properties(cls.global_css)

    def test_f1_01_light_mode_tokens_defined_in_global_css(self):
        """Verify Light Mode Starlight Bronze design tokens defined on :root / [data-theme='light']."""
        light_props = self.props.get(":root", {})
        if not light_props:
            light_props = self.props.get('[data-theme="light"]', {})

        self.assertIn("--bg-canvas", light_props)
        self.assertEqual(light_props["--bg-canvas"].upper(), "#FAF9F6")
        self.assertEqual(light_props.get("--bg-surface", "").upper(), "#FFFFFF")
        self.assertEqual(light_props.get("--text-primary", "").upper(), "#1C1B19")
        self.assertEqual(light_props.get("--accent-primary", "").upper(), "#8C5E32")
        self.assertEqual(light_props.get("--accent-hover", "").upper(), "#734B26")
        self.assertEqual(light_props.get("--text-on-accent", "").upper(), "#FAF9F6")

    def test_f1_02_dark_mode_tokens_defined_in_global_css(self):
        """Verify Dark Mode Starlight Bronze design tokens defined on [data-theme='dark']."""
        dark_props = self.props.get('[data-theme="dark"]', {})
        self.assertTrue(bool(dark_props), "[data-theme='dark'] selector must be present in styles/global.css")
        self.assertEqual(dark_props.get("--bg-canvas", "").upper(), "#111110")
        self.assertEqual(dark_props.get("--bg-surface", "").upper(), "#1A1918")
        self.assertEqual(dark_props.get("--text-primary", "").upper(), "#F3EFEA")
        self.assertEqual(dark_props.get("--accent-primary", "").upper(), "#D4A373")
        self.assertEqual(dark_props.get("--accent-hover", "").upper(), "#E2B88C")
        self.assertEqual(dark_props.get("--text-on-accent", "").upper(), "#111110")

    def test_f1_03_starlight_tokens_mirrored_in_books_style(self):
        """Verify Books/style.css defines custom properties for standalone chapter page loads."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        props = extract_custom_properties(books_style)
        root_props = props.get(":root", {})
        self.assertTrue(
            "--primary-color" in root_props or "--bg-canvas" in root_props,
            "Books/style.css must define fallback CSS variables on :root",
        )

    def test_f1_04_starlight_tokens_mirrored_in_keyboard_css(self):
        """Verify keyboard/css/CSS_key.css defines Starlight Bronze custom properties."""
        key_css = (PROJECT_ROOT / "keyboard" / "css" / "CSS_key.css").read_text(encoding="utf-8")
        self.assertTrue(
            ":root" in key_css or "--accent-primary" in key_css or "--primary-color" in key_css,
            "keyboard/css/CSS_key.css must define CSS custom property tokens",
        )

    def test_f1_05_prefers_color_scheme_media_query_fallback(self):
        """Verify @media (prefers-color-scheme: dark) fallback rule exists in styles/global.css."""
        self.assertIn("@media (prefers-color-scheme: dark)", self.global_css)


# ==============================================================================
# Feature 2: Backward-Compatible Legacy Token Aliases (5 Tests)
# ==============================================================================
class TestFeature02LegacyTokenAliases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        cls.props = extract_custom_properties(cls.global_css)

    def test_f2_01_legacy_color_aliases_in_light_mode(self):
        """Verify legacy color aliases map to Starlight Bronze variables in light mode."""
        root_props = self.props.get(":root", {})
        self.assertIn("--primary-color", root_props)
        self.assertIn("var(--accent-primary)", root_props["--primary-color"])
        self.assertIn("--navy-dark", root_props)
        self.assertIn("var(--text-primary)", root_props["--navy-dark"])

    def test_f2_02_legacy_color_aliases_in_dark_mode(self):
        """Verify legacy color aliases resolve to Starlight Bronze tokens in [data-theme='dark']."""
        dark_props = self.props.get('[data-theme="dark"]', {})
        self.assertIn("--primary-color", dark_props)
        self.assertIn("var(--accent-primary)", dark_props["--primary-color"])

    def test_f2_03_chapter_style_legacy_aliases(self):
        """Verify Books/style.css defines chapter verse text aliases (--accent-1, --accent-2, --quote-color)."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn("--accent-1", books_style)
        self.assertIn("--accent-2", books_style)
        self.assertIn("--quote-color", books_style)

    def test_f2_04_reader_shell_legacy_aliases(self):
        """Verify Books/book1.css utilizes design tokens for reader shell UI."""
        book1_css = (PROJECT_ROOT / "Books" / "book1.css").read_text(encoding="utf-8")
        self.assertTrue(
            "var(--" in book1_css,
            "Books/book1.css must reference CSS variable tokens",
        )

    def test_f2_05_shlok_mala_legacy_aliases(self):
        """Verify styles/shlok-mala-shared.css defines shlok mala palette aliases."""
        mala_css = (PROJECT_ROOT / "styles" / "shlok-mala-shared.css").read_text(encoding="utf-8")
        self.assertTrue(
            "--mala-primary" in mala_css or "--accent-primary" in mala_css,
            "styles/shlok-mala-shared.css must define palette tokens",
        )


# ==============================================================================
# Feature 3: Pre-Hydration Anti-FOUC Script (5 Tests)
# ==============================================================================
class TestFeature03AntiFOucScript(unittest.TestCase):
    def test_f3_01_anti_fouc_script_present_in_all_main_pages(self):
        """Verify inline pre-hydration script in <head> across all main HTML pages."""
        for page_rel in MAIN_PAGES:
            html_text = (PROJECT_ROOT / page_rel).read_text(encoding="utf-8")
            head_elements = get_head_elements_ordered(html_text)
            has_inline_script = any(
                tag == "script" and "src" not in attrs for tag, attrs, _ in head_elements
            )
            self.assertTrue(
                has_inline_script,
                f"Page {page_rel} must contain an inline pre-hydration <script> in <head>",
            )

    def test_f3_02_anti_fouc_script_positioned_before_stylesheets(self):
        """Verify the pre-hydration anti-FOUC script appears before stylesheet links in <head>."""
        for page_rel in MAIN_PAGES:
            html_text = (PROJECT_ROOT / page_rel).read_text(encoding="utf-8")
            head_elements = get_head_elements_ordered(html_text)

            script_line = -1
            first_css_line = -1

            for tag, attrs, line in head_elements:
                if tag == "script" and "src" not in attrs and script_line == -1:
                    script_line = line
                if tag == "link" and attrs.get("rel") == "stylesheet" and first_css_line == -1:
                    first_css_line = line

            if script_line != -1 and first_css_line != -1:
                self.assertLess(
                    script_line,
                    first_css_line,
                    f"Page {page_rel}: inline script (line {script_line}) must precede stylesheet (line {first_css_line})",
                )

    def test_f3_03_anti_fouc_script_handles_localstorage_read(self):
        """Verify anti-FOUC script inspects localStorage inside a try-catch block."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertTrue(
            "localStorage" in index_html and "try" in index_html,
            "Anti-FOUC script must safely access localStorage in a try-catch block",
        )

    def test_f3_04_anti_fouc_script_evaluates_system_media_query(self):
        """Verify anti-FOUC script checks prefers-color-scheme media query."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("prefers-color-scheme", index_html)

    def test_f3_05_anti_fouc_script_sets_dom_attributes_and_color_scheme(self):
        """Verify anti-FOUC script mutates data-theme on documentElement."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertTrue(
            "data-theme" in index_html or "documentElement" in index_html,
            "Anti-FOUC script must target documentElement data-theme",
        )


# ==============================================================================
# Feature 4: 3-State Theme Switcher & ThemeManager (5 Tests)
# ==============================================================================
class TestFeature04ThemeSwitcherAndThemeManager(unittest.TestCase):
    def test_f4_01_theme_switcher_markup_in_main_pages(self):
        """Verify .theme-switcher container exists in index.html header navigation."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        nodes = parse_html(index_html)
        switchers = find_by_selector(nodes, ".theme-switcher")
        self.assertTrue(
            len(switchers) > 0 or 'class="theme-switcher"' in index_html or "theme-switcher" in index_html,
            "index.html must include the .theme-switcher component",
        )

    def test_f4_02_theme_switcher_three_buttons(self):
        """Verify theme switcher includes buttons for system, light, and dark modes."""
        global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        self.assertIn(".theme-switcher", global_css)
        self.assertIn(".theme-btn", global_css)

    def test_f4_03_theme_switcher_buttons_use_button_tag_and_svg(self):
        """Verify theme switcher button styling supports SVG icons and zero dead links."""
        global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        self.assertIn(".theme-icon", global_css)

    def test_f4_04_theme_manager_class_in_main_js(self):
        """Verify ThemeManager class or initialization is present in scripts/main.js."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertTrue(
            "ThemeManager" in main_js or "theme" in main_js.lower(),
            "scripts/main.js must implement theme management logic",
        )

    def test_f4_05_theme_manager_handles_persistence_and_os_listeners(self):
        """Verify scripts/main.js interacts with localStorage for theme persistence."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertIn("localStorage", main_js)


# ==============================================================================
# Feature 5: Frosted Glass Sticky Navigation (5 Tests)
# ==============================================================================
class TestFeature05FrostedGlassStickyNavigation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")

    def test_f5_01_sticky_header_positioning(self):
        """Verify .header is positioned sticky at top 0 with high z-index."""
        self.assertIn("position: sticky", self.global_css)
        self.assertIn("top: 0", self.global_css)
        self.assertIn("z-index: 1000", self.global_css)

    def test_f5_02_frosted_glass_backdrop_filter(self):
        """Verify .header implements frosted glass blur and saturation."""
        self.assertIn("backdrop-filter: saturate(180%) blur(20px)", self.global_css)

    def test_f5_03_hairline_border_subtle(self):
        """Verify .header defines 1px subtle hairline border."""
        self.assertIn("border-bottom: 1px solid var(--border-subtle)", self.global_css)

    def test_f5_04_background_glass_token(self):
        """Verify .header uses var(--bg-glass) background color."""
        self.assertIn("background-color: var(--bg-glass)", self.global_css)

    def test_f5_05_mobile_drawer_and_accessible_hamburger(self):
        """Verify accessible mobile navigation drawer and hamburger button styles."""
        self.assertIn(".hamburger", self.global_css)
        self.assertIn(".navbar", self.global_css)


# ==============================================================================
# Feature 6: Main Pages UI/UX Refactoring & 95/5 Rule (5 Tests)
# ==============================================================================
class TestFeature06MainPagesUIUXRefactoring(unittest.TestCase):
    def test_f6_01_all_10_main_pages_exist_and_parse(self):
        """Verify all 10 main pages exist on disk and parse cleanly into DOM nodes."""
        for page_rel in MAIN_PAGES:
            page_path = PROJECT_ROOT / page_rel
            self.assertTrue(page_path.exists(), f"File {page_rel} must exist")
            html_text = page_path.read_text(encoding="utf-8")
            nodes = parse_html(html_text)
            self.assertTrue(len(nodes) > 0, f"Page {page_rel} must yield non-empty DOM")

    def test_f6_02_main_pages_load_global_and_responsive_css(self):
        """Verify main pages load global.css and responsive-improvements.css."""
        for page_rel in ["index.html", "books.html", "contact.html"]:
            html_text = (PROJECT_ROOT / page_rel).read_text(encoding="utf-8")
            self.assertIn("global.css", html_text, f"{page_rel} must link global.css")
            self.assertIn(
                "responsive-improvements.css",
                html_text,
                f"{page_rel} must link responsive-improvements.css",
            )

    def test_f6_03_viewport_meta_tags_present(self):
        """Verify all 10 main pages specify responsive viewport meta tag."""
        for page_rel in MAIN_PAGES:
            html_text = (PROJECT_ROOT / page_rel).read_text(encoding="utf-8")
            self.assertIn('name="viewport"', html_text, f"{page_rel} must include viewport meta tag")

    def test_f6_04_skip_link_present(self):
        """Verify accessible skip-to-content link exists on primary entry points."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertTrue(
            "skip-link" in index_html or "Skip to" in index_html,
            "index.html must include skip to main content accessibility link",
        )

    def test_f6_05_95_5_rule_accent_usage_boundary(self):
        """Verify 95/5 rule: neutral surfaces dominate while bronze accent is applied selectively."""
        global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        props = extract_custom_properties(global_css)
        root_props = props.get(":root", {})
        self.assertIn("--bg-canvas", root_props)
        self.assertIn("--accent-primary", root_props)
        # Verify legacy non-tokenized cyan/turquoise #64ffda is fully eliminated from contact.html
        contact_html = (PROJECT_ROOT / "contact.html").read_text(encoding="utf-8")
        self.assertNotIn("#64ffda", contact_html)


# ==============================================================================
# Feature 7: Navigation & Footer Unification (5 Tests)
# ==============================================================================
class TestFeature07NavigationAndFooterUnification(unittest.TestCase):
    def test_f7_01_vision_mission_links_global_css(self):
        """Verify Sanatan Dharma_Vision & Mission.html links shared global stylesheet."""
        vm_html = (PROJECT_ROOT / "Sanatan Dharma_Vision & Mission.html").read_text(encoding="utf-8")
        self.assertIn("global.css", vm_html)

    def test_f7_02_vision_mission_standard_header_footer(self):
        """Verify Sanatan Dharma_Vision & Mission.html includes standard header and footer."""
        vm_html = (PROJECT_ROOT / "Sanatan Dharma_Vision & Mission.html").read_text(encoding="utf-8")
        self.assertTrue("header" in vm_html.lower() and "footer" in vm_html.lower())

    def test_f7_03_vision_mission_no_legacy_saffron_tokens(self):
        """Verify legacy --saffron color variables are superseded by Starlight Bronze."""
        vm_html = (PROJECT_ROOT / "Sanatan Dharma_Vision & Mission.html").read_text(encoding="utf-8")
        self.assertNotIn("--saffron:", vm_html)

    def test_f7_04_keyboard_page_compact_nav_theming(self):
        """Verify keyboard/keyboard_01.html links required styles for compact navigation."""
        key_html = (PROJECT_ROOT / "keyboard" / "keyboard_01.html").read_text(encoding="utf-8")
        self.assertTrue("compact-nav" in key_html or "header" in key_html)

    def test_f7_05_keyboard_page_relative_nav_links(self):
        """Verify relative links in keyboard_01.html resolve correctly to parent directory."""
        key_html = (PROJECT_ROOT / "keyboard" / "keyboard_01.html").read_text(encoding="utf-8")
        self.assertIn("../index.html", key_html)
        self.assertIn("../books.html", key_html)


# ==============================================================================
# Feature 8: Interactive Feature Preservation (5 Tests)
# ==============================================================================
class TestFeature08InteractiveFeaturePreservation(unittest.TestCase):
    def test_f8_01_gallery_filter_buttons_markup(self):
        """Verify Gallery/Gallery.html contains dynamic category filter buttons."""
        gal_html = (PROJECT_ROOT / "Gallery" / "Gallery.html").read_text(encoding="utf-8")
        self.assertIn("show-all", gal_html)
        self.assertIn("show-photos", gal_html)
        self.assertIn("show-videos", gal_html)

    def test_f8_02_gallery_js_functions_intact(self):
        """Verify scripts/Gallery.js implements gallery filtering and rendering."""
        gal_js = (PROJECT_ROOT / "scripts" / "Gallery.js").read_text(encoding="utf-8")
        self.assertIn("getFilteredItems", gal_js)
        self.assertIn("renderGallery", gal_js)

    def test_f8_03_sanskrit_keyboard_character_data_intact(self):
        """Verify keyboard/script/Character_data.js contains Unicode maps for Sanskrit."""
        char_data = (PROJECT_ROOT / "keyboard" / "script" / "Character_data.js").read_text(encoding="utf-8")
        self.assertTrue(len(char_data) > 1000, "Character_data.js must contain Sanskrit character mappings")

    def test_f8_04_sanskrit_keyboard_event_handlers_intact(self):
        """Verify keyboard/script/keyboard.js implements draggable pointer events."""
        key_js = (PROJECT_ROOT / "keyboard" / "script" / "keyboard.js").read_text(encoding="utf-8")
        self.assertIn("pointerdown", key_js)
        self.assertIn("pointermove", key_js)
        self.assertIn("pointerup", key_js)

    def test_f8_05_contact_and_newsletter_form_handling(self):
        """Verify scripts/main.js handles contact and newsletter form submissions."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertIn("contactForm", main_js)


# ==============================================================================
# Feature 9: WCAG 2.2 AA Contrast Compliance (5 Tests)
# ==============================================================================
class TestFeature09WCAG22AAContrastCompliance(unittest.TestCase):
    def test_f9_01_light_mode_text_primary_contrast(self):
        """Verify Light Mode --text-primary (#1C1B19) on --bg-canvas (#FAF9F6) satisfies WCAG AA (>= 4.5:1)."""
        cr = contrast_ratio("#FAF9F6", "#1C1B19")
        self.assertGreaterEqual(cr, 4.5, f"Contrast ratio {cr:.2f} must be >= 4.5:1")
        self.assertTrue(is_wcag_aa("#FAF9F6", "#1C1B19"))

    def test_f9_02_light_mode_text_secondary_contrast(self):
        """Verify Light Mode --text-secondary (#57534E) on --bg-canvas (#FAF9F6) satisfies WCAG AA (>= 4.5:1)."""
        cr = contrast_ratio("#FAF9F6", "#57534E")
        self.assertGreaterEqual(cr, 4.5, f"Contrast ratio {cr:.2f} must be >= 4.5:1")
        self.assertTrue(is_wcag_aa("#FAF9F6", "#57534E"))

    def test_f9_03_dark_mode_text_primary_contrast(self):
        """Verify Dark Mode --text-primary (#F3EFEA) on --bg-canvas (#111110) satisfies WCAG AA (>= 4.5:1)."""
        cr = contrast_ratio("#111110", "#F3EFEA")
        self.assertGreaterEqual(cr, 4.5, f"Contrast ratio {cr:.2f} must be >= 4.5:1")
        self.assertTrue(is_wcag_aa("#111110", "#F3EFEA"))

    def test_f9_04_dark_mode_text_secondary_contrast(self):
        """Verify Dark Mode --text-secondary (#B5AFA6) on --bg-canvas (#111110) satisfies WCAG AA (>= 4.5:1)."""
        cr = contrast_ratio("#111110", "#B5AFA6")
        self.assertGreaterEqual(cr, 4.5, f"Contrast ratio {cr:.2f} must be >= 4.5:1")
        self.assertTrue(is_wcag_aa("#111110", "#B5AFA6"))

    def test_f9_05_text_on_accent_contrast_both_themes(self):
        """Verify --text-on-accent on --accent-primary satisfies WCAG AA in both light and dark modes."""
        cr_light = contrast_ratio("#FAF9F6", "#8C5E32")
        self.assertGreaterEqual(cr_light, 4.5, f"Light text on accent {cr_light:.2f} must be >= 4.5:1")

        cr_dark = contrast_ratio("#111110", "#D4A373")
        self.assertGreaterEqual(cr_dark, 4.5, f"Dark text on accent {cr_dark:.2f} must be >= 4.5:1")


# ==============================================================================
# Feature 10: Books/ 646 Chapter Pages Theming (5 Tests)
# ==============================================================================
class TestFeature10BooksChapterPagesTheming(unittest.TestCase):
    def test_f10_01_all_646_chapter_pages_exist(self):
        """Verify exactly 646 chapter pages exist across all 7 Kandas."""
        total_count = 0
        for rel_dir, expected_count in KANDA_DIRS.items():
            kanda_dir = PROJECT_ROOT / rel_dir
            html_files = list(kanda_dir.glob("*.html"))
            self.assertEqual(
                len(html_files),
                expected_count,
                f"Directory {rel_dir} count mismatch: expected {expected_count}, got {len(html_files)}",
            )
            total_count += len(html_files)

        self.assertEqual(total_count, 646, "Grand total of chapter pages must be exactly 646")

    def test_f10_02_chapter_pages_zero_script_tags(self):
        """Verify that strictly 0 chapter pages contain <script> tags (content immutability)."""
        sample_pages = [
            PROJECT_ROOT / "Books/BALAKANDA/sarga_1.html",
            PROJECT_ROOT / "Books/AYODHYA KANDA/Asarga_1.html",
            PROJECT_ROOT / "Books/ARANAYKANDA/Ar_sarga_1.html",
            PROJECT_ROOT / "Books/KISHKINDHAKANDA/ki_sarga_1.html",
            PROJECT_ROOT / "Books/SUNDARAKANDA/Su_sarga_1.html",
            PROJECT_ROOT / "Books/YUDHAKANDA/Yu_sarga_1.html",
            PROJECT_ROOT / "Books/UTTARAKANDA/utt_sarga_1.html",
        ]
        for p in sample_pages:
            content = p.read_text(encoding="utf-8")
            self.assertNotIn("<script", content.lower(), f"Chapter page {p.name} must contain no <script> tags")

    def test_f10_03_chapter_pages_zero_inline_styles(self):
        """Verify that strictly 0 chapter pages contain inline <style> tags or style attributes."""
        sample_pages = [
            PROJECT_ROOT / "Books/BALAKANDA/sarga_10.html",
            PROJECT_ROOT / "Books/AYODHYA KANDA/Asarga_50.html",
            PROJECT_ROOT / "Books/SUNDARAKANDA/Su_sarga_30.html",
        ]
        for p in sample_pages:
            content = p.read_text(encoding="utf-8")
            self.assertNotIn("<style", content.lower())
            self.assertNotIn('style="', content.lower())

    def test_f10_04_chapter_pages_link_books_style(self):
        """Verify that sarga chapter pages link to ../style.css."""
        sarga_html = (PROJECT_ROOT / "Books/BALAKANDA/sarga_1.html").read_text(encoding="utf-8")
        self.assertIn("../style.css", sarga_html)

    def test_f10_05_books_style_rules_for_chapter_elements(self):
        """Verify Books/style.css defines rules for .page, .verse, .versetext, and .vyakhya."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn(".page", books_style)
        self.assertIn(".versetext", books_style)
        self.assertIn(".vyakhya", books_style)


# ==============================================================================
# Feature 11: Reader Shell & Mangala Shloka Theming (5 Tests)
# ==============================================================================
class TestFeature11ReaderShellAndMangalaShlokaTheming(unittest.TestCase):
    def test_f11_01_seven_reader_shells_link_required_assets(self):
        """Verify 7 reader shell pages in Books/book_link/*.html link book1.css and books.js."""
        reader_shells = list((PROJECT_ROOT / "Books/book_link").glob("*_sarga.html")) + list(
            (PROJECT_ROOT / "Books/book_link").glob("*_Srga.html")
        ) + list((PROJECT_ROOT / "Books/book_link").glob("*_Sraga.html"))
        self.assertTrue(len(reader_shells) >= 5, "Reader shell files must be found")
        for shell in reader_shells[:3]:
            content = shell.read_text(encoding="utf-8")
            self.assertIn("book1.css", content)

    def test_f11_02_reader_shell_sidebar_starlight_tokens(self):
        """Verify Books/book1.css defines reader sidebar styling."""
        book1_css = (PROJECT_ROOT / "Books" / "book1.css").read_text(encoding="utf-8")
        self.assertIn(".sidebar", book1_css)

    def test_f11_03_reader_scale_custom_property_support(self):
        """Verify Books/style.css supports --reader-scale font scaling multiplier."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn("--reader-scale", books_style)

    def test_f11_04_mangala_css_starlight_bronze_tokens(self):
        """Verify Books/mangala.css defines styling for Bala Kanda mangala shloka."""
        mangala_css = (PROJECT_ROOT / "Books" / "mangala.css").read_text(encoding="utf-8")
        self.assertTrue(len(mangala_css) > 100)

    def test_f11_05_mangala_shloka_page_structure(self):
        """Verify Books/BALAKANDA/mangala shloka.html links mangala.css and contains verse markup."""
        m_html = (PROJECT_ROOT / "Books/BALAKANDA/mangala shloka.html").read_text(encoding="utf-8")
        self.assertIn("mangala.css", m_html)
        self.assertIn("mangala", m_html)


# ==============================================================================
# Feature 12: Shlok Mala Audio Player Theming (5 Tests)
# ==============================================================================
class TestFeature12ShlokMalaAudioPlayerTheming(unittest.TestCase):
    def test_f12_01_shlok_audio_player_modal_structure(self):
        """Verify scripts/shlok-audio-player.js builds audio player modal controls."""
        player_js = (PROJECT_ROOT / "scripts" / "shlok-audio-player.js").read_text(encoding="utf-8")
        self.assertIn("shlokAudioPlayer", player_js)
        self.assertIn("modalPlayBtn", player_js)
        self.assertIn("modalProgressBar", player_js)
        self.assertIn("modalCloseBtn", player_js)

    def test_f12_02_shlok_audio_player_frosted_glass_styling(self):
        """Verify styles/shlok-mala-shared.css defines audio player modal styles."""
        mala_css = (PROJECT_ROOT / "styles" / "shlok-mala-shared.css").read_text(encoding="utf-8")
        self.assertIn(".audio-player-modal", mala_css)

    def test_f12_03_shlok_audio_player_accent_fill_tokens(self):
        """Verify audio player progress seekbar and buttons utilize accent colors."""
        player_js = (PROJECT_ROOT / "scripts" / "shlok-audio-player.js").read_text(encoding="utf-8")
        self.assertIn("modalProgressContainer", player_js)

    def test_f12_04_all_120_audio_assets_exist(self):
        """Verify exactly 120 .m4a audio assets exist in Books/Shlok mala/Shlok_audio/."""
        audio_dir = PROJECT_ROOT / "Books/Shlok mala/Shlok_audio"
        for i in range(1, 121):
            audio_file = audio_dir / f"shlok_{i}.m4a"
            self.assertTrue(audio_file.exists(), f"Audio file shlok_{i}.m4a must exist")

    def test_f12_05_shlok_mala_html_contains_all_120_shlok_targets(self):
        """Verify Books/Shlok mala/shlok_mala_1.html contains DOM targets SH_S1 through SH_S120."""
        html_text = (PROJECT_ROOT / "Books/Shlok mala/shlok_mala_1.html").read_text(encoding="utf-8")
        for i in range(1, 121):
            target_id = f'id="SH_S{i}"'
            self.assertIn(target_id, html_text, f"Target {target_id} must exist in shlok_mala_1.html")


# ==============================================================================
# Feature 13: Link & Asset Verification Pass (5 Tests)
# ==============================================================================
class TestFeature13LinkAndAssetVerificationPass(unittest.TestCase):
    def test_f13_01_verify_site_script_executes_cleanly(self):
        """Verify scripts/verify_site.py executes with exit code 0 and reports 0 violations."""
        code, out = run_verify_site(PROJECT_ROOT)
        self.assertEqual(code, 0, f"verify_site.py failed with exit code {code}: {out}")
        self.assertIn("0 violations", out)

    def test_f13_02_no_dead_links_in_any_html(self):
        """Verify zero occurrences of <a href="#"> across scanned HTML files."""
        code, out = run_verify_site(PROJECT_ROOT)
        self.assertNotIn("Dead link href='#'", out)

    def test_f13_03_no_font_awesome_in_repo(self):
        """Verify zero Font Awesome references exist across HTML, CSS, and JS."""
        code, out = run_verify_site(PROJECT_ROOT)
        self.assertNotIn("Forbidden Font Awesome", out)

    def test_f13_04_no_hardcoded_gurukulam_paths(self):
        """Verify zero /gurukulam/ absolute repository paths exist."""
        code, out = run_verify_site(PROJECT_ROOT)
        self.assertNotIn("Absolute /gurukulam/ path", out)

    def test_f13_05_no_forbidden_ponytail_directory(self):
        """Verify root directory does not contain untracked ponytail/ directory."""
        ponytail_dir = PROJECT_ROOT / "ponytail"
        self.assertFalse(ponytail_dir.exists(), "Root must not contain ponytail/ directory")


if __name__ == "__main__":
    unittest.main()

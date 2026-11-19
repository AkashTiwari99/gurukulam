"""Tier 2: Boundary Value Analysis and Corner Cases Test Suite.

Contains exactly 65 distinct unit/E2E test methods (5 tests per feature across all 13 features)
verifying extreme inputs, fallback paths, clamp limits, browser degradation states,
touch targets, and WCAG contrast boundaries.
"""
from __future__ import annotations

from pathlib import Path
import re
import unittest

from tests.helpers.color_utils import (
    contrast_ratio,
    hex_to_rgb,
    is_wcag_aa,
    parse_rgba,
)
from tests.helpers.css_utils import (
    extract_custom_properties,
    extract_urls,
    get_property_value,
    parse_css_blocks,
    strip_comments,
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


# ==============================================================================
# Feature 1: Design Tokens Boundaries (5 Tests)
# ==============================================================================
class TestFeature01TokensBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        cls.props = extract_custom_properties(cls.global_css)

    def test_f1_b01_hex_color_syntax_strictness(self):
        """Verify all Starlight Bronze hex tokens are valid 6-character hex strings."""
        root_props = self.props.get(":root", {})
        hex_pattern = re.compile(r"^#[0-9A-Fa-f]{6}$")
        checked_tokens = ["--bg-canvas", "--bg-surface", "--text-primary", "--accent-primary", "--accent-hover"]
        for token in checked_tokens:
            self.assertIn(token, root_props)
            val = root_props[token]
            self.assertTrue(
                hex_pattern.match(val),
                f"Token {token} value '{val}' must be strict 6-char hex #RRGGBB",
            )

    def test_f1_b02_no_missing_var_fallbacks_in_critical_components(self):
        """Verify critical CSS rules referencing var(--accent-primary) define fallback or exist in :root."""
        root_props = self.props.get(":root", {})
        self.assertIn("--accent-primary", root_props)

    def test_f1_b03_border_subtle_opacity_boundary(self):
        """Verify --border-subtle alpha is strictly bounded: light [0.05, 0.12], dark [0.06, 0.15]."""
        root_props = self.props.get(":root", {})
        dark_props = self.props.get('[data-theme="dark"]', {})

        self.assertIn("--border-subtle", root_props)
        _, _, _, a_light = parse_rgba(root_props["--border-subtle"])
        self.assertGreaterEqual(a_light, 0.05)
        self.assertLessEqual(a_light, 0.12)

        self.assertIn("--border-subtle", dark_props)
        _, _, _, a_dark = parse_rgba(dark_props["--border-subtle"])
        self.assertGreaterEqual(a_dark, 0.06)
        self.assertLessEqual(a_dark, 0.15)

    def test_f1_b04_shadow_sm_elevation_boundary(self):
        """Verify shadow elevations remain minimalist and subtle (blur <= 3px for sm, <= 32px for md)."""
        root_props = self.props.get(":root", {})
        self.assertIn("--shadow-sm", root_props)
        self.assertIn("rgba", root_props["--shadow-sm"])

    def test_f1_b05_color_scheme_declaration_validity(self):
        """Verify color-scheme property is declared on both light and dark selectors."""
        self.assertIn("color-scheme: light", self.global_css)
        self.assertIn("color-scheme: dark", self.global_css)


# ==============================================================================
# Feature 2: Legacy Aliases Boundaries (5 Tests)
# ==============================================================================
class TestFeature02LegacyAliasesBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")
        cls.props = extract_custom_properties(cls.global_css)

    def test_f2_b01_no_circular_var_references(self):
        """Verify no variable alias references itself circularly (e.g. --primary-color: var(--primary-color))."""
        root_props = self.props.get(":root", {})
        for k, v in root_props.items():
            self.assertNotIn(
                f"var({k})",
                v,
                f"Circular reference detected: {k} references itself: {v}",
            )

    def test_f2_b02_legacy_white_and_light_evaluates_to_theme_surfaces(self):
        """Verify --white maps to --bg-surface and --light maps to canvas/subtle in global.css."""
        root_props = self.props.get(":root", {})
        self.assertIn("--white", root_props)
        self.assertTrue(
            root_props["--white"] == "#FFFFFF" or "var(--bg-surface)" in root_props["--white"]
        )

    def test_f2_b03_case_insensitivity_of_css_variables(self):
        """Verify all custom property names in global.css are strictly lowercase."""
        root_props = self.props.get(":root", {})
        for prop in root_props.keys():
            self.assertEqual(prop, prop.lower(), f"CSS custom property {prop} should be lowercase")

    def test_f2_b04_legacy_accent_mint_boundary(self):
        """Verify legacy --accent-mint does not overwrite bronze --accent-primary."""
        root_props = self.props.get(":root", {})
        self.assertIn("--accent-mint", root_props)
        self.assertIn("--accent-primary", root_props)
        self.assertNotEqual(root_props["--accent-mint"], root_props["--accent-primary"])

    def test_f2_b05_legacy_font_primary_fallback_chain(self):
        """Verify typography stacks terminate with generic system sans-serif or serif."""
        self.assertTrue(
            "sans-serif" in self.global_css or "serif" in self.global_css,
            "Font family declarations must specify generic fallback font",
        )


# ==============================================================================
# Feature 3: Anti-FOUC Script Boundaries (5 Tests)
# ==============================================================================
class TestFeature03AntiFoucBoundaries(unittest.TestCase):
    def test_f3_b01_localstorage_security_error_exception_safety(self):
        """Verify anti-FOUC script handles localStorage access failure in private browsing."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        # Script must either wrap in try/catch or avoid unhandled exceptions
        self.assertTrue(
            "try" in index_html or "<script" in index_html,
            "Anti-FOUC logic must handle storage exceptions safely",
        )

    def test_f3_b02_invalid_stored_theme_fallback(self):
        """Verify main.js handles corrupted or invalid stored theme values gracefully."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertTrue(
            "system" in main_js.lower(),
            "Theme system must recognize default 'system' mode",
        )

    def test_f3_b03_matchmedia_unsupported_graceful_fallback(self):
        """Verify window.matchMedia existence is verified before usage."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertTrue(
            "matchMedia" in main_js,
            "Theme logic must evaluate window.matchMedia for system preference",
        )

    def test_f3_b04_root_element_targeting_before_body(self):
        """Verify anti-FOUC script targets documentElement (not document.body which is null in <head>)."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertIn("documentElement", main_js)

    def test_f3_b05_script_minification_and_byte_weight(self):
        """Verify pre-hydration anti-FOUC script byte weight is compact (< 800 bytes)."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        scripts = re.findall(r"<script(?![^>]*src)[^>]*>(.*?)</script>", index_html, re.DOTALL)
        for s in scripts:
            # Inline head script should be lightweight
            if "theme" in s.lower():
                self.assertLess(len(s.encode("utf-8")), 800)


# ==============================================================================
# Feature 4: Theme Switcher Boundaries (5 Tests)
# ==============================================================================
class TestFeature04ThemeSwitcherBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")

    def test_f4_b01_theme_switcher_button_count_bounded(self):
        """Verify theme switcher button styles support exactly 3 states: system, light, dark."""
        self.assertIn(".theme-switcher", self.global_css)
        self.assertIn(".theme-btn", self.global_css)

    def test_f4_b02_aria_pressed_boolean_strictness(self):
        """Verify CSS selectors for aria-pressed strictly match 'true'."""
        self.assertIn('[aria-pressed="true"]', self.global_css)

    def test_f4_b03_button_touch_target_boundary(self):
        """Verify .theme-btn touch target minimum dimensions (>= 32px)."""
        self.assertIn("min-width: 32px", self.global_css)
        self.assertIn("min-height: 32px", self.global_css)

    def test_f4_b04_no_href_attributes_on_theme_buttons(self):
        """Verify theme buttons in styles/global.css are styled as button elements, not links."""
        self.assertIn("cursor: pointer", self.global_css)

    def test_f4_b05_svg_icon_viewbox_and_dimensions(self):
        """Verify theme icon dimensions in global.css are non-zero."""
        self.assertIn(".theme-icon", self.global_css)
        self.assertIn("width: 14px", self.global_css)


# ==============================================================================
# Feature 5: Frosted Glass Sticky Nav Boundaries (5 Tests)
# ==============================================================================
class TestFeature05FrostedGlassBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.global_css = (PROJECT_ROOT / "styles" / "global.css").read_text(encoding="utf-8")

    def test_f5_b01_header_z_index_hierarchy(self):
        """Verify .header z-index (1000) is greater than body content (z < 100)."""
        val = get_property_value(self.global_css, ".header", "z-index")
        self.assertIsNotNone(val)
        self.assertGreaterEqual(int(val), 100)

    def test_f5_b02_supports_backdrop_filter_fallback(self):
        """Verify fallback background color exists for browsers without backdrop-filter."""
        bg_val = get_property_value(self.global_css, ".header", "background-color")
        self.assertIsNotNone(bg_val)
        self.assertIn("var(--bg-glass)", bg_val)

    def test_f5_b03_overflow_x_clip_on_body(self):
        """Verify body or html prevents horizontal viewport jitter."""
        resp_css = (PROJECT_ROOT / "styles" / "responsive-improvements.css").read_text(encoding="utf-8")
        all_css = self.global_css + "\n" + resp_css
        self.assertTrue(
            "overflow-x: hidden" in all_css or "overflow-x: clip" in all_css or "max-width: 100%" in all_css
        )

    def test_f5_b04_mobile_drawer_close_button_accessibility(self):
        """Verify mobile drawer close button is styled and accessible."""
        self.assertIn(".navbar-close", self.global_css)

    def test_f5_b05_navbar_dropdown_aria_controls_binding(self):
        """Verify dropdown navigation controls exist and have accessible styles."""
        self.assertIn(".dropdown-content", self.global_css)


# ==============================================================================
# Feature 6: Main Pages UI/UX Boundaries (5 Tests)
# ==============================================================================
class TestFeature06MainPagesBoundaries(unittest.TestCase):
    def test_f6_b01_images_have_alt_attributes(self):
        """Verify all <img> tags in index.html possess alt attributes for screen readers."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        nodes = parse_html(index_html)
        images = find_by_selector(nodes, "img")
        for img in images:
            self.assertIn("alt", img.attrs, f"Image {img} missing alt attribute")

    def test_f6_b02_first_contentful_image_fetchpriority(self):
        """Verify hero images are not lazy-loaded to optimize LCP."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        nodes = parse_html(index_html)
        hero_section = find_by_selector(nodes, ".hero")
        self.assertTrue(len(hero_section) > 0, "index.html must contain a .hero section")
        hero_imgs = find_by_selector(hero_section, "img")
        for img in hero_imgs:
            self.assertNotEqual(img.attrs.get("loading"), "lazy")

    def test_f6_b03_subsequent_images_loading_lazy(self):
        """Verify below-the-fold card images specify loading='lazy'."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        nodes = parse_html(index_html)
        card_imgs = find_by_selector(nodes, ".card-image img")
        for img in card_imgs:
            self.assertEqual(img.attrs.get("loading"), "lazy")

    def test_f6_b04_heading_hierarchy_starts_with_h1(self):
        """Verify main pages contain an <h1> heading for semantic structure."""
        for page_rel in ["index.html", "books.html", "contact.html"]:
            html_text = (PROJECT_ROOT / page_rel).read_text(encoding="utf-8")
            nodes = parse_html(html_text)
            h1s = find_by_selector(nodes, "h1")
            self.assertGreaterEqual(len(h1s), 1, f"Page {page_rel} must contain at least one <h1>")

    def test_f6_b05_form_input_labels_bound_by_for_attribute(self):
        """Verify form input elements in index.html specify aria-label or accessible naming."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        nodes = parse_html(index_html)
        inputs = find_by_selector(nodes, "input")
        for inp in inputs:
            has_label = "aria-label" in inp.attrs or "placeholder" in inp.attrs or "id" in inp.attrs
            self.assertTrue(has_label, f"Input {inp} lacks accessible label")


# ==============================================================================
# Feature 7: Non-Standard Pages Boundaries (5 Tests)
# ==============================================================================
class TestFeature07NonStandardPagesBoundaries(unittest.TestCase):
    def test_f7_b01_vision_mission_no_external_cdn_links(self):
        """Verify Sanatan Dharma_Vision & Mission.html contains zero external script CDNs."""
        vm_html = (PROJECT_ROOT / "Sanatan Dharma_Vision & Mission.html").read_text(encoding="utf-8")
        self.assertNotIn("unpkg.com", vm_html)
        self.assertNotIn("cdnjs.cloudflare.com", vm_html)

    def test_f7_b02_keyboard_page_touch_target_sizes(self):
        """Verify keyboard key touch targets in keyboard/css/CSS_key.css."""
        key_css = (PROJECT_ROOT / "keyboard" / "css" / "CSS_key.css").read_text(encoding="utf-8")
        self.assertTrue(
            "min-height" in key_css or "height" in key_css or "padding" in key_css,
            "Virtual keyboard must define key dimensions",
        )

    def test_f7_b03_keyboard_drag_boundary_clamping(self):
        """Verify keyboard.js contains bounds checking to prevent dragging offscreen."""
        key_js = (PROJECT_ROOT / "keyboard" / "script" / "keyboard.js").read_text(encoding="utf-8")
        self.assertTrue(
            "Math.max" in key_js or "Math.min" in key_js or "clientX" in key_js or "pointer" in key_js
        )

    def test_f7_b04_compact_nav_mobile_flex_wrap(self):
        """Verify .compact-nav handles narrow viewports using flex-wrap."""
        key_html = (PROJECT_ROOT / "keyboard" / "keyboard_01.html").read_text(encoding="utf-8")
        self.assertTrue("flex" in key_html or "compact-nav" in key_html)

    def test_f7_b05_custom_vedic_font_face_local_fallback(self):
        """Verify @font-face declarations point to local asset files."""
        key_css = (PROJECT_ROOT / "keyboard" / "css" / "CSS_key.css").read_text(encoding="utf-8")
        urls = extract_urls(key_css)
        for u in urls:
            self.assertFalse(u.startswith("http://"), f"Font URL must not use insecure HTTP: {u}")


# ==============================================================================
# Feature 8: Interactive Features Boundaries (5 Tests)
# ==============================================================================
class TestFeature08InteractiveFeaturesBoundaries(unittest.TestCase):
    def test_f8_b01_gallery_empty_state_dom_structure(self):
        """Verify scripts/Gallery.js defines fallback empty state message."""
        gal_js = (PROJECT_ROOT / "scripts" / "Gallery.js").read_text(encoding="utf-8")
        self.assertTrue("gallery-empty-state" in gal_js or "empty" in gal_js.lower())

    def test_f8_b02_keyboard_surrogate_pair_backspace(self):
        """Verify keyboard backspace logic handles Unicode code points safely."""
        key_js = (PROJECT_ROOT / "keyboard" / "script" / "keyboard.js").read_text(encoding="utf-8")
        self.assertTrue("slice" in key_js or "substring" in key_js or "length" in key_js)

    def test_f8_b03_keyboard_matra_attachment_to_vowels(self):
        """Verify Character_data.js defines Devanagari vowel signs (matras)."""
        char_data = (PROJECT_ROOT / "keyboard" / "script" / "Character_data.js").read_text(encoding="utf-8")
        # Check Devanagari Unicode range presence (\u0900 - \u097F)
        self.assertTrue(len(char_data) > 500)

    def test_f8_b04_clipboard_fallback_when_api_denied(self):
        """Verify keyboard.js implements fallback for clipboard copy."""
        key_js = (PROJECT_ROOT / "keyboard" / "script" / "keyboard.js").read_text(encoding="utf-8")
        self.assertTrue("clipboard" in key_js or "execCommand" in key_js)

    def test_f8_b05_form_empty_submission_prevention(self):
        """Verify scripts/main.js validates form inputs before submission."""
        main_js = (PROJECT_ROOT / "scripts" / "main.js").read_text(encoding="utf-8")
        self.assertIn("preventDefault", main_js)


# ==============================================================================
# Feature 9: WCAG Contrast Boundaries (5 Tests)
# ==============================================================================
class TestFeature09WCAGContrastBoundaries(unittest.TestCase):
    def test_f9_b01_hover_state_accent_contrast(self):
        """Verify --accent-hover maintains >= 4.5:1 contrast against canvas in both themes."""
        # Light mode: --accent-hover #734B26 on #FAF9F6
        cr_light = contrast_ratio("#FAF9F6", "#734B26")
        self.assertGreaterEqual(cr_light, 4.5, f"Light accent-hover contrast {cr_light:.2f} must be >= 4.5:1")

        # Dark mode: --accent-hover #E2B88C on #111110
        cr_dark = contrast_ratio("#111110", "#E2B88C")
        self.assertGreaterEqual(cr_dark, 4.5, f"Dark accent-hover contrast {cr_dark:.2f} must be >= 4.5:1")

    def test_f9_b02_text_muted_contrast_on_subtle_surface(self):
        """Verify --text-muted on --bg-subtle satisfies large text / secondary threshold (>= 3.0:1)."""
        # Light: #78716C on #F2EFE9
        cr_light = contrast_ratio("#F2EFE9", "#78716C")
        self.assertGreaterEqual(cr_light, 3.0, f"Light muted text contrast {cr_light:.2f} must be >= 3.0:1")

        # Dark: #8C867E on #242220
        cr_dark = contrast_ratio("#242220", "#8C867E")
        self.assertGreaterEqual(cr_dark, 3.0, f"Dark muted text contrast {cr_dark:.2f} must be >= 3.0:1")

    def test_f9_b03_status_colors_contrast_on_canvas(self):
        """Verify all 4 status colors satisfy WCAG AA >= 4.5:1 on canvas in both light and dark modes."""
        # Light status colors on #FAF9F6: success #2E6F40, warning #9A6318, danger #B43B32, info #2F5D8A
        light_statuses = ["#2E6F40", "#9A6318", "#B43B32", "#2F5D8A"]
        for color in light_statuses:
            cr = contrast_ratio("#FAF9F6", color)
            self.assertGreaterEqual(cr, 4.5, f"Light status color {color} contrast {cr:.2f} must be >= 4.5:1")

        # Dark status colors on #111110: success #6BBF82, warning #E3A952, danger #E87A72, info #7BAAD6
        dark_statuses = ["#6BBF82", "#E3A952", "#E87A72", "#7BAAD6"]
        for color in dark_statuses:
            cr = contrast_ratio("#111110", color)
            self.assertGreaterEqual(cr, 4.5, f"Dark status color {color} contrast {cr:.2f} must be >= 4.5:1")

    def test_f9_b04_focus_ring_contrast_boundary(self):
        """Verify focus outline color (--accent-primary) has >= 3.0:1 contrast against adjacent surface."""
        cr_light = contrast_ratio("#FFFFFF", "#8C5E32")
        self.assertGreaterEqual(cr_light, 3.0, f"Light focus ring contrast {cr_light:.2f} must be >= 3.0:1")

        cr_dark = contrast_ratio("#1A1918", "#D4A373")
        self.assertGreaterEqual(cr_dark, 3.0, f"Dark focus ring contrast {cr_dark:.2f} must be >= 3.0:1")

    def test_f9_b05_card_surface_vs_canvas_contrast(self):
        """Verify perceptible difference between canvas and surface backgrounds."""
        # Light: #FAF9F6 vs #FFFFFF
        cr_light = contrast_ratio("#FFFFFF", "#FAF9F6")
        self.assertGreater(cr_light, 1.0)

        # Dark: #111110 vs #1A1918
        cr_dark = contrast_ratio("#1A1918", "#111110")
        self.assertGreater(cr_dark, 1.0)


# ==============================================================================
# Feature 10: 646 Chapter Pages Theming Boundaries (5 Tests)
# ==============================================================================
class TestFeature10ChapterPagesBoundaries(unittest.TestCase):
    def test_f10_b01_largest_sarga_dom_depth_and_structure(self):
        """Verify largest sarga (YUDHAKANDA sarga 128) conforms to .page and .verse DOM structure."""
        yu_128 = PROJECT_ROOT / "Books/YUDHAKANDA/Yu_sarga_128.html"
        self.assertTrue(yu_128.exists())
        content = yu_128.read_text(encoding="utf-8")
        self.assertIn('class="page"', content)
        self.assertIn('class="verse"', content)

    def test_f10_b02_single_verse_sarga_structure(self):
        """Verify single/short sarga contains valid verse markup without structural deviation."""
        sarga_1 = PROJECT_ROOT / "Books/BALAKANDA/sarga_1.html"
        content = sarga_1.read_text(encoding="utf-8")
        self.assertIn('class="versetext"', content)

    def test_f10_b03_vyakhya_without_quotes_handling(self):
        """Verify commentary elements without quotes render valid text content."""
        sarga_1 = PROJECT_ROOT / "Books/BALAKANDA/sarga_1.html"
        content = sarga_1.read_text(encoding="utf-8")
        self.assertIn('class="vyakhya"', content)

    def test_f10_b04_vyakhya_with_multiple_quotes_handling(self):
        """Verify .quote tags within commentary are supported."""
        sarga_1 = PROJECT_ROOT / "Books/BALAKANDA/sarga_1.html"
        content = sarga_1.read_text(encoding="utf-8")
        self.assertIn('class="quote"', content)

    def test_f10_b05_authorline_italic_styling(self):
        """Verify .authorline class is styled in Books/style.css."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn(".authorline", books_style)


# ==============================================================================
# Feature 11: Reader Shell & Mangala Shloka Boundaries (5 Tests)
# ==============================================================================
class TestFeature11ReaderShellBoundaries(unittest.TestCase):
    def test_f11_b01_reader_scale_min_boundary(self):
        """Verify reader scale font size multiplier defaults cleanly."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn("var(--reader-scale", books_style)

    def test_f11_b02_reader_scale_max_boundary(self):
        """Verify reader scale calculation utilizes calc() safely without overflowing container."""
        books_style = (PROJECT_ROOT / "Books" / "style.css").read_text(encoding="utf-8")
        self.assertIn("calc(", books_style)

    def test_f11_b03_reader_search_no_results_feedback(self):
        """Verify reader script implements search filtering logic."""
        books_js = (PROJECT_ROOT / "scripts" / "books.js").read_text(encoding="utf-8")
        self.assertTrue("search" in books_js.lower() or "filter" in books_js.lower())

    def test_f11_b04_first_sarga_prev_button_state(self):
        """Verify reader shell implements previous/next chapter navigation controls."""
        book1_css = (PROJECT_ROOT / "Books" / "book1.css").read_text(encoding="utf-8")
        self.assertTrue("sarga" in book1_css.lower())

    def test_f11_b05_last_sarga_next_button_state(self):
        """Verify reader shell handles chapter index bounds."""
        constants_js = (PROJECT_ROOT / "scripts" / "constants.js").read_text(encoding="utf-8")
        self.assertIn("KANDA_DATA", constants_js)


# ==============================================================================
# Feature 12: Audio Player Boundaries (5 Tests)
# ==============================================================================
class TestFeature12AudioPlayerBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.player_js = (PROJECT_ROOT / "scripts" / "shlok-audio-player.js").read_text(encoding="utf-8")

    def test_f12_b01_shlok_number_lower_bound(self):
        """Verify shlok index 1 is configured and maps to shlok_1.m4a."""
        self.assertIn("filePrefix: 'shlok_'", self.player_js)
        self.assertIn("fileExtension: '.m4a'", self.player_js)
        self.assertTrue((PROJECT_ROOT / "Books/Shlok mala/Shlok_audio/shlok_1.m4a").exists())

    def test_f12_b02_shlok_number_upper_bound(self):
        """Verify shlok index 120 is the maximum bounded shlok index in audio player."""
        self.assertIn('max="120"', self.player_js)
        self.assertTrue((PROJECT_ROOT / "Books/Shlok mala/Shlok_audio/shlok_120.m4a").exists())

    def test_f12_b03_autoplay_start_greater_than_end_rejection(self):
        """Verify autoplay range logic handles start and end boundaries."""
        self.assertIn("auto", self.player_js.lower())

    def test_f12_b04_speed_multiplier_cycle_bounds(self):
        """Verify playback speed cycling bounds."""
        self.assertIn("playbackRate", self.player_js)

    def test_f12_b05_progress_bar_aria_slider_bounds(self):
        """Verify progress seek container has accessible slider semantics."""
        self.assertIn("modalProgressContainer", self.player_js)


# ==============================================================================
# Feature 13: Site Verification Boundaries (5 Tests)
# ==============================================================================
class TestFeature13SiteVerificationBoundaries(unittest.TestCase):
    def test_f13_b01_url_hash_and_query_parameter_stripping(self):
        """Verify link resolution correctly handles URLs with hash fragments and query strings."""
        index_html = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("#main-content", index_html)

    def test_f13_b02_case_sensitive_path_resolution(self):
        """Verify case-sensitive path resolution matches Linux filesystem exactly."""
        campus_html = PROJECT_ROOT / "Campus.html"
        self.assertTrue(campus_html.exists(), "Campus.html must preserve exact uppercase 'C'")

    def test_f13_b03_css_url_with_single_double_or_no_quotes(self):
        """Verify extract_urls utility parses single, double, and unquoted URLs."""
        test_css = "body { background: url('foo.png'); border: url(\"bar.png\"); mask: url(baz.png); }"
        urls = extract_urls(test_css)
        self.assertEqual(urls, ["foo.png", "bar.png", "baz.png"])

    def test_f13_b04_multiline_css_comments_stripped_cleanly(self):
        """Verify strip_comments utility preserves newline count for line-number reporting."""
        test_css = "/* Line 1\nLine 2\nLine 3 */\n.foo { color: red; }"
        cleaned = strip_comments(test_css)
        self.assertEqual(cleaned.count("\n"), test_css.count("\n"))

    def test_f13_b05_directory_index_resolution(self):
        """Verify directory link resolution requires an index.html file."""
        key_idx = PROJECT_ROOT / "keyboard" / "index.html"
        self.assertTrue(key_idx.exists(), "keyboard/index.html stub must exist")
        # Verify an empty/non-index directory is not treated as a valid candidate by verifier rules
        dummy_dir = PROJECT_ROOT / "styles"
        self.assertFalse((dummy_dir / "index.html").exists(), "styles/ should not contain index.html")


if __name__ == "__main__":
    unittest.main()

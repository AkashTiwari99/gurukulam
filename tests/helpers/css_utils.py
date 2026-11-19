"""CSS Parser and Token Utilities.

Pure Python 3 standard library bracket-counting parser to extract CSS rules,
nested @media blocks, CSS custom properties (--*), and asset URLs without
external dependencies.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple


def strip_comments(css_text: str) -> str:
    """Strip CSS /* ... */ comments while preserving newline line numbers."""
    return re.sub(
        r"/\*.*?\*/",
        lambda m: "\n" * m.group(0).count("\n"),
        css_text,
        flags=re.DOTALL,
    )


def parse_css_blocks(css_text: str) -> list[tuple[str, str]]:
    """Parse top-level CSS blocks using bracket counting.

    Returns a list of (selector_or_at_rule, body) tuples.
    Preserves inner contents of blocks, including nested blocks within @media.
    """
    cleaned = strip_comments(css_text)
    blocks: list[tuple[str, str]] = []

    selector_buf: list[str] = []
    body_buf: list[str] = []
    depth = 0
    in_single_quote = False
    in_double_quote = False

    i = 0
    n = len(cleaned)
    while i < n:
        c = cleaned[i]

        # Handle string quoting
        if c == '"' and not in_single_quote and (i == 0 or cleaned[i - 1] != "\\"):
            in_double_quote = not in_double_quote
        elif c == "'" and not in_double_quote and (i == 0 or cleaned[i - 1] != "\\"):
            in_single_quote = not in_single_quote

        if not in_single_quote and not in_double_quote:
            if c == "{":
                if depth > 0:
                    body_buf.append(c)
                depth += 1
                i += 1
                continue
            elif c == "}":
                depth -= 1
                if depth == 0:
                    sel = "".join(selector_buf).strip()
                    body = "".join(body_buf).strip()
                    if sel:
                        blocks.append((sel, body))
                    selector_buf = []
                    body_buf = []
                    i += 1
                    continue
                elif depth > 0:
                    body_buf.append(c)
                else:
                    # Unbalanced closing bracket, reset depth to 0
                    depth = 0
                i += 1
                continue

        if depth == 0:
            selector_buf.append(c)
        else:
            body_buf.append(c)

        i += 1

    return blocks


def parse_declarations(body_text: str) -> dict[str, str]:
    """Parse CSS property: value declarations from a block body."""
    declarations: dict[str, str] = {}
    cleaned = strip_comments(body_text)

    # Split by semicolon, respecting strings
    in_single = False
    in_double = False
    cur: list[str] = []

    for i, c in enumerate(cleaned):
        if c == '"' and not in_single and (i == 0 or cleaned[i - 1] != "\\"):
            in_double = not in_double
        elif c == "'" and not in_double and (i == 0 or cleaned[i - 1] != "\\"):
            in_single = not in_single

        if c == ";" and not in_single and not in_double:
            stmt = "".join(cur).strip()
            cur = []
            if ":" in stmt:
                k, v = stmt.split(":", 1)
                k = k.strip()
                v = v.strip()
                declarations[k] = v
        else:
            cur.append(c)

    if cur:
        stmt = "".join(cur).strip()
        if ":" in stmt:
            k, v = stmt.split(":", 1)
            k = k.strip()
            v = v.strip()
            declarations[k] = v

    return declarations


def normalize_selector(selector: str) -> str:
    """Normalize whitespace and quotes in CSS selectors for robust matching."""
    s = re.sub(r"\s+", " ", selector).strip()
    return s


def extract_custom_properties(
    css_text: str, target_selector: str | None = None
) -> dict[str, dict[str, str]]:
    """Extract all CSS custom properties (--*) grouped by selector.

    Handles top-level rules and rules nested inside @media blocks.
    Returns: { normalized_selector: { '--prop-name': 'prop_value', ... } }
    """
    result: dict[str, dict[str, str]] = {}

    def process_block(sel: str, body: str, prefix: str = ""):
        norm_sel = normalize_selector(sel)
        if norm_sel.startswith("@media"):
            # Nested parsing within @media block
            sub_blocks = parse_css_blocks(body)
            for sub_sel, sub_body in sub_blocks:
                process_block(sub_sel, sub_body, prefix=f"{norm_sel} -> ")
        else:
            decls = parse_declarations(body)
            custom_props = {k: v for k, v in decls.items() if k.startswith("--")}
            if custom_props:
                full_sel = f"{prefix}{norm_sel}" if prefix else norm_sel
                if full_sel not in result:
                    result[full_sel] = {}
                result[full_sel].update(custom_props)

                # Index individual comma-separated selectors
                sub_selectors = [normalize_selector(s) for s in norm_sel.split(",") if s.strip()]
                for sub in sub_selectors:
                    sub_key = f"{prefix}{sub}" if prefix else sub
                    if sub_key not in result:
                        result[sub_key] = {}
                    result[sub_key].update(custom_props)

                    # Also store bare sub selector without prefix
                    if prefix:
                        if sub not in result:
                            result[sub] = {}
                        result[sub].update(custom_props)

                # Also store under bare selector without prefix if prefixed
                if prefix and norm_sel not in result:
                    result[norm_sel] = {}
                if prefix:
                    result[norm_sel].update(custom_props)

    for selector, body in parse_css_blocks(css_text):
        process_block(selector, body)

    if target_selector is not None:
        norm_target = normalize_selector(target_selector)
        # Search for exact match or selector appearing within composite selector
        matched: dict[str, str] = {}
        for sel, props in result.items():
            # Check individual selectors if comma-separated
            sub_selectors = [normalize_selector(s) for s in sel.split(",")]
            if norm_target in sub_selectors or norm_target == sel or norm_target in sel:
                matched.update(props)
        return {norm_target: matched}

    return result


def get_property_value(css_text: str, selector: str, prop_name: str) -> str | None:
    """Retrieve the declared value of a CSS property for a given selector.

    Checks top-level rules and @media rules. Returns None if not declared.
    """
    norm_target = normalize_selector(selector)
    for sel, body in parse_css_blocks(css_text):
        norm_sel = normalize_selector(sel)
        if norm_sel.startswith("@media"):
            sub_blocks = parse_css_blocks(body)
            for sub_sel, sub_body in sub_blocks:
                sub_norm = normalize_selector(sub_sel)
                sub_selectors = [normalize_selector(s) for s in sub_norm.split(",")]
                if norm_target in sub_selectors or norm_target == sub_norm:
                    decls = parse_declarations(sub_body)
                    if prop_name in decls:
                        return decls[prop_name]
        else:
            selectors = [normalize_selector(s) for s in norm_sel.split(",")]
            if norm_target in selectors or norm_target == norm_sel:
                decls = parse_declarations(body)
                if prop_name in decls:
                    return decls[prop_name]

    return None


def extract_urls(css_text: str) -> list[str]:
    """Extract all url(...) references in the given CSS text."""
    cleaned = strip_comments(css_text)
    pattern = re.compile(r"""url\s*\(\s*(['"]?)(.*?)\1\s*\)""", re.IGNORECASE)
    urls: list[str] = []
    for match in pattern.finditer(cleaned):
        u = match.group(2).strip()
        if u and not u.startswith("data:"):
            urls.append(u)
    return urls

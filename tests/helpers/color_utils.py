"""WCAG 2.2 AA Color Science and Contrast Utilities.

Pure Python 3 standard library implementation of relative luminance and
contrast ratio formulas as defined by W3C WCAG 2.2 guidelines.
"""
from __future__ import annotations

import math
import re
from typing import Union, Tuple


def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    """Parse a hex color string into an (r, g, b) integer tuple.

    Supports #RGB, #RGBA, #RRGGBB, #RRGGBBAA formats.
    """
    s = hex_str.strip().lstrip("#")
    if len(s) == 3:  # e.g. "FFF"
        return tuple(int(c * 2, 16) for c in s)  # type: ignore
    elif len(s) == 4:  # e.g. "FFF8"
        return tuple(int(c * 2, 16) for c in s[:3])  # type: ignore
    elif len(s) == 6:  # e.g. "FAF9F6"
        return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
    elif len(s) == 8:  # e.g. "FAF9F6FF"
        return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
    else:
        raise ValueError(f"Invalid hex color: {hex_str}")


def parse_rgba(color_str: str) -> tuple[int, int, int, float]:
    """Parse hex, rgb(...), or rgba(...) string into (r, g, b, alpha).

    Alpha defaults to 1.0 if not specified.
    """
    s = color_str.strip()
    if s.startswith("#"):
        s_clean = s.lstrip("#")
        if len(s_clean) == 4:
            r, g, b = hex_to_rgb(s)
            a = int(s_clean[3] * 2, 16) / 255.0
            return (r, g, b, round(a, 4))
        elif len(s_clean) == 8:
            r, g, b = hex_to_rgb(s)
            a = int(s_clean[6:8], 16) / 255.0
            return (r, g, b, round(a, 4))
        rgb = hex_to_rgb(s)
        return (rgb[0], rgb[1], rgb[2], 1.0)

    # Match rgb(...) or rgba(...)
    m = re.match(r"^rgba?\s*\((.+)\)$", s, re.IGNORECASE)
    if not m:
        raise ValueError(f"Unrecognized color string format: {color_str}")

    inner = m.group(1).strip()
    # Support both comma-separated and space-separated syntax
    if "/" in inner:
        # e.g. rgb(250 249 246 / 0.78)
        color_part, alpha_part = inner.split("/", 1)
        parts = color_part.strip().replace(",", " ").split()
        alpha = float(alpha_part.strip().rstrip("%"))
        if "%" in alpha_part:
            alpha /= 100.0
    elif "," in inner:
        parts = [p.strip() for p in inner.split(",")]
        alpha = float(parts[3]) if len(parts) > 3 else 1.0
        parts = parts[:3]
    else:
        parts = inner.split()
        alpha = float(parts[3]) if len(parts) > 3 else 1.0
        parts = parts[:3]

    def parse_chan(val_str: str) -> int:
        val_str = val_str.strip()
        if val_str.endswith("%"):
            return round(float(val_str[:-1]) * 2.55)
        return round(float(val_str))

    r, g, b = parse_chan(parts[0]), parse_chan(parts[1]), parse_chan(parts[2])
    return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), max(0.0, min(1.0, alpha)))


def blend_rgba(fg_rgba: tuple[int, int, int, float], bg_rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    """Alpha blend a foreground RGBA onto an opaque background RGB.

    Returns the resulting opaque (r, g, b).
    """
    fg_r, fg_g, fg_b, a = fg_rgba
    bg_r, bg_g, bg_b = bg_rgb
    r = round(fg_r * a + bg_r * (1.0 - a))
    g = round(fg_g * a + bg_g * (1.0 - a))
    b = round(fg_b * a + bg_b * (1.0 - a))
    return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))


def srgb_luminance(r: int, g: int, b: int) -> float:
    """Calculate WCAG 2.2 relative luminance from 0-255 sRGB integer channels."""
    channels = []
    for c in (r, g, b):
        v = c / 255.0
        if v <= 0.04045:
            cl = v / 12.92
        else:
            cl = math.pow((v + 0.055) / 1.055, 2.4)
        channels.append(cl)

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


ColorInput = Union[str, Tuple[int, int, int], Tuple[int, int, int, float]]


def _resolve_to_rgb(color: ColorInput, default_bg: tuple[int, int, int] = (255, 255, 255)) -> tuple[int, int, int]:
    """Helper to convert any color input into an opaque (r, g, b) tuple."""
    if isinstance(color, tuple):
        if len(color) == 3:
            return color  # type: ignore
        elif len(color) == 4:
            return blend_rgba(color, default_bg)  # type: ignore
        raise ValueError(f"Invalid tuple color length: {len(color)}")

    # color is string
    rgba = parse_rgba(color)
    if rgba[3] < 1.0:
        return blend_rgba(rgba, default_bg)
    return (rgba[0], rgba[1], rgba[2])


def contrast_ratio(color1: ColorInput, color2: ColorInput, ambient_bg: tuple[int, int, int] | None = None) -> float:
    """Calculate WCAG 2.2 contrast ratio between two colors: (L1 + 0.05) / (L2 + 0.05).

    Returns a float >= 1.0 (e.g. 16.35).
    """
    bg = ambient_bg or (255, 255, 255)
    rgb1 = _resolve_to_rgb(color1, default_bg=bg)
    rgb2 = _resolve_to_rgb(color2, default_bg=bg)

    l1 = srgb_luminance(*rgb1)
    l2 = srgb_luminance(*rgb2)

    l_max = max(l1, l2)
    l_min = min(l1, l2)

    return (l_max + 0.05) / (l_min + 0.05)


def is_wcag_aa(color1: ColorInput, color2: ColorInput, large_text: bool = False, ambient_bg: tuple[int, int, int] | None = None) -> bool:
    """Check if the contrast ratio between color1 and color2 satisfies WCAG 2.2 AA.

    - Normal text: >= 4.5:1
    - Large text (>= 18pt or >= 14pt bold): >= 3.0:1
    """
    threshold = 3.0 if large_text else 4.5
    cr = contrast_ratio(color1, color2, ambient_bg=ambient_bg)
    return cr >= threshold

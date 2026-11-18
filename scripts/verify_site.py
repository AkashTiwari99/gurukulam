#!/usr/bin/env python3
"""Lightweight zero-dependency link and markup smoke verifier for the static site."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent

SKIP_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:", "blob:", "#")
CSS_URL_RE = re.compile(r"""url\(\s*(?:(['"])(.*?)\1|([^)'"\s]+))\s*\)""", re.IGNORECASE)
GURUKULAM_PATH_RE = re.compile(r"/gurukulam/", re.IGNORECASE)
BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
LINE_COMMENT_RE = re.compile(r"(^|[^:\\])//[^\n]*")


def collect_files():
    html_files = []
    html_files.extend(sorted(ROOT.glob("*.html")))
    html_files.extend(sorted((ROOT / "Gallery").glob("*.html")))
    html_files.extend(sorted((ROOT / "keyboard").glob("*.html")))
    books_dir = ROOT / "Books"
    if books_dir.is_dir():
        for subdir in sorted(p for p in books_dir.iterdir() if p.is_dir()):
            html_files.extend(sorted(subdir.glob("*.html")))

    css_files = []
    css_files.extend(sorted((ROOT / "styles").glob("*.css")))
    css_files.extend(sorted((ROOT / "keyboard" / "css").glob("*.css")))
    css_files.extend(sorted((ROOT / "Books").glob("*.css")))

    js_files = []
    js_files.extend(sorted((ROOT / "scripts").glob("*.js")))
    js_files.extend(sorted((ROOT / "keyboard" / "script").glob("*.js")))

    return html_files, css_files, js_files


def should_skip_ref(ref: str) -> bool:
    stripped = ref.strip()
    if not stripped:
        return True
    lower = stripped.lower()
    return any(lower.startswith(prefix) for prefix in SKIP_PREFIXES)


def resolve_ref(source_file: Path, ref: str) -> Path | None:
    clean = ref.strip()
    if should_skip_ref(clean):
        return None
    clean = clean.split("#", 1)[0].split("?", 1)[0].strip()
    if not clean:
        return None
    decoded = unquote(clean)
    if decoded.startswith("/"):
        candidate = (ROOT / decoded.lstrip("/")).resolve()
    else:
        candidate = (source_file.parent / decoded).resolve()
    return candidate


def target_exists(candidate: Path) -> bool:
    if candidate.is_file():
        return True
    if candidate.is_dir() and (candidate / "index.html").is_file():
        return True
    return False


class SiteHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []  # (line, tag, attr, value)
        self.textsheet_lines = []

    def handle_starttag(self, tag, attrs):
        tag_l = tag.lower()
        attr_map = {k.lower(): (v or "") for k, v in attrs}
        line, _ = self.getpos()

        if tag_l == "link" and attr_map.get("rel", "").strip().lower() == "textsheet":
            self.textsheet_lines.append(line)

        if tag_l == "a" and "href" in attr_map:
            self.refs.append((line, tag_l, "href", attr_map["href"]))
        elif tag_l == "img" and "src" in attr_map:
            self.refs.append((line, tag_l, "src", attr_map["src"]))
        elif tag_l == "source":
            if "srcset" in attr_map:
                for part in attr_map["srcset"].split(","):
                    url_part = part.strip().split()[0] if part.strip() else ""
                    if url_part:
                        self.refs.append((line, tag_l, "srcset", url_part))
            if "src" in attr_map:
                self.refs.append((line, tag_l, "src", attr_map["src"]))
        elif tag_l == "link" and "href" in attr_map:
            self.refs.append((line, tag_l, "href", attr_map["href"]))
        elif tag_l == "script" and "src" in attr_map:
            self.refs.append((line, tag_l, "src", attr_map["src"]))


def line_number_for_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def strip_comments_preserve_newlines(text: str, is_js: bool) -> str:
    def _blank(match: re.Match) -> str:
        return "\n" * match.group(0).count("\n")

    cleaned = BLOCK_COMMENT_RE.sub(_blank, text)
    if is_js:
        cleaned = LINE_COMMENT_RE.sub(lambda m: m.group(1), cleaned)
    return cleaned


def main() -> int:
    violations = []

    # d) Untracked ponytail/ directory must not exist in repo root
    if (ROOT / "ponytail").exists():
        violations.append("ponytail/:1 forbidden directory exists in repo root")

    html_files, css_files, js_files = collect_files()

    for path in html_files:
        rel_path = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8", errors="replace")

        parser = SiteHTMLParser()
        parser.feed(text)

        for line in parser.textsheet_lines:
            violations.append(f'{rel_path}:{line} forbidden <link rel="Textsheet"> tag')

        for line, tag, attr, value in parser.refs:
            candidate = resolve_ref(path, value)
            if candidate is not None and not target_exists(candidate):
                violations.append(
                    f"{rel_path}:{line} broken <{tag} {attr}=\"{value}\"> -> {candidate}"
                )

        # Inline CSS url(...) inside <style> tags or style attributes
        for match in CSS_URL_RE.finditer(text):
            ref = match.group(2) if match.group(2) is not None else match.group(3)
            candidate = resolve_ref(path, ref)
            if candidate is not None and not target_exists(candidate):
                line = line_number_for_offset(text, match.start())
                violations.append(f"{rel_path}:{line} broken inline CSS url({ref}) -> {candidate}")

        for match in GURUKULAM_PATH_RE.finditer(text):
            line = line_number_for_offset(text, match.start())
            violations.append(f"{rel_path}:{line} hardcoded /gurukulam/ path")

    for path in css_files:
        rel_path = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8", errors="replace")
        cleaned = strip_comments_preserve_newlines(text, is_js=False)

        for match in CSS_URL_RE.finditer(cleaned):
            ref = match.group(2) if match.group(2) is not None else match.group(3)
            candidate = resolve_ref(path, ref)
            if candidate is not None and not target_exists(candidate):
                line = line_number_for_offset(cleaned, match.start())
                violations.append(f"{rel_path}:{line} broken CSS url({ref}) -> {candidate}")

        for match in GURUKULAM_PATH_RE.finditer(cleaned):
            line = line_number_for_offset(cleaned, match.start())
            violations.append(f"{rel_path}:{line} hardcoded /gurukulam/ path")

    for path in js_files:
        rel_path = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8", errors="replace")
        cleaned = strip_comments_preserve_newlines(text, is_js=True)

        for match in GURUKULAM_PATH_RE.finditer(cleaned):
            line = line_number_for_offset(cleaned, match.start())
            violations.append(f"{rel_path}:{line} hardcoded /gurukulam/ path")

    summary = f"scanned {len(html_files)} HTML, {len(css_files)} CSS, and {len(js_files)} JS files"
    if violations:
        print(f"FAIL ({summary}): {len(violations)} violation(s) found:")
        for v in violations:
            print(f"  - {v}")
        return 1

    print(f"PASS ({summary}): 0 violations.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

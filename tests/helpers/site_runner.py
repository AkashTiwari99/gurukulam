"""Site Runner Utility.

Subprocess wrapper executing `python3 scripts/verify_site.py` to audit link integrity,
forbidden tokens, and repository structure in an opaque-box manner.
"""
from __future__ import annotations

from pathlib import Path
import re
import subprocess
import sys


def get_project_root() -> Path:
    """Return the Gurukulam project root directory."""
    # Assuming tests/helpers/site_runner.py -> project root is 2 levels up
    return Path(__file__).resolve().parent.parent.parent


def run_verify_site(root_path: Path | str | None = None) -> tuple[int, str]:
    """Execute python3 scripts/verify_site.py in a subprocess.

    Returns: (returncode, combined_stdout_and_stderr)
    """
    root = Path(root_path) if root_path else get_project_root()
    script_path = root / "scripts" / "verify_site.py"

    if not script_path.exists():
        raise FileNotFoundError(f"Verification script not found at {script_path}")

    proc = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=str(root),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    return proc.returncode, proc.stdout


def parse_verification_output(output: str) -> dict[str, int | str]:
    """Parse output from scripts/verify_site.py.

    Matches e.g.:
    "PASS (scanned 668 HTML, 17 CSS, and 7 JS files): 0 violations."
    or
    "FAIL (scanned 668 HTML, 17 CSS, and 7 JS files): 2 violations."
    """
    res: dict[str, int | str] = {
        "status": "UNKNOWN",
        "html_count": 0,
        "css_count": 0,
        "js_count": 0,
        "violations": -1,
    }

    # Match summary line
    m = re.search(
        r"(PASS|FAIL)\s*\(\s*scanned\s+(\d+)\s+HTML,\s+(\d+)\s+CSS,\s+and\s+(\d+)\s+JS\s+files\s*\):\s*(\d+)\s+violations",
        output,
        re.IGNORECASE,
    )
    if m:
        res["status"] = m.group(1).upper()
        res["html_count"] = int(m.group(2))
        res["css_count"] = int(m.group(3))
        res["js_count"] = int(m.group(4))
        res["violations"] = int(m.group(5))

    return res

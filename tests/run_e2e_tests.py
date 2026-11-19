#!/usr/bin/env python3
"""Main Entry Point Runner for Gurukulam E2E Test Suite.

Usage:
    python3 tests/run_e2e_tests.py [OPTIONS]

Options:
    --tier TIER         Comma-separated list of tiers to run (e.g. 1, 2, 3, 4, or all) [default: all]
    -v, --verbose       Enable verbose test output (verbosity=2)
    --json-report PATH  Save JSON test summary report to specified path
    -h, --help          Show this help message and exit
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import time
import unittest


def get_test_dir() -> Path:
    """Return the absolute path to the tests/ directory."""
    return Path(__file__).resolve().parent


def load_tier_suite(loader: unittest.TestLoader, tier: int) -> unittest.TestSuite:
    """Load the test suite for a specific tier."""
    test_dir = get_test_dir()
    if str(test_dir.parent) not in sys.path:
        sys.path.insert(0, str(test_dir.parent))

    module_map = {
        1: "tests.test_tier1_features",
        2: "tests.test_tier2_boundaries",
        3: "tests.test_tier3_combinations",
        4: "tests.test_tier4_scenarios",
    }

    if tier not in module_map:
        raise ValueError(f"Unknown tier: {tier}. Expected 1, 2, 3, or 4.")

    mod_name = module_map[tier]
    return loader.loadTestsFromName(mod_name)


class JSONTestResult(unittest.TextTestResult):
    """Custom TestResult that captures test execution statistics."""

    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self.successes: list[unittest.TestCase] = []

    def addSuccess(self, test: unittest.TestCase):
        super().addSuccess(test)
        self.successes.append(test)


def main():
    parser = argparse.ArgumentParser(
        description="Gurukulam E2E 4-Tier Test Runner (Zero-Dependency Python Standard Library)"
    )
    parser.add_argument(
        "--tier",
        type=str,
        default="all",
        help="Comma-separated list of tiers to run: 1, 2, 3, 4, or all (default: all)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose test output",
    )
    parser.add_argument(
        "--json-report",
        type=str,
        default=None,
        metavar="PATH",
        help="Save machine-readable JSON test summary report to specified path",
    )

    args = parser.parse_args()

    # Parse requested tiers
    if args.tier.lower() == "all":
        tiers_to_run = [1, 2, 3, 4]
    else:
        try:
            tiers_to_run = [int(t.strip()) for t in args.tier.split(",") if t.strip()]
        except ValueError:
            print(f"Error: Invalid tier specification '{args.tier}'. Use e.g. 1 or 1,2 or all.", file=sys.stderr)
            sys.exit(1)

    loader = unittest.TestLoader()
    master_suite = unittest.TestSuite()

    for t in tiers_to_run:
        suite = load_tier_suite(loader, t)
        master_suite.addTest(suite)

    verbosity = 2 if args.verbose else 1

    print("=" * 70)
    print("GURUKULAM E2E TEST RUNNER")
    print(f"Executing Tiers: {tiers_to_run}")
    print(f"Total Test Cases Queued: {master_suite.countTestCases()}")
    print("=" * 70)

    start_time = time.time()
    runner = unittest.TextTestRunner(
        verbosity=verbosity,
        resultclass=JSONTestResult,
    )
    result = runner.run(master_suite)
    duration = time.time() - start_time

    total_run = result.testsRun
    failed_count = len(result.failures)
    error_count = len(result.errors)
    skipped_count = len(result.skipped)
    passed_count = total_run - failed_count - error_count - skipped_count
    is_success = result.wasSuccessful()

    # Generate JSON report if requested
    if args.json_report:
        report_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tiers_run": tiers_to_run,
            "total_tests": total_run,
            "passed": passed_count,
            "failed": failed_count,
            "errors": error_count,
            "skipped": skipped_count,
            "duration_seconds": round(duration, 3),
            "status": "PASS" if is_success else "FAIL",
            "failures": [
                {
                    "test": str(test),
                    "message": err.splitlines()[-1] if err else "",
                    "traceback": err,
                }
                for test, err in result.failures
            ],
            "errors_detail": [
                {
                    "test": str(test),
                    "message": err.splitlines()[-1] if err else "",
                    "traceback": err,
                }
                for test, err in result.errors
            ],
            "skipped_detail": [
                {
                    "test": str(test),
                    "reason": reason,
                }
                for test, reason in result.skipped
            ],
        }

        report_path = Path(args.json_report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        print(f"\nJSON report written to: {report_path.resolve()}")

    print("\n" + "=" * 70)
    print(
        f"TEST SUMMARY: Total={total_run} | Passed={passed_count} | Failed={failed_count} | Errors={error_count} | Skipped={skipped_count} | Duration={duration:.2f}s"
    )
    print(f"OVERALL STATUS: {'PASS' if is_success else 'FAIL'}")
    print("=" * 70)

    sys.exit(0 if is_success else 1)


if __name__ == "__main__":
    main()

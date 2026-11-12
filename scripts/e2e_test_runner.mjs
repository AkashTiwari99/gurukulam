#!/usr/bin/env node
/**
 * Gurukulam Opaque-Box E2E Test Runner (Native ESM Engine)
 * Zero-dependency, requirement-driven test execution engine.
 * Usage: node scripts/e2e_test_runner.mjs [--all] [--tier 1|2|3|4] [--dry-run] [--base-url <url>]
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

// ---------------------------------------------------------
// 1. CLI Argument Parsing
// ---------------------------------------------------------
function parseArgs(args) {
  const options = {
    all: false,
    tier: null,
    dryRun: false,
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    dataDir: process.env.E2E_DATA_DIR || path.resolve(process.cwd(), 'data'),
    timeout: 10000,
    filter: '',
    bail: false,
    output: path.resolve(process.cwd(), 'tests', 'e2e_report.json'),
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--tier') {
      options.tier = args[++i];
    } else if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--base-url' || arg === '--url') {
      options.baseUrl = args[++i];
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg.startsWith('--url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg === '--data-dir') {
      options.dataDir = path.resolve(args[++i]);
    } else if (arg.startsWith('--data-dir=')) {
      options.dataDir = path.resolve(arg.split('=')[1]);
    } else if (arg === '--timeout') {
      options.timeout = parseInt(args[++i], 10);
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--filter') {
      options.filter = args[++i];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--bail' || arg === '-b') {
      options.bail = true;
    } else if (arg === '--output' || arg === '-o') {
      options.output = path.resolve(args[++i]);
    } else if (arg.startsWith('--output=') || arg.startsWith('-o=')) {
      options.output = path.resolve(arg.split('=')[1]);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  // If neither --all nor --tier is specified, default to --all
  if (!options.all && !options.tier) {
    options.all = true;
  }

  return options;
}

// ---------------------------------------------------------
// 2. Test Discovery
// ---------------------------------------------------------
const TIER_FILE_CONFIG = {
  1: 'tier1_features',
  2: 'tier2_boundaries',
  3: 'tier3_combinations',
  4: 'tier4_scenarios',
};

function resolveTierFilePath(tierNum) {
  const baseName = TIER_FILE_CONFIG[tierNum];
  if (!baseName) return null;
  const e2eDir = path.resolve(process.cwd(), 'tests', 'e2e');
  const mjsPath = path.resolve(e2eDir, `${baseName}.mjs`);
  if (fs.existsSync(mjsPath)) return mjsPath;
  const jsPath = path.resolve(e2eDir, `${baseName}.js`);
  if (fs.existsSync(jsPath)) return jsPath;
  return null;
}

async function loadTestCases(selectedTiers) {
  const loadedTests = [];
  const seenIds = new Set();

  for (const tierNum of selectedTiers) {
    const filePath = resolveTierFilePath(tierNum);
    if (!filePath) {
      console.warn(`[WARN] Test suite file for Tier ${tierNum} not found in tests/e2e/`);
      continue;
    }

    const fileUrl = pathToFileURL(filePath).href;
    let module;
    try {
      module = await import(fileUrl);
    } catch (err) {
      console.error(`[FATAL] Failed to import test suite ${filePath}:`, err);
      throw err;
    }

    const tests = module.default || module.tests || module;
    if (!Array.isArray(tests)) {
      throw new Error(`Test suite ${filePath} must export an array of test definitions as default export.`);
    }

    for (const t of tests) {
      if (seenIds.has(t.id)) {
        console.warn(`[WARN] Duplicate test ID detected: "${t.id}"`);
      }
      seenIds.add(t.id);
      loadedTests.push({ ...t, tier: t.tier || tierNum });
    }
  }

  return loadedTests;
}

// ---------------------------------------------------------
// 3. Test Context Builder
// ---------------------------------------------------------
function createTestContext(opts, testCase) {
  const timeoutMs = testCase.timeout || opts.timeout;

  // Enriched assertions
  const customAssert = Object.assign({}, assert, {
    status: (res, expectedStatus, msg) => {
      assert.strictEqual(
        res.status,
        expectedStatus,
        msg || `Expected HTTP status ${expectedStatus}, but got ${res.status}`
      );
    },
    htmlContains: (html, pattern, msg) => {
      if (typeof pattern === 'string') {
        assert.ok(
          html.includes(pattern),
          msg || `Expected HTML to contain string: "${pattern}"`
        );
      } else if (pattern instanceof RegExp) {
        assert.match(
          html,
          pattern,
          msg || `Expected HTML to match regex: ${pattern}`
        );
      }
    },
    header: (res, name, expectedValOrRegex, msg) => {
      const val = res.headers && typeof res.headers.get === 'function'
        ? res.headers.get(name)
        : (res.headers ? res.headers[name.toLowerCase()] : null);
      assert.ok(val !== null && val !== undefined, msg || `Missing header: "${name}"`);
      if (typeof expectedValOrRegex === 'string') {
        assert.ok(
          val.includes(expectedValOrRegex),
          msg || `Header "${name}" (${val}) does not contain "${expectedValOrRegex}"`
        );
      } else if (expectedValOrRegex instanceof RegExp) {
        assert.match(val, expectedValOrRegex, msg);
      }
    },
    jsonField: (json, fieldPath, expected, msg) => {
      const parts = fieldPath.split('.');
      let current = json;
      for (const part of parts) {
        assert.ok(
          current !== null && current !== undefined && part in current,
          msg || `Field "${fieldPath}" missing at "${part}"`
        );
        current = current[part];
      }
      if (expected !== undefined) {
        assert.deepStrictEqual(current, expected, msg);
      }
    },
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const readDataFile = async (filename) => {
    const fullPath = path.resolve(opts.dataDir, filename);
    return fs.promises.readFile(fullPath, 'utf8');
  };

  const request = async (pathOrUrl, init = {}) => {
    if (opts.dryRun) {
      return new Response('{"dryRun":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    const targetUrl = pathOrUrl.startsWith('http')
      ? pathOrUrl
      : `${opts.baseUrl.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  };

  const get = async (pathOrUrl, options = {}) => {
    const res = await request(pathOrUrl, { method: 'GET', ...options });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      text,
      json,
    };
  };

  const post = async (pathOrUrl, body, options = {}) => {
    const headers = { 'content-type': 'application/json', ...(options.headers || {}) };
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const res = await request(pathOrUrl, {
      method: 'POST',
      headers,
      body: payload,
      ...options,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      text,
      json,
    };
  };

  return {
    baseUrl: opts.baseUrl,
    dataDir: opts.dataDir,
    dryRun: opts.dryRun,
    verbose: opts.verbose,
    sleep,
    readDataFile,
    request,
    get,
    post,
    assert: customAssert,
    log: (...args) => {
      if (opts.verbose) console.log(`    [LOG]`, ...args);
    },
  };
}

// ---------------------------------------------------------
// 4. Test Runner Engine
// ---------------------------------------------------------
async function run() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(`
Gurukulam Opaque-Box E2E Test Runner
Usage: node scripts/e2e_test_runner.mjs [options]

Options:
  --all                 Execute all test tiers (1-4) [default]
  --tier <1|2|3|4>      Execute a single tier or comma-separated tiers (e.g. --tier 1,2)
  --dry-run             Validate test definitions without making HTTP requests
  --base-url <url>      Target base URL (default: http://localhost:3000, env: E2E_BASE_URL)
  --data-dir <path>     XML content directory (default: data/, env: E2E_DATA_DIR)
  --timeout <ms>        Timeout per test in milliseconds (default: 10000ms)
  --filter <pattern>    Filter tests by name or ID (regex or substring)
  --bail, -b            Stop execution immediately upon first test failure
  --output, -o <path>   JSON report output file path (default: tests/e2e_report.json)
  --verbose, -v         Enable detailed logging of requests and stack traces
  --help, -h            Show this help documentation
`);
    process.exit(0);
  }

  // Determine tiers to execute
  let selectedTiers = [1, 2, 3, 4];
  if (opts.tier) {
    selectedTiers = String(opts.tier)
      .split(',')
      .map((t) => parseInt(t.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 4);
    if (selectedTiers.length === 0) {
      console.error(`[ERROR] Invalid tier specified: "${opts.tier}". Must be 1, 2, 3, or 4.`);
      process.exit(1);
    }
  }

  console.log(`========================================================`);
  console.log(` Gurukulam Opaque-Box E2E Test Runner`);
  console.log(` Base URL  : ${opts.baseUrl}`);
  console.log(` Data Dir  : ${opts.dataDir}`);
  console.log(` Tiers     : ${selectedTiers.join(', ')}`);
  console.log(` Mode      : ${opts.dryRun ? 'DRY-RUN (verification only)' : 'LIVE EXECUTION'}`);
  console.log(`========================================================\n`);

  // Load tests
  const allTests = await loadTestCases(selectedTiers);
  let testsToRun = allTests;

  if (opts.filter) {
    const regex = new RegExp(opts.filter, 'i');
    testsToRun = allTests.filter((t) => regex.test(t.name) || regex.test(t.id || ''));
  }

  console.log(`Discovered ${testsToRun.length} test case(s) to execute.\n`);

  const results = [];
  const tierSummary = {
    tier1: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    tier2: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    tier3: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    tier4: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
  };

  const suiteStart = performance.now();

  for (let idx = 0; idx < testsToRun.length; idx++) {
    const test = testsToRun[idx];
    const tierKey = `tier${test.tier || 1}`;
    if (!tierSummary[tierKey]) {
      tierSummary[tierKey] = { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 };
    }
    tierSummary[tierKey].total++;

    const testId = test.id || `T${test.tier || 1}-${idx + 1}`;
    const testHeader = `[${testId}] [Tier ${test.tier}] ${test.feature || 'General'} -> ${test.name}`;

    if (test.skip) {
      console.log(`  [SKIP] ${testHeader}`);
      tierSummary[tierKey].skipped++;
      results.push({
        id: testId,
        tier: test.tier,
        feature: test.feature,
        name: test.name,
        status: 'SKIP',
        durationMs: 0,
        error: null,
      });
      continue;
    }

    if (opts.dryRun) {
      // Comprehensive structural validation in dry-run mode
      const validationErrors = [];
      if (!test.id || typeof test.id !== 'string') {
        validationErrors.push('Missing or invalid test "id" property');
      }
      if (!test.name || typeof test.name !== 'string') {
        validationErrors.push('Missing or invalid test "name" property');
      }
      if (!test.tier || test.tier < 1 || test.tier > 4) {
        validationErrors.push(`Invalid test "tier": ${test.tier} (must be 1, 2, 3, or 4)`);
      }
      if (!test.feature || typeof test.feature !== 'string') {
        validationErrors.push('Missing or invalid test "feature" property');
      }
      if (typeof test.run !== 'function') {
        validationErrors.push('Test case does not provide a callable run(ctx) function');
      }

      if (validationErrors.length > 0) {
        const errorMsg = validationErrors.join('; ');
        console.log(`  [FAIL] ${testHeader}`);
        console.log(`         Error: ${errorMsg}`);
        tierSummary[tierKey].failed++;
        results.push({
          id: testId,
          tier: test.tier,
          feature: test.feature,
          name: test.name,
          status: 'FAIL',
          durationMs: 0,
          error: errorMsg,
        });

        if (opts.bail) {
          console.log(`\n[BAIL] Aborting verification due to structural validation failure (--bail enabled).`);
          break;
        }
      } else {
        console.log(`  [VERIFIED] ${testHeader}`);
        tierSummary[tierKey].passed++;
        results.push({
          id: testId,
          tier: test.tier,
          feature: test.feature,
          name: test.name,
          status: 'PASS',
          durationMs: 0,
          error: null,
        });
      }
      continue;
    }

    // Live Execution
    const ctx = createTestContext(opts, test);
    const start = performance.now();
    let status = 'PASS';
    let errorMessage = null;

    try {
      await test.run(ctx);
      const durationMs = Math.round(performance.now() - start);
      tierSummary[tierKey].passed++;
      tierSummary[tierKey].durationMs += durationMs;
      console.log(`  [PASS] ${testHeader} (${durationMs}ms)`);
      results.push({
        id: testId,
        tier: test.tier,
        feature: test.feature,
        name: test.name,
        status: 'PASS',
        durationMs,
        error: null,
      });
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      status = 'FAIL';
      errorMessage = err.message || String(err);
      tierSummary[tierKey].failed++;
      tierSummary[tierKey].durationMs += durationMs;
      console.error(`  [FAIL] ${testHeader} (${durationMs}ms)`);
      console.error(`         Error: ${errorMessage}`);
      if (opts.verbose && err.stack) {
        console.error(`         ${err.stack.split('\n').slice(1, 4).join('\n         ')}`);
      }
      results.push({
        id: testId,
        tier: test.tier,
        feature: test.feature,
        name: test.name,
        status: 'FAIL',
        durationMs,
        error: errorMessage,
      });

      if (opts.bail) {
        console.log(`\n[BAIL] Aborting further execution due to test failure (--bail enabled).`);
        break;
      }
    }
  }

  const totalDurationMs = Math.round(performance.now() - suiteStart);
  const totalPassed = Object.values(tierSummary).reduce((acc, t) => acc + t.passed, 0);
  const totalFailed = Object.values(tierSummary).reduce((acc, t) => acc + t.failed, 0);
  const totalSkipped = Object.values(tierSummary).reduce((acc, t) => acc + t.skipped, 0);
  const totalCount = testsToRun.length;
  const passRate = totalCount > 0 ? ((totalPassed / totalCount) * 100).toFixed(1) + '%' : '0.0%';

  console.log(`\n========================================================`);
  console.log(` Execution Summary`);
  console.log(`========================================================`);
  console.log(` Total Tests : ${totalCount}`);
  console.log(` Passed      : ${totalPassed}`);
  console.log(` Failed      : ${totalFailed}`);
  console.log(` Skipped     : ${totalSkipped}`);
  console.log(` Pass Rate   : ${passRate}`);
  console.log(` Total Time  : ${totalDurationMs}ms\n`);

  for (const [tier, data] of Object.entries(tierSummary)) {
    if (data.total > 0) {
      console.log(`   ${tier.toUpperCase().padEnd(8)}: ${data.passed}/${data.total} passed (${data.durationMs}ms)`);
    }
  }

  // Assemble JSON Report
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      baseUrl: opts.baseUrl,
      dataDir: opts.dataDir,
      dryRun: opts.dryRun,
      executionTime: new Date().toISOString(),
    },
    summary: {
      total: totalCount,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      durationMs: totalDurationMs,
      passRate,
      tierSummary,
    },
    results,
  };

  // Ensure output directory exists and write report
  const outputDir = path.dirname(opts.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(opts.output, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nSaved test report to: ${opts.output}`);

  // Exit code semantics: 0 on 100% pass, 1 on any failure
  const exitCode = totalFailed === 0 ? 0 : 1;
  process.exit(exitCode);
}

run().catch((err) => {
  console.error(`[FATAL] Unhandled runner error:`, err);
  process.exit(1);
});

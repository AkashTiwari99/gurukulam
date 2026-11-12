#!/usr/bin/env node
/**
 * Gurukulam E2E Test Runner Forwarder
 * Seamless bridge enabling `node scripts/e2e_test_runner.js` to execute
 * the native ES module engine in any CommonJS or ESM Node environment.
 */
import('./e2e_test_runner.mjs');

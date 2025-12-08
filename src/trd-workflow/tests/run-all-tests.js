#!/usr/bin/env node
/**
 * Test runner for TRD Workflow module
 * Runs all unit tests and generates coverage report
 *
 * @module run-all-tests
 * @related TRD-WORKFLOW-001, TASK-032
 */

import { run } from 'node:test';
import { spec as SpecReporter } from 'node:test/reporters';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Find all test files in the tests directory
 */
function findTestFiles() {
  const testFiles = [];
  const files = readdirSync(__dirname);

  for (const file of files) {
    if (file.endsWith('.test.js')) {
      const filePath = join(__dirname, file);
      testFiles.push(filePath);
    }
  }

  return testFiles.sort();
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Print test summary
 */
function printSummary(stats) {
  console.log('\n' + colors.bright + '━'.repeat(80) + colors.reset);
  console.log(colors.bright + '  TEST SUMMARY' + colors.reset);
  console.log(colors.bright + '━'.repeat(80) + colors.reset);

  const totalTests = stats.passed + stats.failed + stats.skipped;
  const passRate = totalTests > 0 ? ((stats.passed / totalTests) * 100).toFixed(1) : 0;

  console.log(`  ${colors.cyan}Total Tests:${colors.reset}     ${totalTests}`);
  console.log(`  ${colors.green}Passed:${colors.reset}          ${stats.passed} (${passRate}%)`);

  if (stats.failed > 0) {
    console.log(`  ${colors.red}Failed:${colors.reset}          ${stats.failed}`);
  }

  if (stats.skipped > 0) {
    console.log(`  ${colors.yellow}Skipped:${colors.reset}         ${stats.skipped}`);
  }

  console.log(`  ${colors.cyan}Duration:${colors.reset}        ${formatDuration(stats.duration)}`);
  console.log(`  ${colors.cyan}Test Suites:${colors.reset}     ${stats.suites}`);

  console.log(colors.bright + '━'.repeat(80) + colors.reset + '\n');

  if (stats.failed === 0) {
    console.log(colors.green + colors.bright + '✓ All tests passed!' + colors.reset + '\n');
  } else {
    console.log(colors.red + colors.bright + '✗ Some tests failed' + colors.reset + '\n');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(colors.bright + '\n🧪 Running TRD Workflow Tests\n' + colors.reset);

  const testFiles = findTestFiles();

  if (testFiles.length === 0) {
    console.log(colors.yellow + '⚠ No test files found' + colors.reset);
    process.exit(1);
  }

  console.log(colors.cyan + `Found ${testFiles.length} test suites:\n` + colors.reset);
  testFiles.forEach((file, i) => {
    const fileName = file.split('/').pop();
    console.log(colors.gray + `  ${i + 1}. ${fileName}` + colors.reset);
  });
  console.log('');

  const stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    suites: testFiles.length,
    duration: 0
  };

  const startTime = performance.now();

  try {
    // Run tests with spec reporter
    const stream = run({
      files: testFiles,
      concurrency: true,
      timeout: 30000  // 30 second timeout per test
    });

    // Pipe to spec reporter for formatted output
    stream.compose(new SpecReporter()).pipe(process.stdout);

    // Collect test results
    for await (const event of stream) {
      if (event.type === 'test:pass') {
        stats.passed++;
      } else if (event.type === 'test:fail') {
        stats.failed++;
      } else if (event.type === 'test:skip') {
        stats.skipped++;
      }
    }

    const endTime = performance.now();
    stats.duration = endTime - startTime;

    // Print summary
    printSummary(stats);

    // Exit with appropriate code
    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(colors.red + '\n✗ Test execution failed:' + colors.reset);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colors.bright}TRD Workflow Test Runner${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node run-all-tests.js [options]

${colors.cyan}Options:${colors.reset}
  --help, -h     Show this help message
  --verbose, -v  Enable verbose output
  --watch, -w    Watch mode (not implemented)

${colors.cyan}Examples:${colors.reset}
  node run-all-tests.js                 Run all tests
  node run-all-tests.js --verbose       Run with verbose output

${colors.cyan}Test Files:${colors.reset}
  - checkpoint-injector.test.js         Checkpoint injection logic
  - workflow-generator.test.js          Workflow section generation
  - task-type-detector.test.js          Task type detection
  - template-rendering.test.js          Template rendering
  - metadata-parsing.test.js            Metadata parsing & config

${colors.cyan}Coverage Targets:${colors.reset}
  - Checkpoint Injector:   ≥95%
  - Workflow Generator:    ≥90%
  - Task Type Detector:    ≥90%
  - Template Rendering:    ≥85%
  - Metadata Parsing:      ≥90%

${colors.cyan}Related:${colors.reset}
  TRD-WORKFLOW-001, Phase 3, Sprint 3.1
  Tasks: TASK-027 through TASK-031
`);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

if (args.includes('--verbose') || args.includes('-v')) {
  console.log(colors.cyan + 'Verbose mode enabled\n' + colors.reset);
}

// Run tests
runTests().catch(error => {
  console.error(colors.red + '\n✗ Fatal error:' + colors.reset);
  console.error(error);
  process.exit(1);
});

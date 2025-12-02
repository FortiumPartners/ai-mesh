#!/usr/bin/env node

/**
 * Integration Test Runner
 *
 * Runs all integration tests for TRD Workflow system (Sprint 3.2)
 * Tests complete end-to-end workflows including:
 * - Simple TRD generation (<20 tasks) - TASK-033
 * - Complex TRD generation (>60 tasks) - TASK-034
 * - Custom PRD configuration - TASK-035
 * - Backward compatibility - TASK-036
 *
 * @module run-integration-tests
 * @related TRD-WORKFLOW-001, Sprint 3.2
 * @created 2025-12-02
 */

import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print colored console output
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log('');
  print('═'.repeat(80), 'cyan');
  print(`  ${title}`, 'bright');
  print('═'.repeat(80), 'cyan');
  console.log('');
}

/**
 * Print test file info
 */
function printTestFile(filename, description) {
  print(`  📋 ${filename}`, 'blue');
  print(`     ${description}`, 'reset');
}

/**
 * Get all integration test files
 */
async function getTestFiles() {
  const testDir = __dirname;
  const files = await fs.readdir(testDir);

  return files
    .filter(file => file.endsWith('.integration.test.js'))
    .map(file => join(testDir, file));
}

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  const startTime = Date.now();

  printHeader('TRD Workflow Integration Tests - Sprint 3.2');

  print('Running comprehensive end-to-end workflow tests...', 'cyan');
  console.log('');

  // List test files
  const testFiles = await getTestFiles();

  print('Test Suites:', 'bright');
  printTestFile(
    'simple-trd.integration.test.js',
    'TASK-033: Simple TRD generation (<20 tasks)'
  );
  printTestFile(
    'complex-trd.integration.test.js',
    'TASK-034: Complex TRD generation (>60 tasks)'
  );
  printTestFile(
    'custom-config.integration.test.js',
    'TASK-035: PRD with custom workflow configuration'
  );
  printTestFile(
    'backward-compat.integration.test.js',
    'TASK-036: Backward compatibility validation'
  );
  console.log('');

  print('─'.repeat(80), 'cyan');
  console.log('');

  // Track results
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  // Run tests with spec reporter
  const stream = run({
    files: testFiles,
    concurrency: 1  // Run sequentially for clearer output
  });

  // Use spec reporter for detailed output
  stream.compose(specReporter).pipe(process.stdout);

  // Collect results
  stream.on('test:pass', () => {
    totalTests++;
    passedTests++;
  });

  stream.on('test:fail', () => {
    totalTests++;
    failedTests++;
  });

  stream.on('test:skip', () => {
    totalTests++;
    skippedTests++;
  });

  // Wait for completion
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  // Print summary
  const duration = Date.now() - startTime;

  console.log('');
  print('─'.repeat(80), 'cyan');
  console.log('');

  printHeader('Integration Test Summary');

  print(`Total Tests:    ${totalTests}`, 'bright');
  print(`✓ Passed:       ${passedTests}`, 'green');

  if (failedTests > 0) {
    print(`✗ Failed:       ${failedTests}`, 'red');
  }

  if (skippedTests > 0) {
    print(`○ Skipped:      ${skippedTests}`, 'yellow');
  }

  console.log('');
  print(`Duration:       ${duration}ms`, 'cyan');
  console.log('');

  // Print success/failure message
  if (failedTests === 0) {
    print('✓ All integration tests passed!', 'green');
    print('  Sprint 3.2 integration testing complete.', 'green');
  } else {
    print('✗ Some integration tests failed.', 'red');
    print('  Please review the failures above.', 'red');
  }

  console.log('');
  print('═'.repeat(80), 'cyan');
  console.log('');

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

/**
 * Print usage information
 */
function printUsage() {
  printHeader('TRD Workflow Integration Test Runner');

  print('Usage:', 'bright');
  console.log('  node run-integration-tests.js [options]');
  console.log('');

  print('Options:', 'bright');
  console.log('  --help, -h     Show this help message');
  console.log('  --verbose, -v  Enable verbose output');
  console.log('');

  print('Test Coverage:', 'bright');
  console.log('  • Simple TRD (<20 tasks) - TASK-033');
  console.log('  • Complex TRD (>60 tasks) - TASK-034');
  console.log('  • Custom configuration - TASK-035');
  console.log('  • Backward compatibility - TASK-036');
  console.log('');

  print('Examples:', 'bright');
  console.log('  node run-integration-tests.js');
  console.log('  npm run test:integration');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  try {
    await runIntegrationTests();
  } catch (error) {
    console.error('');
    print('✗ Integration test execution failed:', 'red');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runIntegrationTests, getTestFiles };

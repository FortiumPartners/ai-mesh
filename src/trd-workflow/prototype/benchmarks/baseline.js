/**
 * Performance Benchmarking Baseline
 *
 * @module benchmarks/baseline
 * @description Establish performance baseline for TRD workflow generation
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-011
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { injectCheckpoints } from '../checkpoint-injector.js';
import { analyzeTaskTypes } from '../task-type-detector.js';
import { assessComplexity } from '../complexity-assessor.js';
import { generateWorkflow } from '../workflow-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Performance target thresholds
 */
const TARGETS = {
  checkpointInjection: 50, // ms
  taskTypeDetection: 100, // ms
  complexityAssessment: 50, // ms
  workflowGeneration: 200, // ms
  overheadPercentage: 10 // % overhead
};

/**
 * Run complete benchmark suite
 */
async function runBenchmarks() {
  console.log('='.repeat(80));
  console.log('TRD WORKFLOW GENERATION - PERFORMANCE BASELINE');
  console.log('='.repeat(80));
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    targets: TARGETS,
    benchmarks: {}
  };

  // Load test data
  const simpleTrd = loadTestData('simple-trd.json');
  const complexTrd = loadTestData('complex-trd.json');

  // Generate medium TRD (40 tasks)
  const mediumTrd = generateMediumTrd();

  // Benchmark 1: Checkpoint Injection
  console.log('📍 Benchmarking Checkpoint Injection...');
  results.benchmarks.checkpointInjection = {
    simple: benchmarkCheckpointInjection(simpleTrd),
    medium: benchmarkCheckpointInjection(mediumTrd),
    complex: benchmarkCheckpointInjection(complexTrd)
  };
  printBenchmarkResults('Checkpoint Injection', results.benchmarks.checkpointInjection, TARGETS.checkpointInjection);

  // Benchmark 2: Task Type Detection
  console.log('🔍 Benchmarking Task Type Detection...');
  results.benchmarks.taskTypeDetection = {
    simple: benchmarkTaskTypeDetection(simpleTrd),
    medium: benchmarkTaskTypeDetection(mediumTrd),
    complex: benchmarkTaskTypeDetection(complexTrd)
  };
  printBenchmarkResults('Task Type Detection', results.benchmarks.taskTypeDetection, TARGETS.taskTypeDetection);

  // Benchmark 3: Complexity Assessment
  console.log('📊 Benchmarking Complexity Assessment...');
  results.benchmarks.complexityAssessment = {
    simple: benchmarkComplexityAssessment(simpleTrd),
    medium: benchmarkComplexityAssessment(mediumTrd),
    complex: benchmarkComplexityAssessment(complexTrd)
  };
  printBenchmarkResults('Complexity Assessment', results.benchmarks.complexityAssessment, TARGETS.complexityAssessment);

  // Benchmark 4: Complete Workflow Generation
  console.log('⚙️  Benchmarking Complete Workflow Generation...');
  results.benchmarks.workflowGeneration = {
    simple: benchmarkWorkflowGeneration(simpleTrd),
    medium: benchmarkWorkflowGeneration(mediumTrd),
    complex: benchmarkWorkflowGeneration(complexTrd)
  };
  printBenchmarkResults('Workflow Generation', results.benchmarks.workflowGeneration, TARGETS.workflowGeneration);

  // Calculate overhead
  console.log('📈 Calculating Performance Overhead...');
  results.overhead = calculateOverhead(results.benchmarks);
  printOverheadResults(results.overhead);

  // Save results
  const resultsPath = join(__dirname, 'results.json');
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}\n`);

  // Summary
  printSummary(results);

  return results;
}

/**
 * Benchmark checkpoint injection
 */
function benchmarkCheckpointInjection(trdContext) {
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    injectCheckpoints(trdContext.tasks, {
      frequency: 'sprint',
      trdId: trdContext.id
    });
    const end = performance.now();
    times.push(end - start);
  }

  return {
    taskCount: trdContext.totalTasks,
    iterations,
    times,
    avg: average(times),
    min: Math.min(...times),
    max: Math.max(...times),
    median: median(times),
    p95: percentile(times, 95),
    p99: percentile(times, 99)
  };
}

/**
 * Benchmark task type detection
 */
function benchmarkTaskTypeDetection(trdContext) {
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    analyzeTaskTypes(trdContext.tasks);
    const end = performance.now();
    times.push(end - start);
  }

  return {
    taskCount: trdContext.totalTasks,
    iterations,
    times,
    avg: average(times),
    min: Math.min(...times),
    max: Math.max(...times),
    median: median(times),
    p95: percentile(times, 95),
    p99: percentile(times, 99)
  };
}

/**
 * Benchmark complexity assessment
 */
function benchmarkComplexityAssessment(trdContext) {
  const iterations = 10;
  const times = [];

  // Pre-run task type detection (dependency)
  const taskTypeAnalysis = analyzeTaskTypes(trdContext.tasks);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    assessComplexity(trdContext, taskTypeAnalysis.summary);
    const end = performance.now();
    times.push(end - start);
  }

  return {
    taskCount: trdContext.totalTasks,
    iterations,
    times,
    avg: average(times),
    min: Math.min(...times),
    max: Math.max(...times),
    median: median(times),
    p95: percentile(times, 95),
    p99: percentile(times, 99)
  };
}

/**
 * Benchmark complete workflow generation
 */
function benchmarkWorkflowGeneration(trdContext) {
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    generateWorkflow(trdContext);
    const end = performance.now();
    times.push(end - start);
  }

  return {
    taskCount: trdContext.totalTasks,
    iterations,
    times,
    avg: average(times),
    min: Math.min(...times),
    max: Math.max(...times),
    median: median(times),
    p95: percentile(times, 95),
    p99: percentile(times, 99)
  };
}

/**
 * Calculate overhead percentage
 */
function calculateOverhead(benchmarks) {
  const overhead = {};

  ['simple', 'medium', 'complex'].forEach(size => {
    const workflow = benchmarks.workflowGeneration[size].avg;
    const components =
      benchmarks.checkpointInjection[size].avg +
      benchmarks.taskTypeDetection[size].avg +
      benchmarks.complexityAssessment[size].avg;

    const overheadTime = workflow - components;
    const overheadPercent = (overheadTime / workflow) * 100;

    overhead[size] = {
      totalTime: workflow,
      componentTime: components,
      overheadTime,
      overheadPercent,
      meetsTarget: overheadPercent <= TARGETS.overheadPercentage
    };
  });

  return overhead;
}

/**
 * Print benchmark results
 */
function printBenchmarkResults(name, results, target) {
  console.log(`\n${name}:`);
  console.log('-'.repeat(80));
  console.log(`${'Size'.padEnd(10)} | ${'Tasks'.padEnd(8)} | ${'Avg (ms)'.padEnd(10)} | ${'Min (ms)'.padEnd(10)} | ${'Max (ms)'.padEnd(10)} | ${'P95 (ms)'.padEnd(10)} | ${'Status'.padEnd(10)}`);
  console.log('-'.repeat(80));

  ['simple', 'medium', 'complex'].forEach(size => {
    const result = results[size];
    const status = result.avg <= target ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${size.padEnd(10)} | ` +
      `${result.taskCount.toString().padEnd(8)} | ` +
      `${result.avg.toFixed(2).padEnd(10)} | ` +
      `${result.min.toFixed(2).padEnd(10)} | ` +
      `${result.max.toFixed(2).padEnd(10)} | ` +
      `${result.p95.toFixed(2).padEnd(10)} | ` +
      `${status}`
    );
  });

  console.log('-'.repeat(80));
  console.log(`Target: ${target}ms\n`);
}

/**
 * Print overhead results
 */
function printOverheadResults(overhead) {
  console.log('\nPerformance Overhead:');
  console.log('-'.repeat(80));
  console.log(`${'Size'.padEnd(10)} | ${'Total (ms)'.padEnd(12)} | ${'Components (ms)'.padEnd(16)} | ${'Overhead (ms)'.padEnd(14)} | ${'Overhead (%)'.padEnd(12)} | ${'Status'.padEnd(10)}`);
  console.log('-'.repeat(80));

  ['simple', 'medium', 'complex'].forEach(size => {
    const result = overhead[size];
    const status = result.meetsTarget ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${size.padEnd(10)} | ` +
      `${result.totalTime.toFixed(2).padEnd(12)} | ` +
      `${result.componentTime.toFixed(2).padEnd(16)} | ` +
      `${result.overheadTime.toFixed(2).padEnd(14)} | ` +
      `${result.overheadPercent.toFixed(2).padEnd(12)} | ` +
      `${status}`
    );
  });

  console.log('-'.repeat(80));
  console.log(`Target: <${TARGETS.overheadPercentage}%\n`);
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const allTests = [];

  // Collect all test results
  Object.entries(results.benchmarks).forEach(([component, sizes]) => {
    const target = TARGETS[component];
    Object.entries(sizes).forEach(([size, result]) => {
      allTests.push({
        component,
        size,
        time: result.avg,
        target,
        pass: result.avg <= target
      });
    });
  });

  // Add overhead tests
  Object.entries(results.overhead).forEach(([size, result]) => {
    allTests.push({
      component: 'overhead',
      size,
      time: result.overheadPercent,
      target: TARGETS.overheadPercentage,
      pass: result.meetsTarget
    });
  });

  const passed = allTests.filter(t => t.pass).length;
  const total = allTests.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\nTests Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`\nPerformance Status: ${passed === total ? '✅ ALL TARGETS MET' : '⚠️  SOME TARGETS MISSED'}`);
  console.log('='.repeat(80));
  console.log('');
}

/**
 * Load test data from JSON file
 */
function loadTestData(filename) {
  const path = join(__dirname, '../test-data', filename);
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

/**
 * Generate medium-sized TRD (40 tasks)
 */
function generateMediumTrd() {
  const mediumTrd = {
    id: 'TRD-MEDIUM-001',
    title: 'Medium Feature Implementation',
    totalTasks: 40,
    phases: [
      { name: 'Phase 1: Setup', tasks: [] },
      { name: 'Phase 2: Backend', tasks: [] },
      { name: 'Phase 3: Frontend', tasks: [] },
      { name: 'Phase 4: Testing', tasks: [] }
    ],
    tasks: []
  };

  // Generate 40 tasks
  for (let i = 1; i <= 40; i++) {
    const phase = Math.ceil(i / 10);
    const sprint = Math.ceil(i / 5);
    const taskTypes = ['backend', 'frontend', 'testing', 'documentation', 'infrastructure'];
    const taskType = taskTypes[i % taskTypes.length];

    mediumTrd.tasks.push({
      id: `TASK-${String(i).padStart(3, '0')}`,
      title: `${taskType} task ${i}`,
      description: `Implement ${taskType} functionality for feature ${i}`,
      duration: '2 hours',
      priority: i % 3 === 0 ? 'high' : 'medium',
      dependencies: i > 1 ? [`TASK-${String(i - 1).padStart(3, '0')}`] : [],
      phase,
      sprint
    });
  }

  return mediumTrd;
}

// Statistical helper functions

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

// Run benchmarks if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks()
    .then(() => {
      console.log('✅ Benchmarking complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Benchmarking failed:', error);
      process.exit(1);
    });
}

export { runBenchmarks };

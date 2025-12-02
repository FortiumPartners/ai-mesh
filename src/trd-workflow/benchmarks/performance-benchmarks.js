/**
 * Performance Benchmarking Suite - Sprint 3.3
 *
 * @module benchmarks/performance-benchmarks
 * @description Comprehensive performance benchmarks for TRD workflow generation
 * Tests 20-task, 40-task, and 60-task TRDs with workflow injection
 * Validates <10% overhead and <30s generation time for 60-task TRD
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-038, TASK-039
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  injectWorkflowTasks,
  generateWorkflowSection,
  analyzeTaskTypes,
  generateDelegationPatterns,
  generateQualityGates,
  generateCommitTemplates,
  parsePrdMetadata,
  validateWorkflowConfig
} from '../lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Performance target thresholds (from TASK-038)
 */
const TARGETS = {
  small20Tasks: 10000, // 10 seconds in ms
  medium40Tasks: 20000, // 20 seconds in ms
  large60Tasks: 30000, // 30 seconds in ms
  overheadPercentage: 10, // % overhead for workflow injection
  componentThresholds: {
    checkpointInjection: 50, // ms per operation
    taskTypeDetection: 100, // ms per operation
    workflowGeneration: 200, // ms per operation
    templateRendering: 150 // ms per operation
  }
};

/**
 * Run complete benchmark suite
 */
export async function runBenchmarks() {
  console.log('='.repeat(80));
  console.log('TRD WORKFLOW GENERATION - PERFORMANCE BENCHMARKS (Sprint 3.3)');
  console.log('='.repeat(80));
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    targets: TARGETS,
    benchmarks: {},
    metadata: {
      version: '1.0.0',
      sprint: 'Sprint 3.3',
      tasks: ['TASK-038', 'TASK-039']
    }
  };

  // Generate test TRDs
  console.log('📦 Generating test TRDs...\n');
  const trd20 = generateTestTrd(20, 'TRD-BENCH-020');
  const trd40 = generateTestTrd(40, 'TRD-BENCH-040');
  const trd60 = generateTestTrd(60, 'TRD-BENCH-060');

  console.log(`✅ 20-task TRD: ${trd20.tasks.length} tasks, ${trd20.phases.length} phases`);
  console.log(`✅ 40-task TRD: ${trd40.tasks.length} tasks, ${trd40.phases.length} phases`);
  console.log(`✅ 60-task TRD: ${trd60.tasks.length} tasks, ${trd60.phases.length} phases\n`);

  // Benchmark 1: Baseline (without workflow injection)
  console.log('📊 Benchmarking BASELINE (without workflow injection)...');
  results.benchmarks.baseline = {
    small20: benchmarkBaseline(trd20),
    medium40: benchmarkBaseline(trd40),
    large60: benchmarkBaseline(trd60)
  };
  printBenchmarkResults('Baseline Generation', results.benchmarks.baseline, {
    small20: TARGETS.small20Tasks,
    medium40: TARGETS.medium40Tasks,
    large60: TARGETS.large60Tasks
  });

  // Benchmark 2: With workflow injection
  console.log('⚡ Benchmarking WITH WORKFLOW INJECTION...');
  results.benchmarks.withWorkflow = {
    small20: benchmarkWithWorkflow(trd20),
    medium40: benchmarkWithWorkflow(trd40),
    large60: benchmarkWithWorkflow(trd60)
  };
  printBenchmarkResults('With Workflow Injection', results.benchmarks.withWorkflow, {
    small20: TARGETS.small20Tasks,
    medium40: TARGETS.medium40Tasks,
    large60: TARGETS.large60Tasks
  });

  // Benchmark 3: Component-level benchmarks
  console.log('🔍 Benchmarking INDIVIDUAL COMPONENTS...');
  results.benchmarks.components = {
    checkpointInjection: {
      small20: benchmarkCheckpointInjection(trd20),
      medium40: benchmarkCheckpointInjection(trd40),
      large60: benchmarkCheckpointInjection(trd60)
    },
    taskTypeDetection: {
      small20: benchmarkTaskTypeDetection(trd20),
      medium40: benchmarkTaskTypeDetection(trd40),
      large60: benchmarkTaskTypeDetection(trd60)
    },
    workflowSectionGeneration: {
      small20: benchmarkWorkflowSectionGeneration(trd20),
      medium40: benchmarkWorkflowSectionGeneration(trd40),
      large60: benchmarkWorkflowSectionGeneration(trd60)
    },
    templateRendering: {
      small20: benchmarkTemplateRendering(trd20),
      medium40: benchmarkTemplateRendering(trd40),
      large60: benchmarkTemplateRendering(trd60)
    }
  };
  printComponentResults(results.benchmarks.components, TARGETS.componentThresholds);

  // Calculate overhead
  console.log('📈 Calculating PERFORMANCE OVERHEAD...');
  results.overhead = calculateOverhead(results.benchmarks);
  printOverheadResults(results.overhead, TARGETS.overheadPercentage);

  // Save results
  const resultsPath = join(__dirname, 'benchmark-results.json');
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}\n`);

  // Summary
  printSummary(results);

  return results;
}

/**
 * Benchmark baseline TRD processing (no workflow injection)
 */
function benchmarkBaseline(trdContext) {
  const iterations = 5; // Reduced for larger operations
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Simulate baseline processing without workflow injection
    const taskTypes = analyzeTaskTypes(trdContext.tasks);
    const delegation = generateDelegationPatterns(taskTypes.summary, trdContext.tasks);
    const qualityGates = generateQualityGates(taskTypes.summary, trdContext.tasks);

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
 * Benchmark complete workflow generation (with injection)
 */
function benchmarkWithWorkflow(trdContext) {
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Full workflow generation
    const enhanced = injectWorkflowTasks(trdContext.taskBreakdown, {
      checkpoint_frequency: 'sprint',
      trd_id: trdContext.id
    });

    const workflowSection = generateWorkflowSection(trdContext, {
      checkpoint_frequency: 'sprint',
      includeComplexityAnalysis: true,
      includeDelegation: true,
      includeQualityGates: true
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
 * Benchmark checkpoint injection
 */
function benchmarkCheckpointInjection(trdContext) {
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    // Deep clone to avoid mutation
    const taskBreakdownClone = JSON.parse(JSON.stringify(trdContext.taskBreakdown));

    const start = performance.now();
    injectWorkflowTasks(taskBreakdownClone, {
      checkpoint_frequency: 'sprint',
      trd_id: trdContext.id
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
    p95: percentile(times, 95)
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
    p95: percentile(times, 95)
  };
}

/**
 * Benchmark workflow section generation
 */
function benchmarkWorkflowSectionGeneration(trdContext) {
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    generateWorkflowSection(trdContext, {
      checkpoint_frequency: 'sprint',
      includeComplexityAnalysis: true,
      includeDelegation: true,
      includeQualityGates: true
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
    p95: percentile(times, 95)
  };
}

/**
 * Benchmark template rendering
 */
function benchmarkTemplateRendering(trdContext) {
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Generate all templates
    generateCommitTemplates(trdContext);
    const taskTypes = analyzeTaskTypes(trdContext.tasks);
    generateDelegationPatterns(taskTypes.summary, trdContext.tasks);
    generateQualityGates(taskTypes.summary, trdContext.tasks);

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
    p95: percentile(times, 95)
  };
}

/**
 * Calculate overhead percentage
 */
function calculateOverhead(benchmarks) {
  const overhead = {};

  ['small20', 'medium40', 'large60'].forEach(size => {
    const baseline = benchmarks.baseline[size].avg;
    const withWorkflow = benchmarks.withWorkflow[size].avg;

    const overheadTime = withWorkflow - baseline;
    const overheadPercent = (overheadTime / baseline) * 100;

    overhead[size] = {
      baselineTime: baseline,
      workflowTime: withWorkflow,
      overheadTime,
      overheadPercent,
      meetsTarget: overheadPercent <= 10
    };
  });

  return overhead;
}

/**
 * Generate test TRD with specified task count
 */
function generateTestTrd(taskCount, trdId) {
  const phasesCount = Math.ceil(taskCount / 20); // ~20 tasks per phase
  const sprintsPerPhase = 3;
  const tasksPerSprint = Math.ceil(taskCount / (phasesCount * sprintsPerPhase));

  const phases = [];
  const tasks = [];
  let taskCounter = 1;

  // Task type distribution
  const taskTypes = ['backend', 'frontend', 'testing', 'documentation', 'infrastructure'];

  for (let p = 1; p <= phasesCount; p++) {
    const phase = {
      name: `Phase ${p}: ${p === 1 ? 'Setup' : p === phasesCount ? 'Testing' : 'Implementation'}`,
      sprints: []
    };

    for (let s = 1; s <= sprintsPerPhase && taskCounter <= taskCount; s++) {
      const sprint = {
        name: `Sprint ${(p - 1) * sprintsPerPhase + s}`,
        tasks: []
      };

      for (let t = 1; t <= tasksPerSprint && taskCounter <= taskCount; t++) {
        const taskType = taskTypes[(taskCounter - 1) % taskTypes.length];

        const task = {
          id: `TASK-${String(taskCounter).padStart(3, '0')}`,
          title: `${taskType} task ${taskCounter}`,
          description: `Implement ${taskType} functionality for feature ${taskCounter}`,
          duration: `${1 + (taskCounter % 3)} hours`,
          priority: taskCounter % 3 === 0 ? 'high' : taskCounter % 3 === 1 ? 'medium' : 'low',
          dependencies: taskCounter > 1 ? [`TASK-${String(taskCounter - 1).padStart(3, '0')}`] : [],
          phase: p,
          sprint: (p - 1) * sprintsPerPhase + s,
          acceptance_criteria: [
            `${taskType} functionality implemented`,
            'Tests passing',
            'Documentation updated'
          ]
        };

        sprint.tasks.push(task);
        tasks.push(task);
        taskCounter++;
      }

      phase.sprints.push(sprint);
    }

    phases.push(phase);
  }

  return {
    id: trdId,
    trd_id: trdId, // For commit template generator
    title: `Performance Test TRD - ${taskCount} Tasks`,
    totalTasks: taskCount,
    phases,
    tasks,
    taskBreakdown: { phases }
  };
}

/**
 * Print benchmark results
 */
function printBenchmarkResults(name, results, targets) {
  console.log(`\n${name}:`);
  console.log('-'.repeat(100));
  console.log(`${'Size'.padEnd(12)} | ${'Tasks'.padEnd(8)} | ${'Avg (ms)'.padEnd(12)} | ${'Min (ms)'.padEnd(12)} | ${'Max (ms)'.padEnd(12)} | ${'Target (ms)'.padEnd(12)} | ${'Status'.padEnd(10)}`);
  console.log('-'.repeat(100));

  Object.entries(results).forEach(([size, result]) => {
    const target = targets[size];
    const status = result.avg <= target ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${size.padEnd(12)} | ` +
      `${result.taskCount.toString().padEnd(8)} | ` +
      `${result.avg.toFixed(2).padEnd(12)} | ` +
      `${result.min.toFixed(2).padEnd(12)} | ` +
      `${result.max.toFixed(2).padEnd(12)} | ` +
      `${target.toFixed(0).padEnd(12)} | ` +
      `${status}`
    );
  });

  console.log('-'.repeat(100));
}

/**
 * Print component results
 */
function printComponentResults(components, thresholds) {
  console.log('\nComponent Performance:');
  console.log('-'.repeat(100));

  Object.entries(components).forEach(([component, sizes]) => {
    console.log(`\n${component}:`);
    console.log(`${'Size'.padEnd(12)} | ${'Tasks'.padEnd(8)} | ${'Avg (ms)'.padEnd(12)} | ${'Target (ms)'.padEnd(12)} | ${'Status'.padEnd(10)}`);
    console.log('-'.repeat(80));

    Object.entries(sizes).forEach(([size, result]) => {
      const target = thresholds[component] || 100;
      const status = result.avg <= target ? '✅ PASS' : '⚠️  WARN';
      console.log(
        `${size.padEnd(12)} | ` +
        `${result.taskCount.toString().padEnd(8)} | ` +
        `${result.avg.toFixed(2).padEnd(12)} | ` +
        `${target.toFixed(0).padEnd(12)} | ` +
        `${status}`
      );
    });
  });

  console.log('-'.repeat(100));
}

/**
 * Print overhead results
 */
function printOverheadResults(overhead, targetPercent) {
  console.log('\nWorkflow Injection Overhead:');
  console.log('-'.repeat(100));
  console.log(`${'Size'.padEnd(12)} | ${'Baseline (ms)'.padEnd(14)} | ${'Workflow (ms)'.padEnd(14)} | ${'Overhead (ms)'.padEnd(14)} | ${'Overhead (%)'.padEnd(12)} | ${'Status'.padEnd(10)}`);
  console.log('-'.repeat(100));

  Object.entries(overhead).forEach(([size, result]) => {
    const status = result.meetsTarget ? '✅ PASS' : '❌ FAIL';
    console.log(
      `${size.padEnd(12)} | ` +
      `${result.baselineTime.toFixed(2).padEnd(14)} | ` +
      `${result.workflowTime.toFixed(2).padEnd(14)} | ` +
      `${result.overheadTime.toFixed(2).padEnd(14)} | ` +
      `${result.overheadPercent.toFixed(2).padEnd(12)} | ` +
      `${status}`
    );
  });

  console.log('-'.repeat(100));
  console.log(`Target: <${targetPercent}% overhead\n`);
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log('='.repeat(80));
  console.log('PERFORMANCE SUMMARY');
  console.log('='.repeat(80));

  // Check all targets
  const checks = [];

  // Main benchmarks
  Object.entries(results.benchmarks.withWorkflow).forEach(([size, result]) => {
    const target = TARGETS[size];
    checks.push({
      name: `Workflow Generation - ${size}`,
      value: result.avg,
      target,
      unit: 'ms',
      pass: result.avg <= target
    });
  });

  // Overhead checks
  Object.entries(results.overhead).forEach(([size, result]) => {
    checks.push({
      name: `Overhead - ${size}`,
      value: result.overheadPercent,
      target: TARGETS.overheadPercentage,
      unit: '%',
      pass: result.meetsTarget
    });
  });

  const passed = checks.filter(c => c.pass).length;
  const total = checks.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\nChecks Passed: ${passed}/${total} (${passRate}%)\n`);

  // Show failed checks
  const failed = checks.filter(c => !c.pass);
  if (failed.length > 0) {
    console.log('Failed Checks:');
    failed.forEach(check => {
      console.log(`  ❌ ${check.name}: ${check.value.toFixed(2)}${check.unit} (target: ${check.target}${check.unit})`);
    });
    console.log('');
  }

  // Key metrics
  const large60 = results.benchmarks.withWorkflow.large60;
  const overhead60 = results.overhead.large60;

  console.log('Key Metrics:');
  console.log(`  🎯 60-task TRD generation: ${large60.avg.toFixed(0)}ms (target: ${TARGETS.large60Tasks}ms)`);
  console.log(`  📊 Workflow overhead: ${overhead60.overheadPercent.toFixed(1)}% (target: <${TARGETS.overheadPercentage}%)`);
  console.log(`  ⚡ Average throughput: ${(60000 / large60.avg).toFixed(1)} tasks/minute`);

  console.log(`\n${passed === total ? '✅ ALL PERFORMANCE TARGETS MET' : '⚠️  SOME TARGETS MISSED'}`);
  console.log('='.repeat(80));
  console.log('');
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
      console.error(error.stack);
      process.exit(1);
    });
}

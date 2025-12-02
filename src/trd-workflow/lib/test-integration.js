/**
 * Integration Test for TRD Workflow Library
 *
 * @description Test production modules with prototype test data
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  injectWorkflowTasks,
  calculateCheckpointInterval,
  generateCommitTemplates,
  explainStrategy,
  validateCheckpoints
} from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load test data from prototype directory
 */
function loadTestData(filename) {
  const testDataPath = join(__dirname, '../prototype/test-data', filename);
  const content = readFileSync(testDataPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Convert flat task array to hierarchical task breakdown
 */
function convertToTaskBreakdown(trdData) {
  const phases = new Map();

  // Group tasks by phase
  trdData.tasks.forEach(task => {
    const phaseNum = task.phase || 1;
    const sprintNum = task.sprint || 1;

    if (!phases.has(phaseNum)) {
      phases.set(phaseNum, {
        name: `Phase ${phaseNum}`,
        sprints: new Map()
      });
    }

    const phase = phases.get(phaseNum);

    if (!phase.sprints.has(sprintNum)) {
      phase.sprints.set(sprintNum, {
        name: `Sprint ${sprintNum}`,
        tasks: []
      });
    }

    phase.sprints.get(sprintNum).tasks.push(task);
  });

  // Convert to array structure
  return {
    phases: Array.from(phases.values()).map(phase => ({
      name: phase.name,
      sprints: Array.from(phase.sprints.values())
    }))
  };
}

/**
 * Test checkpoint injection with simple TRD
 */
function testSimpleTRD() {
  console.log('\n=== Test 1: Simple TRD Checkpoint Injection ===\n');

  const trdData = loadTestData('simple-trd.json');
  const taskBreakdown = convertToTaskBreakdown(trdData);

  console.log(`Loaded TRD: ${trdData.id}`);
  console.log(`Total Tasks: ${trdData.totalTasks}`);
  console.log(`Phases: ${taskBreakdown.phases.length}`);
  console.log(`Total Sprints: ${taskBreakdown.phases.reduce((sum, p) => sum + p.sprints.length, 0)}`);

  // Test 1a: Calculate interval strategy
  console.log('\n--- Interval Strategy ---');
  const strategy = calculateCheckpointInterval(taskBreakdown);
  console.log(explainStrategy(strategy));

  // Test 1b: Inject checkpoints
  console.log('\n--- Checkpoint Injection ---');
  const enhanced = injectWorkflowTasks(taskBreakdown, {
    checkpoint_frequency: 'sprint',
    trd_id: trdData.id
  });

  console.log(`Checkpoints Injected: ${enhanced.checkpoints.length}`);
  console.log(`Strategy Used: ${enhanced.metrics.strategy}`);
  console.log(`Coverage: ${enhanced.metrics.coverage}%`);

  // Test 1c: Validate checkpoints
  console.log('\n--- Checkpoint Validation ---');
  const validation = validateCheckpoints(enhanced);
  console.log(`Valid: ${validation.valid}`);
  console.log(`Errors: ${validation.errors.length}`);
  console.log(`Warnings: ${validation.warnings.length}`);

  if (validation.errors.length > 0) {
    console.log('Errors:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
  }

  // Show first checkpoint
  if (enhanced.checkpoints.length > 0) {
    console.log('\n--- Sample Checkpoint ---');
    const checkpoint = enhanced.checkpoints[0];
    console.log(`ID: ${checkpoint.id}`);
    console.log(`Title: ${checkpoint.title}`);
    console.log(`Dependencies: ${checkpoint.dependencies.length} tasks`);
    console.log(`Commit Template: ${JSON.stringify(checkpoint.commit_template, null, 2)}`);
  }

  return enhanced;
}

/**
 * Test commit template generation
 */
function testCommitTemplates() {
  console.log('\n\n=== Test 2: Commit Template Generation ===\n');

  const trdData = loadTestData('simple-trd.json');

  const templates = generateCommitTemplates({
    trd_id: trdData.id,
    title: trdData.title,
    tasks: trdData.tasks
  }, {
    templateCount: 5
  });

  console.log(`Generated Templates: ${templates.templates.length}`);
  console.log(`Recommended Scope: ${templates.scope}`);
  console.log(`Detected Types: ${templates.metadata.detectedTypes.join(', ')}`);

  templates.templates.forEach((template, index) => {
    console.log(`\n--- Template ${index + 1}: ${template.type} ---`);
    console.log(`Description: ${template.description}`);
    console.log(`Task Count: ${template.taskCount}`);
    console.log('Template:');
    console.log(template.template);
  });

  return templates;
}

/**
 * Test different checkpoint strategies
 */
function testStrategies() {
  console.log('\n\n=== Test 3: Checkpoint Strategy Comparison ===\n');

  const trdData = loadTestData('simple-trd.json');
  const taskBreakdown = convertToTaskBreakdown(trdData);

  const strategies = ['sprint', 'phase', 5];

  strategies.forEach(freq => {
    console.log(`\n--- Strategy: ${freq} ---`);

    const enhanced = injectWorkflowTasks(taskBreakdown, {
      checkpoint_frequency: freq,
      trd_id: trdData.id
    });

    console.log(`Checkpoints: ${enhanced.checkpoints.length}`);
    console.log(`Strategy: ${enhanced.intervalStrategy.strategy}`);
    console.log(`Frequency: ${enhanced.intervalStrategy.frequency}`);
    console.log(`Reasoning: ${enhanced.intervalStrategy.reasoning}`);
    console.log(`Coverage: ${enhanced.metrics.coverage}%`);
  });
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('========================================');
  console.log('TRD Workflow Library Integration Tests');
  console.log('========================================');

  try {
    testSimpleTRD();
    testCommitTemplates();
    testStrategies();

    console.log('\n\n========================================');
    console.log('All Tests Completed Successfully! ✓');
    console.log('========================================\n');

    return true;
  } catch (error) {
    console.error('\n\n========================================');
    console.error('Test Failed! ✗');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

export { runAllTests, testSimpleTRD, testCommitTemplates, testStrategies };

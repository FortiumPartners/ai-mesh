/**
 * Integration Test - Simple TRD Generation (<20 tasks)
 *
 * Tests end-to-end workflow injection for simple TRD:
 * - Checkpoint task injection (every 5-7 tasks)
 * - Workflow section generation with /implement-trd
 * - Commit template generation
 * - PR creation task inclusion
 *
 * @module simple-trd.integration.test
 * @related TRD-WORKFLOW-001, TASK-033
 * @created 2025-12-02
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import production modules
import { injectWorkflowTasks } from '../../lib/checkpoint-injector.js';
import { generateWorkflowSection } from '../../lib/workflow-section-generator.js';
import { generateCommitTemplates } from '../../lib/commit-template-generator.js';
import { generatePrTask, injectPrTask } from '../../lib/pr-task-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Simple TRD Integration Tests (TASK-033)', () => {
  let simpleTRD;

  // Load test data before tests
  test('Setup: Load simple TRD test data', async () => {
    const dataPath = path.join(__dirname, '../../prototype/test-data/simple-trd.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    simpleTRD = JSON.parse(content);

    assert.ok(simpleTRD);
    assert.strictEqual(simpleTRD.id, 'TRD-SIMPLE-001');
    assert.strictEqual(simpleTRD.totalTasks, 15);
  });

  describe('End-to-End Workflow Injection', () => {
    test('should inject checkpoints into simple TRD', () => {
      // Transform flat tasks array to structured breakdown
      const taskBreakdown = transformToTaskBreakdown(simpleTRD);

      // Inject checkpoints
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'task-count',
        trd_id: simpleTRD.id
      });

      // Verify structure
      assert.ok(enhanced.taskBreakdown);
      assert.ok(enhanced.checkpoints);
      assert.ok(enhanced.intervalStrategy);
      assert.ok(enhanced.metrics);

      // Verify checkpoint count (every 5-7 tasks for 15 tasks = 3 checkpoints)
      const expectedCheckpoints = 3;
      assert.strictEqual(
        enhanced.checkpoints.length,
        expectedCheckpoints,
        `Expected ${expectedCheckpoints} checkpoints for 15 tasks`
      );

      // Verify checkpoints are properly injected
      enhanced.checkpoints.forEach((checkpoint, index) => {
        assert.ok(checkpoint.id.startsWith('TASK-CHKPT-'));
        assert.strictEqual(checkpoint.type, 'checkpoint');
        assert.ok(checkpoint.dependencies.length > 0);
        assert.ok(checkpoint.commit_template);
      });
    });

    test('should verify checkpoint placement every 5-7 tasks', () => {
      const taskBreakdown = transformToTaskBreakdown(simpleTRD);

      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 5, // Every 5 tasks
        trd_id: simpleTRD.id
      });

      // With 15 tasks and frequency of 5:
      // Checkpoint 1: after task 5
      // Checkpoint 2: after task 10
      // Checkpoint 3: after task 15 (final)
      assert.strictEqual(enhanced.checkpoints.length, 3);

      // Verify dependency counts
      assert.strictEqual(enhanced.checkpoints[0].dependencies.length, 5);
      assert.strictEqual(enhanced.checkpoints[1].dependencies.length, 5);
      assert.strictEqual(enhanced.checkpoints[2].dependencies.length, 5);
    });

    test('should generate workflow section with /implement-trd command', () => {
      // Create TRD context
      const trdContext = {
        trdId: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks,
        phases: simpleTRD.phases
      };

      const workflow = generateWorkflowSection(trdContext);

      // Verify workflow section structure
      assert.ok(workflow.markdown);
      assert.ok(workflow.analysis);
      assert.ok(workflow.metadata);

      // Verify /implement-trd command is specified
      assert.ok(
        workflow.markdown.includes('/implement-trd'),
        'Workflow section should specify /implement-trd command'
      );

      // Verify complexity level is 'simple'
      assert.strictEqual(
        workflow.analysis.complexity.level,
        'simple',
        'Simple TRD should have simple complexity level'
      );

      // Verify sections are present
      assert.ok(workflow.markdown.includes('Complexity Assessment'));
      assert.ok(workflow.markdown.includes('Recommended Execution Command'));
      assert.ok(workflow.markdown.includes('Execution Approach'));
    });

    test('should generate commit templates for checkpoints', () => {
      const trdContext = {
        trd_id: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks
      };

      const templates = generateCommitTemplates(trdContext);

      // Verify templates structure
      assert.ok(templates.templates);
      assert.ok(templates.examples);
      assert.ok(templates.guidelines);

      // Verify templates are generated for different scopes
      assert.ok(templates.templates.length > 0);
      templates.templates.forEach(template => {
        assert.ok(template.scope);
        assert.ok(template.template);
        assert.ok(template.example);
      });

      // Verify guidelines are comprehensive
      assert.ok(templates.guidelines.format);
      assert.ok(templates.guidelines.structure);
      assert.ok(templates.guidelines.examples);
    });

    test('should include PR creation task', () => {
      const taskBreakdown = transformToTaskBreakdown(simpleTRD);

      // Generate PR task
      const prTask = generatePrTask({
        trdId: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks
      });

      // Verify PR task structure
      assert.ok(prTask.id.startsWith('TASK-PR-'));
      assert.strictEqual(prTask.type, 'pr-creation');
      assert.ok(prTask.title.includes('Pull Request'));
      assert.ok(prTask.checklist);
      assert.ok(prTask.pr_template);

      // Inject PR task into task breakdown
      const enhanced = injectPrTask(taskBreakdown, prTask);

      // Verify PR task is in final sprint
      const lastPhase = enhanced.phases[enhanced.phases.length - 1];
      const lastSprint = lastPhase.sprints[lastPhase.sprints.length - 1];
      const lastTask = lastSprint.tasks[lastSprint.tasks.length - 1];

      assert.strictEqual(lastTask.type, 'pr-creation');
    });
  });

  describe('Full Pipeline Integration', () => {
    test('should execute complete simple TRD workflow pipeline', () => {
      // Step 1: Transform to task breakdown
      const taskBreakdown = transformToTaskBreakdown(simpleTRD);

      // Step 2: Inject checkpoints
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 5,
        trd_id: simpleTRD.id
      });

      // Step 3: Generate workflow section
      const workflow = generateWorkflowSection({
        trdId: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks,
        phases: simpleTRD.phases
      });

      // Step 4: Generate commit templates
      const templates = generateCommitTemplates({
        trd_id: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks
      });

      // Step 5: Generate and inject PR task
      const prTask = generatePrTask({
        trdId: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks
      });

      const final = injectPrTask(enhanced.taskBreakdown, prTask);

      // Verify complete pipeline results
      assert.ok(enhanced.checkpoints.length === 3);
      assert.ok(workflow.markdown.includes('/implement-trd'));
      assert.ok(templates.templates.length > 0);

      // Verify PR task is injected
      const lastPhase = final.phases[final.phases.length - 1];
      const lastSprint = lastPhase.sprints[lastPhase.sprints.length - 1];
      const hasPrTask = lastSprint.tasks.some(t => t.type === 'pr-creation');
      assert.ok(hasPrTask, 'PR task should be in final sprint');
    });

    test('should validate all checkpoints have proper structure', () => {
      const taskBreakdown = transformToTaskBreakdown(simpleTRD);

      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 5,
        trd_id: simpleTRD.id
      });

      // Validate each checkpoint
      enhanced.checkpoints.forEach((checkpoint, index) => {
        // ID format
        assert.ok(
          checkpoint.id.match(/^TASK-CHKPT-\d{3}$/),
          `Checkpoint ${index} has invalid ID format: ${checkpoint.id}`
        );

        // Type
        assert.strictEqual(
          checkpoint.type,
          'checkpoint',
          `Checkpoint ${index} should have type 'checkpoint'`
        );

        // Dependencies
        assert.ok(
          Array.isArray(checkpoint.dependencies) && checkpoint.dependencies.length > 0,
          `Checkpoint ${index} should have dependencies`
        );

        // Acceptance criteria
        assert.ok(
          Array.isArray(checkpoint.acceptance_criteria),
          `Checkpoint ${index} should have acceptance criteria`
        );

        // Commit template
        assert.ok(
          checkpoint.commit_template,
          `Checkpoint ${index} should have commit template`
        );

        assert.ok(
          checkpoint.commit_template.type,
          `Checkpoint ${index} commit template should have type`
        );

        assert.ok(
          checkpoint.commit_template.scope,
          `Checkpoint ${index} commit template should have scope`
        );
      });
    });

    test('should verify workflow section contains all required content', () => {
      const workflow = generateWorkflowSection({
        trdId: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks,
        phases: simpleTRD.phases
      });

      const requiredSections = [
        '## 📋 Workflow & Execution',
        'Complexity Assessment',
        'Recommended Execution Command',
        '/implement-trd',
        'Execution Approach',
        'Task Type Distribution',
        'Quality Gates',
        'Agent Delegation'
      ];

      requiredSections.forEach(section => {
        assert.ok(
          workflow.markdown.includes(section),
          `Workflow section should include: ${section}`
        );
      });

      // Verify analysis structure
      assert.ok(workflow.analysis.complexity);
      assert.ok(workflow.analysis.executionApproach);
      assert.ok(workflow.analysis.taskTypeDistribution);
      assert.ok(workflow.analysis.qualityGates);
      assert.ok(workflow.analysis.delegation);
    });
  });

  describe('Performance Validation', () => {
    test('should generate workflow in acceptable time', () => {
      const startTime = Date.now();

      const taskBreakdown = transformToTaskBreakdown(simpleTRD);
      injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 5,
        trd_id: simpleTRD.id
      });

      const duration = Date.now() - startTime;

      // Should complete in under 100ms for simple TRD
      assert.ok(duration < 100, `Generation took ${duration}ms (expected <100ms)`);
    });

    test('should generate workflow section in acceptable time', () => {
      const startTime = Date.now();

      generateWorkflowSection({
        trdId: simpleTRD.id,
        title: simpleTRD.title,
        tasks: simpleTRD.tasks,
        phases: simpleTRD.phases
      });

      const duration = Date.now() - startTime;

      // Should complete in under 50ms for simple TRD
      assert.ok(duration < 50, `Workflow generation took ${duration}ms (expected <50ms)`);
    });
  });
});

/**
 * Transform flat TRD structure to hierarchical task breakdown
 *
 * @param {Object} trd - Simple TRD with flat tasks array
 * @returns {Object} Hierarchical task breakdown (phases > sprints > tasks)
 * @private
 */
function transformToTaskBreakdown(trd) {
  const breakdown = {
    id: trd.id,
    title: trd.title,
    phases: []
  };

  // Group tasks by phase and sprint
  const phaseMap = new Map();

  trd.tasks.forEach(task => {
    const phaseNum = task.phase || 1;
    const sprintNum = task.sprint || 1;

    if (!phaseMap.has(phaseNum)) {
      phaseMap.set(phaseNum, {
        name: trd.phases[phaseNum - 1]?.name || `Phase ${phaseNum}`,
        sprints: new Map()
      });
    }

    const phase = phaseMap.get(phaseNum);

    if (!phase.sprints.has(sprintNum)) {
      phase.sprints.set(sprintNum, {
        name: `Sprint ${sprintNum}`,
        tasks: []
      });
    }

    const sprint = phase.sprints.get(sprintNum);
    sprint.tasks.push(task);
  });

  // Convert maps to arrays
  phaseMap.forEach((phase, phaseNum) => {
    const sprints = [];
    phase.sprints.forEach((sprint, sprintNum) => {
      sprints.push({
        name: sprint.name,
        number: sprintNum,
        tasks: sprint.tasks
      });
    });

    breakdown.phases.push({
      name: phase.name,
      number: phaseNum,
      sprints
    });
  });

  return breakdown;
}

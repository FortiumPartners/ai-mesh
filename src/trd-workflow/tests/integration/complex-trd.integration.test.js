/**
 * Integration Test - Complex TRD Generation (>60 tasks)
 *
 * Tests end-to-end workflow injection for complex TRD (like LIN-94):
 * - 12+ checkpoint task injection at sprint/phase boundaries
 * - Workflow section with /orchestrate-tasks and delegation
 * - Phase-level and sprint-level quality gates
 * - PR creation task with comprehensive checklist
 *
 * @module complex-trd.integration.test
 * @related TRD-WORKFLOW-001, TASK-034
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
import { generateQualityGates } from '../../lib/quality-gate-generator.js';
import { generateDelegationPatterns } from '../../lib/delegation-generator.js';
import { generatePrTask, injectPrTask } from '../../lib/pr-task-generator.js';
import { analyzeTaskTypes } from '../../lib/task-type-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Complex TRD Integration Tests (TASK-034)', () => {
  let complexTRD;

  // Load test data before tests
  test('Setup: Load complex TRD test data', async () => {
    const dataPath = path.join(__dirname, '../../prototype/test-data/complex-trd.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    complexTRD = JSON.parse(content);

    assert.ok(complexTRD);
    assert.strictEqual(complexTRD.id, 'TRD-COMPLEX-001');
    assert.strictEqual(complexTRD.totalTasks, 60);
  });

  describe('End-to-End Workflow Injection', () => {
    test('should inject 12+ checkpoints for complex TRD', () => {
      const taskBreakdown = transformToTaskBreakdown(complexTRD);

      // Use sprint-based checkpoints for complex TRD
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'sprint',
        trd_id: complexTRD.id
      });

      // Verify checkpoint count (13 sprints = 13 checkpoints)
      assert.ok(
        enhanced.checkpoints.length >= 12,
        `Expected at least 12 checkpoints, got ${enhanced.checkpoints.length}`
      );

      // Verify all checkpoints are properly structured
      enhanced.checkpoints.forEach((checkpoint, index) => {
        assert.ok(checkpoint.id.startsWith('TASK-CHKPT-'));
        assert.strictEqual(checkpoint.type, 'checkpoint');
        assert.ok(checkpoint.dependencies.length > 0);
        assert.ok(checkpoint.metadata);
        assert.strictEqual(checkpoint.metadata.trigger, 'sprint');
      });
    });

    test('should inject checkpoints at sprint boundaries', () => {
      const taskBreakdown = transformToTaskBreakdown(complexTRD);

      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'sprint',
        trd_id: complexTRD.id
      });

      // Count sprints
      let totalSprints = 0;
      enhanced.taskBreakdown.phases.forEach(phase => {
        totalSprints += phase.sprints?.length || 0;
      });

      // Each sprint should have a checkpoint
      assert.strictEqual(
        enhanced.checkpoints.length,
        totalSprints,
        'Should have one checkpoint per sprint'
      );

      // Verify checkpoint placement at sprint ends
      enhanced.checkpoints.forEach((checkpoint, index) => {
        assert.ok(
          checkpoint.metadata.sprintNumber,
          `Checkpoint ${index} should have sprint number`
        );
        assert.ok(
          checkpoint.metadata.phaseNumber,
          `Checkpoint ${index} should have phase number`
        );
      });
    });

    test('should inject checkpoints at phase boundaries', () => {
      const taskBreakdown = transformToTaskBreakdown(complexTRD);

      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'phase',
        trd_id: complexTRD.id
      });

      // Should have one checkpoint per phase (6 phases)
      assert.strictEqual(
        enhanced.checkpoints.length,
        6,
        'Should have one checkpoint per phase'
      );

      // Verify checkpoint metadata
      enhanced.checkpoints.forEach((checkpoint, index) => {
        assert.strictEqual(checkpoint.metadata.trigger, 'phase');
        assert.ok(checkpoint.metadata.phaseName);
        assert.ok(checkpoint.metadata.phaseNumber === index + 1);
      });
    });

    test('should generate workflow section with orchestration approach', () => {
      const trdContext = {
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      };

      const workflow = generateWorkflowSection(trdContext);

      // Verify complexity level is 'complex'
      assert.strictEqual(
        workflow.analysis.complexity.level,
        'complex',
        'Complex TRD should have complex complexity level'
      );

      // Verify orchestration approach is recommended
      assert.ok(
        workflow.analysis.executionApproach.summary.includes('Orchestrated') ||
        workflow.analysis.executionApproach.summary.includes('orchestrat'),
        'Should recommend orchestrated approach for complex TRD'
      );

      // Verify warnings are included for high complexity
      assert.ok(
        workflow.analysis.executionApproach.warnings.length > 0,
        'Should include warnings for complex TRD'
      );
    });

    test('should generate phase-level quality gates', () => {
      const trdContext = {
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      };

      const qualityGates = generateQualityGates(trdContext, {
        include_sprint_gates: true,
        include_phase_gates: true,
        include_final_gates: true
      });

      // Verify phase-level gates
      assert.ok(qualityGates.phase);
      assert.ok(qualityGates.phase.gates.length > 0);

      // Verify phase gates include integration tests
      const hasIntegrationGate = qualityGates.phase.gates.some(gate =>
        gate.type === 'integration_test' || gate.name.includes('Integration')
      );
      assert.ok(hasIntegrationGate, 'Phase gates should include integration tests');

      // Verify final gates are comprehensive
      assert.ok(qualityGates.final);
      assert.ok(qualityGates.final.gates.length >= 2);

      // Should include security audit for complex TRD
      const hasSecurityGate = qualityGates.final.gates.some(gate =>
        gate.type === 'security_scan' || gate.name.includes('Security')
      );
      assert.ok(hasSecurityGate, 'Final gates should include security audit');
    });

    test('should generate sprint-level quality gates', () => {
      const trdContext = {
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      };

      const qualityGates = generateQualityGates(trdContext, {
        include_sprint_gates: true
      });

      // Verify sprint-level gates
      assert.ok(qualityGates.sprint);
      assert.ok(qualityGates.sprint.gates.length > 0);

      // Verify sprint gates include unit tests
      const hasUnitTestGate = qualityGates.sprint.gates.some(gate =>
        gate.type === 'test_coverage' || gate.name.includes('Unit Test')
      );
      assert.ok(hasUnitTestGate, 'Sprint gates should include unit tests');
    });

    test('should generate agent delegation patterns', () => {
      const trdContext = {
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks
      };

      const delegation = generateDelegationPatterns(trdContext);

      // Verify delegation patterns
      assert.ok(delegation.patterns);
      assert.ok(delegation.patterns.length > 0);

      // Verify multiple agent types are identified
      const agentTypes = new Set(delegation.patterns.map(p => p.agentType));
      assert.ok(
        agentTypes.size >= 3,
        `Should delegate to multiple agents (found ${agentTypes.size})`
      );

      // Verify coordination needs are identified
      assert.ok(delegation.coordinationNeeds);
      assert.ok(delegation.coordinationNeeds.length > 0);
    });

    test('should generate comprehensive PR task', () => {
      const prTask = generatePrTask({
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        complexity: 'complex'
      });

      // Verify PR task structure
      assert.ok(prTask.id.startsWith('TASK-PR-'));
      assert.strictEqual(prTask.type, 'pr-creation');

      // Verify comprehensive checklist for complex TRD
      assert.ok(prTask.checklist);
      assert.ok(prTask.checklist.length >= 10, 'Complex TRD should have comprehensive checklist');

      // Verify security items in checklist
      const hasSecurityItem = prTask.checklist.some(item =>
        item.toLowerCase().includes('security')
      );
      assert.ok(hasSecurityItem, 'Checklist should include security verification');

      // Verify performance items in checklist
      const hasPerformanceItem = prTask.checklist.some(item =>
        item.toLowerCase().includes('performance')
      );
      assert.ok(hasPerformanceItem, 'Checklist should include performance verification');
    });
  });

  describe('Full Pipeline Integration', () => {
    test('should execute complete complex TRD workflow pipeline', () => {
      // Step 1: Transform to task breakdown
      const taskBreakdown = transformToTaskBreakdown(complexTRD);

      // Step 2: Inject checkpoints (sprint-based)
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'sprint',
        trd_id: complexTRD.id
      });

      // Step 3: Generate workflow section
      const workflow = generateWorkflowSection({
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      });

      // Step 4: Generate quality gates
      const qualityGates = generateQualityGates({
        trdId: complexTRD.id,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      }, {
        include_sprint_gates: true,
        include_phase_gates: true,
        include_final_gates: true
      });

      // Step 5: Generate delegation patterns
      const delegation = generateDelegationPatterns({
        trdId: complexTRD.id,
        tasks: complexTRD.tasks
      });

      // Step 6: Analyze task types
      const taskAnalysis = analyzeTaskTypes(complexTRD.tasks);

      // Step 7: Generate and inject PR task
      const prTask = generatePrTask({
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        complexity: 'complex'
      });

      const final = injectPrTask(enhanced.taskBreakdown, prTask);

      // Verify complete pipeline results
      assert.ok(enhanced.checkpoints.length >= 12, 'Should have 12+ checkpoints');
      assert.strictEqual(workflow.analysis.complexity.level, 'complex');
      assert.ok(qualityGates.sprint, 'Should have sprint-level gates');
      assert.ok(qualityGates.phase, 'Should have phase-level gates');
      assert.ok(qualityGates.final, 'Should have final gates');
      assert.ok(delegation.patterns.length > 0, 'Should have delegation patterns');
      assert.ok(taskAnalysis.distribution, 'Should have task type analysis');

      // Verify PR task is injected
      const lastPhase = final.phases[final.phases.length - 1];
      const lastSprint = lastPhase.sprints[lastPhase.sprints.length - 1];
      const hasPrTask = lastSprint.tasks.some(t => t.type === 'pr-creation');
      assert.ok(hasPrTask, 'PR task should be in final sprint');
    });

    test('should verify all checkpoints have comprehensive metadata', () => {
      const taskBreakdown = transformToTaskBreakdown(complexTRD);

      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'sprint',
        trd_id: complexTRD.id
      });

      // Validate each checkpoint has rich metadata
      enhanced.checkpoints.forEach((checkpoint, index) => {
        assert.ok(checkpoint.metadata, `Checkpoint ${index} should have metadata`);
        assert.ok(checkpoint.metadata.trigger, `Checkpoint ${index} should have trigger`);
        assert.ok(checkpoint.metadata.trdId, `Checkpoint ${index} should have TRD ID`);
        assert.ok(checkpoint.metadata.taskCount, `Checkpoint ${index} should have task count`);

        // Sprint checkpoints should have sprint and phase info
        if (checkpoint.metadata.trigger === 'sprint') {
          assert.ok(checkpoint.metadata.sprintNumber, `Checkpoint ${index} should have sprint number`);
          assert.ok(checkpoint.metadata.phaseNumber, `Checkpoint ${index} should have phase number`);
        }
      });
    });

    test('should verify workflow section contains orchestration guidance', () => {
      const workflow = generateWorkflowSection({
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      });

      const expectedContent = [
        'Complexity Assessment',
        'complex',
        'Execution Approach',
        'Agent Delegation',
        'Quality Gates',
        'phase',
        'sprint'
      ];

      expectedContent.forEach(content => {
        assert.ok(
          workflow.markdown.toLowerCase().includes(content.toLowerCase()),
          `Workflow section should include: ${content}`
        );
      });

      // Verify warnings for high complexity
      assert.ok(
        workflow.analysis.executionApproach.warnings.length > 0,
        'Should have execution warnings'
      );
    });

    test('should verify multi-agent delegation patterns', () => {
      const delegation = generateDelegationPatterns({
        trdId: complexTRD.id,
        tasks: complexTRD.tasks
      });

      // Count unique agent types
      const agentTypes = new Set(delegation.patterns.map(p => p.agentType));

      // Complex TRD should delegate to multiple specialists
      const expectedAgents = ['backend-developer', 'frontend-developer', 'infrastructure-developer'];
      expectedAgents.forEach(agent => {
        assert.ok(
          agentTypes.has(agent),
          `Should delegate to ${agent}`
        );
      });

      // Verify coordination is needed
      assert.ok(
        delegation.coordinationNeeds.length > 0,
        'Complex TRD should require coordination'
      );
    });
  });

  describe('Quality Gate Validation', () => {
    test('should define comprehensive quality gates at all levels', () => {
      const qualityGates = generateQualityGates({
        trdId: complexTRD.id,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      }, {
        include_sprint_gates: true,
        include_phase_gates: true,
        include_final_gates: true
      });

      // Sprint gates
      assert.ok(qualityGates.sprint.enabled);
      assert.ok(qualityGates.sprint.gates.length > 0);

      // Phase gates
      assert.ok(qualityGates.phase.enabled);
      assert.ok(qualityGates.phase.gates.length > 0);

      // Final gates
      assert.ok(qualityGates.final.enabled);
      assert.ok(qualityGates.final.gates.length >= 2);

      // Verify gate thresholds
      qualityGates.sprint.gates.forEach(gate => {
        if (gate.threshold) {
          assert.ok(typeof gate.threshold === 'number');
          assert.ok(gate.threshold > 0 && gate.threshold <= 100);
        }
      });
    });

    test('should include security gates for complex TRD', () => {
      const qualityGates = generateQualityGates({
        trdId: complexTRD.id,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      }, {
        include_final_gates: true
      });

      const securityGate = qualityGates.final.gates.find(gate =>
        gate.type === 'security_scan' || gate.name.toLowerCase().includes('security')
      );

      assert.ok(securityGate, 'Should include security gate');
      assert.ok(securityGate.required, 'Security gate should be required');
    });
  });

  describe('Performance Validation', () => {
    test('should generate workflow in acceptable time for complex TRD', () => {
      const startTime = Date.now();

      const taskBreakdown = transformToTaskBreakdown(complexTRD);
      injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 'sprint',
        trd_id: complexTRD.id
      });

      const duration = Date.now() - startTime;

      // Should complete in under 500ms even for complex TRD
      assert.ok(duration < 500, `Generation took ${duration}ms (expected <500ms)`);
    });

    test('should generate complete workflow section in acceptable time', () => {
      const startTime = Date.now();

      generateWorkflowSection({
        trdId: complexTRD.id,
        title: complexTRD.title,
        tasks: complexTRD.tasks,
        phases: complexTRD.phases
      });

      const duration = Date.now() - startTime;

      // Should complete in under 200ms for complex TRD
      assert.ok(duration < 200, `Workflow generation took ${duration}ms (expected <200ms)`);
    });
  });
});

/**
 * Transform flat TRD structure to hierarchical task breakdown
 *
 * @param {Object} trd - Complex TRD with flat tasks array
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

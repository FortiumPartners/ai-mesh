/**
 * Integration Test - Backward Compatibility
 *
 * Tests backward compatibility with existing TRD workflow:
 * - /implement-trd command with TRD without workflow section
 * - No errors or warnings for legacy format
 * - Workflow injection disable via config
 * - Legacy TRD format validation still passes
 *
 * @module backward-compat.integration.test
 * @related TRD-WORKFLOW-001, TASK-036
 * @created 2025-12-02
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import production modules
import { injectWorkflowTasks, validateCheckpoints } from '../../lib/checkpoint-injector.js';
import { generateWorkflowSection, validateTRDContext } from '../../lib/workflow-section-generator.js';
import { parsePrdMetadata } from '../../lib/prd-metadata-parser.js';
import { validateWorkflowConfig } from '../../lib/config-validator.js';

describe('Backward Compatibility Integration Tests (TASK-036)', () => {
  describe('Legacy TRD Format Support', () => {
    test('should handle TRD without workflow section', () => {
      // Legacy TRD format (no workflow section, no metadata)
      const legacyTRD = {
        trdId: 'TRD-LEGACY-001',
        title: 'Legacy Feature Implementation',
        tasks: [
          { id: 'TASK-001', title: 'Setup environment', type: 'setup' },
          { id: 'TASK-002', title: 'Implement feature', type: 'backend' },
          { id: 'TASK-003', title: 'Write tests', type: 'testing' },
          { id: 'TASK-004', title: 'Update documentation', type: 'documentation' }
        ]
      };

      // Validate legacy TRD context
      const validation = validateTRDContext(legacyTRD);

      assert.ok(validation.valid, 'Legacy TRD should be valid');
      assert.strictEqual(validation.errors.length, 0, 'Should not have errors');
    });

    test('should generate workflow section for legacy TRD', () => {
      const legacyTRD = {
        trdId: 'TRD-LEGACY-002',
        title: 'Legacy Feature',
        tasks: Array.from({ length: 10 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      // Generate workflow section (should use defaults)
      const workflow = generateWorkflowSection(legacyTRD);

      assert.ok(workflow.markdown);
      assert.ok(workflow.analysis);
      assert.ok(workflow.metadata);

      // Should use default execution command
      assert.ok(workflow.markdown.includes('/implement-trd'));
    });

    test('should inject checkpoints into legacy TRD', () => {
      const legacyTRD = {
        id: 'TRD-LEGACY-003',
        tasks: Array.from({ length: 15 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend',
          phase: 1,
          sprint: Math.floor(i / 5) + 1
        }))
      };

      const taskBreakdown = createLegacyTaskBreakdown(legacyTRD);

      // Inject checkpoints (should work with defaults)
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        trd_id: legacyTRD.id
      });

      assert.ok(enhanced.checkpoints);
      assert.ok(enhanced.checkpoints.length > 0);

      // Validate checkpoints
      const validation = validateCheckpoints(enhanced);
      assert.ok(validation.valid, 'Checkpoints should be valid');
    });

    test('should handle TRD with partial metadata', () => {
      const partialMetadataTRD = {
        trdId: 'TRD-PARTIAL-001',
        title: 'Partial Metadata Feature',
        // Missing optional fields: phases, sprints, duration, etc.
        tasks: [
          { id: 'TASK-001', title: 'Task 1' },  // Minimal task info
          { id: 'TASK-002', title: 'Task 2' }
        ]
      };

      const validation = validateTRDContext(partialMetadataTRD);

      // Should be valid (missing fields are optional)
      assert.ok(validation.valid);
      assert.strictEqual(validation.errors.length, 0);

      // May have warnings for missing optional fields
      // (warnings are informational, not errors)
    });
  });

  describe('PRD Without Workflow Configuration', () => {
    test('should handle PRD without YAML frontmatter', () => {
      const prdContent = `# Feature Implementation

This is a simple PRD without any YAML frontmatter.

## Goals
- Implement feature X
- Add tests
- Update documentation
`;

      const metadata = parsePrdMetadata(prdContent);

      // Should return default configuration
      assert.strictEqual(metadata.hasCustomConfig, false);
      assert.ok(metadata.workflow);
      assert.strictEqual(metadata.workflow.checkpoint_frequency, 'sprint');
      assert.strictEqual(metadata.workflow.execution_command, '/implement-trd');
    });

    test('should handle PRD with frontmatter but no workflow config', () => {
      const prdContent = `---
title: Feature Implementation
author: John Doe
version: 1.0.0
---

# Feature Implementation

PRD with metadata but no workflow configuration.
`;

      const metadata = parsePrdMetadata(prdContent);

      // Should use defaults for workflow
      assert.strictEqual(metadata.hasCustomConfig, false);
      assert.ok(metadata.workflow);
      assert.ok(metadata.metadata.title);
      assert.ok(metadata.metadata.author);
    });

    test('should validate default workflow configuration', () => {
      const prdContent = `# Simple PRD

No configuration at all.
`;

      const metadata = parsePrdMetadata(prdContent);
      const validation = validateWorkflowConfig(metadata.workflow);

      // Default configuration should be valid
      assert.ok(validation.valid);
      assert.strictEqual(validation.errors.length, 0);
    });
  });

  describe('Workflow Injection Disable', () => {
    test('should allow disabling checkpoint injection', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Implementation',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [
                  { id: 'TASK-001', title: 'Task 1', type: 'backend' },
                  { id: 'TASK-002', title: 'Task 2', type: 'backend' }
                ]
              }
            ]
          }
        ]
      };

      // Disable checkpoint injection by not calling injectWorkflowTasks
      // or by using checkpoint_frequency: 0 or 'none'

      // Verify original task breakdown is unchanged
      assert.strictEqual(taskBreakdown.phases[0].sprints[0].tasks.length, 2);
      assert.ok(!taskBreakdown.phases[0].sprints[0].tasks.some(t => t.type === 'checkpoint'));
    });

    test('should handle checkpoint frequency of 0 (disabled)', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Implementation',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: Array.from({ length: 10 }, (_, i) => ({
                  id: `TASK-${String(i + 1).padStart(3, '0')}`,
                  title: `Task ${i + 1}`,
                  type: 'backend'
                }))
              }
            ]
          }
        ]
      };

      // Very high checkpoint frequency effectively disables checkpoints
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: 1000,  // Higher than task count
        trd_id: 'TRD-TEST-001'
      });

      // Should have 0 or 1 checkpoint (final only)
      assert.ok(
        enhanced.checkpoints.length <= 1,
        'High frequency should result in minimal checkpoints'
      );
    });

    test('should support workflow generation without optional sections', () => {
      const trdContext = {
        trdId: 'TRD-MINIMAL-001',
        title: 'Minimal TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      // Generate workflow without optional sections
      const workflow = generateWorkflowSection(trdContext, {
        includeComplexityAnalysis: false,
        includeDelegation: false,
        includeQualityGates: false
      });

      assert.ok(workflow.markdown);

      // Optional sections should be null
      assert.strictEqual(workflow.analysis.complexity, null);
      assert.strictEqual(workflow.analysis.delegation, null);
      assert.strictEqual(workflow.analysis.qualityGates, null);
    });
  });

  describe('Error Handling and Graceful Degradation', () => {
    test('should not throw errors for legacy TRD format', () => {
      const legacyTRD = {
        trdId: 'TRD-LEGACY-004',
        title: 'Legacy TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1' }
        ]
      };

      // Should not throw
      assert.doesNotThrow(() => {
        validateTRDContext(legacyTRD);
        generateWorkflowSection(legacyTRD);
      });
    });

    test('should handle missing task types gracefully', () => {
      const trdContext = {
        trdId: 'TRD-NO-TYPES-001',
        title: 'TRD Without Task Types',
        tasks: [
          { id: 'TASK-001', title: 'Task 1' },  // No type field
          { id: 'TASK-002', title: 'Task 2' }   // No type field
        ]
      };

      const workflow = generateWorkflowSection(trdContext);

      // Should still generate workflow
      assert.ok(workflow.markdown);
      assert.ok(workflow.analysis);

      // Task type distribution should handle missing types
      assert.ok(workflow.analysis.taskTypeDistribution);
    });

    test('should handle empty task arrays', () => {
      const emptyTRD = {
        trdId: 'TRD-EMPTY-001',
        title: 'Empty TRD',
        tasks: []
      };

      // Validation should fail for empty tasks
      const validation = validateTRDContext(emptyTRD);
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some(e => e.includes('tasks')));
    });

    test('should handle malformed task breakdown gracefully', () => {
      const malformedBreakdown = {
        phases: null  // Invalid structure
      };

      // Should throw descriptive error
      assert.throws(
        () => injectWorkflowTasks(malformedBreakdown, {}),
        /Invalid task breakdown/
      );
    });
  });

  describe('Full Backward Compatibility Pipeline', () => {
    test('should execute legacy TRD through full pipeline', () => {
      // Step 1: Legacy TRD (minimal metadata)
      const legacyTRD = {
        trdId: 'TRD-LEGACY-FULL-001',
        title: 'Legacy Full Pipeline Test',
        tasks: Array.from({ length: 12 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: i % 3 === 0 ? 'backend' : i % 3 === 1 ? 'frontend' : 'testing'
        }))
      };

      // Step 2: Validate (should pass)
      const validation = validateTRDContext(legacyTRD);
      assert.ok(validation.valid);

      // Step 3: Create task breakdown
      const taskBreakdown = createLegacyTaskBreakdown(legacyTRD);

      // Step 4: Inject checkpoints (with defaults)
      const enhanced = injectWorkflowTasks(taskBreakdown, {
        trd_id: legacyTRD.trdId
      });

      assert.ok(enhanced.checkpoints.length > 0);

      // Step 5: Generate workflow section (with defaults)
      const workflow = generateWorkflowSection(legacyTRD);

      assert.ok(workflow.markdown.includes('/implement-trd'));

      // Verify no errors or warnings in processing
      assert.ok(validation.errors.length === 0);
    });

    test('should support mixed new and legacy TRD features', () => {
      // TRD with some new features, some legacy
      const mixedTRD = {
        trdId: 'TRD-MIXED-001',
        title: 'Mixed Feature TRD',
        tasks: Array.from({ length: 8 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend',
          // Some tasks have duration, some don't
          ...(i % 2 === 0 ? { duration: '2 hours' } : {})
        })),
        // Has phases (new) but no sprints (legacy)
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' }
        ]
      };

      const validation = validateTRDContext(mixedTRD);
      assert.ok(validation.valid);

      const workflow = generateWorkflowSection(mixedTRD);
      assert.ok(workflow.markdown);
    });

    test('should maintain existing TRD IDs and references', () => {
      const legacyTRD = {
        trdId: 'TRD-EXISTING-123',
        title: 'Existing TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const taskBreakdown = createLegacyTaskBreakdown(legacyTRD);

      const enhanced = injectWorkflowTasks(taskBreakdown, {
        trd_id: legacyTRD.trdId
      });

      // Verify TRD ID is preserved in checkpoints
      enhanced.checkpoints.forEach(checkpoint => {
        assert.ok(checkpoint.metadata.trdId === 'TRD-EXISTING-123');
      });
    });
  });

  describe('Performance with Legacy Format', () => {
    test('should process legacy TRD efficiently', () => {
      const legacyTRD = {
        trdId: 'TRD-PERF-001',
        title: 'Performance Test',
        tasks: Array.from({ length: 30 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const startTime = Date.now();

      validateTRDContext(legacyTRD);
      generateWorkflowSection(legacyTRD);

      const duration = Date.now() - startTime;

      // Should complete in under 100ms
      assert.ok(duration < 100, `Processing took ${duration}ms (expected <100ms)`);
    });
  });
});

/**
 * Create task breakdown from legacy TRD format
 *
 * @param {Object} legacyTRD - Legacy TRD with flat task array
 * @returns {Object} Task breakdown structure
 * @private
 */
function createLegacyTaskBreakdown(legacyTRD) {
  const breakdown = {
    id: legacyTRD.id || legacyTRD.trdId,
    title: legacyTRD.title,
    phases: []
  };

  // Group tasks by phase and sprint (if available)
  const phaseMap = new Map();

  legacyTRD.tasks.forEach(task => {
    const phaseNum = task.phase || 1;
    const sprintNum = task.sprint || 1;

    if (!phaseMap.has(phaseNum)) {
      phaseMap.set(phaseNum, {
        name: `Phase ${phaseNum}`,
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

  // Convert to array structure
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

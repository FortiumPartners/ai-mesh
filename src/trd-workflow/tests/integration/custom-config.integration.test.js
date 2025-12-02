/**
 * Integration Test - PRD with Custom Workflow Configuration
 *
 * Tests TRD generation with PRD including workflow_config metadata:
 * - Checkpoint frequency override (every 3 tasks instead of default)
 * - Execution command preference honored
 * - Custom quality gates integrated
 * - Commit scope forced across all templates
 *
 * @module custom-config.integration.test
 * @related TRD-WORKFLOW-001, TASK-035
 * @created 2025-12-02
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import production modules
import { parsePrdMetadata, extractWorkflowConfig } from '../../lib/prd-metadata-parser.js';
import { applyConfigOverrides } from '../../lib/config-override-applier.js';
import { injectWorkflowTasks } from '../../lib/checkpoint-injector.js';
import { generateWorkflowSection } from '../../lib/workflow-section-generator.js';
import { generateCommitTemplates } from '../../lib/commit-template-generator.js';
import { validateWorkflowConfig } from '../../lib/config-validator.js';

describe('Custom Configuration Integration Tests (TASK-035)', () => {
  describe('PRD Metadata Parsing with Custom Workflow', () => {
    test('should parse PRD with custom checkpoint frequency', () => {
      const prdContent = `---
title: Custom Feature Implementation
workflow:
  checkpoint_frequency: 3
  execution_command: /implement-trd
  git_workflow:
    commit_conventions:
      require_scope: true
      forced_scope: custom-feature
---

# Custom Feature Implementation

This PRD demonstrates custom workflow configuration.
`;

      const metadata = parsePrdMetadata(prdContent);

      assert.ok(metadata.hasCustomConfig);
      assert.strictEqual(metadata.workflow.checkpoint_frequency, 3);
      assert.strictEqual(metadata.workflow.execution_command, '/implement-trd');
      assert.strictEqual(
        metadata.workflow.git_workflow.commit_conventions.forced_scope,
        'custom-feature'
      );
    });

    test('should parse PRD with custom quality gates', () => {
      const prdContent = `---
title: High Security Feature
workflow:
  checkpoint_frequency: sprint
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Security Scan
          type: security_scan
          required: true
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 90
          required: true
    final:
      enabled: true
      gates:
        - name: Penetration Testing
          type: security_test
          required: true
        - name: Full Coverage
          type: test_coverage
          threshold: 95
          required: true
---

# High Security Feature
`;

      const metadata = parsePrdMetadata(prdContent);

      assert.ok(metadata.hasCustomConfig);
      assert.ok(metadata.workflow.quality_gates.sprint.enabled);
      assert.strictEqual(metadata.workflow.quality_gates.sprint.gates.length, 2);
      assert.strictEqual(metadata.workflow.quality_gates.final.gates.length, 2);

      // Verify custom thresholds
      const unitTestGate = metadata.workflow.quality_gates.sprint.gates.find(
        g => g.type === 'test_coverage'
      );
      assert.strictEqual(unitTestGate.threshold, 90);
    });

    test('should parse PRD with custom execution command', () => {
      const prdContent = `---
title: Orchestrated Feature
workflow:
  checkpoint_frequency: phase
  execution_command: /orchestrate-tasks
  delegation:
    enable_auto_delegation: true
    patterns:
      - agent: backend-developer
        task_pattern: "API|backend|service"
      - agent: frontend-developer
        task_pattern: "UI|frontend|component"
---

# Orchestrated Feature
`;

      const metadata = parsePrdMetadata(prdContent);

      assert.strictEqual(metadata.workflow.execution_command, '/orchestrate-tasks');
      assert.ok(metadata.workflow.delegation.enable_auto_delegation);
      assert.strictEqual(metadata.workflow.delegation.patterns.length, 2);
    });
  });

  describe('Configuration Override Application', () => {
    test('should apply checkpoint frequency override', () => {
      const baseTRDContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: Array.from({ length: 15 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const workflowConfig = {
        checkpoint_frequency: 3  // Every 3 tasks instead of default
      };

      const enhanced = applyConfigOverrides(baseTRDContext, workflowConfig);

      // Verify override was applied
      assert.strictEqual(enhanced._overrides.checkpoint_frequency, 3);

      // Transform to task breakdown and inject checkpoints
      const taskBreakdown = createSimpleTaskBreakdown(enhanced.tasks);

      const result = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: enhanced._overrides.checkpoint_frequency,
        trd_id: enhanced.trdId
      });

      // With 15 tasks and frequency of 3:
      // Checkpoint 1: after task 3
      // Checkpoint 2: after task 6
      // Checkpoint 3: after task 9
      // Checkpoint 4: after task 12
      // Checkpoint 5: after task 15 (final)
      assert.strictEqual(result.checkpoints.length, 5);
    });

    test('should apply execution command preference', () => {
      const baseTRDContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: Array.from({ length: 30 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const workflowConfig = {
        execution_command: '/custom-execute'
      };

      const enhanced = applyConfigOverrides(baseTRDContext, workflowConfig);

      // Generate workflow section with custom command
      const workflow = generateWorkflowSection(enhanced, {
        executionCommand: enhanced._overrides.execution_command
      });

      // Verify custom command is used
      assert.ok(workflow.markdown.includes('/custom-execute'));
    });

    test('should apply custom quality gates', () => {
      const baseTRDContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: Array.from({ length: 10 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const workflowConfig = {
        quality_gates: {
          sprint: {
            enabled: true,
            gates: [
              {
                name: 'Custom Security Scan',
                type: 'security_scan',
                required: true
              }
            ]
          }
        }
      };

      const enhanced = applyConfigOverrides(baseTRDContext, workflowConfig);

      // Verify custom gates were applied
      assert.ok(enhanced._overrides.quality_gates);
      assert.ok(enhanced._overrides.quality_gates.sprint.gates.length > 0);
    });

    test('should force commit scope across all templates', () => {
      const baseTRDContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: Array.from({ length: 5 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const workflowConfig = {
        git_workflow: {
          commit_conventions: {
            require_scope: true,
            forced_scope: 'custom-feature'
          }
        }
      };

      const enhanced = applyConfigOverrides(baseTRDContext, workflowConfig);

      // Generate commit templates
      const templates = generateCommitTemplates(enhanced, {
        forcedScope: enhanced._overrides?.git_workflow?.commit_conventions?.forced_scope
      });

      // Verify all templates use forced scope
      templates.templates.forEach(template => {
        if (template.scope) {
          assert.strictEqual(
            template.scope,
            'custom-feature',
            'All templates should use forced scope'
          );
        }
      });
    });
  });

  describe('Full Pipeline with Custom Configuration', () => {
    test('should execute complete pipeline with PRD configuration', () => {
      // Step 1: Parse PRD with custom config
      const prdContent = `---
title: Custom Configured Feature
workflow:
  checkpoint_frequency: 4
  execution_command: /implement-trd
  git_workflow:
    commit_conventions:
      require_scope: true
      forced_scope: custom-config
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Tests
          type: test_coverage
          threshold: 85
          required: true
---

# Custom Configured Feature
`;

      const metadata = parsePrdMetadata(prdContent);
      const workflowConfig = extractWorkflowConfig(metadata);

      // Step 2: Validate configuration
      const validation = validateWorkflowConfig(workflowConfig);
      assert.ok(validation.valid, 'Configuration should be valid');

      // Step 3: Apply overrides to TRD context
      const baseTRDContext = {
        trdId: 'TRD-CUSTOM-001',
        title: 'Custom Configured Feature',
        tasks: Array.from({ length: 16 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const enhanced = applyConfigOverrides(baseTRDContext, workflowConfig);

      // Step 4: Create task breakdown and inject checkpoints
      const taskBreakdown = createSimpleTaskBreakdown(enhanced.tasks);

      const checkpointResult = injectWorkflowTasks(taskBreakdown, {
        checkpoint_frequency: enhanced._overrides.checkpoint_frequency,
        trd_id: enhanced.trdId
      });

      // Verify checkpoint frequency (every 4 tasks for 16 tasks = 4 checkpoints)
      assert.strictEqual(checkpointResult.checkpoints.length, 4);

      // Step 5: Generate workflow section
      const workflow = generateWorkflowSection(enhanced, {
        executionCommand: enhanced._overrides.execution_command
      });

      assert.ok(workflow.markdown.includes('/implement-trd'));

      // Step 6: Generate commit templates with forced scope
      const templates = generateCommitTemplates(enhanced, {
        forcedScope: enhanced._overrides.git_workflow.commit_conventions.forced_scope
      });

      templates.templates.forEach(template => {
        if (template.scope) {
          assert.strictEqual(template.scope, 'custom-config');
        }
      });
    });

    test('should validate all configuration overrides are honored', () => {
      const prdContent = `---
title: Comprehensive Custom Config
workflow:
  checkpoint_frequency: 5
  execution_command: /orchestrate-tasks
  git_workflow:
    commit_conventions:
      require_scope: true
      forced_scope: comprehensive
      require_body: true
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: High Coverage
          type: test_coverage
          threshold: 95
          required: true
  delegation:
    enable_auto_delegation: true
---

# Comprehensive Custom Config
`;

      const metadata = parsePrdMetadata(prdContent);
      const workflowConfig = extractWorkflowConfig(metadata);

      const baseTRDContext = {
        trdId: 'TRD-COMP-001',
        title: 'Comprehensive Feature',
        tasks: Array.from({ length: 20 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: 'backend'
        }))
      };

      const enhanced = applyConfigOverrides(baseTRDContext, workflowConfig);

      // Verify all overrides
      assert.strictEqual(enhanced._overrides.checkpoint_frequency, 5);
      assert.strictEqual(enhanced._overrides.execution_command, '/orchestrate-tasks');
      assert.strictEqual(
        enhanced._overrides.git_workflow.commit_conventions.forced_scope,
        'comprehensive'
      );
      assert.strictEqual(
        enhanced._overrides.git_workflow.commit_conventions.require_body,
        true
      );
      assert.strictEqual(
        enhanced._overrides.quality_gates.sprint.gates[0].threshold,
        95
      );
      assert.ok(enhanced._overrides.delegation.enable_auto_delegation);
    });

    test('should handle configuration with missing optional fields', () => {
      const prdContent = `---
title: Minimal Custom Config
workflow:
  checkpoint_frequency: 7
---

# Minimal Custom Config
`;

      const metadata = parsePrdMetadata(prdContent);
      const workflowConfig = extractWorkflowConfig(metadata);

      // Should merge with defaults
      assert.strictEqual(workflowConfig.checkpoint_frequency, 7);
      assert.ok(workflowConfig.execution_command); // Should have default
      assert.ok(workflowConfig.git_workflow); // Should have defaults
      assert.ok(workflowConfig.quality_gates); // Should have defaults
    });
  });

  describe('Configuration Validation', () => {
    test('should validate valid custom configuration', () => {
      const config = {
        checkpoint_frequency: 5,
        execution_command: '/implement-trd',
        git_workflow: {
          commit_conventions: {
            format: 'conventional',
            require_scope: true,
            forced_scope: 'feature'
          }
        }
      };

      const validation = validateWorkflowConfig(config);

      assert.ok(validation.valid);
      assert.strictEqual(validation.errors.length, 0);
    });

    test('should detect invalid checkpoint frequency', () => {
      const config = {
        checkpoint_frequency: 'invalid-value',
        execution_command: '/implement-trd'
      };

      const validation = validateWorkflowConfig(config);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
      assert.ok(
        validation.errors.some(e => e.includes('checkpoint_frequency')),
        'Should report checkpoint frequency error'
      );
    });

    test('should detect invalid quality gate configuration', () => {
      const config = {
        checkpoint_frequency: 'sprint',
        quality_gates: {
          sprint: {
            enabled: true,
            gates: [
              {
                name: 'Invalid Gate',
                type: 'invalid_type',  // Invalid type
                threshold: 150  // Invalid threshold (>100)
              }
            ]
          }
        }
      };

      const validation = validateWorkflowConfig(config);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });

    test('should warn about unusual but valid configurations', () => {
      const config = {
        checkpoint_frequency: 50,  // Very high frequency
        execution_command: '/implement-trd'
      };

      const validation = validateWorkflowConfig(config);

      // Should be valid but have warnings
      assert.ok(validation.valid);
      assert.ok(validation.warnings.length > 0);
      assert.ok(
        validation.warnings.some(w => w.includes('frequency') || w.includes('50')),
        'Should warn about high checkpoint frequency'
      );
    });
  });

  describe('Performance with Custom Configuration', () => {
    test('should handle custom configuration efficiently', () => {
      const prdContent = `---
title: Performance Test
workflow:
  checkpoint_frequency: 3
  execution_command: /implement-trd
  git_workflow:
    commit_conventions:
      forced_scope: perf-test
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Tests
          type: test_coverage
          threshold: 80
---

# Performance Test
`;

      const startTime = Date.now();

      const metadata = parsePrdMetadata(prdContent);
      const workflowConfig = extractWorkflowConfig(metadata);
      validateWorkflowConfig(workflowConfig);

      const duration = Date.now() - startTime;

      // Should complete in under 50ms
      assert.ok(duration < 50, `Configuration processing took ${duration}ms (expected <50ms)`);
    });
  });
});

/**
 * Create simple task breakdown structure for testing
 *
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Task breakdown with single phase and sprint
 * @private
 */
function createSimpleTaskBreakdown(tasks) {
  return {
    phases: [
      {
        name: 'Implementation',
        number: 1,
        sprints: [
          {
            name: 'Sprint 1',
            number: 1,
            tasks: tasks
          }
        ]
      }
    ]
  };
}

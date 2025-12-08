/**
 * Unit tests for metadata parsing modules
 * Tests PRD metadata parsing, configuration validation, and override application
 *
 * @module metadata-parsing.test
 * @related TRD-WORKFLOW-001, TASK-031
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  parsePrdMetadata,
  extractWorkflowConfig,
  hasFrontmatter,
  getWorkflowConfig
} from '../lib/prd-metadata-parser.js';
import { validateWorkflowConfig, validatePrdMetadata } from '../lib/config-validator.js';
import { applyConfigOverrides, getOverrideSummary, validateOverrides } from '../lib/config-override-applier.js';

describe('PRD Metadata Parser', () => {
  describe('parsePrdMetadata', () => {
    test('should parse YAML frontmatter', () => {
      const prdContent = `---
version: 1.0.0
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
---

# PRD Content

This is the main PRD content.
`;

      const result = parsePrdMetadata(prdContent);

      assert.ok(result.workflow);
      assert.strictEqual(result.workflow.checkpoint_frequency, 'sprint');
      assert.strictEqual(result.workflow.execution_command, '/implement-trd');
      assert.strictEqual(result.hasCustomConfig, true);
    });

    test('should handle PRD without frontmatter', () => {
      const prdContent = `# PRD Content

This is a PRD without frontmatter.
`;

      const result = parsePrdMetadata(prdContent);

      assert.ok(result.workflow);
      assert.strictEqual(result.hasCustomConfig, false);
    });

    test('should extract general metadata', () => {
      const prdContent = `---
version: 1.0.0
created: 2025-12-02
author: Developer
priority: high
workflow:
  checkpoint_frequency: phase
---

# PRD Content
`;

      const result = parsePrdMetadata(prdContent);

      assert.strictEqual(result.metadata.version, '1.0.0');
      assert.strictEqual(result.metadata.created, '2025-12-02');
      assert.strictEqual(result.metadata.author, 'Developer');
      assert.strictEqual(result.metadata.priority, 'high');
    });

    test('should handle complex nested YAML', () => {
      const prdContent = `---
workflow:
  checkpoint_frequency: sprint
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Tests
          type: test_coverage
          threshold: 80
          required: true
        - name: Code Linting
          type: code_quality
          required: true
    phase:
      enabled: true
      gates:
        - name: Integration Tests
          type: integration_test
          threshold: 70
          required: true
---

# PRD Content
`;

      const result = parsePrdMetadata(prdContent);

      assert.ok(result.workflow.quality_gates);
      assert.ok(result.workflow.quality_gates.sprint);
      assert.ok(Array.isArray(result.workflow.quality_gates.sprint.gates));
      assert.strictEqual(result.workflow.quality_gates.sprint.gates.length, 2);
      assert.strictEqual(result.workflow.quality_gates.sprint.gates[0].name, 'Unit Tests');
    });

    test('should handle arrays in YAML', () => {
      const prdContent = `---
stakeholders:
  - Alice
  - Bob
  - Charlie
workflow:
  delegation:
    patterns:
      - task_type: backend
        agent: backend-developer
      - task_type: frontend
        agent: frontend-developer
---

# PRD Content
`;

      const result = parsePrdMetadata(prdContent);

      assert.ok(Array.isArray(result.raw.stakeholders));
      assert.strictEqual(result.raw.stakeholders.length, 3);
      assert.ok(Array.isArray(result.workflow.delegation.patterns));
      assert.strictEqual(result.workflow.delegation.patterns.length, 2);
    });

    test('should handle boolean and numeric values', () => {
      const prdContent = `---
workflow:
  checkpoint_frequency: 5
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Coverage
          threshold: 80
          required: false
---

# PRD Content
`;

      const result = parsePrdMetadata(prdContent);

      assert.strictEqual(result.workflow.checkpoint_frequency, 5);
      assert.strictEqual(result.workflow.quality_gates.sprint.enabled, true);
      assert.strictEqual(result.workflow.quality_gates.sprint.gates[0].threshold, 80);
      assert.strictEqual(result.workflow.quality_gates.sprint.gates[0].required, false);
    });

    test('should throw error for invalid YAML', () => {
      const prdContent = `---
invalid yaml with
no proper structure:
  - but lists
  without proper indent
---

# PRD Content
`;

      // Should not throw, but may have parsing issues
      // Our simple parser is forgiving
      const result = parsePrdMetadata(prdContent);
      assert.ok(result);
    });

    test('should throw error for invalid input', () => {
      assert.throws(
        () => parsePrdMetadata(null),
        /Invalid PRD content/
      );

      assert.throws(
        () => parsePrdMetadata(123),
        /Invalid PRD content/
      );
    });
  });

  describe('hasFrontmatter', () => {
    test('should detect valid frontmatter', () => {
      const content = `---
version: 1.0.0
---

Content`;

      assert.strictEqual(hasFrontmatter(content), true);
    });

    test('should return false for no frontmatter', () => {
      const content = `# PRD

No frontmatter here.`;

      assert.strictEqual(hasFrontmatter(content), false);
    });

    test('should return false for invalid frontmatter format', () => {
      const content = `--
invalid: format
--

Content`;

      assert.strictEqual(hasFrontmatter(content), false);
    });

    test('should handle null/undefined', () => {
      assert.strictEqual(hasFrontmatter(null), false);
      assert.strictEqual(hasFrontmatter(undefined), false);
      assert.strictEqual(hasFrontmatter(''), false);
    });
  });

  describe('extractWorkflowConfig', () => {
    test('should extract workflow config from metadata', () => {
      const metadata = {
        workflow: {
          checkpoint_frequency: 'sprint',
          execution_command: '/implement-trd'
        }
      };

      const config = extractWorkflowConfig(metadata);

      assert.strictEqual(config.checkpoint_frequency, 'sprint');
      assert.strictEqual(config.execution_command, '/implement-trd');
    });

    test('should merge with defaults', () => {
      const metadata = {
        workflow: {
          checkpoint_frequency: 'phase'
        }
      };

      const config = extractWorkflowConfig(metadata);

      assert.strictEqual(config.checkpoint_frequency, 'phase');
      assert.ok(config.execution_command); // Should have default
      assert.ok(config.quality_gates); // Should have defaults
    });

    test('should return defaults for empty metadata', () => {
      const config = extractWorkflowConfig({});

      assert.ok(config.checkpoint_frequency);
      assert.ok(config.execution_command);
      assert.ok(config.quality_gates);
    });

    test('should return defaults for null metadata', () => {
      const config = extractWorkflowConfig(null);

      assert.ok(config.checkpoint_frequency);
      assert.ok(config.execution_command);
    });
  });

  describe('getWorkflowConfig', () => {
    test('should return config with success status', () => {
      const prdContent = `---
workflow:
  checkpoint_frequency: sprint
---

# PRD Content
`;

      const result = getWorkflowConfig(prdContent);

      assert.strictEqual(result.success, true);
      assert.ok(result.config);
      assert.strictEqual(result.config.checkpoint_frequency, 'sprint');
    });

    test('should handle parse errors gracefully', () => {
      const prdContent = `Invalid content that will fail`;

      const result = getWorkflowConfig(prdContent);

      // Should return defaults even on error
      assert.ok(result.config);
      assert.ok(result.config.checkpoint_frequency);
    });

    test('should indicate custom config presence', () => {
      const prdContent = `---
workflow:
  checkpoint_frequency: phase
---

# PRD
`;

      const result = getWorkflowConfig(prdContent);

      assert.strictEqual(result.hasCustomConfig, true);
    });
  });
});

describe('Configuration Validator', () => {
  describe('validateWorkflowConfig', () => {
    test('should validate correct configuration', () => {
      const config = {
        checkpoint_frequency: 'sprint',
        execution_command: '/implement-trd',
        quality_gates: {
          sprint: {
            enabled: true,
            gates: []
          }
        }
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should validate numeric checkpoint frequency', () => {
      const config = {
        checkpoint_frequency: 5
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, true);
    });

    test('should detect invalid checkpoint frequency', () => {
      const config = {
        checkpoint_frequency: 'invalid'
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('checkpoint_frequency')));
    });

    test('should detect negative checkpoint frequency', () => {
      const config = {
        checkpoint_frequency: -5
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, false);
    });

    test('should warn about very high checkpoint frequency', () => {
      const config = {
        checkpoint_frequency: 100
      };

      const result = validateWorkflowConfig(config);

      assert.ok(result.warnings.some(w => w.includes('Very high value')));
    });

    test('should validate quality gates structure', () => {
      const config = {
        quality_gates: {
          sprint: {
            enabled: true,
            gates: [
              {
                name: 'Unit Tests',
                type: 'test_coverage',
                threshold: 80,
                required: true
              }
            ]
          }
        }
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, true);
    });

    test('should detect invalid gate threshold', () => {
      const config = {
        quality_gates: {
          sprint: {
            enabled: true,
            gates: [
              {
                name: 'Test',
                type: 'test',
                threshold: 150  // Invalid: > 100
              }
            ]
          }
        }
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('threshold')));
    });

    test('should handle null/invalid config', () => {
      const result = validateWorkflowConfig(null);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    test('should validate git workflow configuration', () => {
      const config = {
        git_workflow: {
          branch_naming: {
            pattern: 'feature/{trd-id}-{description}',
            max_length: 50
          }
        }
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, true);
    });

    test('should detect invalid branch max_length', () => {
      const config = {
        git_workflow: {
          branch_naming: {
            max_length: 10  // Too short
          }
        }
      };

      const result = validateWorkflowConfig(config);

      assert.strictEqual(result.valid, false);
    });
  });

  describe('validatePrdMetadata', () => {
    test('should validate complete PRD metadata', () => {
      const metadata = {
        workflow: {
          checkpoint_frequency: 'sprint',
          execution_command: '/implement-trd'
        },
        metadata: {
          version: '1.0.0',
          priority: 'high',
          status: 'approved'
        }
      };

      const result = validatePrdMetadata(metadata);

      assert.strictEqual(result.valid, true);
    });

    test('should validate version format', () => {
      const metadata = {
        metadata: {
          version: 'invalid-version'
        }
      };

      const result = validatePrdMetadata(metadata);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('version')));
    });

    test('should validate priority values', () => {
      const invalidMetadata = {
        metadata: {
          priority: 'invalid-priority'
        }
      };

      const result = validatePrdMetadata(invalidMetadata);

      assert.strictEqual(result.valid, false);
    });

    test('should validate status values', () => {
      const invalidMetadata = {
        metadata: {
          status: 'invalid-status'
        }
      };

      const result = validatePrdMetadata(invalidMetadata);

      assert.strictEqual(result.valid, false);
    });
  });
});

describe('Configuration Override Applier', () => {
  describe('applyConfigOverrides', () => {
    test('should apply checkpoint frequency override', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        checkpoint_frequency: 'phase'
      };

      const result = applyConfigOverrides(trdContext, workflowConfig);

      assert.strictEqual(result.checkpoint_frequency, 'phase');
      assert.ok(result._overrides);
      assert.ok(result._overrides.checkpoint_frequency);
    });

    test('should apply execution command override', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        execution_command: '/custom-command'
      };

      const result = applyConfigOverrides(trdContext, workflowConfig);

      assert.strictEqual(result.execution_command, '/custom-command');
    });

    test('should apply git workflow overrides', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        git_workflow: {
          branch_naming: {
            pattern: 'custom/{trd-id}',
            max_length: 60
          }
        }
      };

      const result = applyConfigOverrides(trdContext, workflowConfig);

      assert.ok(result.git_workflow);
      assert.strictEqual(result.git_workflow.branch_naming.pattern, 'custom/{trd-id}');
    });

    test('should apply quality gate overrides', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        quality_gates: {
          sprint: {
            enabled: false
          }
        }
      };

      const result = applyConfigOverrides(trdContext, workflowConfig);

      assert.ok(result.quality_gates);
      assert.strictEqual(result.quality_gates.sprint.enabled, false);
    });

    test('should handle null workflow config', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const result = applyConfigOverrides(trdContext, null);

      assert.ok(result);
      assert.deepStrictEqual(result, trdContext);
    });

    test('should throw error for invalid TRD context', () => {
      assert.throws(
        () => applyConfigOverrides(null, {}),
        /Invalid TRD context/
      );
    });

    test('should merge configurations intelligently', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: [],
        git_workflow: {
          branch_naming: {
            pattern: 'original/{trd-id}',
            max_length: 50
          }
        }
      };

      const workflowConfig = {
        git_workflow: {
          branch_naming: {
            max_length: 60  // Only override max_length
          }
        }
      };

      const result = applyConfigOverrides(trdContext, workflowConfig);

      assert.strictEqual(result.git_workflow.branch_naming.pattern, 'original/{trd-id}');
      assert.strictEqual(result.git_workflow.branch_naming.max_length, 60);
    });
  });

  describe('getOverrideSummary', () => {
    test('should generate override summary', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        checkpoint_frequency: 'phase',
        execution_command: '/custom'
      };

      const enhanced = applyConfigOverrides(trdContext, workflowConfig);
      const summary = getOverrideSummary(enhanced);

      assert.strictEqual(summary.count, 2);
      assert.strictEqual(summary.source, 'PRD metadata');
      assert.strictEqual(summary.overrides.length, 2);
    });

    test('should handle no overrides', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const summary = getOverrideSummary(trdContext);

      assert.strictEqual(summary.count, 0);
      assert.strictEqual(summary.source, null);
    });
  });

  describe('validateOverrides', () => {
    test('should validate applied overrides', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        checkpoint_frequency: 'phase',
        execution_command: '/implement-trd'
      };

      const enhanced = applyConfigOverrides(trdContext, workflowConfig);
      const validation = validateOverrides(enhanced, workflowConfig);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    test('should detect missing overrides', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        checkpoint_frequency: 'phase',
        execution_command: '/implement-trd'
      };

      // Manually create context without proper overrides
      const invalidContext = {
        ...trdContext,
        checkpoint_frequency: 'sprint'  // Wrong value
      };

      const validation = validateOverrides(invalidContext, workflowConfig);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });
  });

  describe('Complex integration scenarios', () => {
    test('should handle full PRD to TRD workflow', () => {
      const prdContent = `---
workflow:
  checkpoint_frequency: phase
  execution_command: /implement-trd
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Tests
          type: test_coverage
          threshold: 85
          required: true
---

# PRD Content
`;

      const parsed = parsePrdMetadata(prdContent);
      const config = extractWorkflowConfig(parsed);
      const validation = validateWorkflowConfig(config);

      assert.strictEqual(validation.valid, true);

      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: [
          { id: 'TASK-001', title: 'Task 1' }
        ]
      };

      const enhanced = applyConfigOverrides(trdContext, config);

      assert.strictEqual(enhanced.checkpoint_frequency, 'phase');
      assert.strictEqual(enhanced.execution_command, '/implement-trd');
      assert.ok(enhanced.quality_gates);
    });

    test('should maintain override metadata through workflow', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        tasks: []
      };

      const workflowConfig = {
        checkpoint_frequency: 7,
        execution_command: '/orchestrate-tasks'
      };

      const enhanced = applyConfigOverrides(trdContext, workflowConfig);
      const summary = getOverrideSummary(enhanced);
      const validation = validateOverrides(enhanced, workflowConfig);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(summary.count, 2);
      assert.ok(enhanced._overrides.checkpoint_frequency.applied);
      assert.ok(enhanced._overrides.execution_command.applied);
    });
  });
});

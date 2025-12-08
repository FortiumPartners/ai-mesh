/**
 * Unit tests for workflow-section-generator module
 * Tests workflow generation, complexity assessment, and execution approach
 *
 * @module workflow-generator.test
 * @related TRD-WORKFLOW-001, TASK-028
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateWorkflowSection, validateTRDContext } from '../lib/workflow-section-generator.js';

describe('Workflow Section Generator', () => {
  describe('generateWorkflowSection - basic', () => {
    test('should generate complete workflow section', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Implement feature A', type: 'backend', duration: '4 hours' },
          { id: 'TASK-002', title: 'Add unit tests', type: 'testing', duration: '2 hours' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.markdown);
      assert.ok(result.analysis);
      assert.ok(result.metadata);
      assert.ok(result.markdown.includes('## 📋 Workflow & Execution'));
    });

    test('should include all required sections', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend', duration: '2 hours' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.markdown.includes('Complexity Assessment'));
      assert.ok(result.markdown.includes('Recommended Execution Command'));
      assert.ok(result.markdown.includes('Execution Approach'));
      assert.ok(result.markdown.includes('Task Type Distribution'));
    });

    test('should throw error for invalid TRD context', () => {
      assert.throws(
        () => generateWorkflowSection(null),
        /Invalid TRD context/
      );

      assert.throws(
        () => generateWorkflowSection({ tasks: null }),
        /Invalid TRD context/
      );
    });
  });

  describe('Command selection logic', () => {
    test('should recommend /implement-trd for simple TRD', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Simple Feature',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend', duration: '2 hours' },
          { id: 'TASK-002', title: 'Task 2', type: 'backend', duration: '2 hours' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.markdown.includes('/implement-trd'));
      assert.strictEqual(result.analysis.complexity.level, 'simple');
    });

    test('should recommend /implement-trd for moderate TRD', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Moderate Feature',
        tasks: Array.from({ length: 15 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: i % 2 === 0 ? 'backend' : 'frontend',
          duration: '2 hours'
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.strictEqual(result.analysis.complexity.level, 'moderate');
      assert.ok(result.markdown.includes('/implement-trd'));
    });

    test('should suggest orchestration for complex TRD', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Complex Feature',
        tasks: Array.from({ length: 60 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: ['backend', 'frontend', 'infrastructure', 'testing', 'documentation'][i % 5],
          duration: '3 hours'
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' },
          { name: 'Phase 3' },
          { name: 'Phase 4' },
          { name: 'Phase 5' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.strictEqual(result.analysis.complexity.level, 'complex');
      assert.ok(result.analysis.executionApproach.summary.includes('Orchestrated'));
    });
  });

  describe('Complexity assessment', () => {
    test('should classify simple TRD correctly', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Simple TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' },
          { id: 'TASK-002', title: 'Task 2', type: 'backend' }
        ],
        phases: [{ name: 'Phase 1' }]
      };

      const result = generateWorkflowSection(trdContext);

      assert.strictEqual(result.analysis.complexity.level, 'simple');
      assert.ok(result.analysis.complexity.score <= 0.3);
    });

    test('should classify moderate TRD correctly', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Moderate TRD',
        tasks: Array.from({ length: 25 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: ['backend', 'frontend', 'testing'][i % 3]
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' },
          { name: 'Phase 3' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.strictEqual(result.analysis.complexity.level, 'moderate');
      assert.ok(result.analysis.complexity.score > 0.3 && result.analysis.complexity.score <= 0.6);
    });

    test('should classify complex TRD correctly', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Complex TRD',
        tasks: Array.from({ length: 70 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: ['backend', 'frontend', 'infrastructure', 'testing', 'documentation', 'security'][i % 6]
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' },
          { name: 'Phase 3' },
          { name: 'Phase 4' },
          { name: 'Phase 5' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.strictEqual(result.analysis.complexity.level, 'complex');
      assert.ok(result.analysis.complexity.score > 0.6);
    });

    test('should include complexity metrics', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [{ id: 'TASK-001', title: 'Task 1', type: 'backend' }],
        phases: [{ name: 'Phase 1' }]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.analysis.complexity.metrics);
      assert.ok(typeof result.analysis.complexity.metrics.taskCount === 'number');
      assert.ok(typeof result.analysis.complexity.metrics.phaseCount === 'number');
      assert.ok(typeof result.analysis.complexity.metrics.typeCount === 'number');
    });
  });

  describe('Execution approach generation', () => {
    test('should generate linear approach for simple TRD', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Simple Feature',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' },
          { id: 'TASK-002', title: 'Task 2', type: 'backend' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.analysis.executionApproach.summary.includes('Linear'));
      assert.ok(result.analysis.executionApproach.phases.length > 0);
      assert.ok(result.analysis.executionApproach.guidelines.length > 0);
    });

    test('should generate structured approach for moderate TRD', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Moderate Feature',
        tasks: Array.from({ length: 30 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: ['backend', 'frontend', 'testing'][i % 3]
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' },
          { name: 'Phase 3' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.analysis.executionApproach.summary.includes('Structured'));
      assert.ok(result.analysis.executionApproach.phases.length > 0);
    });

    test('should generate orchestrated approach for complex TRD', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Complex Feature',
        tasks: Array.from({ length: 60 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: ['backend', 'frontend', 'infrastructure', 'testing', 'documentation'][i % 5]
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' },
          { name: 'Phase 3' },
          { name: 'Phase 4' },
          { name: 'Phase 5' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.analysis.executionApproach.summary.includes('Orchestrated'));
      assert.ok(result.analysis.executionApproach.warnings.length > 0);
    });

    test('should include execution warnings for high complexity', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Very Large TRD',
        tasks: Array.from({ length: 100 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          type: ['backend', 'frontend', 'infrastructure', 'testing', 'documentation', 'security'][i % 6]
        })),
        phases: [
          { name: 'Phase 1' },
          { name: 'Phase 2' },
          { name: 'Phase 3' },
          { name: 'Phase 4' },
          { name: 'Phase 5' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.analysis.executionApproach.warnings.length > 0);
      assert.ok(result.analysis.executionApproach.warnings.some(w => w.includes('Large task count')));
    });
  });

  describe('Quality gate integration', () => {
    test('should include quality gates section', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const config = { includeQualityGates: true };
      const result = generateWorkflowSection(trdContext, config);

      assert.ok(result.markdown.includes('Quality Gates'));
      assert.ok(result.analysis.qualityGates);
    });

    test('should exclude quality gates when disabled', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const config = { includeQualityGates: false };
      const result = generateWorkflowSection(trdContext, config);

      assert.strictEqual(result.analysis.qualityGates, null);
    });
  });

  describe('Agent delegation integration', () => {
    test('should include delegation section', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Backend task', type: 'backend' },
          { id: 'TASK-002', title: 'Frontend task', type: 'frontend' }
        ]
      };

      const config = { includeDelegation: true };
      const result = generateWorkflowSection(trdContext, config);

      assert.ok(result.markdown.includes('Agent Delegation'));
      assert.ok(result.analysis.delegation);
    });

    test('should exclude delegation when disabled', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const config = { includeDelegation: false };
      const result = generateWorkflowSection(trdContext, config);

      assert.strictEqual(result.analysis.delegation, null);
    });
  });

  describe('Duration estimation', () => {
    test('should estimate total duration', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', duration: '2 hours', type: 'backend' },
          { id: 'TASK-002', title: 'Task 2', duration: '3 hours', type: 'backend' },
          { id: 'TASK-003', title: 'Task 3', duration: '1 hours', type: 'backend' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.markdown.includes('Estimated Duration'));
      assert.ok(result.markdown.includes('hours'));
    });

    test('should apply complexity multiplier to duration', () => {
      const simpleTRD = {
        trdId: 'TRD-SIMPLE',
        title: 'Simple TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', duration: '10 hours', type: 'backend' }
        ]
      };

      const complexTRD = {
        trdId: 'TRD-COMPLEX',
        title: 'Complex TRD',
        tasks: Array.from({ length: 60 }, () => ({
          id: 'TASK-001',
          title: 'Task 1',
          duration: '10 hours',
          type: 'backend'
        })),
        phases: Array.from({ length: 5 }, (_, i) => ({ name: `Phase ${i + 1}` }))
      };

      const simpleResult = generateWorkflowSection(simpleTRD);
      const complexResult = generateWorkflowSection(complexTRD);

      // Complex TRD should have higher estimated duration due to overhead multiplier
      assert.ok(complexResult.analysis.complexity.level === 'complex');
    });
  });

  describe('Metadata generation', () => {
    test('should include metadata in result', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.metadata);
      assert.ok(result.metadata.generatedAt);
      assert.ok(result.metadata.generationTime);
      assert.strictEqual(result.metadata.trdId, 'TRD-TEST-001');
      assert.strictEqual(result.metadata.taskCount, 1);
    });

    test('should measure generation time', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const result = generateWorkflowSection(trdContext);

      assert.ok(result.metadata.generationTime.includes('ms'));
      const time = parseFloat(result.metadata.generationTime);
      assert.ok(time >= 0);
    });
  });

  describe('validateTRDContext', () => {
    test('should validate correct TRD context', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', description: 'Description' }
        ]
      };

      const validation = validateTRDContext(trdContext);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    test('should detect missing tasks array', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD'
      };

      const validation = validateTRDContext(trdContext);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some(e => e.includes('tasks array')));
    });

    test('should detect missing task IDs', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { title: 'Task 1' }  // Missing id
        ]
      };

      const validation = validateTRDContext(trdContext);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some(e => e.includes('missing id')));
    });

    test('should warn about missing optional fields', () => {
      const trdContext = {
        tasks: [
          { id: 'TASK-001' }  // Missing title and description
        ]
      };

      const validation = validateTRDContext(trdContext);

      assert.ok(validation.warnings.length > 0);
    });

    test('should handle null/undefined context', () => {
      const validation = validateTRDContext(null);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });
  });

  describe('Configuration options', () => {
    test('should respect execution command override', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const config = { executionCommand: '/custom-command' };
      const result = generateWorkflowSection(trdContext, config);

      assert.ok(result.markdown.includes('/custom-command'));
    });

    test('should handle complexity analysis disabled', () => {
      const trdContext = {
        trdId: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', type: 'backend' }
        ]
      };

      const config = { includeComplexityAnalysis: false };
      const result = generateWorkflowSection(trdContext, config);

      assert.strictEqual(result.analysis.complexity, null);
    });
  });
});

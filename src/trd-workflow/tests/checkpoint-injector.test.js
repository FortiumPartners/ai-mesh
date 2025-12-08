/**
 * Unit tests for checkpoint-injector module
 * Tests checkpoint injection logic, frequency calculation, and edge cases
 *
 * @module checkpoint-injector.test
 * @related TRD-WORKFLOW-001, TASK-027
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { injectWorkflowTasks, getCheckpointTask, validateCheckpoints } from '../lib/checkpoint-injector.js';

describe('Checkpoint Injector', () => {
  describe('injectWorkflowTasks - sprint-based', () => {
    test('should inject checkpoints at sprint boundaries', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [
                  { id: 'TASK-001', title: 'Task 1' },
                  { id: 'TASK-002', title: 'Task 2' }
                ]
              },
              {
                name: 'Sprint 2',
                tasks: [
                  { id: 'TASK-003', title: 'Task 3' }
                ]
              }
            ]
          }
        ]
      };

      const config = {
        checkpoint_frequency: 'sprint',
        trd_id: 'TRD-TEST-001'
      };

      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 2, 'Should create 2 checkpoints');
      assert.strictEqual(result.metrics.strategy, 'sprint');
      assert.strictEqual(result.checkpoints[0].id, 'TASK-CHKPT-001');
      assert.strictEqual(result.checkpoints[1].id, 'TASK-CHKPT-002');
    });

    test('should skip empty sprints', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [{ id: 'TASK-001', title: 'Task 1' }]
              },
              {
                name: 'Sprint 2',
                tasks: []
              }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 1, 'Should create only 1 checkpoint (skip empty sprint)');
    });

    test('should include correct dependencies in checkpoint', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [
                  { id: 'TASK-001', title: 'Task 1' },
                  { id: 'TASK-002', title: 'Task 2' },
                  { id: 'TASK-003', title: 'Task 3' }
                ]
              }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints[0].dependencies.length, 3);
      assert.deepStrictEqual(result.checkpoints[0].dependencies, ['TASK-001', 'TASK-002', 'TASK-003']);
    });
  });

  describe('injectWorkflowTasks - phase-based', () => {
    test('should inject checkpoints at phase boundaries', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1: Foundation',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] }
            ]
          },
          {
            name: 'Phase 2: Implementation',
            sprints: [
              { name: 'Sprint 2', tasks: [{ id: 'TASK-002', title: 'Task 2' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'phase', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 2);
      assert.strictEqual(result.metrics.strategy, 'phase');
      assert.ok(result.checkpoints[0].title.includes('Phase'));
    });

    test('should collect all tasks in phase for checkpoint', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] },
              { name: 'Sprint 2', tasks: [{ id: 'TASK-002', title: 'Task 2' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'phase', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints[0].dependencies.length, 2);
      assert.deepStrictEqual(result.checkpoints[0].dependencies, ['TASK-001', 'TASK-002']);
    });
  });

  describe('injectWorkflowTasks - task-count-based', () => {
    test('should inject checkpoints every N tasks', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [
                  { id: 'TASK-001', title: 'Task 1' },
                  { id: 'TASK-002', title: 'Task 2' },
                  { id: 'TASK-003', title: 'Task 3' },
                  { id: 'TASK-004', title: 'Task 4' },
                  { id: 'TASK-005', title: 'Task 5' },
                  { id: 'TASK-006', title: 'Task 6' }
                ]
              }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 3, trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.metrics.strategy, 'task-count');
      assert.strictEqual(result.metrics.frequency, 3);
      assert.strictEqual(result.checkpoints.length, 2, 'Should create 2 checkpoints (every 3 tasks)');
    });

    test('should handle remaining tasks with final checkpoint', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [
                  { id: 'TASK-001', title: 'Task 1' },
                  { id: 'TASK-002', title: 'Task 2' },
                  { id: 'TASK-003', title: 'Task 3' },
                  { id: 'TASK-004', title: 'Task 4' },
                  { id: 'TASK-005', title: 'Task 5' }
                ]
              }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 3, trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 2);
      // Last checkpoint should have 2 tasks (remainder)
      const lastCheckpoint = result.checkpoints[result.checkpoints.length - 1];
      assert.strictEqual(lastCheckpoint.dependencies.length, 2);
    });
  });

  describe('Edge cases', () => {
    test('should handle single task', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 1);
    });

    test('should handle 100+ tasks with task-count strategy', () => {
      const tasks = Array.from({ length: 120 }, (_, i) => ({
        id: `TASK-${String(i + 1).padStart(3, '0')}`,
        title: `Task ${i + 1}`
      }));

      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: tasks.slice(0, 60) },
              { name: 'Sprint 2', tasks: tasks.slice(60) }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 10, trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 12); // 120 tasks / 10 = 12 checkpoints
      assert.strictEqual(result.metrics.strategy, 'task-count');
    });

    test('should throw error for invalid task breakdown', () => {
      assert.throws(
        () => injectWorkflowTasks(null, {}),
        /Invalid task breakdown/
      );

      assert.throws(
        () => injectWorkflowTasks({}, {}),
        /Invalid task breakdown/
      );
    });

    test('should handle task breakdown with no sprints', () => {
      const taskBreakdown = {
        phases: [
          { name: 'Phase 1', sprints: [] }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 0);
    });
  });

  describe('Checkpoint task generation', () => {
    test('should generate checkpoint with commit template', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1: Foundation',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: [{ id: 'TASK-001', title: 'Task 1' }]
              }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      const checkpoint = result.checkpoints[0];
      assert.ok(checkpoint.commit_template);
      assert.strictEqual(checkpoint.commit_template.type, 'feat');
      assert.ok(checkpoint.commit_template.scope);
      assert.ok(checkpoint.commit_template.subject);
      assert.ok(checkpoint.commit_template.body);
    });

    test('should include acceptance criteria', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      const checkpoint = result.checkpoints[0];
      assert.ok(Array.isArray(checkpoint.acceptance_criteria));
      assert.ok(checkpoint.acceptance_criteria.length > 0);
    });

    test('should set correct priority and duration', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      const checkpoint = result.checkpoints[0];
      assert.strictEqual(checkpoint.priority, 'high');
      assert.strictEqual(checkpoint.duration, '0.5 hours');
    });
  });

  describe('getCheckpointTask', () => {
    test('should retrieve checkpoint by index', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] },
              { name: 'Sprint 2', tasks: [{ id: 'TASK-002', title: 'Task 2' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      const checkpoint = getCheckpointTask(result, 0);
      assert.ok(checkpoint);
      assert.strictEqual(checkpoint.id, 'TASK-CHKPT-001');
    });

    test('should return null for invalid index', () => {
      const result = { checkpoints: [{ id: 'TASK-CHKPT-001' }] };

      assert.strictEqual(getCheckpointTask(result, -1), null);
      assert.strictEqual(getCheckpointTask(result, 5), null);
      assert.strictEqual(getCheckpointTask(null, 0), null);
    });
  });

  describe('validateCheckpoints', () => {
    test('should validate properly injected checkpoints', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      const validation = validateCheckpoints(result);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    test('should detect missing checkpoints', () => {
      const invalidResult = { checkpoints: null };
      const validation = validateCheckpoints(invalidResult);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });

    test('should detect invalid checkpoint format', () => {
      const invalidResult = {
        checkpoints: [
          { id: 'INVALID', type: 'wrong', dependencies: [] }
        ],
        metrics: { totalCheckpoints: 1 }
      };

      const validation = validateCheckpoints(invalidResult);
      assert.strictEqual(validation.valid, false);
    });
  });

  describe('Metrics and coverage', () => {
    test('should report correct metrics', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] },
              { name: 'Sprint 2', tasks: [{ id: 'TASK-002', title: 'Task 2' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.metrics.totalCheckpoints, 2);
      assert.strictEqual(result.metrics.strategy, 'sprint');
      assert.strictEqual(result.metrics.frequency, 'sprint');
      assert.ok(typeof result.metrics.coverage === 'number');
    });

    test('should calculate coverage score', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              {
                name: 'Sprint 1',
                tasks: Array.from({ length: 10 }, (_, i) => ({ id: `TASK-${i + 1}`, title: `Task ${i + 1}` }))
              }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.ok(result.metrics.coverage >= 0 && result.metrics.coverage <= 100);
    });
  });

  describe('Multiple phases and sprints', () => {
    test('should handle complex multi-phase structure', () => {
      const taskBreakdown = {
        phases: [
          {
            name: 'Phase 1',
            sprints: [
              { name: 'Sprint 1.1', tasks: [{ id: 'TASK-001', title: 'Task 1' }] },
              { name: 'Sprint 1.2', tasks: [{ id: 'TASK-002', title: 'Task 2' }] }
            ]
          },
          {
            name: 'Phase 2',
            sprints: [
              { name: 'Sprint 2.1', tasks: [{ id: 'TASK-003', title: 'Task 3' }] },
              { name: 'Sprint 2.2', tasks: [{ id: 'TASK-004', title: 'Task 4' }] }
            ]
          }
        ]
      };

      const config = { checkpoint_frequency: 'sprint', trd_id: 'TRD-TEST-001' };
      const result = injectWorkflowTasks(taskBreakdown, config);

      assert.strictEqual(result.checkpoints.length, 4);

      // Verify each checkpoint is in correct location
      result.checkpoints.forEach((checkpoint, i) => {
        assert.ok(checkpoint.id.startsWith('TASK-CHKPT-'));
        assert.ok(checkpoint.metadata.phaseNumber >= 1);
        assert.ok(checkpoint.metadata.sprintNumber >= 1);
      });
    });
  });
});

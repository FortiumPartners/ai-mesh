/**
 * Handler for inject_checkpoints MCP tool
 * Wraps src/trd-workflow/lib/checkpoint-injector.js
 *
 * @module handlers/inject-checkpoints
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, TASK-005
 */

import { injectWorkflowTasks } from '../../../trd-workflow/lib/index.js';

export const handler = {
  name: 'inject_checkpoints',
  description: 'Inject checkpoint tasks into TRD task breakdown with automatic interval calculation. Checkpoints prompt for git commits at strategic points (sprint/phase boundaries or every N tasks).',
  inputSchema: {
    type: 'object',
    properties: {
      taskBreakdown: {
        type: 'object',
        description: 'TRD task breakdown structure with phases, sprints, and tasks',
        properties: {
          phases: {
            type: 'array',
            description: 'Array of project phases',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sprints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      tasks: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            title: { type: 'string' }
                          },
                          required: ['id']
                        }
                      }
                    }
                  }
                }
              },
              required: ['sprints']
            }
          }
        },
        required: ['phases']
      },
      config: {
        type: 'object',
        description: 'Optional workflow configuration',
        properties: {
          checkpoint_frequency: {
            type: ['string', 'number'],
            description: "Checkpoint frequency: 'sprint', 'phase', or number (every N tasks)"
          },
          trd_id: {
            type: 'string',
            description: 'TRD identifier for commit message references'
          }
        }
      }
    },
    required: ['taskBreakdown']
  },
  async execute(params) {
    // Validate input structure
    if (!params.taskBreakdown || !params.taskBreakdown.phases) {
      throw new Error('Invalid taskBreakdown: missing phases structure');
    }

    if (!Array.isArray(params.taskBreakdown.phases)) {
      throw new Error('Invalid taskBreakdown: phases must be an array');
    }

    // Call library function
    const result = injectWorkflowTasks(
      params.taskBreakdown,
      params.config || {}
    );

    // Return enhanced breakdown with metadata
    return {
      success: true,
      taskBreakdown: result.taskBreakdown,
      checkpoints: result.checkpoints,
      metrics: {
        totalCheckpoints: result.metrics.totalCheckpoints,
        strategy: result.metrics.strategy,
        frequency: result.metrics.frequency,
        coverage: result.metrics.coverage
      },
      intervalStrategy: {
        strategy: result.intervalStrategy.strategy,
        frequency: result.intervalStrategy.frequency,
        reasoning: result.intervalStrategy.reasoning
      }
    };
  }
};

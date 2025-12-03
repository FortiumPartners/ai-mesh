/**
 * Handlers for complexity analysis MCP tools
 * Wraps src/trd-workflow/lib/interval-calculator.js and task-type-detector.js
 *
 * @module handlers/complexity-analysis
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, TASK-007
 */

import {
  calculateCheckpointInterval,
  analyzeTaskTypes
} from '../../../trd-workflow/lib/index.js';

/**
 * Handler: assess_complexity
 * Analyzes task breakdown complexity and recommends checkpoint strategy
 */
export const assessComplexityHandler = {
  name: 'assess_complexity',
  description: 'Analyze task breakdown complexity and recommend optimal checkpoint strategy. Returns detailed complexity metrics, checkpoint frequency recommendation, and reasoning.',
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
                      tasks: { type: 'array' }
                    }
                  }
                }
              }
            }
          }
        },
        required: ['phases']
      },
      config: {
        type: 'object',
        description: 'Optional configuration overrides',
        properties: {
          checkpoint_frequency: {
            type: ['string', 'number'],
            description: "Override frequency: 'sprint', 'phase', or number"
          }
        }
      }
    },
    required: ['taskBreakdown']
  },
  async execute(params) {
    // Validate input
    if (!params.taskBreakdown || !params.taskBreakdown.phases) {
      throw new Error('Invalid taskBreakdown: missing phases structure');
    }

    if (!Array.isArray(params.taskBreakdown.phases)) {
      throw new Error('Invalid taskBreakdown: phases must be an array');
    }

    // Call library function
    const result = calculateCheckpointInterval(
      params.taskBreakdown,
      params.config || {}
    );

    // Return complexity analysis
    return {
      success: true,
      strategy: result.strategy,
      frequency: result.frequency,
      reasoning: result.reasoning,
      metrics: {
        totalTasks: result.metrics.totalTasks,
        totalPhases: result.metrics.totalPhases,
        totalSprints: result.metrics.totalSprints,
        avgTasksPerSprint: result.metrics.avgTasksPerSprint,
        avgSprintsPerPhase: result.metrics.avgSprintsPerPhase,
        coverage: result.metrics.coverage,
        complexityScore: result.metrics.complexityScore
      },
      recommendations: result.recommendations || []
    };
  }
};

/**
 * Handler: detect_task_types
 * Analyzes all tasks and detects their types (backend, frontend, infrastructure, etc.)
 */
export const detectTaskTypesHandler = {
  name: 'detect_task_types',
  description: 'Analyze task breakdown and detect task types (backend, frontend, infrastructure, testing, documentation, etc.). Returns type distribution and classification for each task.',
  inputSchema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        description: 'Array of task objects to analyze',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task identifier'
            },
            title: {
              type: 'string',
              description: 'Task title/description'
            },
            description: {
              type: 'string',
              description: 'Optional detailed task description'
            }
          },
          required: ['id', 'title']
        }
      },
      config: {
        type: 'object',
        description: 'Optional detection configuration',
        properties: {
          includeConfidence: {
            type: 'boolean',
            description: 'Include confidence scores in results (default: false)'
          },
          customKeywords: {
            type: 'object',
            description: 'Custom keyword mappings for task type detection'
          }
        }
      }
    },
    required: ['tasks']
  },
  async execute(params) {
    // Validate input
    if (!params.tasks || !Array.isArray(params.tasks)) {
      throw new Error('Invalid tasks: must be an array');
    }

    if (params.tasks.length === 0) {
      return {
        success: true,
        taskTypes: [],
        distribution: {},
        totalTasks: 0
      };
    }

    // Validate task objects
    for (const task of params.tasks) {
      if (!task.id) {
        throw new Error('Invalid task: missing id field');
      }
      if (!task.title) {
        throw new Error(`Invalid task ${task.id}: missing title field`);
      }
    }

    // Call library function
    const result = analyzeTaskTypes(
      params.tasks,
      params.config || {}
    );

    // Return task type analysis
    return {
      success: true,
      taskTypes: result.taskTypes.map(t => ({
        taskId: t.taskId,
        type: t.type,
        subtype: t.subtype,
        confidence: params.config?.includeConfidence ? t.confidence : undefined
      })),
      distribution: result.distribution,
      totalTasks: result.totalTasks,
      summary: result.summary || {
        dominantType: result.dominantType,
        diversityScore: result.diversityScore
      }
    };
  }
};

// Export both handlers
export const handlers = [
  assessComplexityHandler,
  detectTaskTypesHandler
];

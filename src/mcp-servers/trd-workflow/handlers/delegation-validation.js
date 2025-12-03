/**
 * Handlers for delegation and validation MCP tools
 * Wraps src/trd-workflow/lib/delegation-generator.js and workflow-section-generator.js
 *
 * @module handlers/delegation-validation
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, TASK-008
 */

import {
  generateDelegationPatterns,
  validateTRDContext
} from '../../../trd-workflow/lib/index.js';

/**
 * Handler: generate_delegation_patterns
 * Maps tasks to appropriate sub-agents based on task type
 */
export const generateDelegationHandler = {
  name: 'generate_delegation_patterns',
  description: 'Generate agent delegation patterns by mapping tasks to appropriate sub-agents (backend-developer, frontend-developer, infrastructure-developer, etc.). Returns delegation table and coordination recommendations.',
  inputSchema: {
    type: 'object',
    properties: {
      taskTypes: {
        type: 'array',
        description: 'Array of tasks with detected types',
        items: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task identifier'
            },
            type: {
              type: 'string',
              description: 'Detected task type (backend, frontend, infrastructure, etc.)'
            },
            subtype: {
              type: 'string',
              description: 'Task subtype for more specific delegation'
            }
          },
          required: ['taskId', 'type']
        }
      },
      config: {
        type: 'object',
        description: 'Optional delegation configuration',
        properties: {
          agentMapping: {
            type: 'object',
            description: 'Custom task type to agent mappings'
          },
          includeCoordination: {
            type: 'boolean',
            description: 'Include coordination needs analysis (default: true)'
          },
          includeHandoffProtocol: {
            type: 'boolean',
            description: 'Include handoff protocol details (default: true)'
          }
        }
      }
    },
    required: ['taskTypes']
  },
  async execute(params) {
    // Validate input
    if (!params.taskTypes || !Array.isArray(params.taskTypes)) {
      throw new Error('Invalid taskTypes: must be an array');
    }

    if (params.taskTypes.length === 0) {
      return {
        success: true,
        delegationMap: {},
        coordinationNeeds: [],
        totalTasks: 0
      };
    }

    // Validate task type objects
    for (const task of params.taskTypes) {
      if (!task.taskId) {
        throw new Error('Invalid task: missing taskId field');
      }
      if (!task.type) {
        throw new Error(`Invalid task ${task.taskId}: missing type field`);
      }
    }

    // Call library function
    const result = generateDelegationPatterns(
      params.taskTypes,
      params.config || {}
    );

    // Return delegation patterns
    return {
      success: true,
      delegationMap: result.delegationMap,
      coordinationNeeds: result.coordinationNeeds || [],
      handoffProtocol: params.config?.includeHandoffProtocol !== false
        ? result.handoffProtocol
        : undefined,
      agentUtilization: result.agentUtilization || {},
      totalTasks: params.taskTypes.length
    };
  }
};

/**
 * Handler: validate_trd_structure
 * Validates TRD context structure for workflow generation
 */
export const validateTRDHandler = {
  name: 'validate_trd_structure',
  description: 'Validate TRD context structure before workflow generation. Checks for required fields, validates task breakdown structure, and identifies potential issues.',
  inputSchema: {
    type: 'object',
    properties: {
      trdContext: {
        type: 'object',
        description: 'TRD context object to validate',
        properties: {
          trdId: {
            type: 'string',
            description: 'TRD identifier'
          },
          title: {
            type: 'string',
            description: 'TRD title'
          },
          tasks: {
            type: 'array',
            description: 'Array of tasks'
          },
          phases: {
            type: 'array',
            description: 'Array of phases (optional)'
          },
          sprints: {
            type: 'array',
            description: 'Array of sprints (optional)'
          }
        }
      },
      options: {
        type: 'object',
        description: 'Validation options',
        properties: {
          strict: {
            type: 'boolean',
            description: 'Enable strict validation mode (default: false)'
          },
          requirePhases: {
            type: 'boolean',
            description: 'Require phases in TRD context (default: false)'
          },
          requireSprints: {
            type: 'boolean',
            description: 'Require sprints in TRD context (default: false)'
          }
        }
      }
    },
    required: ['trdContext']
  },
  async execute(params) {
    // Validate input
    if (!params.trdContext) {
      throw new Error('Missing trdContext parameter');
    }

    // Call library function
    const result = validateTRDContext(
      params.trdContext,
      params.options || {}
    );

    // Return validation result
    return {
      success: result.valid,
      valid: result.valid,
      errors: result.errors || [],
      warnings: result.warnings || [],
      metadata: {
        trdId: params.trdContext.trdId,
        totalTasks: params.trdContext.tasks?.length || 0,
        hasPhases: Array.isArray(params.trdContext.phases) && params.trdContext.phases.length > 0,
        hasSprints: Array.isArray(params.trdContext.sprints) && params.trdContext.sprints.length > 0
      },
      recommendations: result.recommendations || []
    };
  }
};

// Export both handlers
export const handlers = [
  generateDelegationHandler,
  validateTRDHandler
];

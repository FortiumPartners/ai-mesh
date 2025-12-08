/**
 * Handler for generate_workflow_section MCP tool
 * Wraps src/trd-workflow/lib/workflow-section-generator.js
 *
 * @module handlers/generate-workflow-section
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, TASK-006
 */

import { generateWorkflowSection } from '../../../trd-workflow/lib/index.js';

export const handler = {
  name: 'generate_workflow_section',
  description: 'Generate complete workflow section for TRD document with checkpoint strategy, task analysis, agent delegation, and quality gates. Returns formatted markdown ready for insertion into TRD.',
  inputSchema: {
    type: 'object',
    properties: {
      trdContext: {
        type: 'object',
        description: 'TRD context object with tasks, phases, sprints, and metadata',
        properties: {
          trdId: {
            type: 'string',
            description: 'TRD identifier (e.g., TRD-WORKFLOW-001)'
          },
          title: {
            type: 'string',
            description: 'TRD title'
          },
          tasks: {
            type: 'array',
            description: 'Flat array of all tasks',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                type: { type: 'string' }
              }
            }
          },
          phases: {
            type: 'array',
            description: 'Array of project phases with sprints'
          },
          sprints: {
            type: 'array',
            description: 'Array of sprints'
          }
        },
        required: ['trdId', 'title', 'tasks']
      },
      config: {
        type: 'object',
        description: 'Optional workflow generation configuration',
        properties: {
          executionCommand: {
            type: 'string',
            description: 'Command to execute TRD (default: /implement-trd)'
          },
          includeComplexityAnalysis: {
            type: 'boolean',
            description: 'Include complexity analysis section (default: true)'
          },
          includeDelegation: {
            type: 'boolean',
            description: 'Include agent delegation mapping (default: true)'
          },
          includeQualityGates: {
            type: 'boolean',
            description: 'Include quality gate checklist (default: true)'
          },
          checkpoint_frequency: {
            type: ['string', 'number'],
            description: "Checkpoint frequency: 'sprint', 'phase', or number"
          }
        }
      }
    },
    required: ['trdContext']
  },
  async execute(params) {
    // Validate TRD context
    if (!params.trdContext) {
      throw new Error('Missing trdContext parameter');
    }

    if (!params.trdContext.trdId) {
      throw new Error('trdContext missing required field: trdId');
    }

    if (!params.trdContext.title) {
      throw new Error('trdContext missing required field: title');
    }

    if (!params.trdContext.tasks || !Array.isArray(params.trdContext.tasks)) {
      throw new Error('trdContext missing required field: tasks (array)');
    }

    // Call library function
    const result = generateWorkflowSection(
      params.trdContext,
      params.config || {}
    );

    // Return workflow section with metadata
    return {
      success: true,
      markdown: result.markdown,
      analysis: {
        taskTypes: result.analysis.taskTypes,
        complexity: result.analysis.complexity,
        delegation: result.analysis.delegation,
        qualityGates: result.analysis.qualityGates
      },
      metadata: {
        generatedAt: result.metadata.generatedAt,
        trdId: result.metadata.trdId,
        totalTasks: result.metadata.totalTasks,
        checkpointStrategy: result.metadata.checkpointStrategy
      }
    };
  }
};

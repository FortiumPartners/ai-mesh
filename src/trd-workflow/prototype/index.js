/**
 * TRD Workflow Prototype - Main Entry Point
 *
 * @module trd-workflow/prototype
 * @description Main entry point for TRD workflow generation prototypes
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, Sprint 1.3
 */

export { injectCheckpoints, createCheckpointTask } from './checkpoint-injector.js';
export { analyzeTaskTypes, detectTaskType } from './task-type-detector.js';
export { assessComplexity, selectExecutionCommand } from './complexity-assessor.js';
export { generateWorkflow } from './workflow-generator.js';
export { runBenchmarks } from './benchmarks/baseline.js';

/**
 * Convenience function to run complete workflow generation
 *
 * @param {Object} trdContext - TRD structure with tasks, phases, metadata
 * @param {Object} config - Configuration options
 * @returns {Object} Complete workflow generation result
 */
export async function generateTrdWorkflow(trdContext, config = {}) {
  const { generateWorkflow } = await import('./workflow-generator.js');
  return generateWorkflow(trdContext, config);
}

/**
 * Convenience function to analyze single TRD
 *
 * @param {Object} trdContext - TRD structure
 * @returns {Object} Analysis results
 */
export async function analyzeTrd(trdContext) {
  const { analyzeTaskTypes } = await import('./task-type-detector.js');
  const { assessComplexity } = await import('./complexity-assessor.js');

  const taskTypeAnalysis = analyzeTaskTypes(trdContext.tasks);
  const complexityAssessment = assessComplexity(trdContext, taskTypeAnalysis.summary);

  return {
    taskTypeAnalysis,
    complexityAssessment
  };
}

/**
 * Convenience function to generate checkpoints only
 *
 * @param {Object[]} tasks - Task array
 * @param {Object} config - Checkpoint configuration
 * @returns {Object} Checkpoint injection result
 */
export async function generateCheckpoints(tasks, config = {}) {
  const { injectCheckpoints } = await import('./checkpoint-injector.js');
  return injectCheckpoints(tasks, config);
}

/**
 * TRD Workflow Library - Main Export
 *
 * @module trd-workflow/lib
 * @description Production-ready TRD workflow enhancement library
 * Provides checkpoint injection, interval calculation, and commit template generation.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, Sprint 2.1
 */

// Checkpoint Injection (TASK-013)
export {
  injectWorkflowTasks,
  getCheckpointTask,
  validateCheckpoints
} from './checkpoint-injector.js';

// Interval Calculation (TASK-014)
export {
  calculateCheckpointInterval,
  explainStrategy
} from './interval-calculator.js';

// Commit Template Generation (TASK-015)
export {
  generateCommitTemplates,
  renderCommitMessage,
  formatCommitMessage,
  validateCommitMessage
} from './commit-template-generator.js';

/**
 * Main API: Inject workflow tasks with automatic interval calculation
 *
 * @param {Object} taskBreakdown - TRD task breakdown structure
 * @param {Object} [config={}] - Configuration options
 * @param {string|number} [config.checkpoint_frequency] - 'sprint', 'phase', or number
 * @param {string} [config.trd_id] - TRD identifier
 * @param {Object} [config.trdContext] - Full TRD context for template generation
 * @returns {Object} Enhanced task breakdown with checkpoints and templates
 *
 * @example
 * import { injectWorkflowTasks } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const enhanced = injectWorkflowTasks(taskBreakdown, {
 *   checkpoint_frequency: 'sprint',
 *   trd_id: 'TRD-WORKFLOW-001',
 *   trdContext: { title: 'Workflow Enhancement', tasks: [...] }
 * });
 */

/**
 * Utility: Calculate optimal checkpoint strategy without modifying task breakdown
 *
 * @param {Object} taskBreakdown - TRD task breakdown structure
 * @param {Object} [config={}] - Configuration options
 * @returns {Object} Interval strategy analysis
 *
 * @example
 * import { calculateCheckpointInterval } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const strategy = calculateCheckpointInterval(taskBreakdown);
 * console.log(`Recommended: ${strategy.strategy} (${strategy.reasoning})`);
 */

/**
 * Utility: Generate commit message templates for TRD
 *
 * @param {Object} trdContext - TRD context object
 * @param {Object} [options={}] - Generation options
 * @returns {Object} Generated templates and metadata
 *
 * @example
 * import { generateCommitTemplates } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const templates = generateCommitTemplates({
 *   trd_id: 'TRD-WORKFLOW-001',
 *   title: 'Workflow Enhancement System',
 *   tasks: [...]
 * });
 */

// Version metadata
export const VERSION = '1.0.0';
export const PHASE = 'Sprint 2.1 - Production Integration';

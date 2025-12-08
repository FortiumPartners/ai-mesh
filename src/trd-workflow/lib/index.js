/**
 * TRD Workflow Library - Main Export
 *
 * @module trd-workflow/lib
 * @description Production-ready TRD workflow enhancement library
 * Provides checkpoint injection, interval calculation, commit template generation,
 * task type detection, agent delegation, quality gates, workflow section generation,
 * PRD metadata parsing, configuration validation, and PR task generation.
 * @version 1.2.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, Sprint 2.1, Sprint 2.2, Sprint 2.3
 */

// Sprint 2.1 - Checkpoint Injection (TASK-013)
export {
  injectWorkflowTasks,
  getCheckpointTask,
  validateCheckpoints
} from './checkpoint-injector.js';

// Sprint 2.1 - Interval Calculation (TASK-014)
export {
  calculateCheckpointInterval,
  explainStrategy
} from './interval-calculator.js';

// Sprint 2.1 - Commit Template Generation (TASK-015)
export {
  generateCommitTemplates,
  renderCommitMessage,
  formatCommitMessage,
  validateCommitMessage
} from './commit-template-generator.js';

// Sprint 2.2 - Task Type Detection (TASK-018)
export {
  analyzeTaskTypes,
  detectTaskType
} from './task-type-detector.js';

// Sprint 2.2 - Delegation Generation (TASK-019)
export {
  generateDelegationPatterns,
  formatDelegationTable,
  formatCoordinationNeeds
} from './delegation-generator.js';

// Sprint 2.2 - Quality Gate Generation (TASK-020)
export {
  generateQualityGates,
  formatQualityGateChecklist,
  formatQualityGatesSection,
  validateGateCompletion
} from './quality-gate-generator.js';

// Sprint 2.2 - Workflow Section Generation (TASK-017)
export {
  generateWorkflowSection,
  validateTRDContext
} from './workflow-section-generator.js';

// Sprint 2.3 - PRD Metadata Parser (TASK-022)
export {
  parsePrdMetadata,
  extractWorkflowConfig,
  hasFrontmatter,
  getWorkflowConfig
} from './prd-metadata-parser.js';

// Sprint 2.3 - Configuration Validator (TASK-023)
export {
  validateWorkflowConfig,
  validatePrdMetadata,
  getValidationHelp
} from './config-validator.js';

// Sprint 2.3 - Configuration Override Applier (TASK-024)
export {
  applyConfigOverrides,
  applyCheckpointFrequencyOverride,
  applyCommitScopeOverride,
  applyExecutionCommandOverride,
  getOverrideSummary,
  validateOverrides,
  removeOverrideMetadata,
  createOverrideReport
} from './config-override-applier.js';

// Sprint 2.3 - PR Task Generator (TASK-025)
export {
  generatePrTask,
  injectPrTask
} from './pr-task-generator.js';

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

/**
 * Utility: Generate complete workflow section for TRD
 *
 * @param {Object} trdContext - TRD context object
 * @param {Object} [config={}] - Generation configuration
 * @returns {Object} Complete workflow section with markdown and analysis
 *
 * @example
 * import { generateWorkflowSection } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const workflow = generateWorkflowSection({
 *   trdId: 'TRD-WORKFLOW-001',
 *   title: 'Workflow Enhancement System',
 *   tasks: [...],
 *   phases: [...],
 *   sprints: [...]
 * }, {
 *   executionCommand: '/implement-trd',
 *   includeComplexityAnalysis: true,
 *   includeDelegation: true,
 *   includeQualityGates: true
 * });
 * // => { markdown: '## Workflow...', analysis: {...}, metadata: {...} }
 */

/**
 * Utility: Parse PRD metadata and extract workflow configuration
 *
 * @param {string} prdContent - Raw PRD file content with YAML frontmatter
 * @returns {Object} Parsed metadata with workflow configuration
 *
 * @example
 * import { parsePrdMetadata } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const metadata = parsePrdMetadata(prdFileContent);
 * const config = metadata.workflow;
 */

/**
 * Utility: Validate workflow configuration against JSON Schema
 *
 * @param {Object} config - Workflow configuration object
 * @returns {Object} Validation result with errors and warnings
 *
 * @example
 * import { validateWorkflowConfig } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const result = validateWorkflowConfig(config);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */

/**
 * Utility: Apply configuration overrides to TRD context
 *
 * @param {Object} trdContext - Base TRD context
 * @param {Object} workflowConfig - Workflow configuration from PRD
 * @returns {Object} Enhanced TRD context with overrides applied
 *
 * @example
 * import { applyConfigOverrides } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const enhanced = applyConfigOverrides(trdContext, prdWorkflowConfig);
 */

/**
 * Utility: Generate PR creation task for final sprint
 *
 * @param {Object} trdContext - TRD context object
 * @param {Object} [config={}] - Generation configuration
 * @returns {Object} PR task object with checklist and templates
 *
 * @example
 * import { generatePrTask, injectPrTask } from '@fortium/ai-mesh/trd-workflow/lib';
 *
 * const prTask = generatePrTask(trdContext, { scope: 'trd-workflow' });
 * const enhanced = injectPrTask(taskBreakdown, prTask);
 */

// Version metadata
export const VERSION = '1.2.0';
export const PHASE = 'Sprint 2.3 - PRD Metadata & Configuration';

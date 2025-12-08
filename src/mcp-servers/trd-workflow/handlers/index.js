/**
 * Handler Registry - Auto-export all MCP tool handlers
 *
 * @module handlers
 * @description Centralized export for all TRD Workflow MCP tool handlers
 * Automatically loads and exports all handler modules
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, Sprint 1.2
 */

// TASK-005: Checkpoint injection handler
import { handler as injectCheckpointsHandler } from './inject-checkpoints.js';

// TASK-006: Workflow section generation handler
import { handler as generateWorkflowSectionHandler } from './generate-workflow-section.js';

// TASK-007: Complexity analysis handlers (2 handlers)
import {
  assessComplexityHandler,
  detectTaskTypesHandler
} from './complexity-analysis.js';

// TASK-008: Delegation and validation handlers (2 handlers)
import {
  generateDelegationHandler,
  validateTRDHandler
} from './delegation-validation.js';

/**
 * All registered MCP tool handlers
 *
 * Total: 6 handlers across 4 modules
 * - inject_checkpoints (TASK-005)
 * - generate_workflow_section (TASK-006)
 * - assess_complexity (TASK-007)
 * - detect_task_types (TASK-007)
 * - generate_delegation_patterns (TASK-008)
 * - validate_trd_structure (TASK-008)
 */
export const handlers = [
  // TASK-005
  injectCheckpointsHandler,

  // TASK-006
  generateWorkflowSectionHandler,

  // TASK-007 (2 handlers)
  assessComplexityHandler,
  detectTaskTypesHandler,

  // TASK-008 (2 handlers)
  generateDelegationHandler,
  validateTRDHandler
];

// Export individual handlers for direct import
export {
  injectCheckpointsHandler,
  generateWorkflowSectionHandler,
  assessComplexityHandler,
  detectTaskTypesHandler,
  generateDelegationHandler,
  validateTRDHandler
};

/**
 * Get handler by name
 *
 * @param {string} name - Handler name
 * @returns {Object|null} Handler object or null if not found
 */
export function getHandler(name) {
  return handlers.find(h => h.name === name) || null;
}

/**
 * Get all handler names
 *
 * @returns {string[]} Array of handler names
 */
export function getHandlerNames() {
  return handlers.map(h => h.name);
}

/**
 * Get handler count
 *
 * @returns {number} Total number of registered handlers
 */
export function getHandlerCount() {
  return handlers.length;
}

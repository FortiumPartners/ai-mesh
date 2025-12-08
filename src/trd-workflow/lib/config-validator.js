/**
 * Configuration Validator - Production Implementation
 *
 * @module config-validator
 * @description Production implementation of workflow configuration validation
 * Uses JSON Schema validation for PRD metadata workflow configuration.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-023
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON Schema
let SCHEMA = null;

/**
 * Load JSON Schema for validation
 *
 * @returns {Object} JSON Schema object
 * @private
 */
function loadSchema() {
  if (SCHEMA) {
    return SCHEMA;
  }

  try {
    const schemaPath = join(__dirname, '../schemas/prd-metadata.schema.json');
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    SCHEMA = JSON.parse(schemaContent);
    return SCHEMA;
  } catch (error) {
    throw new Error(`Failed to load validation schema: ${error.message}`);
  }
}

/**
 * Validate workflow configuration against JSON Schema
 *
 * @param {Object} config - Workflow configuration object
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.strict=true] - Strict validation mode
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateWorkflowConfig(workflowConfig);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateWorkflowConfig(config, options = {}) {
  const { strict = true } = options;

  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: ['Configuration must be a non-null object'],
      warnings: []
    };
  }

  const schema = loadSchema();
  const errors = [];
  const warnings = [];

  // Validate against schema
  const schemaErrors = validateAgainstSchema(config, schema.properties.workflow, 'workflow', strict);
  errors.push(...schemaErrors);

  // Additional semantic validations
  const semanticErrors = performSemanticValidation(config, strict);
  errors.push(...semanticErrors.errors);
  warnings.push(...semanticErrors.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Validate object against JSON Schema
 *
 * @param {*} value - Value to validate
 * @param {Object} schema - JSON Schema definition
 * @param {string} path - Current path in object (for error messages)
 * @param {boolean} strict - Strict validation mode
 * @returns {string[]} Array of error messages
 * @private
 */
function validateAgainstSchema(value, schema, path, strict) {
  const errors = [];

  if (!schema) {
    return errors;
  }

  // Type validation
  if (schema.type && !validateType(value, schema.type)) {
    errors.push(`${path}: Expected type ${schema.type}, got ${typeof value}`);
    return errors;
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: Value must be one of [${schema.enum.join(', ')}], got "${value}"`);
    return errors;
  }

  // OneOf validation (for checkpoint_frequency)
  if (schema.oneOf) {
    const matchesOne = schema.oneOf.some(subSchema => {
      const subErrors = validateAgainstSchema(value, subSchema, path, false);
      return subErrors.length === 0;
    });

    if (!matchesOne) {
      errors.push(`${path}: Value does not match any allowed schema variant`);
    }
    return errors;
  }

  // Number validations
  if (schema.type === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: Value ${value} is below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: Value ${value} is above maximum ${schema.maximum}`);
    }
  }

  // String validations
  if (schema.type === 'string' && schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      errors.push(`${path}: Value does not match required pattern ${schema.pattern}`);
    }
  }

  // Object validation
  if (schema.type === 'object' && typeof value === 'object' && value !== null) {
    // Required properties
    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach(requiredKey => {
        if (!(requiredKey in value)) {
          errors.push(`${path}: Missing required property "${requiredKey}"`);
        }
      });
    }

    // Validate properties
    if (schema.properties) {
      Object.keys(value).forEach(key => {
        if (schema.properties[key]) {
          const propErrors = validateAgainstSchema(
            value[key],
            schema.properties[key],
            `${path}.${key}`,
            strict
          );
          errors.push(...propErrors);
        } else if (strict && !schema.additionalProperties) {
          errors.push(`${path}: Unknown property "${key}"`);
        }
      });
    }
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.items) {
      value.forEach((item, index) => {
        const itemErrors = validateAgainstSchema(
          item,
          schema.items,
          `${path}[${index}]`,
          strict
        );
        errors.push(...itemErrors);
      });
    }
  }

  return errors;
}

/**
 * Validate JavaScript type
 *
 * @param {*} value - Value to check
 * @param {string} expectedType - Expected type name
 * @returns {boolean} True if type matches
 * @private
 */
function validateType(value, expectedType) {
  if (expectedType === 'array') {
    return Array.isArray(value);
  }

  if (expectedType === 'null') {
    return value === null;
  }

  if (expectedType === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  return typeof value === expectedType;
}

/**
 * Perform semantic validation beyond schema
 *
 * @param {Object} config - Configuration object
 * @param {boolean} strict - Strict validation mode
 * @returns {Object} Errors and warnings
 * @private
 */
function performSemanticValidation(config, strict) {
  const errors = [];
  const warnings = [];

  // Validate checkpoint_frequency
  if (config.checkpoint_frequency !== undefined) {
    const freq = config.checkpoint_frequency;

    if (typeof freq === 'number') {
      if (freq < 1) {
        errors.push('checkpoint_frequency: Must be at least 1 when using numeric value');
      }
      if (freq > 50) {
        warnings.push('checkpoint_frequency: Very high value (>50) may create too many checkpoints');
      }
    } else if (typeof freq === 'string') {
      const validStrategies = ['sprint', 'phase', 'manual'];
      if (!validStrategies.includes(freq)) {
        errors.push(`checkpoint_frequency: Invalid strategy "${freq}", must be one of [${validStrategies.join(', ')}]`);
      }
    } else {
      errors.push('checkpoint_frequency: Must be a string or number');
    }
  }

  // Validate execution_command
  if (config.execution_command !== undefined) {
    const validCommands = ['/implement-trd', '/orchestrate-tasks', '/build'];
    if (!validCommands.includes(config.execution_command)) {
      warnings.push(`execution_command: "${config.execution_command}" is not a standard command. Valid options: ${validCommands.join(', ')}`);
    }
  }

  // Validate quality gates structure
  if (config.quality_gates) {
    const gateErrors = validateQualityGates(config.quality_gates);
    errors.push(...gateErrors.errors);
    warnings.push(...gateErrors.warnings);
  }

  // Validate git_workflow configuration
  if (config.git_workflow) {
    const gitErrors = validateGitWorkflow(config.git_workflow);
    errors.push(...gitErrors.errors);
    warnings.push(...gitErrors.warnings);
  }

  // Validate delegation patterns
  if (config.delegation?.patterns) {
    const delegationErrors = validateDelegationPatterns(config.delegation.patterns);
    errors.push(...delegationErrors.errors);
    warnings.push(...delegationErrors.warnings);
  }

  return { errors, warnings };
}

/**
 * Validate quality gates configuration
 *
 * @param {Object} qualityGates - Quality gates configuration
 * @returns {Object} Errors and warnings
 * @private
 */
function validateQualityGates(qualityGates) {
  const errors = [];
  const warnings = [];

  const levels = ['sprint', 'phase', 'final'];

  levels.forEach(level => {
    if (!qualityGates[level]) {
      return;
    }

    const gates = qualityGates[level].gates;

    if (!Array.isArray(gates)) {
      errors.push(`quality_gates.${level}.gates: Must be an array`);
      return;
    }

    gates.forEach((gate, index) => {
      if (!gate.name) {
        errors.push(`quality_gates.${level}.gates[${index}]: Missing required field "name"`);
      }

      if (!gate.type) {
        errors.push(`quality_gates.${level}.gates[${index}]: Missing required field "type"`);
      }

      if (gate.threshold !== undefined) {
        if (typeof gate.threshold !== 'number') {
          errors.push(`quality_gates.${level}.gates[${index}].threshold: Must be a number`);
        } else if (gate.threshold < 0 || gate.threshold > 100) {
          errors.push(`quality_gates.${level}.gates[${index}].threshold: Must be between 0 and 100`);
        }
      }

      // Warn about missing descriptions
      if (!gate.description) {
        warnings.push(`quality_gates.${level}.gates[${index}]: Missing description (recommended)`);
      }
    });

    // Warn if no gates defined
    if (qualityGates[level].enabled && gates.length === 0) {
      warnings.push(`quality_gates.${level}: Enabled but no gates defined`);
    }
  });

  return { errors, warnings };
}

/**
 * Validate git workflow configuration
 *
 * @param {Object} gitWorkflow - Git workflow configuration
 * @returns {Object} Errors and warnings
 * @private
 */
function validateGitWorkflow(gitWorkflow) {
  const errors = [];
  const warnings = [];

  // Validate branch naming
  if (gitWorkflow.branch_naming) {
    const naming = gitWorkflow.branch_naming;

    if (naming.max_length !== undefined) {
      if (typeof naming.max_length !== 'number') {
        errors.push('git_workflow.branch_naming.max_length: Must be a number');
      } else if (naming.max_length < 20 || naming.max_length > 100) {
        errors.push('git_workflow.branch_naming.max_length: Must be between 20 and 100');
      }
    }

    if (naming.description_format) {
      const validFormats = ['kebab-case', 'snake_case', 'camelCase'];
      if (!validFormats.includes(naming.description_format)) {
        errors.push(`git_workflow.branch_naming.description_format: Must be one of [${validFormats.join(', ')}]`);
      }
    }
  }

  // Validate commit conventions
  if (gitWorkflow.commit_conventions) {
    const conventions = gitWorkflow.commit_conventions;

    if (conventions.format && !['conventional', 'custom'].includes(conventions.format)) {
      errors.push('git_workflow.commit_conventions.format: Must be "conventional" or "custom"');
    }
  }

  // Validate checkpoint strategy
  if (gitWorkflow.checkpoint_strategy?.custom_checkpoints) {
    const checkpoints = gitWorkflow.checkpoint_strategy.custom_checkpoints;

    if (!Array.isArray(checkpoints)) {
      errors.push('git_workflow.checkpoint_strategy.custom_checkpoints: Must be an array');
    } else {
      checkpoints.forEach((cp, index) => {
        if (!cp.after_task) {
          errors.push(`git_workflow.checkpoint_strategy.custom_checkpoints[${index}]: Missing required field "after_task"`);
        }
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validate delegation patterns
 *
 * @param {Array} patterns - Delegation patterns array
 * @returns {Object} Errors and warnings
 * @private
 */
function validateDelegationPatterns(patterns) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(patterns)) {
    errors.push('delegation.patterns: Must be an array');
    return { errors, warnings };
  }

  patterns.forEach((pattern, index) => {
    if (!pattern.task_type) {
      errors.push(`delegation.patterns[${index}]: Missing required field "task_type"`);
    }

    if (!pattern.agent) {
      errors.push(`delegation.patterns[${index}]: Missing required field "agent"`);
    }

    // Warn about missing conditions
    if (!pattern.conditions || pattern.conditions.length === 0) {
      warnings.push(`delegation.patterns[${index}]: No conditions defined (may always apply)`);
    }
  });

  return { errors, warnings };
}

/**
 * Validate full PRD metadata (workflow + metadata sections)
 *
 * @param {Object} metadata - Complete PRD metadata object
 * @returns {Object} Validation result
 *
 * @example
 * const result = validatePrdMetadata(parsedMetadata);
 */
export function validatePrdMetadata(metadata) {
  const errors = [];
  const warnings = [];

  // Validate workflow section
  if (metadata.workflow) {
    const workflowResult = validateWorkflowConfig(metadata.workflow);
    errors.push(...workflowResult.errors);
    warnings.push(...workflowResult.warnings);
  }

  // Validate general metadata
  if (metadata.metadata) {
    const metadataResult = validateGeneralMetadata(metadata.metadata);
    errors.push(...metadataResult.errors);
    warnings.push(...metadataResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Validate general metadata fields
 *
 * @param {Object} metadata - General metadata object
 * @returns {Object} Errors and warnings
 * @private
 */
function validateGeneralMetadata(metadata) {
  const errors = [];
  const warnings = [];

  // Version format validation
  if (metadata.version) {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(metadata.version)) {
      errors.push('metadata.version: Must follow semantic versioning (e.g., 1.0.0)');
    }
  }

  // Priority validation
  if (metadata.priority) {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(metadata.priority)) {
      errors.push(`metadata.priority: Must be one of [${validPriorities.join(', ')}]`);
    }
  }

  // Status validation
  if (metadata.status) {
    const validStatuses = ['draft', 'review', 'approved', 'in-progress', 'completed'];
    if (!validStatuses.includes(metadata.status)) {
      errors.push(`metadata.status: Must be one of [${validStatuses.join(', ')}]`);
    }
  }

  return { errors, warnings };
}

/**
 * Get helpful validation error messages with examples
 *
 * @param {Object} validationResult - Result from validateWorkflowConfig
 * @returns {string} Formatted error message with examples
 *
 * @example
 * const result = validateWorkflowConfig(config);
 * if (!result.valid) {
 *   console.error(getValidationHelp(result));
 * }
 */
export function getValidationHelp(validationResult) {
  if (validationResult.valid) {
    return 'Configuration is valid ✓';
  }

  const lines = ['Configuration validation failed:\n'];

  // Add errors
  if (validationResult.errors.length > 0) {
    lines.push('ERRORS:');
    validationResult.errors.forEach(error => {
      lines.push(`  ✗ ${error}`);

      // Add helpful examples for common errors
      if (error.includes('checkpoint_frequency')) {
        lines.push('    Example: checkpoint_frequency: "sprint" or checkpoint_frequency: 5');
      }
      if (error.includes('execution_command')) {
        lines.push('    Example: execution_command: "/implement-trd"');
      }
    });
    lines.push('');
  }

  // Add warnings
  if (validationResult.warnings.length > 0) {
    lines.push('WARNINGS:');
    validationResult.warnings.forEach(warning => {
      lines.push(`  ⚠ ${warning}`);
    });
    lines.push('');
  }

  // Add example configuration
  lines.push('Example valid configuration:');
  lines.push('```yaml');
  lines.push('workflow:');
  lines.push('  checkpoint_frequency: sprint');
  lines.push('  execution_command: /implement-trd');
  lines.push('  quality_gates:');
  lines.push('    sprint:');
  lines.push('      enabled: true');
  lines.push('      gates:');
  lines.push('        - name: Unit Tests');
  lines.push('          type: test_coverage');
  lines.push('          threshold: 80');
  lines.push('```');

  return lines.join('\n');
}

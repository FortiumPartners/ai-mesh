/**
 * Configuration Override Applier - Production Implementation
 *
 * @module config-override-applier
 * @description Production implementation of configuration override application
 * Applies PRD workflow configuration overrides to TRD generation process.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-024
 */

/**
 * Apply configuration overrides to TRD context
 *
 * @param {Object} trdContext - Base TRD context object
 * @param {Object} workflowConfig - Workflow configuration from PRD metadata
 * @returns {Object} Enhanced TRD context with applied overrides
 *
 * @example
 * const enhanced = applyConfigOverrides(trdContext, prdWorkflowConfig);
 * // => Enhanced context with checkpoint_frequency, execution_command, quality_gates applied
 */
export function applyConfigOverrides(trdContext, workflowConfig) {
  if (!trdContext || typeof trdContext !== 'object') {
    throw new Error('Invalid TRD context: expected non-null object');
  }

  if (!workflowConfig || typeof workflowConfig !== 'object') {
    // No overrides to apply
    return { ...trdContext };
  }

  const enhanced = { ...trdContext };

  // Apply checkpoint frequency override
  if (workflowConfig.checkpoint_frequency !== undefined) {
    enhanced.checkpoint_frequency = workflowConfig.checkpoint_frequency;
    enhanced._overrides = enhanced._overrides || {};
    enhanced._overrides.checkpoint_frequency = {
      applied: true,
      value: workflowConfig.checkpoint_frequency,
      source: 'PRD metadata'
    };
  }

  // Apply execution command preference
  if (workflowConfig.execution_command !== undefined) {
    enhanced.execution_command = workflowConfig.execution_command;
    enhanced._overrides = enhanced._overrides || {};
    enhanced._overrides.execution_command = {
      applied: true,
      value: workflowConfig.execution_command,
      source: 'PRD metadata'
    };
  }

  // Apply git workflow configuration
  if (workflowConfig.git_workflow) {
    enhanced.git_workflow = applyGitWorkflowOverrides(
      enhanced.git_workflow || {},
      workflowConfig.git_workflow
    );
    enhanced._overrides = enhanced._overrides || {};
    enhanced._overrides.git_workflow = {
      applied: true,
      source: 'PRD metadata'
    };
  }

  // Apply quality gates customization
  if (workflowConfig.quality_gates) {
    enhanced.quality_gates = applyQualityGateOverrides(
      enhanced.quality_gates || {},
      workflowConfig.quality_gates
    );
    enhanced._overrides = enhanced._overrides || {};
    enhanced._overrides.quality_gates = {
      applied: true,
      source: 'PRD metadata'
    };
  }

  // Apply delegation patterns
  if (workflowConfig.delegation) {
    enhanced.delegation = applyDelegationOverrides(
      enhanced.delegation || {},
      workflowConfig.delegation
    );
    enhanced._overrides = enhanced._overrides || {};
    enhanced._overrides.delegation = {
      applied: true,
      source: 'PRD metadata'
    };
  }

  // Apply performance configuration
  if (workflowConfig.performance) {
    enhanced.performance = {
      ...(enhanced.performance || {}),
      ...workflowConfig.performance
    };
    enhanced._overrides = enhanced._overrides || {};
    enhanced._overrides.performance = {
      applied: true,
      source: 'PRD metadata'
    };
  }

  return enhanced;
}

/**
 * Apply git workflow configuration overrides
 *
 * @param {Object} baseConfig - Base git workflow configuration
 * @param {Object} overrides - Override configuration from PRD
 * @returns {Object} Merged git workflow configuration
 * @private
 */
function applyGitWorkflowOverrides(baseConfig, overrides) {
  const merged = { ...baseConfig };

  // Apply branch naming overrides
  if (overrides.branch_naming) {
    merged.branch_naming = {
      ...(merged.branch_naming || {}),
      ...overrides.branch_naming
    };
  }

  // Apply commit conventions overrides
  if (overrides.commit_conventions) {
    merged.commit_conventions = {
      ...(merged.commit_conventions || {}),
      ...overrides.commit_conventions
    };
  }

  // Apply checkpoint strategy overrides
  if (overrides.checkpoint_strategy) {
    merged.checkpoint_strategy = {
      ...(merged.checkpoint_strategy || {}),
      ...overrides.checkpoint_strategy
    };

    // Merge custom checkpoints arrays
    if (overrides.checkpoint_strategy.custom_checkpoints) {
      const baseCheckpoints = merged.checkpoint_strategy.custom_checkpoints || [];
      merged.checkpoint_strategy.custom_checkpoints = [
        ...baseCheckpoints,
        ...overrides.checkpoint_strategy.custom_checkpoints
      ];
    }
  }

  return merged;
}

/**
 * Apply quality gate configuration overrides
 *
 * @param {Object} baseGates - Base quality gates configuration
 * @param {Object} overrides - Override configuration from PRD
 * @returns {Object} Merged quality gates configuration
 * @private
 */
function applyQualityGateOverrides(baseGates, overrides) {
  const merged = { ...baseGates };

  const levels = ['sprint', 'phase', 'final'];

  levels.forEach(level => {
    if (overrides[level]) {
      if (!merged[level]) {
        // Use override directly if no base config
        merged[level] = overrides[level];
      } else {
        // Merge configurations
        merged[level] = {
          enabled: overrides[level].enabled !== undefined
            ? overrides[level].enabled
            : merged[level].enabled,
          gates: mergeQualityGates(
            merged[level].gates || [],
            overrides[level].gates || []
          )
        };
      }
    }
  });

  return merged;
}

/**
 * Merge quality gate arrays intelligently
 *
 * @param {Array} baseGates - Base quality gates array
 * @param {Array} overrideGates - Override quality gates array
 * @returns {Array} Merged gates array
 * @private
 */
function mergeQualityGates(baseGates, overrideGates) {
  const merged = [...baseGates];
  const baseNames = new Set(baseGates.map(g => g.name));

  // Add or update gates from overrides
  overrideGates.forEach(overrideGate => {
    if (baseNames.has(overrideGate.name)) {
      // Update existing gate
      const index = merged.findIndex(g => g.name === overrideGate.name);
      merged[index] = { ...merged[index], ...overrideGate };
    } else {
      // Add new gate
      merged.push(overrideGate);
    }
  });

  return merged;
}

/**
 * Apply delegation pattern overrides
 *
 * @param {Object} baseConfig - Base delegation configuration
 * @param {Object} overrides - Override configuration from PRD
 * @returns {Object} Merged delegation configuration
 * @private
 */
function applyDelegationOverrides(baseConfig, overrides) {
  const merged = { ...baseConfig };

  if (overrides.enable_auto_delegation !== undefined) {
    merged.enable_auto_delegation = overrides.enable_auto_delegation;
  }

  if (overrides.patterns) {
    const basePatterns = merged.patterns || [];
    merged.patterns = mergeDelegationPatterns(basePatterns, overrides.patterns);
  }

  return merged;
}

/**
 * Merge delegation patterns intelligently
 *
 * @param {Array} basePatterns - Base delegation patterns
 * @param {Array} overridePatterns - Override delegation patterns
 * @returns {Array} Merged patterns array
 * @private
 */
function mergeDelegationPatterns(basePatterns, overridePatterns) {
  const merged = [...basePatterns];
  const baseTaskTypes = new Set(basePatterns.map(p => p.task_type));

  overridePatterns.forEach(overridePattern => {
    if (baseTaskTypes.has(overridePattern.task_type)) {
      // Update existing pattern
      const index = merged.findIndex(p => p.task_type === overridePattern.task_type);
      merged[index] = { ...merged[index], ...overridePattern };
    } else {
      // Add new pattern
      merged.push(overridePattern);
    }
  });

  return merged;
}

/**
 * Apply checkpoint frequency override to checkpoint injector configuration
 *
 * @param {Object} injectorConfig - Base checkpoint injector configuration
 * @param {string|number} checkpointFrequency - Frequency override from PRD
 * @returns {Object} Updated injector configuration
 *
 * @example
 * const config = applyCheckpointFrequencyOverride(injectorConfig, 'sprint');
 */
export function applyCheckpointFrequencyOverride(injectorConfig, checkpointFrequency) {
  return {
    ...injectorConfig,
    checkpoint_frequency: checkpointFrequency,
    _override_applied: true
  };
}

/**
 * Apply commit scope override to commit template generator
 *
 * @param {Object} templateConfig - Base template generator configuration
 * @param {string} commitScope - Commit scope override from PRD
 * @returns {Object} Updated template configuration
 *
 * @example
 * const config = applyCommitScopeOverride(templateConfig, 'feature-name');
 */
export function applyCommitScopeOverride(templateConfig, commitScope) {
  return {
    ...templateConfig,
    default_scope: commitScope,
    _override_applied: true
  };
}

/**
 * Apply execution command override to workflow generator
 *
 * @param {Object} workflowConfig - Base workflow generator configuration
 * @param {string} executionCommand - Execution command override from PRD
 * @returns {Object} Updated workflow configuration
 *
 * @example
 * const config = applyExecutionCommandOverride(workflowConfig, '/implement-trd');
 */
export function applyExecutionCommandOverride(workflowConfig, executionCommand) {
  return {
    ...workflowConfig,
    execution_command: executionCommand,
    _override_applied: true
  };
}

/**
 * Get summary of applied overrides
 *
 * @param {Object} enhancedContext - TRD context with applied overrides
 * @returns {Object} Summary of overrides
 *
 * @example
 * const summary = getOverrideSummary(enhancedContext);
 * console.log(`Applied ${summary.count} overrides from ${summary.source}`);
 */
export function getOverrideSummary(enhancedContext) {
  if (!enhancedContext._overrides) {
    return {
      count: 0,
      source: null,
      overrides: []
    };
  }

  const overrideKeys = Object.keys(enhancedContext._overrides);

  return {
    count: overrideKeys.length,
    source: 'PRD metadata',
    overrides: overrideKeys.map(key => ({
      setting: key,
      applied: enhancedContext._overrides[key].applied,
      value: enhancedContext._overrides[key].value
    }))
  };
}

/**
 * Validate that overrides were applied correctly
 *
 * @param {Object} enhancedContext - TRD context with applied overrides
 * @param {Object} workflowConfig - Original workflow configuration
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateOverrides(enhancedContext, workflowConfig);
 * if (!result.valid) {
 *   console.error('Override validation failed:', result.errors);
 * }
 */
export function validateOverrides(enhancedContext, workflowConfig) {
  const errors = [];
  const warnings = [];

  // Check checkpoint_frequency override
  if (workflowConfig.checkpoint_frequency !== undefined) {
    if (enhancedContext.checkpoint_frequency !== workflowConfig.checkpoint_frequency) {
      errors.push('checkpoint_frequency override not applied correctly');
    }
  }

  // Check execution_command override
  if (workflowConfig.execution_command !== undefined) {
    if (enhancedContext.execution_command !== workflowConfig.execution_command) {
      errors.push('execution_command override not applied correctly');
    }
  }

  // Check quality_gates override
  if (workflowConfig.quality_gates !== undefined) {
    if (!enhancedContext.quality_gates) {
      errors.push('quality_gates override not applied');
    }
  }

  // Check git_workflow override
  if (workflowConfig.git_workflow !== undefined) {
    if (!enhancedContext.git_workflow) {
      errors.push('git_workflow override not applied');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: getOverrideSummary(enhancedContext)
  };
}

/**
 * Remove override metadata from context (cleanup)
 *
 * @param {Object} enhancedContext - TRD context with override metadata
 * @returns {Object} Clean context without metadata
 *
 * @example
 * const clean = removeOverrideMetadata(enhancedContext);
 */
export function removeOverrideMetadata(enhancedContext) {
  const clean = { ...enhancedContext };
  delete clean._overrides;
  return clean;
}

/**
 * Create override report for logging/debugging
 *
 * @param {Object} enhancedContext - TRD context with applied overrides
 * @returns {string} Formatted override report
 *
 * @example
 * console.log(createOverrideReport(enhancedContext));
 */
export function createOverrideReport(enhancedContext) {
  const summary = getOverrideSummary(enhancedContext);

  if (summary.count === 0) {
    return 'No configuration overrides applied';
  }

  const lines = [
    `Configuration Overrides Applied: ${summary.count}`,
    `Source: ${summary.source}`,
    '',
    'Applied Settings:'
  ];

  summary.overrides.forEach(override => {
    lines.push(`  • ${override.setting}: ${JSON.stringify(override.value)}`);
  });

  return lines.join('\n');
}

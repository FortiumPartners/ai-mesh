/**
 * Checkpoint Interval Calculator
 *
 * @module interval-calculator
 * @description Production implementation of checkpoint interval calculation with hybrid approach
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-014
 */

/**
 * Default configuration for interval calculation
 * @constant
 */
const DEFAULT_CONFIG = {
  // Sprint-based thresholds
  minSprintsForSprintBased: 2,
  maxSprintsForSprintBased: 20,

  // Task-count-based thresholds
  minTasksForTaskBased: 10,
  idealCheckpointFrequency: 7, // 1 checkpoint per 7 tasks (ideal)
  minCheckpoints: 2,
  maxCheckpoints: 15,

  // Hybrid switching thresholds
  unevenSprintThreshold: 3.0, // coefficient of variation
  smallSprintThreshold: 3,
  largeTaskCountThreshold: 100
};

/**
 * Calculate optimal checkpoint interval strategy
 *
 * @param {Object} taskBreakdown - Structured task breakdown with phases, sprints, tasks
 * @param {Object} [config={}] - Configuration overrides
 * @returns {Object} Interval calculation result with strategy and parameters
 *
 * @example
 * const result = calculateCheckpointInterval(taskBreakdown, { maxCheckpoints: 10 });
 * // Returns: { strategy: 'sprint', frequency: 'sprint', ... }
 */
export function calculateCheckpointInterval(taskBreakdown, config = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate input
  if (!taskBreakdown || !taskBreakdown.phases || !Array.isArray(taskBreakdown.phases)) {
    throw new Error('Invalid task breakdown: missing phases array');
  }

  // Analyze task breakdown structure
  const analysis = analyzeTaskBreakdown(taskBreakdown);

  // Check for configuration override
  if (config.checkpoint_frequency !== undefined) {
    return applyConfigurationOverride(config.checkpoint_frequency, analysis, mergedConfig);
  }

  // Apply hybrid strategy selection
  const strategy = selectOptimalStrategy(analysis, mergedConfig);

  return strategy;
}

/**
 * Analyze task breakdown to extract structural metrics
 *
 * @param {Object} taskBreakdown - Task breakdown structure
 * @returns {Object} Analysis metrics
 * @private
 */
function analyzeTaskBreakdown(taskBreakdown) {
  const analysis = {
    totalPhases: 0,
    totalSprints: 0,
    totalTasks: 0,
    sprintSizes: [],
    phaseSizes: [],
    hasSprintStructure: false,
    hasPhaseStructure: false,
    avgSprintSize: 0,
    avgPhaseSize: 0,
    sprintSizeVariation: 0,
    emptySprintCount: 0,
    emptyPhaseCount: 0
  };

  taskBreakdown.phases.forEach(phase => {
    let phaseTasks = 0;

    if (phase.sprints && Array.isArray(phase.sprints)) {
      analysis.totalPhases++;
      analysis.hasPhaseStructure = true;

      phase.sprints.forEach(sprint => {
        analysis.totalSprints++;

        const taskCount = (sprint.tasks && Array.isArray(sprint.tasks))
          ? sprint.tasks.length
          : 0;

        if (taskCount > 0) {
          analysis.sprintSizes.push(taskCount);
          analysis.hasSprintStructure = true;
          phaseTasks += taskCount;
          analysis.totalTasks += taskCount;
        } else {
          analysis.emptySprintCount++;
        }
      });
    }

    if (phaseTasks > 0) {
      analysis.phaseSizes.push(phaseTasks);
    } else {
      analysis.emptyPhaseCount++;
    }
  });

  // Calculate averages
  if (analysis.sprintSizes.length > 0) {
    analysis.avgSprintSize = analysis.sprintSizes.reduce((a, b) => a + b, 0) / analysis.sprintSizes.length;
    analysis.sprintSizeVariation = calculateCoefficientOfVariation(analysis.sprintSizes);
  }

  if (analysis.phaseSizes.length > 0) {
    analysis.avgPhaseSize = analysis.phaseSizes.reduce((a, b) => a + b, 0) / analysis.phaseSizes.length;
  }

  return analysis;
}

/**
 * Calculate coefficient of variation for array of numbers
 *
 * @param {number[]} values - Array of numeric values
 * @returns {number} Coefficient of variation (standard deviation / mean)
 * @private
 */
function calculateCoefficientOfVariation(values) {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  if (mean === 0) return 0;

  const variance = values.reduce((sum, val) => {
    return sum + Math.pow(val - mean, 2);
  }, 0) / values.length;

  const stdDev = Math.sqrt(variance);

  return stdDev / mean;
}

/**
 * Select optimal checkpoint strategy based on analysis
 *
 * @param {Object} analysis - Task breakdown analysis
 * @param {Object} config - Configuration
 * @returns {Object} Selected strategy with parameters
 * @private
 */
function selectOptimalStrategy(analysis, config) {
  // Strategy 1: No sprints or phases - use task-count-based
  if (!analysis.hasSprintStructure && !analysis.hasPhaseStructure) {
    return createTaskCountStrategy(analysis, config);
  }

  // Strategy 2: Very large TRD (>100 tasks) - use task-count-based for granular control
  if (analysis.totalTasks > config.largeTaskCountThreshold) {
    return createTaskCountStrategy(analysis, config);
  }

  // Strategy 3: No sprints but has phases - use phase-based
  if (!analysis.hasSprintStructure && analysis.hasPhaseStructure) {
    return createPhaseStrategy(analysis, config);
  }

  // Strategy 4: Uneven sprint sizes - use task-count-based for consistency
  if (analysis.sprintSizeVariation > config.unevenSprintThreshold) {
    return createTaskCountStrategy(analysis, config);
  }

  // Strategy 5: Too many small sprints (avg < 3 tasks) - use phase-based
  if (analysis.avgSprintSize < config.smallSprintThreshold) {
    return createPhaseStrategy(analysis, config);
  }

  // Strategy 6: Too few sprints - use phase-based
  if (analysis.totalSprints < config.minSprintsForSprintBased) {
    return createPhaseStrategy(analysis, config);
  }

  // Strategy 7: Too many sprints - use task-count-based to limit checkpoints
  if (analysis.totalSprints > config.maxSprintsForSprintBased) {
    return createTaskCountStrategy(analysis, config);
  }

  // Default: Sprint-based (best for well-structured TRDs)
  return createSprintStrategy(analysis, config);
}

/**
 * Create sprint-based strategy
 *
 * @param {Object} analysis - Task breakdown analysis
 * @param {Object} config - Configuration
 * @returns {Object} Sprint-based strategy
 * @private
 */
function createSprintStrategy(analysis, config) {
  return {
    strategy: 'sprint',
    frequency: 'sprint',
    reasoning: 'Well-structured TRD with balanced sprint sizes',
    metrics: {
      totalCheckpoints: analysis.totalSprints - analysis.emptySprintCount,
      avgTasksPerCheckpoint: analysis.avgSprintSize,
      coverage: calculateCoverage(analysis.totalTasks, analysis.totalSprints - analysis.emptySprintCount, config)
    },
    parameters: {
      checkpointAfterSprint: true,
      skipEmptyPrints: true
    },
    analysis
  };
}

/**
 * Create phase-based strategy
 *
 * @param {Object} analysis - Task breakdown analysis
 * @param {Object} config - Configuration
 * @returns {Object} Phase-based strategy
 * @private
 */
function createPhaseStrategy(analysis, config) {
  return {
    strategy: 'phase',
    frequency: 'phase',
    reasoning: analysis.hasSprintStructure
      ? 'Sprint structure exists but sprints are too small or unbalanced'
      : 'No sprint structure defined, using phase boundaries',
    metrics: {
      totalCheckpoints: analysis.totalPhases - analysis.emptyPhaseCount,
      avgTasksPerCheckpoint: analysis.avgPhaseSize,
      coverage: calculateCoverage(analysis.totalTasks, analysis.totalPhases - analysis.emptyPhaseCount, config)
    },
    parameters: {
      checkpointAfterPhase: true,
      skipEmptyPhases: true
    },
    analysis
  };
}

/**
 * Create task-count-based strategy
 *
 * @param {Object} analysis - Task breakdown analysis
 * @param {Object} config - Configuration
 * @returns {Object} Task-count-based strategy
 * @private
 */
function createTaskCountStrategy(analysis, config) {
  // Calculate optimal frequency
  let frequency = config.idealCheckpointFrequency;
  const estimatedCheckpoints = Math.ceil(analysis.totalTasks / frequency);

  // Adjust if too many checkpoints
  if (estimatedCheckpoints > config.maxCheckpoints) {
    frequency = Math.ceil(analysis.totalTasks / config.maxCheckpoints);
  }

  // Adjust if too few checkpoints
  if (estimatedCheckpoints < config.minCheckpoints) {
    frequency = Math.ceil(analysis.totalTasks / config.minCheckpoints);
  }

  // Ensure minimum frequency of 1
  frequency = Math.max(1, frequency);

  const actualCheckpoints = Math.ceil(analysis.totalTasks / frequency);

  return {
    strategy: 'task-count',
    frequency,
    reasoning: analysis.totalTasks > config.largeTaskCountThreshold
      ? 'Large TRD requires granular checkpoint control'
      : analysis.sprintSizeVariation > config.unevenSprintThreshold
        ? 'Uneven sprint sizes require consistent checkpoint intervals'
        : 'Task count-based checkpoints provide optimal coverage',
    metrics: {
      totalCheckpoints: actualCheckpoints,
      avgTasksPerCheckpoint: analysis.totalTasks / actualCheckpoints,
      coverage: calculateCoverage(analysis.totalTasks, actualCheckpoints, config)
    },
    parameters: {
      checkpointEveryNTasks: frequency,
      handleRemainder: true
    },
    analysis
  };
}

/**
 * Apply configuration override for checkpoint frequency
 *
 * @param {string|number} frequency - Override frequency
 * @param {Object} analysis - Task breakdown analysis
 * @param {Object} config - Configuration
 * @returns {Object} Override strategy
 * @private
 */
function applyConfigurationOverride(frequency, analysis, config) {
  if (frequency === 'sprint') {
    return {
      ...createSprintStrategy(analysis, config),
      reasoning: 'Explicit configuration override: sprint-based checkpoints'
    };
  }

  if (frequency === 'phase') {
    return {
      ...createPhaseStrategy(analysis, config),
      reasoning: 'Explicit configuration override: phase-based checkpoints'
    };
  }

  if (typeof frequency === 'number' && frequency > 0) {
    const actualCheckpoints = Math.ceil(analysis.totalTasks / frequency);

    return {
      strategy: 'task-count',
      frequency,
      reasoning: `Explicit configuration override: checkpoint every ${frequency} tasks`,
      metrics: {
        totalCheckpoints: actualCheckpoints,
        avgTasksPerCheckpoint: analysis.totalTasks / actualCheckpoints,
        coverage: calculateCoverage(analysis.totalTasks, actualCheckpoints, config)
      },
      parameters: {
        checkpointEveryNTasks: frequency,
        handleRemainder: true
      },
      analysis
    };
  }

  // Invalid override - fall back to default strategy
  return selectOptimalStrategy(analysis, config);
}

/**
 * Calculate checkpoint coverage score
 *
 * @param {number} totalTasks - Total number of tasks
 * @param {number} checkpointCount - Number of checkpoints
 * @param {Object} config - Configuration
 * @returns {number} Coverage score (0-100)
 * @private
 */
function calculateCoverage(totalTasks, checkpointCount, config) {
  if (totalTasks === 0 || checkpointCount === 0) return 0;

  // Ideal: 1 checkpoint per 5-10 tasks
  const idealCheckpoints = Math.ceil(totalTasks / config.idealCheckpointFrequency);
  const coverage = Math.min(100, (checkpointCount / idealCheckpoints) * 100);

  return Math.round(coverage);
}

/**
 * Get human-readable explanation of strategy selection
 *
 * @param {Object} strategyResult - Result from calculateCheckpointInterval
 * @returns {string} Formatted explanation
 */
export function explainStrategy(strategyResult) {
  const { strategy, frequency, reasoning, metrics, analysis } = strategyResult;

  let explanation = `Selected Strategy: ${strategy.toUpperCase()}\n\n`;
  explanation += `Reasoning: ${reasoning}\n\n`;
  explanation += `Metrics:\n`;
  explanation += `- Total Tasks: ${analysis.totalTasks}\n`;
  explanation += `- Total Checkpoints: ${metrics.totalCheckpoints}\n`;
  explanation += `- Avg Tasks per Checkpoint: ${metrics.avgTasksPerCheckpoint.toFixed(1)}\n`;
  explanation += `- Coverage Score: ${metrics.coverage}%\n\n`;

  if (strategy === 'sprint') {
    explanation += `Checkpoints will be placed at the end of each sprint.\n`;
    explanation += `- Total Sprints: ${analysis.totalSprints}\n`;
    explanation += `- Avg Sprint Size: ${analysis.avgSprintSize.toFixed(1)} tasks\n`;
  } else if (strategy === 'phase') {
    explanation += `Checkpoints will be placed at the end of each phase.\n`;
    explanation += `- Total Phases: ${analysis.totalPhases}\n`;
    explanation += `- Avg Phase Size: ${analysis.avgPhaseSize.toFixed(1)} tasks\n`;
  } else if (strategy === 'task-count') {
    explanation += `Checkpoints will be placed every ${frequency} tasks.\n`;
  }

  return explanation;
}

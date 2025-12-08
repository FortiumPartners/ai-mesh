/**
 * Workflow Complexity Assessment Prototype
 *
 * @module complexity-assessor
 * @description Prototype implementation of complexity assessment algorithm (WF-COMPLEX-001)
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-007
 */

/**
 * Default weights for complexity metrics
 */
const DEFAULT_WEIGHTS = {
  taskCount: 0.30,
  phaseCount: 0.20,
  dependencyDepth: 0.25,
  taskTypeDiversity: 0.25
};

/**
 * Default thresholds for complexity classification
 */
const DEFAULT_THRESHOLDS = {
  simple: 0.3,
  moderate: 0.6,
  complex: 1.0
};

/**
 * Assess TRD workflow complexity and generate recommendations
 *
 * @param {Object} trdContext - TRD structure with tasks, phases, dependencies
 * @param {Object} taskTypeSummary - Task type analysis summary
 * @param {Object} options - Assessment options and thresholds
 * @returns {Object} Complexity assessment with recommendations
 */
export function assessComplexity(trdContext, taskTypeSummary, options = {}) {
  const {
    weights = DEFAULT_WEIGHTS,
    thresholds = DEFAULT_THRESHOLDS
  } = options;

  // Calculate individual complexity metrics
  const metrics = {
    taskCount: calculateTaskCountScore(trdContext, weights.taskCount),
    phaseCount: calculatePhaseCountScore(trdContext, weights.phaseCount),
    dependencyDepth: calculateDependencyDepthScore(trdContext, weights.dependencyDepth),
    taskTypeDiversity: calculateTaskTypeDiversityScore(taskTypeSummary, weights.taskTypeDiversity)
  };

  // Calculate weighted overall complexity score
  const complexityScore = Object.values(metrics).reduce((sum, metric) =>
    sum + (metric.score * metric.weight), 0
  );

  // Classify complexity level
  const complexityLevel = classifyComplexity(complexityScore, thresholds);

  // Select execution command
  const executionCommand = selectExecutionCommand(complexityLevel, metrics, trdContext);

  // Generate recommended approach
  const recommendedApproach = generateExecutionApproach(complexityLevel, metrics, trdContext);

  // Generate quality gates
  const qualityGates = generateQualityGates(complexityLevel, taskTypeSummary);

  return {
    complexityScore: parseFloat(complexityScore.toFixed(3)),
    complexityLevel,
    metrics,
    recommendations: {
      executionCommand,
      approach: recommendedApproach,
      qualityGates
    },
    analysis: {
      totalTasks: trdContext.totalTasks,
      totalPhases: trdContext.phases?.length || 1,
      maxDependencyDepth: metrics.dependencyDepth.maxDepth,
      uniqueTaskTypes: metrics.taskTypeDiversity.uniqueTypes
    }
  };
}

/**
 * Calculate task count score (Weight: 30%)
 *
 * @param {Object} trdContext - TRD context
 * @param {number} weight - Metric weight
 * @returns {Object} Score result
 */
function calculateTaskCountScore(trdContext, weight) {
  const taskCount = trdContext.totalTasks || 0;

  // Score curve: logarithmic scaling for task count
  let score;
  if (taskCount <= 20) {
    // Simple: linear 0.0 - 0.3
    score = (taskCount / 20) * 0.3;
  } else if (taskCount <= 50) {
    // Moderate: linear 0.3 - 0.6
    score = 0.3 + ((taskCount - 20) / 30) * 0.3;
  } else {
    // Complex: logarithmic 0.6 - 1.0
    const overflow = taskCount - 50;
    score = 0.6 + Math.min(0.4, Math.log10(overflow + 1) / 2.5);
  }

  return {
    score,
    weight,
    value: taskCount,
    category: categorizeTaskCount(taskCount),
    rationale: `${taskCount} tasks ${getTaskCountRationale(taskCount)}`
  };
}

/**
 * Calculate phase count score (Weight: 20%)
 *
 * @param {Object} trdContext - TRD context
 * @param {number} weight - Metric weight
 * @returns {Object} Score result
 */
function calculatePhaseCountScore(trdContext, weight) {
  const phaseCount = trdContext.phases ? trdContext.phases.length : 1;

  // Score curve: more phases = more coordination
  let score;
  if (phaseCount <= 2) {
    // Simple: 1-2 phases
    score = (phaseCount - 1) * 0.15; // 0.0 (1 phase) to 0.15 (2 phases)
  } else if (phaseCount <= 4) {
    // Moderate: 3-4 phases
    score = 0.15 + ((phaseCount - 2) / 2) * 0.35; // 0.15 to 0.5
  } else {
    // Complex: 5+ phases
    score = 0.5 + Math.min(0.5, (phaseCount - 4) * 0.1); // 0.5 to 1.0
  }

  return {
    score,
    weight,
    value: phaseCount,
    category: categorizePhaseCount(phaseCount),
    rationale: `${phaseCount} phase${phaseCount > 1 ? 's' : ''} ${getPhaseRationale(phaseCount)}`
  };
}

/**
 * Calculate dependency depth score (Weight: 25%)
 *
 * @param {Object} trdContext - TRD context
 * @param {number} weight - Metric weight
 * @returns {Object} Score result
 */
function calculateDependencyDepthScore(trdContext, weight) {
  // Build dependency graph
  const graph = buildDependencyGraph(trdContext);

  // Calculate max depth using topological sort
  const depths = calculateTaskDepths(graph);
  const maxDepth = depths.length > 0 ? Math.max(...Object.values(depths)) : 0;

  // Calculate average depth
  const avgDepth = depths.length > 0
    ? Object.values(depths).reduce((a, b) => a + b, 0) / Object.keys(depths).length
    : 0;

  // Score based on max depth
  let score;
  if (maxDepth <= 2) {
    // Simple: shallow dependencies
    score = maxDepth * 0.1; // 0.0 to 0.2
  } else if (maxDepth <= 5) {
    // Moderate: some dependency chains
    score = 0.2 + ((maxDepth - 2) / 3) * 0.3; // 0.2 to 0.5
  } else {
    // Complex: deep dependency chains
    score = 0.5 + Math.min(0.5, (maxDepth - 5) * 0.08); // 0.5 to 1.0
  }

  // Adjust for average depth (high avg depth increases complexity)
  const avgDepthBonus = avgDepth > 2 ? Math.min(0.15, (avgDepth - 2) * 0.05) : 0;
  score = Math.min(1.0, score + avgDepthBonus);

  return {
    score,
    weight,
    maxDepth,
    avgDepth: avgDepth.toFixed(2),
    category: categorizeDepth(maxDepth),
    rationale: `Max depth ${maxDepth}, avg ${avgDepth.toFixed(1)} ${getDepthRationale(maxDepth)}`
  };
}

/**
 * Calculate task type diversity score (Weight: 25%)
 *
 * @param {Object} taskTypeSummary - Task type summary
 * @param {number} weight - Metric weight
 * @returns {Object} Score result
 */
function calculateTaskTypeDiversityScore(taskTypeSummary, weight) {
  const uniqueTypes = taskTypeSummary.uniqueTypes || 0;
  const distribution = taskTypeSummary.typeDistribution || {};

  // Calculate entropy (diversity measure)
  const totalTasks = Object.values(distribution).reduce((a, b) => a + b, 0);
  let entropy = 0;
  Object.values(distribution).forEach(count => {
    if (count > 0) {
      const probability = count / totalTasks;
      entropy -= probability * Math.log2(probability);
    }
  });

  // Normalize entropy to [0, 1]
  const maxEntropy = Math.log2(6); // log2(number of task types)
  const normalizedEntropy = maxEntropy > 0 && entropy > 0 ? entropy / maxEntropy : 0;

  // Score based on unique types and distribution balance
  let score;
  if (uniqueTypes <= 2) {
    // Simple: 1-2 types (single domain)
    score = uniqueTypes * 0.15; // 0.15 to 0.3
  } else if (uniqueTypes <= 4) {
    // Moderate: 3-4 types (multi-domain)
    score = 0.3 + ((uniqueTypes - 2) / 2) * 0.3; // 0.3 to 0.6
  } else {
    // Complex: 5+ types (cross-domain)
    score = 0.6 + Math.min(0.4, (uniqueTypes - 4) * 0.1); // 0.6 to 1.0
  }

  // Bonus for balanced distribution (high entropy)
  const balanceBonus = normalizedEntropy * 0.2;
  score = Math.min(1.0, score + balanceBonus);

  return {
    score,
    weight,
    uniqueTypes,
    distribution,
    entropy: normalizedEntropy.toFixed(2),
    category: categorizeDiversity(uniqueTypes),
    rationale: `${uniqueTypes} task type${uniqueTypes > 1 ? 's' : ''} ${getDiversityRationale(uniqueTypes)}`
  };
}

/**
 * Build dependency graph from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {Object} Dependency graph
 */
function buildDependencyGraph(trdContext) {
  const graph = {};
  const tasks = trdContext.tasks || [];

  tasks.forEach(task => {
    graph[task.id] = {
      dependencies: task.dependencies || [],
      task
    };
  });

  return graph;
}

/**
 * Calculate task depths using DFS
 *
 * @param {Object} graph - Dependency graph
 * @returns {Object} Task depths map
 */
function calculateTaskDepths(graph) {
  const depths = {};
  const visited = new Set();

  function dfs(taskId) {
    if (visited.has(taskId)) {
      return depths[taskId] || 0;
    }

    visited.add(taskId);
    const node = graph[taskId];

    if (!node || !node.dependencies || node.dependencies.length === 0) {
      depths[taskId] = 0;
      return 0;
    }

    const maxDepDep = Math.max(
      ...node.dependencies.map(depId => dfs(depId))
    );

    depths[taskId] = maxDepDep + 1;
    return depths[taskId];
  }

  Object.keys(graph).forEach(taskId => dfs(taskId));

  return depths;
}

/**
 * Classify complexity level
 *
 * @param {number} score - Complexity score
 * @param {Object} thresholds - Classification thresholds
 * @returns {Object} Complexity level object
 */
function classifyComplexity(score, thresholds) {
  if (score <= thresholds.simple) {
    return {
      level: 'simple',
      label: 'Simple TRD',
      description: 'Straightforward implementation with minimal coordination',
      color: '#90EE90'
    };
  } else if (score <= thresholds.moderate) {
    return {
      level: 'moderate',
      label: 'Moderate TRD',
      description: 'Structured implementation with checkpoint management',
      color: '#FFD700'
    };
  } else {
    return {
      level: 'complex',
      label: 'Complex TRD',
      description: 'Orchestrated implementation with multi-agent delegation',
      color: '#FF6B6B'
    };
  }
}

/**
 * Select execution command based on complexity
 *
 * @param {Object} complexityLevel - Complexity level object
 * @param {Object} metrics - Complexity metrics
 * @param {Object} trdContext - TRD context
 * @returns {Object} Execution command recommendation
 */
export function selectExecutionCommand(complexityLevel, metrics, trdContext) {
  const taskCount = metrics.taskCount.value;
  const diversity = metrics.taskTypeDiversity.uniqueTypes;

  let command, reasoning;

  if (complexityLevel.level === 'simple') {
    command = '/implement-trd';
    reasoning = [
      'Low task count supports linear implementation',
      'Minimal coordination overhead',
      'Single-agent execution efficient',
      taskCount < 10 ? 'Use minimal checkpoints (phase-based)' : 'Use sprint-based checkpoints'
    ];
  } else if (complexityLevel.level === 'moderate') {
    if (diversity > 3 && taskCount > 30) {
      command = '/orchestrate-tasks';
      reasoning = [
        'Task diversity benefits from specialized agents',
        'Parallel execution possible for independent tasks',
        'Orchestration reduces overall execution time'
      ];
    } else {
      command = '/implement-trd';
      reasoning = [
        'Manageable complexity for single-agent execution',
        'Frequent checkpoints recommended',
        'Clear sprint boundaries guide progress'
      ];
    }
  } else {
    command = '/orchestrate-tasks';
    reasoning = [
      'High complexity requires orchestration',
      'Multi-agent delegation essential for efficiency',
      'Parallel execution maximizes throughput',
      taskCount > 80 ? 'Large task count: parallel phase execution recommended' : 'Sequential phases with parallel tasks'
    ];
  }

  return {
    primary: command,
    reasoning,
    checkpointStrategy: determineCheckpointStrategy(complexityLevel, metrics),
    parallelismRecommendation: determineParallelism(complexityLevel, metrics)
  };
}

/**
 * Determine checkpoint strategy
 *
 * @param {Object} complexityLevel - Complexity level
 * @param {Object} metrics - Complexity metrics
 * @returns {string|number} Checkpoint strategy
 */
function determineCheckpointStrategy(complexityLevel, metrics) {
  const taskCount = metrics.taskCount.value;

  if (complexityLevel.level === 'simple') {
    return taskCount < 10 ? 'phase' : 'sprint';
  } else if (complexityLevel.level === 'moderate') {
    return 'sprint';
  } else {
    return taskCount > 80 ? 5 : 'sprint';
  }
}

/**
 * Determine parallelism recommendation
 *
 * @param {Object} complexityLevel - Complexity level
 * @param {Object} metrics - Complexity metrics
 * @returns {Object} Parallelism recommendation
 */
function determineParallelism(complexityLevel, metrics) {
  if (complexityLevel.level === 'simple') {
    return {
      enabled: false,
      reason: 'Linear execution sufficient for simple TRDs'
    };
  }

  const maxDepth = metrics.dependencyDepth.maxDepth;
  const avgDepth = parseFloat(metrics.dependencyDepth.avgDepth);

  if (maxDepth <= 2) {
    return {
      enabled: true,
      strategy: 'aggressive',
      reason: 'Shallow dependencies allow extensive parallelism'
    };
  } else if (avgDepth < 3) {
    return {
      enabled: true,
      strategy: 'moderate',
      reason: 'Some tasks can execute in parallel within constraints'
    };
  } else {
    return {
      enabled: true,
      strategy: 'conservative',
      reason: 'Deep dependencies limit parallelism to independent subtrees'
    };
  }
}

/**
 * Generate execution approach
 *
 * @param {Object} complexityLevel - Complexity level
 * @param {Object} metrics - Complexity metrics
 * @param {Object} trdContext - TRD context
 * @returns {Object} Execution approach
 */
function generateExecutionApproach(complexityLevel, metrics, trdContext) {
  const approach = {
    overview: '',
    phases: [],
    guidelines: [],
    warnings: []
  };

  if (complexityLevel.level === 'simple') {
    approach.overview = 'Linear implementation with sprint-based checkpoints. Single developer can execute sequentially.';
    approach.phases = [
      'Execute tasks in order within each sprint',
      'Create git checkpoint after each sprint',
      'Validate tests pass before moving to next sprint'
    ];
    approach.guidelines = [
      'Focus on one sprint at a time',
      'Commit frequently within sprints for incremental progress',
      'Run test suite after each logical milestone'
    ];
  } else if (complexityLevel.level === 'moderate') {
    approach.overview = 'Structured implementation with frequent checkpoints. Consider task grouping by type for efficiency.';
    approach.phases = [
      'Group related tasks by type (e.g., all API work, then frontend)',
      'Execute each group with appropriate specialist focus',
      'Create checkpoints after each sprint or every 5-10 tasks',
      'Run integration tests at phase boundaries'
    ];
    approach.guidelines = [
      'Parallelize independent task groups if team capacity allows',
      'Maintain clear handoffs between task types',
      'Use feature branches for each sprint or major task group',
      'Review and merge checkpoint commits frequently'
    ];
    approach.warnings = [
      `High task diversity (${metrics.taskTypeDiversity.uniqueTypes} types) - coordinate between specialists`,
      metrics.dependencyDepth.maxDepth > 4 ? 'Deep dependencies - verify prerequisites before starting tasks' : null
    ].filter(Boolean);
  } else {
    approach.overview = 'Orchestrated multi-agent implementation with parallel execution. Requires careful coordination and delegation.';
    approach.phases = [
      'Delegate tasks to specialized agents based on type',
      'Execute independent tasks in parallel across phases',
      'Coordinate handoffs for cross-type dependencies',
      'Integrate and test at phase boundaries',
      'Final integration testing before completion'
    ];
    approach.guidelines = [
      'Use /orchestrate-tasks to manage multi-agent coordination',
      'Establish clear interfaces between parallel workstreams',
      'Schedule daily standups for dependency coordination',
      'Maintain integration branch for combining work',
      'Run comprehensive test suite at each phase gate'
    ];
    approach.warnings = [
      `Very high complexity (score: ${metrics.taskTypeDiversity.score.toFixed(2)}) - careful planning essential`,
      `${metrics.taskTypeDiversity.uniqueTypes} task types - requires ${metrics.taskTypeDiversity.uniqueTypes} specialized agents`,
      metrics.dependencyDepth.maxDepth > 6 ? 'Very deep dependencies - use critical path analysis' : null,
      trdContext.totalTasks > 80 ? 'Large task count - consider breaking into sub-projects' : null
    ].filter(Boolean);
  }

  return approach;
}

/**
 * Generate quality gates
 *
 * @param {Object} complexityLevel - Complexity level
 * @param {Object} taskTypeSummary - Task type summary
 * @returns {Object} Quality gates
 */
function generateQualityGates(complexityLevel, taskTypeSummary) {
  const gates = {
    sprint: [],
    phase: [],
    final: []
  };

  // Sprint-level gates
  gates.sprint.push({
    name: 'Unit Tests Passing',
    type: 'test_coverage',
    threshold: 80,
    required: true
  });

  gates.sprint.push({
    name: 'Git Checkpoint Created',
    type: 'git_workflow',
    required: true
  });

  // Phase-level gates
  gates.phase.push({
    name: 'Integration Tests Passing',
    type: 'integration_test',
    threshold: 70,
    required: true
  });

  gates.phase.push({
    name: 'Code Review',
    type: 'code_review',
    required: complexityLevel.level !== 'simple'
  });

  // Final gates
  gates.final.push({
    name: 'Full Test Suite',
    type: 'test_coverage',
    threshold: 85,
    required: true
  });

  gates.final.push({
    name: 'Documentation Updated',
    type: 'documentation',
    required: true
  });

  return gates;
}

// Helper categorization functions
function categorizeTaskCount(count) {
  if (count <= 20) return 'small';
  if (count <= 50) return 'medium';
  if (count <= 100) return 'large';
  return 'x-large';
}

function getTaskCountRationale(count) {
  if (count <= 10) return '- minimal coordination needed';
  if (count <= 20) return '- manageable with linear execution';
  if (count <= 50) return '- benefits from checkpoint structure';
  if (count <= 100) return '- requires orchestration for efficiency';
  return '- complex orchestration essential';
}

function categorizePhaseCount(count) {
  if (count <= 2) return 'single-phase';
  if (count <= 4) return 'multi-phase';
  return 'complex-phase';
}

function getPhaseRationale(count) {
  if (count === 1) return '- single development cycle';
  if (count <= 2) return '- minimal phase transitions';
  if (count <= 4) return '- structured phase gates needed';
  return '- complex phase orchestration required';
}

function categorizeDepth(depth) {
  if (depth <= 2) return 'shallow';
  if (depth <= 5) return 'moderate';
  if (depth <= 8) return 'deep';
  return 'very-deep';
}

function getDepthRationale(depth) {
  if (depth <= 2) return '- minimal sequencing constraints';
  if (depth <= 5) return '- some sequential dependencies';
  if (depth <= 8) return '- significant dependency chains';
  return '- complex dependency management needed';
}

function categorizeDiversity(count) {
  if (count <= 2) return 'single-domain';
  if (count <= 4) return 'multi-domain';
  return 'cross-domain';
}

function getDiversityRationale(count) {
  if (count === 1) return '- single specialist sufficient';
  if (count === 2) return '- minimal agent coordination';
  if (count <= 4) return '- multi-agent delegation beneficial';
  return '- complex agent orchestration required';
}

/**
 * Multi-Agent Delegation Generator - Production Implementation
 *
 * @module delegation-generator
 * @description Production implementation of delegation pattern generation
 * Generates multi-agent delegation recommendations based on task type classifications.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-019
 */

/**
 * Agent mapping configuration
 * Maps task types to specialized agent names
 */
const AGENT_MAPPING = {
  infrastructure: 'infrastructure-developer',
  security: 'code-reviewer',
  frontend: 'frontend-developer',
  backend: 'backend-developer',
  testing: ['test-runner', 'playwright-tester'],
  documentation: 'documentation-specialist',
  general: 'backend-developer'
};

/**
 * Generate delegation patterns based on task type classifications
 *
 * @param {Object} taskClassifications - Task type classifications map (task ID -> classification)
 * @param {Object[]} tasks - Array of task objects with full details
 * @param {Object} [options={}] - Generation options
 * @param {boolean} [options.includeSequential=true] - Detect sequential dependencies
 * @param {boolean} [options.includeParallel=true] - Detect parallel opportunities
 * @returns {Object} Delegation patterns with agent assignments and execution strategies
 *
 * @example
 * const patterns = generateDelegationPatterns(classifications, tasks);
 * // => {
 * //   patterns: [...],
 * //   summary: { totalAgents: 3, distribution: [...] },
 * //   coordinationRequired: true
 * // }
 */
export function generateDelegationPatterns(taskClassifications, tasks, options = {}) {
  const {
    includeSequential = true,
    includeParallel = true
  } = options;

  if (!taskClassifications || !tasks || tasks.length === 0) {
    return {
      patterns: [],
      summary: {
        totalAgents: 0,
        totalTasks: 0,
        distribution: [],
        recommendation: 'No tasks to delegate'
      },
      coordinationRequired: false
    };
  }

  // Group tasks by primary type
  const tasksByType = groupTasksByType(taskClassifications, tasks);

  // Generate delegation pattern for each type
  const patterns = [];

  Object.entries(tasksByType).forEach(([type, typeTasks]) => {
    if (typeTasks.length === 0 || type === 'general') return;

    const agent = mapTypeToAgent(type);
    const pattern = {
      taskType: type,
      agent: Array.isArray(agent) ? agent[0] : agent,
      alternativeAgents: Array.isArray(agent) ? agent.slice(1) : [],
      taskCount: typeTasks.length,
      taskIds: typeTasks.map(t => t.id),
      taskTitles: typeTasks.map(t => t.title || t.id)
    };

    // Analyze execution strategy
    if (includeSequential || includeParallel) {
      const executionAnalysis = analyzeExecutionStrategy(
        typeTasks,
        tasks,
        { includeSequential, includeParallel }
      );
      Object.assign(pattern, executionAnalysis);
    }

    // Add delegation context
    pattern.handoffContext = generateHandoffContext(type, typeTasks);
    pattern.qualityRequirements = generateQualityRequirements(type);

    patterns.push(pattern);
  });

  // Sort by task count (descending)
  patterns.sort((a, b) => b.taskCount - a.taskCount);

  // Add coordination notes for cross-type dependencies
  if (patterns.length > 1) {
    patterns.forEach(pattern => {
      pattern.coordinationNeeded = findCrossTypeDependencies(
        pattern,
        patterns,
        taskClassifications,
        tasks
      );
    });
  }

  return {
    patterns,
    summary: generateDelegationSummary(patterns, tasks.length),
    coordinationRequired: patterns.length > 1
  };
}

/**
 * Group tasks by their primary type
 *
 * @param {Object} taskClassifications - Task classifications map
 * @param {Object[]} tasks - Array of task objects
 * @returns {Object} Tasks grouped by type
 * @private
 */
function groupTasksByType(taskClassifications, tasks) {
  const tasksByType = {};

  tasks.forEach(task => {
    const classification = taskClassifications[task.id];
    if (!classification) return;

    const type = classification.primaryType || 'general';

    if (!tasksByType[type]) {
      tasksByType[type] = [];
    }

    tasksByType[type].push(task);
  });

  return tasksByType;
}

/**
 * Map task type to agent name
 *
 * @param {string} type - Task type
 * @returns {string|string[]} Agent name(s)
 * @private
 */
function mapTypeToAgent(type) {
  return AGENT_MAPPING[type] || AGENT_MAPPING.general;
}

/**
 * Analyze execution strategy for task group
 *
 * @param {Object[]} typeTasks - Tasks of specific type
 * @param {Object[]} allTasks - All tasks for dependency analysis
 * @param {Object} options - Analysis options
 * @returns {Object} Execution strategy analysis
 * @private
 */
function analyzeExecutionStrategy(typeTasks, allTasks, options) {
  const { includeSequential, includeParallel } = options;

  const strategy = {
    executionStrategy: 'sequential', // default
    parallelizable: [],
    sequential: [],
    estimatedDuration: estimateDuration(typeTasks)
  };

  if (!includeParallel && !includeSequential) {
    return strategy;
  }

  // Build dependency map
  const allTaskIds = new Set(allTasks.map(t => t.id));
  const typeTaskIds = new Set(typeTasks.map(t => t.id));

  typeTasks.forEach(task => {
    const hasInternalDeps = (task.dependencies || []).some(depId =>
      typeTaskIds.has(depId)
    );

    if (hasInternalDeps) {
      strategy.sequential.push(task.id);
    } else if (includeParallel) {
      strategy.parallelizable.push(task.id);
    }
  });

  // Determine overall strategy
  if (strategy.parallelizable.length > strategy.sequential.length) {
    strategy.executionStrategy = 'parallel';
  } else if (strategy.parallelizable.length > 0 && strategy.sequential.length > 0) {
    strategy.executionStrategy = 'mixed';
  }

  return strategy;
}

/**
 * Estimate duration for task group
 *
 * @param {Object[]} tasks - Array of tasks
 * @returns {string} Estimated duration
 * @private
 */
function estimateDuration(tasks) {
  const totalHours = tasks.reduce((sum, task) => {
    const duration = task.duration || '2 hours';
    const hours = parseFloat(duration);
    return sum + (isNaN(hours) ? 2 : hours);
  }, 0);

  if (totalHours < 8) {
    return `${totalHours.toFixed(1)} hours`;
  } else {
    const days = Math.ceil(totalHours / 8);
    return `${totalHours.toFixed(1)} hours (~${days} day${days > 1 ? 's' : ''})`;
  }
}

/**
 * Generate handoff context for task type
 *
 * @param {string} type - Task type
 * @param {Object[]} tasks - Tasks of this type
 * @returns {string} Handoff context description
 * @private
 */
function generateHandoffContext(type, tasks) {
  const contexts = {
    infrastructure: 'Requires AWS/Kubernetes/Docker expertise. Provide environment configurations and deployment requirements.',
    security: 'Security-focused implementation. Provide authentication requirements and compliance standards.',
    frontend: 'UI/UX implementation. Provide design mockups, component specifications, and style guides.',
    backend: 'Server-side logic and APIs. Provide database schema, API specifications, and business rules.',
    testing: 'Test implementation and execution. Provide test scenarios, acceptance criteria, and coverage targets.',
    documentation: 'Technical documentation. Provide API specifications, architecture diagrams, and usage examples.'
  };

  const context = contexts[type] || 'Standard task implementation.';

  // Add task-specific notes
  if (tasks.length > 5) {
    return `${context} Large task set (${tasks.length} tasks) - consider breaking into smaller batches.`;
  }

  return context;
}

/**
 * Generate quality requirements for task type
 *
 * @param {string} type - Task type
 * @returns {string} Quality requirements description
 * @private
 */
function generateQualityRequirements(type) {
  const requirements = {
    infrastructure: 'Infrastructure-as-code validation, security scanning, deployment testing',
    security: 'Security audit, penetration testing, compliance verification',
    frontend: 'UI testing, accessibility compliance (WCAG 2.1 AA), cross-browser compatibility',
    backend: 'Unit tests ≥80%, integration tests ≥70%, API documentation complete',
    testing: 'Test coverage targets met, CI integration verified, test documentation complete',
    documentation: 'Technical accuracy verified, examples tested, formatting validated'
  };

  return requirements[type] || 'Standard quality gates apply';
}

/**
 * Find cross-type dependencies for coordination
 *
 * @param {Object} pattern - Current delegation pattern
 * @param {Object[]} allPatterns - All delegation patterns
 * @param {Object} taskClassifications - Task classifications
 * @param {Object[]} tasks - All tasks
 * @returns {Object[]} Cross-type coordination needs
 * @private
 */
function findCrossTypeDependencies(pattern, allPatterns, taskClassifications, tasks) {
  const coordinationNeeded = [];

  pattern.taskIds.forEach(taskId => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies) return;

    task.dependencies.forEach(depId => {
      const depClassification = taskClassifications[depId];
      if (!depClassification) return;

      const depType = depClassification.primaryType;

      // Check if dependency is in different task type
      if (depType && depType !== pattern.taskType) {
        const depAgent = Array.isArray(AGENT_MAPPING[depType])
          ? AGENT_MAPPING[depType][0]
          : AGENT_MAPPING[depType] || AGENT_MAPPING.general;

        coordinationNeeded.push({
          task: taskId,
          dependsOn: depId,
          dependsOnType: depType,
          dependsOnAgent: depAgent,
          coordinationType: determineCoordinationType(pattern.taskType, depType)
        });
      }
    });
  });

  return coordinationNeeded;
}

/**
 * Determine coordination type between task types
 *
 * @param {string} fromType - Source task type
 * @param {string} toType - Dependency task type
 * @returns {string} Coordination type
 * @private
 */
function determineCoordinationType(fromType, toType) {
  // Common coordination patterns
  const patterns = {
    'frontend-backend': 'API Contract',
    'backend-infrastructure': 'Deployment Configuration',
    'backend-security': 'Authentication Integration',
    'frontend-testing': 'UI Test Scenarios',
    'backend-testing': 'API Test Coverage',
    'infrastructure-security': 'Security Hardening'
  };

  const key = `${fromType}-${toType}`;
  return patterns[key] || 'Standard Handoff';
}

/**
 * Generate delegation summary
 *
 * @param {Object[]} patterns - Delegation patterns
 * @param {number} totalTasks - Total task count
 * @returns {Object} Delegation summary
 * @private
 */
function generateDelegationSummary(patterns, totalTasks) {
  if (patterns.length === 0) {
    return {
      totalAgents: 0,
      totalTasks,
      distribution: [],
      recommendation: 'No specialized agents required'
    };
  }

  const distribution = patterns.map(p => ({
    agent: p.agent,
    taskType: p.taskType,
    taskCount: p.taskCount,
    percentage: ((p.taskCount / totalTasks) * 100).toFixed(1) + '%',
    estimatedDuration: p.estimatedDuration
  }));

  let recommendation;
  if (patterns.length === 1) {
    recommendation = `/implement-trd recommended - single agent (${patterns[0].agent}) sufficient`;
  } else if (patterns.length <= 3) {
    recommendation = `/implement-trd with sequential agent delegation - moderate coordination needed`;
  } else {
    recommendation = `/orchestrate-tasks recommended - complex multi-agent coordination required`;
  }

  return {
    totalAgents: patterns.length,
    totalTasks,
    distribution,
    recommendation
  };
}

/**
 * Format delegation patterns as markdown table
 *
 * @param {Object[]} patterns - Delegation patterns
 * @returns {string} Markdown table string
 *
 * @example
 * const markdown = formatDelegationTable(patterns);
 * // => "| Agent | Task Count | Strategy |..."
 */
export function formatDelegationTable(patterns) {
  if (!patterns || patterns.length === 0) {
    return 'No delegation patterns generated.';
  }

  let markdown = '| Agent | Task Type | Task Count | Strategy | Duration |\n';
  markdown += '|-------|-----------|------------|----------|----------|\n';

  patterns.forEach(pattern => {
    markdown += `| ${pattern.agent} | ${pattern.taskType} | ${pattern.taskCount} | ${pattern.executionStrategy || 'sequential'} | ${pattern.estimatedDuration || 'N/A'} |\n`;
  });

  return markdown;
}

/**
 * Format coordination needs as markdown list
 *
 * @param {Object[]} patterns - Delegation patterns with coordination needs
 * @returns {string} Markdown list string
 *
 * @example
 * const markdown = formatCoordinationNeeds(patterns);
 * // => "- backend-developer → frontend-developer: API Contract"
 */
export function formatCoordinationNeeds(patterns) {
  const coordinationPoints = [];

  patterns.forEach(pattern => {
    if (pattern.coordinationNeeded && pattern.coordinationNeeded.length > 0) {
      pattern.coordinationNeeded.forEach(coord => {
        coordinationPoints.push(
          `- **${pattern.agent}** → **${coord.dependsOnAgent}**: ${coord.coordinationType} (${coord.task} depends on ${coord.dependsOn})`
        );
      });
    }
  });

  if (coordinationPoints.length === 0) {
    return 'No cross-agent coordination required.';
  }

  return coordinationPoints.join('\n');
}

/**
 * Workflow Section Generator - Production Implementation
 *
 * @module workflow-section-generator
 * @description Production implementation of workflow section generation
 * Orchestrates task type detection, delegation, and quality gate generation
 * to produce complete TRD workflow sections.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-017
 */

import { analyzeTaskTypes } from './task-type-detector.js';
import { generateDelegationPatterns, formatDelegationTable, formatCoordinationNeeds } from './delegation-generator.js';
import { generateQualityGates, formatQualityGatesSection } from './quality-gate-generator.js';

/**
 * Generate complete workflow section for TRD document
 *
 * @param {Object} trdContext - Complete TRD context
 * @param {Object[]} trdContext.tasks - Array of task objects
 * @param {Object[]} [trdContext.phases] - Array of phase objects
 * @param {Object[]} [trdContext.sprints] - Array of sprint objects
 * @param {string} [trdContext.trdId] - TRD identifier
 * @param {string} [trdContext.title] - TRD title
 * @param {Object} [config={}] - Generation configuration
 * @param {string} [config.executionCommand='/implement-trd'] - Recommended execution command
 * @param {boolean} [config.includeComplexityAnalysis=true] - Include complexity assessment
 * @param {boolean} [config.includeDelegation=true] - Include agent delegation patterns
 * @param {boolean} [config.includeQualityGates=true] - Include quality gate specifications
 * @returns {Object} Complete workflow section with markdown content
 *
 * @example
 * const workflowSection = generateWorkflowSection(trdContext, {
 *   executionCommand: '/implement-trd',
 *   includeComplexityAnalysis: true
 * });
 * // => { markdown: '## Workflow...', analysis: {...}, metadata: {...} }
 */
export function generateWorkflowSection(trdContext, config = {}) {
  const startTime = performance.now();

  // Validate input
  if (!trdContext || !trdContext.tasks || !Array.isArray(trdContext.tasks)) {
    throw new Error('Invalid TRD context: missing tasks array');
  }

  const {
    executionCommand = '/implement-trd',
    includeComplexityAnalysis = true,
    includeDelegation = true,
    includeQualityGates = true
  } = config;

  // Step 1: Analyze task types
  const taskTypeAnalysis = analyzeTaskTypes(trdContext.tasks, config.taskTypeOptions);

  // Step 2: Assess complexity (if enabled)
  let complexityInfo = null;
  if (includeComplexityAnalysis) {
    complexityInfo = assessWorkflowComplexity(trdContext, taskTypeAnalysis);
  }

  // Step 3: Generate delegation patterns (if enabled)
  let delegationPatterns = null;
  if (includeDelegation) {
    delegationPatterns = generateDelegationPatterns(
      taskTypeAnalysis.classifications,
      trdContext.tasks,
      config.delegationOptions
    );
  }

  // Step 4: Generate quality gates (if enabled)
  let qualityGates = null;
  if (includeQualityGates) {
    qualityGates = generateQualityGates(
      trdContext,
      taskTypeAnalysis.summary,
      config.qualityGateOptions
    );
  }

  // Step 5: Determine execution approach
  const executionApproach = determineExecutionApproach(
    trdContext,
    complexityInfo,
    delegationPatterns
  );

  // Step 6: Render markdown workflow section
  const markdown = renderWorkflowMarkdown({
    trdContext,
    executionCommand: executionCommand,
    executionApproach,
    complexityInfo,
    taskTypeAnalysis,
    delegationPatterns,
    qualityGates
  });

  const endTime = performance.now();

  return {
    markdown,
    analysis: {
      taskTypes: taskTypeAnalysis,
      complexity: complexityInfo,
      delegation: delegationPatterns,
      qualityGates,
      executionApproach
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      generationTime: `${(endTime - startTime).toFixed(2)}ms`,
      version: '1.0.0',
      trdId: trdContext.trdId || 'TRD-UNKNOWN',
      taskCount: trdContext.tasks.length
    }
  };
}

/**
 * Assess workflow complexity based on task analysis
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} taskTypeAnalysis - Task type analysis result
 * @returns {Object} Complexity assessment
 * @private
 */
function assessWorkflowComplexity(trdContext, taskTypeAnalysis) {
  const taskCount = trdContext.tasks.length;
  const phaseCount = trdContext.phases?.length || 1;
  const sprintCount = trdContext.sprints?.length || Math.ceil(taskCount / 5);
  const typeCount = taskTypeAnalysis.summary.uniqueTypes;

  // Calculate complexity score (0-1 scale)
  let complexityScore = 0;

  // Task count factor (30%)
  if (taskCount <= 20) {
    complexityScore += 0.1 * 0.3;
  } else if (taskCount <= 50) {
    complexityScore += 0.5 * 0.3;
  } else {
    complexityScore += 1.0 * 0.3;
  }

  // Phase count factor (20%)
  if (phaseCount <= 2) {
    complexityScore += 0.2 * 0.2;
  } else if (phaseCount <= 4) {
    complexityScore += 0.6 * 0.2;
  } else {
    complexityScore += 1.0 * 0.2;
  }

  // Type diversity factor (50%)
  if (typeCount <= 2) {
    complexityScore += 0.3 * 0.5;
  } else if (typeCount <= 4) {
    complexityScore += 0.6 * 0.5;
  } else {
    complexityScore += 1.0 * 0.5;
  }

  // Classify complexity level
  let level, label, description;
  if (complexityScore <= 0.3) {
    level = 'simple';
    label = 'Simple TRD';
    description = 'Straightforward implementation with minimal coordination';
  } else if (complexityScore <= 0.6) {
    level = 'moderate';
    label = 'Moderate TRD';
    description = 'Structured implementation with checkpoint management';
  } else {
    level = 'complex';
    label = 'Complex TRD';
    description = 'Orchestrated implementation with multi-agent delegation';
  }

  return {
    score: parseFloat(complexityScore.toFixed(3)),
    level,
    label,
    description,
    metrics: {
      taskCount,
      phaseCount,
      sprintCount,
      typeCount
    }
  };
}

/**
 * Determine execution approach based on analysis
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} complexityInfo - Complexity assessment
 * @param {Object} delegationPatterns - Delegation patterns
 * @returns {Object} Execution approach recommendation
 * @private
 */
function determineExecutionApproach(trdContext, complexityInfo, delegationPatterns) {
  const taskCount = trdContext.tasks.length;
  const agentCount = delegationPatterns?.patterns?.length || 0;

  let approach = {
    summary: '',
    phases: [],
    guidelines: [],
    warnings: []
  };

  // Determine approach based on complexity
  if (!complexityInfo || complexityInfo.level === 'simple') {
    approach.summary = 'Linear implementation with sprint-based checkpoints. Single developer can execute sequentially.';
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
  } else if (complexityInfo.level === 'moderate') {
    approach.summary = 'Structured implementation with frequent checkpoints. Consider task grouping by type for efficiency.';
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

    if (agentCount > 3) {
      approach.warnings.push(
        `High task diversity (${agentCount} agent types) - coordinate between specialists`
      );
    }
  } else {
    approach.summary = 'Orchestrated multi-agent implementation with parallel execution. Requires careful coordination and delegation.';
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

    approach.warnings.push(
      `Very high complexity (${agentCount} agent types) - careful planning essential`
    );

    if (taskCount > 80) {
      approach.warnings.push(
        'Large task count - consider breaking into sub-projects'
      );
    }
  }

  return approach;
}

/**
 * Render complete workflow section as markdown
 *
 * @param {Object} context - Rendering context with all analysis results
 * @returns {string} Complete markdown workflow section
 * @private
 */
function renderWorkflowMarkdown(context) {
  const {
    trdContext,
    executionCommand,
    executionApproach,
    complexityInfo,
    taskTypeAnalysis,
    delegationPatterns,
    qualityGates
  } = context;

  let markdown = '## 📋 Workflow & Execution\n\n';

  // Complexity assessment section
  if (complexityInfo) {
    markdown += '### Complexity Assessment\n\n';
    markdown += `**Level**: ${complexityInfo.label} (Score: ${complexityInfo.score})\n\n`;
    markdown += `${complexityInfo.description}\n\n`;

    markdown += '**Metrics**:\n';
    markdown += `- **Task Count**: ${complexityInfo.metrics.taskCount} tasks\n`;
    markdown += `- **Phase Count**: ${complexityInfo.metrics.phaseCount} phases\n`;
    markdown += `- **Sprint Count**: ${complexityInfo.metrics.sprintCount} sprints\n`;
    markdown += `- **Task Type Diversity**: ${complexityInfo.metrics.typeCount} types\n\n`;
  }

  // Recommended execution command
  markdown += '### Recommended Execution Command\n\n';
  markdown += '```bash\n';
  markdown += `${executionCommand} @docs/TRD/${trdContext.trdId || 'trd'}.md\n`;
  markdown += '```\n\n';

  // Execution approach
  markdown += '### Execution Approach\n\n';
  markdown += `${executionApproach.summary}\n\n`;

  if (executionApproach.phases.length > 0) {
    markdown += '**Phases**:\n';
    executionApproach.phases.forEach((phase, i) => {
      markdown += `${i + 1}. ${phase}\n`;
    });
    markdown += '\n';
  }

  if (executionApproach.guidelines.length > 0) {
    markdown += '**Guidelines**:\n';
    executionApproach.guidelines.forEach(guideline => {
      markdown += `- ${guideline}\n`;
    });
    markdown += '\n';
  }

  if (executionApproach.warnings.length > 0) {
    markdown += '**⚠️ Warnings**:\n';
    executionApproach.warnings.forEach(warning => {
      markdown += `- ${warning}\n`;
    });
    markdown += '\n';
  }

  // Task type distribution
  if (taskTypeAnalysis && taskTypeAnalysis.summary.uniqueTypes > 0) {
    markdown += '### Task Type Distribution\n\n';
    markdown += '| Task Type | Count | Percentage |\n';
    markdown += '|-----------|-------|------------|\n';

    const distribution = taskTypeAnalysis.summary.typeDistribution;
    const total = taskTypeAnalysis.summary.totalTasks;

    Object.entries(distribution).forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      markdown += `| ${type} | ${count} | ${percentage}% |\n`;
    });
    markdown += '\n';
  }

  // Agent delegation patterns
  if (delegationPatterns && delegationPatterns.patterns.length > 0) {
    markdown += '### Agent Delegation\n\n';
    markdown += `**Summary**: ${delegationPatterns.summary.recommendation}\n\n`;
    markdown += formatDelegationTable(delegationPatterns.patterns);
    markdown += '\n';

    // Coordination requirements
    const hasCoordination = delegationPatterns.patterns.some(
      p => p.coordinationNeeded && p.coordinationNeeded.length > 0
    );

    if (hasCoordination) {
      markdown += '**Coordination Requirements**:\n\n';
      markdown += formatCoordinationNeeds(delegationPatterns.patterns);
      markdown += '\n\n';
    }
  }

  // Quality gates
  if (qualityGates) {
    markdown += formatQualityGatesSection(qualityGates);
    markdown += '\n';
  }

  // Estimated duration
  const estimatedDuration = estimateTotalDuration(trdContext, complexityInfo);
  markdown += '### Estimated Duration\n\n';
  markdown += `**Total**: ${estimatedDuration}\n\n`;
  markdown += `Based on ${trdContext.tasks.length} tasks with ${complexityInfo?.level || 'unknown'} complexity.\n\n`;

  // Footer
  markdown += '---\n\n';
  markdown += '*This workflow section was automatically generated based on TRD analysis. ';
  markdown += 'Adjust checkpoint frequency and quality gates as needed for your specific project requirements.*\n';

  return markdown;
}

/**
 * Estimate total implementation duration
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} complexityInfo - Complexity assessment
 * @returns {string} Estimated duration string
 * @private
 */
function estimateTotalDuration(trdContext, complexityInfo) {
  const totalHours = trdContext.tasks.reduce((sum, task) => {
    const duration = task.duration || '2 hours';
    const hours = parseFloat(duration);
    return sum + (isNaN(hours) ? 2 : hours);
  }, 0);

  // Apply complexity multiplier
  let multiplier = 1.0;
  if (complexityInfo) {
    if (complexityInfo.level === 'moderate') {
      multiplier = 1.2; // 20% overhead for coordination
    } else if (complexityInfo.level === 'complex') {
      multiplier = 1.4; // 40% overhead for orchestration
    }
  }

  const adjustedHours = totalHours * multiplier;
  const days = Math.ceil(adjustedHours / 8);

  return `${adjustedHours.toFixed(1)} hours (~${days} day${days !== 1 ? 's' : ''})`;
}

/**
 * Validate workflow section generation input
 *
 * @param {Object} trdContext - TRD context to validate
 * @returns {Object} Validation result
 *
 * @example
 * const validation = validateTRDContext(trdContext);
 * // => { valid: true, errors: [], warnings: [] }
 */
export function validateTRDContext(trdContext) {
  const errors = [];
  const warnings = [];

  if (!trdContext) {
    errors.push('TRD context is null or undefined');
    return { valid: false, errors, warnings };
  }

  if (!trdContext.tasks || !Array.isArray(trdContext.tasks)) {
    errors.push('TRD context missing tasks array');
  } else if (trdContext.tasks.length === 0) {
    warnings.push('TRD context has no tasks');
  }

  if (!trdContext.trdId) {
    warnings.push('TRD context missing trdId - will use default');
  }

  if (!trdContext.title) {
    warnings.push('TRD context missing title');
  }

  // Validate task structure
  trdContext.tasks?.forEach((task, index) => {
    if (!task.id) {
      errors.push(`Task at index ${index} missing id`);
    }
    if (!task.title && !task.description) {
      warnings.push(`Task ${task.id || index} has no title or description`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

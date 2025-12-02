/**
 * Workflow Generator Prototype
 *
 * @module workflow-generator
 * @description Prototype implementation combining task type detection, complexity assessment,
 *              and workflow recommendation generation
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-010
 */

import { analyzeTaskTypes } from './task-type-detector.js';
import { assessComplexity, selectExecutionCommand } from './complexity-assessor.js';

/**
 * Generate complete workflow section for TRD
 *
 * @param {Object} trdContext - TRD structure with tasks, phases, metadata
 * @param {Object} config - Workflow generation configuration
 * @returns {Object} Complete workflow section with all recommendations
 */
export function generateWorkflow(trdContext, config = {}) {
  const startTime = performance.now();

  // Validate input
  if (!trdContext || !trdContext.tasks || !Array.isArray(trdContext.tasks)) {
    throw new Error('Invalid TRD context: missing tasks array');
  }

  // Step 1: Analyze task types
  console.log('[Workflow Generator] Analyzing task types...');
  const taskTypeAnalysis = analyzeTaskTypes(trdContext.tasks, config.taskTypeOptions);

  // Step 2: Assess complexity
  console.log('[Workflow Generator] Assessing complexity...');
  const complexityAssessment = assessComplexity(
    trdContext,
    taskTypeAnalysis.summary,
    config.complexityOptions
  );

  // Step 3: Generate delegation patterns
  console.log('[Workflow Generator] Generating delegation patterns...');
  const delegationPatterns = generateDelegationPatterns(
    taskTypeAnalysis.classifications,
    complexityAssessment.complexityLevel,
    trdContext
  );

  // Step 4: Generate execution recommendations
  console.log('[Workflow Generator] Creating execution recommendations...');
  const executionRecommendations = generateExecutionRecommendations(
    complexityAssessment,
    delegationPatterns,
    trdContext
  );

  // Step 5: Generate workflow section content
  const workflowSection = generateWorkflowSection(
    trdContext,
    taskTypeAnalysis,
    complexityAssessment,
    delegationPatterns,
    executionRecommendations
  );

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`[Workflow Generator] Complete in ${duration.toFixed(2)}ms`);

  return {
    workflow: workflowSection,
    taskTypeAnalysis,
    complexityAssessment,
    delegationPatterns,
    executionRecommendations,
    metadata: {
      generatedAt: new Date().toISOString(),
      generationTime: `${duration.toFixed(2)}ms`,
      version: '1.0.0'
    }
  };
}

/**
 * Generate delegation patterns based on task types
 *
 * @param {Object} taskClassifications - Task type classifications map
 * @param {Object} complexityLevel - Complexity level object
 * @param {Object} trdContext - TRD context
 * @returns {Object} Delegation patterns
 */
function generateDelegationPatterns(taskClassifications, complexityLevel, trdContext) {
  const patterns = [];

  // Group tasks by type
  const tasksByType = {};
  Object.entries(taskClassifications).forEach(([taskId, classification]) => {
    const type = classification.primaryType;
    if (!tasksByType[type]) {
      tasksByType[type] = [];
    }

    // Find task in context
    const task = trdContext.tasks.find(t => t.id === taskId);
    if (task) {
      tasksByType[type].push(task);
    }
  });

  // Generate patterns for each type
  Object.entries(tasksByType).forEach(([type, tasks]) => {
    if (tasks.length === 0 || type === 'general') return;

    const agent = mapTypeToAgent(type);
    const pattern = {
      taskType: type,
      agent,
      taskCount: tasks.length,
      taskIds: tasks.map(t => t.id),
      strategy: determineExecutionStrategy(complexityLevel)
    };

    // Add complexity-specific details
    if (complexityLevel.level === 'complex') {
      pattern.parallelizable = tasks
        .filter(t => canExecuteInParallel(t, tasks))
        .map(t => t.id);
      pattern.sequential = tasks
        .filter(t => !canExecuteInParallel(t, tasks))
        .map(t => t.id);
      pattern.estimatedDuration = estimateDuration(tasks);
    } else {
      pattern.approach = 'sequential';
      pattern.checkpoints = determineCheckpointsForTasks(tasks, complexityLevel);
    }

    patterns.push(pattern);
  });

  // Sort by task count (descending)
  patterns.sort((a, b) => b.taskCount - a.taskCount);

  // Add coordination notes
  if (patterns.length > 1) {
    addCoordinationNotes(patterns, taskClassifications, trdContext);
  }

  return {
    patterns,
    summary: generateDelegationSummary(patterns),
    coordinationRequired: patterns.length > 1
  };
}

/**
 * Generate execution recommendations
 *
 * @param {Object} complexityAssessment - Complexity assessment result
 * @param {Object} delegationPatterns - Delegation patterns
 * @param {Object} trdContext - TRD context
 * @returns {Object} Execution recommendations
 */
function generateExecutionRecommendations(complexityAssessment, delegationPatterns, trdContext) {
  const { complexityLevel, recommendations } = complexityAssessment;

  return {
    primaryCommand: recommendations.executionCommand.primary,
    reasoning: recommendations.executionCommand.reasoning,
    checkpointStrategy: recommendations.executionCommand.checkpointStrategy,
    parallelism: recommendations.executionCommand.parallelismRecommendation,
    approach: recommendations.approach,
    qualityGates: recommendations.qualityGates,
    agentDelegation: delegationPatterns.summary,
    estimatedDuration: estimateTotalDuration(trdContext, complexityLevel)
  };
}

/**
 * Generate complete workflow section markdown
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} taskTypeAnalysis - Task type analysis
 * @param {Object} complexityAssessment - Complexity assessment
 * @param {Object} delegationPatterns - Delegation patterns
 * @param {Object} executionRecommendations - Execution recommendations
 * @returns {string} Markdown workflow section
 */
function generateWorkflowSection(
  trdContext,
  taskTypeAnalysis,
  complexityAssessment,
  delegationPatterns,
  executionRecommendations
) {
  const { complexityLevel } = complexityAssessment;
  const { primaryCommand } = executionRecommendations;

  let markdown = '## 📋 Workflow & Execution\n\n';

  // Complexity summary
  markdown += `### Complexity Assessment\n\n`;
  markdown += `**Level**: ${complexityLevel.label} (Score: ${complexityAssessment.complexityScore})\n\n`;
  markdown += `${complexityLevel.description}\n\n`;

  // Metrics breakdown
  markdown += `**Metrics**:\n`;
  markdown += `- **Task Count**: ${complexityAssessment.analysis.totalTasks} tasks (${complexityAssessment.metrics.taskCount.category})\n`;
  markdown += `- **Phase Count**: ${complexityAssessment.analysis.totalPhases} phases (${complexityAssessment.metrics.phaseCount.category})\n`;
  markdown += `- **Dependency Depth**: Max ${complexityAssessment.analysis.maxDependencyDepth}, Avg ${complexityAssessment.metrics.dependencyDepth.avgDepth} (${complexityAssessment.metrics.dependencyDepth.category})\n`;
  markdown += `- **Task Type Diversity**: ${complexityAssessment.analysis.uniqueTaskTypes} types (${complexityAssessment.metrics.taskTypeDiversity.category})\n\n`;

  // Recommended command
  markdown += `### Recommended Execution Command\n\n`;
  markdown += `\`\`\`bash\n${primaryCommand} @docs/TRD/${trdContext.id || 'trd'}.md\n\`\`\`\n\n`;
  markdown += `**Reasoning**:\n`;
  executionRecommendations.reasoning.forEach(reason => {
    markdown += `- ${reason}\n`;
  });
  markdown += '\n';

  // Execution approach
  markdown += `### Execution Approach\n\n`;
  markdown += `${executionRecommendations.approach.overview}\n\n`;
  markdown += `**Phases**:\n`;
  executionRecommendations.approach.phases.forEach((phase, i) => {
    markdown += `${i + 1}. ${phase}\n`;
  });
  markdown += '\n';

  markdown += `**Guidelines**:\n`;
  executionRecommendations.approach.guidelines.forEach(guideline => {
    markdown += `- ${guideline}\n`;
  });
  markdown += '\n';

  if (executionRecommendations.approach.warnings.length > 0) {
    markdown += `**⚠️ Warnings**:\n`;
    executionRecommendations.approach.warnings.forEach(warning => {
      markdown += `- ${warning}\n`;
    });
    markdown += '\n';
  }

  // Delegation patterns
  if (delegationPatterns.patterns.length > 1) {
    markdown += `### Agent Delegation\n\n`;
    markdown += `**Summary**: ${delegationPatterns.summary.totalAgents} specialized agents recommended\n\n`;
    markdown += `| Agent | Task Count | Percentage | Strategy |\n`;
    markdown += `|-------|-----------|-----------|----------|\n`;
    delegationPatterns.patterns.forEach(pattern => {
      const percentage = ((pattern.taskCount / trdContext.tasks.length) * 100).toFixed(1);
      markdown += `| ${pattern.agent} | ${pattern.taskCount} | ${percentage}% | ${pattern.strategy} |\n`;
    });
    markdown += '\n';
  }

  // Quality gates
  markdown += `### Quality Gates\n\n`;
  markdown += `**Sprint Gates**:\n`;
  executionRecommendations.qualityGates.sprint.forEach(gate => {
    markdown += `- [ ] ${gate.name}${gate.threshold ? ` (${gate.threshold}%)` : ''}\n`;
  });
  markdown += '\n';

  markdown += `**Phase Gates**:\n`;
  executionRecommendations.qualityGates.phase.forEach(gate => {
    markdown += `- [ ] ${gate.name}${gate.threshold ? ` (${gate.threshold}%)` : ''}\n`;
  });
  markdown += '\n';

  markdown += `**Final Gates**:\n`;
  executionRecommendations.qualityGates.final.forEach(gate => {
    markdown += `- [ ] ${gate.name}${gate.threshold ? ` (${gate.threshold}%)` : ''}\n`;
  });
  markdown += '\n';

  // Estimated duration
  markdown += `### Estimated Duration\n\n`;
  markdown += `**Total**: ${executionRecommendations.estimatedDuration}\n\n`;
  markdown += `Based on ${trdContext.tasks.length} tasks with ${complexityLevel.level} complexity.\n\n`;

  return markdown;
}

// Helper functions

function mapTypeToAgent(type) {
  const agentMap = {
    'infrastructure': 'infrastructure-developer',
    'security': 'backend-developer',
    'frontend': 'frontend-developer',
    'backend': 'backend-developer',
    'testing': 'test-runner',
    'documentation': 'documentation-specialist',
    'general': 'backend-developer'
  };

  return agentMap[type] || 'backend-developer';
}

function determineExecutionStrategy(complexityLevel) {
  if (complexityLevel.level === 'simple') {
    return 'linear';
  } else if (complexityLevel.level === 'moderate') {
    return 'sequential-with-checkpoints';
  } else {
    return 'orchestrated-parallel';
  }
}

function canExecuteInParallel(task, allTasks) {
  if (!task.dependencies || task.dependencies.length === 0) {
    return true;
  }

  const taskIds = new Set(allTasks.map(t => t.id));
  const hasInternalDeps = task.dependencies.some(depId => taskIds.has(depId));

  return !hasInternalDeps;
}

function estimateDuration(tasks) {
  const totalHours = tasks.reduce((sum, task) => {
    const duration = task.duration || '2 hours';
    const hours = parseFloat(duration);
    return sum + (isNaN(hours) ? 2 : hours);
  }, 0);

  return `${totalHours.toFixed(1)} hours`;
}

function determineCheckpointsForTasks(tasks, complexityLevel) {
  if (complexityLevel.level === 'simple') {
    return ['End of implementation'];
  } else {
    const checkpointFreq = Math.ceil(tasks.length / 3);
    return [`Every ${checkpointFreq} tasks`];
  }
}

function addCoordinationNotes(patterns, taskClassifications, trdContext) {
  patterns.forEach(pattern => {
    pattern.coordinationNeeded = [];

    pattern.taskIds.forEach(taskId => {
      const task = trdContext.tasks.find(t => t.id === taskId);
      if (!task || !task.dependencies) return;

      task.dependencies.forEach(depId => {
        const depClassification = taskClassifications[depId];
        if (!depClassification) return;

        const depType = depClassification.primaryType;
        if (depType && depType !== pattern.taskType) {
          pattern.coordinationNeeded.push({
            task: taskId,
            dependsOn: depId,
            dependsOnType: depType,
            dependsOnAgent: mapTypeToAgent(depType)
          });
        }
      });
    });
  });
}

function generateDelegationSummary(patterns) {
  const totalTasks = patterns.reduce((sum, p) => sum + p.taskCount, 0);

  return {
    totalAgents: patterns.length,
    totalTasks,
    distribution: patterns.map(p => ({
      agent: p.agent,
      taskCount: p.taskCount,
      percentage: ((p.taskCount / totalTasks) * 100).toFixed(1) + '%'
    })),
    recommendation: patterns.length > 1
      ? 'Use /orchestrate-tasks for efficient multi-agent coordination'
      : 'Single agent sufficient - /implement-trd recommended'
  };
}

function estimateTotalDuration(trdContext, complexityLevel) {
  const totalHours = trdContext.tasks.reduce((sum, task) => {
    const duration = task.duration || '2 hours';
    const hours = parseFloat(duration);
    return sum + (isNaN(hours) ? 2 : hours);
  }, 0);

  // Adjust for complexity
  let multiplier = 1.0;
  if (complexityLevel.level === 'moderate') {
    multiplier = 1.2; // 20% overhead for coordination
  } else if (complexityLevel.level === 'complex') {
    multiplier = 1.4; // 40% overhead for orchestration
  }

  const adjustedHours = totalHours * multiplier;
  const days = Math.ceil(adjustedHours / 8);

  return `${adjustedHours.toFixed(1)} hours (~${days} days)`;
}

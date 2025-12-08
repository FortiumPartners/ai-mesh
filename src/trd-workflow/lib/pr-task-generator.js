/**
 * PR Task Generator - Production Implementation
 *
 * @module pr-task-generator
 * @description Production implementation of PR creation task injection
 * Generates final pull request submission task with comprehensive checklist.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-025
 */

/**
 * Generate PR creation task for final sprint
 *
 * @param {Object} trdContext - TRD context object
 * @param {string} trdContext.trdId - TRD identifier
 * @param {string} trdContext.title - TRD title
 * @param {Object[]} [trdContext.tasks] - Array of task objects
 * @param {Object[]} [trdContext.phases] - Array of phase objects
 * @param {Object[]} [trdContext.sprints] - Array of sprint objects
 * @param {Object} [config={}] - Generation configuration
 * @param {string} [config.scope] - Commit scope for PR title
 * @param {boolean} [config.includeCheckpointReferences=true] - Include checkpoint references
 * @param {string[]} [config.customChecklist] - Custom checklist items
 * @returns {Object} PR task object
 *
 * @example
 * const prTask = generatePrTask(trdContext, {
 *   scope: 'trd-workflow',
 *   includeCheckpointReferences: true
 * });
 */
export function generatePrTask(trdContext, config = {}) {
  if (!trdContext || typeof trdContext !== 'object') {
    throw new Error('Invalid TRD context: expected non-null object');
  }

  const {
    scope = inferScope(trdContext),
    includeCheckpointReferences = true,
    customChecklist = []
  } = config;

  // Generate task ID (last task in final sprint)
  const taskId = generatePrTaskId(trdContext);

  // Generate PR title template
  const prTitle = generatePrTitleTemplate(trdContext, scope);

  // Generate PR description template
  const prDescription = generatePrDescriptionTemplate(trdContext, includeCheckpointReferences);

  // Generate submission checklist
  const checklist = generateSubmissionChecklist(trdContext, customChecklist);

  // Create PR task object
  const prTask = {
    id: taskId,
    type: 'pr-submission',
    title: 'Create Pull Request',
    description: generatePrTaskDescription(trdContext),
    duration: '1 hour',
    priority: 'critical',
    dependencies: getAllTaskIds(trdContext),
    acceptance_criteria: [
      'Pull request created with comprehensive description',
      'All checkpoints have been committed',
      'All tests are passing (unit, integration, E2E)',
      'Documentation has been updated',
      'All quality gates have passed',
      'Code is ready for review'
    ],
    pr_metadata: {
      title_template: prTitle,
      description_template: prDescription,
      checklist: checklist,
      scope,
      labels: inferLabels(trdContext),
      reviewers: inferReviewers(trdContext)
    },
    metadata: {
      phase: getFinalPhaseNumber(trdContext),
      sprint: getFinalSprintNumber(trdContext),
      trdId: trdContext.trdId || trdContext.trd_id || 'TRD-UNKNOWN'
    }
  };

  return prTask;
}

/**
 * Generate PR task ID based on TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string} PR task ID
 * @private
 */
function generatePrTaskId(trdContext) {
  // Try to find the next available task number
  const tasks = trdContext.tasks || [];
  const taskIds = tasks.map(t => t.id);

  // Extract numeric parts from task IDs (e.g., TASK-025 -> 25)
  const taskNumbers = taskIds
    .map(id => {
      const match = id.match(/TASK-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  const maxTaskNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) : 0;
  const nextTaskNumber = maxTaskNumber + 1;

  return `TASK-${String(nextTaskNumber).padStart(3, '0')}`;
}

/**
 * Generate PR title template
 *
 * @param {Object} trdContext - TRD context
 * @param {string} scope - Commit scope
 * @returns {string} PR title template
 * @private
 */
function generatePrTitleTemplate(trdContext, scope) {
  const title = trdContext.title || 'Implementation';

  // Infer commit type from TRD title/tasks
  const commitType = inferCommitType(trdContext);

  return `${commitType}(${scope}): ${title}`;
}

/**
 * Generate PR description template
 *
 * @param {Object} trdContext - TRD context
 * @param {boolean} includeCheckpointReferences - Include checkpoint task references
 * @returns {string} PR description template
 * @private
 */
function generatePrDescriptionTemplate(trdContext, includeCheckpointReferences) {
  const lines = [];

  // Summary section
  lines.push('## Summary');
  lines.push('');
  lines.push(`Implementation of ${trdContext.trdId || 'TRD'}: ${trdContext.title || 'Feature'}`);
  lines.push('');

  // Changes section
  lines.push('## Changes');
  lines.push('');
  lines.push(generateChangesSummary(trdContext));
  lines.push('');

  // Checkpoint references (if enabled)
  if (includeCheckpointReferences) {
    const checkpoints = extractCheckpoints(trdContext);
    if (checkpoints.length > 0) {
      lines.push('## Implementation Checkpoints');
      lines.push('');
      checkpoints.forEach(checkpoint => {
        lines.push(`- ${checkpoint.id}: ${checkpoint.title}`);
      });
      lines.push('');
    }
  }

  // Testing section
  lines.push('## Testing');
  lines.push('');
  lines.push('- [ ] Unit tests passing');
  lines.push('- [ ] Integration tests passing');
  lines.push('- [ ] E2E tests passing (if applicable)');
  lines.push('- [ ] Manual testing completed');
  lines.push('');

  // Documentation section
  lines.push('## Documentation');
  lines.push('');
  lines.push('- [ ] Code documentation updated');
  lines.push('- [ ] API documentation updated (if applicable)');
  lines.push('- [ ] README updated (if applicable)');
  lines.push('- [ ] CHANGELOG updated');
  lines.push('');

  // Related links
  lines.push('## Related');
  lines.push('');
  lines.push(`- TRD: ${trdContext.trdId || 'N/A'}`);
  if (trdContext.prdId) {
    lines.push(`- PRD: ${trdContext.prdId}`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate submission checklist
 *
 * @param {Object} trdContext - TRD context
 * @param {string[]} customItems - Custom checklist items
 * @returns {string[]} Checklist items array
 * @private
 */
function generateSubmissionChecklist(trdContext, customItems) {
  const checklist = [
    'All checkpoints committed',
    'All tests passing (unit, integration, E2E)',
    'Code coverage meets requirements (≥80% unit, ≥70% integration)',
    'Security scan completed with no high-severity issues',
    'Performance requirements met',
    'Documentation updated (code, API, README, CHANGELOG)',
    'No linting errors or warnings',
    'All acceptance criteria satisfied',
    'Code reviewed and approved',
    'Ready for merge'
  ];

  // Add quality gate items
  if (trdContext.quality_gates?.final?.gates) {
    trdContext.quality_gates.final.gates.forEach(gate => {
      if (gate.required) {
        checklist.push(`${gate.name} passed`);
      }
    });
  }

  // Add custom items
  if (customItems.length > 0) {
    checklist.push(...customItems);
  }

  return checklist;
}

/**
 * Generate PR task description
 *
 * @param {Object} trdContext - TRD context
 * @returns {string} Task description
 * @private
 */
function generatePrTaskDescription(trdContext) {
  const lines = [
    'Create pull request for final implementation submission.',
    '',
    '**PR Title Template**:',
    `\`${generatePrTitleTemplate(trdContext, inferScope(trdContext))}\``,
    '',
    '**PR Submission Steps**:',
    '1. Ensure all checkpoints have been committed',
    '2. Run full test suite and verify all tests pass',
    '3. Run security scan and address any findings',
    '4. Update documentation (CHANGELOG, README, API docs)',
    '5. Create pull request with comprehensive description',
    '6. Request code review from designated reviewers',
    '7. Address review feedback and update PR',
    '8. Obtain approval and merge when ready',
    '',
    '**Quality Gate Verification**:',
    '- All sprint-level quality gates passed',
    '- All phase-level quality gates passed',
    '- All final quality gates passed',
    '',
    '**Documentation Requirements**:',
    '- CHANGELOG entry with all changes',
    '- API documentation for new endpoints/methods',
    '- README updates for new features',
    '- Migration guide if breaking changes'
  ];

  return lines.join('\n');
}

/**
 * Infer commit scope from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string} Inferred scope
 * @private
 */
function inferScope(trdContext) {
  const trdId = trdContext.trdId || trdContext.trd_id || '';

  // Extract scope from TRD ID (e.g., TRD-WORKFLOW-001 -> workflow)
  const match = trdId.match(/TRD-([A-Z-]+)-\d+/i);
  if (match) {
    return match[1].toLowerCase();
  }

  // Fall back to kebab-case version of title
  if (trdContext.title) {
    return trdContext.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return 'trd';
}

/**
 * Infer commit type from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string} Commit type (feat, fix, refactor, etc.)
 * @private
 */
function inferCommitType(trdContext) {
  const title = (trdContext.title || '').toLowerCase();

  if (title.includes('fix') || title.includes('bug')) {
    return 'fix';
  }
  if (title.includes('refactor')) {
    return 'refactor';
  }
  if (title.includes('performance') || title.includes('optimize')) {
    return 'perf';
  }
  if (title.includes('test')) {
    return 'test';
  }
  if (title.includes('documentation') || title.includes('docs')) {
    return 'docs';
  }

  // Default to feat for new features
  return 'feat';
}

/**
 * Infer PR labels from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string[]} Suggested PR labels
 * @private
 */
function inferLabels(trdContext) {
  const labels = [];

  const commitType = inferCommitType(trdContext);
  labels.push(commitType);

  // Add size label based on task count
  const taskCount = (trdContext.tasks || []).length;
  if (taskCount < 5) {
    labels.push('size/small');
  } else if (taskCount < 15) {
    labels.push('size/medium');
  } else {
    labels.push('size/large');
  }

  // Add priority label
  if (trdContext.priority) {
    labels.push(`priority/${trdContext.priority}`);
  }

  return labels;
}

/**
 * Infer reviewers from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string[]} Suggested reviewers
 * @private
 */
function inferReviewers(trdContext) {
  const reviewers = [];

  // Extract from stakeholders
  if (trdContext.stakeholders && Array.isArray(trdContext.stakeholders)) {
    reviewers.push(...trdContext.stakeholders);
  }

  // Extract from author
  if (trdContext.author) {
    reviewers.push(trdContext.author);
  }

  return [...new Set(reviewers)]; // Remove duplicates
}

/**
 * Get all task IDs from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string[]} Array of task IDs
 * @private
 */
function getAllTaskIds(trdContext) {
  const taskIds = [];

  if (trdContext.tasks && Array.isArray(trdContext.tasks)) {
    taskIds.push(...trdContext.tasks.map(t => t.id));
  }

  if (trdContext.phases && Array.isArray(trdContext.phases)) {
    trdContext.phases.forEach(phase => {
      if (phase.sprints && Array.isArray(phase.sprints)) {
        phase.sprints.forEach(sprint => {
          if (sprint.tasks && Array.isArray(sprint.tasks)) {
            taskIds.push(...sprint.tasks.map(t => t.id));
          }
        });
      }
    });
  }

  return [...new Set(taskIds)]; // Remove duplicates
}

/**
 * Extract checkpoint tasks from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {Object[]} Array of checkpoint task objects
 * @private
 */
function extractCheckpoints(trdContext) {
  const checkpoints = [];

  if (trdContext.tasks && Array.isArray(trdContext.tasks)) {
    const checkpointTasks = trdContext.tasks.filter(t =>
      t.type === 'checkpoint' || t.id.includes('CHKPT')
    );
    checkpoints.push(...checkpointTasks);
  }

  if (trdContext.checkpoints && Array.isArray(trdContext.checkpoints)) {
    checkpoints.push(...trdContext.checkpoints);
  }

  return checkpoints;
}

/**
 * Generate changes summary from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string} Changes summary
 * @private
 */
function generateChangesSummary(trdContext) {
  const lines = [];

  // Group tasks by type
  const tasksByType = {};

  if (trdContext.tasks && Array.isArray(trdContext.tasks)) {
    trdContext.tasks.forEach(task => {
      const type = task.type || 'general';
      if (!tasksByType[type]) {
        tasksByType[type] = [];
      }
      tasksByType[type].push(task);
    });
  }

  // Format by type
  Object.keys(tasksByType).forEach(type => {
    if (type === 'checkpoint' || type === 'pr-submission') {
      return; // Skip meta tasks
    }

    const tasks = tasksByType[type];
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    lines.push(`**${typeLabel}** (${tasks.length} tasks):`);
    tasks.slice(0, 5).forEach(task => {
      lines.push(`- ${task.title || task.id}`);
    });

    if (tasks.length > 5) {
      lines.push(`- ... and ${tasks.length - 5} more`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Get final phase number from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {number} Final phase number
 * @private
 */
function getFinalPhaseNumber(trdContext) {
  if (trdContext.phases && Array.isArray(trdContext.phases)) {
    return trdContext.phases.length;
  }
  return 1;
}

/**
 * Get final sprint number from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {number} Final sprint number
 * @private
 */
function getFinalSprintNumber(trdContext) {
  if (trdContext.phases && Array.isArray(trdContext.phases)) {
    const lastPhase = trdContext.phases[trdContext.phases.length - 1];
    if (lastPhase.sprints && Array.isArray(lastPhase.sprints)) {
      return lastPhase.sprints.length;
    }
  }

  if (trdContext.sprints && Array.isArray(trdContext.sprints)) {
    return trdContext.sprints.length;
  }

  return 1;
}

/**
 * Inject PR task into final sprint of task breakdown
 *
 * @param {Object} taskBreakdown - Task breakdown structure
 * @param {Object} prTask - PR task object
 * @returns {Object} Enhanced task breakdown with PR task
 *
 * @example
 * const enhanced = injectPrTask(taskBreakdown, prTask);
 */
export function injectPrTask(taskBreakdown, prTask) {
  if (!taskBreakdown || !taskBreakdown.phases || taskBreakdown.phases.length === 0) {
    throw new Error('Invalid task breakdown: no phases found');
  }

  // Get final phase
  const finalPhase = taskBreakdown.phases[taskBreakdown.phases.length - 1];

  if (!finalPhase.sprints || finalPhase.sprints.length === 0) {
    throw new Error('Invalid task breakdown: final phase has no sprints');
  }

  // Get final sprint
  const finalSprint = finalPhase.sprints[finalPhase.sprints.length - 1];

  // Initialize tasks array if not present
  if (!finalSprint.tasks) {
    finalSprint.tasks = [];
  }

  // Append PR task to end of final sprint
  finalSprint.tasks.push(prTask);

  return {
    taskBreakdown,
    prTask,
    location: {
      phase: taskBreakdown.phases.length,
      sprint: finalPhase.sprints.length,
      taskIndex: finalSprint.tasks.length - 1
    }
  };
}

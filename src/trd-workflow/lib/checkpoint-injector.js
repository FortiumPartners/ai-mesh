/**
 * Checkpoint Task Injector - Production Implementation
 *
 * @module checkpoint-injector
 * @description Production implementation of checkpoint injection algorithm (CHKPT-INJ-001)
 * Integrates with interval calculator for optimal checkpoint placement.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-013
 */

import { calculateCheckpointInterval } from './interval-calculator.js';

/**
 * Inject checkpoint tasks into TRD task breakdown
 *
 * @param {Object} taskBreakdown - Structured task breakdown (phases > sprints > tasks)
 * @param {Object} [config={}] - Workflow configuration
 * @param {string|number} [config.checkpoint_frequency] - 'sprint', 'phase', or number
 * @param {string} [config.trd_id] - TRD identifier for references
 * @returns {Object} Enhanced task breakdown with injected checkpoints
 *
 * @throws {Error} If task breakdown is invalid
 *
 * @example
 * const enhanced = injectWorkflowTasks(taskBreakdown, {
 *   checkpoint_frequency: 'sprint',
 *   trd_id: 'TRD-WORKFLOW-001'
 * });
 */
export function injectWorkflowTasks(taskBreakdown, config = {}) {
  // Validate input
  if (!taskBreakdown || !taskBreakdown.phases || !Array.isArray(taskBreakdown.phases)) {
    throw new Error('Invalid task breakdown: missing phases structure');
  }

  const trdId = config.trd_id || 'TRD-UNKNOWN';

  // Calculate optimal interval strategy
  const intervalStrategy = calculateCheckpointInterval(taskBreakdown, config);

  // Route to appropriate injection strategy
  let checkpoints = [];

  if (intervalStrategy.strategy === 'sprint') {
    checkpoints = injectAtSprintBoundaries(taskBreakdown, trdId);
  } else if (intervalStrategy.strategy === 'phase') {
    checkpoints = injectAtPhaseBoundaries(taskBreakdown, trdId);
  } else if (intervalStrategy.strategy === 'task-count') {
    checkpoints = injectByTaskCount(taskBreakdown, intervalStrategy.frequency, trdId);
  } else {
    throw new Error(`Unknown checkpoint strategy: ${intervalStrategy.strategy}`);
  }

  // Sort checkpoints by insertion order (reverse order to maintain indices)
  checkpoints.sort((a, b) => b.insertionIndex - a.insertionIndex);

  // Inject checkpoints into task breakdown
  for (const checkpoint of checkpoints) {
    insertCheckpoint(taskBreakdown, checkpoint);
  }

  return {
    taskBreakdown,
    checkpoints: checkpoints.map(c => c.task),
    intervalStrategy,
    metrics: {
      totalCheckpoints: checkpoints.length,
      strategy: intervalStrategy.strategy,
      frequency: intervalStrategy.frequency,
      coverage: intervalStrategy.metrics.coverage
    }
  };
}

/**
 * Inject checkpoints at sprint boundaries
 *
 * @param {Object} taskBreakdown - Task breakdown structure
 * @param {string} trdId - TRD identifier
 * @returns {Object[]} Checkpoint objects with insertion metadata
 * @private
 */
function injectAtSprintBoundaries(taskBreakdown, trdId) {
  const checkpoints = [];
  let checkpointCounter = 1;
  let globalTaskIndex = 0;

  taskBreakdown.phases.forEach((phase, phaseIndex) => {
    if (!phase.sprints || !Array.isArray(phase.sprints)) {
      return;
    }

    phase.sprints.forEach((sprint, sprintIndex) => {
      const tasks = sprint.tasks || [];

      if (tasks.length === 0) {
        return; // Skip empty sprints
      }

      const completedTaskIds = tasks.map(t => t.id);

      // Create checkpoint task
      const checkpoint = createCheckpointTask({
        id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
        type: 'checkpoint',
        trigger: 'sprint',
        sprintNumber: sprintIndex + 1,
        phaseNumber: phaseIndex + 1,
        phaseName: phase.name,
        sprintName: sprint.name,
        completedTasks: completedTaskIds,
        trdId,
        taskCount: completedTaskIds.length
      });

      checkpoints.push({
        task: checkpoint,
        phaseIndex,
        sprintIndex,
        insertionIndex: globalTaskIndex + tasks.length,
        location: 'sprint-end'
      });

      checkpointCounter++;
      globalTaskIndex += tasks.length;
    });
  });

  return checkpoints;
}

/**
 * Inject checkpoints at phase boundaries
 *
 * @param {Object} taskBreakdown - Task breakdown structure
 * @param {string} trdId - TRD identifier
 * @returns {Object[]} Checkpoint objects with insertion metadata
 * @private
 */
function injectAtPhaseBoundaries(taskBreakdown, trdId) {
  const checkpoints = [];
  let checkpointCounter = 1;
  let globalTaskIndex = 0;

  taskBreakdown.phases.forEach((phase, phaseIndex) => {
    const completedTaskIds = [];
    let phaseTaskCount = 0;

    if (phase.sprints && Array.isArray(phase.sprints)) {
      phase.sprints.forEach(sprint => {
        const tasks = sprint.tasks || [];
        completedTaskIds.push(...tasks.map(t => t.id));
        phaseTaskCount += tasks.length;
      });
    }

    if (completedTaskIds.length === 0) {
      return; // Skip empty phases
    }

    // Create phase checkpoint
    const checkpoint = createCheckpointTask({
      id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
      type: 'checkpoint',
      trigger: 'phase',
      phaseNumber: phaseIndex + 1,
      phaseName: phase.name,
      completedTasks: completedTaskIds,
      trdId,
      taskCount: completedTaskIds.length
    });

    // Find last sprint in phase
    const lastSprintIndex = phase.sprints.length - 1;

    checkpoints.push({
      task: checkpoint,
      phaseIndex,
      sprintIndex: lastSprintIndex,
      insertionIndex: globalTaskIndex + phaseTaskCount,
      location: 'phase-end'
    });

    checkpointCounter++;
    globalTaskIndex += phaseTaskCount;
  });

  return checkpoints;
}

/**
 * Inject checkpoints based on task count frequency
 *
 * @param {Object} taskBreakdown - Task breakdown structure
 * @param {number} frequency - Checkpoint every N tasks
 * @param {string} trdId - TRD identifier
 * @returns {Object[]} Checkpoint objects with insertion metadata
 * @private
 */
function injectByTaskCount(taskBreakdown, frequency, trdId) {
  const checkpoints = [];
  let checkpointCounter = 1;
  let globalTaskIndex = 0;
  let accumulatedTasks = [];
  let insertionPoints = [];

  // First pass: collect all tasks and their locations
  taskBreakdown.phases.forEach((phase, phaseIndex) => {
    if (!phase.sprints || !Array.isArray(phase.sprints)) {
      return;
    }

    phase.sprints.forEach((sprint, sprintIndex) => {
      const tasks = sprint.tasks || [];

      tasks.forEach(task => {
        accumulatedTasks.push(task.id);
        globalTaskIndex++;

        // Inject checkpoint every N tasks
        if (accumulatedTasks.length === frequency) {
          insertionPoints.push({
            completedTasks: [...accumulatedTasks],
            phaseIndex,
            sprintIndex,
            insertionIndex: globalTaskIndex,
            taskRange: {
              start: globalTaskIndex - frequency + 1,
              end: globalTaskIndex
            }
          });

          accumulatedTasks = [];
        }
      });
    });
  });

  // Handle remaining tasks
  if (accumulatedTasks.length > 0) {
    const lastPhaseIndex = taskBreakdown.phases.length - 1;
    const lastPhase = taskBreakdown.phases[lastPhaseIndex];
    const lastSprintIndex = (lastPhase.sprints?.length || 1) - 1;

    insertionPoints.push({
      completedTasks: accumulatedTasks,
      phaseIndex: lastPhaseIndex,
      sprintIndex: lastSprintIndex,
      insertionIndex: globalTaskIndex,
      isFinal: true
    });
  }

  // Second pass: create checkpoint tasks
  insertionPoints.forEach(point => {
    const checkpoint = createCheckpointTask({
      id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
      type: 'checkpoint',
      trigger: point.isFinal ? 'task-count-final' : 'task-count',
      frequency,
      taskRange: point.taskRange,
      completedTasks: point.completedTasks,
      trdId,
      taskCount: point.completedTasks.length
    });

    checkpoints.push({
      task: checkpoint,
      phaseIndex: point.phaseIndex,
      sprintIndex: point.sprintIndex,
      insertionIndex: point.insertionIndex,
      location: point.isFinal ? 'final' : 'task-count'
    });

    checkpointCounter++;
  });

  return checkpoints;
}

/**
 * Insert checkpoint task into task breakdown structure
 *
 * @param {Object} taskBreakdown - Task breakdown structure
 * @param {Object} checkpoint - Checkpoint object with insertion metadata
 * @private
 */
function insertCheckpoint(taskBreakdown, checkpoint) {
  const { phaseIndex, sprintIndex, task } = checkpoint;

  const phase = taskBreakdown.phases[phaseIndex];
  if (!phase) {
    console.warn(`Cannot insert checkpoint: phase ${phaseIndex} not found`);
    return;
  }

  const sprint = phase.sprints?.[sprintIndex];
  if (!sprint) {
    console.warn(`Cannot insert checkpoint: sprint ${sprintIndex} not found in phase ${phaseIndex}`);
    return;
  }

  // Initialize tasks array if not present
  if (!sprint.tasks) {
    sprint.tasks = [];
  }

  // Append checkpoint to end of sprint
  sprint.tasks.push(task);
}

/**
 * Create a checkpoint task object
 *
 * @param {Object} params - Checkpoint parameters
 * @returns {Object} Checkpoint task object
 * @private
 */
function createCheckpointTask(params) {
  const {
    id,
    type,
    trigger,
    completedTasks,
    trdId,
    taskCount,
    ...metadata
  } = params;

  const title = generateCheckpointTitle(metadata);
  const description = generateCheckpointDescription(metadata, completedTasks);

  return {
    id,
    type,
    title,
    description,
    duration: '0.5 hours',
    priority: 'high',
    dependencies: completedTasks,
    acceptance_criteria: [
      'All completed tasks committed with conventional commit messages',
      'Commit messages reference TRD ID and task IDs',
      'Branch is up to date with latest changes',
      'Tests are passing (if applicable to completed tasks)'
    ],
    commit_template: generateCommitTemplate(metadata, completedTasks, trdId),
    metadata: {
      ...metadata,
      trigger,
      taskCount,
      trdId
    }
  };
}

/**
 * Generate checkpoint title based on trigger type
 *
 * @param {Object} metadata - Checkpoint metadata
 * @returns {string} Checkpoint title
 * @private
 */
function generateCheckpointTitle(metadata) {
  if (metadata.trigger === 'sprint') {
    return `Git Checkpoint - Sprint ${metadata.sprintNumber} Complete`;
  } else if (metadata.trigger === 'phase') {
    return `Git Checkpoint - ${metadata.phaseName} Complete`;
  } else if (metadata.trigger === 'task-count') {
    return `Git Checkpoint - Tasks ${metadata.taskRange.start}-${metadata.taskRange.end}`;
  } else if (metadata.trigger === 'task-count-final') {
    return 'Git Checkpoint - Final Tasks Complete';
  }
  return 'Git Checkpoint';
}

/**
 * Generate checkpoint description with guidelines
 *
 * @param {Object} metadata - Checkpoint metadata
 * @param {string[]} completedTasks - Array of completed task IDs
 * @returns {string} Checkpoint description
 * @private
 */
function generateCheckpointDescription(metadata, completedTasks) {
  const taskList = completedTasks.slice(0, 10).join(', ');
  const more = completedTasks.length > 10 ? ` and ${completedTasks.length - 10} more` : '';

  return `Create incremental git commit for completed tasks: ${taskList}${more}.

**Commit Guidelines**:
- Use conventional commit format: \`type(scope): subject\`
- Reference TRD ID in commit footer
- List all completed task IDs
- Keep subject line under 72 characters
- Include brief description of what was accomplished

**Verification**:
- [ ] All files staged with \`git add\`
- [ ] Commit message follows template
- [ ] Tests passing (if applicable)
- [ ] Branch is clean (\`git status\`)`;
}

/**
 * Generate commit template for checkpoint
 *
 * @param {Object} metadata - Checkpoint metadata
 * @param {string[]} completedTasks - Array of completed task IDs
 * @param {string} trdId - TRD identifier
 * @returns {Object} Commit template object
 * @private
 */
function generateCommitTemplate(metadata, completedTasks, trdId) {
  const type = 'feat'; // Default to feat for checkpoint commits
  const scope = metadata.phaseName ? kebabCase(metadata.phaseName) : 'trd';

  return {
    type,
    scope,
    subject: `complete ${metadata.sprintName || metadata.phaseName || 'checkpoint'}`,
    body: `Completed tasks:\n${completedTasks.map(t => `- ${t}`).join('\n')}`,
    footer: `Related: ${trdId}${metadata.sprintNumber ? `, Sprint ${metadata.sprintNumber}` : ''}`
  };
}

/**
 * Convert string to kebab-case
 *
 * @param {string} str - Input string
 * @returns {string} Kebab-case string
 * @private
 */
function kebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get checkpoint task at specific index in enhanced task breakdown
 *
 * @param {Object} enhancedBreakdown - Enhanced task breakdown with checkpoints
 * @param {number} checkpointIndex - Index of checkpoint to retrieve
 * @returns {Object|null} Checkpoint task or null if not found
 */
export function getCheckpointTask(enhancedBreakdown, checkpointIndex) {
  if (!enhancedBreakdown?.checkpoints || checkpointIndex < 0) {
    return null;
  }

  return enhancedBreakdown.checkpoints[checkpointIndex] || null;
}

/**
 * Validate that checkpoints were properly injected
 *
 * @param {Object} enhancedBreakdown - Enhanced task breakdown with checkpoints
 * @returns {Object} Validation result
 */
export function validateCheckpoints(enhancedBreakdown) {
  const errors = [];
  const warnings = [];

  if (!enhancedBreakdown?.checkpoints) {
    errors.push('No checkpoints found in enhanced breakdown');
    return { valid: false, errors, warnings };
  }

  // Validate checkpoint count matches metrics
  const actualCount = enhancedBreakdown.checkpoints.length;
  const expectedCount = enhancedBreakdown.metrics?.totalCheckpoints || 0;

  if (actualCount !== expectedCount) {
    warnings.push(`Checkpoint count mismatch: expected ${expectedCount}, found ${actualCount}`);
  }

  // Validate each checkpoint task
  enhancedBreakdown.checkpoints.forEach((checkpoint, index) => {
    if (!checkpoint.id || !checkpoint.id.startsWith('TASK-CHKPT-')) {
      errors.push(`Checkpoint ${index}: Invalid ID format`);
    }

    if (checkpoint.type !== 'checkpoint') {
      errors.push(`Checkpoint ${index}: Type should be 'checkpoint'`);
    }

    if (!checkpoint.dependencies || checkpoint.dependencies.length === 0) {
      warnings.push(`Checkpoint ${index}: No dependencies (completed tasks) listed`);
    }

    if (!checkpoint.commit_template) {
      errors.push(`Checkpoint ${index}: Missing commit template`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checkpointCount: actualCount
  };
}

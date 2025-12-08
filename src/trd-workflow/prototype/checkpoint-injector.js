/**
 * Checkpoint Injection Prototype
 *
 * @module checkpoint-injector
 * @description Prototype implementation of checkpoint injection algorithm (CHKPT-INJ-001)
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-009
 */

/**
 * Inject checkpoint tasks into TRD task breakdown
 *
 * @param {Object[]} tasks - Flat array of task objects
 * @param {Object} config - Checkpoint configuration
 * @param {string|number} config.frequency - Checkpoint frequency ('sprint', 'phase', or number)
 * @param {string} config.trdId - TRD identifier for references
 * @returns {Object} Result with tasks array including checkpoints and metrics
 */
export function injectCheckpoints(tasks, config = {}) {
  const {
    frequency = 'sprint',
    trdId = 'TRD-UNKNOWN'
  } = config;

  // Validate input
  if (!Array.isArray(tasks)) {
    throw new Error('Invalid input: tasks must be an array');
  }

  if (tasks.length === 0) {
    return {
      tasks: [],
      checkpoints: [],
      metrics: {
        totalCheckpoints: 0,
        frequency,
        coverage: 0
      }
    };
  }

  // Route to appropriate injection strategy
  let checkpoints = [];

  if (frequency === 'sprint') {
    checkpoints = injectAtSprintBoundaries(tasks, trdId);
  } else if (frequency === 'phase') {
    checkpoints = injectAtPhaseBoundaries(tasks, trdId);
  } else if (typeof frequency === 'number' && frequency > 0) {
    checkpoints = injectByTaskCount(tasks, frequency, trdId);
  } else {
    throw new Error(`Invalid checkpoint frequency: ${frequency}`);
  }

  // Insert checkpoints into task list (reverse order to maintain indices)
  const enhancedTasks = [...tasks];
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    const checkpoint = checkpoints[i];
    enhancedTasks.splice(checkpoint.insertionIndex, 0, checkpoint.task);
  }

  return {
    tasks: enhancedTasks,
    checkpoints: checkpoints.map(c => c.task),
    metrics: {
      totalCheckpoints: checkpoints.length,
      frequency,
      coverage: calculateCoverage(tasks, checkpoints)
    }
  };
}

/**
 * Inject checkpoints at sprint boundaries
 *
 * @param {Object[]} tasks - Task array
 * @param {string} trdId - TRD identifier
 * @returns {Object[]} Checkpoint objects with insertion metadata
 */
function injectAtSprintBoundaries(tasks, trdId) {
  const checkpoints = [];
  let checkpointCounter = 1;

  // Group tasks by sprint
  const sprintGroups = groupTasksBySprint(tasks);

  sprintGroups.forEach((sprintTasks, sprintIndex) => {
    if (sprintTasks.length === 0) {
      return; // Skip empty sprints
    }

    const completedTaskIds = sprintTasks.map(t => t.id);
    const lastTaskIndex = tasks.indexOf(sprintTasks[sprintTasks.length - 1]);

    const checkpoint = createCheckpointTask({
      id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
      type: 'checkpoint',
      trigger: 'sprint',
      sprintNumber: sprintIndex + 1,
      sprintName: `Sprint ${sprintIndex + 1}`,
      completedTasks: completedTaskIds,
      trdId,
      taskCount: completedTaskIds.length
    });

    checkpoints.push({
      task: checkpoint,
      insertionIndex: lastTaskIndex + 1,
      location: 'sprint-end'
    });

    checkpointCounter++;
  });

  return checkpoints;
}

/**
 * Inject checkpoints at phase boundaries
 *
 * @param {Object[]} tasks - Task array
 * @param {string} trdId - TRD identifier
 * @returns {Object[]} Checkpoint objects with insertion metadata
 */
function injectAtPhaseBoundaries(tasks, trdId) {
  const checkpoints = [];
  let checkpointCounter = 1;

  // Group tasks by phase
  const phaseGroups = groupTasksByPhase(tasks);

  phaseGroups.forEach((phaseTasks, phaseIndex) => {
    if (phaseTasks.length === 0) {
      return; // Skip empty phases
    }

    const completedTaskIds = phaseTasks.map(t => t.id);
    const lastTaskIndex = tasks.indexOf(phaseTasks[phaseTasks.length - 1]);

    const checkpoint = createCheckpointTask({
      id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
      type: 'checkpoint',
      trigger: 'phase',
      phaseNumber: phaseIndex + 1,
      phaseName: `Phase ${phaseIndex + 1}`,
      completedTasks: completedTaskIds,
      trdId,
      taskCount: completedTaskIds.length
    });

    checkpoints.push({
      task: checkpoint,
      insertionIndex: lastTaskIndex + 1,
      location: 'phase-end'
    });

    checkpointCounter++;
  });

  return checkpoints;
}

/**
 * Inject checkpoints based on task count frequency
 *
 * @param {Object[]} tasks - Task array
 * @param {number} frequency - Checkpoint every N tasks
 * @param {string} trdId - TRD identifier
 * @returns {Object[]} Checkpoint objects with insertion metadata
 */
function injectByTaskCount(tasks, frequency, trdId) {
  const checkpoints = [];
  let checkpointCounter = 1;
  let accumulatedTasks = [];

  tasks.forEach((task, index) => {
    accumulatedTasks.push(task.id);

    // Inject checkpoint every N tasks
    if ((index + 1) % frequency === 0) {
      const checkpoint = createCheckpointTask({
        id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
        type: 'checkpoint',
        trigger: 'task-count',
        frequency,
        taskRange: {
          start: index + 1 - frequency + 1,
          end: index + 1
        },
        completedTasks: [...accumulatedTasks],
        trdId,
        taskCount: accumulatedTasks.length
      });

      checkpoints.push({
        task: checkpoint,
        insertionIndex: index + 1 + checkpointCounter - 1, // adjust for previously inserted checkpoints
        location: 'task-count'
      });

      checkpointCounter++;
      accumulatedTasks = [];
    }
  });

  // Handle remaining tasks
  if (accumulatedTasks.length > 0) {
    const checkpoint = createCheckpointTask({
      id: `TASK-CHKPT-${String(checkpointCounter).padStart(3, '0')}`,
      type: 'checkpoint',
      trigger: 'task-count-final',
      completedTasks: accumulatedTasks,
      trdId,
      taskCount: accumulatedTasks.length
    });

    checkpoints.push({
      task: checkpoint,
      insertionIndex: tasks.length + checkpoints.length,
      location: 'final'
    });
  }

  return checkpoints;
}

/**
 * Create a checkpoint task object
 *
 * @param {Object} params - Checkpoint parameters
 * @returns {Object} Checkpoint task object
 */
export function createCheckpointTask(params) {
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
 * Group tasks by sprint number
 *
 * @param {Object[]} tasks - Task array
 * @returns {Object[][]} Array of sprint groups
 */
function groupTasksBySprint(tasks) {
  const sprints = new Map();

  tasks.forEach(task => {
    const sprintNum = task.sprint || 1;
    if (!sprints.has(sprintNum)) {
      sprints.set(sprintNum, []);
    }
    sprints.get(sprintNum).push(task);
  });

  return Array.from(sprints.values());
}

/**
 * Group tasks by phase number
 *
 * @param {Object[]} tasks - Task array
 * @returns {Object[][]} Array of phase groups
 */
function groupTasksByPhase(tasks) {
  const phases = new Map();

  tasks.forEach(task => {
    const phaseNum = task.phase || 1;
    if (!phases.has(phaseNum)) {
      phases.set(phaseNum, []);
    }
    phases.get(phaseNum).push(task);
  });

  return Array.from(phases.values());
}

/**
 * Calculate checkpoint coverage percentage
 *
 * @param {Object[]} tasks - Original task array
 * @param {Object[]} checkpoints - Checkpoint array
 * @returns {number} Coverage percentage
 */
function calculateCoverage(tasks, checkpoints) {
  if (tasks.length === 0) return 0;

  const totalTasks = tasks.length;
  const checkpointCount = checkpoints.length;

  // Ideal coverage: 1 checkpoint per 5-10 tasks
  const idealCheckpoints = Math.ceil(totalTasks / 7);
  const coverage = Math.min(100, (checkpointCount / idealCheckpoints) * 100);

  return Math.round(coverage);
}

/**
 * Convert string to kebab-case
 *
 * @param {string} str - Input string
 * @returns {string} Kebab-case string
 */
function kebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

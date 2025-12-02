/**
 * Commit Message Template Generator
 *
 * @module commit-template-generator
 * @description Generate commit message templates from TRD context using Handlebars
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-015
 */

import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Template cache
let compiledTemplate = null;

/**
 * Load and compile Handlebars template
 *
 * @returns {Function} Compiled Handlebars template
 * @private
 */
function loadTemplate() {
  if (!compiledTemplate) {
    const templatePath = join(__dirname, '../templates/commit-message.hbs');
    const templateSource = readFileSync(templatePath, 'utf-8');
    compiledTemplate = Handlebars.compile(templateSource);
  }
  return compiledTemplate;
}

/**
 * Generate commit message templates for TRD
 *
 * @param {Object} trdContext - TRD context object
 * @param {string} trdContext.trd_id - TRD identifier
 * @param {string} trdContext.title - TRD title
 * @param {Object[]} trdContext.tasks - Array of task objects
 * @param {Object} trdContext.phases - Phase structure (optional)
 * @param {Object} [options={}] - Generation options
 * @param {number} [options.templateCount=5] - Number of example templates to generate
 * @returns {Object} Generated templates and metadata
 *
 * @example
 * const templates = generateCommitTemplates({
 *   trd_id: 'TRD-WORKFLOW-001',
 *   title: 'Workflow Enhancement System',
 *   tasks: [...]
 * });
 */
export function generateCommitTemplates(trdContext, options = {}) {
  const {
    templateCount = 5
  } = options;

  // Validate input
  if (!trdContext || !trdContext.trd_id) {
    throw new Error('Invalid TRD context: missing trd_id');
  }

  // Extract scope from TRD title and context
  const scope = extractScope(trdContext);

  // Detect commit types from tasks
  const detectedTypes = detectCommitTypes(trdContext.tasks || []);

  // Generate template examples
  const templates = [];

  // Generate templates for each detected type
  detectedTypes.slice(0, templateCount).forEach(typeInfo => {
    const template = generateTemplate({
      commit_type: typeInfo.type,
      commit_scope: scope,
      commit_subject: typeInfo.exampleSubject,
      commit_body: typeInfo.exampleBody,
      completed_tasks: typeInfo.tasks,
      trd_id: trdContext.trd_id,
      sprint_number: typeInfo.sprintNumber,
      phase_number: typeInfo.phaseNumber
    });

    templates.push({
      type: typeInfo.type,
      template,
      description: typeInfo.description,
      taskCount: typeInfo.tasks.length
    });
  });

  // Generate comprehensive template if we have fewer than requested
  while (templates.length < templateCount) {
    const type = getNextCommitType(templates.map(t => t.type));
    const template = generateTemplate({
      commit_type: type,
      commit_scope: scope,
      commit_subject: `${type} implementation`,
      commit_body: 'Detailed description of changes',
      completed_tasks: [],
      trd_id: trdContext.trd_id
    });

    templates.push({
      type,
      template,
      description: getCommitTypeDescription(type),
      taskCount: 0
    });
  }

  return {
    templates,
    scope,
    trd_id: trdContext.trd_id,
    metadata: {
      totalTemplates: templates.length,
      detectedTypes: detectedTypes.map(t => t.type),
      recommendedScope: scope
    }
  };
}

/**
 * Generate single commit message from template
 *
 * @param {Object} context - Template context
 * @returns {string} Formatted commit message
 * @private
 */
function generateTemplate(context) {
  const template = loadTemplate();
  return template(context);
}

/**
 * Extract scope from TRD context
 *
 * @param {Object} trdContext - TRD context
 * @returns {string} Extracted scope
 * @private
 */
function extractScope(trdContext) {
  // Strategy 1: Extract from TRD title
  if (trdContext.title) {
    const title = trdContext.title.toLowerCase();

    // Common scope patterns
    const patterns = [
      /workflow/,
      /api/,
      /auth/,
      /ui/,
      /database/,
      /backend/,
      /frontend/,
      /infrastructure/,
      /deployment/,
      /testing/,
      /documentation/
    ];

    for (const pattern of patterns) {
      if (pattern.test(title)) {
        return pattern.source;
      }
    }

    // Extract first meaningful word
    const words = title.split(/\s+/);
    if (words.length > 0) {
      return kebabCase(words[0]);
    }
  }

  // Strategy 2: Extract from phase names
  if (trdContext.phases && Array.isArray(trdContext.phases)) {
    const firstPhase = trdContext.phases[0];
    if (firstPhase && firstPhase.name) {
      return kebabCase(firstPhase.name.split(':')[0]);
    }
  }

  // Strategy 3: Default to 'trd'
  return 'trd';
}

/**
 * Detect commit types from task descriptions
 *
 * @param {Object[]} tasks - Array of task objects
 * @returns {Object[]} Array of detected commit types with examples
 * @private
 */
function detectCommitTypes(tasks) {
  const typeMap = new Map();

  // Commit type detection patterns
  const typePatterns = {
    feat: {
      keywords: ['implement', 'create', 'add', 'build', 'new', 'develop'],
      description: 'New feature or functionality'
    },
    fix: {
      keywords: ['fix', 'bug', 'resolve', 'correct', 'repair', 'patch'],
      description: 'Bug fix'
    },
    refactor: {
      keywords: ['refactor', 'restructure', 'reorganize', 'rewrite', 'improve'],
      description: 'Code refactoring'
    },
    docs: {
      keywords: ['document', 'documentation', 'readme', 'comment', 'guide'],
      description: 'Documentation changes'
    },
    test: {
      keywords: ['test', 'testing', 'spec', 'unit test', 'integration test'],
      description: 'Test creation or updates'
    },
    perf: {
      keywords: ['optimize', 'performance', 'speed', 'cache', 'efficient'],
      description: 'Performance improvement'
    },
    style: {
      keywords: ['style', 'format', 'lint', 'prettier', 'eslint'],
      description: 'Code style changes'
    },
    chore: {
      keywords: ['chore', 'setup', 'config', 'dependency', 'upgrade'],
      description: 'Maintenance tasks'
    }
  };

  tasks.forEach(task => {
    const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();

    // Detect types based on keywords
    Object.entries(typePatterns).forEach(([type, pattern]) => {
      const score = pattern.keywords.reduce((sum, keyword) => {
        return sum + (text.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > 0) {
        if (!typeMap.has(type)) {
          typeMap.set(type, {
            type,
            description: pattern.description,
            tasks: [],
            score: 0
          });
        }

        const entry = typeMap.get(type);
        entry.tasks.push({
          id: task.id,
          description: task.title || task.description
        });
        entry.score += score;
      }
    });
  });

  // Sort by score (most relevant first)
  const detected = Array.from(typeMap.values())
    .sort((a, b) => b.score - a.score)
    .map(entry => ({
      type: entry.type,
      description: entry.description,
      tasks: entry.tasks.slice(0, 5), // max 5 tasks per template
      exampleSubject: generateExampleSubject(entry.type, entry.tasks[0]),
      exampleBody: generateExampleBody(entry.type, entry.tasks),
      sprintNumber: null,
      phaseNumber: null
    }));

  return detected;
}

/**
 * Generate example commit subject
 *
 * @param {string} type - Commit type
 * @param {Object} task - Task object
 * @returns {string} Example subject line
 * @private
 */
function generateExampleSubject(type, task) {
  if (!task) {
    return `${type} implementation`;
  }

  const description = task.description || task.title || '';
  const words = description.split(/\s+/).slice(0, 8);
  const subject = words.join(' ').toLowerCase();

  return subject.length > 50 ? subject.substring(0, 50) : subject;
}

/**
 * Generate example commit body
 *
 * @param {string} type - Commit type
 * @param {Object[]} tasks - Array of task objects
 * @returns {string} Example body text
 * @private
 */
function generateExampleBody(type, tasks) {
  if (!tasks || tasks.length === 0) {
    return `Detailed description of ${type} changes`;
  }

  return `Implemented the following changes:\n${tasks.slice(0, 3).map(t => `- ${t.description}`).join('\n')}`;
}

/**
 * Get next commit type not yet in templates
 *
 * @param {string[]} usedTypes - Already used commit types
 * @returns {string} Next commit type
 * @private
 */
function getNextCommitType(usedTypes) {
  const allTypes = ['feat', 'fix', 'refactor', 'docs', 'test', 'perf', 'style', 'chore'];

  for (const type of allTypes) {
    if (!usedTypes.includes(type)) {
      return type;
    }
  }

  return 'feat'; // default fallback
}

/**
 * Get commit type description
 *
 * @param {string} type - Commit type
 * @returns {string} Type description
 * @private
 */
function getCommitTypeDescription(type) {
  const descriptions = {
    feat: 'New feature or functionality',
    fix: 'Bug fix',
    refactor: 'Code refactoring',
    docs: 'Documentation changes',
    test: 'Test creation or updates',
    perf: 'Performance improvement',
    style: 'Code style changes',
    chore: 'Maintenance tasks',
    build: 'Build system changes',
    ci: 'CI/CD changes'
  };

  return descriptions[type] || 'General changes';
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
 * Render commit message with Handlebars template
 *
 * @param {Object} context - Template context matching commit-message.hbs variables
 * @returns {string} Rendered commit message
 *
 * @example
 * const message = renderCommitMessage({
 *   commit_type: 'feat',
 *   commit_scope: 'workflow',
 *   commit_subject: 'add checkpoint injection',
 *   completed_tasks: [{ id: 'TASK-001', description: 'Implement injector' }],
 *   trd_id: 'TRD-WORKFLOW-001'
 * });
 */
export function renderCommitMessage(context) {
  return generateTemplate(context);
}

/**
 * Format commit message with conventional commits spec
 *
 * @param {string} type - Commit type
 * @param {string} scope - Commit scope
 * @param {string} subject - Subject line
 * @param {Object} [options={}] - Additional options
 * @returns {string} Formatted commit message
 */
export function formatCommitMessage(type, scope, subject, options = {}) {
  const {
    body = null,
    footer = null,
    breaking = false,
    breakingDescription = null
  } = options;

  let message = `${type}`;

  if (scope) {
    message += `(${scope})`;
  }

  message += `: ${subject}`;

  if (body) {
    message += `\n\n${body}`;
  }

  if (footer) {
    message += `\n\n${footer}`;
  }

  if (breaking && breakingDescription) {
    message += `\n\nBREAKING CHANGE: ${breakingDescription}`;
  }

  return message;
}

/**
 * Validate commit message format
 *
 * @param {string} message - Commit message to validate
 * @returns {Object} Validation result
 */
export function validateCommitMessage(message) {
  const errors = [];
  const warnings = [];

  if (!message || message.trim().length === 0) {
    errors.push('Commit message is empty');
    return { valid: false, errors, warnings };
  }

  // Check conventional commit format
  const lines = message.split('\n');
  const headerLine = lines[0];

  // Header format: type(scope): subject
  const headerRegex = /^(feat|fix|refactor|docs|test|perf|style|chore|build|ci)(\([a-z0-9-]+\))?:\s+.+$/;

  if (!headerRegex.test(headerLine)) {
    errors.push('Header does not follow conventional commit format: type(scope): subject');
  }

  // Check subject line length
  if (headerLine.length > 72) {
    warnings.push('Subject line exceeds 72 characters (recommended limit)');
  }

  // Check for TRD reference
  if (!message.includes('Related:') && !message.includes('TRD-')) {
    warnings.push('Missing TRD reference in commit message');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

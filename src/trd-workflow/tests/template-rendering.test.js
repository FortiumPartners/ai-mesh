/**
 * Unit tests for template rendering modules
 * Tests commit message templates and workflow section templates
 *
 * @module template-rendering.test
 * @related TRD-WORKFLOW-001, TASK-030
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateCommitTemplates,
  renderCommitMessage,
  formatCommitMessage,
  validateCommitMessage
} from '../lib/commit-template-generator.js';

describe('Template Rendering - Commit Templates', () => {
  describe('generateCommitTemplates', () => {
    test('should generate commit templates from TRD context', () => {
      const trdContext = {
        trd_id: 'TRD-WORKFLOW-001',
        title: 'Workflow Enhancement System',
        tasks: [
          { id: 'TASK-001', title: 'Implement feature', description: 'Add new functionality' },
          { id: 'TASK-002', title: 'Fix bug', description: 'Resolve issue' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates);
      assert.ok(Array.isArray(result.templates));
      assert.ok(result.templates.length > 0);
      assert.ok(result.scope);
      assert.ok(result.trd_id);
    });

    test('should detect commit types from tasks', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: [
          { id: 'TASK-001', title: 'Implement new API', description: 'Create endpoint' },
          { id: 'TASK-002', title: 'Fix authentication bug', description: 'Resolve login issue' },
          { id: 'TASK-003', title: 'Refactor database layer', description: 'Improve code structure' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      const types = result.templates.map(t => t.type);
      assert.ok(types.includes('feat'));
      assert.ok(types.includes('fix'));
      assert.ok(types.includes('refactor'));
    });

    test('should extract scope from TRD title', () => {
      const trdContext = {
        trd_id: 'TRD-WORKFLOW-001',
        title: 'Workflow Enhancement System',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.strictEqual(result.scope, 'workflow');
    });

    test('should generate requested number of templates', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test TRD',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', description: 'Desc 1' }
        ]
      };

      const result = generateCommitTemplates(trdContext, { templateCount: 3 });

      assert.strictEqual(result.templates.length, 3);
    });

    test('should handle TRD with no tasks', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Empty TRD',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.length > 0);
      assert.ok(result.metadata.totalTemplates > 0);
    });

    test('should throw error for invalid TRD context', () => {
      assert.throws(
        () => generateCommitTemplates(null),
        /Invalid TRD context/
      );

      assert.throws(
        () => generateCommitTemplates({}),
        /Invalid TRD context/
      );
    });
  });

  describe('Template variables', () => {
    test('should include all required template variables', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: [
          { id: 'TASK-001', title: 'Implement backend API', description: 'Create REST endpoints' }
        ]
      };

      const result = generateCommitTemplates(trdContext);
      const template = result.templates[0];

      assert.ok(template.template);
      assert.ok(template.type);
      assert.ok(template.description);
    });

    test('should include completed tasks in templates', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Feature Implementation',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', description: 'Implementation work' },
          { id: 'TASK-002', title: 'Task 2', description: 'More work' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.some(t => t.taskCount > 0));
    });

    test('should limit tasks per template', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Large TRD',
        tasks: Array.from({ length: 20 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          description: `Implementation of task ${i + 1}`
        }))
      };

      const result = generateCommitTemplates(trdContext);

      // Each template should have max 5 tasks
      result.templates.forEach(template => {
        assert.ok(template.taskCount <= 5 || template.taskCount === 0);
      });
    });
  });

  describe('renderCommitMessage', () => {
    test('should render commit message with all fields', () => {
      const context = {
        commit_type: 'feat',
        commit_scope: 'workflow',
        commit_subject: 'add checkpoint injection',
        commit_body: 'Implemented checkpoint injection algorithm',
        completed_tasks: [
          { id: 'TASK-001', description: 'Design algorithm' },
          { id: 'TASK-002', description: 'Implement logic' }
        ],
        trd_id: 'TRD-WORKFLOW-001'
      };

      const message = renderCommitMessage(context);

      assert.ok(message.includes('feat'));
      assert.ok(message.includes('workflow'));
      assert.ok(message.includes('checkpoint injection'));
      assert.ok(message.includes('TRD-WORKFLOW-001'));
    });

    test('should handle missing optional fields', () => {
      const context = {
        commit_type: 'feat',
        commit_scope: 'core',
        commit_subject: 'basic implementation',
        completed_tasks: [],
        trd_id: 'TRD-TEST-001'
      };

      const message = renderCommitMessage(context);

      assert.ok(message);
      assert.ok(message.includes('feat(core)'));
    });
  });

  describe('formatCommitMessage', () => {
    test('should format conventional commit message', () => {
      const message = formatCommitMessage('feat', 'workflow', 'add new feature');

      assert.strictEqual(message, 'feat(workflow): add new feature');
    });

    test('should handle missing scope', () => {
      const message = formatCommitMessage('fix', null, 'resolve bug');

      assert.strictEqual(message, 'fix: resolve bug');
    });

    test('should include body when provided', () => {
      const message = formatCommitMessage('feat', 'api', 'add endpoint', {
        body: 'This adds a new REST endpoint for user management'
      });

      assert.ok(message.includes('feat(api): add endpoint'));
      assert.ok(message.includes('This adds a new REST endpoint'));
    });

    test('should include footer when provided', () => {
      const message = formatCommitMessage('fix', 'auth', 'fix login', {
        footer: 'Related: TRD-WORKFLOW-001'
      });

      assert.ok(message.includes('Related: TRD-WORKFLOW-001'));
    });

    test('should handle breaking changes', () => {
      const message = formatCommitMessage('feat', 'api', 'change endpoint', {
        breaking: true,
        breakingDescription: 'API endpoint URL changed'
      });

      assert.ok(message.includes('BREAKING CHANGE'));
      assert.ok(message.includes('API endpoint URL changed'));
    });
  });

  describe('validateCommitMessage', () => {
    test('should validate correct commit message', () => {
      const message = 'feat(workflow): add checkpoint injection\n\nRelated: TRD-WORKFLOW-001';

      const result = validateCommitMessage(message);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should detect invalid format', () => {
      const message = 'random commit message without format';

      const result = validateCommitMessage(message);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    test('should warn about long subject line', () => {
      const longSubject = 'feat(workflow): ' + 'a'.repeat(100);

      const result = validateCommitMessage(longSubject);

      assert.ok(result.warnings.some(w => w.includes('72 characters')));
    });

    test('should warn about missing TRD reference', () => {
      const message = 'feat(workflow): add feature\n\nNo TRD reference here';

      const result = validateCommitMessage(message);

      assert.ok(result.warnings.some(w => w.includes('TRD reference')));
    });

    test('should handle empty message', () => {
      const result = validateCommitMessage('');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('empty')));
    });

    test('should validate all commit types', () => {
      const types = ['feat', 'fix', 'refactor', 'docs', 'test', 'perf', 'style', 'chore'];

      types.forEach(type => {
        const message = `${type}(scope): subject`;
        const result = validateCommitMessage(message);
        assert.strictEqual(result.valid, true, `Type ${type} should be valid`);
      });
    });

    test('should reject invalid commit type', () => {
      const message = 'invalid(scope): subject';

      const result = validateCommitMessage(message);

      assert.strictEqual(result.valid, false);
    });
  });

  describe('Scope extraction', () => {
    test('should extract scope from TRD ID', () => {
      const trdContext = {
        trd_id: 'TRD-WORKFLOW-001',
        title: 'Some Title',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.strictEqual(result.scope, 'workflow');
    });

    test('should extract scope from title when TRD ID is generic', () => {
      const trdContext = {
        trd_id: 'TRD-001',
        title: 'Authentication System Implementation',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.strictEqual(result.scope, 'authentication');
    });

    test('should use default scope when unable to extract', () => {
      const trdContext = {
        trd_id: 'TRD-001',
        title: '',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.strictEqual(result.scope, 'trd');
    });

    test('should convert scope to kebab-case', () => {
      const trdContext = {
        trd_id: 'TRD-001',
        title: 'User Authentication System',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.strictEqual(result.scope, 'user');
    });
  });

  describe('Example generation', () => {
    test('should generate example subject lines', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: [
          { id: 'TASK-001', title: 'Implement user authentication with OAuth2', description: 'Add OAuth' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      const template = result.templates[0];
      assert.ok(template.template);
      assert.ok(template.template.length > 0);
    });

    test('should generate example body text', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', description: 'Description 1' },
          { id: 'TASK-002', title: 'Task 2', description: 'Description 2' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      const template = result.templates[0];
      assert.ok(template.template.includes('Implemented'));
    });

    test('should limit example body text', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Large Feature',
        tasks: Array.from({ length: 10 }, (_, i) => ({
          id: `TASK-${String(i + 1).padStart(3, '0')}`,
          title: `Task ${i + 1}`,
          description: `Very long description for task ${i + 1}`
        }))
      };

      const result = generateCommitTemplates(trdContext);

      // Body should be limited to 3 tasks in examples
      result.templates.forEach(template => {
        if (template.taskCount > 0) {
          const bodyLines = template.template.split('\n').filter(l => l.startsWith('- '));
          assert.ok(bodyLines.length <= 3);
        }
      });
    });
  });

  describe('Metadata and reporting', () => {
    test('should include metadata in result', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: [
          { id: 'TASK-001', title: 'Task 1', description: 'Desc 1' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.metadata);
      assert.ok(typeof result.metadata.totalTemplates === 'number');
      assert.ok(Array.isArray(result.metadata.detectedTypes));
      assert.ok(result.metadata.recommendedScope);
    });

    test('should report detected types', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test Feature',
        tasks: [
          { id: 'TASK-001', title: 'Implement feature', description: 'Add new feature' },
          { id: 'TASK-002', title: 'Fix bug', description: 'Resolve issue' },
          { id: 'TASK-003', title: 'Refactor code', description: 'Improve structure' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.metadata.detectedTypes.length > 0);
      assert.ok(result.metadata.detectedTypes.includes('feat') ||
                result.metadata.detectedTypes.includes('fix') ||
                result.metadata.detectedTypes.includes('refactor'));
    });
  });

  describe('Special characters and edge cases', () => {
    test('should handle special characters in TRD title', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Feature: Add API v2.0 (REST)',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.scope);
      // Scope should be cleaned of special characters
      assert.ok(/^[a-z0-9-]+$/.test(result.scope));
    });

    test('should handle very long task titles', () => {
      const longTitle = 'Implement comprehensive user authentication system with OAuth2, JWT, and multi-factor authentication support including email and SMS verification';

      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Auth System',
        tasks: [
          { id: 'TASK-001', title: longTitle, description: 'Long implementation' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      // Subject should be truncated to reasonable length
      const template = result.templates[0];
      assert.ok(template.template.length < 500);
    });

    test('should handle empty task arrays', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Empty TRD',
        tasks: []
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.length > 0);
    });

    test('should handle null/undefined task properties', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Test',
        tasks: [
          { id: 'TASK-001' }  // No title or description
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.length > 0);
    });
  });

  describe('Commit type detection', () => {
    test('should detect fix type from keywords', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Bug Fix',
        tasks: [
          { id: 'TASK-001', title: 'Fix authentication bug', description: 'Resolve login issue' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.some(t => t.type === 'fix'));
    });

    test('should detect docs type from keywords', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Documentation Update',
        tasks: [
          { id: 'TASK-001', title: 'Update API documentation', description: 'Write comprehensive docs' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.some(t => t.type === 'docs'));
    });

    test('should detect test type from keywords', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'Testing',
        tasks: [
          { id: 'TASK-001', title: 'Add unit tests', description: 'Write comprehensive test suite' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.some(t => t.type === 'test'));
    });

    test('should default to feat for unclear tasks', () => {
      const trdContext = {
        trd_id: 'TRD-TEST-001',
        title: 'New Feature',
        tasks: [
          { id: 'TASK-001', title: 'Implement something', description: 'Do work' }
        ]
      };

      const result = generateCommitTemplates(trdContext);

      assert.ok(result.templates.some(t => t.type === 'feat'));
    });
  });
});

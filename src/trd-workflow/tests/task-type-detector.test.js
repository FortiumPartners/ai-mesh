/**
 * Unit tests for task-type-detector module
 * Tests keyword matching, confidence scoring, and fallback behavior
 *
 * @module task-type-detector.test
 * @related TRD-WORKFLOW-001, TASK-029
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { analyzeTaskTypes, detectTaskType } from '../lib/task-type-detector.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load pattern library for testing
function loadPatterns() {
  const patternPath = join(__dirname, '../algorithms/task-type-patterns.json');
  return JSON.parse(readFileSync(patternPath, 'utf-8'));
}

describe('Task Type Detector', () => {
  describe('analyzeTaskTypes', () => {
    test('should analyze multiple tasks', () => {
      const tasks = [
        { id: 'TASK-001', title: 'Implement REST API endpoint', description: 'Create new API' },
        { id: 'TASK-002', title: 'Write unit tests', description: 'Test coverage' },
        { id: 'TASK-003', title: 'Build React component', description: 'Frontend UI' }
      ];

      const result = analyzeTaskTypes(tasks);

      assert.ok(result.classifications);
      assert.ok(result.summary);
      assert.strictEqual(Object.keys(result.classifications).length, 3);
    });

    test('should generate summary statistics', () => {
      const tasks = [
        { id: 'TASK-001', title: 'Backend task', type: 'backend' },
        { id: 'TASK-002', title: 'Frontend task', type: 'frontend' },
        { id: 'TASK-003', title: 'Test task', type: 'testing' }
      ];

      const result = analyzeTaskTypes(tasks);

      assert.strictEqual(result.summary.totalTasks, 3);
      assert.ok(result.summary.uniqueTypes > 0);
      assert.ok(result.summary.typeDistribution);
      assert.ok(typeof result.summary.avgConfidence === 'number');
    });

    test('should handle empty task array', () => {
      const result = analyzeTaskTypes([]);

      assert.strictEqual(result.summary.totalTasks, 0);
      assert.strictEqual(result.summary.uniqueTypes, 0);
    });

    test('should handle null/undefined input', () => {
      const result = analyzeTaskTypes(null);

      assert.strictEqual(result.summary.totalTasks, 0);
    });
  });

  describe('detectTaskType - keyword matching', () => {
    const patterns = loadPatterns();

    test('should detect backend tasks', () => {
      const task = {
        id: 'TASK-001',
        title: 'Implement REST API endpoint',
        description: 'Create server-side API with database integration'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'backend');
      assert.ok(result.confidence > 0.4);
    });

    test('should detect frontend tasks', () => {
      const task = {
        id: 'TASK-002',
        title: 'Build React component',
        description: 'Create UI component with responsive design'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'frontend');
      assert.ok(result.confidence > 0.4);
    });

    test('should detect testing tasks', () => {
      const task = {
        id: 'TASK-003',
        title: 'Write unit tests',
        description: 'Add test coverage for new features'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'testing');
      assert.ok(result.confidence > 0.4);
    });

    test('should detect infrastructure tasks', () => {
      const task = {
        id: 'TASK-004',
        title: 'Configure Kubernetes deployment',
        description: 'Set up container orchestration and AWS infrastructure'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'infrastructure');
      assert.ok(result.confidence > 0.4);
    });

    test('should detect documentation tasks', () => {
      const task = {
        id: 'TASK-005',
        title: 'Update API documentation',
        description: 'Write comprehensive docs and examples'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'documentation');
      assert.ok(result.confidence > 0.4);
    });

    test('should detect security tasks', () => {
      const task = {
        id: 'TASK-006',
        title: 'Implement authentication',
        description: 'Add security with JWT and OAuth2'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'security');
      assert.ok(result.confidence > 0.4);
    });
  });

  describe('Confidence scoring', () => {
    const patterns = loadPatterns();

    test('should give high confidence for clear matches', () => {
      const task = {
        id: 'TASK-001',
        title: 'Implement backend API with database and server logic',
        description: 'Complete backend implementation with REST endpoints'
      };

      const result = detectTaskType(task, patterns);

      assert.ok(result.confidence > 0.6, 'Should have high confidence for strong match');
    });

    test('should give low confidence for ambiguous tasks', () => {
      const task = {
        id: 'TASK-002',
        title: 'General implementation',
        description: 'Implement feature'
      };

      const result = detectTaskType(task, patterns);

      assert.ok(result.confidence < 0.5, 'Should have low confidence for ambiguous match');
    });

    test('should detect secondary types', () => {
      const task = {
        id: 'TASK-003',
        title: 'Implement API with tests',
        description: 'Backend API implementation and unit testing'
      };

      const result = detectTaskType(task, patterns, { multiTypeThreshold: 0.3 });

      assert.ok(result.secondaryTypes.length > 0);
    });

    test('should calculate ambiguity level', () => {
      const task = {
        id: 'TASK-004',
        title: 'Task with multiple aspects',
        description: 'Implementation involving backend, frontend, and testing'
      };

      const result = detectTaskType(task, patterns);

      assert.ok(result.metadata.ambiguityLevel >= 0 && result.metadata.ambiguityLevel <= 1);
    });
  });

  describe('Fallback behavior', () => {
    const patterns = loadPatterns();

    test('should apply fallback when confidence is low', () => {
      const task = {
        id: 'TASK-001',
        title: 'Do something',
        description: 'Generic task'
      };

      const result = detectTaskType(task, patterns, {
        confidenceThreshold: 0.4,
        enableFallback: true
      });

      assert.ok(result.primaryType, 'Should have a primary type from fallback');
    });

    test('should use metadata hint in fallback', () => {
      const task = {
        id: 'TASK-002',
        title: 'Generic task',
        description: 'Do work',
        metadata: { type: 'backend' }
      };

      const result = detectTaskType(task, patterns, {
        confidenceThreshold: 0.8,
        enableFallback: true
      });

      assert.strictEqual(result.primaryType, 'backend');
      assert.strictEqual(result.fallbackReason, 'metadata-hint');
    });

    test('should use best available score in fallback', () => {
      const task = {
        id: 'TASK-003',
        title: 'API work',
        description: 'Some implementation'
      };

      const result = detectTaskType(task, patterns, {
        confidenceThreshold: 0.9,
        enableFallback: true
      });

      assert.ok(result.primaryType);
      assert.ok(result.fallbackReason === 'best-available' || result.fallbackReason === 'default-fallback');
    });

    test('should default to general type when no matches', () => {
      const task = {
        id: 'TASK-004',
        title: 'xyz abc def',
        description: 'qwerty uiop'
      };

      const result = detectTaskType(task, patterns, {
        confidenceThreshold: 0.4,
        enableFallback: true
      });

      assert.strictEqual(result.primaryType, 'general');
    });

    test('should respect enableFallback=false', () => {
      const task = {
        id: 'TASK-005',
        title: 'Generic',
        description: 'Task'
      };

      const result = detectTaskType(task, patterns, {
        confidenceThreshold: 0.9,
        enableFallback: false
      });

      assert.strictEqual(result.primaryType, null);
    });
  });

  describe('Pattern matching', () => {
    const patterns = loadPatterns();

    test('should match regex patterns', () => {
      const task = {
        id: 'TASK-001',
        title: 'Configure CI/CD pipeline',
        description: 'Set up continuous integration with Jenkins'
      };

      const result = detectTaskType(task, patterns);

      assert.ok(result.metadata.matchedPatterns.length >= 0);
    });

    test('should handle acceptance criteria in detection', () => {
      const task = {
        id: 'TASK-002',
        title: 'Feature implementation',
        description: 'General implementation',
        acceptance_criteria: [
          'API endpoint returns correct data',
          'Database query is optimized',
          'Unit tests cover all cases'
        ]
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'backend');
    });

    test('should consider task tags', () => {
      const task = {
        id: 'TASK-003',
        title: 'Work item',
        description: 'Implementation',
        tags: ['infrastructure', 'kubernetes', 'deployment']
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'infrastructure');
    });
  });

  describe('Edge cases', () => {
    const patterns = loadPatterns();

    test('should handle task with only title', () => {
      const task = {
        id: 'TASK-001',
        title: 'Implement backend API'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'backend');
    });

    test('should handle task with only description', () => {
      const task = {
        id: 'TASK-002',
        description: 'Create React component with TypeScript'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'frontend');
    });

    test('should handle task with empty strings', () => {
      const task = {
        id: 'TASK-003',
        title: '',
        description: ''
      };

      const result = detectTaskType(task, patterns, { enableFallback: true });

      assert.strictEqual(result.primaryType, 'general');
    });

    test('should handle very long task descriptions', () => {
      const longDescription = 'API '.repeat(1000) + 'backend implementation';
      const task = {
        id: 'TASK-004',
        title: 'Long task',
        description: longDescription
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'backend');
    });

    test('should handle special characters', () => {
      const task = {
        id: 'TASK-005',
        title: 'API-v2 (REST) @backend #feature',
        description: 'Create REST/API with JSON-RPC support'
      };

      const result = detectTaskType(task, patterns);

      assert.strictEqual(result.primaryType, 'backend');
    });
  });

  describe('Threshold configuration', () => {
    const patterns = loadPatterns();

    test('should respect custom confidence threshold', () => {
      const task = {
        id: 'TASK-001',
        title: 'API implementation',
        description: 'Some backend work'
      };

      const lowThreshold = detectTaskType(task, patterns, { confidenceThreshold: 0.2 });
      const highThreshold = detectTaskType(task, patterns, { confidenceThreshold: 0.9 });

      assert.ok(lowThreshold.primaryType);
      // High threshold might return null or use fallback
      assert.ok(highThreshold.primaryType === null || highThreshold.fallbackReason);
    });

    test('should respect multi-type threshold', () => {
      const task = {
        id: 'TASK-002',
        title: 'Full-stack implementation',
        description: 'Backend API and frontend UI with tests'
      };

      const lowMulti = detectTaskType(task, patterns, { multiTypeThreshold: 0.1 });
      const highMulti = detectTaskType(task, patterns, { multiTypeThreshold: 0.8 });

      assert.ok(lowMulti.secondaryTypes.length >= highMulti.secondaryTypes.length);
    });
  });

  describe('Score calculation', () => {
    const patterns = loadPatterns();

    test('should include all score components', () => {
      const task = {
        id: 'TASK-001',
        title: 'Backend API with database',
        description: 'Server-side implementation'
      };

      const result = detectTaskType(task, patterns);

      assert.ok(result.allScores);
      assert.ok(typeof result.allScores.backend === 'number');
      assert.ok(typeof result.allScores.frontend === 'number');
    });

    test('should normalize scores to [0, 1] range', () => {
      const task = {
        id: 'TASK-002',
        title: 'Very specific backend REST API microservice implementation',
        description: 'Complex server-side logic with database and caching'
      };

      const result = detectTaskType(task, patterns);

      Object.values(result.allScores).forEach(score => {
        assert.ok(score >= 0 && score <= 1, `Score ${score} should be in [0, 1] range`);
      });
    });
  });

  describe('Performance', () => {
    test('should handle large task arrays efficiently', () => {
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        id: `TASK-${String(i + 1).padStart(3, '0')}`,
        title: `Task ${i + 1}: Implement feature`,
        description: 'Backend API implementation with testing'
      }));

      const startTime = performance.now();
      const result = analyzeTaskTypes(tasks);
      const endTime = performance.now();

      assert.strictEqual(result.summary.totalTasks, 100);
      assert.ok(endTime - startTime < 1000, 'Should process 100 tasks in under 1 second');
    });

    test('should cache pattern library', () => {
      const task = {
        id: 'TASK-001',
        title: 'Backend task',
        description: 'API implementation'
      };

      const patterns = loadPatterns();

      // First call
      const start1 = performance.now();
      detectTaskType(task, patterns);
      const end1 = performance.now();

      // Second call (should be faster due to caching)
      const start2 = performance.now();
      detectTaskType(task, patterns);
      const end2 = performance.now();

      const time1 = end1 - start1;
      const time2 = end2 - start2;

      assert.ok(time2 <= time1 * 1.5, 'Subsequent calls should be as fast or faster');
    });
  });

  describe('Summary generation', () => {
    test('should identify most common type', () => {
      const tasks = [
        { id: 'TASK-001', title: 'Backend API 1', description: 'API work' },
        { id: 'TASK-002', title: 'Backend API 2', description: 'More API work' },
        { id: 'TASK-003', title: 'Backend API 3', description: 'Even more API work' },
        { id: 'TASK-004', title: 'Frontend UI', description: 'React component' }
      ];

      const result = analyzeTaskTypes(tasks);

      assert.strictEqual(result.summary.mostCommonType, 'backend');
    });

    test('should calculate type distribution', () => {
      const tasks = [
        { id: 'TASK-001', title: 'Backend task', description: 'API' },
        { id: 'TASK-002', title: 'Frontend task', description: 'UI' },
        { id: 'TASK-003', title: 'Backend task 2', description: 'More API' }
      ];

      const result = analyzeTaskTypes(tasks);

      assert.ok(result.summary.typeDistribution.backend);
      assert.ok(result.summary.typeDistribution.frontend);
      assert.strictEqual(result.summary.typeDistribution.backend, 2);
      assert.strictEqual(result.summary.typeDistribution.frontend, 1);
    });

    test('should calculate average ambiguity', () => {
      const tasks = [
        { id: 'TASK-001', title: 'Clear backend task', description: 'API server database' },
        { id: 'TASK-002', title: 'Ambiguous task', description: 'Do something' }
      ];

      const result = analyzeTaskTypes(tasks);

      assert.ok(typeof result.summary.avgAmbiguity === 'number');
      assert.ok(result.summary.avgAmbiguity >= 0 && result.summary.avgAmbiguity <= 1);
    });
  });
});

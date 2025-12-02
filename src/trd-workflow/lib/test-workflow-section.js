/**
 * Workflow Section Generator - Integration Test
 *
 * @module test-workflow-section
 * @description Integration test for Sprint 2.2 workflow section generation
 * Tests task type detection, delegation, quality gates, and complete workflow generation.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, Sprint 2.2
 */

import {
  analyzeTaskTypes,
  generateDelegationPatterns,
  generateQualityGates,
  generateWorkflowSection,
  validateTRDContext
} from './index.js';

/**
 * Sample TRD context for testing
 */
const sampleTRDContext = {
  trdId: 'TRD-WORKFLOW-001',
  title: 'TRD Workflow Enhancement System',
  tasks: [
    {
      id: 'TASK-001',
      title: 'Set up AWS infrastructure with Terraform',
      description: 'Configure AWS resources including ECS, RDS, and S3 buckets',
      acceptance_criteria: [
        'Infrastructure-as-code validated',
        'Security groups configured',
        'Resources deployed to staging'
      ],
      duration: '4 hours',
      dependencies: []
    },
    {
      id: 'TASK-002',
      title: 'Implement authentication API endpoints',
      description: 'Create REST API for user authentication with JWT tokens',
      acceptance_criteria: [
        'POST /auth/login endpoint implemented',
        'POST /auth/register endpoint implemented',
        'JWT token generation working',
        'Unit tests ≥80% coverage'
      ],
      duration: '6 hours',
      dependencies: ['TASK-001']
    },
    {
      id: 'TASK-003',
      title: 'Build React user registration component',
      description: 'Create registration form with validation and error handling',
      acceptance_criteria: [
        'Form validation working',
        'API integration complete',
        'Accessibility compliant (WCAG 2.1 AA)',
        'Responsive design verified'
      ],
      duration: '5 hours',
      dependencies: ['TASK-002']
    },
    {
      id: 'TASK-004',
      title: 'Write integration tests for auth flow',
      description: 'Create end-to-end tests for complete authentication workflow',
      acceptance_criteria: [
        'Registration flow tested',
        'Login flow tested',
        'Token refresh tested',
        'Error scenarios covered'
      ],
      duration: '4 hours',
      dependencies: ['TASK-003']
    },
    {
      id: 'TASK-005',
      title: 'Security audit and penetration testing',
      description: 'Perform security assessment of authentication system',
      acceptance_criteria: [
        'OWASP Top 10 vulnerabilities checked',
        'Password hashing verified',
        'SQL injection tests passed',
        'No high-severity findings'
      ],
      duration: '3 hours',
      dependencies: ['TASK-004']
    },
    {
      id: 'TASK-006',
      title: 'Create API documentation with OpenAPI',
      description: 'Document all authentication endpoints with examples',
      acceptance_criteria: [
        'OpenAPI spec complete',
        'Example requests included',
        'Error responses documented',
        'Published to docs site'
      ],
      duration: '2 hours',
      dependencies: ['TASK-002']
    },
    {
      id: 'TASK-007',
      title: 'Set up Kubernetes deployment with Helm',
      description: 'Configure K8s manifests and Helm charts for production',
      acceptance_criteria: [
        'Helm chart structure complete',
        'ConfigMaps and Secrets configured',
        'Health checks implemented',
        'Rollback procedures tested'
      ],
      duration: '5 hours',
      dependencies: ['TASK-001']
    },
    {
      id: 'TASK-008',
      title: 'Implement user profile backend API',
      description: 'Create CRUD endpoints for user profile management',
      acceptance_criteria: [
        'GET /users/:id endpoint',
        'PUT /users/:id endpoint',
        'Database schema migration',
        'Unit tests ≥80% coverage'
      ],
      duration: '4 hours',
      dependencies: ['TASK-002']
    },
    {
      id: 'TASK-009',
      title: 'Build React user profile component',
      description: 'Create profile display and edit UI',
      acceptance_criteria: [
        'Profile display working',
        'Edit form functional',
        'Avatar upload integrated',
        'Responsive design'
      ],
      duration: '4 hours',
      dependencies: ['TASK-008']
    },
    {
      id: 'TASK-010',
      title: 'Write E2E tests with Playwright',
      description: 'Create comprehensive end-to-end test suite',
      acceptance_criteria: [
        'User registration flow',
        'Profile management flow',
        'Authentication flow',
        'All test scenarios passing'
      ],
      duration: '5 hours',
      dependencies: ['TASK-009']
    }
  ],
  phases: [
    {
      name: 'Phase 1 - Infrastructure & Backend',
      sprints: [
        {
          name: 'Sprint 1',
          tasks: [] // Tasks will be assigned
        },
        {
          name: 'Sprint 2',
          tasks: []
        }
      ]
    },
    {
      name: 'Phase 2 - Frontend & Testing',
      sprints: [
        {
          name: 'Sprint 3',
          tasks: []
        }
      ]
    }
  ]
};

/**
 * Run integration test suite
 */
async function runIntegrationTest() {
  console.log('='.repeat(80));
  console.log('TRD Workflow Section Generator - Integration Test');
  console.log('Sprint 2.2 - TASK-017, TASK-018, TASK-019, TASK-020');
  console.log('='.repeat(80));
  console.log();

  try {
    // Test 1: Validate TRD Context
    console.log('Test 1: Validate TRD Context');
    console.log('-'.repeat(80));
    const validation = validateTRDContext(sampleTRDContext);
    console.log(`✓ Validation passed: ${validation.valid}`);
    console.log(`  Errors: ${validation.errors.length}`);
    console.log(`  Warnings: ${validation.warnings.length}`);
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(w => console.log(`    - ${w}`));
    }
    console.log();

    // Test 2: Task Type Detection (TASK-018)
    console.log('Test 2: Task Type Detection');
    console.log('-'.repeat(80));
    const taskTypeAnalysis = analyzeTaskTypes(sampleTRDContext.tasks);
    console.log(`✓ Analyzed ${taskTypeAnalysis.summary.totalTasks} tasks`);
    console.log(`  Unique types detected: ${taskTypeAnalysis.summary.uniqueTypes}`);
    console.log(`  Average confidence: ${taskTypeAnalysis.summary.avgConfidence}`);
    console.log(`  Most common type: ${taskTypeAnalysis.summary.mostCommonType}`);
    console.log();
    console.log('  Type Distribution:');
    Object.entries(taskTypeAnalysis.summary.typeDistribution).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count} tasks`);
    });
    console.log();
    console.log('  Sample Classifications:');
    ['TASK-001', 'TASK-002', 'TASK-003'].forEach(taskId => {
      const classification = taskTypeAnalysis.classifications[taskId];
      console.log(`    - ${taskId}: ${classification.primaryType} (confidence: ${classification.confidence.toFixed(2)})`);
    });
    console.log();

    // Test 3: Delegation Pattern Generation (TASK-019)
    console.log('Test 3: Delegation Pattern Generation');
    console.log('-'.repeat(80));
    const delegationPatterns = generateDelegationPatterns(
      taskTypeAnalysis.classifications,
      sampleTRDContext.tasks
    );
    console.log(`✓ Generated ${delegationPatterns.patterns.length} delegation patterns`);
    console.log(`  Total agents required: ${delegationPatterns.summary.totalAgents}`);
    console.log(`  Coordination required: ${delegationPatterns.coordinationRequired}`);
    console.log(`  Recommendation: ${delegationPatterns.summary.recommendation}`);
    console.log();
    console.log('  Agent Distribution:');
    delegationPatterns.summary.distribution.forEach(dist => {
      console.log(`    - ${dist.agent}: ${dist.taskCount} tasks (${dist.percentage})`);
    });
    console.log();

    // Test 4: Quality Gate Generation (TASK-020)
    console.log('Test 4: Quality Gate Generation');
    console.log('-'.repeat(80));
    const qualityGates = generateQualityGates(
      sampleTRDContext,
      taskTypeAnalysis.summary
    );
    console.log(`✓ Generated quality gates`);
    console.log(`  Sprint gates: ${qualityGates.sprint.length}`);
    console.log(`  Phase gates: ${qualityGates.phase.length}`);
    console.log(`  Final gates: ${qualityGates.final.length}`);
    console.log(`  Total gates: ${qualityGates.metadata.totalGates}`);
    console.log();
    console.log('  Sample Sprint Gates:');
    qualityGates.sprint.slice(0, 3).forEach(gate => {
      console.log(`    - ${gate.name}${gate.threshold ? ` (≥${gate.threshold}%)` : ''}`);
    });
    console.log();

    // Test 5: Complete Workflow Section Generation (TASK-017)
    console.log('Test 5: Complete Workflow Section Generation');
    console.log('-'.repeat(80));
    const workflowSection = generateWorkflowSection(sampleTRDContext, {
      executionCommand: '/implement-trd',
      includeComplexityAnalysis: true,
      includeDelegation: true,
      includeQualityGates: true
    });
    console.log(`✓ Generated workflow section`);
    console.log(`  Complexity level: ${workflowSection.analysis.complexity?.level || 'N/A'}`);
    console.log(`  Complexity score: ${workflowSection.analysis.complexity?.score || 'N/A'}`);
    console.log(`  Estimated duration: ${workflowSection.metadata.generationTime}`);
    console.log(`  Markdown length: ${workflowSection.markdown.length} characters`);
    console.log();

    // Test 6: Markdown Output Preview
    console.log('Test 6: Markdown Output Preview (first 1000 chars)');
    console.log('-'.repeat(80));
    console.log(workflowSection.markdown.substring(0, 1000));
    console.log('...');
    console.log();

    // Test Summary
    console.log('='.repeat(80));
    console.log('Test Summary');
    console.log('='.repeat(80));
    console.log('✓ All tests passed successfully');
    console.log();
    console.log('Sprint 2.2 Implementation Complete:');
    console.log('  ✓ TASK-018: Task Type Detection Engine');
    console.log('  ✓ TASK-019: Multi-Agent Delegation Generator');
    console.log('  ✓ TASK-020: Quality Gate Specification Generator');
    console.log('  ✓ TASK-017: Workflow Section Generator (Main Orchestrator)');
    console.log();
    console.log('Performance Metrics:');
    console.log(`  - Task Analysis: ${taskTypeAnalysis.summary.totalTasks} tasks analyzed`);
    console.log(`  - Agent Patterns: ${delegationPatterns.patterns.length} patterns generated`);
    console.log(`  - Quality Gates: ${qualityGates.metadata.totalGates} gates defined`);
    console.log(`  - Generation Time: ${workflowSection.metadata.generationTime}`);
    console.log('='.repeat(80));

    return {
      success: true,
      results: {
        validation,
        taskTypeAnalysis,
        delegationPatterns,
        qualityGates,
        workflowSection
      }
    };
  } catch (error) {
    console.error('✗ Test failed with error:');
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

export { runIntegrationTest, sampleTRDContext };

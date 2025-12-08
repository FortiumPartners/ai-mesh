/**
 * Integration Test for Sprint 2.3 - PRD Metadata & Configuration
 *
 * @description Test PRD metadata parsing, configuration validation,
 * override application, and PR task generation.
 */

import {
  parsePrdMetadata,
  extractWorkflowConfig,
  hasFrontmatter,
  getWorkflowConfig,
  validateWorkflowConfig,
  validatePrdMetadata,
  getValidationHelp,
  applyConfigOverrides,
  getOverrideSummary,
  validateOverrides,
  createOverrideReport,
  generatePrTask,
  injectPrTask
} from './index.js';

/**
 * Sample PRD content with YAML frontmatter
 */
const SAMPLE_PRD = `---
title: "TRD Workflow Enhancement System"
version: "1.0.0"
status: "approved"
priority: "high"
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 80
          required: true
    phase:
      enabled: true
      gates:
        - name: Integration Test Coverage
          type: integration_test
          threshold: 70
          required: true
    final:
      enabled: true
      gates:
        - name: Full Test Suite
          type: test_coverage
          threshold: 85
          required: true
        - name: Security Audit
          type: security_scan
          required: true
  git_workflow:
    branch_naming:
      pattern: feature/{trd-id}-{description}
      description_format: kebab-case
      max_length: 50
    commit_conventions:
      format: conventional
      include_task_ids: true
      include_trd_reference: true
---

# TRD Workflow Enhancement System

Implementation details...
`;

/**
 * Sample TRD context for testing
 */
const SAMPLE_TRD_CONTEXT = {
  trdId: 'TRD-WORKFLOW-001',
  title: 'TRD Workflow Enhancement System',
  tasks: [
    { id: 'TASK-001', type: 'implementation', title: 'Task 1' },
    { id: 'TASK-002', type: 'implementation', title: 'Task 2' },
    { id: 'TASK-003', type: 'testing', title: 'Task 3' }
  ],
  phases: [
    {
      name: 'Phase 1',
      sprints: [
        {
          name: 'Sprint 1',
          tasks: [
            { id: 'TASK-001', type: 'implementation', title: 'Task 1' },
            { id: 'TASK-002', type: 'implementation', title: 'Task 2' }
          ]
        },
        {
          name: 'Sprint 2',
          tasks: [
            { id: 'TASK-003', type: 'testing', title: 'Task 3' }
          ]
        }
      ]
    }
  ]
};

/**
 * Test 1: PRD Metadata Parsing (TASK-022)
 */
function testPrdMetadataParsing() {
  console.log('\n=== Test 1: PRD Metadata Parsing (TASK-022) ===\n');

  // Test 1a: Detect frontmatter
  console.log('--- Frontmatter Detection ---');
  const hasYaml = hasFrontmatter(SAMPLE_PRD);
  console.log(`Has YAML frontmatter: ${hasYaml}`);

  if (!hasYaml) {
    throw new Error('Failed to detect YAML frontmatter');
  }

  // Test 1b: Parse metadata
  console.log('\n--- Parse Metadata ---');
  const metadata = parsePrdMetadata(SAMPLE_PRD);

  console.log(`Has custom config: ${metadata.hasCustomConfig}`);
  console.log(`Title: ${metadata.metadata.title}`);
  console.log(`Version: ${metadata.metadata.version}`);
  console.log(`Status: ${metadata.metadata.status}`);
  console.log(`Priority: ${metadata.metadata.priority}`);

  // Test 1c: Extract workflow config
  console.log('\n--- Extract Workflow Config ---');
  const workflowConfig = extractWorkflowConfig(metadata);

  console.log(`Checkpoint Frequency: ${workflowConfig.checkpoint_frequency}`);
  console.log(`Execution Command: ${workflowConfig.execution_command}`);
  console.log(`Sprint Gates: ${workflowConfig.quality_gates.sprint.gates.length}`);
  console.log(`Phase Gates: ${workflowConfig.quality_gates.phase.gates.length}`);
  console.log(`Final Gates: ${workflowConfig.quality_gates.final.gates.length}`);

  // Test 1d: Get workflow config with error handling
  console.log('\n--- Get Workflow Config (Safe) ---');
  const result = getWorkflowConfig(SAMPLE_PRD);

  console.log(`Success: ${result.success}`);
  console.log(`Has Custom Config: ${result.hasCustomConfig}`);

  if (!result.success) {
    throw new Error('Failed to get workflow config');
  }

  return { metadata, workflowConfig, result };
}

/**
 * Test 2: Configuration Validation (TASK-023)
 */
function testConfigurationValidation() {
  console.log('\n\n=== Test 2: Configuration Validation (TASK-023) ===\n');

  const metadata = parsePrdMetadata(SAMPLE_PRD);
  const workflowConfig = extractWorkflowConfig(metadata);

  // Test 2a: Validate workflow config
  console.log('--- Validate Workflow Config ---');
  const validation = validateWorkflowConfig(workflowConfig);

  console.log(`Valid: ${validation.valid}`);
  console.log(`Errors: ${validation.errors.length}`);
  console.log(`Warnings: ${validation.warnings.length}`);

  if (validation.errors.length > 0) {
    console.log('Errors:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
  }

  // Test 2b: Validate complete PRD metadata
  console.log('\n--- Validate PRD Metadata ---');
  const prdValidation = validatePrdMetadata(metadata);

  console.log(`Valid: ${prdValidation.valid}`);
  console.log(`Errors: ${prdValidation.errors.length}`);
  console.log(`Warnings: ${prdValidation.warnings.length}`);

  // Test 2c: Test invalid config
  console.log('\n--- Test Invalid Config ---');
  const invalidConfig = {
    checkpoint_frequency: -5, // Invalid: should be >= 1
    execution_command: '/invalid-command', // Warning: non-standard
    quality_gates: {
      sprint: {
        enabled: true,
        gates: [
          {
            name: 'Test',
            type: 'test_coverage',
            threshold: 150 // Invalid: should be <= 100
          }
        ]
      }
    }
  };

  const invalidValidation = validateWorkflowConfig(invalidConfig);

  console.log(`Valid: ${invalidValidation.valid}`);
  console.log(`Errors: ${invalidValidation.errors.length}`);
  console.log(`Warnings: ${invalidValidation.warnings.length}`);

  if (invalidValidation.errors.length > 0) {
    console.log('\nValidation Help:');
    console.log(getValidationHelp(invalidValidation));
  }

  return { validation, prdValidation, invalidValidation };
}

/**
 * Test 3: Configuration Override Application (TASK-024)
 */
function testConfigurationOverrides() {
  console.log('\n\n=== Test 3: Configuration Override Application (TASK-024) ===\n');

  const metadata = parsePrdMetadata(SAMPLE_PRD);
  const workflowConfig = extractWorkflowConfig(metadata);

  // Test 3a: Apply overrides to TRD context
  console.log('--- Apply Configuration Overrides ---');
  const enhanced = applyConfigOverrides(SAMPLE_TRD_CONTEXT, workflowConfig);

  console.log(`Checkpoint Frequency: ${enhanced.checkpoint_frequency}`);
  console.log(`Execution Command: ${enhanced.execution_command}`);
  console.log(`Quality Gates Present: ${!!enhanced.quality_gates}`);
  console.log(`Git Workflow Present: ${!!enhanced.git_workflow}`);

  // Test 3b: Get override summary
  console.log('\n--- Override Summary ---');
  const summary = getOverrideSummary(enhanced);

  console.log(`Overrides Applied: ${summary.count}`);
  console.log(`Source: ${summary.source}`);

  summary.overrides.forEach(override => {
    console.log(`  • ${override.setting}: ${override.applied ? 'applied' : 'not applied'}`);
  });

  // Test 3c: Validate overrides
  console.log('\n--- Validate Overrides ---');
  const overrideValidation = validateOverrides(enhanced, workflowConfig);

  console.log(`Valid: ${overrideValidation.valid}`);
  console.log(`Errors: ${overrideValidation.errors.length}`);
  console.log(`Warnings: ${overrideValidation.warnings.length}`);

  // Test 3d: Create override report
  console.log('\n--- Override Report ---');
  const report = createOverrideReport(enhanced);
  console.log(report);

  return { enhanced, summary, overrideValidation };
}

/**
 * Test 4: PR Task Generation (TASK-025)
 */
function testPrTaskGeneration() {
  console.log('\n\n=== Test 4: PR Task Generation (TASK-025) ===\n');

  // Test 4a: Generate PR task
  console.log('--- Generate PR Task ---');
  const prTask = generatePrTask(SAMPLE_TRD_CONTEXT, {
    scope: 'trd-workflow',
    includeCheckpointReferences: true
  });

  console.log(`Task ID: ${prTask.id}`);
  console.log(`Type: ${prTask.type}`);
  console.log(`Title: ${prTask.title}`);
  console.log(`Duration: ${prTask.duration}`);
  console.log(`Priority: ${prTask.priority}`);
  console.log(`Dependencies: ${prTask.dependencies.length} tasks`);
  console.log(`Acceptance Criteria: ${prTask.acceptance_criteria.length} items`);

  // Test 4b: Examine PR metadata
  console.log('\n--- PR Metadata ---');
  console.log(`PR Title Template: ${prTask.pr_metadata.title_template}`);
  console.log(`Scope: ${prTask.pr_metadata.scope}`);
  console.log(`Labels: ${prTask.pr_metadata.labels.join(', ')}`);
  console.log(`Checklist Items: ${prTask.pr_metadata.checklist.length}`);

  console.log('\nFirst 5 Checklist Items:');
  prTask.pr_metadata.checklist.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. ${item}`);
  });

  // Test 4c: Inject PR task into task breakdown
  console.log('\n--- Inject PR Task ---');
  const taskBreakdown = { ...SAMPLE_TRD_CONTEXT };

  const enhanced = injectPrTask(taskBreakdown, prTask);

  console.log(`PR Task Location:`);
  console.log(`  Phase: ${enhanced.location.phase}`);
  console.log(`  Sprint: ${enhanced.location.sprint}`);
  console.log(`  Task Index: ${enhanced.location.taskIndex}`);

  // Verify injection
  const finalPhase = enhanced.taskBreakdown.phases[enhanced.taskBreakdown.phases.length - 1];
  const finalSprint = finalPhase.sprints[finalPhase.sprints.length - 1];
  const injectedTask = finalSprint.tasks[finalSprint.tasks.length - 1];

  console.log(`\nInjected Task ID: ${injectedTask.id}`);
  console.log(`Injected Task Type: ${injectedTask.type}`);

  if (injectedTask.id !== prTask.id) {
    throw new Error('PR task injection failed: task ID mismatch');
  }

  // Test 4d: PR description template preview
  console.log('\n--- PR Description Template (Preview) ---');
  const descriptionLines = prTask.pr_metadata.description_template.split('\n');
  console.log(descriptionLines.slice(0, 15).join('\n'));
  console.log(`... (${descriptionLines.length} total lines)`);

  return { prTask, enhanced };
}

/**
 * Test 5: End-to-End Integration
 */
function testEndToEndIntegration() {
  console.log('\n\n=== Test 5: End-to-End Integration ===\n');

  console.log('--- Complete Workflow ---');
  console.log('1. Parse PRD metadata');
  const metadata = parsePrdMetadata(SAMPLE_PRD);
  console.log('   ✓ Metadata parsed');

  console.log('2. Extract workflow config');
  const workflowConfig = extractWorkflowConfig(metadata);
  console.log('   ✓ Config extracted');

  console.log('3. Validate configuration');
  const validation = validateWorkflowConfig(workflowConfig);
  if (!validation.valid) {
    throw new Error('Configuration validation failed');
  }
  console.log('   ✓ Config validated');

  console.log('4. Apply overrides to TRD context');
  const enhanced = applyConfigOverrides(SAMPLE_TRD_CONTEXT, workflowConfig);
  console.log('   ✓ Overrides applied');

  console.log('5. Validate override application');
  const overrideValidation = validateOverrides(enhanced, workflowConfig);
  if (!overrideValidation.valid) {
    throw new Error('Override validation failed');
  }
  console.log('   ✓ Overrides validated');

  console.log('6. Generate PR task');
  const prTask = generatePrTask(enhanced);
  console.log('   ✓ PR task generated');

  console.log('7. Inject PR task into breakdown');
  const taskBreakdown = { ...enhanced };
  const final = injectPrTask(taskBreakdown, prTask);
  console.log('   ✓ PR task injected');

  console.log('\n--- Final Summary ---');
  console.log(`Configuration Valid: ${validation.valid}`);
  console.log(`Overrides Applied: ${getOverrideSummary(enhanced).count}`);
  console.log(`PR Task ID: ${prTask.id}`);
  console.log(`Total Tasks in Final Sprint: ${final.taskBreakdown.phases[0].sprints[1].tasks.length}`);

  return { validation, enhanced, prTask, final };
}

/**
 * Run all Sprint 2.3 tests
 */
function runAllTests() {
  console.log('========================================');
  console.log('Sprint 2.3 Integration Tests');
  console.log('PRD Metadata & Configuration');
  console.log('========================================');

  try {
    const test1 = testPrdMetadataParsing();
    const test2 = testConfigurationValidation();
    const test3 = testConfigurationOverrides();
    const test4 = testPrTaskGeneration();
    const test5 = testEndToEndIntegration();

    console.log('\n\n========================================');
    console.log('All Sprint 2.3 Tests Completed! ✓');
    console.log('========================================');
    console.log('\nTasks Completed:');
    console.log('  ✓ TASK-022: PRD Metadata Parser');
    console.log('  ✓ TASK-023: Configuration Validator');
    console.log('  ✓ TASK-024: Configuration Override Applier');
    console.log('  ✓ TASK-025: PR Task Generator');
    console.log('\nPhase 2 Complete - Ready for Phase 3!');
    console.log('========================================\n');

    return {
      success: true,
      results: {
        test1,
        test2,
        test3,
        test4,
        test5
      }
    };
  } catch (error) {
    console.error('\n\n========================================');
    console.error('Test Failed! ✗');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runAllTests();
  process.exit(result.success ? 0 : 1);
}

export {
  runAllTests,
  testPrdMetadataParsing,
  testConfigurationValidation,
  testConfigurationOverrides,
  testPrTaskGeneration,
  testEndToEndIntegration
};

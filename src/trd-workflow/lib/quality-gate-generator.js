/**
 * Quality Gate Specification Generator - Production Implementation
 *
 * @module quality-gate-generator
 * @description Production implementation of quality gate generation
 * Generates sprint, phase, and final quality gate specifications.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-020
 */

/**
 * Quality gate levels with default configurations
 */
const GATE_LEVELS = {
  sprint: {
    name: 'Sprint Quality Gate',
    timing: 'After each sprint completion',
    severity: 'required'
  },
  phase: {
    name: 'Phase Quality Gate',
    timing: 'After each phase completion',
    severity: 'required'
  },
  final: {
    name: 'Final Quality Gate',
    timing: 'Before PR merge',
    severity: 'critical'
  }
};

/**
 * Task type specific quality requirements
 */
const TYPE_SPECIFIC_GATES = {
  infrastructure: {
    sprint: ['Infrastructure-as-code validation', 'Security scanning complete'],
    phase: ['Deployment testing verified', 'Resource limits configured'],
    final: ['Production deployment tested', 'Monitoring configured']
  },
  security: {
    sprint: ['Security audit complete', 'No high-severity vulnerabilities'],
    phase: ['Penetration testing passed', 'Compliance requirements met'],
    final: ['Security documentation updated', 'Incident response procedures documented']
  },
  frontend: {
    sprint: ['UI components tested', 'Accessibility checks passed'],
    phase: ['Cross-browser testing complete', 'Responsive design verified'],
    final: ['Performance budget met', 'WCAG 2.1 AA compliance verified']
  },
  backend: {
    sprint: ['API endpoints tested', 'Database migrations verified'],
    phase: ['Integration tests passing', 'API documentation updated'],
    final: ['Load testing complete', 'Error handling verified']
  },
  testing: {
    sprint: ['Test suite passing', 'Coverage targets met'],
    phase: ['Test documentation complete', 'CI integration verified'],
    final: ['All test scenarios covered', 'Test maintenance plan documented']
  },
  documentation: {
    sprint: ['Technical accuracy verified', 'Examples tested'],
    phase: ['Documentation structure complete', 'Cross-references validated'],
    final: ['Documentation published', 'User feedback incorporated']
  }
};

/**
 * Generate quality gate specifications for TRD
 *
 * @param {Object} trdContext - TRD context with tasks, phases, sprints
 * @param {Object} taskTypeSummary - Task type analysis summary
 * @param {Object} [options={}] - Generation options
 * @param {boolean} [options.includeTypeSpecific=true] - Include task-type-specific gates
 * @param {boolean} [options.includePerformance=true] - Include performance gates
 * @param {boolean} [options.includeSecurity=true] - Include security gates
 * @returns {Object} Quality gate specifications
 *
 * @example
 * const gates = generateQualityGates(trdContext, taskTypeSummary);
 * // => {
 * //   sprint: [...],
 * //   phase: [...],
 * //   final: [...]
 * // }
 */
export function generateQualityGates(trdContext, taskTypeSummary, options = {}) {
  const {
    includeTypeSpecific = true,
    includePerformance = true,
    includeSecurity = true
  } = options;

  const gates = {
    sprint: generateSprintGates(trdContext, taskTypeSummary, options),
    phase: generatePhaseGates(trdContext, taskTypeSummary, options),
    final: generateFinalGates(trdContext, taskTypeSummary, options)
  };

  // Add metadata
  gates.metadata = {
    generatedAt: new Date().toISOString(),
    totalGates: gates.sprint.length + gates.phase.length + gates.final.length,
    includeTypeSpecific,
    includePerformance,
    includeSecurity
  };

  return gates;
}

/**
 * Generate sprint-level quality gates
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} taskTypeSummary - Task type summary
 * @param {Object} options - Generation options
 * @returns {Object[]} Sprint quality gates
 * @private
 */
function generateSprintGates(trdContext, taskTypeSummary, options) {
  const gates = [];

  // Core sprint gates (always included)
  gates.push({
    name: 'Unit Tests Passing',
    description: 'All unit tests for completed tasks pass',
    type: 'test_coverage',
    threshold: 80,
    required: true,
    automated: true,
    validation: 'Run test suite and verify coverage meets threshold'
  });

  gates.push({
    name: 'Git Checkpoint Created',
    description: 'Incremental commit created with conventional commit format',
    type: 'git_workflow',
    required: true,
    automated: false,
    validation: 'Verify commit follows template and references TRD ID'
  });

  gates.push({
    name: 'Code Linting Passed',
    description: 'No linting errors or warnings in completed code',
    type: 'code_quality',
    required: true,
    automated: true,
    validation: 'Run linter and verify zero errors'
  });

  // Add type-specific gates if enabled
  if (options.includeTypeSpecific) {
    const typeSpecificGates = getTypeSpecificGates(
      taskTypeSummary,
      'sprint'
    );
    gates.push(...typeSpecificGates);
  }

  return gates;
}

/**
 * Generate phase-level quality gates
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} taskTypeSummary - Task type summary
 * @param {Object} options - Generation options
 * @returns {Object[]} Phase quality gates
 * @private
 */
function generatePhaseGates(trdContext, taskTypeSummary, options) {
  const gates = [];

  // Core phase gates
  gates.push({
    name: 'Integration Tests Passing',
    description: 'All integration tests for phase components pass',
    type: 'integration_test',
    threshold: 70,
    required: true,
    automated: true,
    validation: 'Run integration test suite and verify coverage'
  });

  gates.push({
    name: 'Code Review Complete',
    description: 'Code review completed with all feedback addressed',
    type: 'code_review',
    required: true,
    automated: false,
    validation: 'Verify PR review approved by code-reviewer agent'
  });

  // Security gate if enabled
  if (options.includeSecurity) {
    gates.push({
      name: 'Security Scan Clean',
      description: 'No high or critical severity vulnerabilities detected',
      type: 'security',
      required: true,
      automated: true,
      validation: 'Run security scanner and verify no critical findings'
    });
  }

  // Performance gate if enabled
  if (options.includePerformance) {
    gates.push({
      name: 'Performance Benchmarks Met',
      description: 'Phase implementation meets performance requirements',
      type: 'performance',
      required: false,
      automated: true,
      validation: 'Run performance tests and verify against baselines'
    });
  }

  // Add type-specific gates
  if (options.includeTypeSpecific) {
    const typeSpecificGates = getTypeSpecificGates(
      taskTypeSummary,
      'phase'
    );
    gates.push(...typeSpecificGates);
  }

  return gates;
}

/**
 * Generate final quality gates
 *
 * @param {Object} trdContext - TRD context
 * @param {Object} taskTypeSummary - Task type summary
 * @param {Object} options - Generation options
 * @returns {Object[]} Final quality gates
 * @private
 */
function generateFinalGates(trdContext, taskTypeSummary, options) {
  const gates = [];

  // Critical final gates
  gates.push({
    name: 'Complete Test Suite Passing',
    description: 'All tests (unit, integration, E2E) pass successfully',
    type: 'test_coverage',
    threshold: 85,
    required: true,
    automated: true,
    validation: 'Run complete test suite and verify coverage thresholds'
  });

  gates.push({
    name: 'Documentation Updated',
    description: 'All relevant documentation updated and reviewed',
    type: 'documentation',
    required: true,
    automated: false,
    validation: 'Verify README, API docs, and CHANGELOG updated'
  });

  gates.push({
    name: 'All Tasks Complete',
    description: 'All TRD tasks marked complete with checkboxes',
    type: 'task_completion',
    threshold: 100,
    required: true,
    automated: false,
    validation: 'Verify all task checkboxes marked in TRD document'
  });

  // Security gates
  if (options.includeSecurity) {
    gates.push({
      name: 'Security Review Passed',
      description: 'Final security review with no outstanding issues',
      type: 'security',
      required: true,
      automated: false,
      validation: 'Code-reviewer agent security validation complete'
    });

    gates.push({
      name: 'Dependency Audit Clean',
      description: 'No known vulnerabilities in dependencies',
      type: 'security',
      required: true,
      automated: true,
      validation: 'Run dependency audit and verify clean report'
    });
  }

  // Performance gates
  if (options.includePerformance) {
    gates.push({
      name: 'Production Performance Validated',
      description: 'Performance meets production requirements',
      type: 'performance',
      required: true,
      automated: true,
      validation: 'Run production-like load tests and verify metrics'
    });
  }

  // Add type-specific final gates
  if (options.includeTypeSpecific) {
    const typeSpecificGates = getTypeSpecificGates(
      taskTypeSummary,
      'final'
    );
    gates.push(...typeSpecificGates);
  }

  return gates;
}

/**
 * Get type-specific quality gates
 *
 * @param {Object} taskTypeSummary - Task type summary
 * @param {string} level - Gate level (sprint, phase, final)
 * @returns {Object[]} Type-specific quality gates
 * @private
 */
function getTypeSpecificGates(taskTypeSummary, level) {
  const gates = [];
  const typeDistribution = taskTypeSummary.typeDistribution || {};

  // Get dominant task types (>20% of tasks)
  const totalTasks = taskTypeSummary.totalTasks || 1;
  const dominantTypes = Object.entries(typeDistribution)
    .filter(([type, count]) => (count / totalTasks) > 0.2)
    .map(([type]) => type);

  dominantTypes.forEach(type => {
    const typeGates = TYPE_SPECIFIC_GATES[type]?.[level] || [];
    typeGates.forEach(gateName => {
      gates.push({
        name: gateName,
        description: `${type}-specific quality requirement`,
        type: `type_specific_${type}`,
        required: true,
        automated: false,
        validation: `Verify ${type} quality standards met`
      });
    });
  });

  return gates;
}

/**
 * Format quality gates as markdown checklist
 *
 * @param {Object[]} gates - Array of quality gate objects
 * @param {string} level - Gate level name
 * @returns {string} Markdown checklist
 *
 * @example
 * const markdown = formatQualityGateChecklist(gates, 'Sprint Gates');
 * // => "### Sprint Gates\n- [ ] Unit Tests Passing (≥80%)..."
 */
export function formatQualityGateChecklist(gates, level) {
  if (!gates || gates.length === 0) {
    return `### ${level}\n\nNo quality gates defined.`;
  }

  let markdown = `### ${level}\n\n`;

  gates.forEach(gate => {
    const threshold = gate.threshold ? ` (≥${gate.threshold}%)` : '';
    const required = gate.required ? ' [REQUIRED]' : ' [OPTIONAL]';
    markdown += `- [ ] **${gate.name}**${threshold}${required}\n`;
    markdown += `  - ${gate.description}\n`;
    if (gate.validation) {
      markdown += `  - *Validation*: ${gate.validation}\n`;
    }
  });

  return markdown;
}

/**
 * Format all quality gates as complete markdown section
 *
 * @param {Object} gates - Quality gates object with sprint, phase, final
 * @returns {string} Complete markdown section
 *
 * @example
 * const markdown = formatQualityGatesSection(gates);
 * // => "## Quality Gates\n\n### Sprint Quality Gates..."
 */
export function formatQualityGatesSection(gates) {
  let markdown = '## Quality Gates\n\n';

  markdown += formatQualityGateChecklist(gates.sprint, 'Sprint Quality Gates');
  markdown += '\n';
  markdown += formatQualityGateChecklist(gates.phase, 'Phase Quality Gates');
  markdown += '\n';
  markdown += formatQualityGateChecklist(gates.final, 'Final Quality Gates');

  if (gates.metadata) {
    markdown += '\n---\n\n';
    markdown += `*Quality gates generated: ${new Date(gates.metadata.generatedAt).toLocaleString()}*\n`;
    markdown += `*Total gates: ${gates.metadata.totalGates}*\n`;
  }

  return markdown;
}

/**
 * Validate quality gate completion
 *
 * @param {Object[]} gates - Array of quality gates
 * @param {Object} completionStatus - Completion status for each gate
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateGateCompletion(gates, { 'Unit Tests Passing': true, ... });
 * // => { passed: true, failed: [], warnings: [] }
 */
export function validateGateCompletion(gates, completionStatus) {
  const failed = [];
  const warnings = [];
  let passed = true;

  gates.forEach(gate => {
    const isComplete = completionStatus[gate.name] === true;

    if (!isComplete && gate.required) {
      failed.push({
        name: gate.name,
        reason: 'Required gate not completed'
      });
      passed = false;
    } else if (!isComplete && !gate.required) {
      warnings.push({
        name: gate.name,
        reason: 'Optional gate not completed'
      });
    }
  });

  return {
    passed,
    failed,
    warnings,
    completionRate: gates.length > 0
      ? (Object.values(completionStatus).filter(Boolean).length / gates.length) * 100
      : 0
  };
}

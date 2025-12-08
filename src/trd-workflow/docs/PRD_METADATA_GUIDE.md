# PRD Metadata Configuration Guide

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001

---

## Overview

This guide provides comprehensive documentation for configuring PRD frontmatter metadata to customize TRD workflow injection behavior. PRD metadata allows you to control git checkpoint frequency, quality gates, execution commands, and multi-agent delegation patterns on a per-project basis.

### What is PRD Frontmatter?

PRD frontmatter is YAML metadata placed at the beginning of your PRD file, enclosed by `---` delimiters. It's non-intrusive, human-readable, and follows industry standards used by Jekyll, Hugo, and many documentation systems.

**Basic Example:**

```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
---

# Product Requirements Document: Authentication System
...
```

---

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Schema](#configuration-schema)
- [Checkpoint Frequency](#checkpoint-frequency)
- [Quality Gates](#quality-gates)
- [Git Workflow](#git-workflow)
- [Multi-Agent Delegation](#multi-agent-delegation)
- [Performance Settings](#performance-settings)
- [Complete Examples](#complete-examples)
- [Validation](#validation)

---

## Quick Start

### Minimal Configuration

For most projects, a minimal configuration is sufficient:

```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
---
```

This enables:
- Automatic git checkpoints after each sprint
- Standard `/implement-trd` execution command
- Default quality gates (80% test coverage, security scan)
- Automatic delegation for complex TRDs

### Recommended Configuration

For production projects, include quality gates:

```yaml
---
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

        - name: Security Scan
          type: security_scan
          required: true

    final:
      enabled: true
      gates:
        - name: Full Test Suite
          type: test_coverage
          threshold: 85
          required: true

        - name: E2E Tests
          type: e2e_test
          required: true

metadata:
  version: 1.0.0
  priority: high
---
```

### Advanced Configuration

For complex multi-agent projects:

```yaml
---
workflow:
  checkpoint_frequency: phase
  execution_command: /orchestrate-tasks

  quality_gates:
    [See Complete Examples]

  git_workflow:
    branch_naming:
      pattern: "feature/{trd-id}-{description}"
      max_length: 50

    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
      checkpoint_after_phase: true

  delegation:
    enable_auto_delegation: true
    patterns:
      - task_type: frontend
        keywords: [UI, component, React]
        agent: frontend-developer

      - task_type: backend
        keywords: [API, database, service]
        agent: backend-developer

metadata:
  version: 1.0.0
  team: Platform Engineering
  priority: critical
---
```

---

## Configuration Schema

### Top-Level Structure

```yaml
---
workflow:           # Workflow configuration (required)
  [workflow settings]

metadata:           # General metadata (optional)
  [metadata settings]
---
```

### Workflow Configuration Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `checkpoint_frequency` | string/number | No | `"sprint"` | When to inject git checkpoints |
| `execution_command` | string | No | `"/implement-trd"` | Recommended implementation command |
| `quality_gates` | object | No | Default gates | Quality gate configurations |
| `git_workflow` | object | No | Default settings | Git configuration (branch, commits) |
| `delegation` | object | No | Auto-enabled for complex TRDs | Multi-agent delegation patterns |
| `performance` | object | No | Default limits | Performance and timeout settings |

### Metadata Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | string | No | Document version (semver) |
| `author` | string | No | Document author/team |
| `team` | string | No | Responsible team |
| `priority` | string | No | Priority level (low, medium, high, critical) |
| `status` | string | No | Document status (draft, review, approved) |
| `tags` | array | No | Searchable tags |

---

## Checkpoint Frequency

### Overview

Controls when git checkpoint tasks are automatically injected into the TRD.

### Configuration Property

```yaml
workflow:
  checkpoint_frequency: <value>
```

### Valid Values

#### 1. Sprint-Based (Default)

```yaml
checkpoint_frequency: sprint
```

**Behavior:**
- Checkpoint task added after each sprint
- Typical frequency: Every 5-10 tasks
- Recommended for: Most projects with Agile/Scrum methodology

**Generated Checkpoints:**
```markdown
Sprint 1:
- [ ] TASK-1.5: Implementation task
...
- [ ] TASK-1.8: Git checkpoint - Sprint 1 complete

Sprint 2:
- [ ] TASK-2.1: Implementation task
...
- [ ] TASK-2.7: Git checkpoint - Sprint 2 complete
```

#### 2. Phase-Based

```yaml
checkpoint_frequency: phase
```

**Behavior:**
- Checkpoint task added after each phase
- Typical frequency: Every 15-30 tasks
- Recommended for: Large projects with major milestones

**Generated Checkpoints:**
```markdown
Phase 1: Foundation (3 sprints)
Sprint 1.1:
...
Sprint 1.3:
- [ ] TASK-1.24: Implementation task
- [ ] TASK-1.25: Git checkpoint - Phase 1 complete

Phase 2: Implementation (2 sprints)
...
- [ ] TASK-2.15: Git checkpoint - Phase 2 complete
```

#### 3. Task-Based (Custom Frequency)

```yaml
checkpoint_frequency: 5  # Every 5 tasks
```

**Behavior:**
- Checkpoint task added every N tasks
- Frequency independent of sprint/phase structure
- Recommended for: Custom workflow requirements

**Generated Checkpoints:**
```markdown
- [ ] TASK-001: Implementation task
- [ ] TASK-002: Implementation task
...
- [ ] TASK-005: Git checkpoint - Tasks 1-5 complete
- [ ] TASK-006: Implementation task
...
- [ ] TASK-010: Git checkpoint - Tasks 6-10 complete
```

#### 4. Manual (No Automatic Checkpoints)

```yaml
checkpoint_frequency: manual
```

**Behavior:**
- No automatic checkpoint tasks
- Workflow section still generated
- Recommended for: Experienced developers, prototype work

**Generated Output:**
```markdown
## Implementation Workflow

**Note**: Manual checkpoint strategy enabled. Create git commits at your discretion.
```

### Decision Matrix

| Project Characteristics | Recommended Frequency | Rationale |
|------------------------|----------------------|-----------|
| Small projects (<20 tasks) | `sprint` | Balanced commit frequency |
| Large projects (20-50 tasks) | `sprint` or `phase` | Phase for major milestones |
| Very large projects (50+ tasks) | `phase` | Fewer, substantial commits |
| Fine-grained control needed | `5` (or custom number) | Predictable intervals |
| Experienced team with strong git discipline | `manual` | Full autonomy |
| Prototype/exploratory work | `manual` | Flexibility over structure |

### Examples

**Example 1: E-commerce checkout flow (15 tasks)**
```yaml
workflow:
  checkpoint_frequency: sprint  # 2 checkpoints (after Sprint 1 and Sprint 2)
```

**Example 2: Multi-tenant SaaS platform (64 tasks)**
```yaml
workflow:
  checkpoint_frequency: phase  # 4 checkpoints (after each major phase)
```

**Example 3: Microservice migration (35 tasks)**
```yaml
checkpoint_frequency: 10  # 3-4 checkpoints (every 10 tasks)
```

---

## Quality Gates

### Overview

Quality gates define validation requirements at different checkpoints (sprint, phase, final). They ensure code quality, security, and testing standards are met before proceeding.

### Configuration Property

```yaml
workflow:
  quality_gates:
    sprint:
      [sprint-level gates]
    phase:
      [phase-level gates]
    final:
      [final gates]
```

### Gate Levels

#### Sprint-Level Gates

Applied at each sprint checkpoint.

```yaml
quality_gates:
  sprint:
    enabled: true
    gates:
      - name: Unit Test Coverage
        type: test_coverage
        threshold: 80
        required: true
        description: All new code must have unit tests with ≥80% coverage

      - name: Security Scan
        type: security_scan
        required: true
        description: No high-severity security findings allowed

      - name: Code Review
        type: code_review
        required: true
        description: Peer review completed with at least one approval
```

**When Applied:** After each sprint completion (before sprint checkpoint commit)

**Typical Gates:**
- Unit test coverage
- Security scans
- Code review
- Linting/formatting

#### Phase-Level Gates

Applied at each phase checkpoint (superset of sprint gates).

```yaml
quality_gates:
  phase:
    enabled: true
    gates:
      - name: Integration Tests
        type: integration_test
        threshold: 70
        required: true
        description: Integration test suite must pass with ≥70% coverage

      - name: Performance Validation
        type: performance_test
        required: false
        description: Performance benchmarks should meet targets

      - name: API Documentation
        type: documentation
        required: true
        description: All new APIs must be documented
```

**When Applied:** After each phase completion (major milestone)

**Typical Gates:**
- All sprint-level gates
- Integration tests
- Performance validation
- API documentation
- Architecture review

#### Final Gates

Applied before TRD completion (comprehensive validation).

```yaml
quality_gates:
  final:
    enabled: true
    gates:
      - name: Full Test Suite
        type: test_coverage
        threshold: 85
        required: true
        description: Complete test suite with ≥85% coverage

      - name: E2E Tests
        type: e2e_test
        required: true
        description: End-to-end test suite must pass

      - name: Security Audit
        type: security_audit
        required: true
        description: Full security audit with no high/critical findings

      - name: Documentation Complete
        type: documentation
        required: true
        description: All documentation (API, user guides, runbooks) complete

      - name: Deployment Readiness
        type: deployment_check
        required: true
        description: Production deployment checklist complete
```

**When Applied:** Before final TRD completion and production deployment

**Typical Gates:**
- All sprint and phase gates
- E2E test suite
- Full security audit
- Complete documentation
- Production deployment readiness

### Gate Types

| Type | Description | Threshold Support | Common Thresholds |
|------|-------------|-------------------|-------------------|
| `test_coverage` | Code coverage percentage | Yes | 80% (sprint), 85% (final) |
| `security_scan` | Security vulnerability scan | No | No high/critical findings |
| `code_review` | Peer review requirement | No | 1+ approvals |
| `integration_test` | Integration test suite | Yes | 70% coverage |
| `e2e_test` | End-to-end test suite | No | All tests pass |
| `performance_test` | Performance benchmarks | Yes | Response time <200ms |
| `security_audit` | Comprehensive security audit | No | No findings |
| `documentation` | Documentation completeness | No | All sections complete |
| `deployment_check` | Deployment readiness | No | Checklist complete |
| `accessibility` | WCAG compliance | No | WCAG 2.1 AA |

### Gate Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Human-readable gate name |
| `type` | string | Yes | Gate type (see table above) |
| `threshold` | number | No | Threshold value (for applicable types) |
| `required` | boolean | No | Whether gate must pass (default: true) |
| `description` | string | No | Detailed gate description |
| `command` | string | No | Command to run for validation |

### Complete Example

```yaml
workflow:
  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 80
          required: true
          description: All new code must have unit tests with ≥80% coverage
          command: npm run test:coverage

        - name: Security Scan
          type: security_scan
          required: true
          description: No high-severity security findings
          command: npm run security:scan

        - name: ESLint
          type: code_quality
          required: true
          description: No ESLint errors allowed
          command: npm run lint

    phase:
      enabled: true
      gates:
        - name: Integration Tests
          type: integration_test
          threshold: 70
          required: true
          command: npm run test:integration

        - name: API Documentation
          type: documentation
          required: true
          description: OpenAPI spec up to date

    final:
      enabled: true
      gates:
        - name: Full Test Suite
          type: test_coverage
          threshold: 85
          required: true
          command: npm run test:all

        - name: E2E Tests
          type: e2e_test
          required: true
          command: npm run test:e2e

        - name: Security Audit
          type: security_audit
          required: true
          command: npm audit --production

        - name: Performance Tests
          type: performance_test
          threshold: 200  # ms
          required: true
          description: API response time <200ms (p95)
          command: npm run test:performance
```

### Output in Generated TRD

Quality gates appear in checkpoint tasks:

```markdown
- [ ] TASK-1.8: Git checkpoint - Sprint 1 complete (0.5 hours)
  - Commit all completed tasks from Sprint 1
  - **Quality Gates:**
    - [ ] Unit Test Coverage ≥ 80% (`npm run test:coverage`)
    - [ ] Security Scan - No high-severity findings (`npm run security:scan`)
    - [ ] ESLint - No errors (`npm run lint`)
  - Run test suite and verify all tests pass
  - Push to remote branch
  - Suggested commit message: `chore(sprint): complete sprint 1 foundation`
```

---

## Git Workflow

### Overview

Git workflow configuration controls branch naming, commit conventions, and checkpoint strategies.

### Configuration Property

```yaml
workflow:
  git_workflow:
    branch_naming:
      [branch settings]
    commit_conventions:
      [commit settings]
    checkpoint_strategy:
      [checkpoint settings]
```

### Branch Naming

Controls how feature branch names are generated.

```yaml
git_workflow:
  branch_naming:
    pattern: "feature/{trd-id}-{description}"
    description_format: kebab-case
    max_length: 50
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pattern` | string | `"feature/{trd-id}-{description}"` | Branch naming pattern with variables |
| `description_format` | string | `"kebab-case"` | Format for description (kebab-case, snake_case, camelCase) |
| `max_length` | number | `50` | Maximum branch name length |

**Available Variables:**
- `{trd-id}` - TRD identifier (e.g., `trd-workflow-001`)
- `{description}` - Feature description (formatted per `description_format`)
- `{author}` - Author name (from metadata)
- `{team}` - Team name (from metadata)
- `{date}` - Current date (YYYY-MM-DD)

**Examples:**

```yaml
# Default
pattern: "feature/{trd-id}-{description}"
# Output: feature/trd-workflow-001-git-integration

# Team-based
pattern: "{team}/feature/{trd-id}-{description}"
# Output: platform/feature/trd-workflow-001-git-integration

# Date-based
pattern: "feature/{date}-{trd-id}-{description}"
# Output: feature/2025-12-02-trd-workflow-001-git-integration
```

### Commit Conventions

Controls commit message format and content.

```yaml
git_workflow:
  commit_conventions:
    format: conventional
    require_scope: false
    include_task_ids: true
    include_trd_reference: true
    breaking_change_indicator: "BREAKING CHANGE:"
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `format` | string | `"conventional"` | Commit format (conventional, simple, custom) |
| `require_scope` | boolean | `false` | Whether scope is required in commits |
| `include_task_ids` | boolean | `true` | Include completed task IDs in commit body |
| `include_trd_reference` | boolean | `true` | Include TRD reference in commit footer |
| `breaking_change_indicator` | string | `"BREAKING CHANGE:"` | Breaking change footer prefix |

**Format Options:**

**Conventional Commits (default):**
```
feat(auth): implement JWT token validation

Add comprehensive JWT validation with refresh token support

- Add token verification middleware (TASK-001)
- Create refresh token endpoint (TASK-002)

Related: TRD-AUTH-001, Sprint 1
```

**Simple:**
```
Implement JWT token validation

- Add token verification middleware (TASK-001)
- Create refresh token endpoint (TASK-002)

Related: TRD-AUTH-001
```

**Custom:**
Define your own template in commit message templates section.

### Checkpoint Strategy

Controls automatic checkpoint behavior.

```yaml
git_workflow:
  checkpoint_strategy:
    auto_checkpoint: true
    checkpoint_after_sprint: true
    checkpoint_after_phase: true
    checkpoint_before_merge: true
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `auto_checkpoint` | boolean | `true` | Enable automatic checkpoint tasks |
| `checkpoint_after_sprint` | boolean | `true` | Create checkpoint after each sprint |
| `checkpoint_after_phase` | boolean | `true` | Create checkpoint after each phase |
| `checkpoint_before_merge` | boolean | `false` | Create final checkpoint before merge |

### Complete Example

```yaml
workflow:
  git_workflow:
    branch_naming:
      pattern: "feature/{trd-id}-{description}"
      description_format: kebab-case
      max_length: 50

    commit_conventions:
      format: conventional
      require_scope: false
      include_task_ids: true
      include_trd_reference: true
      breaking_change_indicator: "BREAKING CHANGE:"

    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
      checkpoint_after_phase: true
      checkpoint_before_merge: true
```

---

## Multi-Agent Delegation

### Overview

Multi-agent delegation configuration defines patterns for automatic task routing to specialized agents. This is especially useful for complex TRDs (≥20 tasks) with diverse task types.

### Configuration Property

```yaml
workflow:
  delegation:
    enable_auto_delegation: true
    patterns:
      [delegation patterns]
```

### Delegation Patterns

Each pattern defines rules for routing tasks to specific agents.

```yaml
delegation:
  enable_auto_delegation: true
  patterns:
    - task_type: frontend
      keywords: [UI, component, React, Blazor, interface, form]
      agent: frontend-developer
      handoff_template: "Frontend development task requiring UI expertise"

    - task_type: backend
      keywords: [API, database, service, endpoint, authentication]
      agent: backend-developer
      handoff_template: "Backend development task requiring server-side expertise"

    - task_type: infrastructure
      keywords: [AWS, Kubernetes, Docker, Helm, deployment, CI/CD]
      agent: infrastructure-developer
      handoff_template: "Infrastructure task requiring DevOps expertise"
```

**Pattern Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `task_type` | string | Yes | Unique identifier for task category |
| `keywords` | array | Yes | Keywords to match in task descriptions |
| `agent` | string | Yes | Target agent identifier |
| `handoff_template` | string | No | Handoff context template |
| `quality_requirements` | string | No | Quality criteria for delegated tasks |

### Built-in Task Types

| Task Type | Default Keywords | Default Agent | Typical Use Cases |
|-----------|------------------|---------------|-------------------|
| `frontend` | UI, component, React, Blazor, interface | `frontend-developer` | UI components, forms, navigation |
| `backend` | API, database, service, endpoint | `backend-developer` | REST APIs, business logic, database |
| `infrastructure` | AWS, Kubernetes, Docker, Helm | `infrastructure-developer` | Deployment, monitoring, scaling |
| `testing` | test, spec, E2E, integration, coverage | `test-runner` | Unit/integration/E2E tests |
| `documentation` | documentation, README, guide, API docs | `documentation-specialist` | Technical documentation |
| `security` | security, authentication, authorization | `backend-developer` | Auth, encryption, auditing |

### Custom Delegation Patterns

You can define custom patterns for your project:

```yaml
delegation:
  enable_auto_delegation: true
  patterns:
    # Custom: Data pipeline tasks
    - task_type: data_pipeline
      keywords: [ETL, data processing, pipeline, batch job]
      agent: backend-developer
      handoff_template: "Data pipeline task requiring batch processing expertise"
      quality_requirements: "Must handle large datasets efficiently"

    # Custom: Mobile development
    - task_type: mobile
      keywords: [iOS, Android, mobile, React Native]
      agent: frontend-developer
      handoff_template: "Mobile development task"
      quality_requirements: "Cross-platform compatibility required"

    # Custom: ML/AI tasks
    - task_type: machine_learning
      keywords: [ML, AI, model, training, inference]
      agent: backend-developer
      handoff_template: "Machine learning task requiring ML/AI expertise"
      quality_requirements: "Model performance must meet accuracy targets"
```

### Output in Generated TRD

Delegation patterns appear in the workflow section:

```markdown
## Multi-Agent Delegation Patterns

### Frontend Tasks (5 tasks, 12 hours)
- **Delegate to**: `frontend-developer`
- **Task IDs**: TASK-005, TASK-010, TASK-015, TASK-020, TASK-025
- **Handoff Context**: Frontend development task requiring UI expertise
- **Quality Requirements**: WCAG 2.1 AA compliance, responsive design
- **Dependencies**: Requires backend API completion (TASK-003)
- **Execution Command**: `/delegate frontend-developer TASK-005 TASK-010 TASK-015 TASK-020 TASK-025`

### Backend Tasks (8 tasks, 20 hours)
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003, TASK-006, TASK-011, TASK-016, TASK-021, TASK-026
- **Handoff Context**: Backend development task requiring server-side expertise
- **Quality Requirements**: API response time <200ms, comprehensive error handling
- **Dependencies**: None
- **Execution Command**: `/delegate backend-developer TASK-001 TASK-002 TASK-003 ...`
```

### Disabling Auto-Delegation

For simple projects or when manual delegation is preferred:

```yaml
delegation:
  enable_auto_delegation: false
```

This prevents automatic delegation pattern generation, but you can still manually delegate tasks during implementation.

---

## Performance Settings

### Overview

Performance configuration controls execution limits and timeouts.

### Configuration Property

```yaml
workflow:
  performance:
    parallel_task_limit: 3
    checkpoint_timeout: 300
    quality_gate_timeout: 600
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `parallel_task_limit` | number | `3` | Maximum tasks to execute in parallel |
| `checkpoint_timeout` | number | `300` | Checkpoint execution timeout (seconds) |
| `quality_gate_timeout` | number | `600` | Quality gate validation timeout (seconds) |

### Recommendations

**Small Projects (<20 tasks):**
```yaml
performance:
  parallel_task_limit: 2
  checkpoint_timeout: 180
  quality_gate_timeout: 300
```

**Medium Projects (20-50 tasks):**
```yaml
performance:
  parallel_task_limit: 3
  checkpoint_timeout: 300
  quality_gate_timeout: 600
```

**Large Projects (50+ tasks):**
```yaml
performance:
  parallel_task_limit: 5
  checkpoint_timeout: 600
  quality_gate_timeout: 900
```

---

## Complete Examples

### Example 1: Simple Feature (Authentication)

```yaml
---
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

        - name: Security Scan
          type: security_scan
          required: true

    final:
      enabled: true
      gates:
        - name: Full Test Suite
          type: test_coverage
          threshold: 85
          required: true

        - name: E2E Tests
          type: e2e_test
          required: true

metadata:
  version: 1.0.0
  author: Security Team
  priority: critical
  tags: [authentication, security, backend]
---

# PRD: JWT Authentication System
...
```

### Example 2: Complex Multi-Team Project

```yaml
---
workflow:
  checkpoint_frequency: phase
  execution_command: /orchestrate-tasks

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 80
          required: true
          command: npm run test:coverage

        - name: Security Scan
          type: security_scan
          required: true
          command: npm run security:scan

        - name: Code Review
          type: code_review
          required: true

    phase:
      enabled: true
      gates:
        - name: Integration Tests
          type: integration_test
          threshold: 70
          required: true
          command: npm run test:integration

        - name: Performance Validation
          type: performance_test
          threshold: 200
          required: true
          command: npm run test:performance

        - name: API Documentation
          type: documentation
          required: true

    final:
      enabled: true
      gates:
        - name: Full Test Suite
          type: test_coverage
          threshold: 85
          required: true

        - name: E2E Tests
          type: e2e_test
          required: true

        - name: Security Audit
          type: security_audit
          required: true

        - name: Accessibility
          type: accessibility
          required: true
          description: WCAG 2.1 AA compliance

  git_workflow:
    branch_naming:
      pattern: "{team}/feature/{trd-id}-{description}"
      description_format: kebab-case
      max_length: 60

    commit_conventions:
      format: conventional
      require_scope: true
      include_task_ids: true
      include_trd_reference: true

    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
      checkpoint_after_phase: true
      checkpoint_before_merge: true

  delegation:
    enable_auto_delegation: true
    patterns:
      - task_type: frontend
        keywords: [UI, component, React, interface, form, navigation]
        agent: frontend-developer
        handoff_template: "Frontend development requiring React expertise"
        quality_requirements: "WCAG 2.1 AA, responsive design"

      - task_type: backend
        keywords: [API, database, service, endpoint, authentication]
        agent: backend-developer
        handoff_template: "Backend development requiring API expertise"
        quality_requirements: "Response time <200ms, comprehensive error handling"

      - task_type: infrastructure
        keywords: [AWS, Kubernetes, Docker, Helm, deployment, monitoring]
        agent: infrastructure-developer
        handoff_template: "Infrastructure task requiring DevOps expertise"
        quality_requirements: "Security hardening, scalability"

  performance:
    parallel_task_limit: 5
    checkpoint_timeout: 600
    quality_gate_timeout: 900

metadata:
  version: 2.0.0
  author: Platform Team
  team: Engineering
  priority: critical
  status: approved
  tags: [platform, microservices, multi-team, production]
---

# PRD: Multi-Tenant Platform
...
```

### Example 3: Prototype/Research Project

```yaml
---
workflow:
  checkpoint_frequency: manual
  execution_command: /implement-trd

  quality_gates:
    final:
      enabled: true
      gates:
        - name: Basic Tests
          type: test_coverage
          threshold: 60
          required: false

        - name: Security Scan
          type: security_scan
          required: true

  git_workflow:
    checkpoint_strategy:
      auto_checkpoint: false
      checkpoint_after_sprint: false
      checkpoint_after_phase: false

  delegation:
    enable_auto_delegation: false

metadata:
  version: 0.1.0
  author: Research Team
  priority: low
  status: draft
  tags: [prototype, research, experimental]
---

# PRD: ML Model Experiment
...
```

---

## Validation

### Schema Validation

Validate your PRD frontmatter against the schema:

```bash
# Install ajv-cli
npm install -g ajv-cli

# Validate frontmatter
ajv validate \
  -s src/trd-workflow/schemas/prd-metadata.schema.json \
  -d my-prd-frontmatter.yaml
```

### Common Validation Errors

#### Error: Invalid checkpoint_frequency

```yaml
# ❌ Invalid
checkpoint_frequency: "every sprint"

# ✅ Valid
checkpoint_frequency: sprint
```

#### Error: Invalid quality gate type

```yaml
# ❌ Invalid
gates:
  - name: Custom Gate
    type: custom_type  # Not a valid type

# ✅ Valid
gates:
  - name: Unit Tests
    type: test_coverage
    threshold: 80
```

#### Error: Missing required properties

```yaml
# ❌ Invalid (missing required 'type')
gates:
  - name: Security Scan
    required: true

# ✅ Valid
gates:
  - name: Security Scan
    type: security_scan
    required: true
```

### YAML Syntax Checkers

**Online validators:**
- [YAML Lint](http://www.yamllint.com/)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)

**Editor plugins:**
- **VS Code**: YAML Language Support, YAML (Red Hat)
- **Sublime**: YAML Extended
- **Atom**: language-yaml

---

## Related Documentation

- [Command Reference](./COMMAND_REFERENCE.md) - `/create-trd` command documentation
- [Workflow Execution Guide](./WORKFLOW_EXECUTION_GUIDE.md) - Implementing TRDs with workflow sections
- [Troubleshooting](./TROUBLESHOOTING.md) - Common configuration issues
- [Best Practices](../training/BEST_PRACTICES.md) - Recommendations for configuration

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial beta release |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

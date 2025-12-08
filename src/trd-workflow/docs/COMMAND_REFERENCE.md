# TRD Workflow Commands Reference

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001

---

## Overview

This document provides comprehensive reference documentation for TRD workflow commands with git integration features. The TRD workflow system automatically injects strategic git checkpoints and execution guidance into generated Technical Requirements Documents.

### Quick Navigation

- [Command: `/create-trd`](#command-create-trd) - PRD to TRD conversion with workflow injection
- [Workflow Injection Features](#workflow-injection-features) - What gets automatically added
- [PRD Metadata Configuration](#prd-metadata-configuration) - Customize workflow behavior
- [Git Checkpoint System](#git-checkpoint-system) - Automatic checkpoint injection
- [Multi-Agent Delegation](#multi-agent-delegation) - Task routing patterns

---

## Command: `/create-trd`

### Purpose

Converts a Product Requirements Document (PRD) into a comprehensive Technical Requirements Document (TRD) with automatic workflow guidance injection.

### Syntax

```
/create-trd <prd-file-path> [options]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prd-file-path` | string | Yes | Path to the PRD markdown file (relative or absolute) |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--output` | string | `@docs/TRD/` | Output directory for generated TRD |
| `--workflow` | boolean | `true` | Enable workflow injection (disable with `--no-workflow`) |
| `--checkpoints` | string | `"sprint"` | Checkpoint frequency: `sprint`, `phase`, `manual`, or number |
| `--delegation` | boolean | `true` | Enable multi-agent delegation patterns |

### Examples

#### Basic Usage

```bash
# Convert PRD to TRD with default settings
/create-trd @docs/PRD/authentication-system.md

# Output: @docs/TRD/authentication-system-trd.md
```

#### Custom Checkpoint Frequency

```bash
# Create checkpoint every 5 tasks
/create-trd @docs/PRD/large-project.md --checkpoints 5

# Create checkpoints only at phase boundaries
/create-trd @docs/PRD/multi-phase.md --checkpoints phase

# Disable automatic checkpoints
/create-trd @docs/PRD/simple-feature.md --checkpoints manual
```

#### Disable Workflow Features

```bash
# Generate TRD without workflow injection
/create-trd @docs/PRD/legacy-project.md --no-workflow

# Disable delegation patterns
/create-trd @docs/PRD/single-agent.md --no-delegation
```

#### Custom Output Directory

```bash
# Save TRD to custom location
/create-trd @docs/PRD/feature.md --output @docs/technical/
```

### Command Behavior

#### Phase 1: PRD Analysis
1. **Load PRD File** - Read and parse markdown with YAML frontmatter
2. **Extract Metadata** - Parse workflow configuration from frontmatter
3. **Analyze Content** - Identify requirements, acceptance criteria, constraints

#### Phase 2: TRD Structure Generation
1. **Create TRD Skeleton** - Generate standard TRD sections (System Context, Architecture, etc.)
2. **Task Breakdown** - Convert requirements into implementation tasks with estimates
3. **Sprint/Phase Organization** - Group tasks logically based on dependencies

#### Phase 3: Workflow Injection
1. **Checkpoint Injection** - Insert git checkpoint tasks at strategic points
2. **Workflow Section Generation** - Create "Implementation Workflow" section
3. **Commit Template Generation** - Generate "Commit Message Templates" section
4. **Delegation Pattern Analysis** - Identify and document multi-agent patterns

#### Phase 4: Output
1. **Generate TRD File** - Write complete TRD with workflow sections
2. **Validate Structure** - Ensure all required sections present
3. **Report Summary** - Display task count, sprint count, checkpoint locations

### Output Structure

The generated TRD includes:

```markdown
# Technical Requirements Document: [Feature Name]

[Standard TRD sections: System Context, Architecture, etc.]

## Implementation Tasks

### Phase 1: [Phase Name]
#### Sprint 1.1: [Sprint Name] (X tasks, X hours)
- [ ] TASK-001: [Task description] (X hours)
- [ ] TASK-002: [Task description] (X hours)
...
- [ ] TASK-1.X: Git checkpoint - Sprint 1 complete (0.5 hours)

### Phase 2: [Phase Name]
...

## Implementation Workflow

**TRD Complexity**: [Simple|Complex] (X tasks across Y sprints, Z phases)
**Recommended Execution Command**: `/implement-trd`
**Recommended Approach**: [Execution strategy]

### Git Workflow
**Branch Naming**: feature/[trd-id]-[description]
**Checkpoint Strategy**: [Automatic checkpoints after each sprint/phase/N tasks]

### Git Checkpoints (X total)
[Checkpoint details with commit templates]

### Quality Gates
[Quality gate configurations by level]

### Multi-Agent Delegation Patterns
[Delegation recommendations by task type]

## Commit Message Templates

### Sprint Checkpoint Commits
[Conventional commit templates for checkpoints]

### Feature Commits
[Templates for regular feature commits]
```

---

## Workflow Injection Features

### Automatic Git Checkpoints

**What are Git Checkpoints?**

Git checkpoints are special tasks automatically injected into your TRD at strategic points. They serve as natural stopping points for committing progress.

**Default Checkpoint Locations:**

1. **After Each Sprint** - Default behavior, ensures incremental progress commits
2. **After Each Phase** - For multi-phase projects with major milestones
3. **Every N Tasks** - Custom frequency (e.g., every 5 tasks)
4. **Manual Only** - Disable automatic checkpoints (you decide when to commit)

**Checkpoint Task Format:**

```markdown
- [ ] TASK-1.8: Git checkpoint - Sprint 1 complete (0.5 hours)
  - Commit all completed tasks from Sprint 1
  - Run test suite and verify all tests pass
  - Push to remote branch
  - Suggested commit message: `chore(sprint): complete sprint 1 foundation`
```

**Why Checkpoints Matter:**

- **Progress Tracking**: Clear milestones for project tracking
- **Risk Mitigation**: Frequent commits prevent loss of work
- **Code Review**: Smaller, focused commits are easier to review
- **Rollback Safety**: Easy to revert to last working checkpoint
- **Team Coordination**: Clear synchronization points for teams

### Execution Workflow Section

The workflow section provides implementers with clear guidance:

**Simple TRD (< 20 tasks):**
```markdown
## Implementation Workflow

**Recommended Execution Command**: `/implement-trd`
**Recommended Approach**: Execute all tasks in sequence using standard workflow.

### Git Checkpoints (2 total)
- After Sprint 1: TASK-1.5
- After Sprint 2: TASK-2.5
```

**Complex TRD (≥ 20 tasks):**
```markdown
## Implementation Workflow

**TRD Complexity**: Complex (64 tasks across 3 sprints, 4 phases)
**Recommended Execution Command**: `/orchestrate-tasks`

**Recommended Approach**: Use orchestrated multi-agent approach with:
- Sprint-level quality gates after each sprint
- Git checkpoints at phase boundaries
- Multi-agent delegation based on task type
- Incremental testing at each checkpoint

### Multi-Agent Delegation Patterns
#### Schema Design Tasks
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003
- **Handoff Context**: JSON Schema expertise required

### Quality Gates
#### Sprint Level (After Each Sprint)
- [ ] Unit Test Coverage ≥ 80%
- [ ] Security Scan (no high-severity findings)
- [ ] Code Review Complete
```

### Commit Message Templates

Generated templates follow Conventional Commits with TRD integration:

**Sprint Checkpoint Template:**
```
chore(sprint): complete sprint {N} {description}

{completed_tasks}

Related: {TRD_ID}, Sprint {N}
```

**Feature Commit Template:**
```
{type}({scope}): {subject}

{body}

{completed_tasks}

Related: {TRD_ID}
```

**Example Generated Template:**
```markdown
## Commit Message Templates

### Sprint Checkpoint Commits
```
chore(sprint): complete sprint 1 foundation

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001, Sprint 1
```

### Multi-Agent Delegation Patterns

For complex TRDs, the system analyzes tasks and recommends agent delegation:

```markdown
## Multi-Agent Delegation Patterns

### Schema Design Tasks
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003
- **Handoff Context**: JSON Schema draft-07 expertise required
- **Quality Requirements**: Valid schema, comprehensive examples

### Template Implementation Tasks
- **Delegate to**: `frontend-developer`
- **Task IDs**: TASK-005, TASK-006, TASK-007
- **Handoff Context**: Handlebars template engine expertise
- **Quality Requirements**: Conditional rendering, variable interpolation
```

---

## PRD Metadata Configuration

### Overview

PRD files can include optional YAML frontmatter to customize workflow injection behavior. This allows per-project customization without changing global settings.

### Minimal Configuration

```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
---

# Product Requirements Document
...
```

### Complete Configuration Example

```yaml
---
workflow:
  # Checkpoint Strategy
  checkpoint_frequency: sprint  # Options: sprint, phase, manual, or number (e.g., 5)
  execution_command: /implement-trd  # Options: /implement-trd, /orchestrate-tasks, /build

  # Quality Gates Configuration
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
          description: No high-severity security findings

        - name: Code Review
          type: code_review
          required: true
          description: Peer review completed with approvals

    phase:
      enabled: true
      gates:
        - name: Integration Tests
          type: integration_test
          threshold: 70
          required: true

        - name: Performance Validation
          type: performance_test
          required: false

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

        - name: Documentation Complete
          type: documentation
          required: true

  # Git Workflow Configuration
  git_workflow:
    branch_naming:
      pattern: "feature/{trd-id}-{description}"
      description_format: kebab-case  # Options: kebab-case, snake_case, camelCase
      max_length: 50

    commit_conventions:
      format: conventional  # Options: conventional, simple, custom
      require_scope: false
      include_task_ids: true
      include_trd_reference: true
      breaking_change_indicator: "BREAKING CHANGE:"

    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
      checkpoint_after_phase: true
      checkpoint_before_merge: true

  # Multi-Agent Delegation
  delegation:
    enable_auto_delegation: true
    patterns:
      - task_type: frontend
        keywords: [UI, component, React, interface]
        agent: frontend-developer

      - task_type: backend
        keywords: [API, database, service, endpoint]
        agent: backend-developer

      - task_type: infrastructure
        keywords: [AWS, Kubernetes, Docker, deployment]
        agent: infrastructure-developer

      - task_type: testing
        keywords: [test, spec, E2E, integration]
        agent: test-runner

  # Performance Configuration
  performance:
    parallel_task_limit: 3
    checkpoint_timeout: 300  # seconds
    quality_gate_timeout: 600  # seconds

metadata:
  version: 1.0.0
  author: Product Team
  team: Engineering
  priority: high
  status: approved
  tags: [authentication, security, backend]
---

# Product Requirements Document
...
```

### Configuration Options Reference

#### `checkpoint_frequency`

Controls when git checkpoints are automatically injected.

| Value | Behavior | Best For |
|-------|----------|----------|
| `"sprint"` | After each sprint (default) | Most projects (balanced commits) |
| `"phase"` | After each phase | Large projects with major milestones |
| `5` (number) | Every N tasks | Custom frequency control |
| `"manual"` | No automatic checkpoints | When you prefer manual commit decisions |

#### `execution_command`

Specifies the recommended command for TRD implementation.

| Command | When to Use | Behavior |
|---------|-------------|----------|
| `/implement-trd` | Standard projects (default) | Sequential task execution with approval workflow |
| `/orchestrate-tasks` | Complex multi-agent projects | Parallel execution with intelligent delegation |
| `/build` | Legacy projects | Simple build loop (legacy support) |

#### `quality_gates`

Define quality requirements at different checkpoints.

**Levels:**
- `sprint` - After each sprint completion
- `phase` - After each phase completion
- `final` - Before TRD completion

**Gate Types:**
- `test_coverage` - Code coverage threshold
- `security_scan` - Security vulnerability check
- `code_review` - Peer review requirement
- `integration_test` - Integration test pass
- `e2e_test` - End-to-end test pass
- `performance_test` - Performance benchmark
- `documentation` - Documentation completeness

#### `delegation.patterns`

Define rules for automatic agent delegation.

**Properties:**
- `task_type` - Identifier for the task category
- `keywords` - Array of keywords to match in task descriptions
- `agent` - Target agent for delegation

**Built-in Task Types:**
- `frontend` - UI/component development
- `backend` - Server-side logic
- `infrastructure` - DevOps/deployment
- `testing` - Test creation/execution
- `documentation` - Documentation tasks

---

## Git Checkpoint System

### Checkpoint Task Structure

Each checkpoint task includes:

1. **Task ID** - Sequential task identifier (e.g., TASK-1.8)
2. **Description** - Clear checkpoint purpose
3. **Time Estimate** - Typically 0.5 hours
4. **Instructions** - Step-by-step checkpoint process
5. **Commit Template** - Suggested conventional commit message

**Example:**

```markdown
- [ ] TASK-2.5: Git checkpoint - Sprint 2 complete (0.5 hours)
  - Commit all completed tasks from Sprint 2
  - Run full test suite: `npm test`
  - Verify security scans pass: `npm run security-scan`
  - Push to remote branch: `git push origin feature/trd-workflow-001`
  - Suggested commit message: `chore(sprint): complete sprint 2 implementation`
  - Quality gates:
    - [ ] Unit test coverage ≥ 80%
    - [ ] No high-severity security findings
    - [ ] Code review completed
```

### Checkpoint Frequency Strategies

#### Strategy 1: Sprint-Based (Default)

**When to use:**
- Standard projects with clear sprint boundaries
- Teams using Agile/Scrum methodology
- Balanced commit frequency

**Example:**
```yaml
workflow:
  checkpoint_frequency: sprint
```

**Result:**
- Checkpoint after each sprint (typically 5-10 tasks)
- Natural alignment with team ceremonies
- Progress tracking matches sprint planning

#### Strategy 2: Phase-Based

**When to use:**
- Large projects with major milestones
- Multi-month implementations
- Cross-team coordination points

**Example:**
```yaml
workflow:
  checkpoint_frequency: phase
```

**Result:**
- Checkpoint after each phase (typically 15-30 tasks)
- Fewer, more substantial commits
- Clear major milestone markers

#### Strategy 3: Task-Based (Custom Frequency)

**When to use:**
- Fine-grained control over commit frequency
- Projects with irregular task sizes
- Custom workflow requirements

**Example:**
```yaml
workflow:
  checkpoint_frequency: 5  # Checkpoint every 5 tasks
```

**Result:**
- Predictable checkpoint intervals
- Adjustable granularity
- Independent of sprint/phase structure

#### Strategy 4: Manual

**When to use:**
- Experienced developers with strong git discipline
- Exploratory/prototype work
- When checkpoints would be disruptive

**Example:**
```yaml
workflow:
  checkpoint_frequency: manual
```

**Result:**
- No automatic checkpoint tasks
- You decide when to commit
- Workflow section still generated (without checkpoints)

### Checkpoint Best Practices

**DO:**
- ✅ Run full test suite before checkpoint commits
- ✅ Fix any failing tests before committing
- ✅ Include descriptive commit messages
- ✅ Reference completed task IDs
- ✅ Push to remote after checkpoint
- ✅ Verify quality gates pass

**DON'T:**
- ❌ Skip quality gate checks
- ❌ Commit incomplete tasks
- ❌ Use generic commit messages ("wip", "checkpoint")
- ❌ Push without running tests
- ❌ Ignore security scan findings

---

## Multi-Agent Delegation

### Overview

For complex TRDs (≥20 tasks), the system analyzes task descriptions and recommends appropriate agent delegation patterns. This enables efficient parallel execution and specialized expertise.

### Automatic Task Type Detection

The system uses keyword matching to categorize tasks:

**Frontend Tasks:**
- Keywords: `UI`, `component`, `React`, `Blazor`, `interface`, `form`, `navigation`
- Delegate to: `frontend-developer`

**Backend Tasks:**
- Keywords: `API`, `database`, `service`, `endpoint`, `authentication`, `authorization`
- Delegate to: `backend-developer`

**Infrastructure Tasks:**
- Keywords: `AWS`, `Kubernetes`, `Docker`, `Helm`, `deployment`, `CI/CD`, `monitoring`
- Delegate to: `infrastructure-developer`

**Testing Tasks:**
- Keywords: `test`, `spec`, `E2E`, `integration`, `unit test`, `coverage`
- Delegate to: `test-runner` or `playwright-tester`

**Documentation Tasks:**
- Keywords: `documentation`, `README`, `guide`, `API docs`, `runbook`
- Delegate to: `documentation-specialist`

### Delegation Pattern Output

Generated delegation section example:

```markdown
## Multi-Agent Delegation Patterns

### Schema Design Tasks (3 tasks, 6 hours)
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003
- **Handoff Context**: JSON Schema draft-07 expertise required. Must validate against existing agent/command schemas.
- **Quality Requirements**:
  - Valid JSON Schema with no validation errors
  - Comprehensive property definitions
  - Clear descriptions and examples
  - Validation constraints defined
- **Dependencies**: None
- **Execution Command**: `/delegate backend-developer TASK-001 TASK-002 TASK-003`

### Template Implementation Tasks (3 tasks, 8 hours)
- **Delegate to**: `frontend-developer`
- **Task IDs**: TASK-005, TASK-006, TASK-007
- **Handoff Context**: Handlebars template engine expertise. Must support conditional rendering and variable interpolation.
- **Quality Requirements**:
  - Templates render valid markdown
  - All variables properly interpolated
  - Conditional logic works correctly
  - Comprehensive examples included
- **Dependencies**: Requires TASK-001, TASK-002 completion (schemas)
- **Execution Command**: `/delegate frontend-developer TASK-005 TASK-006 TASK-007`
```

### Using Delegation Patterns

#### Option 1: Manual Delegation

```bash
# Review delegation patterns in TRD
# Execute recommended delegation command
/delegate backend-developer TASK-001 TASK-002 TASK-003
```

#### Option 2: Orchestrated Execution

```bash
# Use orchestrated command (automatically delegates)
/orchestrate-tasks @docs/TRD/my-project-trd.md
```

The orchestrator will:
1. Parse delegation patterns from TRD
2. Route tasks to appropriate agents
3. Monitor progress and dependencies
4. Handle handoffs between agents
5. Execute checkpoints when triggered

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

**Problem: No workflow section in generated TRD**
```bash
# Ensure workflow injection is enabled
/create-trd @docs/PRD/my-prd.md --workflow

# Or check PRD frontmatter (workflow should not be disabled)
```

**Problem: Too many/too few checkpoints**
```bash
# Adjust checkpoint frequency
/create-trd @docs/PRD/my-prd.md --checkpoints phase  # Fewer checkpoints
/create-trd @docs/PRD/my-prd.md --checkpoints 3      # Every 3 tasks
```

**Problem: Delegation patterns not generated**
```bash
# Enable delegation (for complex TRDs)
/create-trd @docs/PRD/my-prd.md --delegation

# Or ensure TRD has ≥20 tasks (delegation auto-enabled for complex TRDs)
```

**Problem: Invalid PRD frontmatter**
```bash
# Validate YAML syntax
# Check against schema: src/trd-workflow/schemas/prd-metadata.schema.json

# Common issues:
# - Missing closing quotes
# - Incorrect indentation (use 2 spaces)
# - Invalid YAML structure
```

---

## Related Documentation

- [PRD Metadata Configuration Guide](./PRD_METADATA_GUIDE.md) - Detailed frontmatter configuration
- [Workflow Execution Guide](./WORKFLOW_EXECUTION_GUIDE.md) - Implementer guide for executing TRDs
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Best Practices](../training/BEST_PRACTICES.md) - Git checkpoint frequency recommendations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial beta release documentation |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

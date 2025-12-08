# TRD Workflow Best Practices Guide

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001

---

## Overview

This guide provides best practices, recommendations, and proven patterns for using the TRD workflow system effectively. These practices are based on real-world usage, team feedback, and software engineering principles.

### Key Topics

- [Git Checkpoint Frequency](#git-checkpoint-frequency)
- [Quality Gate Configuration](#quality-gate-configuration)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Multi-Agent Delegation](#multi-agent-delegation)
- [PRD Metadata Configuration](#prd-metadata-configuration)
- [Team Workflows](#team-workflows)

---

## Git Checkpoint Frequency

### Principle: Commit Early, Commit Often (But Not Too Often)

**The Challenge**: Finding the right balance between too many commits (noise) and too few commits (risk).

**Recommended Frequencies by Project Type**:

#### Small Features (5-15 tasks, 1-2 weeks)

**Recommendation**: `checkpoint_frequency: sprint`

```yaml
---
workflow:
  checkpoint_frequency: sprint  # Checkpoint after each sprint
---
```

**Why**:
- Provides 1-2 checkpoints for the entire feature
- Natural alignment with sprint boundaries
- Reduces commit overhead while maintaining safety

**Example**: Authentication feature with 2 sprints
- Sprint 1: User model and database (5 tasks) → Checkpoint
- Sprint 2: Login endpoints and JWT (7 tasks) → Checkpoint
- **Total**: 2 checkpoints

#### Medium Projects (20-40 tasks, 1-2 months)

**Recommendation**: `checkpoint_frequency: sprint` or `checkpoint_frequency: 5`

```yaml
---
workflow:
  # Option 1: Sprint-based (recommended for Agile teams)
  checkpoint_frequency: sprint

  # Option 2: Task-based (for more predictable intervals)
  checkpoint_frequency: 5  # Every 5 tasks
---
```

**Why**:
- Sprint-based: Aligns with team ceremonies and planning
- Task-based: Provides predictable intervals regardless of sprint structure

**Example**: E-commerce checkout flow with 30 tasks
- **Sprint-based**: 3-4 checkpoints (one per sprint)
- **Task-based (every 5)**: 6 checkpoints (tasks 5, 10, 15, 20, 25, 30)

#### Large Projects (50+ tasks, 3+ months)

**Recommendation**: `checkpoint_frequency: phase`

```yaml
---
workflow:
  checkpoint_frequency: phase  # Checkpoint after each major phase
---
```

**Why**:
- Reduces checkpoint overhead for very large projects
- Aligns with major milestones and team coordination points
- Each checkpoint represents substantial progress

**Example**: Multi-tenant SaaS platform with 64 tasks
- Phase 1: Foundation and schemas (20 tasks) → Checkpoint
- Phase 2: Core implementation (25 tasks) → Checkpoint
- Phase 3: Integration and testing (12 tasks) → Checkpoint
- Phase 4: Documentation and deployment (7 tasks) → Checkpoint
- **Total**: 4 checkpoints

#### Exploratory/Prototype Work

**Recommendation**: `checkpoint_frequency: manual`

```yaml
---
workflow:
  checkpoint_frequency: manual  # No automatic checkpoints
---
```

**Why**:
- Maximum flexibility for experimental work
- You decide when meaningful progress warrants a commit
- Reduces overhead for throwaway prototypes

**When to commit manually**:
- ✓ When you've validated a hypothesis
- ✓ When you've reached a stable state worth keeping
- ✓ Before starting a risky refactor
- ✗ Don't wait until "everything is perfect"

### Decision Matrix

| Project Size | Duration | Team Size | Recommended Frequency | Rationale |
|--------------|----------|-----------|----------------------|-----------|
| 5-15 tasks | 1-2 weeks | 1-2 devs | `sprint` | Simple, minimal overhead |
| 20-40 tasks | 1-2 months | 2-4 devs | `sprint` or `5` | Balance between structure and flexibility |
| 40-60 tasks | 2-3 months | 4-6 devs | `phase` | Major milestones, team coordination |
| 60+ tasks | 3+ months | 6+ devs | `phase` | Substantial progress markers |
| Prototype | Variable | 1 dev | `manual` | Maximum flexibility |

### Anti-Patterns to Avoid

#### ❌ Anti-Pattern 1: Too Frequent Checkpoints

```yaml
# DON'T DO THIS
workflow:
  checkpoint_frequency: 1  # Checkpoint after EVERY task
```

**Problems**:
- Creates commit noise
- Interrupts flow state
- Overhead outweighs benefits
- Difficult to review git history

**Better Alternative**:
```yaml
# DO THIS INSTEAD
workflow:
  checkpoint_frequency: sprint  # Natural grouping
```

#### ❌ Anti-Pattern 2: Never Committing

```yaml
# DON'T DO THIS
workflow:
  checkpoint_frequency: manual
# Then never actually create commits until the very end
```

**Problems**:
- Risk of losing work
- Impossible to review incremental progress
- Difficult to isolate bugs
- Large, monolithic commits are hard to review

**Better Alternative**:
```yaml
# DO THIS INSTEAD
workflow:
  checkpoint_frequency: sprint  # Or commit manually at logical points
```

#### ❌ Anti-Pattern 3: Inconsistent Checkpoint Practice

**Problem**: Team uses different checkpoint strategies on same project

**Solution**: Standardize in PRD metadata
```yaml
---
# Document this in your PRD for team consistency
workflow:
  checkpoint_frequency: sprint

  git_workflow:
    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
---
```

### Best Practices Summary

**DO**:
- ✅ Use `sprint` frequency for most projects (good default)
- ✅ Use `phase` frequency for very large projects (50+ tasks)
- ✅ Use custom frequency (e.g., `5`) when you need predictable intervals
- ✅ Use `manual` for prototypes/exploratory work
- ✅ Commit at checkpoint boundaries even if tasks incomplete (with WIP marker)
- ✅ Document your checkpoint strategy in PRD metadata

**DON'T**:
- ❌ Use checkpoint frequency `1` or `2` (too frequent)
- ❌ Wait until "everything is perfect" to commit
- ❌ Skip quality gates before checkpoint commits
- ❌ Use different strategies within the same project
- ❌ Commit broken code at checkpoints

---

## Quality Gate Configuration

### Principle: Progressive Quality Validation

**The Challenge**: Balancing thoroughness with development velocity.

### Recommended Quality Gate Levels

#### Sprint-Level Gates (Required at Every Checkpoint)

**Purpose**: Catch issues early before they compound

```yaml
quality_gates:
  sprint:
    enabled: true
    gates:
      - name: Unit Test Coverage
        type: test_coverage
        threshold: 80
        required: true
        description: All new code must have unit tests

      - name: Security Scan
        type: security_scan
        required: true
        description: No high-severity vulnerabilities

      - name: Linting
        type: code_quality
        required: true
        description: Code passes linter checks
```

**Why these gates**:
- **Unit tests (80%)**: Industry standard, catches logic errors early
- **Security scan**: Prevents accumulation of vulnerabilities
- **Linting**: Maintains code consistency and catches common errors

**Execution time**: < 5 minutes (fast feedback)

#### Phase-Level Gates (Required at Major Milestones)

**Purpose**: Validate integration and system behavior

```yaml
quality_gates:
  phase:
    enabled: true
    gates:
      - name: Integration Tests
        type: integration_test
        threshold: 70
        required: true
        description: Integration test suite passing

      - name: Performance Validation
        type: performance_test
        required: false
        description: Performance benchmarks within targets

      - name: API Documentation
        type: documentation
        required: true
        description: OpenAPI spec up to date
```

**Why these gates**:
- **Integration tests (70%)**: Ensures components work together
- **Performance validation**: Prevents performance regressions
- **API docs**: Keeps documentation in sync with code

**Execution time**: 10-15 minutes (acceptable at phase boundaries)

#### Final Gates (Required Before Completion)

**Purpose**: Production readiness validation

```yaml
quality_gates:
  final:
    enabled: true
    gates:
      - name: Full Test Suite
        type: test_coverage
        threshold: 85
        required: true
        description: Comprehensive test coverage

      - name: E2E Tests
        type: e2e_test
        required: true
        description: End-to-end scenarios passing

      - name: Security Audit
        type: security_audit
        required: true
        description: Full security review complete

      - name: Documentation Complete
        type: documentation
        required: true
        description: All documentation updated

      - name: Deployment Readiness
        type: deployment_check
        required: true
        description: Ready for production deployment
```

**Why these gates**:
- **Full test suite (85%)**: High confidence in code quality
- **E2E tests**: Validates complete user journeys
- **Security audit**: Production security standards
- **Documentation**: Ensures maintainability
- **Deployment readiness**: Verifies operational requirements

**Execution time**: 30-60 minutes (acceptable for final validation)

### Quality Gate Thresholds by Project Type

#### Standard Web Application

```yaml
quality_gates:
  sprint:
    gates:
      - type: test_coverage
        threshold: 80  # Good balance
      - type: security_scan
        required: true

  final:
    gates:
      - type: test_coverage
        threshold: 85  # Higher for final
      - type: e2e_test
        required: true
```

#### High-Security Application (Financial, Healthcare)

```yaml
quality_gates:
  sprint:
    gates:
      - type: test_coverage
        threshold: 90  # Higher standard
      - type: security_scan
        required: true

  phase:
    gates:
      - type: security_scan
        required: true
      - type: code_review
        required: true  # Mandatory peer review

  final:
    gates:
      - type: test_coverage
        threshold: 95  # Very high
      - type: security_audit
        required: true
      - type: penetration_test
        required: true
```

#### Prototype/MVP

```yaml
quality_gates:
  sprint:
    gates:
      - type: test_coverage
        threshold: 60  # Lower for speed
        required: false  # Optional
      - type: security_scan
        required: true  # Still important

  final:
    gates:
      - type: test_coverage
        threshold: 70
      - type: e2e_test
        required: false  # Optional for MVP
```

### Best Practices Summary

**DO**:
- ✅ Use progressive validation (sprint → phase → final)
- ✅ Set higher thresholds for final gates (85%+)
- ✅ Always require security scans (even for prototypes)
- ✅ Adjust thresholds based on project risk/criticality
- ✅ Document gate commands in configuration
- ✅ Make gates fast at sprint level (<5 min)

**DON'T**:
- ❌ Set unrealistic thresholds (e.g., 100% coverage)
- ❌ Skip security gates "to save time"
- ❌ Use same thresholds for all projects
- ❌ Have slow gates at sprint level (>10 min)
- ❌ Mark gates as optional when they're actually required

---

## Commit Message Guidelines

### Principle: Clear, Consistent, Contextual

**The Challenge**: Writing commit messages that are useful months later.

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | When to Use | Examples |
|------|-------------|----------|
| `feat` | New feature or capability | `feat(auth): add JWT token refresh` |
| `fix` | Bug fix | `fix(api): handle null user in /profile endpoint` |
| `docs` | Documentation only | `docs: update API reference for auth endpoints` |
| `style` | Formatting, no logic change | `style: fix indentation in User model` |
| `refactor` | Code restructuring | `refactor: extract validation logic to utils` |
| `perf` | Performance improvement | `perf: optimize database query for user lookup` |
| `test` | Test additions/changes | `test: add integration tests for auth flow` |
| `chore` | Maintenance, checkpoints | `chore(sprint): complete sprint 1 foundation` |
| `ci` | CI/CD changes | `ci: add security scan to GitHub Actions` |

### Scope Guidelines

**Good scopes** (specific, domain-based):
- `auth`, `api`, `database`, `ui`, `config`, `deployment`

**Bad scopes** (too generic):
- `misc`, `stuff`, `things`, `updates`

### Subject Line Best Practices

**DO**:
- ✅ Use imperative mood: "add feature" not "added feature"
- ✅ Keep to 50-72 characters
- ✅ Start with lowercase (after type/scope)
- ✅ No period at end
- ✅ Be specific and descriptive

**Examples**:
```
✅ feat(auth): add JWT token validation middleware
✅ fix(api): handle edge case in user registration
✅ refactor(database): extract connection pool logic

❌ feat: updates
❌ fix: Fixed bug.
❌ Added some new stuff to the authentication system
```

### Body Guidelines

**When to include a body**:
- Complex changes requiring explanation
- Breaking changes
- Non-obvious decisions
- Related issue context

**Format**:
```
feat(auth): add JWT token validation middleware

Implement comprehensive JWT validation with:
- Token signature verification
- Expiration checking
- Refresh token support
- Blacklist checking for revoked tokens

This addresses the security requirement from TRD-AUTH-001
to validate all protected endpoints.

Related: TRD-AUTH-001
```

**Skip body when**:
- Change is self-explanatory from subject
- Trivial changes (typo fixes, formatting)

### Checkpoint Commit Templates

#### Sprint Checkpoint Template

```
chore(sprint): complete sprint {N} {brief-description}

{completed tasks list}

Related: {TRD-ID}, Sprint {N}
Quality Gates: {gate results}
```

**Example**:
```
chore(sprint): complete sprint 1 foundation

- Create user model schema (TASK-001)
- Implement password hashing (TASK-002)
- Create user repository (TASK-003)
- Add database migrations (TASK-004)
- Unit tests for user model (TASK-005)

Related: TRD-AUTH-001, Sprint 1
Quality Gates: ✅ Test coverage 87% | ✅ Security scan passed | ✅ Linting passed
```

#### Phase Checkpoint Template

```
chore(phase): complete phase {N} {brief-description}

{phase summary}

Sprint {N}:
{sprint tasks}

Sprint {N+1}:
{sprint tasks}

Related: {TRD-ID}, Phase {N}
Quality Gates: {gate results}
```

### Best Practices Summary

**DO**:
- ✅ Follow Conventional Commits format
- ✅ Use specific, domain-based scopes
- ✅ Write descriptive subject lines (50-72 chars)
- ✅ Include task IDs in checkpoint commits
- ✅ Add quality gate results to checkpoint commits
- ✅ Use imperative mood ("add" not "added")

**DON'T**:
- ❌ Use generic messages ("wip", "updates", "fixes")
- ❌ Write novels in subject line (keep it concise)
- ❌ Skip the body when complexity warrants explanation
- ❌ Use past tense ("added", "fixed")
- ❌ Forget to reference TRD ID

---

## Multi-Agent Delegation

### Principle: Right Agent for the Right Task

**The Challenge**: Efficiently coordinating specialized agents for optimal results.

### When to Use Delegation

**Use delegation when**:
- ✓ Complex TRD (≥20 tasks)
- ✓ Diverse task types (frontend, backend, infrastructure)
- ✓ Parallel execution possible
- ✓ Specialized expertise needed

**Don't use delegation when**:
- ✗ Simple TRD (<20 tasks)
- ✗ All tasks same type
- ✗ Strong dependencies between tasks
- ✗ Learning opportunity (you want hands-on experience)

### Delegation Patterns

#### Pattern 1: Layer-Based Delegation

**When**: Clear architectural layers

```yaml
delegation:
  patterns:
    - task_type: database
      keywords: [schema, migration, database, SQL]
      agent: backend-developer

    - task_type: api
      keywords: [endpoint, API, REST, GraphQL]
      agent: backend-developer

    - task_type: ui
      keywords: [component, UI, interface, form]
      agent: frontend-developer

    - task_type: infrastructure
      keywords: [Docker, Kubernetes, deployment, CI/CD]
      agent: infrastructure-developer
```

**Example**: E-commerce platform
- Database tasks → `backend-developer`
- API tasks → `backend-developer`
- UI tasks → `frontend-developer`
- Deployment tasks → `infrastructure-developer`

#### Pattern 2: Feature-Based Delegation

**When**: Features can be developed independently

```yaml
delegation:
  patterns:
    - task_type: authentication
      keywords: [auth, login, JWT, session]
      agent: backend-developer

    - task_type: payments
      keywords: [payment, stripe, checkout, billing]
      agent: backend-developer

    - task_type: notifications
      keywords: [notification, email, SMS, push]
      agent: backend-developer
```

**Example**: SaaS application
- Auth feature → `backend-developer` (or dedicated auth specialist)
- Payment feature → `backend-developer` (with payment expertise)
- Notification feature → `backend-developer` (with messaging expertise)

#### Pattern 3: Skill-Based Delegation

**When**: Tasks require specific technical skills

```yaml
delegation:
  patterns:
    - task_type: machine_learning
      keywords: [ML, model, training, inference, AI]
      agent: backend-developer
      handoff_template: "ML task requiring TensorFlow/PyTorch expertise"

    - task_type: performance_optimization
      keywords: [performance, optimization, caching, profiling]
      agent: backend-developer
      handoff_template: "Performance optimization requiring profiling expertise"
```

### Delegation Execution

#### Manual Delegation

**When to use**: You want control over timing and context

```bash
# Review delegation pattern in TRD
# Complete prerequisite tasks first
# Then delegate with explicit context

/delegate backend-developer TASK-001 TASK-002 TASK-003 \
  "Create JSON Schema draft-07 definitions. Must validate against existing agent schema format. Include comprehensive examples."
```

**Advantages**:
- Full control over timing
- Can provide custom context
- Can adjust scope dynamically

**Disadvantages**:
- More manual effort
- Must track dependencies yourself

#### Orchestrated Delegation

**When to use**: Complex projects with many delegation patterns

```bash
# Automatic delegation based on TRD patterns
/orchestrate-tasks @docs/TRD/platform-trd.md
```

**Advantages**:
- Automatic dependency management
- Parallel execution where possible
- Follows TRD delegation patterns
- Less manual overhead

**Disadvantages**:
- Less granular control
- Relies on correct TRD patterns

### Best Practices Summary

**DO**:
- ✅ Use delegation for complex TRDs (≥20 tasks)
- ✅ Group related tasks for same agent
- ✅ Provide clear handoff context
- ✅ Document quality requirements for delegated work
- ✅ Specify dependencies explicitly
- ✅ Review agent output before checkpoint commits

**DON'T**:
- ❌ Delegate tasks with unmet dependencies
- ❌ Over-delegate (too many handoffs creates overhead)
- ❌ Use delegation for learning opportunities
- ❌ Forget to provide context to agents
- ❌ Skip review of delegated work

---

## PRD Metadata Configuration

### Principle: Configure Once, Execute Consistently

**The Challenge**: Balancing flexibility with standardization.

### Minimal Configuration (Recommended Default)

```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
---
```

**When to use**: 90% of projects

**Provides**:
- Sprint-based checkpoints
- Standard execution flow
- Default quality gates (80% coverage, security scan)
- Auto-delegation for complex TRDs

### Production-Ready Configuration

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
  team: Platform Engineering
---
```

**When to use**: Production projects requiring explicit quality gates

### Team Standardization

**Create team templates**:

**File**: `team-templates/standard-prd-metadata.yaml`

```yaml
---
# Standard team configuration
# Copy this to the top of new PRDs

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
          command: npm run test:coverage

        - name: Security Scan
          type: security_scan
          required: true
          command: npm run security:scan

        - name: ESLint
          type: code_quality
          required: true
          command: npm run lint

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

  git_workflow:
    branch_naming:
      pattern: "{team}/feature/{trd-id}-{description}"
      max_length: 60

    commit_conventions:
      format: conventional
      require_scope: true
      include_task_ids: true
      include_trd_reference: true

metadata:
  team: Platform Engineering
  version: 1.0.0
---
```

**Usage**: Copy-paste into new PRDs for consistency

### Best Practices Summary

**DO**:
- ✅ Start with minimal configuration
- ✅ Add configuration as needed
- ✅ Create team templates for consistency
- ✅ Document configuration decisions
- ✅ Validate YAML syntax before use
- ✅ Version your metadata configuration

**DON'T**:
- ❌ Over-configure from the start
- ❌ Use different configurations per developer
- ❌ Skip validation of YAML syntax
- ❌ Hardcode personal preferences in team templates

---

## Team Workflows

### Small Teams (1-3 developers)

**Recommended Setup**:
- `checkpoint_frequency: sprint`
- Manual code review (informal)
- Shared feature branch
- Simple delegation

**Workflow**:
```
1. Create shared feature branch
2. Implement tasks collaboratively
3. Sprint checkpoint every 5-10 tasks
4. Informal review before checkpoint commit
5. Merge when complete
```

### Medium Teams (4-8 developers)

**Recommended Setup**:
- `checkpoint_frequency: sprint`
- Formal code review (required)
- Individual feature branches
- Multi-agent delegation

**Workflow**:
```
1. Each developer creates feature branch from main
2. Implement assigned tasks (or delegated tasks)
3. Sprint checkpoint with PR for review
4. Code review required (1-2 approvals)
5. Merge checkpoint branch to main
6. Continue with next sprint
```

### Large Teams (8+ developers)

**Recommended Setup**:
- `checkpoint_frequency: phase`
- Formal code review with multiple approvers
- Feature branches with sub-branches
- Orchestrated delegation

**Workflow**:
```
1. Create main feature branch
2. Developers create sub-branches for individual sprints
3. Orchestrated delegation routes tasks to specialists
4. Sprint PRs merge to feature branch
5. Phase checkpoints with comprehensive review
6. Feature branch merges to main after final gates
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial best practices guide |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

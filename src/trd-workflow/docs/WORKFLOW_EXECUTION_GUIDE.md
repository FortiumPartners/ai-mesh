# TRD Workflow Execution Guide

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001
**Audience**: Developers implementing TRDs with workflow sections

---

## Overview

This guide provides step-by-step instructions for executing TRDs with injected workflow sections, including git checkpoint management, quality gate validation, and multi-agent delegation.

### Prerequisites

- Claude Code with AI Mesh installed
- Git repository initialized
- TRD file generated with `/create-trd` command
- Understanding of conventional commits (recommended)

### What You'll Learn

- How to execute TRDs with workflow sections
- When and how to execute git checkpoints
- Quality gate validation procedures
- Multi-agent delegation patterns
- Troubleshooting common issues

---

## Table of Contents

- [Quick Start](#quick-start)
- [Execution Workflow](#execution-workflow)
- [Git Checkpoint Execution](#git-checkpoint-execution)
- [Quality Gate Validation](#quality-gate-validation)
- [Multi-Agent Delegation](#multi-agent-delegation)
- [Branch Management](#branch-management)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Understand Your TRD Structure

Open your generated TRD and locate these key sections:

```markdown
## Implementation Tasks
[Task breakdown with checkpoints]

## Implementation Workflow
[Execution strategy and recommendations]

### Git Checkpoints
[Checkpoint locations and templates]

### Quality Gates
[Validation requirements]

### Multi-Agent Delegation Patterns
[Agent delegation recommendations]

## Commit Message Templates
[Conventional commit templates]
```

### 2. Create Feature Branch

Follow the recommended branch naming from your TRD:

```bash
# Example from TRD workflow section
git checkout -b feature/trd-workflow-001-git-integration
```

### 3. Execute Implementation

**Simple TRD (<20 tasks):**
```bash
/implement-trd @docs/TRD/my-feature-trd.md
```

**Complex TRD (≥20 tasks):**
```bash
/orchestrate-tasks @docs/TRD/my-feature-trd.md
```

### 4. Execute Checkpoints

When you reach a checkpoint task:
1. Review completed tasks
2. Run quality gate validations
3. Commit using provided template
4. Mark checkpoint task as complete

---

## Execution Workflow

### Standard Execution Flow

```
[Start]
  ↓
Create Feature Branch
  ↓
Execute Tasks (Sprint 1)
  ↓
Reach Checkpoint Task
  ↓
Run Quality Gates
  ↓
[Gates Pass?]
  ↓ Yes
Create Checkpoint Commit
  ↓
Push to Remote
  ↓
Continue to Next Sprint
  ↓
[More Sprints?]
  ↓ No
Final Quality Gates
  ↓
Create Pull Request
  ↓
[End]
```

### Step-by-Step Execution

#### Step 1: Review TRD and Plan

**Before starting implementation:**

1. **Read Implementation Workflow section**
   - Understand TRD complexity (simple vs. complex)
   - Note recommended execution command
   - Review checkpoint locations

2. **Review Quality Gates**
   - Understand requirements for each level (sprint, phase, final)
   - Ensure you have necessary tools/access
   - Plan validation steps

3. **Review Delegation Patterns (if applicable)**
   - Identify which tasks should be delegated
   - Understand handoff contexts
   - Plan coordination with agents

**Example Workflow Section:**
```markdown
## Implementation Workflow

**TRD Complexity**: Complex (64 tasks across 3 sprints, 4 phases)
**Recommended Execution Command**: `/orchestrate-tasks`
**Recommended Approach**: Use orchestrated multi-agent approach with:
- Sprint-level quality gates after each sprint
- Git checkpoints at phase boundaries
- Multi-agent delegation based on task type
```

#### Step 2: Create Feature Branch

Use the branch naming pattern from the TRD:

```bash
# Pattern: feature/{trd-id}-{description}
git checkout -b feature/trd-workflow-001-git-integration

# Verify branch
git branch --show-current
# Output: feature/trd-workflow-001-git-integration
```

#### Step 3: Execute Tasks

**Sequential Execution (Simple TRDs):**

```bash
# Execute implementation command
/implement-trd @docs/TRD/authentication-trd.md

# The system will:
# 1. Load TRD file
# 2. Present tasks for approval
# 3. Execute tasks in order
# 4. Stop at checkpoint tasks for manual execution
```

**Orchestrated Execution (Complex TRDs):**

```bash
# Execute orchestration command
/orchestrate-tasks @docs/TRD/platform-trd.md

# The system will:
# 1. Analyze delegation patterns
# 2. Route tasks to appropriate agents
# 3. Execute tasks in parallel (respecting dependencies)
# 4. Stop at checkpoint tasks
```

#### Step 4: Execute Checkpoints

When you reach a checkpoint task (e.g., `TASK-1.8: Git checkpoint - Sprint 1 complete`):

**DO NOT mark the checkbox yet.** Follow checkpoint execution steps first.

---

## Git Checkpoint Execution

### Checkpoint Task Structure

A typical checkpoint task looks like:

```markdown
- [ ] TASK-1.8: Git checkpoint - Sprint 1 complete (0.5 hours)
  - Commit all completed tasks from Sprint 1
  - Run test suite and verify all tests pass
  - Push to remote branch
  - Suggested commit message: `chore(sprint): complete sprint 1 foundation`
  - Quality gates:
    - [ ] Unit test coverage ≥ 80%
    - [ ] Security scan - No high-severity findings
    - [ ] Code review completed
```

### Step-by-Step Checkpoint Execution

#### Step 1: Review Completed Tasks

Verify all tasks in the current sprint/phase are complete:

```bash
# Check TRD file for completed tasks
# Example: Sprint 1 tasks TASK-001 through TASK-007 should all be checked

- [x] TASK-001: Create commit template schema (2 hours)
- [x] TASK-002: Create workflow section schema (2 hours)
- [x] TASK-003: Create PRD metadata schema (2 hours)
...
- [ ] TASK-1.8: Git checkpoint - Sprint 1 complete (0.5 hours)
```

**If any tasks are incomplete:**
- Complete them first
- Do not proceed to checkpoint until all tasks done
- Update TRD checkboxes as you complete tasks

#### Step 2: Verify Working Directory

Ensure all changes are staged or tracked:

```bash
# Check git status
git status

# You should see modified files
# Example output:
# On branch feature/trd-workflow-001-git-integration
# Changes not staged for commit:
#   modified:   src/trd-workflow/schemas/commit-template.schema.json
#   modified:   src/trd-workflow/schemas/workflow-section.schema.json
#   modified:   src/trd-workflow/schemas/prd-metadata.schema.json

# Stage all changes
git add .

# Verify staging
git status
# Example output:
# Changes to be committed:
#   modified:   src/trd-workflow/schemas/commit-template.schema.json
#   modified:   src/trd-workflow/schemas/workflow-section.schema.json
#   modified:   src/trd-workflow/schemas/prd-metadata.schema.json
```

#### Step 3: Run Quality Gates

Execute each quality gate validation from the checkpoint:

**Unit Test Coverage:**
```bash
# Run test suite
npm run test:coverage

# Verify coverage ≥ 80%
# Example output:
# =============================== Coverage summary ===============================
# Statements   : 85% ( 170/200 )
# Branches     : 82% ( 41/50 )
# Functions    : 88% ( 44/50 )
# Lines        : 85% ( 170/200 )

# ✅ PASS - Coverage meets 80% threshold
```

**Security Scan:**
```bash
# Run security scan
npm run security:scan
# or
npm audit --production

# Verify no high/critical findings
# Example output:
# found 0 vulnerabilities

# ✅ PASS - No high-severity findings
```

**Code Review (if required):**
```bash
# For sprint checkpoints, code review may not be required
# For phase/final checkpoints, ensure peer review is complete
# This is typically done via pull request review

# Skip for now if sprint-level checkpoint
# ✅ PASS - Not required for sprint checkpoints
```

**If any quality gate fails:**
- Fix the issue before proceeding
- Re-run the quality gate
- Do not create checkpoint commit until all gates pass

#### Step 4: Create Checkpoint Commit

Use the suggested commit message template from the checkpoint:

```bash
# Commit with provided template
git commit -m "$(cat <<'EOF'
chore(sprint): complete sprint 1 foundation

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001, Sprint 1
EOF
)"

# Verify commit created
git log -1 --oneline
# Example output:
# abc1234 chore(sprint): complete sprint 1 foundation
```

**Commit Message Customization:**

You can customize the commit message while maintaining the structure:

```bash
# Enhanced commit with more detail
git commit -m "$(cat <<'EOF'
chore(sprint): complete sprint 1 JSON Schema foundation

Implemented foundational JSON Schema definitions for TRD workflow system:
- Commit message template schema with Conventional Commits support
- Workflow section schema with conditional rendering
- PRD metadata schema for YAML frontmatter configuration

All schemas validated against JSON Schema draft-07 specification.

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001, Sprint 1
Quality Gates: ✅ Test coverage 85% | ✅ Security scan passed
EOF
)"
```

#### Step 5: Push to Remote

```bash
# Push checkpoint commit to remote
git push origin feature/trd-workflow-001-git-integration

# Verify push succeeded
# Example output:
# To github.com:FortiumPartners/ai-mesh.git
#    abc1234..def5678  feature/trd-workflow-001-git-integration -> feature/trd-workflow-001-git-integration
```

#### Step 6: Mark Checkpoint Complete

Update the TRD file to mark the checkpoint task complete:

```markdown
- [x] TASK-1.8: Git checkpoint - Sprint 1 complete (0.5 hours)
  - Commit all completed tasks from Sprint 1
  - Run test suite and verify all tests pass
  - Push to remote branch
  - Suggested commit message: `chore(sprint): complete sprint 1 foundation`
  - Quality gates:
    - [x] Unit test coverage ≥ 80%
    - [x] Security scan - No high-severity findings
    - [x] Code review completed
```

**Commit the TRD update:**
```bash
# Stage TRD file
git add docs/TRD/trd-workflow-integration-trd.md

# Commit TRD update
git commit -m "docs: mark sprint 1 checkpoint complete"

# Push update
git push origin feature/trd-workflow-001-git-integration
```

#### Step 7: Continue to Next Sprint

Proceed with the next sprint's tasks:

```markdown
### Phase 1, Sprint 1.2: Template Implementation (3 tasks, 8 hours)
- [ ] TASK-005: Implement Handlebars template engine integration (3 hours)
- [ ] TASK-006: Implement checkpoint injection logic (3 hours)
- [ ] TASK-007: Implement workflow section generator (2 hours)
- [ ] TASK-1.16: Git checkpoint - Sprint 2 complete (0.5 hours)
```

---

## Quality Gate Validation

### Quality Gate Levels

#### Sprint-Level Gates

**When:** After each sprint completion (before sprint checkpoint commit)

**Typical Gates:**
- Unit test coverage ≥ 80%
- Security scan (no high-severity findings)
- Linting/formatting checks

**Example Execution:**

```bash
# 1. Run unit tests
npm run test:coverage
# Verify: Coverage ≥ 80%

# 2. Run security scan
npm run security:scan
# Verify: No high/critical vulnerabilities

# 3. Run linter
npm run lint
# Verify: No errors (warnings acceptable)

# If all pass:
# ✅ Proceed to checkpoint commit

# If any fail:
# ❌ Fix issues before committing
```

#### Phase-Level Gates

**When:** After each phase completion (major milestone)

**Typical Gates:**
- All sprint-level gates
- Integration test coverage ≥ 70%
- Performance validation
- API documentation complete

**Example Execution:**

```bash
# 1. Run all sprint-level gates
npm run test:coverage
npm run security:scan
npm run lint

# 2. Run integration tests
npm run test:integration
# Verify: Integration coverage ≥ 70%

# 3. Run performance tests
npm run test:performance
# Verify: Response times meet targets

# 4. Verify API documentation
# Check: OpenAPI spec up to date
# Check: All endpoints documented

# If all pass:
# ✅ Proceed to phase checkpoint commit
```

#### Final Gates

**When:** Before TRD completion and production deployment

**Typical Gates:**
- All sprint and phase gates
- E2E test suite passing
- Full security audit
- Complete documentation
- Deployment readiness

**Example Execution:**

```bash
# 1. Run full test suite
npm run test:all
# Verify: All tests passing

# 2. Run E2E tests
npm run test:e2e
# Verify: All E2E scenarios passing

# 3. Run security audit
npm audit --production
npm run security:audit
# Verify: No vulnerabilities

# 4. Verify documentation
# Check: README up to date
# Check: API docs complete
# Check: Runbooks created
# Check: CHANGELOG updated

# 5. Deployment readiness
# Check: Environment configs set
# Check: Deployment scripts tested
# Check: Rollback plan documented

# If all pass:
# ✅ Ready for pull request and merge
```

### Custom Quality Gate Commands

If your TRD specifies custom commands for quality gates, use those:

```markdown
Quality gates:
  - [ ] Unit test coverage ≥ 80% (`npm run test:coverage`)
  - [ ] Security scan (`npm run security:full-scan`)
  - [ ] Performance tests (`npm run perf:validate`)
```

Execute the specified commands:

```bash
# Use exact commands from TRD
npm run test:coverage
npm run security:full-scan
npm run perf:validate
```

### Handling Quality Gate Failures

**If a quality gate fails:**

1. **Do NOT proceed to checkpoint commit**
2. **Identify the issue:**
   ```bash
   # Example: Test coverage too low
   # Output: Coverage: 75% (threshold: 80%)
   ```

3. **Fix the issue:**
   ```bash
   # Add missing tests
   # Improve test coverage
   ```

4. **Re-run the quality gate:**
   ```bash
   npm run test:coverage
   # Output: Coverage: 82% ✅
   ```

5. **Once all gates pass, proceed to checkpoint commit**

---

## Multi-Agent Delegation

### When to Delegate

For complex TRDs (≥20 tasks), the workflow section includes delegation patterns:

```markdown
## Multi-Agent Delegation Patterns

### Schema Design Tasks (3 tasks, 6 hours)
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003
- **Handoff Context**: JSON Schema expertise required
- **Quality Requirements**: Valid schema, comprehensive examples
- **Dependencies**: None
- **Execution Command**: `/delegate backend-developer TASK-001 TASK-002 TASK-003`

### Template Implementation Tasks (3 tasks, 8 hours)
- **Delegate to**: `frontend-developer`
- **Task IDs**: TASK-005, TASK-006, TASK-007
- **Handoff Context**: Handlebars template expertise
- **Quality Requirements**: Conditional rendering, variable interpolation
- **Dependencies**: Requires TASK-001, TASK-002, TASK-003 completion
- **Execution Command**: `/delegate frontend-developer TASK-005 TASK-006 TASK-007`
```

### Manual Delegation

**Step 1: Review Dependencies**

Ensure prerequisite tasks are complete before delegating:

```markdown
# Example: Template tasks depend on schema tasks
# Must complete TASK-001, TASK-002, TASK-003 before delegating TASK-005-007
```

**Step 2: Execute Delegation Command**

Use the provided delegation command:

```bash
# Delegate schema tasks to backend developer
/delegate backend-developer TASK-001 TASK-002 TASK-003

# The backend-developer agent will:
# 1. Receive handoff context
# 2. Execute tasks with domain expertise
# 3. Validate against quality requirements
# 4. Mark tasks complete in TRD
```

**Step 3: Review Agent Output**

After agent completes tasks:

```bash
# Review generated files
git status
git diff

# Verify quality requirements met
# For schema tasks: Validate schema structure

# If output is acceptable:
git add .
git commit -m "feat(schemas): add JSON Schema definitions via backend-developer"
```

### Orchestrated Delegation

**Automatic delegation with orchestration:**

```bash
# Execute orchestrator command
/orchestrate-tasks @docs/TRD/platform-trd.md

# The orchestrator will:
# 1. Parse delegation patterns from TRD
# 2. Route tasks to agents automatically
# 3. Respect dependencies
# 4. Execute checkpoints when triggered
# 5. Validate quality gates
```

**Monitor orchestrated execution:**

```bash
# The orchestrator provides real-time updates:
# ✓ Routing TASK-001, TASK-002, TASK-003 to backend-developer
# ⏳ Executing schema design tasks (3 tasks, 6 hours)
# ✓ backend-developer completed TASK-001: Commit template schema
# ✓ backend-developer completed TASK-002: Workflow section schema
# ✓ backend-developer completed TASK-003: PRD metadata schema
# ✓ All schema tasks complete
#
# ✓ Routing TASK-005, TASK-006, TASK-007 to frontend-developer
# ⏳ Executing template implementation tasks (3 tasks, 8 hours)
# ...
```

---

## Branch Management

### Branch Naming

Follow the pattern from your TRD workflow section:

```markdown
**Branch Naming**: feature/{trd-id}-{description}
```

**Example:**
```bash
git checkout -b feature/trd-workflow-001-git-integration
```

### Branch Protection

For production branches:

```bash
# Do NOT commit directly to main/master
# Always use feature branches

# Verify current branch before committing
git branch --show-current

# If on main/master:
# ❌ STOP - Switch to feature branch
git checkout -b feature/my-feature

# ✅ OK - On feature branch, safe to commit
```

### Branch Synchronization

Keep your feature branch up to date:

```bash
# Fetch latest changes
git fetch origin

# Rebase on main (if needed)
git rebase origin/main

# Or merge main into feature branch
git merge origin/main

# Push updated branch
git push origin feature/trd-workflow-001-git-integration --force-with-lease
```

---

## Commit Message Guidelines

### Conventional Commits Format

Follow the template from your TRD:

```
<type>(<scope>): <subject>

<body>

<completed tasks>

Related: <TRD-ID>, <sprint/phase>
```

### Commit Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): implement JWT validation` |
| `fix` | Bug fix | `fix(api): handle null response in user endpoint` |
| `docs` | Documentation | `docs: update API reference` |
| `style` | Formatting | `style: fix indentation in schemas` |
| `refactor` | Code refactoring | `refactor: extract validation logic` |
| `test` | Tests | `test: add unit tests for templates` |
| `chore` | Maintenance, checkpoints | `chore(sprint): complete sprint 1 foundation` |

### Examples

**Feature Commit:**
```
feat(schemas): add JSON Schema definitions

Implement foundational schemas for TRD workflow system:
- Commit message template schema
- Workflow section template schema
- PRD metadata configuration schema

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001
```

**Sprint Checkpoint:**
```
chore(sprint): complete sprint 1 foundation

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001, Sprint 1
Quality Gates: ✅ Test coverage 85% | ✅ Security scan passed
```

**Phase Checkpoint:**
```
chore(phase): complete phase 1 schema design

Phase 1 deliverables complete:
- JSON Schema definitions (3 schemas)
- Handlebars templates (2 templates)
- Integration with /create-trd command

Sprint 1:
- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Sprint 2:
- Implement template engine integration (TASK-005)
- Implement checkpoint injection (TASK-006)
- Implement workflow generator (TASK-007)

Related: TRD-WORKFLOW-001, Phase 1
Quality Gates: ✅ All gates passed
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Quality Gate Failing

**Symptom:**
```bash
npm run test:coverage
# Coverage: 75% (threshold: 80%)
```

**Solution:**
1. Identify uncovered code:
   ```bash
   npm run test:coverage -- --verbose
   ```
2. Add missing tests
3. Re-run coverage check
4. Proceed only when threshold met

#### Issue 2: Cannot Push to Remote

**Symptom:**
```bash
git push origin feature/my-branch
# ! [rejected]        feature/my-branch -> feature/my-branch (fetch first)
```

**Solution:**
```bash
# Fetch latest changes
git fetch origin

# Rebase on remote branch
git rebase origin/feature/my-branch

# Resolve any conflicts
# Then force push (if safe)
git push origin feature/my-branch --force-with-lease
```

#### Issue 3: Checkpoint Task Unclear

**Symptom:**
"I'm not sure how to execute this checkpoint task"

**Solution:**
1. Re-read checkpoint instructions in TRD
2. Review [Git Checkpoint Execution](#git-checkpoint-execution) section
3. Follow step-by-step process
4. Consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed help

#### Issue 4: Delegation Dependencies Not Met

**Symptom:**
"Cannot delegate tasks - dependencies not complete"

**Solution:**
1. Review delegation pattern dependencies in TRD
2. Complete prerequisite tasks first
3. Verify prerequisites marked as complete
4. Retry delegation command

For more troubleshooting help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Best Practices

### DO:
- ✅ Read entire TRD before starting implementation
- ✅ Follow checkpoint instructions exactly
- ✅ Run all quality gates before checkpoint commits
- ✅ Use provided commit message templates
- ✅ Push to remote after each checkpoint
- ✅ Keep TRD file up to date (mark tasks complete)
- ✅ Review delegation patterns for complex TRDs

### DON'T:
- ❌ Skip quality gate validations
- ❌ Commit incomplete tasks
- ❌ Use generic commit messages ("wip", "checkpoint")
- ❌ Push directly to main/master branch
- ❌ Ignore security scan findings
- ❌ Delegate tasks with unmet dependencies

---

## Related Documentation

- [Command Reference](./COMMAND_REFERENCE.md) - `/create-trd` and execution commands
- [PRD Metadata Guide](./PRD_METADATA_GUIDE.md) - Configure workflow behavior
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Best Practices](../training/BEST_PRACTICES.md) - Checkpoint frequency recommendations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial beta release |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

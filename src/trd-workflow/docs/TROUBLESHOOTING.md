# TRD Workflow Troubleshooting Guide

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001

---

## Overview

This guide provides solutions to common issues encountered when using the TRD workflow system, including `/create-trd` command problems, quality gate failures, delegation issues, and git checkpoint challenges.

### Quick Navigation

- [Command Execution Issues](#command-execution-issues)
- [Workflow Injection Problems](#workflow-injection-problems)
- [Quality Gate Failures](#quality-gate-failures)
- [Git Checkpoint Issues](#git-checkpoint-issues)
- [Delegation Problems](#delegation-problems)
- [PRD Metadata Issues](#prd-metadata-issues)
- [Performance Issues](#performance-issues)

---

## Command Execution Issues

### Issue: `/create-trd` command not found

**Symptom:**
```bash
/create-trd @docs/PRD/my-prd.md
# Error: Command not found
```

**Possible Causes:**
1. AI Mesh not installed
2. Commands not synced to Claude Code
3. Using incorrect command name

**Solutions:**

**1. Verify AI Mesh Installation:**
```bash
# Check if AI Mesh is installed
ls ~/.claude/commands/ai-mesh/

# Should see:
# create-trd.md
# create-trd.txt
# (and other commands)
```

**2. Reinstall AI Mesh if needed:**
```bash
npx @fortium/ai-mesh install --global
```

**3. Restart Claude Code:**
```bash
# Completely quit Claude Code
# Restart application
# Try command again
```

**4. Verify command name:**
```bash
# Correct command:
/create-trd @docs/PRD/my-prd.md

# NOT:
/create-trd-workflow
/generate-trd
/trd-create
```

---

### Issue: Cannot read PRD file

**Symptom:**
```bash
/create-trd @docs/PRD/authentication.md
# Error: File not found or cannot be read
```

**Possible Causes:**
1. Incorrect file path
2. File doesn't exist
3. Permission issues

**Solutions:**

**1. Verify file exists:**
```bash
# Check file exists
ls @docs/PRD/authentication.md

# If not found, check actual path
find . -name "authentication.md"
```

**2. Use absolute path:**
```bash
# Instead of relative path
/create-trd /Users/yourname/Development/project/docs/PRD/authentication.md
```

**3. Check file permissions:**
```bash
# Verify file is readable
ls -l @docs/PRD/authentication.md

# Should show: -rw-r--r-- (readable)

# Fix permissions if needed
chmod 644 @docs/PRD/authentication.md
```

---

### Issue: TRD output file not created

**Symptom:**
```bash
/create-trd @docs/PRD/my-prd.md
# Command completes but no TRD file created
```

**Possible Causes:**
1. Output directory doesn't exist
2. Permission issues
3. Command failed silently

**Solutions:**

**1. Create output directory:**
```bash
# Ensure output directory exists
mkdir -p @docs/TRD/
```

**2. Specify custom output:**
```bash
/create-trd @docs/PRD/my-prd.md --output @docs/TRD/
```

**3. Check permissions:**
```bash
# Verify directory is writable
ls -ld @docs/TRD/

# Fix permissions if needed
chmod 755 @docs/TRD/
```

---

## Workflow Injection Problems

### Issue: No workflow section in generated TRD

**Symptom:**
Generated TRD missing "Implementation Workflow" section

**Possible Causes:**
1. Workflow injection disabled
2. PRD frontmatter disables workflow
3. Command version doesn't support workflow

**Solutions:**

**1. Enable workflow injection:**
```bash
# Explicitly enable workflow
/create-trd @docs/PRD/my-prd.md --workflow
```

**2. Check PRD frontmatter:**
```yaml
---
# ❌ Workflow disabled
workflow:
  enabled: false

# ✅ Workflow enabled (or omit this line)
workflow:
  enabled: true
---
```

**3. Verify command version:**
```bash
# Check AI Mesh version
npx @fortium/ai-mesh --version

# Should be ≥3.6.0 for workflow support
# Update if needed:
npx @fortium/ai-mesh install --global
```

---

### Issue: Too many/too few checkpoints

**Symptom:**
Checkpoint frequency doesn't match expectations

**Possible Causes:**
1. Incorrect checkpoint_frequency configuration
2. Task count doesn't trigger expected frequency
3. Manual checkpoint mode enabled

**Solutions:**

**1. Adjust checkpoint frequency in PRD:**
```yaml
---
workflow:
  # For more checkpoints
  checkpoint_frequency: sprint  # Default

  # For fewer checkpoints
  checkpoint_frequency: phase

  # For custom frequency
  checkpoint_frequency: 5  # Every 5 tasks

  # For no automatic checkpoints
  checkpoint_frequency: manual
---
```

**2. Understand frequency behavior:**
- `sprint`: 1 checkpoint per sprint (~5-10 tasks)
- `phase`: 1 checkpoint per phase (~15-30 tasks)
- `5`: 1 checkpoint every 5 tasks
- `manual`: No automatic checkpoints

**3. Regenerate TRD with new configuration:**
```bash
# Update PRD frontmatter
# Regenerate TRD
/create-trd @docs/PRD/my-prd.md
```

---

### Issue: Delegation patterns not generated

**Symptom:**
Complex TRD missing multi-agent delegation section

**Possible Causes:**
1. TRD not complex enough (<20 tasks)
2. Delegation disabled in configuration
3. Tasks don't match delegation keywords

**Solutions:**

**1. Verify task count:**
```markdown
# Delegation auto-enabled for TRDs with ≥20 tasks
# Check your TRD task count

# If <20 tasks and delegation needed:
# Manually enable in PRD frontmatter
```

**2. Enable delegation in PRD:**
```yaml
---
workflow:
  delegation:
    enable_auto_delegation: true
---
```

**3. Add delegation keywords to tasks:**
```markdown
# ❌ Generic task (won't match)
- Implement feature X

# ✅ Specific task (matches backend pattern)
- Implement API endpoint for user authentication
```

---

## Quality Gate Failures

### Issue: Test coverage below threshold

**Symptom:**
```bash
npm run test:coverage
# Coverage: 75% (threshold: 80%)
# ❌ Quality gate failed
```

**Solutions:**

**1. Identify uncovered code:**
```bash
# Run coverage with detailed report
npm run test:coverage -- --verbose

# Check coverage report
open coverage/index.html
```

**2. Add missing tests:**
```javascript
// Example: Add unit tests for uncovered functions
describe('WorkflowGenerator', () => {
  it('should inject checkpoints at sprint boundaries', () => {
    // Test implementation
  });

  it('should generate commit templates', () => {
    // Test implementation
  });
});
```

**3. Re-run coverage:**
```bash
npm run test:coverage
# Coverage: 82% ✅
```

**4. If unable to reach threshold:**
```yaml
# Temporarily lower threshold in PRD (not recommended)
quality_gates:
  sprint:
    gates:
      - name: Unit Test Coverage
        type: test_coverage
        threshold: 75  # Lowered from 80
```

---

### Issue: Security scan failing

**Symptom:**
```bash
npm run security:scan
# High severity vulnerability found in package X
# ❌ Quality gate failed
```

**Solutions:**

**1. Update vulnerable packages:**
```bash
# Check for updates
npm audit

# Auto-fix if possible
npm audit fix

# Force update if needed
npm audit fix --force
```

**2. Review audit report:**
```bash
npm audit --json > audit-report.json
# Review report for specific vulnerabilities
```

**3. If no fix available:**
```bash
# Temporary workaround: Use alternative package
# Document decision in security exceptions

# Example: Switch from vulnerable package
npm uninstall vulnerable-package
npm install secure-alternative
```

**4. If false positive:**
```bash
# Add to audit exceptions (use cautiously)
# Document why vulnerability is not applicable

# Create .npmrc with audit exceptions
# Only for false positives or accepted risks
```

---

### Issue: E2E tests failing

**Symptom:**
```bash
npm run test:e2e
# Test suite failed: 5 of 10 tests failed
# ❌ Quality gate failed
```

**Solutions:**

**1. Run tests locally for debugging:**
```bash
# Run E2E tests in headed mode
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- tests/auth.spec.js
```

**2. Check test environment:**
```bash
# Verify test environment is running
# Example: Database seeded, services started

# Start services if needed
docker-compose up -d
npm run db:seed
```

**3. Review test failures:**
```bash
# Check test output for error messages
# Common issues:
# - Selector not found (UI changed)
# - Timeout (service slow/down)
# - Assertion failed (logic error)
```

**4. Fix failing tests:**
```javascript
// Example: Update selectors
// Old (broken):
await page.click('#submit-button');

// New (fixed):
await page.click('[data-testid="submit-button"]');
```

**5. Re-run tests:**
```bash
npm run test:e2e
# All tests passed ✅
```

---

## Git Checkpoint Issues

### Issue: Cannot create checkpoint commit

**Symptom:**
```bash
git commit -m "chore(sprint): complete sprint 1"
# Error: nothing to commit, working tree clean
```

**Possible Causes:**
1. No changes to commit
2. Changes not staged
3. Already committed

**Solutions:**

**1. Check git status:**
```bash
git status

# If "nothing to commit":
# - All changes already committed ✅
# - Mark checkpoint task complete
# - Continue to next sprint

# If "changes not staged":
git add .
git commit -m "chore(sprint): complete sprint 1"
```

**2. Verify previous commits:**
```bash
# Check if tasks already committed
git log --oneline -5

# If tasks committed individually:
# - This is fine ✅
# - Checkpoint commit may not be needed
# - Or create checkpoint commit as marker
```

---

### Issue: Push rejected

**Symptom:**
```bash
git push origin feature/my-branch
# ! [rejected]        feature/my-branch -> feature/my-branch (fetch first)
```

**Solutions:**

**1. Fetch and rebase:**
```bash
# Fetch latest changes
git fetch origin

# Rebase on remote branch
git rebase origin/feature/my-branch

# Resolve conflicts if any
# Then push
git push origin feature/my-branch
```

**2. Force push (if safe):**
```bash
# Only if you're sure remote changes can be overwritten
# Use --force-with-lease for safety
git push origin feature/my-branch --force-with-lease
```

**3. Merge instead of rebase:**
```bash
# Pull latest changes (merge)
git pull origin feature/my-branch

# Resolve conflicts if any
# Then push
git push origin feature/my-branch
```

---

### Issue: Commit message format rejected

**Symptom:**
```bash
git commit -m "wip"
# Error: Commit message does not follow Conventional Commits format
```

**Possible Causes:**
1. Git hook enforcing commit format
2. Message doesn't match required pattern

**Solutions:**

**1. Use conventional commit format:**
```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(auth): implement JWT validation"
git commit -m "fix(api): handle null response"
git commit -m "chore(sprint): complete sprint 1"
```

**2. If hook is too strict:**
```bash
# Bypass hook temporarily (not recommended)
git commit -m "wip" --no-verify

# Better: Fix commit message to match format
```

**3. Check hook configuration:**
```bash
# Review commit-msg hook
cat .git/hooks/commit-msg

# Update hook if needed
```

---

## Delegation Problems

### Issue: Cannot delegate tasks - dependencies not met

**Symptom:**
```bash
/delegate frontend-developer TASK-005 TASK-006 TASK-007
# Error: Cannot delegate - prerequisite tasks not complete
# Requires: TASK-001, TASK-002, TASK-003
```

**Solutions:**

**1. Complete prerequisite tasks:**
```bash
# Check delegation pattern dependencies in TRD
# Complete required tasks first

# Example: Complete schema tasks before template tasks
/delegate backend-developer TASK-001 TASK-002 TASK-003

# Wait for completion, then delegate template tasks
/delegate frontend-developer TASK-005 TASK-006 TASK-007
```

**2. Mark prerequisites as complete:**
```markdown
# Update TRD file
- [x] TASK-001: Create commit template schema
- [x] TASK-002: Create workflow section schema
- [x] TASK-003: Create PRD metadata schema

# Now delegation can proceed
```

---

### Issue: Delegated agent not producing expected output

**Symptom:**
Agent completes tasks but output doesn't meet requirements

**Solutions:**

**1. Review handoff context:**
```markdown
# Check delegation pattern in TRD
- **Handoff Context**: JSON Schema expertise required
- **Quality Requirements**: Valid schema, comprehensive examples
```

**2. Provide more specific instructions:**
```bash
# Instead of:
/delegate backend-developer TASK-001

# Provide explicit context:
/delegate backend-developer TASK-001 "Create JSON Schema draft-07 with comprehensive property definitions and validation constraints. Include examples for each property."
```

**3. Review and refine output:**
```bash
# After agent completes
git diff

# If output needs refinement:
# - Make manual adjustments
# - Or re-delegate with clearer instructions
```

---

### Issue: Orchestrator not delegating correctly

**Symptom:**
```bash
/orchestrate-tasks @docs/TRD/my-trd.md
# Tasks executed but not delegated to recommended agents
```

**Solutions:**

**1. Verify delegation patterns in TRD:**
```markdown
# Check TRD has delegation section
## Multi-Agent Delegation Patterns

### Schema Design Tasks
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003
```

**2. Enable delegation in PRD:**
```yaml
---
workflow:
  delegation:
    enable_auto_delegation: true
---
```

**3. Regenerate TRD with delegation:**
```bash
/create-trd @docs/PRD/my-prd.md --delegation
```

---

## PRD Metadata Issues

### Issue: Invalid YAML frontmatter

**Symptom:**
```bash
/create-trd @docs/PRD/my-prd.md
# Error: Invalid YAML frontmatter in PRD
```

**Possible Causes:**
1. YAML syntax errors
2. Invalid property values
3. Schema validation failures

**Solutions:**

**1. Validate YAML syntax:**
```bash
# Use online YAML validator
# http://www.yamllint.com/

# Or install yamllint
npm install -g yaml-lint
yaml-lint docs/PRD/my-prd.md
```

**2. Common YAML syntax errors:**
```yaml
# ❌ Missing quotes
checkpoint_frequency: every sprint

# ✅ Correct
checkpoint_frequency: sprint

# ❌ Incorrect indentation (using tabs)
workflow:
→ checkpoint_frequency: sprint

# ✅ Correct indentation (2 spaces)
workflow:
  checkpoint_frequency: sprint

# ❌ Missing colon
quality_gates
  sprint:

# ✅ Correct
quality_gates:
  sprint:
```

**3. Validate against schema:**
```bash
# Validate against prd-metadata.schema.json
ajv validate \
  -s src/trd-workflow/schemas/prd-metadata.schema.json \
  -d prd-frontmatter.yaml
```

---

### Issue: Unrecognized configuration option

**Symptom:**
```bash
/create-trd @docs/PRD/my-prd.md
# Warning: Unrecognized option 'custom_option' in workflow configuration
```

**Solutions:**

**1. Check valid options:**
```yaml
# Valid workflow options:
workflow:
  checkpoint_frequency: sprint | phase | manual | <number>
  execution_command: /implement-trd | /orchestrate-tasks | /build
  quality_gates: { ... }
  git_workflow: { ... }
  delegation: { ... }
  performance: { ... }

# Invalid option:
workflow:
  custom_option: value  # ❌ Not recognized
```

**2. Refer to schema:**
```bash
# Check schema for valid properties
cat src/trd-workflow/schemas/prd-metadata.schema.json
```

**3. Remove invalid options:**
```yaml
# Remove unrecognized options
# Use only documented configuration properties
```

---

## Performance Issues

### Issue: `/create-trd` command slow

**Symptom:**
Command takes >30 seconds to complete

**Possible Causes:**
1. Large PRD file
2. Complex task breakdown
3. System resource constraints

**Solutions:**

**1. Optimize PRD structure:**
```markdown
# Simplify acceptance criteria
# Break large features into multiple PRDs
# Reduce excessive detail in requirements
```

**2. Adjust performance settings:**
```yaml
---
workflow:
  performance:
    parallel_task_limit: 2  # Reduce from 3
    checkpoint_timeout: 180  # Reduce from 300
---
```

**3. Monitor system resources:**
```bash
# Check CPU/memory usage
top

# Close other applications
# Ensure adequate system resources
```

---

### Issue: Quality gates timing out

**Symptom:**
```bash
npm run test:coverage
# Timeout after 300 seconds
```

**Solutions:**

**1. Increase timeout:**
```yaml
---
workflow:
  performance:
    quality_gate_timeout: 900  # Increase from 600
---
```

**2. Optimize tests:**
```javascript
// Reduce test execution time
// - Use test parallelization
// - Mock slow operations
// - Optimize test setup/teardown
```

**3. Run tests separately:**
```bash
# Instead of full suite
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

---

## Getting Help

### Support Resources

**Documentation:**
- [Command Reference](./COMMAND_REFERENCE.md)
- [PRD Metadata Guide](./PRD_METADATA_GUIDE.md)
- [Workflow Execution Guide](./WORKFLOW_EXECUTION_GUIDE.md)
- [Best Practices](../training/BEST_PRACTICES.md)

**Community:**
- GitHub Issues: https://github.com/FortiumPartners/ai-mesh/issues
- Discord: [Join AI Mesh community]
- Email: support@fortiumpartners.com

**Reporting Bugs:**

When reporting issues, include:
1. AI Mesh version (`npx @fortium/ai-mesh --version`)
2. Command executed (exact command with parameters)
3. Error message (complete error output)
4. PRD frontmatter (if relevant)
5. Expected vs actual behavior
6. Steps to reproduce

**Example Bug Report:**
```markdown
## Bug Report

**Version**: AI Mesh 3.6.0

**Command**: `/create-trd @docs/PRD/authentication.md --workflow`

**Error**:
```
Error: Invalid YAML frontmatter in PRD
Line 5: Unexpected token
```

**PRD Frontmatter**:
```yaml
---
workflow:
  checkpoint_frequency sprint  # Missing colon
---
```

**Expected**: TRD generated with workflow section
**Actual**: Error about invalid YAML

**Steps to Reproduce**:
1. Create PRD with frontmatter (missing colon in line 5)
2. Run `/create-trd` command
3. Error occurs

**Environment**:
- OS: macOS 14.0
- Node: 18.17.0
- Claude Code: 1.2.3
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial beta release |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

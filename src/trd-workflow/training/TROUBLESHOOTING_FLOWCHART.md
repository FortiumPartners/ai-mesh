# TRD Workflow Troubleshooting Flowchart

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001

---

## Overview

This document provides decision trees and flowcharts for diagnosing and resolving common TRD workflow issues. Follow the flowcharts to quickly identify and fix problems.

### How to Use This Guide

1. Identify your issue category
2. Follow the decision tree
3. Apply the recommended solution
4. If issue persists, escalate to support

---

## Table of Contents

- [Command Execution Issues](#command-execution-issues)
- [Workflow Injection Issues](#workflow-injection-issues)
- [Quality Gate Failures](#quality-gate-failures)
- [Git Checkpoint Issues](#git-checkpoint-issues)
- [Delegation Issues](#delegation-issues)
- [Performance Issues](#performance-issues)

---

## Command Execution Issues

### Flowchart: /create-trd Command Not Working

```
START: Run /create-trd command
  ↓
[Does command appear in Claude Code?]
  ├─ NO → [AI Mesh installed?]
  │         ├─ NO → Install: npx @fortium/ai-mesh install --global
  │         │        ↓
  │         │      Restart Claude Code
  │         │        ↓
  │         │      Try command again → SUCCESS ✓
  │         │
  │         └─ YES → [Commands directory exists?]
  │                    ├─ NO → Reinstall AI Mesh
  │                    │        ↓
  │                    │      SUCCESS ✓
  │                    │
  │                    └─ YES → Restart Claude Code
  │                              ↓
  │                            Try command again
  │                              ↓
  │                            [Works now?]
  │                              ├─ YES → SUCCESS ✓
  │                              └─ NO → Contact support
  │
  └─ YES → [Command executes?]
            ├─ NO → [Error message shown?]
            │         ├─ YES → See error-specific flowchart below
            │         └─ NO → Check Claude Code logs
            │
            └─ YES → [TRD file created?]
                      ├─ YES → SUCCESS ✓
                      └─ NO → See "TRD Output Issues" flowchart
```

### Flowchart: Error Messages

```
ERROR MESSAGE RECEIVED
  ↓
[Error type?]
  ├─ "File not found" → [PRD file exists?]
  │                       ├─ NO → Create PRD file
  │                       │        ↓
  │                       │      SUCCESS ✓
  │                       │
  │                       └─ YES → [Using correct path?]
  │                                 ├─ NO → Use absolute path
  │                                 │        ↓
  │                                 │      Try again → SUCCESS ✓
  │                                 │
  │                                 └─ YES → [File readable?]
  │                                           ├─ NO → Fix permissions: chmod 644
  │                                           │        ↓
  │                                           │      SUCCESS ✓
  │                                           │
  │                                           └─ YES → Contact support
  │
  ├─ "Invalid YAML" → [Frontmatter present?]
  │                     ├─ NO → Frontmatter optional, check PRD content
  │                     │        ↓
  │                     │      Fix PRD syntax → SUCCESS ✓
  │                     │
  │                     └─ YES → [YAML syntax valid?]
  │                               ├─ NO → Validate at yamllint.com
  │                               │        ↓
  │                               │      Fix syntax errors
  │                               │        ↓
  │                               │      Try again → SUCCESS ✓
  │                               │
  │                               └─ YES → [Schema valid?]
  │                                         ├─ NO → Check against schema
  │                                         │        ↓
  │                                         │      Fix validation errors
  │                                         │        ↓
  │                                         │      SUCCESS ✓
  │                                         │
  │                                         └─ YES → Contact support
  │
  └─ "Permission denied" → [Output directory writable?]
                             ├─ NO → Create directory: mkdir -p @docs/TRD/
                             │        ↓
                             │      Fix permissions: chmod 755
                             │        ↓
                             │      Try again → SUCCESS ✓
                             │
                             └─ YES → [Disk space available?]
                                       ├─ NO → Free up disk space
                                       │        ↓
                                       │      SUCCESS ✓
                                       │
                                       └─ YES → Contact support
```

---

## Workflow Injection Issues

### Flowchart: No Workflow Section Generated

```
TRD GENERATED BUT NO WORKFLOW SECTION
  ↓
[Workflow injection enabled?]
  ├─ NO → Enable with --workflow flag
  │        ↓
  │      /create-trd @docs/PRD/my-prd.md --workflow
  │        ↓
  │      SUCCESS ✓
  │
  └─ YES → [PRD frontmatter disables workflow?]
            ├─ YES → Remove workflow.enabled: false
            │         ↓
            │       Or set workflow.enabled: true
            │         ↓
            │       Regenerate TRD → SUCCESS ✓
            │
            └─ NO → [AI Mesh version ≥3.6.0?]
                      ├─ NO → Update AI Mesh
                      │        ↓
                      │      npx @fortium/ai-mesh install --global
                      │        ↓
                      │      Try again → SUCCESS ✓
                      │
                      └─ YES → Contact support
```

### Flowchart: Wrong Checkpoint Frequency

```
TOO MANY OR TOO FEW CHECKPOINTS
  ↓
[Expected frequency?]
  ├─ More checkpoints → [Current setting?]
  │                       ├─ phase → Change to sprint
  │                       │           ↓
  │                       │         Regenerate TRD → SUCCESS ✓
  │                       │
  │                       ├─ sprint → Change to task-based (e.g., 5)
  │                       │           ↓
  │                       │         Regenerate TRD → SUCCESS ✓
  │                       │
  │                       └─ manual → Change to sprint
  │                                   ↓
  │                                 Regenerate TRD → SUCCESS ✓
  │
  └─ Fewer checkpoints → [Current setting?]
                           ├─ task-based → Change to sprint or phase
                           │               ↓
                           │             Regenerate TRD → SUCCESS ✓
                           │
                           ├─ sprint → Change to phase
                           │           ↓
                           │         Regenerate TRD → SUCCESS ✓
                           │
                           └─ phase → Already minimal
                                      ↓
                                    Use manual if needed → SUCCESS ✓
```

---

## Quality Gate Failures

### Flowchart: Quality Gate Failing

```
QUALITY GATE FAILED
  ↓
[Which gate failed?]
  ├─ Test Coverage → [Current coverage?]
  │                    ├─ Below threshold → [Identify uncovered code]
  │                    │                      ↓
  │                    │                    npm run test:coverage -- --verbose
  │                    │                      ↓
  │                    │                    [Add missing tests]
  │                    │                      ↓
  │                    │                    Re-run coverage
  │                    │                      ↓
  │                    │                    [Now passing?]
  │                    │                      ├─ YES → SUCCESS ✓
  │                    │                      └─ NO → Review threshold
  │                    │                               ↓
  │                    │                             [Threshold realistic?]
  │                    │                               ├─ NO → Adjust in PRD
  │                    │                               │        ↓
  │                    │                               │      SUCCESS ✓
  │                    │                               └─ YES → Continue adding tests
  │                    │
  │                    └─ Above threshold → False alarm
  │                                         ↓
  │                                       Check gate configuration
  │                                         ↓
  │                                       SUCCESS ✓
  │
  ├─ Security Scan → [Vulnerabilities found?]
  │                    ├─ YES → [Severity?]
  │                    │         ├─ High/Critical → [Fix available?]
  │                    │         │                    ├─ YES → npm audit fix
  │                    │         │                    │        ↓
  │                    │         │                    │      Re-run scan → SUCCESS ✓
  │                    │         │                    │
  │                    │         │                    └─ NO → [Alternative package?]
  │                    │         │                              ├─ YES → Switch package
  │                    │         │                              │        ↓
  │                    │         │                              │      SUCCESS ✓
  │                    │         │                              │
  │                    │         │                              └─ NO → Document risk
  │                    │         │                                       ↓
  │                    │         │                                     Get approval
  │                    │         │                                       ↓
  │                    │         │                                     Add exception
  │                    │         │                                       ↓
  │                    │         │                                     SUCCESS ✓
  │                    │         │
  │                    │         └─ Low/Medium → [Can defer?]
  │                    │                           ├─ YES → Document for later
  │                    │                           │        ↓
  │                    │                           │      Continue → SUCCESS ✓
  │                    │                           │
  │                    │                           └─ NO → Fix before proceeding
  │                    │                                    ↓
  │                    │                                  SUCCESS ✓
  │                    │
  │                    └─ NO → False positive
  │                             ↓
  │                           Check scan configuration
  │                             ↓
  │                           SUCCESS ✓
  │
  └─ E2E Tests → [Tests failing?]
                   ├─ YES → [Run locally in headed mode]
                   │          ↓
                   │        npm run test:e2e -- --headed
                   │          ↓
                   │        [Identify failure cause]
                   │          ├─ Selector not found → Update selectors
                   │          │                         ↓
                   │          │                       SUCCESS ✓
                   │          │
                   │          ├─ Timeout → [Service running?]
                   │          │             ├─ NO → Start services
                   │          │             │        ↓
                   │          │             │      SUCCESS ✓
                   │          │             │
                   │          │             └─ YES → Increase timeout
                   │          │                      ↓
                   │          │                    SUCCESS ✓
                   │          │
                   │          └─ Assertion failed → Fix logic error
                   │                                 ↓
                   │                               SUCCESS ✓
                   │
                   └─ NO → False alarm
                            ↓
                          Check test configuration
                            ↓
                          SUCCESS ✓
```

---

## Git Checkpoint Issues

### Flowchart: Cannot Create Checkpoint Commit

```
CANNOT CREATE CHECKPOINT COMMIT
  ↓
[What's the error?]
  ├─ "Nothing to commit" → [Tasks completed?]
  │                          ├─ NO → Complete tasks first
  │                          │        ↓
  │                          │      Then commit → SUCCESS ✓
  │                          │
  │                          └─ YES → [Changes staged?]
  │                                    ├─ NO → git add .
  │                                    │        ↓
  │                                    │      git commit → SUCCESS ✓
  │                                    │
  │                                    └─ YES → [Already committed?]
  │                                              ├─ YES → Mark checkpoint complete
  │                                              │        ↓
  │                                              │      Continue → SUCCESS ✓
  │                                              │
  │                                              └─ NO → git status
  │                                                       ↓
  │                                                     Check working tree
  │                                                       ↓
  │                                                     Resolve issue
  │
  ├─ "Push rejected" → [Fetch latest changes]
  │                      ↓
  │                    git fetch origin
  │                      ↓
  │                    [Rebase or merge?]
  │                      ├─ Rebase → git rebase origin/feature-branch
  │                      │            ↓
  │                      │          [Conflicts?]
  │                      │            ├─ YES → Resolve conflicts
  │                      │            │        ↓
  │                      │            │      git rebase --continue
  │                      │            │        ↓
  │                      │            │      Push → SUCCESS ✓
  │                      │            │
  │                      │            └─ NO → Push → SUCCESS ✓
  │                      │
  │                      └─ Merge → git pull origin feature-branch
  │                                   ↓
  │                                 [Conflicts?]
  │                                   ├─ YES → Resolve conflicts
  │                                   │        ↓
  │                                   │      Commit merge
  │                                   │        ↓
  │                                   │      Push → SUCCESS ✓
  │                                   │
  │                                   └─ NO → Push → SUCCESS ✓
  │
  └─ "Commit format invalid" → [Using conventional commits?]
                                  ├─ NO → Use format: type(scope): subject
                                  │        ↓
                                  │      Recommit → SUCCESS ✓
                                  │
                                  └─ YES → [Hook enforcing format?]
                                            ├─ YES → Follow required format
                                            │        ↓
                                            │      Or bypass (not recommended)
                                            │        ↓
                                            │      SUCCESS ✓
                                            │
                                            └─ NO → Check commit message
                                                     ↓
                                                   Fix and retry → SUCCESS ✓
```

---

## Delegation Issues

### Flowchart: Delegation Not Working

```
DELEGATION ISSUE
  ↓
[What's the problem?]
  ├─ No delegation patterns → [TRD complex enough?]
  │                             ├─ NO (< 20 tasks) → Expected behavior
  │                             │                      ↓
  │                             │                    Manual delegation if needed
  │                             │                      ↓
  │                             │                    SUCCESS ✓
  │                             │
  │                             └─ YES (≥ 20 tasks) → [Delegation enabled in PRD?]
  │                                                     ├─ NO → Enable delegation
  │                                                     │        ↓
  │                                                     │      Regenerate TRD
  │                                                     │        ↓
  │                                                     │      SUCCESS ✓
  │                                                     │
  │                                                     └─ YES → [Tasks have keywords?]
  │                                                               ├─ NO → Add keywords
  │                                                               │        ↓
  │                                                               │      SUCCESS ✓
  │                                                               │
  │                                                               └─ YES → Contact support
  │
  ├─ Dependencies not met → [Prerequisite tasks complete?]
  │                           ├─ NO → Complete prerequisites first
  │                           │        ↓
  │                           │      Then delegate → SUCCESS ✓
  │                           │
  │                           └─ YES → [Tasks marked complete in TRD?]
  │                                     ├─ NO → Mark tasks complete
  │                                     │        ↓
  │                                     │      Retry delegation → SUCCESS ✓
  │                                     │
  │                                     └─ YES → Contact support
  │
  └─ Poor agent output → [Handoff context clear?]
                           ├─ NO → Provide more specific context
                           │        ↓
                           │      Re-delegate with details
                           │        ↓
                           │      SUCCESS ✓
                           │
                           └─ YES → [Quality requirements specified?]
                                     ├─ NO → Add quality requirements
                                     │        ↓
                                     │      Re-delegate → SUCCESS ✓
                                     │
                                     └─ YES → Review and refine manually
                                              ↓
                                            SUCCESS ✓
```

---

## Performance Issues

### Flowchart: Slow Command Execution

```
COMMAND EXECUTION SLOW (>30 seconds)
  ↓
[Which command?]
  ├─ /create-trd → [PRD size?]
  │                  ├─ Large (>500 lines) → Expected, optimize PRD
  │                  │                         ↓
  │                  │                       Break into smaller PRDs
  │                  │                         ↓
  │                  │                       SUCCESS ✓
  │                  │
  │                  └─ Normal (<500 lines) → [System resources?]
  │                                             ├─ Low → Close applications
  │                                             │        ↓
  │                                             │      Retry → SUCCESS ✓
  │                                             │
  │                                             └─ OK → [First run?]
  │                                                      ├─ YES → Normal (cold start)
  │                                                      │        ↓
  │                                                      │      SUCCESS ✓
  │                                                      │
  │                                                      └─ NO → Contact support
  │
  └─ Quality gates → [Which gate?]
                       ├─ Test coverage → [Test suite size?]
                       │                    ├─ Large → Optimize tests
                       │                    │          ↓
                       │                    │        Use parallelization
                       │                    │          ↓
                       │                    │        SUCCESS ✓
                       │                    │
                       │                    └─ Normal → Increase timeout
                       │                                ↓
                       │                              SUCCESS ✓
                       │
                       └─ E2E tests → [Number of tests?]
                                        ├─ Many → Run in parallel
                                        │         ↓
                                        │       SUCCESS ✓
                                        │
                                        └─ Few → [Test timeout?]
                                                  ├─ Too low → Increase
                                                  │            ↓
                                                  │          SUCCESS ✓
                                                  │
                                                  └─ OK → Check test efficiency
                                                           ↓
                                                         Optimize
                                                           ↓
                                                         SUCCESS ✓
```

---

## Escalation Path

### When to Contact Support

Contact support if:
1. ✓ You've followed the flowchart completely
2. ✓ Issue persists after trying all solutions
3. ✓ Issue is blocking critical work
4. ✓ You encounter an error not covered in flowcharts

### Information to Provide

When contacting support, include:

**Required Information:**
- AI Mesh version: `npx @fortium/ai-mesh --version`
- Command executed: (exact command with parameters)
- Error message: (complete error output)
- PRD frontmatter: (if relevant)
- Steps to reproduce

**Example Support Request:**

```
Subject: /create-trd fails with "Invalid YAML" error

AI Mesh Version: 3.6.0
Command: /create-trd @docs/PRD/authentication.md --workflow

Error:
```
Error: Invalid YAML frontmatter in PRD
Line 5: Unexpected token ':'
```

PRD Frontmatter:
```yaml
---
workflow:
  checkpoint_frequency: sprint
---
```

Steps to Reproduce:
1. Create PRD with frontmatter above
2. Run /create-trd command
3. Error occurs

Expected: TRD generated with workflow section
Actual: Error about invalid YAML

I've validated the YAML at yamllint.com and it appears valid.
```

---

## Quick Reference

### Common Issues & Solutions

| Issue | Quick Fix |
|-------|-----------|
| Command not found | Reinstall AI Mesh, restart Claude Code |
| File not found | Use absolute path |
| Invalid YAML | Validate at yamllint.com |
| No workflow section | Add `--workflow` flag |
| Too many checkpoints | Change `checkpoint_frequency` to `phase` |
| Test coverage failing | Add more unit tests |
| Security scan failing | Run `npm audit fix` |
| Push rejected | Fetch and rebase: `git fetch && git rebase` |
| Dependencies not met | Complete prerequisite tasks first |

---

## Related Documentation

- [Troubleshooting Guide](../docs/TROUBLESHOOTING.md) - Detailed solutions
- [Command Reference](../docs/COMMAND_REFERENCE.md) - Command documentation
- [Best Practices](./BEST_PRACTICES.md) - Recommended practices

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial troubleshooting flowchart |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

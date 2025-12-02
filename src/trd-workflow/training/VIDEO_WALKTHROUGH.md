# TRD Workflow System - Video Walkthrough Script

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001
**Duration**: ~15 minutes
**Audience**: Developers, Technical Leads, Product Teams

---

## Overview

This document provides a detailed script and outline for creating a video walkthrough of the TRD Workflow System. Since we cannot create actual video content, this markdown-based guide serves as a comprehensive script that can be used to produce video tutorials or live demonstrations.

### Video Structure

1. **Introduction** (2 minutes)
2. **Creating a TRD with Workflow** (4 minutes)
3. **Understanding Workflow Sections** (3 minutes)
4. **Executing Checkpoints** (4 minutes)
5. **Quality Gates and Delegation** (2 minutes)
6. **Conclusion** (1 minute)

---

## Part 1: Introduction (2 minutes)

### Scene 1: Title Screen

**Visual**: Title card with "TRD Workflow System - Complete Guide"

**Narration**:
> "Welcome to the TRD Workflow System guide. In this walkthrough, we'll explore how to transform Product Requirements Documents into comprehensive Technical Requirements Documents with built-in git workflow guidance."

### Scene 2: Problem Statement

**Visual**: Split screen showing:
- Left: Traditional TRD without workflow guidance
- Right: TRD with workflow sections (highlighted)

**Narration**:
> "Traditional TRDs outline what to build, but often lack guidance on how to execute the implementation. Teams struggle with questions like: When should I commit my work? What quality gates should I check? How do I coordinate with other developers?"

### Scene 3: Solution Overview

**Visual**: Animated diagram showing:
```
PRD → /create-trd → TRD with:
  - Git Checkpoints
  - Quality Gates
  - Commit Templates
  - Delegation Patterns
```

**Narration**:
> "The TRD Workflow System solves this by automatically injecting strategic git checkpoints, quality gates, and execution guidance directly into your TRD. Let's see how it works."

---

## Part 2: Creating a TRD with Workflow (4 minutes)

### Scene 4: Starting with a PRD

**Visual**: Screen recording of PRD file in editor

**Narration**:
> "We start with a Product Requirements Document. Here's a PRD for an authentication system."

**On-Screen Text Display**:
```markdown
# PRD: JWT Authentication System

## Goals
- Implement secure JWT-based authentication
- Support token refresh mechanism
- Provide user login/logout functionality

## Acceptance Criteria
- Users can register with email/password
- Users can log in and receive JWT token
- Protected endpoints validate JWT
- Token refresh before expiry
```

### Scene 5: Adding PRD Metadata

**Visual**: Editor showing YAML frontmatter being added to PRD

**Narration**:
> "First, we add optional metadata to control workflow behavior. This YAML frontmatter tells the system to create checkpoints after each sprint and enforce quality gates."

**On-Screen Typing**:
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

    final:
      enabled: true
      gates:
        - name: E2E Tests
          type: e2e_test
          required: true
---
```

### Scene 6: Running /create-trd Command

**Visual**: Claude Code interface

**Narration**:
> "Now we run the /create-trd command to convert our PRD into a TRD."

**On-Screen Action**:
```
User types: /create-trd @docs/PRD/authentication.md
Claude Code processes...
```

**Visual**: Progress indicators showing:
- ✓ Parsing PRD
- ✓ Analyzing requirements
- ✓ Generating task breakdown
- ✓ Injecting checkpoints
- ✓ Creating workflow section
- ✓ Generating commit templates

### Scene 7: Generated TRD Overview

**Visual**: Split screen showing PRD (left) vs generated TRD (right)

**Narration**:
> "The system has generated a comprehensive TRD with all the standard sections plus our new workflow sections."

**Highlight sections** (animated highlighting):
- System Context
- Architecture Overview
- **Implementation Tasks** ← with checkpoints
- **Execution Workflow** ← new section
- **Commit Message Templates** ← new section

---

## Part 3: Understanding Workflow Sections (3 minutes)

### Scene 8: Implementation Tasks with Checkpoints

**Visual**: Scrolling through Implementation Tasks section

**Narration**:
> "The Implementation Tasks section now includes automatic checkpoint tasks at strategic points."

**On-Screen Display** (with annotations):
```markdown
### Phase 1: Authentication Foundation
#### Sprint 1.1: User Model & Database (5 tasks, 12 hours)
- [ ] TASK-001: Create user model schema (2 hours)
- [ ] TASK-002: Implement password hashing (2 hours)
- [ ] TASK-003: Create user repository (3 hours)
- [ ] TASK-004: Add database migrations (3 hours)
- [ ] TASK-005: Unit tests for user model (2 hours)
- [ ] TASK-1.6: Git checkpoint - Sprint 1 complete (0.5 hours) ← AUTOMATIC
```

**Annotation callout**: "Checkpoint automatically added after sprint tasks"

### Scene 9: Execution Workflow Section

**Visual**: Execution Workflow section with highlighting

**Narration**:
> "The Execution Workflow section provides complete implementation guidance."

**Animated highlights showing each component**:

1. **TRD Complexity**:
   ```markdown
   **TRD Complexity**: Simple (15 tasks across 2 sprints)
   **Recommended Execution Command**: `/implement-trd`
   ```
   Annotation: "System analyzes complexity and recommends approach"

2. **Git Workflow**:
   ```markdown
   **Branch Naming**: feature/auth-001-jwt-authentication
   **Checkpoint Strategy**: Automatic checkpoints after each sprint
   ```
   Annotation: "Clear branch naming and checkpoint strategy"

3. **Git Checkpoints**:
   ```markdown
   #### Checkpoint 0: Sprint 1 Complete
   - **After**: TASK-1.6
   - **Sprint**: 1
   - **Suggested Commit**: `chore(sprint): complete sprint 1 foundation`
   ```
   Annotation: "Each checkpoint has detailed instructions"

4. **Quality Gates**:
   ```markdown
   #### Sprint Level
   - [ ] Unit test coverage ≥ 80%
   - [ ] Security scan - No high-severity findings
   ```
   Annotation: "Validation requirements at each checkpoint"

### Scene 10: Commit Message Templates

**Visual**: Commit Message Templates section

**Narration**:
> "The TRD includes ready-to-use commit message templates following Conventional Commits."

**On-Screen Display**:
```markdown
### Sprint Checkpoint Commits
```
chore(sprint): complete sprint 1 foundation

- Create user model schema (TASK-001)
- Implement password hashing (TASK-002)
- Create user repository (TASK-003)

Related: TRD-AUTH-001, Sprint 1
Quality Gates: ✅ Test coverage 85% | ✅ Security scan passed
```
```

**Annotation**: "Copy-paste ready commit messages"

---

## Part 4: Executing Checkpoints (4 minutes)

### Scene 11: Starting Implementation

**Visual**: Terminal/IDE with git branch creation

**Narration**:
> "Let's implement this TRD. First, we create our feature branch following the recommended naming."

**On-Screen Terminal**:
```bash
$ git checkout -b feature/auth-001-jwt-authentication
Switched to a new branch 'feature/auth-001-jwt-authentication'
```

### Scene 12: Executing Tasks

**Visual**: Claude Code with /implement-trd command

**Narration**:
> "We use the recommended execution command to start implementation."

**On-Screen Action**:
```
User types: /implement-trd @docs/TRD/authentication-trd.md

Claude Code responds:
"Starting TRD implementation...
Sprint 1.1: User Model & Database (5 tasks, 12 hours)

Ready to implement:
- TASK-001: Create user model schema (2 hours)

Proceed with implementation? [Yes/No]"
```

**Visual**: Fast-forward montage showing:
- Tasks being completed
- Checkboxes being marked
- Code being written
- Tests being created

### Scene 13: Reaching a Checkpoint

**Visual**: TRD showing checkpoint task

**Narration**:
> "After completing Sprint 1 tasks, we reach our first checkpoint."

**On-Screen Display**:
```markdown
- [x] TASK-001: Create user model schema (2 hours)
- [x] TASK-002: Implement password hashing (2 hours)
- [x] TASK-003: Create user repository (3 hours)
- [x] TASK-004: Add database migrations (3 hours)
- [x] TASK-005: Unit tests for user model (2 hours)
- [ ] TASK-1.6: Git checkpoint - Sprint 1 complete (0.5 hours) ← WE ARE HERE
```

### Scene 14: Running Quality Gates

**Visual**: Terminal showing quality gate execution

**Narration**:
> "Before creating our checkpoint commit, we run the quality gates."

**On-Screen Terminal Session**:
```bash
# Step 1: Run test coverage
$ npm run test:coverage
=============================== Coverage summary ===============================
Statements   : 87% ( 174/200 )
Branches     : 85% ( 42/50 )
Functions    : 90% ( 45/50 )
Lines        : 87% ( 174/200 )
================================================================================
✅ PASS - Coverage exceeds 80% threshold

# Step 2: Run security scan
$ npm run security:scan
found 0 vulnerabilities
✅ PASS - No security issues

# Step 3: Run linter
$ npm run lint
✅ PASS - No linting errors
```

**Annotation**: "All quality gates passed - ready to commit"

### Scene 15: Creating Checkpoint Commit

**Visual**: Terminal showing git commit

**Narration**:
> "With all quality gates passing, we create our checkpoint commit using the provided template."

**On-Screen Terminal**:
```bash
$ git add .
$ git commit -m "$(cat <<'EOF'
chore(sprint): complete sprint 1 foundation

- Create user model schema (TASK-001)
- Implement password hashing (TASK-002)
- Create user repository (TASK-003)
- Add database migrations (TASK-004)
- Unit tests for user model (TASK-005)

Related: TRD-AUTH-001, Sprint 1
Quality Gates: ✅ Test coverage 87% | ✅ Security scan passed
EOF
)"

[feature/auth-001-jwt-authentication abc1234] chore(sprint): complete sprint 1 foundation
 8 files changed, 342 insertions(+)
 create mode 100644 src/models/User.ts
 create mode 100644 src/repositories/UserRepository.ts
 create mode 100644 tests/models/User.test.ts
 ...

$ git push origin feature/auth-001-jwt-authentication
Enumerating objects: 25, done.
Counting objects: 100% (25/25), done.
To github.com:company/auth-service.git
 * [new branch]      feature/auth-001-jwt-authentication -> feature/auth-001-jwt-authentication
```

**Annotation**: "Checkpoint commit created and pushed"

### Scene 16: Marking Checkpoint Complete

**Visual**: TRD being updated

**Narration**:
> "Finally, we mark the checkpoint task as complete in our TRD."

**On-Screen Action**:
```markdown
- [x] TASK-1.6: Git checkpoint - Sprint 1 complete (0.5 hours) ✓
```

---

## Part 5: Quality Gates and Delegation (2 minutes)

### Scene 17: Complex TRD Example

**Visual**: Large TRD with 50+ tasks

**Narration**:
> "For complex TRDs with 20 or more tasks, the system generates additional guidance."

**Highlight sections**:
- Multi-Agent Delegation Patterns
- Phase-level quality gates
- Performance expectations

### Scene 18: Multi-Agent Delegation

**Visual**: Delegation section in TRD

**Narration**:
> "The system analyzes task types and recommends which agents should handle specific work."

**On-Screen Display**:
```markdown
## Multi-Agent Delegation Patterns

### Frontend Tasks (8 tasks, 20 hours)
- **Delegate to**: `frontend-developer`
- **Task IDs**: TASK-010, TASK-015, TASK-020, ...
- **Handoff Context**: React component development with hooks
- **Execution Command**: `/delegate frontend-developer TASK-010 TASK-015...`

### Backend Tasks (12 tasks, 30 hours)
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003, ...
- **Handoff Context**: API development with NestJS
- **Execution Command**: `/delegate backend-developer TASK-001 TASK-002...`
```

**Annotation**: "Automatic task routing for efficient parallel execution"

### Scene 19: Phase-Level Quality Gates

**Visual**: Quality gates section showing different levels

**Narration**:
> "Complex projects have quality gates at multiple levels - sprint, phase, and final."

**On-Screen Display** (animated reveal):
```markdown
#### Sprint Level (After Each Sprint)
- [ ] Unit test coverage ≥ 80%
- [ ] Security scan

#### Phase Level (After Each Phase)
- [ ] Integration test coverage ≥ 70%
- [ ] Performance validation
- [ ] API documentation complete

#### Final (Before Completion)
- [ ] Full test suite ≥ 85%
- [ ] E2E tests passing
- [ ] Security audit complete
- [ ] Documentation complete
```

**Annotation**: "Progressive quality validation throughout implementation"

---

## Part 6: Conclusion (1 minute)

### Scene 20: Benefits Summary

**Visual**: Animated infographic showing benefits

**Narration**:
> "The TRD Workflow System provides:"

**On-Screen Bullets** (animated reveal):
- ✓ **Clear execution guidance** - No more guessing when to commit
- ✓ **Automated quality gates** - Ensure standards at every step
- ✓ **Consistent commit messages** - Follow best practices automatically
- ✓ **Efficient coordination** - Multi-agent delegation for complex work
- ✓ **Progress tracking** - Clear milestones and checkpoints

### Scene 21: Getting Started

**Visual**: Command reference and links

**Narration**:
> "Ready to try it yourself? Start with a simple PRD, add workflow metadata, and run /create-trd."

**On-Screen Display**:
```
Getting Started:
1. Create or open a PRD
2. Add workflow frontmatter (optional)
3. Run: /create-trd @docs/PRD/your-prd.md
4. Follow the workflow sections

Resources:
- Command Reference: src/trd-workflow/docs/COMMAND_REFERENCE.md
- Execution Guide: src/trd-workflow/docs/WORKFLOW_EXECUTION_GUIDE.md
- Best Practices: src/trd-workflow/training/BEST_PRACTICES.md
```

### Scene 22: Closing

**Visual**: Thank you screen with contact info

**Narration**:
> "Thank you for watching. For more information, check out the documentation links in the description. Happy building!"

**On-Screen Text**:
```
TRD Workflow System v1.0.0-beta

Documentation: github.com/FortiumPartners/ai-mesh
Support: support@fortiumpartners.com
Community: [Discord/Slack link]
```

---

## Production Notes

### Required Assets

**Screen Recordings:**
1. PRD file in code editor (with syntax highlighting)
2. Claude Code interface running /create-trd
3. Generated TRD file (scrolling through sections)
4. Terminal showing git operations
5. Test coverage output
6. Security scan output
7. Git commit and push

**Annotations/Overlays:**
- Callout boxes for key concepts
- Highlighting for important sections
- Progress indicators
- Code syntax highlighting
- Animated arrows/pointers

**Audio:**
- Professional narration (script provided above)
- Background music (subtle, non-intrusive)
- Sound effects for checkmarks and completion

### Technical Specifications

**Video Format:**
- Resolution: 1920x1080 (1080p)
- Frame rate: 30fps
- Format: MP4 (H.264)
- Aspect ratio: 16:9

**Audio:**
- Sample rate: 48kHz
- Bitrate: 192kbps
- Format: AAC

**Captions:**
- Include closed captions (SRT/VTT)
- Highlight key terms
- Include code snippets in captions

### Distribution Channels

1. **YouTube**: Main platform with chapters/timestamps
2. **Company Website**: Embedded player
3. **Documentation**: Linked from docs
4. **Social Media**: Short clips for Twitter/LinkedIn
5. **Training Platform**: Full video for onboarding

### Companion Materials

Create alongside video:
- **PDF Handout**: Key points and commands
- **Cheat Sheet**: Quick reference card
- **Sample Files**: Example PRD and generated TRD
- **Practice Exercises**: Hands-on tasks

---

## Chapter Markers (for YouTube)

```
0:00 - Introduction
0:30 - Problem Statement
1:00 - Solution Overview
2:00 - Creating a PRD
3:00 - Adding Workflow Metadata
4:00 - Running /create-trd
5:00 - Understanding Workflow Sections
6:00 - Implementation Tasks with Checkpoints
7:00 - Execution Workflow
8:00 - Commit Templates
9:00 - Executing Checkpoints
10:00 - Running Quality Gates
11:00 - Creating Checkpoint Commit
12:00 - Complex TRD Features
13:00 - Multi-Agent Delegation
14:00 - Conclusion
14:30 - Getting Started
```

---

## Practice Exercise

**Hands-On Challenge** (to accompany video):

1. **Setup** (5 minutes):
   - Install AI Mesh: `npx @fortium/ai-mesh install --global`
   - Create sample PRD in `@docs/PRD/practice-auth.md`

2. **Add Workflow Metadata** (5 minutes):
   - Add YAML frontmatter with sprint checkpoints
   - Configure quality gates

3. **Generate TRD** (2 minutes):
   - Run `/create-trd @docs/PRD/practice-auth.md`
   - Review generated workflow sections

4. **Execute First Sprint** (15 minutes):
   - Create feature branch
   - Implement 3-5 simple tasks
   - Run quality gates
   - Create checkpoint commit

5. **Review** (3 minutes):
   - Verify checkpoint commit in git log
   - Check quality gate results
   - Mark checkpoint complete in TRD

**Expected Outcome**:
Participants complete a full sprint cycle with checkpoint commit following best practices.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial video script |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

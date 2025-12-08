# Technical Requirements Document (TRD) Template

**Version**: 2.0.0 (With Workflow Sections)
**Updated**: December 2, 2025
**Changes**: Added Execution Workflow and Commit Message Templates sections

---

## System Context & Constraints
### Current Architecture
- System overview
- Integration points
- Dependencies

### Technical Constraints
- Framework/language requirements
- Infrastructure limitations
- Security policies
- Performance requirements

---

## Architecture Overview
### High-Level Design
- System components
- Data flow diagrams
- Integration patterns

### Data Models
- Entity relationships
- Schema changes
- Migration strategy

---

## Interfaces & Data Contracts
### API Specifications
- REST/GraphQL endpoints
- Request/response formats
- Error handling
- Versioning strategy

### External Integrations
- Third-party services
- Authentication flows
- Data synchronization

---

## Non-functional Requirements
### Performance
- Response time targets (e.g., p95 < 200ms)
- Throughput requirements
- Scalability considerations
- Resource utilization limits

### Security
- Authentication/authorization
- Data protection
- Input validation
- Security scanning requirements

### Reliability & Observability
- Uptime targets
- Error handling strategy
- Monitoring and alerting
- Logging requirements
- Disaster recovery

---

## Implementation Tasks

### Phase 1: [Phase Name]
#### Sprint 1.1: [Sprint Name] (X tasks, Y hours)
- [ ] TASK-001: [Task description] (X hours)
- [ ] TASK-002: [Task description] (X hours)
- [ ] TASK-003: [Task description] (X hours)
...
- [ ] TASK-1.X: Git checkpoint - Sprint 1 complete (0.5 hours)

#### Sprint 1.2: [Sprint Name] (X tasks, Y hours)
- [ ] TASK-004: [Task description] (X hours)
...

### Phase 2: [Phase Name]
...

---

## Execution Workflow

**TRD Complexity**: [Simple|Complex] (X tasks across Y sprints, Z phases)

**Recommended Execution Command**: `/implement-trd` | `/orchestrate-tasks`

**Recommended Approach**: [Execution strategy based on complexity]

### Git Workflow

**Branch Naming**: `feature/{trd-id}-{description}`

**Checkpoint Strategy**: Automatic checkpoints after each [sprint|phase|N tasks]

### Git Checkpoints (X total)

#### Checkpoint 0: Sprint 1 Complete
- **After**: TASK-1.X
- **Sprint**: 1
- **Type**: sprint_checkpoint
- **Suggested Commit**:
  ```
  chore(sprint): complete sprint 1 [description]

  - [Task description] (TASK-001)
  - [Task description] (TASK-002)
  - [Task description] (TASK-003)

  Related: [TRD-ID], Sprint 1
  ```
- **Quality Gates**:
  - [ ] Unit test coverage ≥ 80%
  - [ ] Security scan - No high-severity findings
  - [ ] Code review completed (if required)

#### Checkpoint 1: Sprint 2 Complete
- **After**: TASK-2.X
- **Sprint**: 2
- **Type**: sprint_checkpoint
- **Suggested Commit**: [Similar format]
- **Quality Gates**: [Similar requirements]

...

### Quality Gates

#### Sprint Level (After Each Sprint)
- [ ] **Unit Test Coverage**: ≥ 80% coverage for all new code
  - **Command**: `npm run test:coverage`
  - **Required**: Yes
- [ ] **Security Scan**: No high-severity vulnerabilities
  - **Command**: `npm run security:scan` or `npm audit`
  - **Required**: Yes
- [ ] **Linting**: No ESLint/Prettier errors
  - **Command**: `npm run lint`
  - **Required**: Yes

#### Phase Level (After Each Phase)
- [ ] **Integration Tests**: ≥ 70% coverage for integration scenarios
  - **Command**: `npm run test:integration`
  - **Required**: Yes
- [ ] **Performance Validation**: Response times meet targets
  - **Command**: `npm run test:performance`
  - **Required**: Based on requirements
- [ ] **API Documentation**: OpenAPI/Swagger spec up to date
  - **Required**: Yes (for API changes)

#### Final (Before Completion)
- [ ] **Full Test Suite**: ≥ 85% overall coverage
  - **Command**: `npm run test:all`
  - **Required**: Yes
- [ ] **E2E Tests**: All end-to-end scenarios passing
  - **Command**: `npm run test:e2e`
  - **Required**: Yes
- [ ] **Security Audit**: Comprehensive security review
  - **Command**: `npm run security:audit`
  - **Required**: Yes
- [ ] **Documentation Complete**: All docs updated
  - **Required**: Yes
- [ ] **Deployment Readiness**: Production deployment checklist
  - **Required**: Yes

### Multi-Agent Delegation Patterns

> **Note**: This section is auto-generated for complex TRDs (≥20 tasks) when delegation is enabled.

#### [Task Category] Tasks (X tasks, Y hours)
- **Delegate to**: `[agent-name]`
- **Task IDs**: TASK-XXX, TASK-YYY, TASK-ZZZ
- **Handoff Context**: [Domain expertise required]
- **Quality Requirements**: [Specific quality criteria]
- **Dependencies**: [Prerequisite tasks]
- **Execution Command**: `/delegate [agent-name] TASK-XXX TASK-YYY TASK-ZZZ`

### Execution Steps

1. **Setup**: Create feature branch using recommended naming pattern
2. **Implementation**: Execute tasks using recommended command
3. **Checkpoints**: Follow checkpoint instructions at designated tasks
4. **Quality Validation**: Run quality gates before checkpoint commits
5. **Delegation**: Use multi-agent delegation for complex task categories
6. **Completion**: Verify all quality gates pass before final merge

### Performance Expectations

- **Parallel Task Limit**: [Number of tasks to execute in parallel]
- **Checkpoint Timeout**: [Maximum time for checkpoint execution]
- **Quality Gate Timeout**: [Maximum time for quality gate validation]

---

## Commit Message Templates

### Sprint Checkpoint Commits

**Format**:
```
chore(sprint): complete sprint {N} {brief-description}

{detailed description if needed}

{completed tasks list}

Related: {TRD-ID}, Sprint {N}
Quality Gates: {gate results}
```

**Example**:
```
chore(sprint): complete sprint 1 foundation

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001, Sprint 1
Quality Gates: ✅ Test coverage 85% | ✅ Security scan passed
```

### Phase Checkpoint Commits

**Format**:
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

**Example**:
```
chore(phase): complete phase 1 schema design

Phase 1 deliverables complete:
- JSON Schema definitions (3 schemas)
- Handlebars templates (2 templates)

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

### Feature Commits (Regular Development)

**Format**:
```
{type}({scope}): {subject}

{body - detailed explanation}

{completed tasks if applicable}

Related: {TRD-ID}
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance, build, etc.

**Example**:
```
feat(schemas): add JSON Schema definitions

Implement foundational schemas for TRD workflow system:
- Commit message template schema with Conventional Commits support
- Workflow section schema with conditional rendering
- PRD metadata schema for YAML frontmatter configuration

All schemas validated against JSON Schema draft-07 specification.

- Create commit template schema (TASK-001)
- Create workflow section schema (TASK-002)
- Create PRD metadata schema (TASK-003)

Related: TRD-WORKFLOW-001
```

---

## Test Strategy
### Unit Testing
- Coverage targets (≥80%)
- Testing frameworks
- Mock strategy

### Integration Testing
- API contract testing
- Database integration
- External service mocking
- Coverage targets (≥70%)

### End-to-End Testing
- User journey coverage
- Cross-browser testing
- Performance testing
- Accessibility testing

---

## Deployment & Migration Notes
### Deployment Strategy
- Rollout plan
- Feature flags
- Rollback procedures
- Monitoring checkpoints

### Database Migrations
- Schema changes
- Data migration scripts
- Backward compatibility
- Rollback strategy

### Infrastructure Requirements
- Resource provisioning
- Configuration changes
- Environment setup

---

## Template Usage Notes

### New Sections in v2.0.0

This updated template includes two new sections for TRD workflow integration:

1. **Execution Workflow** - Provides implementation guidance including:
   - Git checkpoint locations and commit templates
   - Quality gate requirements at each level
   - Multi-agent delegation patterns (for complex TRDs)
   - Execution strategy and performance expectations

2. **Commit Message Templates** - Conventional commit templates for:
   - Sprint checkpoint commits
   - Phase checkpoint commits
   - Feature commits during regular development

### When to Use This Template

- **For New TRDs**: Use `/create-trd` command which auto-populates these sections
- **For Existing TRDs**: Manually add Execution Workflow and Commit Message Templates sections
- **For Simple Projects**: Execution Workflow section can be simplified (fewer quality gates, no delegation)

### Customization

- **Checkpoint Frequency**: Adjust based on project needs (sprint, phase, or custom)
- **Quality Gates**: Add/remove gates based on project requirements
- **Delegation Patterns**: Only needed for complex TRDs (≥20 tasks)
- **Commit Templates**: Customize to match your team's conventions

---

**Template Version**: 2.0.0
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team

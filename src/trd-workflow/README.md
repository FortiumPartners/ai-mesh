# TRD Workflow Integration - Schema & Template Documentation

**Version**: 1.0.0
**Created**: December 1, 2025
**TRD Reference**: TRD-WORKFLOW-001
**Status**: Implementation Ready

---

## Overview

This directory contains the foundational schemas and templates for the TRD Generation Git Workflow Integration system. These components enable automatic injection of git workflow guidance and execution instructions into generated Technical Requirements Documents.

### Purpose

The TRD workflow integration system solves critical workflow gaps by:
- Injecting strategic git checkpoint tasks after each sprint and at phase boundaries
- Generating execution workflow sections with command recommendations and quality gates
- Providing conventional commit message templates tailored to project context
- Supporting PRD metadata configuration for workflow customization
- Specifying multi-agent delegation patterns based on task type detection

### Components

```
src/trd-workflow/
├── schemas/                          # JSON Schema definitions
│   ├── commit-template.schema.json   # Commit message template validation
│   ├── workflow-section.schema.json  # Workflow section template validation
│   └── prd-metadata.schema.json      # PRD frontmatter configuration validation
├── templates/                        # Handlebars templates
│   ├── commit-message.hbs           # Conventional commit template
│   └── workflow-section.hbs         # TRD workflow section template
└── README.md                        # This documentation
```

---

## Schema Specifications

### 1. Commit Template Schema

**File**: `schemas/commit-template.schema.json`

Defines the structure for commit message templates with TRD integration.

#### Key Properties

- **`templateId`**: Unique identifier (kebab-case)
- **`version`**: Semantic version (e.g., "1.0.0")
- **`format`**: Template engine ("handlebars" or "mustache")
- **`variables`**: Available template variables
  - `commit_type`: Type of commit (feat, fix, docs, etc.)
  - `commit_scope`: Optional scope
  - `commit_subject`: Brief description
  - `commit_body`: Detailed explanation
  - `completed_tasks`: Array of task objects
  - `trd_id`: TRD identifier
  - `sprint_number`, `phase_number`: Sprint/phase references
- **`templates`**: Template definitions by type
  - `default`: Base template
  - `feat`, `fix`, `docs`, etc.: Type-specific templates
  - `sprint_checkpoint`, `phase_checkpoint`: Checkpoint templates
- **`validation`**: Validation rules for commit messages

#### Example Template Definition

```json
{
  "templateId": "conventional-commits-trd",
  "version": "1.0.0",
  "format": "handlebars",
  "variables": {
    "commit_type": {
      "description": "Type of commit following Conventional Commits",
      "allowed_values": ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
      "default": "chore"
    },
    "commit_scope": {
      "description": "Scope of changes (e.g., api, ui, auth)",
      "pattern": "^[a-z][a-z0-9-]*$",
      "optional": true
    },
    "commit_subject": {
      "description": "Brief description of changes",
      "constraints": {
        "max_length": 72,
        "case": "lowercase",
        "end_with_period": false
      }
    }
  },
  "templates": {
    "default": {
      "description": "Standard commit message template",
      "template": "{{commit_type}}{{#if commit_scope}}({{commit_scope}}){{/if}}: {{commit_subject}}\n\n{{#if completed_tasks}}{{#each completed_tasks}}- {{this.description}} ({{this.id}})\n{{/each}}\n{{/if}}Related: {{trd_id}}",
      "example": "feat(auth): implement JWT token validation\n\n- Add token verification middleware (TASK-001)\n- Create refresh token endpoint (TASK-002)\n\nRelated: TRD-AUTH-001"
    },
    "sprint_checkpoint": {
      "description": "Sprint completion checkpoint commit",
      "template": "chore(sprint): complete sprint {{sprint_number}} tasks\n\n{{#each completed_tasks}}- {{this.description}} ({{this.id}})\n{{/each}}\nRelated: {{trd_id}}, Sprint {{sprint_number}}",
      "example": "chore(sprint): complete sprint 1 tasks\n\n- Setup authentication framework (TASK-001)\n- Create user model (TASK-002)\n- Implement login endpoint (TASK-003)\n\nRelated: TRD-AUTH-001, Sprint 1"
    }
  },
  "validation": {
    "enforce_type": true,
    "subject_max_length": 72,
    "body_required": false
  }
}
```

### 2. Workflow Section Schema

**File**: `schemas/workflow-section.schema.json`

Defines the structure for TRD workflow section templates with conditional rendering.

#### Key Properties

- **`templateId`**: Unique identifier
- **`version`**: Semantic version
- **`format`**: Template engine format
- **`variables`**: Template variables
  - `trd_id`: TRD identifier
  - `task_count`: Total task count
  - `sprint_count`, `phase_count`: Organizational structure
  - `execution_command`: Recommended command
  - `quality_gates`: Quality gate definitions
  - `delegation_patterns`: Agent delegation patterns
  - `git_checkpoints`: Checkpoint definitions
  - `is_simple_trd`, `is_complex_trd`: Complexity flags
- **`sections`**: Template variants
  - `default`: Base template
  - `simple_trd`: For TRDs with <20 tasks
  - `complex_trd`: For TRDs with 20+ tasks
  - `multi_phase`: For multi-phase TRDs
- **`conditionalRendering`**: Conditional logic configuration
- **`components`**: Reusable template components

#### Example Section Definition

```json
{
  "templateId": "trd-workflow-section",
  "version": "1.0.0",
  "format": "handlebars",
  "variables": {
    "trd_id": {
      "description": "TRD identifier",
      "type": "string",
      "pattern": "^TRD-[A-Z0-9-]+$"
    },
    "task_count": {
      "description": "Total number of implementation tasks",
      "type": "number",
      "min": 1
    },
    "is_simple_trd": {
      "description": "Whether this is a simple TRD (<20 tasks)",
      "type": "boolean",
      "condition": "task_count < 20"
    }
  },
  "sections": {
    "simple_trd": {
      "description": "Workflow section for simple TRDs",
      "template": "## Implementation Workflow\n\n**Execution**: `{{execution_command}}`\n\n{{#each git_checkpoints}}\n### Checkpoint {{@index}}: {{this.name}}\n- After: {{this.after_task}}\n{{/each}}",
      "conditions": ["task_count < 20"],
      "output_format": "markdown"
    },
    "complex_trd": {
      "description": "Workflow section for complex TRDs with multi-agent orchestration",
      "template": "## Implementation Workflow\n\n**Complexity**: Complex ({{task_count}} tasks)\n**Execution**: `{{execution_command}}`\n\n### Multi-Agent Delegation\n{{#each delegation_patterns}}\n- **{{this.task_type}}** → {{this.agent}}\n{{/each}}",
      "conditions": ["task_count >= 20"],
      "output_format": "markdown"
    }
  },
  "conditionalRendering": {
    "enableConditionals": true,
    "defaultSection": "default",
    "evaluationOrder": ["multi_phase", "complex_trd", "simple_trd", "default"]
  }
}
```

### 3. PRD Metadata Schema

**File**: `schemas/prd-metadata.schema.json`

Defines the YAML frontmatter structure for PRD workflow configuration.

#### Key Properties

- **`workflow`**: Workflow configuration
  - **`checkpoint_frequency`**: When to create git checkpoints
    - `"sprint"`: After each sprint (default)
    - `"phase"`: After each phase
    - `number`: Every N tasks
    - `"manual"`: No automatic checkpoints
  - **`execution_command`**: Recommended command
    - `/implement-trd` (default): Standard implementation
    - `/orchestrate-tasks`: Multi-agent orchestration
    - `/build`: Legacy build command
  - **`quality_gates`**: Quality gate configurations
    - `sprint`: Sprint-level gates
    - `phase`: Phase-level gates
    - `final`: Final gates before completion
  - **`git_workflow`**: Git configuration
    - `branch_naming`: Branch naming pattern
    - `commit_conventions`: Commit message rules
    - `checkpoint_strategy`: Checkpoint creation strategy
  - **`delegation`**: Multi-agent delegation patterns
  - **`performance`**: Performance settings
- **`metadata`**: General PRD metadata

#### Example PRD Frontmatter

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

    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
      checkpoint_after_phase: true

  delegation:
    enable_auto_delegation: true
    patterns:
      - task_type: frontend
        agent: frontend-developer
      - task_type: backend
        agent: backend-developer
      - task_type: infrastructure
        agent: infrastructure-developer

metadata:
  version: 1.0.0
  author: Product Team
  priority: high
  status: approved
---

# Product Requirements Document

...
```

---

## Template Usage

### Commit Message Template

**File**: `templates/commit-message.hbs`

This Handlebars template generates conventional commit messages with TRD integration.

#### Variables

```javascript
{
  commit_type: "feat",
  commit_scope: "auth",
  commit_subject: "implement JWT token validation",
  commit_body: "Add comprehensive JWT validation with refresh token support",
  completed_tasks: [
    { id: "TASK-001", description: "Add token verification middleware" },
    { id: "TASK-002", description: "Create refresh token endpoint" }
  ],
  trd_id: "TRD-AUTH-001",
  sprint_number: 1,
  breaking_change: false
}
```

#### Output

```
feat(auth): implement JWT token validation

Add comprehensive JWT validation with refresh token support

- Add token verification middleware (TASK-001)
- Create refresh token endpoint (TASK-002)

Related: TRD-AUTH-001, Sprint 1
```

### Workflow Section Template

**File**: `templates/workflow-section.hbs`

This template generates the implementation workflow section for TRD documents.

#### Variables

```javascript
{
  trd_id: "TRD-WORKFLOW-001",
  task_count: 64,
  sprint_count: 3,
  phase_count: 4,
  execution_command: "/implement-trd",
  recommended_approach: "Use orchestrated multi-agent approach with incremental checkpoints",
  is_simple_trd: false,
  is_complex_trd: true,
  branch_pattern: "feature/trd-workflow-001-git-integration",
  git_checkpoints: [
    {
      name: "Sprint 1 Complete",
      after_task: "TASK-1.8",
      sprint_number: 1,
      type: "sprint_checkpoint",
      commit_template: "chore(sprint): complete sprint 1 foundation",
      quality_gates: [
        { name: "Unit Test Coverage", threshold: 80 }
      ]
    }
  ],
  quality_gates: [
    {
      level: "Sprint",
      checkpoint_id: "Sprint 1 Complete",
      gates: [
        {
          name: "Unit Test Coverage",
          description: "All new code must have unit tests",
          type: "test_coverage",
          threshold: 80,
          required: true
        }
      ]
    }
  ],
  delegation_patterns: [
    {
      task_type: "Schema Design",
      agent: "backend-developer",
      task_ids: ["TASK-001", "TASK-002", "TASK-003"],
      handoff_context: "JSON Schema expertise required",
      quality_requirements: "Valid JSON Schema draft-07"
    }
  ]
}
```

#### Output

See the full rendered output in the `workflow-section.hbs` template. It includes:
- Execution approach (simple vs. complex)
- Git workflow with branch naming and checkpoints
- Quality gates by level
- Multi-agent delegation patterns
- Execution steps
- Performance expectations

---

## Validation

All schemas can be validated using standard JSON Schema validators.

### Node.js Validation Example

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

// Load schema
const commitSchema = require('./schemas/commit-template.schema.json');

// Validate data
const data = {
  templateId: "my-commit-template",
  version: "1.0.0",
  format: "handlebars",
  variables: { /* ... */ },
  templates: { /* ... */ }
};

const validate = ajv.compile(commitSchema);
const valid = validate(data);

if (!valid) {
  console.error(validate.errors);
}
```

### CLI Validation Example

```bash
# Using ajv-cli
npm install -g ajv-cli

# Validate a commit template
ajv validate -s schemas/commit-template.schema.json -d my-template.json

# Validate PRD frontmatter
ajv validate -s schemas/prd-metadata.schema.json -d prd-config.yaml
```

---

## Integration with `/create-trd`

These schemas and templates will be integrated into the `/create-trd` command pipeline:

```
PRD Input
  ↓
[1] PRD Parser
  ↓ (extracts frontmatter using prd-metadata.schema.json)
[2] Metadata Extractor
  ↓
[3] Workflow Config
  ↓ (task analysis and checkpoint injection)
[4] Checkpoint Injector
  ↓ (renders workflow section using workflow-section.hbs)
[5] Workflow Generator
  ↓ (renders commit templates using commit-message.hbs)
[6] Template Renderer
  ↓
TRD Output File
```

---

## Design Decisions

### 1. JSON Schema Draft-07

**Decision**: Use JSON Schema draft-07 format for all schemas.

**Rationale**:
- Wide tooling support (validators, generators, documentation)
- Consistent with existing `schemas/agent-schema.json`
- Comprehensive validation capabilities (patterns, constraints, conditionals)

### 2. Handlebars Template Format

**Decision**: Use Handlebars as the primary template engine with Mustache compatibility.

**Rationale**:
- More powerful than Mustache (helpers, conditionals, loops)
- Backward compatible with Mustache syntax
- Extensive ecosystem and tooling
- Better support for complex conditional rendering

### 3. Conditional Rendering

**Decision**: Support template variants based on TRD complexity (simple vs. complex).

**Rationale**:
- Simple TRDs (<20 tasks) need minimal workflow guidance
- Complex TRDs (20+ tasks) benefit from detailed orchestration patterns
- Conditional sections reduce noise in generated TRDs
- Flexibility for different project types

### 4. PRD Frontmatter Configuration

**Decision**: Use YAML frontmatter in PRD files for workflow configuration.

**Rationale**:
- Non-intrusive (separates metadata from content)
- Human-readable and easy to edit
- Industry standard (Jekyll, Hugo, many documentation systems)
- Easy to parse and validate

### 5. Modular Components

**Decision**: Define reusable template components for workflow sections.

**Rationale**:
- DRY principle (Don't Repeat Yourself)
- Easier maintenance and updates
- Consistent formatting across TRDs
- Allows customization without full template rewrites

### 6. Validation Rules

**Decision**: Include comprehensive validation rules in schemas.

**Rationale**:
- Catch errors early in development
- Ensure consistency across generated TRDs
- Provide clear feedback to template authors
- Enable automated testing and quality assurance

---

## Examples

### Example 1: Simple TRD (15 tasks, 2 sprints)

**PRD Configuration**:
```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd
---
```

**Generated Workflow Section** (excerpt):
```markdown
## Implementation Workflow

**TRD Complexity**: Simple (15 tasks across 2 sprints)

**Recommended Execution Command**: `/implement-trd`

**Recommended Approach**: Execute all tasks in sequence using the standard implementation workflow.

### Git Checkpoints (2 total):

#### Checkpoint 0: Sprint 1 Complete
- **After**: TASK-1.5
- **Sprint**: 1
- **Type**: sprint_checkpoint
```

### Example 2: Complex TRD (64 tasks, 3 sprints, 4 phases)

**PRD Configuration**:
```yaml
---
workflow:
  checkpoint_frequency: phase
  execution_command: /orchestrate-tasks
  delegation:
    enable_auto_delegation: true
---
```

**Generated Workflow Section** (excerpt):
```markdown
## Implementation Workflow

**TRD Complexity**: Complex (64 tasks across 3 sprints, 4 phases)

**Recommended Execution Command**: `/orchestrate-tasks`

**Recommended Approach**: Use the orchestrated multi-agent approach with:
- Sprint-level quality gates after each sprint completion
- Git checkpoints at phase boundaries for clear progress tracking
- Multi-agent delegation based on task type
- Incremental testing and validation at each checkpoint

### Multi-Agent Delegation Patterns

#### Schema Design Tasks
- **Delegate to**: `backend-developer`
- **Task IDs**: TASK-001, TASK-002, TASK-003
```

---

## Next Steps

### Phase 1, Sprint 1.1 (Current)
- ✅ TASK-001: Commit message template schema
- ✅ TASK-002: Workflow section template schema
- ✅ TASK-003: PRD metadata configuration schema
- 🔄 TASK-004: Git checkpoint (next)

### Phase 1, Sprint 1.2 (Next)
- TASK-005: Template engine integration
- TASK-006: Checkpoint injection logic
- TASK-007: Workflow section generator
- TASK-008: Git checkpoint

### Future Enhancements
- Custom helper functions for complex rendering logic
- Template validation utilities
- Interactive template editor
- Template library with community contributions

---

## References

- **TRD**: @docs/TRD/trd-workflow-integration-trd.md
- **Conventional Commits**: https://www.conventionalcommits.org/
- **JSON Schema**: https://json-schema.org/draft-07/
- **Handlebars**: https://handlebarsjs.com/
- **Existing Schemas**: @schemas/agent-schema.json, @schemas/command-schema.json

---

**Document Version**: 1.0.0
**Last Updated**: December 1, 2025
**Maintainer**: Fortium Software Configuration Team

# PRD: ai-mesh Plugin Architecture Migration

**Document Version**: 1.0.0
**Created**: 2025-12-04
**Author**: Product Management Orchestrator
**Status**: Draft
**Priority**: High
**Epic**: Platform Evolution

---

## Executive Summary

### Problem Statement

The ai-mesh project has grown into a comprehensive toolkit with 26 agents, 12+ commands, multiple skills, and a hooks system. Currently distributed as a monolithic NPM package (`@fortium/ai-mesh`), this architecture creates several challenges:

1. **All-or-nothing installation**: Users must install everything even if they only need a subset
2. **Large context overhead**: The comprehensive CLAUDE.md file consumes significant context
3. **Slow iteration cycles**: Changing one agent requires a full package release
4. **Discovery problem**: Users struggle to find relevant functionality
5. **Version coupling**: All components share a single version number
6. **No selective updates**: Cannot update just one functional area

Meanwhile, Claude Code has introduced a mature **plugin system** with marketplace-based distribution, manifest-driven configuration, and support for bundling commands, agents, skills, hooks, and MCP servers.

### Solution

Migrate ai-mesh from a monolithic NPM package to a **modular plugin ecosystem** aligned with Claude Code's native extensibility model. This involves:

1. Breaking the monolith into ~12 focused plugins with clear boundaries
2. Creating a Fortium plugin marketplace for distribution
3. Maintaining a meta-package for users who want "everything"
4. Preserving backwards compatibility during transition

### Value Proposition

| Stakeholder | Benefit |
|-------------|---------|
| **End Users** | Install only what they need; faster updates; better discovery |
| **Teams** | Standardized plugin sets per project; easier onboarding |
| **Contributors** | Smaller, focused codebases; independent release cycles |
| **Fortium** | Faster iteration; clearer metrics per plugin; reduced support burden |

---

## User Analysis

### Primary Users

#### 1. Individual Developers
- **Profile**: Solo developers or small team members using Claude Code
- **Current Pain**: Overwhelmed by 26 agents; unsure what's relevant
- **Desired State**: Install a focused set matching their stack (e.g., React + Jest + Git)

#### 2. Team Leads / DevOps
- **Profile**: Responsible for standardizing team tooling
- **Current Pain**: Can't enforce which ai-mesh features teams should use
- **Desired State**: Define required plugins in `.claude/settings.json` for auto-installation

#### 3. Enterprise Architects
- **Profile**: Security-conscious organizations with approval workflows
- **Current Pain**: Must approve entire monolith; can't granularly allow/deny
- **Desired State**: Approve specific plugins; block others via managed settings

#### 4. Plugin Contributors
- **Profile**: Community members wanting to extend ai-mesh
- **Current Pain**: Must fork entire project; complex contribution process
- **Desired State**: Create independent plugins that integrate with ecosystem

### User Personas

#### "Alex" - Full-Stack Developer
- Uses React frontend, NestJS backend
- Wants: ai-mesh-core, ai-mesh-development, ai-mesh-react, ai-mesh-nestjs
- Doesn't need: Rails, Blazor, Phoenix, infrastructure plugins

#### "Jordan" - DevOps Engineer
- Manages Kubernetes clusters, Helm charts, CI/CD
- Wants: ai-mesh-core, ai-mesh-infrastructure, ai-mesh-git
- Doesn't need: Frontend frameworks, test runners for languages they don't use

#### "Sam" - Engineering Manager
- Reviews team productivity, ensures quality standards
- Wants: ai-mesh-core, ai-mesh-quality, ai-mesh-metrics
- Values: Dashboard visibility, code review enforcement

---

## Goals & Non-Goals

### Goals

1. **G1**: Decompose ai-mesh into ~12 focused plugins with clear boundaries
2. **G2**: Create Fortium plugin marketplace for centralized discovery
3. **G3**: Enable selective installation (`/plugin install ai-mesh-development`)
4. **G4**: Support inter-plugin dependencies with version constraints
5. **G5**: Maintain backwards compatibility via meta-package
6. **G6**: Reduce per-plugin context overhead by 70%+
7. **G7**: Enable independent versioning and release cycles
8. **G8**: Provide team-level plugin standardization via settings

### Non-Goals

- **NG1**: Rewrite agent/command logic (preserve existing functionality)
- **NG2**: Change the underlying agent architecture (YAML → different format)
- **NG3**: Create a custom plugin runtime (use Claude Code's native system)
- **NG4**: Build a web-based plugin marketplace UI (Git-based is sufficient)
- **NG5**: Support plugins outside the Fortium ecosystem initially

### Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin count | 12 core + 8 framework/test plugins | Release tracking |
| Average plugin size | <500KB | Package analysis |
| Context reduction per plugin | 70%+ vs monolith | Token counting |
| Installation success rate | 99%+ | Telemetry |
| User adoption | 50% migrate to plugins within 6 months | Usage metrics |
| Independent releases | Each plugin released independently | Release log |
| Backwards compatibility | Zero breaking changes for existing users | Issue tracking |

---

## Plugin Architecture

### Plugin Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ai-mesh Plugin Ecosystem                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TIER 1: FOUNDATION                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      @fortium/ai-mesh-core                       │    │
│  │  Required base plugin - all others depend on this                │    │
│  │                                                                   │    │
│  │  Agents:                                                          │    │
│  │  • ai-mesh-orchestrator (chief coordinator)                      │    │
│  │  • general-purpose (ambiguous task handler)                      │    │
│  │  • context-fetcher (documentation retrieval)                     │    │
│  │  • file-creator (template scaffolding)                           │    │
│  │                                                                   │    │
│  │  Commands:                                                        │    │
│  │  • /fold-prompt (project optimization)                           │    │
│  │                                                                   │    │
│  │  Infrastructure:                                                  │    │
│  │  • Base configuration system                                      │    │
│  │  • Plugin dependency resolver                                     │    │
│  │  • Shared utilities                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  TIER 2: WORKFLOW PLUGINS (depend on core)                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ ai-mesh-     │ │ ai-mesh-     │ │ ai-mesh-     │ │ ai-mesh-     │   │
│  │ product      │ │ development  │ │ quality      │ │ infrastructure│   │
│  │              │ │              │ │              │ │              │   │
│  │ Agents:      │ │ Agents:      │ │ Agents:      │ │ Agents:      │   │
│  │ • product-   │ │ • tech-lead  │ │ • code-      │ │ • infra-     │   │
│  │   mgmt-orch  │ │ • frontend   │ │   reviewer   │ │   developer  │   │
│  │ • doc-spec   │ │ • backend    │ │ • test-runner│ │ • deploy-orch│   │
│  │              │ │              │ │ • qa-orch    │ │ • build-orch │   │
│  │ Commands:    │ │ Commands:    │ │ • deep-debug │ │              │   │
│  │ • /create-prd│ │ • /create-trd│ │              │ │ Skills:      │   │
│  │ • /analyze   │ │ • /implement │ │              │ │ • helm       │   │
│  │ • /plan      │ │              │ │              │ │ • kubernetes │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ │ • flyio      │   │
│                                                      └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                     │
│  │ ai-mesh-     │ │ ai-mesh-     │ │ ai-mesh-     │                     │
│  │ git          │ │ e2e-testing  │ │ metrics      │                     │
│  │              │ │              │ │              │                     │
│  │ Agents:      │ │ Agents:      │ │ Agents:      │                     │
│  │ • git-       │ │ • playwright │ │ • dashboard  │                     │
│  │   workflow   │ │   -tester    │ │   -agent     │                     │
│  │ • github-    │ │              │ │              │                     │
│  │   specialist │ │ MCP:         │ │ Hooks:       │                     │
│  │ • release-   │ │ • Playwright │ │ • tool-      │                     │
│  │   agent      │ │   integration│ │   metrics    │                     │
│  │              │ │              │ │ • session    │                     │
│  │              │ │              │ │              │                     │
│  │              │ │              │ │ Commands:    │                     │
│  │              │ │              │ │ • /dashboard │                     │
│  └──────────────┘ └──────────────┘ └──────────────┘                     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ai-mesh-pane-viewer (NEW - standalone utility)                    │   │
│  │ • PreToolUse hook for Task interception                          │   │
│  │ • WezTerm / Zellij / tmux adapters                               │   │
│  │ • Agent output viewer                                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  TIER 3: FRAMEWORK PLUGINS (depend on core, optionally development)     │
│  ┌────────────┐┌────────────┐┌────────────┐┌────────────┐┌────────────┐│
│  │ ai-mesh-   ││ ai-mesh-   ││ ai-mesh-   ││ ai-mesh-   ││ ai-mesh-   ││
│  │ react      ││ nestjs     ││ rails      ││ phoenix    ││ blazor     ││
│  │            ││            ││            ││            ││            ││
│  │ Skills:    ││ Skills:    ││ Skills:    ││ Skills:    ││ Skills:    ││
│  │ • React    ││ • NestJS   ││ • Rails    ││ • Phoenix  ││ • Blazor   ││
│  │   patterns ││   modules  ││   MVC      ││   LiveView ││   .NET     ││
│  │ • Hooks    ││ • DI       ││ • AR       ││ • Elixir   ││   patterns ││
│  │ • State    ││ • Guards   ││ • Jobs     ││   patterns ││            ││
│  └────────────┘└────────────┘└────────────┘└────────────┘└────────────┘│
│                                                                          │
│  TIER 4: TEST FRAMEWORK PLUGINS (depend on core, optionally quality)    │
│  ┌────────────┐┌────────────┐┌────────────┐┌────────────┐┌────────────┐│
│  │ ai-mesh-   ││ ai-mesh-   ││ ai-mesh-   ││ ai-mesh-   ││ ai-mesh-   ││
│  │ jest       ││ pytest     ││ rspec      ││ xunit      ││ exunit     ││
│  │            ││            ││            ││            ││            ││
│  │ Skills:    ││ Skills:    ││ Skills:    ││ Skills:    ││ Skills:    ││
│  │ • Jest     ││ • pytest   ││ • RSpec    ││ • xUnit    ││ • ExUnit   ││
│  │   mocking  ││   fixtures ││   let/desc ││   FluentAs ││   async    ││
│  │ • React    ││ • parametr ││ • mocking  ││   Moq      ││   setup    ││
│  │   Testing  ││            ││            ││            ││            ││
│  └────────────┘└────────────┘└────────────┘└────────────┘└────────────┘│
│                                                                          │
│  META-PACKAGE (for "install everything" users)                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     @fortium/ai-mesh-full                         │   │
│  │  Dependencies: all Tier 1-4 plugins                               │   │
│  │  Equivalent to current monolithic installation                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Plugin Dependency Graph

```
ai-mesh-core (foundation - no dependencies)
    │
    ├── ai-mesh-product
    │       └── (optional) ai-mesh-development
    │
    ├── ai-mesh-development
    │       └── (optional) ai-mesh-quality
    │
    ├── ai-mesh-quality
    │       └── (optional) ai-mesh-e2e-testing
    │
    ├── ai-mesh-infrastructure
    │
    ├── ai-mesh-git
    │
    ├── ai-mesh-e2e-testing
    │       └── (requires) MCP Playwright server
    │
    ├── ai-mesh-metrics
    │
    ├── ai-mesh-pane-viewer
    │       └── (optional) ai-mesh-metrics
    │
    ├── ai-mesh-react ─────────┐
    ├── ai-mesh-nestjs ────────┤
    ├── ai-mesh-rails ─────────┼── Framework plugins (independent)
    ├── ai-mesh-phoenix ───────┤
    └── ai-mesh-blazor ────────┘

    ├── ai-mesh-jest ──────────┐
    ├── ai-mesh-pytest ────────┤
    ├── ai-mesh-rspec ─────────┼── Test framework plugins (independent)
    ├── ai-mesh-xunit ─────────┤
    └── ai-mesh-exunit ────────┘
```

---

## Detailed Plugin Specifications

### Tier 1: Foundation

#### @fortium/ai-mesh-core

**Purpose**: Required base providing orchestration, shared utilities, and configuration.

**Contents**:
| Type | Items |
|------|-------|
| Agents | ai-mesh-orchestrator, general-purpose, context-fetcher, file-creator |
| Commands | /fold-prompt |
| Skills | framework-detector, test-detector, tooling-detector |
| Config | Base configuration schema, plugin resolver |

**Size Target**: <200KB

**plugin.json**:
```json
{
  "name": "ai-mesh-core",
  "version": "4.0.0",
  "description": "Core orchestration and utilities for ai-mesh ecosystem",
  "author": { "name": "Fortium Partners" },
  "repository": "https://github.com/FortiumPartners/ai-mesh-core",
  "keywords": ["orchestration", "agents", "core"],
  "agents": "./agents",
  "commands": "./commands",
  "skills": "./skills"
}
```

---

### Tier 2: Workflow Plugins

#### @fortium/ai-mesh-product

**Purpose**: Product planning, requirements, and documentation workflows.

**Contents**:
| Type | Items |
|------|-------|
| Agents | product-management-orchestrator, documentation-specialist |
| Commands | /create-prd, /analyze-product, /plan-product |

**Dependencies**: ai-mesh-core >=4.0.0

**Size Target**: <100KB

---

#### @fortium/ai-mesh-development

**Purpose**: Technical planning and implementation workflows.

**Contents**:
| Type | Items |
|------|-------|
| Agents | tech-lead-orchestrator, frontend-developer, backend-developer |
| Commands | /create-trd, /implement-trd |

**Dependencies**: ai-mesh-core >=4.0.0

**Size Target**: <150KB

---

#### @fortium/ai-mesh-quality

**Purpose**: Code review, testing, and quality assurance.

**Contents**:
| Type | Items |
|------|-------|
| Agents | code-reviewer, test-runner, qa-orchestrator, deep-debugger |
| Commands | (none - agents invoked via orchestration) |

**Dependencies**: ai-mesh-core >=4.0.0

**Size Target**: <120KB

---

#### @fortium/ai-mesh-infrastructure

**Purpose**: Cloud infrastructure, Kubernetes, and deployment automation.

**Contents**:
| Type | Items |
|------|-------|
| Agents | infrastructure-developer, deployment-orchestrator, build-orchestrator |
| Skills | helm, kubernetes, flyio, aws (future), gcp (future) |

**Dependencies**: ai-mesh-core >=4.0.0

**Size Target**: <300KB (skills are documentation-heavy)

---

#### @fortium/ai-mesh-git

**Purpose**: Git workflows, GitHub integration, and release management.

**Contents**:
| Type | Items |
|------|-------|
| Agents | git-workflow, github-specialist, release-agent |
| Commands | (none - agents invoked via orchestration) |

**Dependencies**: ai-mesh-core >=4.0.0

**Size Target**: <80KB

---

#### @fortium/ai-mesh-e2e-testing

**Purpose**: End-to-end testing with Playwright integration.

**Contents**:
| Type | Items |
|------|-------|
| Agents | playwright-tester |
| MCP | Playwright server configuration |

**Dependencies**:
- ai-mesh-core >=4.0.0
- MCP Playwright server (external)

**Size Target**: <60KB

---

#### @fortium/ai-mesh-metrics

**Purpose**: Productivity tracking, dashboards, and analytics.

**Contents**:
| Type | Items |
|------|-------|
| Agents | manager-dashboard-agent |
| Hooks | tool-metrics.js, session-start.js, session-end.js, user-profile.js |
| Commands | /dashboard |

**Dependencies**: ai-mesh-core >=4.0.0

**Size Target**: <150KB

---

#### @fortium/ai-mesh-pane-viewer

**Purpose**: Real-time subagent monitoring in terminal panes.

**Contents**:
| Type | Items |
|------|-------|
| Hooks | pane-spawner.js (PreToolUse), agent-viewer.js |
| Adapters | wezterm-adapter.js, zellij-adapter.js, tmux-adapter.js |
| Commands | /pane-config |

**Dependencies**:
- ai-mesh-core >=4.0.0
- (optional) ai-mesh-metrics for enhanced tracking

**Size Target**: <80KB

---

### Tier 3: Framework Plugins

| Plugin | Skills | Size Target |
|--------|--------|-------------|
| @fortium/ai-mesh-react | React hooks, components, state management | <80KB |
| @fortium/ai-mesh-nestjs | NestJS modules, DI, guards, pipes | <80KB |
| @fortium/ai-mesh-rails | Rails MVC, ActiveRecord, background jobs | <80KB |
| @fortium/ai-mesh-phoenix | Phoenix LiveView, Elixir patterns | <80KB |
| @fortium/ai-mesh-blazor | Blazor components, .NET patterns | <80KB |

**Dependencies**: ai-mesh-core >=4.0.0 (all)

---

### Tier 4: Test Framework Plugins

| Plugin | Skills | Size Target |
|--------|--------|-------------|
| @fortium/ai-mesh-jest | Jest mocking, React Testing Library | <60KB |
| @fortium/ai-mesh-pytest | pytest fixtures, parametrization | <60KB |
| @fortium/ai-mesh-rspec | RSpec let/describe, mocking | <60KB |
| @fortium/ai-mesh-xunit | xUnit, FluentAssertions, Moq | <60KB |
| @fortium/ai-mesh-exunit | ExUnit async, setup callbacks | <60KB |

**Dependencies**: ai-mesh-core >=4.0.0 (all)

---

### Meta-Package

#### @fortium/ai-mesh-full

**Purpose**: Backwards-compatible "install everything" option.

**plugin.json**:
```json
{
  "name": "ai-mesh-full",
  "version": "4.0.0",
  "description": "Complete ai-mesh ecosystem - all plugins",
  "dependencies": {
    "ai-mesh-core": ">=4.0.0",
    "ai-mesh-product": ">=1.0.0",
    "ai-mesh-development": ">=1.0.0",
    "ai-mesh-quality": ">=1.0.0",
    "ai-mesh-infrastructure": ">=1.0.0",
    "ai-mesh-git": ">=1.0.0",
    "ai-mesh-e2e-testing": ">=1.0.0",
    "ai-mesh-metrics": ">=1.0.0",
    "ai-mesh-pane-viewer": ">=1.0.0",
    "ai-mesh-react": ">=1.0.0",
    "ai-mesh-nestjs": ">=1.0.0",
    "ai-mesh-rails": ">=1.0.0",
    "ai-mesh-phoenix": ">=1.0.0",
    "ai-mesh-blazor": ">=1.0.0",
    "ai-mesh-jest": ">=1.0.0",
    "ai-mesh-pytest": ">=1.0.0",
    "ai-mesh-rspec": ">=1.0.0",
    "ai-mesh-xunit": ">=1.0.0",
    "ai-mesh-exunit": ">=1.0.0"
  }
}
```

---

## Marketplace Structure

### Repository: fortium/ai-mesh-marketplace

```
ai-mesh-marketplace/
├── marketplace.json           # Plugin registry
├── README.md                  # Marketplace documentation
├── plugins/                   # Local plugin sources (optional)
│   └── .gitkeep
└── categories/                # Category documentation
    ├── workflow.md
    ├── frameworks.md
    └── testing.md
```

### marketplace.json

```json
{
  "name": "ai-mesh-marketplace",
  "owner": "fortium",
  "description": "Official Fortium ai-mesh plugin marketplace",
  "homepage": "https://github.com/FortiumPartners/ai-mesh-marketplace",
  "categories": [
    {
      "id": "core",
      "name": "Core & Foundation",
      "description": "Essential plugins for ai-mesh functionality"
    },
    {
      "id": "workflow",
      "name": "Workflow & Process",
      "description": "Development workflow automation"
    },
    {
      "id": "frameworks",
      "name": "Framework Support",
      "description": "Language and framework-specific skills"
    },
    {
      "id": "testing",
      "name": "Testing Frameworks",
      "description": "Test framework integrations"
    },
    {
      "id": "utilities",
      "name": "Utilities",
      "description": "Productivity and monitoring tools"
    }
  ],
  "plugins": [
    {
      "name": "ai-mesh-core",
      "source": { "type": "github", "repo": "FortiumPartners/ai-mesh-core" },
      "version": "4.0.0",
      "category": "core",
      "description": "Core orchestration and utilities",
      "featured": true
    },
    {
      "name": "ai-mesh-development",
      "source": { "type": "github", "repo": "FortiumPartners/ai-mesh-development" },
      "version": "1.0.0",
      "category": "workflow",
      "description": "Technical planning and implementation",
      "dependencies": ["ai-mesh-core"]
    },
    {
      "name": "ai-mesh-react",
      "source": { "type": "github", "repo": "FortiumPartners/ai-mesh-react" },
      "version": "1.0.0",
      "category": "frameworks",
      "description": "React development skills",
      "dependencies": ["ai-mesh-core"]
    }
    // ... additional plugins
  ]
}
```

### User Installation Flow

```bash
# 1. Add the marketplace (one-time)
/plugin marketplace add fortium/ai-mesh-marketplace

# 2. Browse available plugins
/plugin search ai-mesh

# 3. Install specific plugins
/plugin install ai-mesh-core
/plugin install ai-mesh-development
/plugin install ai-mesh-react
/plugin install ai-mesh-jest

# 4. Or install everything
/plugin install ai-mesh-full

# 5. Team standardization (.claude/settings.json)
{
  "plugins": {
    "marketplaces": ["fortium/ai-mesh-marketplace"],
    "required": ["ai-mesh-core", "ai-mesh-development", "ai-mesh-quality"],
    "recommended": ["ai-mesh-git", "ai-mesh-metrics"]
  }
}
```

---

## Migration Strategy

### Phase 0: Preparation (Week 1-2)

**Objectives**:
- Document all current components and their relationships
- Create plugin template repository
- Set up marketplace infrastructure
- Define versioning strategy (start at 4.0.0 for core)

**Deliverables**:
- [ ] Component inventory spreadsheet
- [ ] Plugin template with CI/CD
- [ ] Empty marketplace repository
- [ ] Migration tracking dashboard

---

### Phase 1: New Plugin First (Week 3-4)

**Objectives**:
- Build ai-mesh-pane-viewer as first standalone plugin
- Validate plugin development workflow
- Test marketplace integration

**Deliverables**:
- [ ] ai-mesh-pane-viewer plugin published
- [ ] Documentation for plugin creation
- [ ] Marketplace with one plugin

**Risk**: Low - new feature, no migration required

---

### Phase 2: Extract Independent Plugins (Week 5-8)

**Objectives**:
- Extract framework plugins (React, NestJS, Rails, Phoenix, Blazor)
- Extract test framework plugins (Jest, pytest, RSpec, xUnit, ExUnit)
- These have no inter-dependencies within ai-mesh

**Extraction Order**:
1. ai-mesh-react (most used)
2. ai-mesh-jest (most used)
3. ai-mesh-nestjs
4. ai-mesh-pytest
5. (remaining frameworks and test plugins)

**Deliverables**:
- [ ] 10 framework/test plugins published
- [ ] Existing skills migrated to plugin format
- [ ] No changes to monolith required yet

**Risk**: Low - independent components

---

### Phase 3: Extract Workflow Plugins (Week 9-14)

**Objectives**:
- Extract ai-mesh-core with shared utilities
- Extract workflow plugins with dependencies
- Maintain backwards compatibility in monolith

**Extraction Order**:
1. ai-mesh-core (foundation)
2. ai-mesh-git (low dependencies)
3. ai-mesh-metrics (mostly independent)
4. ai-mesh-quality (depends on core)
5. ai-mesh-infrastructure (skills-heavy)
6. ai-mesh-product (depends on core)
7. ai-mesh-development (depends on core)
8. ai-mesh-e2e-testing (MCP dependency)

**Deliverables**:
- [ ] All 8 workflow plugins published
- [ ] Dependency resolution working
- [ ] Monolith now thin wrapper

**Risk**: Medium - interdependencies require careful ordering

---

### Phase 4: Create Meta-Package & Deprecate (Week 15-16)

**Objectives**:
- Create ai-mesh-full meta-package
- Update documentation
- Deprecate @fortium/ai-mesh NPM package
- Communication to existing users

**Deliverables**:
- [ ] ai-mesh-full meta-package published
- [ ] Migration guide for existing users
- [ ] NPM package deprecated notice
- [ ] Blog post / announcement

**Risk**: Medium - user communication critical

---

### Phase 5: Sunset Monolith (Week 17-20)

**Objectives**:
- Monitor plugin adoption metrics
- Support migration issues
- Remove deprecated monolith (after 6 months)

**Deliverables**:
- [ ] 50%+ users migrated to plugins
- [ ] Issue resolution for migration problems
- [ ] Final deprecation of NPM package

---

## Backwards Compatibility

### For Existing NPM Users

```bash
# Current (works until sunset)
npx @fortium/ai-mesh install --global

# Recommended migration path
/plugin marketplace add fortium/ai-mesh-marketplace
/plugin install ai-mesh-full
```

### For Existing .claude/ Configurations

- Agents installed to `~/.claude/agents/` continue working
- Commands installed to `~/.claude/commands/` continue working
- Users can gradually migrate to plugin-based installation
- No breaking changes to agent/command format

### Version Mapping

| Monolith Version | Plugin Ecosystem Version |
|------------------|-------------------------|
| 3.6.x | Pre-migration |
| 4.0.0 | ai-mesh-core 4.0.0 + plugins 1.0.0 |
| (deprecated) | ai-mesh-full 4.0.0 |

---

## Technical Requirements

### Plugin Template Structure

```
ai-mesh-{name}/
├── .claude-plugin/
│   └── plugin.json              # Required manifest
├── agents/
│   └── *.yaml                   # Agent definitions
├── commands/
│   └── *.md                     # Slash commands
├── skills/
│   └── {skill-name}/
│       ├── SKILL.md             # Quick reference
│       └── REFERENCE.md         # Comprehensive guide
├── hooks/
│   ├── hooks.json               # Hook configuration
│   └── *.js                     # Hook implementations
├── tests/
│   └── *.test.js                # Plugin tests
├── README.md                    # Plugin documentation
├── CHANGELOG.md                 # Version history
├── package.json                 # Node.js dependencies (if any)
└── .github/
    └── workflows/
        └── release.yml          # Automated releases
```

### CI/CD Pipeline

Each plugin repository includes:

```yaml
# .github/workflows/release.yml
name: Release Plugin

on:
  push:
    tags: ['v*']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate plugin.json
        run: |
          node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"
      - name: Validate agents
        run: |
          for f in agents/*.yaml; do
            npx js-yaml "$f" > /dev/null
          done

  release:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

### Testing Strategy

| Test Type | Scope | Tool |
|-----------|-------|------|
| Unit | Individual agents, commands | Jest |
| Integration | Plugin installation | Claude Code CLI |
| E2E | Full workflow with plugins | Playwright |

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User confusion during migration | High | Medium | Clear documentation, migration guide, blog post |
| Dependency conflicts between plugins | Medium | Low | Strict semver, dependency testing |
| Increased maintenance overhead | Medium | Medium | Shared CI/CD templates, monorepo option |
| Plugin discovery problem | Medium | Medium | Good marketplace organization, featured plugins |
| Breaking changes in Claude Code plugin system | High | Low | Pin to stable plugin API version |
| Slow adoption | Medium | Medium | Keep monolith available, soft deprecation |

---

## Success Metrics

### Adoption Metrics

| Metric | 3 Month Target | 6 Month Target |
|--------|----------------|----------------|
| Plugin installations | 500 | 2,000 |
| Users migrated from monolith | 25% | 50% |
| New plugin-first users | 100 | 500 |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Plugin installation success rate | 99% |
| Plugin load time | <100ms |
| Context token reduction (vs monolith) | 70% |
| Issues per plugin per month | <5 |

### Developer Metrics

| Metric | Target |
|--------|--------|
| Time to release a plugin update | <1 hour |
| Time to create new plugin | <1 day |
| Test coverage per plugin | >80% |

---

## Open Questions

1. **Q1**: Should plugins be in a monorepo or separate repositories?
   - *Proposed*: Separate repos for independent versioning; consider monorepo for tightly-coupled plugins

2. **Q2**: How to handle shared types/utilities across plugins?
   - *Proposed*: ai-mesh-core exports shared utilities; other plugins import from core

3. **Q3**: Should we support third-party ai-mesh plugins?
   - *Proposed*: Yes, via "community" category in marketplace (Phase 2+)

4. **Q4**: How to handle enterprise customers with existing deployments?
   - *Proposed*: Extended support period for monolith; dedicated migration assistance

5. **Q5**: Should plugins have their own CLAUDE.md or share documentation?
   - *Proposed*: Each plugin has focused README; ai-mesh-core has ecosystem overview

---

## Appendix

### Current Component Inventory

| Category | Count | Components |
|----------|-------|------------|
| Agents | 26 | ai-mesh-orchestrator, tech-lead-orchestrator, frontend-developer, backend-developer, ... |
| Commands | 12 | /create-prd, /create-trd, /implement-trd, /fold-prompt, /dashboard, ... |
| Skills | 12 | React, NestJS, Rails, Phoenix, Blazor, Helm, Kubernetes, Fly.io, Jest, pytest, RSpec, xUnit |
| Hooks | 6 | tool-metrics, session-start, session-end, user-profile, analytics-engine, metrics-api-client |

### Claude Code Plugin References

- [Plugins Documentation](https://code.claude.com/docs/en/plugins.md)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference.md)

### Related PRDs

- `wezterm-pane-spawner-hook.md` - First plugin candidate
- `agent-consolidation-skills-based-v2.md` - Agent architecture reference

---

*Generated by product-management-orchestrator*
*ai-mesh v3.6.3*

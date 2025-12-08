# Product Requirements Document: TRD Workflow MCP Tool

**PRD ID**: PRD-MCP-WORKFLOW-001
**Version**: 1.0.0
**Status**: Draft
**Created**: December 3, 2025
**Author**: Fortium Software Configuration Team
**Priority**: High

---

## Executive Summary

### Problem Statement

The TRD Workflow library (`src/trd-workflow/`) provides powerful capabilities for checkpoint injection, workflow section generation, and complexity assessment. However, this code:

1. **Is not deployed** when ai-mesh is installed
2. **Cannot be called by Claude** during TRD generation
3. **Requires manual implementation** of checkpoint patterns
4. **Has no production integration** despite being fully implemented

Currently, Claude must manually write checkpoint tasks based on learned patterns rather than using the automated, tested library.

### Proposed Solution

Create an MCP (Model Context Protocol) server that exposes the trd-workflow library as callable tools, enabling Claude to:

- Automatically inject checkpoint tasks during `/create-trd`
- Generate workflow sections with execution guidance
- Assess TRD complexity and recommend execution approaches
- Validate TRD structure against schemas

### Value Proposition

- **Consistency**: Every TRD gets properly structured checkpoints
- **Quality**: Leverages tested algorithms (95%+ accuracy, sub-10ms performance)
- **Automation**: Reduces manual work in TRD generation
- **Integration**: Fits existing ai-mesh MCP architecture (Context7, Playwright)

---

## Goals and Non-Goals

### Goals

1. Expose trd-workflow library as MCP tool server
2. Enable Claude to call checkpoint injection during `/create-trd`
3. Integrate with existing ai-mesh installer
4. Provide CLI wrapper for automation/scripting use cases
5. Maintain backward compatibility with existing TRD workflows

### Non-Goals

1. Replacing the existing `/create-trd` command (enhancement only)
2. Automatic TRD execution (tool provides guidance, not execution)
3. Integration with external CI/CD systems (future scope)
4. Real-time collaboration features

---

## User Personas

### Primary: Claude Code (AI Agent)

- **Context**: Executing `/create-trd` command
- **Need**: Programmatic access to checkpoint injection and workflow generation
- **Current Pain**: Must manually write checkpoint tasks, inconsistent patterns

### Secondary: Developer Using CLI

- **Context**: Scripting or automating TRD generation
- **Need**: Command-line access to trd-workflow functions
- **Current Pain**: No way to use the library outside of Claude

### Tertiary: ai-mesh Administrator

- **Context**: Installing and configuring ai-mesh
- **Need**: Simple installation that includes MCP server
- **Current Pain**: trd-workflow code exists but isn't deployed

---

## Functional Requirements

### FR1: MCP Server Implementation

**Description**: Create MCP server exposing trd-workflow library functions

**Tools to Expose**:

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `inject_checkpoints` | Inject checkpoint tasks into task breakdown | Task structure, config | Enhanced tasks with checkpoints |
| `generate_workflow_section` | Generate execution workflow markdown | TRD context, config | Markdown workflow section |
| `assess_complexity` | Analyze TRD complexity | Task breakdown | Complexity score, recommendations |
| `detect_task_types` | Classify tasks by type | Task list | Type assignments with confidence |
| `generate_delegation_patterns` | Create agent delegation map | Typed tasks | Delegation recommendations |
| `validate_trd_structure` | Validate TRD against schema | TRD content | Validation results |

**Acceptance Criteria**:
- [ ] MCP server starts without errors
- [ ] All 6 tools callable via MCP protocol
- [ ] Tools return structured JSON responses
- [ ] Error handling with descriptive messages

### FR2: Installer Integration

**Description**: Integrate MCP server into ai-mesh installer

**Requirements**:
- Deploy MCP server to `~/.claude/mcp/trd-workflow/`
- Auto-register in Claude's MCP configuration
- Include in `npx @fortium/ai-mesh` installation
- Support both global and local installation

**Acceptance Criteria**:
- [ ] MCP server deployed during installation
- [ ] Server auto-starts when Claude Code launches
- [ ] No manual configuration required
- [ ] Uninstall cleanly removes server

### FR3: CLI Wrapper

**Description**: Provide command-line interface for scripting

**Commands**:
```bash
ai-mesh trd-workflow inject --input tasks.json --output enhanced.json
ai-mesh trd-workflow workflow --input trd.json --output workflow.md
ai-mesh trd-workflow complexity --input tasks.json
ai-mesh trd-workflow validate --input trd.md
```

**Acceptance Criteria**:
- [ ] CLI commands work standalone
- [ ] JSON and markdown input/output supported
- [ ] Exit codes for success/failure
- [ ] Help text for all commands

### FR4: `/create-trd` Command Enhancement

**Description**: Modify `/create-trd` to use MCP tools when available

**Behavior**:
1. Check if trd-workflow MCP server is available
2. If available, use tools for checkpoint injection and workflow generation
3. If unavailable, fall back to current prompt-based approach
4. Seamless integration - no user action required

**Acceptance Criteria**:
- [ ] `/create-trd` detects MCP server availability
- [ ] Automatically uses tools when available
- [ ] Graceful fallback when unavailable
- [ ] No breaking changes to existing workflow

### FR5: Configuration Options

**Description**: Allow customization of default behaviors

**Configuration File**: `~/.ai-mesh/config/trd-workflow.json`

```json
{
  "checkpoint_frequency": "sprint",
  "include_workflow_section": true,
  "include_delegation_patterns": true,
  "complexity_thresholds": {
    "simple": 0.3,
    "complex": 0.7
  }
}
```

**Acceptance Criteria**:
- [ ] Configuration file loaded on server start
- [ ] Defaults used when no config present
- [ ] Invalid config produces helpful error
- [ ] Config overridable per-call via tool parameters

### FR6: Documentation and Examples

**Description**: Comprehensive documentation for all integration points

**Deliverables**:
- MCP tool reference documentation
- CLI command reference
- Integration guide for `/create-trd`
- Example workflows and use cases
- Troubleshooting guide

**Acceptance Criteria**:
- [ ] All tools documented with examples
- [ ] CLI help matches documentation
- [ ] Integration guide tested end-to-end
- [ ] Troubleshooting covers common issues

---

## Non-Functional Requirements

### NFR1: Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Tool response time | <100ms | Real-time conversation flow |
| Server startup | <2 seconds | Quick Claude Code launch |
| Memory usage | <50MB | Minimal footprint |
| Concurrent requests | 10+ | Multiple tool calls in parallel |

### NFR2: Reliability

- Server auto-restarts on crash
- Graceful degradation when server unavailable
- No data loss on unexpected termination
- Logging for debugging issues

### NFR3: Security

- No external network calls
- Local-only server (localhost binding)
- No credential storage
- Input validation on all tool calls

### NFR4: Compatibility

- Node.js 18+ (matches ai-mesh requirements)
- macOS, Linux, Windows support
- Claude Code 1.0+ compatibility
- MCP SDK 1.0+ compatibility

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Checkpoint consistency | 100% | All TRDs have proper checkpoints |
| Tool adoption | 80% | `/create-trd` uses MCP when available |
| Performance overhead | <5% | TRD generation time increase |
| User satisfaction | 90% | Survey of ai-mesh users |
| Installation success | 99% | MCP server deploys without errors |

---

## Dependencies

### Technical Dependencies

- `@modelcontextprotocol/sdk` - MCP server implementation
- `src/trd-workflow/lib/*` - Existing library code
- `src/installer/*` - Installation integration

### External Dependencies

- Claude Code MCP support (available)
- Node.js runtime (required by ai-mesh)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| MCP protocol changes | High | Low | Pin SDK version, monitor updates |
| Performance regression | Medium | Low | Benchmark testing, caching |
| Installation failures | High | Medium | Extensive cross-platform testing |
| Claude not using tools | Medium | Medium | Clear tool descriptions, fallback |

---

## Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: MCP Server | 3 days | Server implementation, tool handlers |
| Phase 2: Installer | 2 days | Deployment, registration |
| Phase 3: CLI | 1 day | Command-line wrapper |
| Phase 4: Integration | 2 days | `/create-trd` enhancement |
| Phase 5: Testing | 2 days | E2E, cross-platform |
| Phase 6: Documentation | 1 day | Guides, examples |

**Total**: ~11 days

---

## Appendix

### A. MCP Tool Schemas

```typescript
// inject_checkpoints
interface InjectCheckpointsInput {
  taskBreakdown: {
    phases: Array<{
      name: string;
      sprints: Array<{
        name: string;
        tasks: Array<{ id: string; title: string; }>;
      }>;
    }>;
  };
  config?: {
    checkpoint_frequency?: 'sprint' | 'phase' | number;
    trd_id?: string;
  };
}

interface InjectCheckpointsOutput {
  taskBreakdown: object;  // Enhanced with checkpoints
  checkpoints: Array<{ id: string; title: string; }>;
  metrics: {
    totalCheckpoints: number;
    strategy: string;
    coverage: number;
  };
}
```

### B. Related Documents

- TRD-WORKFLOW-001: TRD Workflow Integration (implementation spec)
- PRD-WORKFLOW-001: TRD Generation Git Workflow (original PRD)
- CLAUDE.md: ai-mesh configuration

---

**Approval**:
- [ ] Product Owner
- [ ] Technical Lead
- [ ] Implementation Team

---

_PRD for TRD Workflow MCP Tool Integration_
_Version 1.0.0 - December 2025_

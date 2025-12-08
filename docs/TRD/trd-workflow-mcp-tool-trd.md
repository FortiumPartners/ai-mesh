# Technical Requirements Document: TRD Workflow MCP Tool

**TRD ID**: TRD-MCP-WORKFLOW-001
**Version**: 1.0.0
**Status**: Draft
**Created**: December 3, 2025
**Author**: Tech Lead Orchestrator
**Priority**: High
**Related PRD**: PRD-MCP-WORKFLOW-001

---

## 1. Overview

### 1.1 Purpose

Enable automated, consistent TRD generation through MCP (Model Context Protocol) integration of the existing trd-workflow library. This integration exposes checkpoint injection, workflow generation, and complexity assessment as callable tools for Claude during `/create-trd` execution.

### 1.2 Problem Statement

The trd-workflow library (`src/trd-workflow/`) contains production-ready algorithms for:
- Checkpoint injection (95%+ accuracy, sub-10ms performance)
- Workflow section generation
- Complexity assessment
- Task classification and delegation mapping

However, this code is **not deployed** and **cannot be called by Claude** during TRD generation. Claude must manually write checkpoint tasks based on learned patterns, leading to:
- Inconsistent checkpoint structure across TRDs
- Manual effort in workflow generation
- Lost opportunity to leverage tested, optimized algorithms

### 1.3 Solution Summary

Create an MCP server that:
1. Exposes 6 trd-workflow functions as MCP tools
2. Integrates with ai-mesh installer for automatic deployment
3. Provides CLI wrapper for scripting/automation
4. Enhances `/create-trd` command to automatically use tools when available

**Architecture**: Node.js MCP server using `@modelcontextprotocol/sdk`, deployed to `~/.claude/mcp/trd-workflow/`, auto-registered in Claude's MCP configuration.

### 1.4 Success Criteria

- [ ] **100% checkpoint consistency**: All TRDs generated with `/create-trd` have proper checkpoint structure
- [ ] **80% tool adoption**: `/create-trd` uses MCP tools when available
- [ ] **<5% performance overhead**: TRD generation time increase minimal
- [ ] **99% installation success**: MCP server deploys without errors across platforms
- [ ] **90% user satisfaction**: Survey feedback from ai-mesh users

---

## 2. System Context & Constraints

### 2.1 Current Architecture

```
ai-mesh/
├── src/
│   ├── trd-workflow/           # Existing library (not deployed)
│   │   ├── lib/
│   │   │   ├── checkpointInjector.js
│   │   │   ├── workflowGenerator.js
│   │   │   ├── complexityAssessor.js
│   │   │   ├── taskTypeDetector.js
│   │   │   └── delegationMapper.js
│   │   └── index.js
│   └── installer/              # Installation system
├── commands/yaml/
│   └── create-trd.yaml         # Current TRD creation command
└── bin/
    └── ai-mesh                 # CLI entry point
```

**Current Limitation**: trd-workflow code exists but is not exposed as callable functionality.

### 2.2 Integration Points

| Component | Integration Type | Details |
|-----------|-----------------|---------|
| Claude Code | MCP Protocol | Server registered in Claude's MCP config |
| ai-mesh installer | Deployment | MCP server deployed during installation |
| `/create-trd` command | Tool Usage | Calls MCP tools when available |
| CLI | Direct API | Wraps trd-workflow functions for scripting |

### 2.3 Technical Constraints

- **Node.js 18+**: Required by ai-mesh and MCP SDK
- **MCP SDK 1.0+**: Official Model Context Protocol implementation
- **Local-only**: Server binds to localhost, no external network
- **Cross-platform**: Must work on macOS, Linux, Windows
- **Memory**: <50MB footprint (minimal overhead)
- **Performance**: <100ms tool response time for conversational flow

### 2.4 Assumptions

- Claude Code MCP support is stable and available
- Existing trd-workflow library code is production-ready
- Users have Node.js 18+ installed (ai-mesh requirement)
- MCP protocol will remain backward-compatible

---

## 3. Architecture Overview

### 3.1 High-Level Design

```mermaid
graph TB
    subgraph "Claude Code Environment"
        Claude[Claude AI]
        CreateTRD[/create-trd Command]
    end

    subgraph "MCP Server (localhost)"
        MCPServer[TRD Workflow MCP Server]
        ToolHandlers[Tool Handlers]

        subgraph "trd-workflow Library"
            CheckpointInjector[Checkpoint Injector]
            WorkflowGen[Workflow Generator]
            ComplexityAssessor[Complexity Assessor]
            TaskDetector[Task Type Detector]
            DelegationMapper[Delegation Mapper]
            Validator[TRD Validator]
        end
    end

    subgraph "Installation"
        Installer[ai-mesh Installer]
        MCPConfig[~/.claude/mcp/config.json]
    end

    subgraph "CLI Interface"
        CLI[ai-mesh trd-workflow]
        Scripts[Automation Scripts]
    end

    Claude -->|MCP Protocol| MCPServer
    CreateTRD -->|Tool Calls| MCPServer
    MCPServer --> ToolHandlers
    ToolHandlers --> CheckpointInjector
    ToolHandlers --> WorkflowGen
    ToolHandlers --> ComplexityAssessor
    ToolHandlers --> TaskDetector
    ToolHandlers --> DelegationMapper
    ToolHandlers --> Validator

    Installer -->|Deploy| MCPServer
    Installer -->|Register| MCPConfig

    CLI -->|Direct API| CheckpointInjector
    CLI -->|Direct API| WorkflowGen
    Scripts -->|Execute| CLI

    style MCPServer fill:#4A90E2
    style CheckpointInjector fill:#7ED321
    style WorkflowGen fill:#7ED321
    style ComplexityAssessor fill:#7ED321
```

### 3.2 Component Specifications

#### 3.2.1 MCP Server Core

**File**: `src/mcp-servers/trd-workflow-server.js`

**Responsibilities**:
- Initialize MCP SDK server
- Register 6 tool handlers
- Handle tool invocation requests
- Return structured JSON responses
- Error handling and logging

**Technology**: `@modelcontextprotocol/sdk`, Node.js

#### 3.2.2 Tool Handlers

**File**: `src/mcp-servers/handlers/`

| Handler | Function | Input Schema | Output Schema |
|---------|----------|--------------|---------------|
| `inject_checkpoints` | Add checkpoint tasks | TaskBreakdown, Config | Enhanced TaskBreakdown |
| `generate_workflow_section` | Create workflow markdown | TRD Context, Config | Markdown string |
| `assess_complexity` | Analyze TRD complexity | TaskBreakdown | Complexity metrics |
| `detect_task_types` | Classify tasks | Task array | Type assignments |
| `generate_delegation_patterns` | Create delegation map | Typed tasks | Agent assignments |
| `validate_trd_structure` | Validate TRD | TRD content | Validation results |

#### 3.2.3 Installer Integration

**File**: `src/installer/install-mcp-server.js`

**Deployment Steps**:
1. Copy MCP server files to `~/.claude/mcp/trd-workflow/`
2. Install npm dependencies in target directory
3. Register server in `~/.claude/mcp/config.json`
4. Test server startup
5. Verify tool availability

#### 3.2.4 CLI Wrapper

**File**: `src/cli/trd-workflow-cli.js`

**Commands**:
```bash
ai-mesh trd-workflow inject --input tasks.json --output enhanced.json
ai-mesh trd-workflow workflow --input trd.json --output workflow.md
ai-mesh trd-workflow complexity --input tasks.json
ai-mesh trd-workflow validate --input trd.md
```

#### 3.2.5 `/create-trd` Enhancement

**File**: `commands/yaml/create-trd.yaml`

**Enhancement Logic**:
1. Check MCP server availability at startup
2. If available: Use `inject_checkpoints` and `generate_workflow_section` tools
3. If unavailable: Fall back to current prompt-based approach
4. No user configuration required (automatic detection)

---

## 4. Master Task List

### Phase 1: MCP Server Implementation (3 days, 8 tasks)

#### Sprint 1.1: Server Foundation (1 day, 4 tasks)

- [ ] **TASK-001**: Initialize MCP server project structure (2 hours)
  - **Acceptance Criteria**:
    - Directory structure: `src/mcp-servers/trd-workflow-server/`
    - Package.json with `@modelcontextprotocol/sdk` dependency
    - Entry point: `server.js` with basic initialization
    - README with setup instructions
  - **Dependencies**: None
  - **Agent**: backend-developer

- [ ] **TASK-002**: Implement MCP SDK server initialization (2 hours)
  - **Acceptance Criteria**:
    - Server starts on localhost with dynamic port
    - Implements MCP protocol handshake
    - Graceful startup and shutdown
    - Basic error handling and logging
  - **Dependencies**: TASK-001
  - **Agent**: backend-developer

- [ ] **TASK-003**: Create tool registration framework (2 hours)
  - **Acceptance Criteria**:
    - Tool registry with schema validation
    - Tool handler interface defined
    - Dynamic tool registration from handlers directory
    - Tool listing endpoint functional
  - **Dependencies**: TASK-002
  - **Agent**: backend-developer

- [ ] **TASK-004**: Implement logging and diagnostics (2 hours)
  - **Acceptance Criteria**:
    - Structured logging with winston or bunyan
    - Log levels: debug, info, warn, error
    - Logs to `~/.ai-mesh/logs/mcp-server.log`
    - Performance metrics logging (tool execution time)
  - **Dependencies**: TASK-002
  - **Agent**: backend-developer

#### Sprint 1.2: Tool Handlers Implementation (2 days, 4 tasks)

- [ ] **TASK-005**: Implement `inject_checkpoints` tool handler (3 hours)
  - **Acceptance Criteria**:
    - Wraps `checkpointInjector.injectCheckpoints()`
    - Input validation: taskBreakdown structure, config options
    - Output: enhanced task breakdown with checkpoints
    - Returns metrics: totalCheckpoints, strategy, coverage
    - Error handling for invalid input
  - **Dependencies**: TASK-003
  - **Agent**: backend-developer

- [ ] **TASK-006**: Implement `generate_workflow_section` tool handler (3 hours)
  - **Acceptance Criteria**:
    - Wraps `workflowGenerator.generateSection()`
    - Input validation: TRD context, config options
    - Output: markdown workflow section
    - Includes execution guidance, quality gates, delegation patterns
    - Error handling for missing context
  - **Dependencies**: TASK-003
  - **Agent**: backend-developer

- [ ] **TASK-007**: Implement `assess_complexity` and `detect_task_types` handlers (3 hours)
  - **Acceptance Criteria**:
    - `assess_complexity`: wraps `complexityAssessor.assess()`
    - `detect_task_types`: wraps `taskTypeDetector.detectTypes()`
    - Input validation for both tools
    - Output: complexity score + recommendations, type assignments + confidence
    - Error handling for edge cases
  - **Dependencies**: TASK-003
  - **Agent**: backend-developer

- [ ] **TASK-008**: Implement `generate_delegation_patterns` and `validate_trd_structure` handlers (3 hours)
  - **Acceptance Criteria**:
    - `generate_delegation_patterns`: wraps `delegationMapper.mapAgents()`
    - `validate_trd_structure`: wraps `validator.validate()`
    - Input validation for both tools
    - Output: agent assignments with rationale, validation results with errors
    - Error handling for validation failures
  - **Dependencies**: TASK-003
  - **Agent**: backend-developer

#### Git Checkpoint: Sprint 1 Complete

- [ ] **CHECKPOINT-001**: Commit Sprint 1 progress (0.5 hours)
  - **Commit Message Template**:
    ```
    feat(mcp-server): implement TRD workflow MCP server foundation

    - MCP SDK server initialization with protocol handshake
    - Tool registration framework with schema validation
    - 6 tool handlers: inject_checkpoints, generate_workflow_section, etc.
    - Logging and diagnostics with structured output

    Sprint 1 Complete: 8 tasks, 3 days
    Next: Phase 2 - Installer Integration

    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - **Verification**:
    - [ ] All Sprint 1 tasks (TASK-001 to TASK-008) completed
    - [ ] Server starts without errors
    - [ ] All 6 tools callable and returning valid JSON
    - [ ] Unit tests passing (if implemented)
  - **Dependencies**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
  - **Agent**: git-workflow

---

### Phase 2: Installer Integration (2 days, 6 tasks)

#### Sprint 2.1: Deployment Logic (1 day, 3 tasks)

- [ ] **TASK-009**: Create MCP server deployment module (2 hours)
  - **Acceptance Criteria**:
    - Module: `src/installer/mcp-server-installer.js`
    - Function: `deployMCPServer(scope: 'global' | 'local')`
    - Copies server files to target directory
    - Installs npm dependencies in target
    - Error handling for file system operations
  - **Dependencies**: CHECKPOINT-001
  - **Agent**: backend-developer

- [ ] **TASK-010**: Implement MCP configuration registration (2 hours)
  - **Acceptance Criteria**:
    - Reads `~/.claude/mcp/config.json`
    - Adds trd-workflow server entry
    - Preserves existing server configurations
    - Validates JSON structure before writing
    - Creates config file if it doesn't exist
  - **Dependencies**: TASK-009
  - **Agent**: backend-developer

- [ ] **TASK-011**: Add server health check and startup test (2 hours)
  - **Acceptance Criteria**:
    - Function: `testServerStartup()` after deployment
    - Starts server in test mode
    - Verifies all 6 tools registered
    - Tests basic tool invocation (inject_checkpoints)
    - Shuts down server cleanly
    - Returns success/failure with details
  - **Dependencies**: TASK-010
  - **Agent**: backend-developer

#### Sprint 2.2: Installer Integration (1 day, 3 tasks)

- [ ] **TASK-012**: Integrate MCP deployment into ai-mesh installer (3 hours)
  - **Acceptance Criteria**:
    - Call `deployMCPServer()` during installation
    - Handle both global (`~/.claude`) and local (`.claude`) scopes
    - Progress reporting during deployment
    - Rollback on failure
    - Update installation summary with MCP server status
  - **Dependencies**: TASK-011
  - **Agent**: backend-developer

- [ ] **TASK-013**: Implement uninstallation logic (2 hours)
  - **Acceptance Criteria**:
    - Remove server directory on uninstall
    - Remove entry from MCP config
    - Preserve other MCP servers
    - Cleanup logs and temporary files
    - Graceful handling if server not found
  - **Dependencies**: TASK-012
  - **Agent**: backend-developer

- [ ] **TASK-014**: Add MCP server status to validation command (2 hours)
  - **Acceptance Criteria**:
    - `ai-mesh validate` checks MCP server presence
    - Reports server status: installed, running, responsive
    - Lists available tools
    - Suggests fixes for common issues
  - **Dependencies**: TASK-012
  - **Agent**: backend-developer

#### Git Checkpoint: Phase 2 Complete

- [ ] **CHECKPOINT-002**: Commit Phase 2 installer integration (0.5 hours)
  - **Commit Message Template**:
    ```
    feat(installer): integrate TRD workflow MCP server deployment

    - MCP server deployment module with scope support
    - Configuration registration in ~/.claude/mcp/config.json
    - Health checks and startup validation
    - Integration with ai-mesh installer (global/local)
    - Uninstallation and validation command updates

    Phase 2 Complete: 6 tasks, 2 days
    Next: Phase 3 - CLI Wrapper

    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - **Verification**:
    - [ ] All Phase 2 tasks (TASK-009 to TASK-014) completed
    - [ ] `npx @fortium/ai-mesh install` deploys MCP server
    - [ ] Server appears in Claude's MCP configuration
    - [ ] `ai-mesh validate` confirms server status
  - **Dependencies**: TASK-009, TASK-010, TASK-011, TASK-012, TASK-013, TASK-014
  - **Agent**: git-workflow

---

### Phase 3: CLI Wrapper (1 day, 4 tasks)

#### Sprint 3.1: CLI Implementation (1 day, 4 tasks)

- [ ] **TASK-015**: Create CLI command parser and router (2 hours)
  - **Acceptance Criteria**:
    - Module: `src/cli/trd-workflow-commands.js`
    - Parses `ai-mesh trd-workflow <subcommand>` invocations
    - Routes to appropriate handler: inject, workflow, complexity, validate
    - Handles `--help` flag for each subcommand
    - Error messages for invalid commands
  - **Dependencies**: CHECKPOINT-002
  - **Agent**: backend-developer

- [ ] **TASK-016**: Implement `inject` and `workflow` CLI commands (3 hours)
  - **Acceptance Criteria**:
    - `ai-mesh trd-workflow inject --input tasks.json --output enhanced.json`
    - `ai-mesh trd-workflow workflow --input trd.json --output workflow.md`
    - Reads input files (JSON/markdown)
    - Calls trd-workflow library directly
    - Writes output files
    - Exit code 0 on success, 1 on failure
  - **Dependencies**: TASK-015
  - **Agent**: backend-developer

- [ ] **TASK-017**: Implement `complexity` and `validate` CLI commands (2 hours)
  - **Acceptance Criteria**:
    - `ai-mesh trd-workflow complexity --input tasks.json`
    - `ai-mesh trd-workflow validate --input trd.md`
    - Outputs results to stdout (JSON or formatted text)
    - Optional `--json` flag for machine-readable output
    - Exit code reflects validation result
  - **Dependencies**: TASK-015
  - **Agent**: backend-developer

- [ ] **TASK-018**: Add CLI integration tests (2 hours)
  - **Acceptance Criteria**:
    - Test suite: `test/cli/trd-workflow.test.js`
    - Tests all 4 subcommands with sample data
    - Validates output files and exit codes
    - Tests error handling (missing files, invalid JSON)
    - ≥80% code coverage for CLI module
  - **Dependencies**: TASK-016, TASK-017
  - **Agent**: test-runner

#### Git Checkpoint: Phase 3 Complete

- [ ] **CHECKPOINT-003**: Commit Phase 3 CLI wrapper (0.5 hours)
  - **Commit Message Template**:
    ```
    feat(cli): add trd-workflow CLI commands for scripting

    - CLI command parser and router for subcommands
    - Implement inject, workflow, complexity, validate commands
    - File I/O support (JSON and markdown)
    - Comprehensive help text and error messages
    - Integration tests with ≥80% coverage

    Phase 3 Complete: 4 tasks, 1 day
    Next: Phase 4 - /create-trd Enhancement

    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - **Verification**:
    - [ ] All Phase 3 tasks (TASK-015 to TASK-018) completed
    - [ ] CLI commands work standalone
    - [ ] Help text displays correctly
    - [ ] Integration tests passing
  - **Dependencies**: TASK-015, TASK-016, TASK-017, TASK-018
  - **Agent**: git-workflow

---

### Phase 4: `/create-trd` Command Enhancement (2 days, 6 tasks)

#### Sprint 4.1: MCP Integration Layer (1 day, 3 tasks)

- [ ] **TASK-019**: Add MCP server detection to `/create-trd` (2 hours)
  - **Acceptance Criteria**:
    - Function: `checkMCPServerAvailable()` at command start
    - Queries Claude's MCP configuration
    - Tests server responsiveness with ping/tool listing
    - Sets flag: `useMCPTools = true/false`
    - Logs detection result for debugging
  - **Dependencies**: CHECKPOINT-003
  - **Agent**: backend-developer

- [ ] **TASK-020**: Implement MCP tool invocation wrapper (3 hours)
  - **Acceptance Criteria**:
    - Module: `src/utils/mcp-tool-wrapper.js`
    - Functions: `callInjectCheckpoints()`, `callGenerateWorkflow()`
    - Error handling with fallback to null (prompt-based approach)
    - Input/output transformation for MCP protocol
    - Timeout handling (2 seconds max)
  - **Dependencies**: TASK-019
  - **Agent**: backend-developer

- [ ] **TASK-021**: Update `/create-trd` prompt to use MCP tools conditionally (3 hours)
  - **Acceptance Criteria**:
    - Modified prompt in `commands/yaml/create-trd.yaml`
    - If `useMCPTools == true`: Instructs Claude to call tools
    - If `useMCPTools == false`: Falls back to current approach
    - No breaking changes to existing TRD format
    - Clear instructions for Claude on tool usage
  - **Dependencies**: TASK-020
  - **Agent**: documentation-specialist

#### Sprint 4.2: Testing and Validation (1 day, 3 tasks)

- [ ] **TASK-022**: Create integration test suite for `/create-trd` (3 hours)
  - **Acceptance Criteria**:
    - Test suite: `test/integration/create-trd-mcp.test.js`
    - Test with MCP server available (tools used)
    - Test with MCP server unavailable (fallback)
    - Validates checkpoint structure in generated TRD
    - Validates workflow section presence
    - Compares MCP vs prompt-based output quality
  - **Dependencies**: TASK-021
  - **Agent**: test-runner

- [ ] **TASK-023**: Performance benchmarking (2 hours)
  - **Acceptance Criteria**:
    - Benchmark script: `benchmark/create-trd-performance.js`
    - Measures TRD generation time with/without MCP
    - Validates <5% performance overhead target
    - Tests with various TRD sizes (10, 30, 50 tasks)
    - Reports memory usage
  - **Dependencies**: TASK-022
  - **Agent**: test-runner

- [ ] **TASK-024**: End-to-end user acceptance testing (3 hours)
  - **Acceptance Criteria**:
    - Manual test: `/create-trd` with real PRD
    - Verify checkpoint tasks present and correct
    - Verify workflow section present and helpful
    - Test fallback behavior (disable MCP server)
    - Validate no regressions in TRD quality
    - User feedback collection
  - **Dependencies**: TASK-023
  - **Agent**: general-purpose

#### Git Checkpoint: Phase 4 Complete

- [ ] **CHECKPOINT-004**: Commit Phase 4 /create-trd enhancement (0.5 hours)
  - **Commit Message Template**:
    ```
    feat(commands): enhance /create-trd with MCP tool integration

    - MCP server detection and availability checking
    - Tool invocation wrapper with error handling
    - Conditional tool usage in command prompt
    - Integration tests for MCP vs prompt-based modes
    - Performance benchmarking (<5% overhead confirmed)
    - E2E user acceptance testing

    Phase 4 Complete: 6 tasks, 2 days
    Next: Phase 5 - Testing and Validation

    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - **Verification**:
    - [ ] All Phase 4 tasks (TASK-019 to TASK-024) completed
    - [ ] `/create-trd` detects and uses MCP tools
    - [ ] Graceful fallback when tools unavailable
    - [ ] Performance overhead <5%
    - [ ] E2E tests passing
  - **Dependencies**: TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, TASK-024
  - **Agent**: git-workflow

---

### Phase 5: Comprehensive Testing (2 days, 6 tasks)

#### Sprint 5.1: Cross-Platform Testing (1 day, 3 tasks)

- [ ] **TASK-025**: Test installation on macOS (2 hours)
  - **Acceptance Criteria**:
    - Clean install on macOS 13+ (Intel and Apple Silicon)
    - MCP server deploys to `~/.claude/mcp/trd-workflow/`
    - Server starts successfully
    - All 6 tools callable from Claude
    - `/create-trd` uses tools correctly
  - **Dependencies**: CHECKPOINT-004
  - **Agent**: test-runner

- [ ] **TASK-026**: Test installation on Linux (2 hours)
  - **Acceptance Criteria**:
    - Clean install on Ubuntu 22.04 and Fedora 38
    - MCP server deploys correctly
    - Permissions set properly (executable bits)
    - All tools functional
    - CLI commands work
  - **Dependencies**: CHECKPOINT-004
  - **Agent**: test-runner

- [ ] **TASK-027**: Test installation on Windows (2 hours)
  - **Acceptance Criteria**:
    - Clean install on Windows 10/11
    - Handles Windows path separators correctly
    - MCP server starts in WSL and native environments
    - All tools functional
    - Document Windows-specific issues
  - **Dependencies**: CHECKPOINT-004
  - **Agent**: test-runner

#### Sprint 5.2: Quality Assurance (1 day, 3 tasks)

- [ ] **TASK-028**: Security audit (2 hours)
  - **Acceptance Criteria**:
    - Input validation for all tool handlers
    - No command injection vulnerabilities
    - No path traversal vulnerabilities
    - Server binds to localhost only (no external exposure)
    - No credential storage or leakage
    - Document security model
  - **Dependencies**: TASK-025, TASK-026, TASK-027
  - **Agent**: code-reviewer

- [ ] **TASK-029**: Performance and reliability testing (3 hours)
  - **Acceptance Criteria**:
    - Load test: 100 tool invocations in parallel
    - Verify <100ms response time under load
    - Memory usage stays <50MB
    - Server auto-restarts on crash (if configured)
    - No memory leaks over extended use
  - **Dependencies**: TASK-028
  - **Agent**: test-runner

- [ ] **TASK-030**: Error handling and edge case testing (3 hours)
  - **Acceptance Criteria**:
    - Test malformed input to all tools
    - Test missing dependencies
    - Test corrupt TRD structure
    - Test invalid configuration
    - Verify graceful error messages
    - Document common errors and fixes
  - **Dependencies**: TASK-029
  - **Agent**: test-runner

#### Git Checkpoint: Phase 5 Complete

- [ ] **CHECKPOINT-005**: Commit Phase 5 testing and validation (0.5 hours)
  - **Commit Message Template**:
    ```
    test(mcp-server): comprehensive testing across platforms

    - Cross-platform testing (macOS, Linux, Windows)
    - Security audit: input validation, no vulnerabilities
    - Performance testing: <100ms response, <50MB memory
    - Reliability testing: load tests, auto-restart
    - Edge case testing: malformed input, error handling

    Phase 5 Complete: 6 tasks, 2 days
    Next: Phase 6 - Documentation

    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - **Verification**:
    - [ ] All Phase 5 tasks (TASK-025 to TASK-030) completed
    - [ ] Installation successful on 3 platforms
    - [ ] Security audit passed
    - [ ] Performance targets met
    - [ ] All edge cases handled
  - **Dependencies**: TASK-025, TASK-026, TASK-027, TASK-028, TASK-029, TASK-030
  - **Agent**: git-workflow

---

### Phase 6: Documentation and Release (1 day, 4 tasks)

#### Sprint 6.1: Documentation (1 day, 4 tasks)

- [ ] **TASK-031**: Create MCP tool reference documentation (2 hours)
  - **Acceptance Criteria**:
    - Document: `docs/mcp/trd-workflow-tools.md`
    - All 6 tools documented with descriptions
    - Input/output schemas with examples
    - Error codes and messages
    - Usage examples from Claude Code
  - **Dependencies**: CHECKPOINT-005
  - **Agent**: documentation-specialist

- [ ] **TASK-032**: Create CLI command reference (1 hour)
  - **Acceptance Criteria**:
    - Document: `docs/cli/trd-workflow-commands.md`
    - All 4 CLI commands documented
    - Usage examples with sample files
    - Exit codes and error messages
    - Integration with scripting/automation
  - **Dependencies**: CHECKPOINT-005
  - **Agent**: documentation-specialist

- [ ] **TASK-033**: Create integration guide and troubleshooting (2 hours)
  - **Acceptance Criteria**:
    - Document: `docs/guides/trd-workflow-integration.md`
    - Installation verification steps
    - How `/create-trd` uses MCP tools
    - Troubleshooting common issues
    - Performance optimization tips
    - Configuration options reference
  - **Dependencies**: TASK-031, TASK-032
  - **Agent**: documentation-specialist

- [ ] **TASK-034**: Update CLAUDE.md and CHANGELOG (2 hours)
  - **Acceptance Criteria**:
    - CLAUDE.md: Add TRD Workflow MCP Tool section
    - Describe integration and benefits
    - Link to detailed documentation
    - CHANGELOG.md: Version entry with features
    - README.md: Update quick start if needed
  - **Dependencies**: TASK-033
  - **Agent**: documentation-specialist

#### Git Checkpoint: Project Complete

- [ ] **CHECKPOINT-006**: Final commit and release preparation (0.5 hours)
  - **Commit Message Template**:
    ```
    docs(mcp-server): complete TRD workflow MCP tool documentation

    - MCP tool reference with all 6 tools documented
    - CLI command reference with usage examples
    - Integration guide and troubleshooting
    - CLAUDE.md and CHANGELOG updates

    Phase 6 Complete: 4 tasks, 1 day
    Project Complete: 34 tasks, 11 days
    Ready for release and user rollout

    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
  - **Verification**:
    - [ ] All Phase 6 tasks (TASK-031 to TASK-034) completed
    - [ ] All documentation accurate and complete
    - [ ] CHANGELOG reflects all changes
    - [ ] CLAUDE.md updated
    - [ ] Ready for version bump and npm publish
  - **Dependencies**: TASK-031, TASK-032, TASK-033, TASK-034
  - **Agent**: git-workflow

---

## 5. Execution Workflow

### 5.1 Recommended Execution Command

```bash
# Recommended approach for full implementation
/implement-trd @docs/TRD/trd-workflow-mcp-tool-trd.md
```

**Why this approach**:
- Approval-first workflow: User reviews each phase before implementation
- Checkpoint-driven: Git commits at sprint/phase boundaries
- Quality gates: Automated testing and validation at each checkpoint
- Multi-agent delegation: Optimal agent routing based on task type

### 5.2 Multi-Agent Delegation Patterns

| Phase | Primary Agent | Supporting Agents | Rationale |
|-------|---------------|-------------------|-----------|
| Phase 1: MCP Server | backend-developer | test-runner | Server implementation requires backend expertise |
| Phase 2: Installer | backend-developer | git-workflow | Integration with existing installer system |
| Phase 3: CLI | backend-developer | test-runner | CLI wrapper and testing |
| Phase 4: /create-trd | documentation-specialist | backend-developer | Command enhancement with prompt updates |
| Phase 5: Testing | test-runner | code-reviewer | Comprehensive QA across platforms |
| Phase 6: Docs | documentation-specialist | git-workflow | Documentation and release prep |

**Agent Allocation**:
- backend-developer: 20 tasks (59%)
- test-runner: 8 tasks (24%)
- documentation-specialist: 4 tasks (12%)
- git-workflow: 6 checkpoints (18%)
- code-reviewer: 1 task (3%)
- general-purpose: 1 task (3%)

### 5.3 Quality Gates

#### Sprint-Level Gates (After each sprint)

**Criteria**:
- [ ] All sprint tasks completed and checked off
- [ ] Code compiles and runs without errors
- [ ] Unit tests passing (if applicable)
- [ ] Git checkpoint committed with proper message

**Actions**:
- Review progress with user
- Address any blockers before proceeding
- Update task estimates if needed

#### Phase-Level Gates (After each phase)

**Criteria**:
- [ ] All phase tasks and sprints completed
- [ ] Integration tests passing
- [ ] User acceptance for deliverables
- [ ] Documentation updated
- [ ] Git checkpoint committed

**Actions**:
- Demo functionality to user
- Collect feedback and adjust remaining phases
- Verify success metrics on track

#### Final Quality Gate (Before release)

**Criteria**:
- [ ] All 34 tasks completed across 6 phases
- [ ] 99% installation success rate validated
- [ ] <5% performance overhead confirmed
- [ ] Cross-platform testing passed
- [ ] Security audit passed
- [ ] Documentation complete and accurate
- [ ] User acceptance testing passed

**Actions**:
- Final approval from user
- Version bump and npm publish
- Announcement to ai-mesh users

### 5.4 Execution Timeline

```
Week 1:
  Day 1-3: Phase 1 (MCP Server Implementation)
  Day 4-5: Phase 2 (Installer Integration)

Week 2:
  Day 1: Phase 3 (CLI Wrapper)
  Day 2-3: Phase 4 (/create-trd Enhancement)
  Day 4-5: Phase 5 (Testing)

Week 3:
  Day 1: Phase 6 (Documentation)
  Day 2: Buffer for issues/refinements
```

**Parallel Work Opportunities**:
- CLI wrapper (Phase 3) can start while installer testing (Phase 2) completes
- Documentation (Phase 6) can be drafted alongside testing (Phase 5)

---

## 6. Interfaces & Data Contracts

### 6.1 MCP Tool Schemas

#### 6.1.1 inject_checkpoints Tool

**Input Schema**:
```typescript
interface InjectCheckpointsInput {
  taskBreakdown: {
    phases: Array<{
      name: string;
      sprints: Array<{
        name: string;
        tasks: Array<{
          id: string;
          title: string;
          estimate?: string;
          dependencies?: string[];
        }>;
      }>;
    }>;
  };
  config?: {
    checkpoint_frequency?: 'sprint' | 'phase' | number;
    trd_id?: string;
    commit_template?: string;
  };
}
```

**Output Schema**:
```typescript
interface InjectCheckpointsOutput {
  taskBreakdown: object;  // Enhanced with checkpoint tasks
  checkpoints: Array<{
    id: string;
    title: string;
    position: string;  // e.g., "After Sprint 1.1"
  }>;
  metrics: {
    totalCheckpoints: number;
    strategy: string;
    coverage: number;  // 0-1 scale
  };
}
```

#### 6.1.2 generate_workflow_section Tool

**Input Schema**:
```typescript
interface GenerateWorkflowInput {
  trdContext: {
    trdId: string;
    title: string;
    totalTasks: number;
    phases: Array<{name: string; taskCount: number}>;
    complexity?: 'simple' | 'moderate' | 'complex';
  };
  config?: {
    include_delegation_patterns?: boolean;
    include_quality_gates?: boolean;
    recommended_command?: string;
  };
}
```

**Output Schema**:
```typescript
interface GenerateWorkflowOutput {
  markdown: string;  // Complete workflow section
  sections: {
    recommended_command: string;
    delegation_patterns: string;
    quality_gates: string;
    timeline: string;
  };
}
```

#### 6.1.3 assess_complexity Tool

**Input Schema**:
```typescript
interface AssessComplexityInput {
  taskBreakdown: {
    phases: Array<{
      tasks: Array<{
        title: string;
        estimate?: string;
        dependencies?: string[];
      }>;
    }>;
  };
}
```

**Output Schema**:
```typescript
interface AssessComplexityOutput {
  score: number;  // 0-1 scale
  level: 'simple' | 'moderate' | 'complex';
  factors: {
    taskCount: number;
    estimatedDays: number;
    dependencyComplexity: number;
    phaseCount: number;
  };
  recommendations: string[];  // Execution recommendations
}
```

### 6.2 CLI Input/Output Formats

#### 6.2.1 Task Breakdown JSON (Input for `inject` command)

```json
{
  "phases": [
    {
      "name": "Phase 1: Implementation",
      "sprints": [
        {
          "name": "Sprint 1.1: Foundation",
          "tasks": [
            {
              "id": "TASK-001",
              "title": "Setup project structure",
              "estimate": "2 hours",
              "dependencies": []
            }
          ]
        }
      ]
    }
  ]
}
```

#### 6.2.2 TRD Context JSON (Input for `workflow` command)

```json
{
  "trdId": "TRD-MCP-WORKFLOW-001",
  "title": "TRD Workflow MCP Tool",
  "totalTasks": 34,
  "phases": [
    {"name": "Phase 1: MCP Server", "taskCount": 8},
    {"name": "Phase 2: Installer", "taskCount": 6}
  ],
  "complexity": "moderate"
}
```

### 6.3 Configuration File Format

**File**: `~/.ai-mesh/config/trd-workflow.json`

```json
{
  "checkpoint_frequency": "sprint",
  "include_workflow_section": true,
  "include_delegation_patterns": true,
  "complexity_thresholds": {
    "simple": 0.3,
    "complex": 0.7
  },
  "commit_templates": {
    "sprint": "feat({phase}): {description}\n\nSprint {sprint} Complete: {taskCount} tasks\n",
    "phase": "feat({phase}): {description}\n\nPhase {phase} Complete\n"
  }
}
```

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Tool response time | <100ms | MCP SDK latency tracking |
| Server startup | <2 seconds | Time from start command to ready state |
| Memory usage | <50MB | Process monitoring (RSS) |
| Concurrent requests | 10+ simultaneous | Load testing with parallel tool calls |
| TRD generation overhead | <5% | Benchmark with/without MCP tools |

### 7.2 Reliability Requirements

- **Availability**: 99.9% uptime when Claude Code is running
- **Auto-restart**: Server restarts automatically on crash (via MCP SDK)
- **Graceful degradation**: `/create-trd` falls back to prompt-based approach if server unavailable
- **Data integrity**: No data loss on unexpected termination
- **Logging**: All errors logged to `~/.ai-mesh/logs/mcp-server.log` for debugging

### 7.3 Security Requirements

- **Network isolation**: Server binds to localhost only (127.0.0.1)
- **No external calls**: Server makes no outbound network requests
- **Input validation**: All tool inputs validated against schemas
- **No credential storage**: Server does not store or handle credentials
- **Path traversal protection**: File operations restricted to allowed directories
- **Command injection protection**: No dynamic command execution

### 7.4 Compatibility Requirements

- **Node.js**: 18.0.0 or higher
- **Operating Systems**: macOS 13+, Linux (Ubuntu 22.04+, Fedora 38+), Windows 10/11
- **Claude Code**: 1.0.0 or higher with MCP support
- **MCP SDK**: 1.0.0 or higher
- **ai-mesh**: 3.5.0 or higher

### 7.5 Maintainability Requirements

- **Code coverage**: ≥80% unit test coverage
- **Documentation**: Inline JSDoc comments for all public functions
- **Linting**: ESLint with recommended rules
- **Dependency management**: npm audit passing (no critical vulnerabilities)
- **Version control**: Semantic versioning for releases

---

## 8. Testing Strategy

### 8.1 Unit Testing

**Scope**: Individual functions and modules

**Tools**: Jest or Mocha with Chai

**Coverage Targets**:
- Tool handlers: ≥90% coverage
- MCP server core: ≥85% coverage
- CLI commands: ≥80% coverage
- Installer module: ≥75% coverage

**Key Test Cases**:
- Valid input → correct output for all tools
- Invalid input → proper error messages
- Edge cases: empty tasks, missing fields, malformed JSON
- Configuration: defaults, overrides, invalid values

### 8.2 Integration Testing

**Scope**: Component interactions and workflows

**Tools**: Jest with full server startup

**Key Test Cases**:
- MCP server startup and tool registration
- Tool invocation via MCP protocol
- `/create-trd` command with MCP tools enabled
- Installer deployment and uninstallation
- CLI commands with file I/O

### 8.3 End-to-End Testing

**Scope**: Complete user workflows

**Key Test Cases**:
- Fresh ai-mesh installation → MCP server deployed → tools callable
- `/create-trd` with PRD → TRD with checkpoints generated
- CLI workflow: `inject` → `workflow` → file output
- Server failure → fallback to prompt-based TRD generation

### 8.4 Cross-Platform Testing

**Platforms**:
- macOS 13+ (Intel and Apple Silicon)
- Ubuntu 22.04 and Fedora 38
- Windows 10/11 (WSL and native)

**Test Matrix**:
- Installation success rate
- Server startup and stability
- Tool functionality
- CLI command execution
- Path handling and file operations

### 8.5 Performance Testing

**Test Scenarios**:
- Baseline: Tool response time with small input (10 tasks)
- Load: 100 parallel tool invocations
- Stress: 1000 sequential tool calls (memory leak check)
- Benchmark: TRD generation with/without MCP tools

**Metrics**:
- P50, P95, P99 latency
- Memory usage over time
- CPU utilization
- Server stability under load

---

## 9. Deployment & Migration

### 9.1 Deployment Strategy

**Approach**: Phased rollout with feature flag

**Phase 1: Internal Testing (Week 1)**
- Deploy to dev environment
- Internal team testing
- Bug fixes and refinements

**Phase 2: Beta Release (Week 2)**
- Deploy to 10% of ai-mesh users
- Monitor metrics: adoption rate, error rate
- Collect user feedback

**Phase 3: General Availability (Week 3)**
- Deploy to all users via `npx @fortium/ai-mesh` update
- Announcement in CHANGELOG and release notes
- Support documentation published

### 9.2 Rollback Plan

**Trigger Conditions**:
- Installation success rate <95%
- Critical bugs affecting TRD generation
- Performance degradation >10%

**Rollback Steps**:
1. Disable MCP server registration in installer
2. `/create-trd` automatically falls back to prompt-based approach
3. Issue patch release removing MCP server
4. Investigate and fix issues
5. Re-release when stable

### 9.3 Migration Notes

**For Existing Users**:
- No action required for existing TRD workflows
- MCP server automatically deployed on next `ai-mesh update`
- `/create-trd` automatically uses tools when available
- No breaking changes to TRD format or commands

**For New Users**:
- MCP server included in initial installation
- Tools available immediately after setup
- No additional configuration needed

### 9.4 Monitoring & Observability

**Key Metrics**:
- Installation success rate (target: 99%)
- MCP server availability (target: 99.9%)
- Tool adoption rate (target: 80%)
- Average tool response time (target: <100ms)
- Error rate (target: <1%)

**Logging**:
- Server startup/shutdown events
- Tool invocation counts and timing
- Error messages with stack traces
- Performance metrics (memory, CPU)

**Alerts**:
- Installation failure spike (>5%)
- Server crash rate increase
- Tool error rate spike (>2%)
- Performance degradation (>100ms P95)

---

## 10. Dependencies & Risks

### 10.1 Technical Dependencies

| Dependency | Version | Purpose | Risk Level |
|------------|---------|---------|------------|
| @modelcontextprotocol/sdk | ^1.0.0 | MCP server implementation | Medium |
| Node.js | >=18.0.0 | Runtime environment | Low |
| trd-workflow library | internal | Core functionality | Low |
| Claude Code MCP | >=1.0.0 | Tool invocation | Medium |

**Mitigation**:
- Pin MCP SDK version to avoid breaking changes
- Test against multiple Node.js versions (18, 20, 22)
- Monitor MCP SDK updates and test before upgrading
- Fallback to prompt-based approach if MCP unavailable

### 10.2 Risk Register

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| MCP protocol changes break compatibility | High | Low | Pin SDK version, monitor changelog |
| Performance regression in tool calls | Medium | Low | Benchmark testing, optimize algorithms |
| Installation failures on Windows | High | Medium | Extensive cross-platform testing |
| Claude doesn't use tools (prefers prompts) | Medium | Medium | Clear tool descriptions, examples |
| Server crashes under load | High | Low | Load testing, error handling, auto-restart |
| Users disable MCP server | Low | Medium | Document benefits, make disabling explicit |

### 10.3 External Dependencies

- **Claude Code MCP Support**: Required for tool invocation (currently stable)
- **npm Registry**: Required for `npx @fortium/ai-mesh` installation (99.9% uptime)
- **Git**: Required for checkpoint commits (standard developer tool)

---

## 11. Acceptance Criteria & Sign-Off

### 11.1 Success Criteria

- [ ] **Checkpoint consistency**: 100% of TRDs have proper checkpoint structure
- [ ] **Tool adoption**: 80% of `/create-trd` invocations use MCP tools
- [ ] **Performance**: <5% overhead in TRD generation time
- [ ] **Installation**: 99% success rate across platforms
- [ ] **User satisfaction**: 90% positive feedback in surveys

### 11.2 Definition of Done

- [ ] All 34 tasks completed and checked off
- [ ] All 6 phases completed with git checkpoints
- [ ] Unit tests ≥80% coverage, all passing
- [ ] Integration tests all passing
- [ ] Cross-platform testing passed (macOS, Linux, Windows)
- [ ] Security audit passed (no critical vulnerabilities)
- [ ] Performance benchmarks met (<100ms, <50MB, <5% overhead)
- [ ] Documentation complete (tool reference, CLI guide, integration guide)
- [ ] CHANGELOG updated with release notes
- [ ] User acceptance testing passed

### 11.3 Approval Checklist

- [ ] **Product Owner**: Features meet business requirements
- [ ] **Technical Lead**: Architecture and implementation sound
- [ ] **QA Team**: All tests passing, quality gates satisfied
- [ ] **Security Team**: Security audit passed
- [ ] **Documentation Team**: All docs complete and accurate

---

## 12. Appendix

### 12.1 Glossary

- **MCP**: Model Context Protocol - standardized way for Claude to call external tools
- **TRD**: Technical Requirements Document - detailed implementation specification
- **Checkpoint**: Git commit task at sprint/phase boundaries for progress tracking
- **Tool Handler**: MCP server function that implements a specific tool
- **Workflow Section**: Markdown section in TRD describing execution approach

### 12.2 Related Documents

- **PRD-MCP-WORKFLOW-001**: Product Requirements Document (source document)
- **TRD-WORKFLOW-001**: Original TRD Workflow Integration spec
- **PRD-WORKFLOW-001**: TRD Generation Git Workflow
- **CLAUDE.md**: ai-mesh configuration and documentation
- **agents/README.md**: Agent ecosystem and delegation patterns

### 12.3 References

- MCP SDK Documentation: https://github.com/modelcontextprotocol/sdk
- ai-mesh Repository: https://github.com/FortiumPartners/claude-config
- AgentOS Standards: `/docs/agentos/`
- trd-workflow Library: `/src/trd-workflow/`

---

**Document Control**:
- **Created**: December 3, 2025
- **Last Updated**: December 3, 2025
- **Review Schedule**: Weekly during implementation
- **Next Review**: December 10, 2025

---

_This TRD demonstrates the checkpoint injection and workflow section patterns that the MCP tool will automate for all future TRD generation._

**Estimated Timeline**: 11 days (34 tasks across 6 phases)
**Complexity Level**: Moderate
**Agent Allocation**: 59% backend-developer, 24% test-runner, 12% documentation-specialist

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

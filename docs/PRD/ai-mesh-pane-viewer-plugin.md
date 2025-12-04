# PRD: ai-mesh-pane-viewer Plugin

**Document Version**: 3.0.0
**Created**: 2025-12-04
**Updated**: 2025-12-04
**Author**: Product Management Orchestrator
**Status**: Draft
**Priority**: High
**Plugin Name**: @fortium/ai-mesh-pane-viewer
**Parent PRD**: [ai-mesh Plugin Architecture Migration](./ai-mesh-plugin-architecture-migration.md)

---

## Executive Summary

### Problem Statement

When Claude Code spawns subagents using the Task tool, developers have no visibility into the agent's real-time progress or output. The subagent runs in a "black box" environment, and users only see the final result after completion. For long-running or complex agent tasks, this creates uncertainty and makes debugging difficult.

### Solution

Create **@fortium/ai-mesh-pane-viewer**, a Claude Code plugin that provides real-time subagent monitoring via terminal panes. This is the **first plugin** in the ai-mesh plugin ecosystem migration, serving as a proof-of-concept for the plugin architecture.

The plugin includes a **PreToolUse hook** that intercepts Task tool calls and spawns the subagent output in a separate terminal pane using the user's preferred terminal multiplexer.

**Supported Terminal Multiplexers:**
- **WezTerm** - Modern GPU-accelerated terminal with rich CLI
- **Zellij** - Rust-based terminal workspace with batteries included
- **tmux** - Classic terminal multiplexer with broad compatibility

### Strategic Context

This plugin is **Phase 1** of the [ai-mesh Plugin Architecture Migration](./ai-mesh-plugin-architecture-migration.md):
- First standalone plugin to validate the plugin development workflow
- Tests marketplace integration and distribution
- Low-risk (new feature, no migration required)
- Establishes patterns for subsequent plugin extraction

### Value Proposition

- **Real-time visibility**: Watch subagent output as it happens
- **Better debugging**: Identify issues during execution, not after
- **Multi-agent monitoring**: View multiple concurrent agents in split panes
- **Development insight**: Understand how agents approach tasks
- **Reduced uncertainty**: Know what's happening instead of waiting blindly
- **Terminal flexibility**: Use your preferred multiplexer (WezTerm, Zellij, or tmux)
- **Plugin-first**: Installs independently via `/plugin install ai-mesh-pane-viewer`

---

## User Analysis

### Primary Users

#### 1. AI-Augmented Developers
- **Profile**: Software developers using Claude Code with the ai-mesh agent ecosystem
- **Pain Points**:
  - No visibility into subagent progress during long tasks
  - Difficulty debugging failed agent tasks
  - Uncertainty about whether agent is making progress or stuck
- **Goals**: Maximize productivity while maintaining oversight of AI assistance

#### 2. Technical Leads
- **Profile**: Engineering leads who review AI-assisted development
- **Pain Points**:
  - Can't observe how agents approach technical problems
  - Difficult to assess agent reliability without seeing their work
- **Goals**: Ensure quality and understand agent capabilities

#### 3. AI Tool Developers
- **Profile**: Developers building or customizing Claude Code agents
- **Pain Points**:
  - Testing agents requires waiting for completion to see results
  - Hard to debug agent prompt issues
- **Goals**: Rapidly iterate on agent development with immediate feedback

### User Personas

#### "Maya" - Senior Full-Stack Developer
- Uses Claude Code daily with 5+ specialized agents
- Often runs backend-developer and frontend-developer in parallel
- Wants to monitor both agents simultaneously
- Values efficiency and hates waiting without knowing status

#### "Carlos" - DevOps/Infrastructure Engineer
- Runs infrastructure-developer for complex Terraform/Kubernetes tasks
- Tasks can take 5-10 minutes to complete
- Needs to catch misconfigurations early before they propagate
- Prefers terminal-based workflows over GUIs

#### "Priya" - Engineering Manager
- Reviews team's AI-assisted development practices
- Wants to understand agent decision-making patterns
- Needs visibility for training and best practices documentation
- Values transparency in automated processes

---

## Goals & Non-Goals

### Goals

1. **G1**: Provide real-time visibility into subagent output via terminal panes
2. **G2**: Maintain seamless integration with existing Claude Code workflow
3. **G3**: Support configurable pane layouts (horizontal, vertical, grid)
4. **G4**: Enable optional capture of agent output for later review
5. **G5**: Support monitoring multiple concurrent agents
6. **G6**: Support multiple terminal multiplexers (WezTerm, Zellij, tmux)
7. **G7**: Auto-detect user's terminal environment when possible

### Non-Goals

- **NG1**: Support for non-multiplexer terminals (iTerm2, Kitty, Alacritty standalone) - future enhancement
- **NG2**: Real-time intervention or modification of agent execution
- **NG3**: Web-based dashboard for agent monitoring (separate feature)
- **NG4**: Automatic error detection and recovery during agent execution
- **NG5**: Performance profiling of agent execution
- **NG6**: Custom terminal multiplexer plugin development

### Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Pane spawn latency | ≤100ms | Performance logging |
| Hook execution overhead | ≤50ms | Pre/post timing |
| User adoption | 60% of multiplexer users enable within 30 days | Usage telemetry |
| Bug reports | <5 critical in first month | Issue tracking |
| Multiplexer coverage | 3 multiplexers supported at launch | Feature completeness |
| Auto-detection accuracy | 95%+ correct detection | User feedback |

---

## Functional Requirements

### FR1: PreToolUse Hook for Task Tool Interception

**Description**: Create a hook that intercepts Task tool calls before execution.

**Requirements**:
- Hook MUST be triggered only for `Task` tool invocations
- Hook MUST extract `subagent_type`, `description`, and `prompt` from tool input
- Hook MUST NOT block or delay the main Claude Code session
- Hook MUST gracefully handle multiplexer unavailability (fallback to normal execution)

**Acceptance Criteria**:
- [ ] Hook triggers on every Task tool call
- [ ] Hook extracts agent metadata correctly
- [ ] Hook completes within 50ms
- [ ] Hook fails gracefully if no multiplexer is available

### FR1.5: Terminal Multiplexer Abstraction Layer

**Description**: Create a unified interface for spawning panes across different terminal multiplexers.

**Requirements**:
- Implement adapter pattern for each supported multiplexer
- Auto-detect active multiplexer from environment variables
- Provide consistent API regardless of underlying multiplexer
- Support graceful fallback chain: configured → detected → disabled

**Detection Strategy**:
```javascript
// Detection priority order
1. User configuration (explicit choice)
2. Environment variables:
   - WEZTERM_PANE → WezTerm
   - ZELLIJ → Zellij
   - TMUX → tmux
3. CLI availability check (which wezterm/zellij/tmux)
4. Fallback: disabled (normal execution)
```

**Adapter Interface**:
```typescript
interface TerminalMultiplexerAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  splitPane(options: SplitPaneOptions): Promise<PaneResult>;
  closePane(paneId: string): Promise<void>;
  sendKeys(paneId: string, keys: string): Promise<void>;
  getPaneInfo(paneId: string): Promise<PaneInfo>;
}

interface SplitPaneOptions {
  direction: 'right' | 'bottom' | 'left' | 'top';
  percent?: number;
  cwd?: string;
  command: string[];
  name?: string;
}

interface PaneResult {
  success: boolean;
  paneId: string;
  error?: string;
}
```

**Acceptance Criteria**:
- [ ] Unified interface works for all 3 multiplexers
- [ ] Auto-detection correctly identifies active multiplexer
- [ ] Fallback chain works as expected
- [ ] Each adapter handles its multiplexer-specific quirks

### FR2: WezTerm Pane Spawning

**Description**: Spawn a new WezTerm pane to display agent output.

**Requirements**:
- Use `wezterm cli split-pane` to create new panes
- Support configurable split direction (--right, --bottom, --left, --top)
- Support configurable pane size (percentage or cells)
- Capture and display the pane-id for management
- Set appropriate working directory (`--cwd` from hook context)

**WezTerm CLI Options to Support**:
```bash
wezterm cli split-pane [OPTIONS] [PROG]...

Options:
  --pane-id <PANE_ID>     Source pane to split (default: current)
  --cwd <CWD>             Working directory for spawned program
  --right                 Split horizontally, new pane on right
  --bottom                Split vertically, new pane on bottom (default)
  --left                  Split horizontally, new pane on left
  --top                   Split vertically, new pane on top
  --percent <PERCENT>     Size as percentage (default: 50)
  --cells <CELLS>         Size as number of cells
  --top-level             Split entire window instead of active pane
```

**Acceptance Criteria**:
- [ ] Pane spawns in configured direction
- [ ] Pane uses correct working directory
- [ ] Pane-id is captured for tracking
- [ ] Failed spawn attempts are logged and don't block execution

### FR2.5: Zellij Pane Spawning

**Description**: Spawn a new Zellij pane to display agent output.

**Requirements**:
- Use `zellij action new-pane` or `zellij run` to create new panes
- Support directional splitting (-d right, -d down, etc.)
- Support floating panes as alternative layout option
- Set pane name for easy identification (`--name`)
- Support close-on-exit for auto-cleanup (`-c`)

**Zellij CLI Commands**:
```bash
# Create a new pane with command
zellij action new-pane -d right -- node agent-viewer.js

# Alternative: use zellij run (shorthand)
zellij run -d right --name "🤖 frontend-dev" -- node agent-viewer.js

# Floating pane option
zellij action new-pane -f --name "Agent Output" -- node agent-viewer.js

# With close-on-exit
zellij run -c -d right -- node agent-viewer.js

# Options:
#   -d, --direction <DIR>    Direction: right, down, left, up
#   -f, --floating           Create as floating pane
#   -c, --close-on-exit      Close pane when command exits
#   --cwd <DIR>              Working directory
#   -n, --name <NAME>        Pane name/title
#   -s, --start-suspended    Start suspended (for debugging)
```

**Unique Zellij Features**:
- **Floating panes**: Overlay panes for quick viewing without layout disruption
- **Auto-layout**: Zellij intelligently places panes without explicit direction
- **Stacked panes**: Multiple panes in a stack for space efficiency
- **Pane naming**: Built-in support for descriptive pane titles

**Acceptance Criteria**:
- [ ] Pane spawns using `zellij run` or `zellij action new-pane`
- [ ] Direction parameter works correctly
- [ ] Pane name displays agent type
- [ ] Floating pane option works when configured
- [ ] Close-on-exit properly cleans up completed agents

### FR2.6: tmux Pane Spawning

**Description**: Spawn a new tmux pane to display agent output.

**Requirements**:
- Use `tmux split-window` to create new panes
- Support horizontal (`-h`) and vertical (`-v`) splits
- Use `send-keys` for complex command execution if needed
- Target specific sessions/windows with `-t` flag
- Support pane percentage sizing (`-p`)

**tmux CLI Commands**:
```bash
# Basic split with command
tmux split-window -h "node agent-viewer.js"

# Split with percentage size
tmux split-window -h -p 40 "node agent-viewer.js"

# Split with working directory
tmux split-window -h -c "/path/to/project" "node agent-viewer.js"

# Target specific session:window.pane
tmux split-window -t mysession:0 -h "node agent-viewer.js"

# Alternative: split then send-keys (for complex commands)
tmux split-window -h
tmux send-keys -t mysession:0.1 "node agent-viewer.js" C-m

# Get pane ID after split
PANE_ID=$(tmux display-message -p '#{pane_id}')

# Options:
#   -h                       Horizontal split (panes side by side)
#   -v                       Vertical split (panes stacked)
#   -p <PERCENT>             Size as percentage
#   -l <SIZE>                Size in lines/columns
#   -c <DIR>                 Working directory
#   -t <TARGET>              Target session:window.pane
#   -d                       Don't focus new pane
```

**tmux Pane Identification**:
```bash
# List all panes with IDs
tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_id}'

# Get current pane info
tmux display-message -p '#{pane_id} #{pane_width}x#{pane_height}'
```

**Unique tmux Features**:
- **Session persistence**: Panes survive terminal disconnection
- **Scriptability**: Excellent scripting support with `send-keys`
- **Broad compatibility**: Works on virtually any Unix system
- **Window/pane targeting**: Precise control with `-t` targeting

**Acceptance Criteria**:
- [ ] Pane spawns using `tmux split-window`
- [ ] Horizontal and vertical splits work correctly
- [ ] Pane ID captured from tmux for tracking
- [ ] Working directory set correctly with `-c`
- [ ] Pane targeting works for multi-session setups

### FR3: Agent Output Display

**Description**: Display agent identification and output in the spawned pane.

**Requirements**:
- Display agent type and task description as header
- Show real-time stdout/stderr from agent execution
- Use visual indicators for agent status (running, complete, error)
- Support ANSI colors for rich output formatting

**Display Format**:
```
╭──────────────────────────────────────────────────────────╮
│ 🤖 Agent: frontend-developer                             │
│ 📋 Task: Create user dashboard component                 │
│ ⏱️  Started: 2025-12-04 10:32:15                         │
╰──────────────────────────────────────────────────────────╯

[Agent output appears here in real-time...]
```

**Acceptance Criteria**:
- [ ] Agent type and description displayed clearly
- [ ] Output streams in real-time without buffering
- [ ] ANSI colors render correctly
- [ ] Timestamps show elapsed time

### FR4: Configuration System

**Description**: Allow users to configure pane spawning behavior with multiplexer-specific options.

**Configuration Options**:
```json
{
  "pane_spawner": {
    "enabled": true,
    "multiplexer": "auto",
    "split_direction": "right",
    "split_percent": 40,
    "auto_close_on_success": false,
    "auto_close_delay_seconds": 5,
    "show_header": true,
    "capture_output": true,
    "capture_path": "~/.ai-mesh/agent-logs/",
    "agent_filters": {
      "include": ["*"],
      "exclude": []
    },

    "wezterm": {
      "use_top_level_split": false,
      "pane_id": null
    },

    "zellij": {
      "use_floating_panes": false,
      "close_on_exit": true,
      "start_suspended": false
    },

    "tmux": {
      "session_name": null,
      "window_index": null,
      "dont_focus_new_pane": true
    }
  }
}
```

**Configuration Fields**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable pane spawning |
| `multiplexer` | string | `"auto"` | `"auto"`, `"wezterm"`, `"zellij"`, `"tmux"`, or `"disabled"` |
| `split_direction` | string | `"right"` | `"right"`, `"bottom"`, `"left"`, `"top"` |
| `split_percent` | number | `40` | Pane size as percentage (10-90) |
| `auto_close_on_success` | boolean | `false` | Close pane when agent completes successfully |
| `auto_close_delay_seconds` | number | `5` | Delay before auto-close (allows reading output) |
| `show_header` | boolean | `true` | Display agent info header in pane |
| `capture_output` | boolean | `true` | Save agent output to log files |
| `capture_path` | string | `"~/.ai-mesh/agent-logs/"` | Directory for output logs |

**Multiplexer-Specific Options**:

| Multiplexer | Field | Default | Description |
|-------------|-------|---------|-------------|
| WezTerm | `use_top_level_split` | `false` | Split entire window vs active pane |
| WezTerm | `pane_id` | `null` | Specific pane to split (null = current) |
| Zellij | `use_floating_panes` | `false` | Use floating panes instead of splits |
| Zellij | `close_on_exit` | `true` | Auto-close pane when command exits |
| Zellij | `start_suspended` | `false` | Start pane suspended (for debugging) |
| tmux | `session_name` | `null` | Target session (null = current) |
| tmux | `window_index` | `null` | Target window (null = current) |
| tmux | `dont_focus_new_pane` | `true` | Keep focus on main pane |

**Acceptance Criteria**:
- [ ] Configuration loads from `~/.ai-mesh/config.json` or project `.claude/settings.json`
- [ ] All options have sensible defaults
- [ ] Invalid configuration fails gracefully with warnings
- [ ] Configuration changes apply without restart
- [ ] Multiplexer-specific options only apply to selected multiplexer
- [ ] `"auto"` mode correctly detects and uses available multiplexer

### FR5: Multi-Agent Support

**Description**: Handle multiple concurrent agent spawns gracefully.

**Requirements**:
- Track active agent panes by pane-id
- Support grid layout for 4+ concurrent agents
- Reuse panes for sequential same-agent invocations (optional)
- Clean up completed agent panes based on configuration

**Pane Management**:
```
┌─────────────────┬─────────────────┐
│                 │ 🤖 frontend-dev │
│   Main Claude   ├─────────────────┤
│     Session     │ 🤖 backend-dev  │
│                 ├─────────────────┤
│                 │ 🤖 test-runner  │
└─────────────────┴─────────────────┘
```

**Acceptance Criteria**:
- [ ] Multiple agents spawn without conflicts
- [ ] Pane IDs tracked for management
- [ ] Layout adjusts for 2, 3, 4+ agents
- [ ] Completed panes optionally auto-close

### FR6: Output Capture and Logging

**Description**: Optionally capture agent output for post-execution review.

**Requirements**:
- Save agent output to timestamped log files
- Include agent metadata in log headers
- Support configurable retention period
- Integrate with existing metrics system

**Log File Format**:
```
~/.ai-mesh/agent-logs/
  └── 2025-12-04/
      ├── frontend-developer_103215_abc123.log
      ├── backend-developer_103245_def456.log
      └── index.json  # Session manifest
```

**Acceptance Criteria**:
- [ ] Logs created when `capture_output: true`
- [ ] Logs contain complete agent output
- [ ] Old logs cleaned up per retention policy
- [ ] Logs accessible via `/dashboard` command

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Notes |
|-------------|--------|-------|
| Hook execution time | ≤50ms | Must not delay main session |
| Pane spawn latency | ≤100ms | WezTerm CLI is fast |
| Memory overhead | ≤10MB | Per active agent pane |
| CPU impact | <1% | Background output streaming |

### Reliability

- Hook MUST NOT crash Claude Code session
- Hook MUST handle WezTerm unavailability gracefully
- Hook MUST recover from pane spawn failures
- Output capture MUST NOT lose data on unexpected termination

### Security

- Pane commands MUST NOT expose sensitive prompt content in process listings
- Log files MUST respect project `.gitignore` patterns
- Configuration MUST NOT allow arbitrary command injection

### Compatibility

**Terminal Multiplexers** (at least one required):
- **WezTerm**: 20230712-072601-f4abf8fd or later
- **Zellij**: 0.37.0 or later (for `zellij run` support)
- **tmux**: 3.0 or later (for `-p` percentage flag)

**Operating Systems**:
- macOS: 12.0+
- Linux: Ubuntu 20.04+, Fedora 34+, Arch Linux
- Windows: WSL2 (native Windows not supported)

**Runtime**:
- Claude Code: Current stable version
- Node.js: 18.x or later

---

## Technical Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Session                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Task Tool Invocation                     │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            PreToolUse Hook (pane-spawner.js)           │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │ Parse Task Input │  │ Load Config + Detect Mux   │ │  │
│  │  └────────┬────────┘  └─────────────┬───────────────┘ │  │
│  │           │                         │                  │  │
│  │           ▼                         ▼                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │      Terminal Multiplexer Abstraction Layer     │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │  │  │
│  │  │  │ WezTerm │  │ Zellij  │  │      tmux       │  │  │  │
│  │  │  │ Adapter │  │ Adapter │  │     Adapter     │  │  │  │
│  │  │  └────┬────┘  └────┬────┘  └────────┬────────┘  │  │  │
│  │  └───────┼────────────┼────────────────┼───────────┘  │  │
│  └──────────┼────────────┼────────────────┼──────────────┘  │
│             │            │                │                  │
└─────────────┼────────────┼────────────────┼──────────────────┘
              │            │                │
              ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   New Terminal Pane                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                agent-viewer.js                         │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │ Display Header  │  │ Stream Agent Output         │ │  │
│  │  └─────────────────┘  └─────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Capture to Log File (optional)                  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Structure

```
ai-mesh-pane-viewer/
├── .claude-plugin/
│   └── plugin.json                    # Plugin manifest (required)
├── hooks/
│   ├── hooks.json                     # Hook configuration
│   ├── pane-spawner.js               # PreToolUse hook - intercepts Task calls
│   ├── agent-viewer.js               # Pane display script - renders agent output
│   ├── pane-manager.js               # Tracks active panes and handles cleanup
│   └── adapters/
│       ├── base-adapter.js           # Abstract adapter interface
│       ├── wezterm-adapter.js        # WezTerm-specific pane operations
│       ├── zellij-adapter.js         # Zellij-specific pane operations
│       ├── tmux-adapter.js           # tmux-specific pane operations
│       └── multiplexer-detector.js   # Auto-detection logic
├── commands/
│   └── pane-config.md                # /pane-config slash command
├── lib/
│   └── config-loader.js              # Configuration loader and validator
├── tests/
│   ├── adapters.test.js              # Adapter unit tests
│   ├── hook.test.js                  # Hook integration tests
│   └── e2e.test.js                   # End-to-end tests
├── README.md                          # Plugin documentation
├── CHANGELOG.md                       # Version history
├── package.json                       # Node.js dependencies
└── .github/
    └── workflows/
        └── release.yml               # Automated release pipeline
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "ai-mesh-pane-viewer",
  "version": "1.0.0",
  "description": "Real-time subagent monitoring in terminal panes (WezTerm, Zellij, tmux)",
  "author": {
    "name": "Fortium Partners",
    "email": "support@fortiumpartners.com",
    "url": "https://github.com/FortiumPartners"
  },
  "repository": "https://github.com/FortiumPartners/ai-mesh-pane-viewer",
  "homepage": "https://github.com/FortiumPartners/ai-mesh-pane-viewer#readme",
  "license": "MIT",
  "keywords": [
    "monitoring",
    "subagent",
    "wezterm",
    "zellij",
    "tmux",
    "terminal",
    "pane",
    "ai-mesh"
  ],
  "hooks": "./hooks/hooks.json",
  "commands": "./commands",
  "dependencies": {
    "ai-mesh-core": ">=4.0.0"
  },
  "optionalDependencies": {
    "ai-mesh-metrics": ">=1.0.0"
  },
  "peerDependencies": {
    "claude-code": ">=1.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Hook Configuration (hooks.json)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pane-spawner.js"
          }
        ]
      }
    ]
  }
}
```

### Key Files

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin manifest - metadata, dependencies, entry points |
| `hooks/hooks.json` | Hook configuration - PreToolUse matcher for Task tool |
| `hooks/pane-spawner.js` | PreToolUse hook - intercepts Task calls |
| `hooks/agent-viewer.js` | Pane display script - renders agent output |
| `hooks/pane-manager.js` | Tracks active panes and handles cleanup |
| `hooks/adapters/*.js` | Terminal multiplexer adapters |
| `commands/pane-config.md` | Slash command for configuration |
| `lib/config-loader.js` | Configuration loader and validator |

### Data Flow

1. **Interception**: PreToolUse hook receives Task tool call via stdin JSON
2. **Configuration**: Load user preferences from config files
3. **Detection**: Auto-detect or use configured terminal multiplexer
4. **Adapter Selection**: Select appropriate multiplexer adapter
5. **Pane Spawn**: Execute multiplexer-specific split command with agent-viewer
6. **IPC**: Pass agent metadata to viewer via command-line args or temp file
7. **Streaming**: Agent-viewer receives output via named pipe or file watch
8. **Capture**: Optionally write output to timestamped log file
9. **Cleanup**: Close pane on completion (if configured) and update pane registry

### Multiplexer Adapter Pattern

```javascript
// adapters/base-adapter.js
class BaseMultiplexerAdapter {
  async isAvailable() { throw new Error('Not implemented'); }
  async splitPane(options) { throw new Error('Not implemented'); }
  async closePane(paneId) { throw new Error('Not implemented'); }
  async sendKeys(paneId, keys) { throw new Error('Not implemented'); }
}

// adapters/wezterm-adapter.js
class WezTermAdapter extends BaseMultiplexerAdapter {
  async isAvailable() {
    return !!process.env.WEZTERM_PANE || await this.checkCli('wezterm');
  }

  async splitPane(options) {
    const args = ['cli', 'split-pane'];
    if (options.direction) args.push(`--${options.direction}`);
    if (options.percent) args.push('--percent', options.percent);
    if (options.cwd) args.push('--cwd', options.cwd);
    args.push('--', ...options.command);

    const result = await exec('wezterm', args);
    return { success: true, paneId: result.stdout.trim() };
  }
}

// adapters/zellij-adapter.js
class ZellijAdapter extends BaseMultiplexerAdapter {
  async isAvailable() {
    return !!process.env.ZELLIJ || await this.checkCli('zellij');
  }

  async splitPane(options) {
    const args = ['run'];
    if (options.direction) args.push('-d', options.direction);
    if (options.name) args.push('--name', options.name);
    if (options.closeOnExit) args.push('-c');
    if (options.cwd) args.push('--cwd', options.cwd);
    args.push('--', ...options.command);

    await exec('zellij', args);
    return { success: true, paneId: 'zellij-pane' }; // Zellij manages IDs internally
  }
}

// adapters/tmux-adapter.js
class TmuxAdapter extends BaseMultiplexerAdapter {
  async isAvailable() {
    return !!process.env.TMUX || await this.checkCli('tmux');
  }

  async splitPane(options) {
    const args = ['split-window'];
    args.push(options.direction === 'right' || options.direction === 'left' ? '-h' : '-v');
    if (options.percent) args.push('-p', options.percent);
    if (options.cwd) args.push('-c', options.cwd);
    if (options.dontFocus) args.push('-d');
    args.push(options.command.join(' '));

    await exec('tmux', args);
    const paneId = await exec('tmux', ['display-message', '-p', '#{pane_id}']);
    return { success: true, paneId: paneId.stdout.trim() };
  }
}
```

---

## Implementation Phases

### Phase 1: Core Hook & Basic Pane Spawning (MVP)
- PreToolUse hook implementation
- Basic WezTerm pane spawning
- Simple agent header display
- Configuration file support

### Phase 2: Output Streaming & Display
- Real-time output streaming
- ANSI color support
- Progress indicators
- Error highlighting

### Phase 3: Multi-Agent & Management
- Multiple concurrent agent support
- Pane layout management
- Auto-close functionality
- Pane registry tracking

### Phase 4: Logging & Integration
- Output capture and logging
- Log viewer integration
- Dashboard integration
- Metrics system hooks

---

## Installation & Usage

### Prerequisites

- Claude Code installed and configured
- At least one terminal multiplexer: WezTerm, Zellij, or tmux
- Node.js 18.x or later

### Installation

```bash
# 1. Add the Fortium marketplace (one-time setup)
/plugin marketplace add fortium/ai-mesh-marketplace

# 2. Install the plugin
/plugin install ai-mesh-pane-viewer

# 3. (Optional) Install ai-mesh-core for enhanced integration
/plugin install ai-mesh-core
```

### Quick Start

Once installed, the plugin automatically activates when you spawn subagents:

```bash
# Any Task tool invocation will spawn a monitoring pane
# Example: Using tech-lead-orchestrator spawns a pane showing its output

# Configure via slash command
/pane-config                    # Show current configuration
/pane-config multiplexer auto   # Set auto-detection
/pane-config direction right    # Set split direction
/pane-config floating true      # Enable Zellij floating panes
```

### Configuration File

Create `~/.ai-mesh/pane-viewer.json` for persistent configuration:

```json
{
  "enabled": true,
  "multiplexer": "auto",
  "split_direction": "right",
  "split_percent": 40,
  "auto_close_on_success": false,
  "wezterm": { "use_top_level_split": false },
  "zellij": { "use_floating_panes": false },
  "tmux": { "dont_focus_new_pane": true }
}
```

### Verifying Installation

```bash
# Check plugin is installed
/plugin list

# Test with a simple agent invocation
# The pane should appear when Claude spawns any subagent
```

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| No multiplexer installed | Feature unavailable | Medium | Graceful fallback, clear error message, guide to install |
| Multiplexer CLI version incompatibility | Spawn failures | Low | Version detection and compatibility checks per adapter |
| Pane overflow with many agents | UI unusable | Medium | Limit concurrent panes, tab-based overflow |
| Output capture disk space | Disk full | Low | Retention policy, size limits, compression |
| Performance impact on main session | Slow Claude Code | Low | Async spawn, minimal hook logic |
| Inconsistent behavior across multiplexers | User confusion | Medium | Comprehensive testing, clear documentation of differences |
| Auto-detection false positives | Wrong multiplexer used | Low | Environment variable priority, manual override option |
| tmux session conflicts | Panes in wrong session | Low | Session targeting with `-t` flag, session isolation |

---

## Dependencies

### External
- **WezTerm** (optional): Terminal emulator with rich CLI - [wezterm.org](https://wezterm.org)
- **Zellij** (optional): Modern terminal workspace - [zellij.dev](https://zellij.dev)
- **tmux** (optional): Classic terminal multiplexer - widely available
- **Node.js**: Hook runtime environment (18.x+)

*At least one multiplexer must be installed for the feature to work.*

### Plugin Dependencies
- **ai-mesh-core** (>=4.0.0): Required - provides base configuration and utilities
- **ai-mesh-metrics** (>=1.0.0): Optional - enhanced activity tracking integration

### Internal (within plugin)
- `hooks/pane-spawner.js`: Main PreToolUse hook
- `hooks/adapters/*.js`: Terminal multiplexer adapters
- `lib/config-loader.js`: Configuration management
- `~/.ai-mesh/pane-viewer.json`: User configuration storage

---

## Open Questions

1. **Q1**: Should the agent-viewer process communicate back completion status to the main session?
   - *Proposed*: Yes, via pane registry file updates

2. **Q2**: ~~Should we support tmux as an alternative to WezTerm?~~
   - *Resolved*: Yes, supporting WezTerm, Zellij, and tmux at launch

3. **Q3**: How to handle agents that spawn sub-agents (nested Task calls)?
   - *Proposed*: Each Task call gets its own pane, regardless of nesting

4. **Q4**: Should pane spawning be opt-in or opt-out?
   - *Proposed*: Opt-in with easy enable via `ai-mesh config set pane_spawner.enabled true`

5. **Q5**: What is the priority order for auto-detection when multiple multiplexers are available?
   - *Proposed*: Environment variable detection (most reliable) → WezTerm → Zellij → tmux

6. **Q6**: Should Zellij floating panes be the default, or use splits like other multiplexers?
   - *Proposed*: Use splits by default for consistency; floating panes as opt-in feature

7. **Q7**: How to handle tmux users who run Claude Code outside of tmux?
   - *Proposed*: Check `$TMUX` environment variable; if not set, skip tmux even if installed

---

## Appendix

### Multiplexer CLI Reference

#### WezTerm CLI

**Sources**:
- [WezTerm split-pane documentation](https://wezterm.org/cli/cli/split-pane.html)
- [WezTerm spawn documentation](https://wezterm.org/cli/cli/spawn.html)
- [WezTerm CLI overview](https://wezterm.org/cli/cli/index.html)

**Key Commands**:
```bash
wezterm cli split-pane --right --percent 40 -- command args
wezterm cli split-pane --pane-id $PANE_ID -- command args
```

#### Zellij CLI

**Sources**:
- [Zellij CLI Actions](https://zellij.dev/documentation/cli-actions)
- [Zellij GitHub](https://github.com/zellij-org/zellij)
- [Zellij Documentation](https://zellij.dev/documentation/)

**Key Commands**:
```bash
zellij run -d right --name "Agent" -- command args
zellij action new-pane -d right -- command args
zellij action new-pane -f --name "Floating" -- command args
```

#### tmux CLI

**Sources**:
- [tmux manual page](https://www.man7.org/linux/man-pages/man1/tmux.1.html)
- [Super Guide to split-window](https://gist.github.com/sdondley/b01cc5bb1169c8c83401e438a652b84e)
- [Tao of tmux - Scripting](https://tao-of-tmux.readthedocs.io/en/latest/manuscript/10-scripting.html)

**Key Commands**:
```bash
tmux split-window -h -p 40 "command args"
tmux split-window -h -c /path/to/cwd "command args"
tmux send-keys -t session:0.1 "command args" C-m
```

### Multiplexer Feature Comparison

| Feature | WezTerm | Zellij | tmux |
|---------|---------|--------|------|
| Environment Variable | `WEZTERM_PANE` | `ZELLIJ` | `TMUX` |
| Split Direction | `--right/--left/--top/--bottom` | `-d right/left/up/down` | `-h` (horiz) / `-v` (vert) |
| Pane Sizing | `--percent N` / `--cells N` | Auto-managed | `-p N` / `-l N` |
| Working Directory | `--cwd PATH` | `--cwd PATH` | `-c PATH` |
| Pane Naming | N/A | `--name NAME` | N/A (use send-keys) |
| Floating Panes | ❌ | ✅ (`-f`) | ❌ |
| Close on Exit | Manual | ✅ (`-c`) | Manual |
| Pane ID Return | ✅ (stdout) | ❌ (internal) | ✅ (`#{pane_id}`) |
| Session Persistence | ❌ | ✅ | ✅ |

### Claude Code Hooks Reference

**Sources**:
- Claude Code Hooks Reference (hooks.md)
- Claude Code Hooks Guide (hooks-guide.md)

### Related PRDs

- **[ai-mesh-plugin-architecture-migration.md](./ai-mesh-plugin-architecture-migration.md)** - Parent PRD for plugin ecosystem migration
- `python-to-nodejs-hooks-conversion.md` - Previous hooks migration
- `Infrastructure-Subagent-PRD.md` - Agent system reference

### Claude Code Plugin References

- [Plugins Documentation](https://code.claude.com/docs/en/plugins.md)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide.md)

---

*Generated by product-management-orchestrator*
*ai-mesh Plugin Architecture - Phase 1*
*Target Version: @fortium/ai-mesh-pane-viewer v1.0.0*

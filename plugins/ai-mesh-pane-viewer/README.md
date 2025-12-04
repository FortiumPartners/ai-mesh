# AI Mesh Pane Viewer

Real-time subagent monitoring in terminal panes for Claude Code.

## Overview

The AI Mesh Pane Viewer is a Claude Code plugin that automatically spawns terminal panes to display real-time activity from subagents. When you delegate tasks to agents like `infrastructure-developer` or `frontend-developer`, their work appears in a split pane alongside your main session.

## Features

- **Automatic Pane Spawning**: Spawns viewer panes when subagents are invoked
- **Multi-Multiplexer Support**: Works with WezTerm, Zellij, and tmux
- **Real-Time Updates**: See agent activity as it happens
- **Configurable Layout**: Choose split direction and size
- **Session Persistence**: Reuses panes across multiple agent invocations

## Installation

### Prerequisites

- Node.js 18 or higher
- Claude Code installed
- One of: WezTerm, Zellij, or tmux

### Install Plugin

```bash
# Clone or download plugin
cd ~/.claude/plugins/
git clone https://github.com/FortiumPartners/ai-mesh-pane-viewer.git

# Install dependencies
cd ai-mesh-pane-viewer
npm install

# Restart Claude Code
```

### Verify Installation

```bash
# Check plugin is loaded
claude config plugins list

# Should show: ai-mesh-pane-viewer v0.1.0
```

## Configuration

### Quick Setup

```bash
# Show current configuration
/pane-config

# Use WezTerm with right split at 30%
/pane-config multiplexer wezterm
/pane-config direction right
/pane-config percent 30
```

### Configuration Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `multiplexer` | `auto`, `wezterm`, `zellij`, `tmux` | `auto` | Terminal multiplexer to use |
| `direction` | `right`, `bottom`, `left`, `top` | `right` | Pane split direction |
| `percent` | `10-90` | `30` | Size of viewer pane (%) |
| `floating` | `true`, `false` | `false` | Use floating panes (Zellij only) |

### Configuration File

Settings are saved to `~/.ai-mesh-pane-viewer/config.json`:

```json
{
  "multiplexer": "auto",
  "direction": "right",
  "percent": 30,
  "floating": false,
  "enabled": true
}
```

### Environment Variables

Override configuration via environment:

```bash
# Disable pane viewer
export AI_MESH_PANE_DISABLE=1

# Force specific multiplexer
export AI_MESH_PANE_MULTIPLEXER=wezterm

# Set split direction
export AI_MESH_PANE_DIRECTION=bottom

# Set pane size
export AI_MESH_PANE_PERCENT=40
```

## Usage

### Automatic Mode (Recommended)

The plugin automatically spawns panes when subagents are invoked:

```bash
# This will automatically spawn a viewer pane
/implement-trd @docs/TRD/my-feature.md
```

### Manual Control

Disable automatic spawning and control manually:

```bash
# Disable automatic spawning
export AI_MESH_PANE_DISABLE=1

# Use library API
node -e "
  const { createViewer } = require('@fortium/ai-mesh-pane-viewer');

  (async () => {
    const viewer = await createViewer();
    await viewer.spawn('infrastructure-developer', 'Deploy K8s manifests');
    // ... agent work happens ...
    await viewer.close();
  })();
"
```

## Supported Multiplexers

### WezTerm

**Auto-Detection**: Checks `TERM_PROGRAM=WezTerm` or `WEZTERM_PANE` variable

**Features**:
- Horizontal and vertical splits
- Pane IDs for tracking
- Send keys/text to panes

**Commands Used**:
```bash
wezterm cli split-pane --horizontal --percent 30 -- command
wezterm cli kill-pane --pane-id <id>
wezterm cli send-text --pane-id <id> "text"
```

### Zellij

**Auto-Detection**: Checks `ZELLIJ_SESSION_NAME` variable

**Features**:
- Directional splits (right, bottom, left, top)
- Floating panes support
- Named panes

**Commands Used**:
```bash
zellij action new-pane --direction right --size "30%"
zellij action new-pane --floating
zellij action close-pane
zellij action write-chars "text"
```

### tmux

**Auto-Detection**: Checks `TMUX` variable

**Features**:
- Horizontal and vertical splits
- Pane IDs (e.g., `%123`)
- Send keys/commands

**Commands Used**:
```bash
tmux split-window -h -p 30 "command"
tmux split-window -v -p 30 "command"
tmux kill-pane -t <pane-id>
tmux send-keys -t <pane-id> "text" Enter
```

## Viewer Display

The viewer pane shows real-time agent activity:

```
╔═══════════════════════════════════════════╗
║ AI Mesh Subagent Monitor                  ║
╠═══════════════════════════════════════════╣
║ Agent: infrastructure-developer           ║
║ Status: Active                            ║
║ Task: Deploy Kubernetes manifests         ║
║ Started: 14:23:45                         ║
║ Duration: 00:02:15                        ║
╠═══════════════════════════════════════════╣
║ Recent Activity:                          ║
║ • Created deployment.yaml                 ║
║ • Created service.yaml                    ║
║ • Running kubectl apply                   ║
║ • Deployment successful                   ║
╚═══════════════════════════════════════════╝
```

## Troubleshooting

### Panes Not Spawning

1. **Check multiplexer is running**:
   ```bash
   echo $TERM_PROGRAM  # Should show WezTerm
   echo $ZELLIJ_SESSION_NAME  # Should show session name
   echo $TMUX  # Should show tmux info
   ```

2. **Verify plugin is loaded**:
   ```bash
   claude config plugins list
   ```

3. **Check configuration**:
   ```bash
   /pane-config
   ```

4. **Enable debug logging**:
   ```bash
   export DEBUG=ai-mesh-pane-viewer:*
   ```

### Panes Not Updating

1. **Check viewer is running**:
   ```bash
   ps aux | grep agent-viewer
   ```

2. **Verify state file**:
   ```bash
   cat ~/.ai-mesh-pane-viewer/panes.json
   ```

3. **Restart Claude Code** and try again

### Wrong Multiplexer Detected

Force specific multiplexer:

```bash
# Via environment
export AI_MESH_PANE_MULTIPLEXER=wezterm

# Via config command
/pane-config multiplexer wezterm
```

## Development

### Project Structure

```
ai-mesh-pane-viewer/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── hooks/
│   ├── hooks.json           # Hook definitions
│   ├── pane-spawner.js      # PreToolUse hook
│   ├── agent-viewer.js      # UI renderer
│   ├── pane-manager.js      # Pane lifecycle
│   └── adapters/            # Multiplexer adapters
├── commands/
│   └── pane-config.md       # Config command
├── lib/
│   └── index.js             # Public API
└── tests/                   # Test suite
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Adding a New Multiplexer

1. Create adapter in `hooks/adapters/`:
   ```javascript
   const { BaseMultiplexerAdapter } = require('./base-adapter');

   class NewAdapter extends BaseMultiplexerAdapter {
     // Implement required methods
   }
   ```

2. Register in `hooks/adapters/index.js`

3. Add detection logic to `multiplexer-detector.js`

4. Add tests in `tests/adapters.test.js`

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/FortiumPartners/ai-mesh-pane-viewer/issues
- **Email**: support@fortiumpartners.com
- **Documentation**: https://docs.fortiumpartners.com/ai-mesh-pane-viewer

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Credits

Developed by [Fortium Partners](https://fortiumpartners.com) as part of the AI Mesh ecosystem.

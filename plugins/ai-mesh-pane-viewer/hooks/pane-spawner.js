#!/usr/bin/env node

/**
 * Pane Spawner Hook
 *
 * PreToolUse hook that spawns a terminal pane when a Task tool is invoked.
 * Displays real-time subagent activity in a split pane.
 *
 * Hook Flow:
 * 1. Detect if Task tool is being invoked
 * 2. Load configuration from ~/.ai-mesh-pane-viewer/config.json
 * 3. Auto-detect or use configured multiplexer
 * 4. Spawn/reuse pane with agent-viewer.js
 * 5. Send agent name and task info to viewer
 *
 * Environment Variables:
 * - AI_MESH_PANE_DISABLE: Set to '1' to disable pane spawning
 * - AI_MESH_PANE_MULTIPLEXER: Override auto-detection ('wezterm', 'zellij', 'tmux')
 */

const { PaneManager } = require('./pane-manager');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.ai-mesh-pane-viewer', 'config.json');
const ACTIVE_AGENTS_PATH = path.join(os.homedir(), '.ai-mesh-pane-viewer', 'active-agents.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {}
  return {
    enabled: true,
    direction: 'right',
    percent: 40,
    reusePane: true
  };
}

function loadActiveAgents() {
  try {
    if (fs.existsSync(ACTIVE_AGENTS_PATH)) {
      return JSON.parse(fs.readFileSync(ACTIVE_AGENTS_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveActiveAgents(agents) {
  const dir = path.dirname(ACTIVE_AGENTS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ACTIVE_AGENTS_PATH, JSON.stringify(agents, null, 2));
}

async function main(hookData) {
  try {
    // Check disable flag
    if (process.env.AI_MESH_PANE_DISABLE === '1') {
      return;
    }

    const config = loadConfig();
    if (!config.enabled) {
      return;
    }

    // Only handle Task tool
    if (hookData.tool !== 'Task') {
      return;
    }

    // Extract agent info from parameters
    const params = hookData.parameters || hookData.input || {};
    const agentType = params.subagent_type || 'unknown';
    const description = params.description || '';
    const prompt = params.prompt || '';

    // Initialize pane manager
    const manager = new PaneManager();

    // Get or create viewer pane
    const paneId = await manager.getOrCreatePane({
      direction: config.direction,
      percent: config.percent,
      reuseExisting: config.reusePane
    });

    // Send agent info to viewer
    await manager.sendMessage(paneId, {
      type: 'agent_start',
      timestamp: new Date().toISOString(),
      agent: agentType,
      description: description,
      promptPreview: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : '')
    });

    // Track agent start time for duration calculation
    const agentKey = `${agentType}:${description}`.substring(0, 100);
    const activeAgents = loadActiveAgents();
    activeAgents[agentKey] = {
      startTime: new Date().toISOString(),
      agent: agentType,
      description: description,
      paneId: paneId
    };
    saveActiveAgents(activeAgents);

  } catch (error) {
    // Fail silently to not interrupt Claude Code workflow
    console.error('[pane-spawner] Error:', error.message);
  }
}

// Read hook data from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const hookData = JSON.parse(inputData);
    await main(hookData);
  } catch (error) {
    console.error('[pane-spawner] Failed to parse hook data:', error.message);
  }
});

#!/usr/bin/env node

/**
 * Pane Completion Hook
 *
 * PostToolUse hook that sends completion events to the viewer pane
 * when a Task tool finishes execution.
 */

const { PaneManager } = require('./pane-manager');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ACTIVE_AGENTS_PATH = path.join(os.homedir(), '.ai-mesh-pane-viewer', 'active-agents.json');

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

function calculateDuration(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const durationMs = now - start;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

async function main(hookData) {
  try {
    if (process.env.AI_MESH_PANE_DISABLE === '1') {
      return;
    }

    // Only handle Task tool
    if (hookData.tool !== 'Task') {
      return;
    }

    // Load active agents to find the matching start event
    const activeAgents = loadActiveAgents();

    // Extract agent info
    const params = hookData.parameters || hookData.input || {};
    const agentType = params.subagent_type || 'unknown';
    const description = params.description || '';

    // Create a key to match with the start event
    const agentKey = `${agentType}:${description}`.substring(0, 100);

    // Find matching agent start
    const agentInfo = activeAgents[agentKey];

    // Initialize pane manager
    const manager = new PaneManager();

    // Get existing pane (don't create new one)
    const state = await manager.loadState();
    const sessionKey = Object.keys(state.panes)[0]; // Get first available pane
    if (!sessionKey || !state.panes[sessionKey]) {
      return; // No viewer pane exists
    }

    const paneId = state.panes[sessionKey].paneId;

    // Determine if this was an error or success
    const isError = hookData.error || (hookData.output && hookData.output.error);
    const errorMessage = hookData.error?.message || hookData.output?.error || null;

    // Calculate duration if we have start time
    const duration = agentInfo?.startTime
      ? calculateDuration(agentInfo.startTime)
      : 'unknown';

    // Send completion message
    await manager.sendMessage(paneId, {
      type: isError ? 'agent_error' : 'agent_complete',
      timestamp: new Date().toISOString(),
      agent: agentType,
      description: description,
      duration: duration,
      error: errorMessage
    });

    // Remove from active agents
    if (agentInfo) {
      delete activeAgents[agentKey];
      saveActiveAgents(activeAgents);
    }

  } catch (error) {
    console.error('[pane-completion] Error:', error.message);
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
    console.error('[pane-completion] Failed to parse hook data:', error.message);
  }
});

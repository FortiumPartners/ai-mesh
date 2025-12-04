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

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Main hook entry point
 * @param {Object} hookData - Claude Code hook data
 * @param {string} hookData.tool - Tool being invoked
 * @param {Object} hookData.parameters - Tool parameters
 */
async function main(hookData) {
  try {
    // Check if disabled
    if (process.env.AI_MESH_PANE_DISABLE === '1') {
      return;
    }

    // TODO: Implement pane spawning logic
    // 1. Parse hookData to extract agent/task info
    // 2. Load config from ~/.ai-mesh-pane-viewer/config.json
    // 3. Use MultiplexerDetector to find/select multiplexer
    // 4. Use PaneManager to spawn/reuse pane
    // 5. Send task info to agent-viewer.js

    console.error('[pane-spawner] TODO: Implement pane spawning');
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

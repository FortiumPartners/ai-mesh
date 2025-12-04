#!/usr/bin/env node

/**
 * Agent Viewer
 *
 * Real-time display of subagent activity in a terminal pane.
 * Receives updates via stdin and displays formatted agent status.
 *
 * Display Format:
 * ╔═══════════════════════════════════════════╗
 * ║ AI Mesh Subagent Monitor                  ║
 * ╠═══════════════════════════════════════════╣
 * ║ Agent: infrastructure-developer           ║
 * ║ Status: Active                            ║
 * ║ Task: Deploy Kubernetes manifests         ║
 * ║ Started: 14:23:45                         ║
 * ║ Duration: 00:02:15                        ║
 * ╠═══════════════════════════════════════════╣
 * ║ Recent Activity:                          ║
 * ║ • Created deployment.yaml                 ║
 * ║ • Created service.yaml                    ║
 * ║ • Running kubectl apply                   ║
 * ╚═══════════════════════════════════════════╝
 *
 * Input Format (JSON on stdin):
 * {
 *   "type": "task_start|task_update|task_complete",
 *   "agent": "agent-name",
 *   "task": "Task description",
 *   "status": "active|complete|error",
 *   "activity": ["activity line 1", "activity line 2"]
 * }
 */

const readline = require('readline');

/**
 * Agent viewer state
 */
const state = {
  agent: null,
  task: null,
  status: 'Waiting',
  startTime: null,
  activity: []
};

/**
 * Clear screen and redraw viewer
 */
function redraw() {
  // TODO: Implement terminal UI rendering
  // 1. Clear screen (console.clear() or ANSI codes)
  // 2. Draw border with box-drawing characters
  // 3. Display current state (agent, task, status, duration)
  // 4. Display activity log (last 10 items)
  // 5. Use colors for status (green=active, blue=complete, red=error)

  console.log('[agent-viewer] TODO: Implement UI rendering');
  console.log('Current state:', JSON.stringify(state, null, 2));
}

/**
 * Handle incoming message
 * @param {Object} message - Incoming message object
 */
function handleMessage(message) {
  try {
    switch (message.type) {
      case 'task_start':
        state.agent = message.agent;
        state.task = message.task;
        state.status = 'Active';
        state.startTime = Date.now();
        state.activity = [];
        break;

      case 'task_update':
        if (message.activity) {
          state.activity = [...message.activity.slice(-10)]; // Keep last 10
        }
        break;

      case 'task_complete':
        state.status = message.status || 'Complete';
        break;

      default:
        console.error('[agent-viewer] Unknown message type:', message.type);
    }

    redraw();
  } catch (error) {
    console.error('[agent-viewer] Error handling message:', error.message);
  }
}

/**
 * Main entry point
 */
function main() {
  console.log('[agent-viewer] Starting agent viewer...');

  // TODO: Initialize terminal UI
  // 1. Set up terminal (raw mode, hide cursor)
  // 2. Register cleanup handlers (restore terminal on exit)
  // 3. Display initial empty state

  // Read JSON messages from stdin
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    try {
      const message = JSON.parse(line);
      handleMessage(message);
    } catch (error) {
      console.error('[agent-viewer] Invalid JSON:', error.message);
    }
  });

  // Initial draw
  redraw();
}

// Handle cleanup
process.on('SIGINT', () => {
  // TODO: Restore terminal state
  console.log('\n[agent-viewer] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  // TODO: Restore terminal state
  process.exit(0);
});

main();

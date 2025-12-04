#!/usr/bin/env node

/**
 * Agent Viewer
 *
 * Real-time display of subagent activity in a terminal pane.
 * Receives updates via stdin and displays formatted agent status.
 */

const readline = require('readline');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

const agentColors = {
  'frontend-developer': colors.cyan,
  'backend-developer': colors.green,
  'code-reviewer': colors.yellow,
  'test-runner': colors.blue,
  'documentation-specialist': colors.magenta,
  'default': colors.gray
};

function getAgentColor(agent) {
  return agentColors[agent] || agentColors.default;
}

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function printHeader() {
  console.log(`${colors.bright}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║  ${colors.cyan}AI-Mesh Subagent Monitor${colors.reset}${colors.bright}           ║${colors.reset}`);
  console.log(`${colors.bright}╚════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

function printAgentStart(msg) {
  const color = getAgentColor(msg.agent);
  const time = formatTimestamp(msg.timestamp);

  console.log(`${colors.dim}[${time}]${colors.reset} ${color}${colors.bright}▶ ${msg.agent}${colors.reset}`);

  if (msg.description) {
    console.log(`  ${colors.dim}Task:${colors.reset} ${msg.description}`);
  }

  if (msg.promptPreview) {
    console.log(`  ${colors.dim}Prompt:${colors.reset} ${msg.promptPreview.substring(0, 80)}...`);
  }

  console.log();
}

function printAgentComplete(msg) {
  const color = getAgentColor(msg.agent);
  const time = formatTimestamp(msg.timestamp);

  console.log(`${colors.dim}[${time}]${colors.reset} ${color}✓ ${msg.agent}${colors.reset} ${colors.dim}completed${colors.reset}`);

  if (msg.duration) {
    console.log(`  ${colors.dim}Duration:${colors.reset} ${msg.duration}`);
  }

  console.log();
}

function printAgentError(msg) {
  const time = formatTimestamp(msg.timestamp);
  console.log(`${colors.dim}[${time}]${colors.reset} ${colors.yellow}⚠ ${msg.agent}${colors.reset} ${colors.dim}error${colors.reset}`);

  if (msg.error) {
    console.log(`  ${colors.yellow}${msg.error}${colors.reset}`);
  }

  console.log();
}

function handleMessage(line) {
  try {
    const msg = JSON.parse(line.trim());

    switch (msg.type) {
      case 'agent_start':
        printAgentStart(msg);
        break;
      case 'agent_complete':
        printAgentComplete(msg);
        break;
      case 'agent_error':
        printAgentError(msg);
        break;
      default:
        console.log(`${colors.dim}[message]${colors.reset}`, msg);
    }
  } catch {
    // Not JSON, just echo
    if (line.trim()) {
      console.log(line);
    }
  }
}

// Main
clearScreen();
printHeader();
console.log(`${colors.dim}Waiting for subagent activity...${colors.reset}`);
console.log();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', handleMessage);

rl.on('close', () => {
  console.log(`${colors.dim}Session ended.${colors.reset}`);
  process.exit(0);
});

// Keep process alive
process.stdin.resume();

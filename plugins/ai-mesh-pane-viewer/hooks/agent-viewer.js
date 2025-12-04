#!/usr/bin/env node

/**
 * Agent Viewer
 *
 * Real-time display of subagent activity by tailing Claude transcript files.
 * Watches the transcript file for tool use and tool result events.
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const transcriptPath = getArg('transcript');
const taskId = getArg('task-id');
const agentType = getArg('agent') || 'unknown';
const description = getArg('description') || '';

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

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function printHeader() {
  console.log(`${colors.bright}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║  ${colors.cyan}AI-Mesh Subagent Monitor${colors.reset}${colors.bright}             ║${colors.reset}`);
  console.log(`${colors.bright}╚════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

function printAgentStart() {
  const time = formatTime(new Date().toISOString());
  console.log(`${colors.dim}[${time}]${colors.reset} ${colors.cyan}${colors.bright}▶ ${agentType}${colors.reset}`);
  if (description) {
    console.log(`  ${colors.dim}Task:${colors.reset} ${description}`);
  }
  console.log();
}

function summarizeInput(toolName, input) {
  if (!input) return '';
  switch(toolName) {
    case 'Read': return input.file_path ? path.basename(input.file_path) : '';
    case 'Write': return input.file_path ? path.basename(input.file_path) : '';
    case 'Edit': return input.file_path ? path.basename(input.file_path) : '';
    case 'Glob': return input.pattern || '';
    case 'Grep': return `"${input.pattern || ''}"`;
    case 'Bash': return (input.command || '').substring(0, 40) + ((input.command?.length > 40) ? '...' : '');
    case 'Task': return input.subagent_type || '';
    default: return '';
  }
}

function printToolUse(toolName, input, timestamp) {
  const time = formatTime(timestamp);
  const summary = summarizeInput(toolName, input);
  const summaryStr = summary ? ` ${colors.dim}${summary}${colors.reset}` : '';
  console.log(`${colors.dim}[${time}]${colors.reset}   ${colors.blue}→${colors.reset} ${toolName}${summaryStr}`);
}

function printToolResult(toolName, timestamp) {
  // We don't print results by default to keep output clean
  // Could optionally show: console.log(`${colors.dim}[${time}]${colors.reset}   ${colors.green}✓${colors.reset}`);
}

function printAgentComplete(duration) {
  const time = formatTime(new Date().toISOString());
  console.log();
  console.log(`${colors.dim}[${time}]${colors.reset} ${colors.green}✓ ${agentType} completed${colors.reset} ${colors.dim}(${duration})${colors.reset}`);
}

// Track state
let taskStarted = false;
let taskCompleted = false;
let startTime = Date.now();
let fileSize = 0;
let pendingTools = new Map(); // Track tool_use_id -> toolName
let agentTranscriptPath = null;
let watchingAgentFile = false;

// Watch for new agent-*.jsonl files in the transcript directory
function watchForAgentTranscript() {
  if (!transcriptPath) {
    console.log(`${colors.yellow}No transcript path provided.${colors.reset}`);
    return;
  }

  const transcriptDir = path.dirname(transcriptPath);

  // Get existing agent files before we start
  const existingFiles = new Set();
  try {
    const files = fs.readdirSync(transcriptDir);
    files.filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'))
         .forEach(f => existingFiles.add(f));
  } catch (e) {
    console.log(`${colors.yellow}Cannot read transcript directory${colors.reset}`);
    return;
  }

  console.log(`${colors.dim}Watching for subagent activity...${colors.reset}`);
  console.log();

  // Poll for new agent files
  const checkForNewAgentFile = () => {
    if (taskCompleted || watchingAgentFile) return;

    try {
      const files = fs.readdirSync(transcriptDir);
      const agentFiles = files.filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'));

      for (const file of agentFiles) {
        if (!existingFiles.has(file)) {
          // Found a new agent file!
          agentTranscriptPath = path.join(transcriptDir, file);
          console.log(`${colors.dim}Found agent transcript: ${file}${colors.reset}`);
          watchingAgentFile = true;
          startWatchingAgentFile();
          return;
        }
      }
    } catch (e) {
      // Directory might be temporarily unavailable
    }
  };

  // Check every 100ms for new agent files
  setInterval(checkForNewAgentFile, 100);
}

function startWatchingAgentFile() {
  if (!agentTranscriptPath || !fs.existsSync(agentTranscriptPath)) {
    return;
  }

  // Start from beginning of file
  fileSize = 0;

  // Watch for changes
  try {
    fs.watch(agentTranscriptPath, (eventType) => {
      if (eventType === 'change') {
        readNewLines();
      }
    });
  } catch (e) {
    // fs.watch might not be available
  }

  // Also poll periodically as fs.watch can be unreliable
  setInterval(readNewLines, 100);

  // Do initial read
  readNewLines();
}

function readNewLines() {
  if (taskCompleted || !agentTranscriptPath) return;

  try {
    const stats = fs.statSync(agentTranscriptPath);
    if (stats.size <= fileSize) return;

    // Read new content
    const fd = fs.openSync(agentTranscriptPath, 'r');
    const buffer = Buffer.alloc(stats.size - fileSize);
    fs.readSync(fd, buffer, 0, buffer.length, fileSize);
    fs.closeSync(fd);

    fileSize = stats.size;

    // Process new lines
    const newContent = buffer.toString('utf-8');
    const lines = newContent.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        processEntry(entry);
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  } catch (e) {
    // File might be temporarily unavailable
  }
}

function processEntry(entry) {
  // Look for tool_use in assistant messages
  if (entry.type === 'assistant' && entry.message?.content) {
    for (const block of entry.message.content) {
      if (block.type === 'tool_use') {
        // Check if this is OUR task completing (a Task tool_result for our taskId)
        pendingTools.set(block.id, block.name);

        // Don't show the initial Task invocation (that's us starting)
        if (block.name !== 'Task' || taskStarted) {
          printToolUse(block.name, block.input, entry.timestamp);
        }
      }
    }
  }

  // Look for tool_result
  if (entry.type === 'user' && entry.message?.content) {
    for (const block of entry.message.content) {
      if (block.type === 'tool_result') {
        const toolName = pendingTools.get(block.tool_use_id);
        if (toolName) {
          pendingTools.delete(block.tool_use_id);

          // Check if this is our Task completing
          if (block.tool_use_id === taskId) {
            const duration = Math.round((Date.now() - startTime) / 1000);
            printAgentComplete(`${duration}s`);
            taskCompleted = true;
          }
        }
      }
    }
  }
}

// Main
clearScreen();
printHeader();
printAgentStart();
taskStarted = true;

if (transcriptPath) {
  watchForAgentTranscript();
} else {
  console.log(`${colors.dim}No transcript path provided. Waiting for messages...${colors.reset}`);

  // Fallback to stdin for backwards compatibility
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  rl.on('line', (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.type === 'agent_complete') {
        printAgentComplete(msg.duration || 'unknown');
      }
    } catch {}
  });
}

// Keep alive
process.stdin.resume();

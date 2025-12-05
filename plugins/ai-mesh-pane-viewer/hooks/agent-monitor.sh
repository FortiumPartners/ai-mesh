#!/bin/bash

# Agent monitor - displays real-time subagent activity in a terminal pane
# Usage: agent-monitor.sh <agent-type> <description> <signal-file> <transcript-dir>

AGENT_TYPE="${1:-unknown}"
DESCRIPTION="${2:-No description}"
SIGNAL_FILE="${3:-/tmp/agent-signal-$$}"
TRANSCRIPT_DIR="${4:-}"
START_TIME=$(date +%s)

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[31m'
YELLOW='\033[33m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# Track existing agent files before we start
EXISTING_FILES=$(mktemp)
if [ -n "$TRANSCRIPT_DIR" ] && [ -d "$TRANSCRIPT_DIR" ]; then
    ls "$TRANSCRIPT_DIR"/agent-*.jsonl 2>/dev/null > "$EXISTING_FILES"
fi

# Clean exit handler
cleanup() {
    rm -f "$SIGNAL_FILE" "$EXISTING_FILES" 2>/dev/null
    # Kill background tail process if running
    [ -n "$TAIL_PID" ] && kill "$TAIL_PID" 2>/dev/null
    exit 0
}
trap cleanup EXIT INT TERM

clear

echo -e "${BOLD}╔════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║  ${CYAN}AI-Mesh Subagent Monitor${RESET}${BOLD}             ║${RESET}"
echo -e "${BOLD}╚════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${CYAN}${BOLD}▶ ${AGENT_TYPE}${RESET}"
echo -e "  ${DIM}Task:${RESET} ${DESCRIPTION}"
echo ""
echo -e "  ${DIM}Status:${RESET} Running..."
echo ""

# Function to extract and display tool names and results from JSONL
show_tools() {
    local file="$1"
    tail -f "$file" 2>/dev/null | while IFS= read -r line; do
        # Check if signal file exists (time to stop)
        [ -f "$SIGNAL_FILE" ] && break

        # Extract tool_use and tool_result entries
        OUTPUT=$(echo "$line" | python3 -c "
import sys, json
try:
    entry = json.loads(sys.stdin.read())
    content = entry.get('message', {}).get('content', [])
    if isinstance(content, list):
        for item in content:
            # Handle tool_use entries
            if item.get('type') == 'tool_use':
                name = item.get('name', '')
                inp = item.get('input', {})
                # Get brief summary based on tool type
                if name == 'Read':
                    summary = inp.get('file_path', '').split('/')[-1]
                elif name == 'Write':
                    summary = inp.get('file_path', '').split('/')[-1]
                elif name == 'Edit':
                    summary = inp.get('file_path', '').split('/')[-1]
                elif name == 'Glob':
                    summary = inp.get('pattern', '')
                elif name == 'Grep':
                    summary = inp.get('pattern', '')[:30]
                elif name == 'Bash':
                    cmd = inp.get('command', '')[:35]
                    summary = cmd + ('...' if len(inp.get('command', '')) > 35 else '')
                elif name == 'Task':
                    summary = inp.get('subagent_type', '')
                else:
                    summary = ''
                if summary:
                    print(f'TOOL:{name}: {summary}')
                else:
                    print(f'TOOL:{name}')
            # Handle tool_result entries
            elif item.get('type') == 'tool_result':
                tool_id = item.get('tool_use_id', '')
                result_content = item.get('content', '')
                if isinstance(result_content, str) and result_content.strip():
                    # Check if this looks like Bash output (heuristic: has newlines, looks like terminal)
                    all_lines = result_content.strip().split('\n')
                    # Show more for Bash-like output (15 lines, 100 chars)
                    max_lines = 15
                    max_width = 100
                    lines = all_lines[:max_lines]
                    for line in lines:
                        truncated = line[:max_width] + ('...' if len(line) > max_width else '')
                        print(f'OUT:{truncated}')
                    if len(all_lines) > max_lines:
                        print(f'OUT:  ... ({len(all_lines) - max_lines} more lines)')
except:
    pass
" 2>/dev/null)

        # Display with appropriate formatting
        echo "$OUTPUT" | while IFS= read -r out_line; do
            if [[ "$out_line" == TOOL:* ]]; then
                echo -e "  ${DIM}→${RESET} ${YELLOW}${out_line#TOOL:}${RESET}"
            elif [[ "$out_line" == OUT:* ]]; then
                echo -e "    ${DIM}${out_line#OUT:}${RESET}"
            fi
        done
    done
}

# Watch for new agent transcript file and tail it
watch_transcript() {
    if [ -z "$TRANSCRIPT_DIR" ] || [ ! -d "$TRANSCRIPT_DIR" ]; then
        return
    fi

    local agent_file=""
    local attempts=0
    local max_attempts=100  # 10 seconds max wait

    # Poll for new agent file
    while [ -z "$agent_file" ] && [ $attempts -lt $max_attempts ] && [ ! -f "$SIGNAL_FILE" ]; do
        for f in "$TRANSCRIPT_DIR"/agent-*.jsonl; do
            [ -f "$f" ] || continue
            if ! grep -qxF "$f" "$EXISTING_FILES" 2>/dev/null; then
                agent_file="$f"
                break
            fi
        done
        [ -z "$agent_file" ] && sleep 0.1
        attempts=$((attempts + 1))
    done

    if [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        show_tools "$agent_file" &
        TAIL_PID=$!
    fi
}

# Start watching for transcript in background
watch_transcript &
WATCH_PID=$!

# Poll for signal file (check every 200ms, no timeout - user closes manually)
while [ ! -f "$SIGNAL_FILE" ]; do
    sleep 0.2
done

# Kill background processes
kill "$WATCH_PID" 2>/dev/null
[ -n "$TAIL_PID" ] && kill "$TAIL_PID" 2>/dev/null

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Format duration
if [ $DURATION -ge 60 ]; then
    MINS=$((DURATION / 60))
    SECS=$((DURATION % 60))
    DURATION_STR="${MINS}m ${SECS}s"
else
    DURATION_STR="${DURATION}s"
fi

# Show result
echo ""
SIGNAL=$(cat "$SIGNAL_FILE")
if [[ "$SIGNAL" == error:* ]]; then
    ERROR_MSG="${SIGNAL#error:}"
    echo -e "  ${DIM}Status:${RESET} ${RED}✗ Failed${RESET} ${DIM}(${DURATION_STR})${RESET}"
    echo -e "  ${DIM}Error:${RESET} ${ERROR_MSG}"
else
    echo -e "  ${DIM}Status:${RESET} ${GREEN}✓ Completed${RESET} ${DIM}(${DURATION_STR})${RESET}"
fi

echo ""
echo -e "${DIM}Press any key to close...${RESET}"
read -n 1 -s

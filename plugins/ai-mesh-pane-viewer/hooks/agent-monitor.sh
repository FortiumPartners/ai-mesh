#!/bin/bash

# Simple agent monitor - displays subagent status in a terminal pane
# Usage: agent-monitor.sh <agent-type> <description> <signal-file>

AGENT_TYPE="${1:-unknown}"
DESCRIPTION="${2:-No description}"
SIGNAL_FILE="${3:-/tmp/agent-signal-$$}"
START_TIME=$(date +%s)

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[31m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# Clean exit handler
trap "rm -f '$SIGNAL_FILE' 2>/dev/null; exit 0" EXIT INT TERM

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

# Poll for signal file (check every 500ms)
TIMEOUT=300  # 5 minute timeout
ELAPSED=0
while [ ! -f "$SIGNAL_FILE" ] && [ $ELAPSED -lt $TIMEOUT ]; do
    sleep 0.5
    ELAPSED=$((ELAPSED + 1))
done

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

# Clear the "Running..." line and show result
echo -e "\033[2A\033[K"  # Move up 2 lines and clear

if [ -f "$SIGNAL_FILE" ]; then
    SIGNAL=$(cat "$SIGNAL_FILE")
    if [[ "$SIGNAL" == error:* ]]; then
        ERROR_MSG="${SIGNAL#error:}"
        echo -e "  ${DIM}Status:${RESET} ${RED}✗ Failed${RESET} ${DIM}(${DURATION_STR})${RESET}"
        echo -e "  ${DIM}Error:${RESET} ${ERROR_MSG}"
    else
        echo -e "  ${DIM}Status:${RESET} ${GREEN}✓ Completed${RESET} ${DIM}(${DURATION_STR})${RESET}"
    fi
else
    echo -e "  ${DIM}Status:${RESET} ${RED}✗ Timeout${RESET} ${DIM}(${DURATION_STR})${RESET}"
fi

echo ""
sleep 3

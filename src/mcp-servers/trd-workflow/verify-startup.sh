#!/bin/bash

# Verify MCP server can start up successfully
# This script starts the server and checks for successful initialization logs

echo "Testing MCP server startup..."
echo ""

# Start server and capture logs
LOG_FILE=$(mktemp)
timeout 1 node server.js 2> "$LOG_FILE" || true

# Check logs for successful startup
echo "Server logs:"
cat "$LOG_FILE"
echo ""

if grep -q "Server connected and ready" "$LOG_FILE"; then
    echo "✓ Server initialized successfully"
    echo "✓ MCP protocol ready for stdio communication"
    rm -f "$LOG_FILE"
    exit 0
else
    echo "✗ Server initialization failed or incomplete"
    rm -f "$LOG_FILE"
    exit 1
fi

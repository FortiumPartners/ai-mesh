# TRD Workflow MCP Server

**Version**: 1.0.0
**Status**: Phase 1, Sprint 1.1 Complete
**Related**: TRD-MCP-WORKFLOW-001

## Overview

MCP (Model Context Protocol) server that exposes the TRD workflow library as callable tools for Claude and other AI systems. Enables automated workflow enhancements, checkpoint injection, task analysis, and quality gate generation through a standardized protocol.

## Architecture

```
src/mcp-servers/trd-workflow/
├── server.js              # Main MCP server entry point
├── lib/
│   ├── tool-registry.js   # Tool registration and execution framework
│   └── logger.js          # Structured logging utility
├── handlers/              # Tool handler implementations (Sprint 1.2)
│   └── .gitkeep
├── package.json           # NPM package configuration
└── README.md             # This file
```

## Features

### Phase 1, Sprint 1.1 (Current)

- ✅ MCP SDK server initialization
- ✅ Stdio transport for Claude integration
- ✅ Tool registration framework
- ✅ Request handler implementation (ListTools, CallTool)
- ✅ Structured logging and diagnostics
- ✅ Graceful startup and shutdown
- ✅ Error handling and validation

### Phase 1, Sprint 1.2 (Next)

- ⏳ Tool handler implementations
- ⏳ Integration with `../../trd-workflow/lib/`
- ⏳ Comprehensive test coverage

## Installation

```bash
# Navigate to the MCP server directory
cd src/mcp-servers/trd-workflow

# Install dependencies
npm install

# Or install from project root (recommended)
cd /Users/ldangelo/Development/Fortium/ai-mesh
npm install --prefix src/mcp-servers/trd-workflow
```

## Usage

### Starting the Server

```bash
# Start server with stdio transport
npm start

# Development mode with debug logging
npm run dev

# Using node directly
node server.js
```

### Integration with Claude

Add to your MCP configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "trd-workflow": {
      "command": "node",
      "args": [
        "/Users/ldangelo/Development/Fortium/ai-mesh/src/mcp-servers/trd-workflow/server.js"
      ]
    }
  }
}
```

### Environment Variables

- `LOG_LEVEL`: Set logging verbosity (`debug`, `info`, `warn`, `error`) - Default: `info`
- `NODE_ENV`: Set environment mode (`development`, `production`) - Default: `production`

## Server Capabilities

### ListTools Request

Returns all registered tools with their schemas:

```javascript
{
  "method": "tools/list",
  "params": {}
}
```

**Response**:
```javascript
{
  "tools": [
    {
      "name": "toolName",
      "description": "Tool description",
      "inputSchema": { /* JSON Schema */ }
    }
  ]
}
```

### CallTool Request

Execute a registered tool:

```javascript
{
  "method": "tools/call",
  "params": {
    "name": "toolName",
    "arguments": { /* tool-specific args */ }
  }
}
```

**Response**:
```javascript
{
  "content": [
    {
      "type": "text",
      "text": "{ /* JSON result */ }"
    }
  ]
}
```

## Tool Registry

The tool registry provides a framework for dynamic tool registration:

```javascript
import { registry } from './lib/tool-registry.js';

// Register a tool
registry.register(
  {
    name: 'myTool',
    description: 'Description of what the tool does',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      },
      required: ['input']
    }
  },
  async (args) => {
    // Tool implementation
    return { result: 'success' };
  }
);

// Execute a tool
const result = await registry.execute('myTool', { input: 'test' });

// List all tools
const tools = registry.list();
```

## Logging

Structured JSON logging to stderr (stdout reserved for MCP protocol):

```javascript
import { logger } from './lib/logger.js';

logger.debug('Debug message', { context: 'data' });
logger.info('Info message');
logger.warn('Warning message', { details: 'something' });
logger.error('Error message', { error: err.message });

// Performance metrics
logger.metric('operation', duration_ms, { additional: 'context' });
```

**Log Format**:
```json
{
  "timestamp": "2025-12-03T10:00:00.000Z",
  "level": "info",
  "name": "trd-workflow-mcp",
  "message": "Log message",
  "additionalContext": "value"
}
```

## Testing

### Manual Testing

```bash
# Start the server
node server.js

# Server should log:
# {"timestamp":"...","level":"info","name":"trd-workflow-mcp","message":"Starting TRD Workflow MCP Server",...}
# {"timestamp":"...","level":"info","name":"trd-workflow-mcp","message":"Server connected and ready",...}
```

### Testing with MCP Inspector

```bash
# Install MCP Inspector (if not already installed)
npm install -g @modelcontextprotocol/inspector

# Test the server
mcp-inspector node server.js
```

### Programmatic Testing

```javascript
import { registry } from './lib/tool-registry.js';

// Check registry is empty (no handlers loaded yet)
console.log('Tools registered:', registry.stats().totalTools);
// => 0 (Sprint 1.2 will add handlers)

// Validate registry functionality
registry.register(
  {
    name: 'test',
    description: 'Test tool',
    inputSchema: { type: 'object' }
  },
  async () => ({ success: true })
);

console.log('Tools after registration:', registry.stats().totalTools);
// => 1
```

## Error Handling

The server implements comprehensive error handling:

- **Invalid tool name**: Returns `MethodNotFound` error
- **Invalid arguments**: Returns `InvalidParams` error with validation details
- **Execution errors**: Returns `InternalError` with error message
- **Uncaught exceptions**: Logged and server exits gracefully
- **Shutdown signals**: Graceful cleanup on SIGINT/SIGTERM

## Performance Metrics

All tool executions are automatically timed and logged:

```json
{
  "timestamp": "2025-12-03T10:00:00.000Z",
  "level": "info",
  "name": "trd-workflow-mcp",
  "message": "Performance: tool.injectWorkflowTasks",
  "metric": true,
  "operation": "tool.injectWorkflowTasks",
  "duration_ms": 145,
  "success": true
}
```

## Next Steps (Sprint 1.2)

1. **Implement Tool Handlers**: Create handlers for each TRD workflow function
2. **Integration Testing**: Validate integration with `../../trd-workflow/lib/`
3. **Error Scenarios**: Test edge cases and error handling
4. **Documentation**: Update with available tools and examples

## Related Files

- **TRD Workflow Library**: `../../trd-workflow/lib/index.js`
- **MCP SDK**: `node_modules/@modelcontextprotocol/sdk/`
- **Project Root**: `/Users/ldangelo/Development/Fortium/ai-mesh/`

## Support

For issues or questions:
- Check logs in stderr
- Verify MCP SDK version compatibility
- Review tool registration in `handlers/` directory
- Consult TRD-MCP-WORKFLOW-001 technical requirements

---

**Created**: 2025-12-03
**Phase**: 1.1 - MCP Server Infrastructure
**Status**: Ready for Sprint 1.2 (Tool Handlers)

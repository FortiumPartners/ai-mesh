# Testing Guide - TRD Workflow MCP Server

## Quick Start Testing

### 1. Component Test Suite

Run the comprehensive component test:

```bash
cd /Users/ldangelo/Development/Fortium/ai-mesh/src/mcp-servers/trd-workflow
node test-server.js
```

**Expected Output**:
```
=== TRD Workflow MCP Server Test ===

Test 1: Logger functionality
✓ Logger working

Test 2: Tool Registry functionality
Registered tools: 1
✓ Tool registration working

Test 3: Tool execution
✓ Tool execution working

Test 4: Argument validation
✓ Validation working

Test 5: Tool listing
✓ Tool listing working

=== All Tests Passed ===
```

### 2. Startup Verification

Verify the server can initialize:

```bash
cd /Users/ldangelo/Development/Fortium/ai-mesh/src/mcp-servers/trd-workflow
./verify-startup.sh
```

**Expected Output**:
```
Testing MCP server startup...

Server logs:
{"timestamp":"...","level":"info","message":"Starting TRD Workflow MCP Server",...}
{"timestamp":"...","level":"info","message":"Server connected and ready",...}

✓ Server initialized successfully
✓ MCP protocol ready for stdio communication
```

### 3. Manual Server Start

Start the server manually (it will wait for stdio input):

```bash
cd /Users/ldangelo/Development/Fortium/ai-mesh/src/mcp-servers/trd-workflow
node server.js
```

**Expected Logs**:
```json
{"timestamp":"...","level":"info","name":"trd-workflow","message":"Starting TRD Workflow MCP Server",...}
{"timestamp":"...","level":"info","name":"trd-workflow-mcp","message":"Server connected and ready",...}
```

Press `Ctrl+C` to stop the server.

## Integration Testing

### Testing with Claude Desktop

1. Add to your Claude Desktop config (`~/.config/claude-desktop/config.json` or platform-specific location):

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

2. Restart Claude Desktop

3. Verify the server appears in Claude's MCP server list

4. Try listing tools (currently 0 tools registered - Sprint 1.2 will add handlers)

### Testing with MCP Inspector

If you have the MCP Inspector installed:

```bash
npm install -g @modelcontextprotocol/inspector

# Test the server
mcp-inspector node /Users/ldangelo/Development/Fortium/ai-mesh/src/mcp-servers/trd-workflow/server.js
```

The inspector will:
- Start the server
- Show available tools
- Allow you to test tool calls
- Display logs and errors

## Debug Mode

Run the server with debug logging:

```bash
LOG_LEVEL=debug node server.js
```

This will show:
- All server initialization steps
- Tool registration details
- Request/response details
- Performance metrics
- Detailed error information

## Environment Variables

Test different configurations:

```bash
# Debug logging
LOG_LEVEL=debug node server.js

# Development mode
NODE_ENV=development node server.js

# Combination
LOG_LEVEL=debug NODE_ENV=development node server.js
```

## Programmatic Testing

Create a test script:

```javascript
#!/usr/bin/env node

import { registry } from './lib/tool-registry.js';
import { logger } from './lib/logger.js';

// Test custom tool registration
registry.register(
  {
    name: 'customTest',
    description: 'Custom test tool',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  },
  async (args) => {
    logger.info('Custom tool executed', { args });
    return { success: true, message: args.message };
  }
);

// Execute and verify
const result = await registry.execute('customTest', { message: 'Hello!' });
console.log('Result:', result);
```

## Performance Testing

Test tool execution performance:

```javascript
#!/usr/bin/env node

import { registry } from './lib/tool-registry.js';

registry.register(
  { name: 'perfTest', description: 'Perf test', inputSchema: { type: 'object' } },
  async () => ({ result: 'done' })
);

const iterations = 1000;
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  await registry.execute('perfTest', {});
}

const duration = Date.now() - start;
const avg = duration / iterations;

console.log(`Executed ${iterations} times in ${duration}ms`);
console.log(`Average: ${avg.toFixed(2)}ms per execution`);
```

**Expected Performance**:
- Registration: <1ms per tool
- Execution overhead: <1ms (excluding tool logic)
- Validation: <1ms for typical schemas

## Common Issues

### Issue: Server exits immediately

**Cause**: Normal behavior when no input on stdio
**Solution**: Use with Claude Desktop or MCP Inspector

### Issue: Permission denied

**Cause**: server.js not executable
**Solution**: `chmod +x server.js`

### Issue: Module not found

**Cause**: Dependencies not installed
**Solution**: `npm install`

### Issue: Import errors

**Cause**: Missing `"type": "module"` in package.json
**Solution**: Already configured correctly

## Test Checklist

Before considering Sprint 1.1 complete:

- [ ] `node test-server.js` passes all tests
- [ ] `./verify-startup.sh` shows successful initialization
- [ ] Server starts without errors
- [ ] Logs appear on stderr in JSON format
- [ ] Server responds to SIGINT/SIGTERM
- [ ] No npm vulnerabilities (`npm audit`)
- [ ] Tool registry functions correctly
- [ ] Logger produces structured output
- [ ] File permissions correct (server.js executable)

## Next Testing Phase (Sprint 1.2)

When tool handlers are implemented:

1. Test each handler individually
2. Test with real TRD data from `../../trd-workflow/lib/`
3. Validate output formats
4. Test error scenarios
5. Test all edge cases
6. Performance testing with large TRDs
7. Integration testing with Claude

---

**Sprint**: 1.1
**Status**: Testing Infrastructure Complete
**Next**: Sprint 1.2 - Tool Handler Testing

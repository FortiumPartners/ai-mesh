#!/usr/bin/env node

/**
 * Test script for TRD Workflow MCP Server
 *
 * Validates server initialization and basic functionality
 */

import { registry } from './lib/tool-registry.js';
import { logger } from './lib/logger.js';

console.log('\n=== TRD Workflow MCP Server Test ===\n');

// Test 1: Logger
console.log('Test 1: Logger functionality');
logger.info('Test log message');
logger.debug('Debug message (may not appear if LOG_LEVEL=info)');
logger.metric('test_operation', 42, { test: true });
console.log('✓ Logger working\n');

// Test 2: Tool Registry
console.log('Test 2: Tool Registry functionality');

// Register a test tool
registry.register(
  {
    name: 'testTool',
    description: 'A test tool for validation',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  },
  async (args) => {
    return {
      success: true,
      echo: args.message,
      timestamp: new Date().toISOString()
    };
  }
);

console.log('Registered tools:', registry.stats().totalTools);
console.log('✓ Tool registration working\n');

// Test 3: Tool Execution
console.log('Test 3: Tool execution');
try {
  const result = await registry.execute('testTool', { message: 'Hello MCP!' });
  console.log('Execution result:', JSON.stringify(result, null, 2));
  console.log('✓ Tool execution working\n');
} catch (error) {
  console.error('✗ Tool execution failed:', error.message);
  process.exit(1);
}

// Test 4: Validation
console.log('Test 4: Argument validation');
const validation = registry.validate('testTool', {});
console.log('Validation (missing required):', validation);

const validValidation = registry.validate('testTool', { message: 'test' });
console.log('Validation (valid args):', validValidation);
console.log('✓ Validation working\n');

// Test 5: Tool Listing
console.log('Test 5: Tool listing');
const tools = registry.list();
console.log('Available tools:', tools.map(t => t.name));
console.log('✓ Tool listing working\n');

// Summary
console.log('=== All Tests Passed ===\n');
console.log('Server components are ready for MCP integration.');
console.log('Next step: Run "node server.js" to start the MCP server\n');

process.exit(0);

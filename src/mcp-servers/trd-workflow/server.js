#!/usr/bin/env node

/**
 * TRD Workflow MCP Server
 *
 * Exposes TRD workflow library as callable tools via Model Context Protocol
 * Integrates with Claude and other MCP-compatible AI systems
 *
 * @module server
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, Phase 1, Sprint 1.1
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { registry } from './lib/tool-registry.js';
import { logger } from './lib/logger.js';

/**
 * Server configuration
 */
const SERVER_INFO = {
  name: 'trd-workflow',
  version: '1.0.0',
  description: 'TRD workflow enhancement library exposed as MCP tools'
};

/**
 * Initialize MCP server
 */
const server = new Server(SERVER_INFO, {
  capabilities: {
    tools: {}
  }
});

/**
 * Handle tool listing requests
 *
 * Returns all registered tools from the tool registry
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Received ListTools request');

  try {
    const tools = registry.list();
    logger.info(`Returning ${tools.length} tools`, {
      tools: tools.map(t => t.name)
    });

    return { tools };
  } catch (error) {
    logger.error('Failed to list tools', {
      error: error.message,
      stack: error.stack
    });

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list tools: ${error.message}`
    );
  }
});

/**
 * Handle tool call requests
 *
 * Validates arguments and executes the requested tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.debug('Received CallTool request', {
    tool: name,
    args
  });

  try {
    // Check if tool exists
    if (!registry.has(name)) {
      logger.warn(`Tool not found: ${name}`);
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
    }

    // Validate arguments
    const validation = registry.validate(name, args || {});
    if (!validation.valid) {
      logger.warn('Tool validation failed', {
        tool: name,
        errors: validation.errors
      });

      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments: ${validation.errors.join(', ')}`
      );
    }

    // Execute tool
    const result = await registry.execute(name, args || {});

    logger.info(`Tool executed successfully: ${name}`, {
      resultType: typeof result
    });

    // Return result in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    // If already an MCP error, rethrow
    if (error instanceof McpError) {
      throw error;
    }

    // Wrap other errors
    logger.error('Tool execution error', {
      tool: name,
      error: error.message,
      stack: error.stack
    });

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

/**
 * Start server with stdio transport
 */
async function main() {
  try {
    logger.info('Starting TRD Workflow MCP Server', SERVER_INFO);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    logger.info('Server connected and ready', {
      transport: 'stdio',
      toolsRegistered: registry.stats().totalTools
    });

    // Log server capabilities
    logger.debug('Server capabilities', {
      capabilities: server.getCapabilities()
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });

    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  try {
    await server.close();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', {
    reason: String(reason),
    promise
  });
  process.exit(1);
});

// Start the server
main();

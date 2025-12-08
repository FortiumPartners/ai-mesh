/**
 * Tool Registry for MCP Server
 *
 * Manages tool registration, validation, and execution
 * Provides a central registry for all available tools
 *
 * @module lib/tool-registry
 */

import { logger } from './logger.js';

/**
 * Tool Registry Class
 *
 * Handles dynamic tool registration and provides tool metadata
 */
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.handlers = new Map();
  }

  /**
   * Register a tool with its handler
   *
   * @param {Object} tool - Tool definition
   * @param {string} tool.name - Unique tool identifier
   * @param {string} tool.description - Human-readable description
   * @param {Object} tool.inputSchema - JSON Schema for tool inputs
   * @param {Function} handler - Async function to execute tool
   *
   * @example
   * registry.register({
   *   name: 'injectWorkflowTasks',
   *   description: 'Inject workflow checkpoints into TRD task breakdown',
   *   inputSchema: {
   *     type: 'object',
   *     properties: {
   *       taskBreakdown: { type: 'object' },
   *       config: { type: 'object' }
   *     },
   *     required: ['taskBreakdown']
   *   }
   * }, async (args) => {
   *   return await injectWorkflowTasks(args.taskBreakdown, args.config);
   * });
   */
  register(tool, handler) {
    // Validate tool definition
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool must have a valid name');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool must have a description');
    }

    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      throw new Error('Tool must have an inputSchema');
    }

    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    // Check for duplicates
    if (this.tools.has(tool.name)) {
      logger.warn(`Overwriting existing tool: ${tool.name}`);
    }

    // Store tool and handler
    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, handler);

    logger.debug(`Registered tool: ${tool.name}`, {
      inputSchema: tool.inputSchema
    });
  }

  /**
   * Get all registered tools
   *
   * @returns {Array} Array of tool definitions
   */
  list() {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool definition by name
   *
   * @param {string} name - Tool name
   * @returns {Object|null} Tool definition or null if not found
   */
  get(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Check if tool exists
   *
   * @param {string} name - Tool name
   * @returns {boolean} True if tool is registered
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Execute tool by name with arguments
   *
   * @param {string} name - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Promise<any>} Tool execution result
   * @throws {Error} If tool not found or execution fails
   */
  async execute(name, args = {}) {
    if (!this.has(name)) {
      throw new Error(`Tool not found: ${name}`);
    }

    const handler = this.handlers.get(name);
    const startTime = Date.now();

    try {
      logger.debug(`Executing tool: ${name}`, { args });
      const result = await handler(args);
      const duration = Date.now() - startTime;

      logger.metric(`tool.${name}`, duration, {
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.metric(`tool.${name}`, duration, {
        success: false,
        error: error.message
      });

      logger.error(`Tool execution failed: ${name}`, {
        error: error.message,
        stack: error.stack,
        args
      });

      throw error;
    }
  }

  /**
   * Validate tool arguments against input schema
   *
   * @param {string} name - Tool name
   * @param {Object} args - Arguments to validate
   * @returns {Object} Validation result { valid: boolean, errors: Array }
   */
  validate(name, args) {
    const tool = this.get(name);
    if (!tool) {
      return {
        valid: false,
        errors: [`Tool not found: ${name}`]
      };
    }

    // Basic validation (could be enhanced with JSON Schema validator)
    const schema = tool.inputSchema;
    const errors = [];

    // Check required properties
    if (schema.required && Array.isArray(schema.required)) {
      for (const prop of schema.required) {
        if (!(prop in args)) {
          errors.push(`Missing required property: ${prop}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Unregister a tool
   *
   * @param {string} name - Tool name
   * @returns {boolean} True if tool was removed
   */
  unregister(name) {
    const removed = this.tools.delete(name) && this.handlers.delete(name);
    if (removed) {
      logger.debug(`Unregistered tool: ${name}`);
    }
    return removed;
  }

  /**
   * Clear all registered tools
   */
  clear() {
    const count = this.tools.size;
    this.tools.clear();
    this.handlers.clear();
    logger.debug(`Cleared ${count} tools from registry`);
  }

  /**
   * Get registry statistics
   *
   * @returns {Object} Registry stats
   */
  stats() {
    return {
      totalTools: this.tools.size,
      tools: this.list().map(t => ({
        name: t.name,
        description: t.description
      }))
    };
  }
}

// Create default registry instance
export const registry = new ToolRegistry();

/**
 * MCP Server Detector
 *
 * Checks if TRD Workflow MCP server is available for Claude Code integration.
 * Validates server registration, file existence, and provides available tool list.
 *
 * @module mcp-detector
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, Phase 4, Sprint 4.1, TASK-019
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Known MCP tool names from TRD Workflow server
 */
const EXPECTED_TOOLS = [
  'inject_checkpoints',
  'generate_workflow_section',
  'assess_complexity',
  'detect_task_types',
  'generate_delegation_patterns',
  'validate_trd_structure'
];

/**
 * MCP configuration file locations
 */
const MCP_CONFIG_PATHS = [
  path.join(os.homedir(), '.claude', 'mcp', 'config.json'),
  path.join(os.homedir(), '.config', 'claude', 'mcp', 'config.json')
];

/**
 * Check if TRD Workflow MCP server is available
 *
 * Validates:
 * 1. Server is registered in Claude's MCP config
 * 2. Server files exist at registered path
 * 3. Returns status with available tools list
 *
 * @returns {Promise<Object>} Status object
 * @returns {boolean} .available - Whether server is available
 * @returns {string[]} .tools - List of available tool names
 * @returns {string} .serverPath - Path to server installation
 * @returns {string} [.error] - Error message if unavailable
 *
 * @example
 * const status = await checkMCPServerAvailable();
 * if (status.available) {
 *   console.log('Tools available:', status.tools);
 * } else {
 *   console.warn('MCP server unavailable:', status.error);
 * }
 */
async function checkMCPServerAvailable() {
  try {
    // Step 1: Find MCP config file
    const configPath = findMCPConfig();
    if (!configPath) {
      return {
        available: false,
        tools: [],
        error: 'Claude MCP config not found. Expected at ~/.claude/mcp/config.json'
      };
    }

    // Step 2: Parse config and check for trd-workflow server
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const trdServer = findTRDWorkflowServer(config);

    if (!trdServer) {
      return {
        available: false,
        tools: [],
        error: 'TRD Workflow MCP server not registered. Run: claude mcp add trd-workflow'
      };
    }

    // Step 3: Validate server installation exists
    const serverPath = extractServerPath(trdServer);
    if (!serverPath) {
      return {
        available: false,
        tools: [],
        error: 'Could not determine TRD Workflow server path from config'
      };
    }

    const serverExists = await validateServerFiles(serverPath);
    if (!serverExists) {
      return {
        available: false,
        tools: [],
        serverPath,
        error: `TRD Workflow server files not found at: ${serverPath}`
      };
    }

    // Step 4: Return success with available tools
    return {
      available: true,
      tools: EXPECTED_TOOLS,
      serverPath,
      configPath
    };
  } catch (error) {
    // Handle errors gracefully - server unavailable doesn't break workflow
    return {
      available: false,
      tools: [],
      error: `MCP detection error: ${error.message}`
    };
  }
}

/**
 * Find Claude MCP configuration file
 *
 * @returns {string|null} Path to config file or null
 * @private
 */
function findMCPConfig() {
  for (const configPath of MCP_CONFIG_PATHS) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Find TRD Workflow server in MCP config
 *
 * @param {Object} config - Parsed MCP config
 * @returns {Object|null} Server config or null
 * @private
 */
function findTRDWorkflowServer(config) {
  // Check mcpServers object for trd-workflow entry
  if (config.mcpServers && config.mcpServers['trd-workflow']) {
    return config.mcpServers['trd-workflow'];
  }

  // Also check legacy format (servers array)
  if (config.servers && Array.isArray(config.servers)) {
    return config.servers.find(s => s.name === 'trd-workflow');
  }

  return null;
}

/**
 * Extract server path from config entry
 *
 * Handles various config formats:
 * - command: "node /path/to/server.js"
 * - command: "/path/to/server.js"
 * - args: ["/path/to/server.js"]
 *
 * @param {Object} serverConfig - Server configuration object
 * @returns {string|null} Server directory path or null
 * @private
 */
function extractServerPath(serverConfig) {
  // Try command field
  if (serverConfig.command) {
    const match = serverConfig.command.match(/(?:node\s+)?(.+\/server\.js)/);
    if (match) {
      return path.dirname(match[1]);
    }
  }

  // Try args array
  if (serverConfig.args && Array.isArray(serverConfig.args)) {
    for (const arg of serverConfig.args) {
      if (arg.includes('server.js')) {
        return path.dirname(arg);
      }
    }
  }

  // Try env.SERVER_PATH if present
  if (serverConfig.env && serverConfig.env.SERVER_PATH) {
    return serverConfig.env.SERVER_PATH;
  }

  return null;
}

/**
 * Validate server files exist
 *
 * Checks for critical files:
 * - server.js (main entry point)
 * - package.json (server metadata)
 * - handlers/ directory (tool implementations)
 *
 * @param {string} serverPath - Server directory path
 * @returns {Promise<boolean>} True if valid installation
 * @private
 */
async function validateServerFiles(serverPath) {
  try {
    const requiredFiles = [
      path.join(serverPath, 'server.js'),
      path.join(serverPath, 'package.json'),
      path.join(serverPath, 'handlers')
    ];

    for (const filePath of requiredFiles) {
      if (!fs.existsSync(filePath)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get detailed server information
 *
 * @returns {Promise<Object>} Detailed server info
 * @returns {boolean} .available - Server availability
 * @returns {Object} .package - package.json contents
 * @returns {number} .toolCount - Number of available tools
 *
 * @example
 * const info = await getServerInfo();
 * console.log(`Server v${info.package.version} has ${info.toolCount} tools`);
 */
async function getServerInfo() {
  const status = await checkMCPServerAvailable();

  if (!status.available) {
    return {
      available: false,
      error: status.error
    };
  }

  try {
    const packagePath = path.join(status.serverPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    return {
      available: true,
      serverPath: status.serverPath,
      package: packageJson,
      toolCount: status.tools.length,
      tools: status.tools
    };
  } catch (error) {
    return {
      available: true,
      serverPath: status.serverPath,
      toolCount: status.tools.length,
      tools: status.tools,
      error: `Could not read package.json: ${error.message}`
    };
  }
}

module.exports = {
  checkMCPServerAvailable,
  getServerInfo,
  EXPECTED_TOOLS
};

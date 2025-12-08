#!/usr/bin/env node

/**
 * AI Mesh Plugin Installer
 *
 * Command-line tool for installing plugins from the AI Mesh marketplace.
 *
 * Usage:
 *   ai-mesh-marketplace install <plugin-name>[@version]
 *   ai-mesh-marketplace install <plugin-name> --global
 *   ai-mesh-marketplace install <plugin-name> --local
 *
 * Examples:
 *   ai-mesh-marketplace install ai-mesh-pane-viewer
 *   ai-mesh-marketplace install ai-mesh-pane-viewer@1.0.0
 *   ai-mesh-marketplace install ai-mesh-pane-viewer --global
 */

const https = require('https');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const REGISTRY_URL = 'https://raw.githubusercontent.com/FortiumPartners/ai-mesh-marketplace/main/registry/plugins.json';
const AI_MESH_CONFIG_DIR = path.join(process.env.HOME, '.ai-mesh');
const PLUGINS_DIR = path.join(AI_MESH_CONFIG_DIR, 'plugins');

/**
 * Main installation function
 */
async function install(pluginName, options = {}) {
  console.log(`\nInstalling ${pluginName}...`);

  // TODO: Implement full installation logic
  //
  // Steps:
  // 1. Fetch plugin registry from GitHub
  // 2. Validate plugin exists in registry
  // 3. Check version compatibility
  // 4. Install via npm (npm install -g <package>)
  // 5. Copy plugin assets (agents, commands, skills, hooks) to .ai-mesh/
  // 6. Run post-install hooks if defined
  // 7. Validate installation
  // 8. Display success message with next steps

  try {
    // Fetch registry
    const registry = await fetchRegistry();

    // Find plugin
    const plugin = findPlugin(registry, pluginName);
    if (!plugin) {
      console.error(`❌ Plugin "${pluginName}" not found in marketplace`);
      process.exit(1);
    }

    // Display plugin info
    console.log(`\nFound: ${plugin.displayName} v${plugin.version}`);
    console.log(`Description: ${plugin.description}`);
    console.log(`Category: ${plugin.category} | Tier: ${plugin.tier}`);
    console.log(`Status: ${plugin.status}`);

    // Check compatibility
    // TODO: Implement version compatibility checking

    // Install npm package
    if (plugin.npm) {
      console.log(`\nInstalling npm package: ${plugin.npm}...`);
      // TODO: Execute npm install
      // execSync(`npm install ${options.global ? '-g' : ''} ${plugin.npm}`, { stdio: 'inherit' });
      console.log('⚠️  NPM installation not yet implemented');
    }

    // Install plugin assets
    console.log('\nInstalling plugin assets...');
    // TODO: Copy agents, commands, skills, hooks to .ai-mesh/
    console.log('⚠️  Asset installation not yet implemented');

    // Run post-install hooks
    // TODO: Execute plugin post-install hooks

    // Validate installation
    // TODO: Verify all assets installed correctly

    console.log(`\n✅ Successfully installed ${plugin.displayName}`);
    console.log('\nNext steps:');
    console.log('  1. Restart Claude Code to load the plugin');
    console.log('  2. Run: ai-mesh plugins verify ' + pluginName);
    console.log('  3. Check documentation: ' + plugin.documentation);

  } catch (error) {
    console.error(`\n❌ Installation failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Fetch plugin registry from GitHub
 */
function fetchRegistry() {
  return new Promise((resolve, reject) => {
    https.get(REGISTRY_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const registry = JSON.parse(data);
          resolve(registry);
        } catch (error) {
          reject(new Error('Failed to parse registry: ' + error.message));
        }
      });

    }).on('error', (error) => {
      reject(new Error('Failed to fetch registry: ' + error.message));
    });
  });
}

/**
 * Find plugin in registry by name
 */
function findPlugin(registry, pluginName) {
  // Handle version specification (e.g., ai-mesh-pane-viewer@1.0.0)
  const [name, version] = pluginName.split('@');

  const plugin = registry.plugins.find(p => p.name === name);

  // TODO: Handle version matching if specified

  return plugin;
}

/**
 * Parse command-line arguments
 */
function parseArgs(args) {
  const options = {
    global: false,
    local: false,
    version: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--global' || arg === '-g') {
      options.global = true;
    } else if (arg === '--local' || arg === '-l') {
      options.local = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = args[++i];
    }
  }

  return options;
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
AI Mesh Plugin Installer

Usage:
  ai-mesh-marketplace install <plugin-name>[@version] [options]

Options:
  --global, -g      Install globally (default)
  --local, -l       Install in current project
  --help, -h        Show this help message

Examples:
  ai-mesh-marketplace install ai-mesh-pane-viewer
  ai-mesh-marketplace install ai-mesh-pane-viewer@1.0.0
  ai-mesh-marketplace install ai-mesh-pane-viewer --global

For more information, visit:
  https://github.com/FortiumPartners/ai-mesh-marketplace
  `);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const pluginName = args[0];
  const options = parseArgs(args.slice(1));

  install(pluginName, options).catch(error => {
    console.error('Installation error:', error);
    process.exit(1);
  });
}

module.exports = { install, fetchRegistry, findPlugin };

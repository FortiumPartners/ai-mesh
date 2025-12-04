/**
 * Configuration Loader
 *
 * Loads and validates plugin configuration from:
 * 1. ~/.ai-mesh-pane-viewer/config.json (user config)
 * 2. Environment variables (overrides)
 * 3. Defaults
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  multiplexer: 'auto', // 'auto', 'wezterm', 'zellij', 'tmux'
  direction: 'right',  // 'right', 'bottom', 'left', 'top'
  percent: 30,         // 10-90
  floating: false,     // Zellij floating panes
  autoCleanup: true,   // Clean up stale panes on startup
  enabled: true        // Global enable/disable
};

/**
 * Configuration loader
 */
class ConfigLoader {
  /**
   * Load configuration from all sources
   * @returns {Promise<Object>} Merged configuration
   */
  static async load() {
    // TODO: Implement config loading
    // 1. Load from ~/.ai-mesh-pane-viewer/config.json (if exists)
    // 2. Override with environment variables:
    //    - AI_MESH_PANE_MULTIPLEXER
    //    - AI_MESH_PANE_DIRECTION
    //    - AI_MESH_PANE_PERCENT
    //    - AI_MESH_PANE_FLOATING
    //    - AI_MESH_PANE_DISABLE (sets enabled=false)
    // 3. Merge with defaults
    // 4. Validate configuration
    // 5. Return merged config

    return { ...DEFAULT_CONFIG };
  }

  /**
   * Save configuration to file
   * @param {Object} config - Configuration to save
   * @returns {Promise<void>}
   */
  static async save(config) {
    // TODO: Implement config saving
    // 1. Ensure ~/.ai-mesh-pane-viewer exists
    // 2. Validate config
    // 3. Write to config.json with pretty formatting
    throw new Error('ConfigLoader.save() not yet implemented');
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  static validate(config) {
    // TODO: Implement validation
    // - multiplexer: 'auto', 'wezterm', 'zellij', 'tmux'
    // - direction: 'right', 'bottom', 'left', 'top'
    // - percent: number between 10-90
    // - floating: boolean
    // - enabled: boolean
    throw new Error('ConfigLoader.validate() not yet implemented');
  }

  /**
   * Get configuration directory path
   * @returns {string} Config directory path
   */
  static getConfigDir() {
    return path.join(os.homedir(), '.ai-mesh-pane-viewer');
  }

  /**
   * Get configuration file path
   * @returns {string} Config file path
   */
  static getConfigPath() {
    return path.join(ConfigLoader.getConfigDir(), 'config.json');
  }
}

module.exports = { ConfigLoader, DEFAULT_CONFIG };

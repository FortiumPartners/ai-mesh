/**
 * AI Mesh Pane Viewer Library
 *
 * Main library entry point for programmatic usage
 */

const { PaneManager } = require('../hooks/pane-manager');
const { loadConfig, saveConfig, resetConfig, DEFAULT_CONFIG } = require('./config-loader');
const {
  MultiplexerDetector,
  WeztermAdapter,
  ZellijAdapter,
  TmuxAdapter
} = require('../hooks/adapters');

// Re-export config functions as ConfigLoader for backwards compatibility
const ConfigLoader = { load: loadConfig, save: saveConfig, reset: resetConfig, DEFAULT_CONFIG };

/**
 * Create and initialize a pane viewer
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>} Viewer instance
 */
async function createViewer(options = {}) {
  const config = loadConfig();
  const manager = new PaneManager();
  await manager.init();

  return {
    manager,
    config,
    async spawn(agentName, task) {
      // TODO: Implement viewer spawning
      throw new Error('createViewer.spawn() not yet implemented');
    },
    async update(activity) {
      // TODO: Implement viewer updates
      throw new Error('createViewer.update() not yet implemented');
    },
    async close() {
      // TODO: Implement viewer closing
      throw new Error('createViewer.close() not yet implemented');
    }
  };
}

module.exports = {
  createViewer,
  PaneManager,
  ConfigLoader,
  MultiplexerDetector,
  WeztermAdapter,
  ZellijAdapter,
  TmuxAdapter
};

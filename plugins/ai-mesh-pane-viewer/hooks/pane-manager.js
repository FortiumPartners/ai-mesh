/**
 * Pane Manager
 *
 * Manages the lifecycle of viewer panes across sessions.
 * Handles pane creation, reuse, and cleanup.
 *
 * Responsibilities:
 * 1. Track active panes in state file (~/.ai-mesh-pane-viewer/panes.json)
 * 2. Spawn new panes or reuse existing ones
 * 3. Send messages to viewer panes
 * 4. Clean up stale panes
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { MultiplexerDetector } = require('./adapters');

/**
 * Pane state manager
 */
class PaneManager {
  constructor() {
    this.stateDir = path.join(os.homedir(), '.ai-mesh-pane-viewer');
    this.statePath = path.join(this.stateDir, 'panes.json');
    this.detector = new MultiplexerDetector();
    this.adapter = null;
    this.initialized = false;
  }

  /**
   * Initialize state directory
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    // Create state directory
    await fs.mkdir(this.stateDir, { recursive: true });

    // Detect multiplexer
    this.adapter = await this.detector.autoSelect();
    if (!this.adapter) {
      throw new Error('No terminal multiplexer detected');
    }

    this.initialized = true;
  }

  /**
   * Load pane state from file
   * @returns {Promise<Object>} Pane state
   */
  async loadState() {
    try {
      const content = await fs.readFile(this.statePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { panes: {}, lastUpdated: null };
    }
  }

  /**
   * Save pane state to file
   * @param {Object} state - State to save
   * @returns {Promise<void>}
   */
  async saveState(state) {
    state.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
  }

  /**
   * Get or create a viewer pane
   * @param {Object} config - Configuration options
   * @returns {Promise<string>} Pane ID
   */
  async getOrCreatePane(config = {}) {
    await this.init();

    const { direction = 'right', percent = 40, reuseExisting = true } = config;
    const state = await this.loadState();
    const sessionKey = `${this.adapter.name}:${process.env.WEZTERM_PANE || process.pid}`;

    // Check for existing pane
    if (reuseExisting && state.panes[sessionKey]) {
      const existingPane = state.panes[sessionKey];
      const paneInfo = await this.adapter.getPaneInfo(existingPane.paneId);
      if (paneInfo) {
        return existingPane.paneId;
      }
      // Pane no longer exists, clean up
      delete state.panes[sessionKey];
    }

    // Spawn new pane with agent-viewer
    const viewerPath = path.join(__dirname, 'agent-viewer.js');
    const paneId = await this.adapter.splitPane({
      direction,
      percent,
      command: ['node', viewerPath]
    });

    // Save to state
    state.panes[sessionKey] = {
      paneId,
      multiplexer: this.adapter.name,
      createdAt: new Date().toISOString()
    };
    await this.saveState(state);

    return paneId;
  }

  /**
   * Send a message to a viewer pane
   * @param {string} paneId - Pane ID
   * @param {Object} message - Message object
   * @returns {Promise<void>}
   */
  async sendMessage(paneId, message) {
    await this.init();
    const json = JSON.stringify(message);
    // Send as escaped JSON followed by newline
    await this.adapter.sendKeys(paneId, `${json}\n`);
  }

  /**
   * Close a viewer pane
   * @param {string} paneId - Pane ID
   * @returns {Promise<void>}
   */
  async closePane(paneId) {
    await this.init();
    await this.adapter.closePane(paneId);

    // Remove from state
    const state = await this.loadState();
    for (const key of Object.keys(state.panes)) {
      if (state.panes[key].paneId === paneId) {
        delete state.panes[key];
      }
    }
    await this.saveState(state);
  }

  /**
   * Clean up stale panes
   * @returns {Promise<number>} Number of panes cleaned up
   */
  async cleanup() {
    await this.init();
    const state = await this.loadState();
    let cleaned = 0;

    for (const key of Object.keys(state.panes)) {
      const pane = state.panes[key];
      const info = await this.adapter.getPaneInfo(pane.paneId);
      if (!info) {
        delete state.panes[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveState(state);
    }
    return cleaned;
  }
}

module.exports = { PaneManager };

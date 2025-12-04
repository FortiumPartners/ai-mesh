const { WeztermAdapter } = require('./wezterm-adapter');
const { ZellijAdapter } = require('./zellij-adapter');
const { TmuxAdapter } = require('./tmux-adapter');

/**
 * Detect and select the appropriate terminal multiplexer
 * Checks for WezTerm, Zellij, and tmux in order of preference
 */
class MultiplexerDetector {
  constructor() {
    this.adapters = [
      new WeztermAdapter(),
      new ZellijAdapter(),
      new TmuxAdapter()
    ];
  }

  /**
   * Detect available multiplexers
   * @returns {Promise<Array<BaseMultiplexerAdapter>>} Available adapters
   */
  async detectAvailable() {
    // TODO: Implement multiplexer detection
    // Check each adapter's isAvailable() method
    // Return array of available adapters
    throw new Error('MultiplexerDetector.detectAvailable() not yet implemented');
  }

  /**
   * Auto-select the best available multiplexer
   * @returns {Promise<BaseMultiplexerAdapter|null>} Selected adapter or null
   */
  async autoSelect() {
    // TODO: Implement auto-selection logic
    // 1. Check environment variables (TERM_PROGRAM, ZELLIJ, TMUX)
    // 2. Try each adapter's isAvailable() in order
    // 3. Return first available adapter
    throw new Error('MultiplexerDetector.autoSelect() not yet implemented');
  }

  /**
   * Get adapter by name
   * @param {string} name - Multiplexer name ('wezterm', 'zellij', 'tmux')
   * @returns {BaseMultiplexerAdapter|null} Adapter or null
   */
  getAdapter(name) {
    // TODO: Implement adapter retrieval by name
    // Return matching adapter from this.adapters
    throw new Error('MultiplexerDetector.getAdapter() not yet implemented');
  }

  /**
   * Check if running in a multiplexer session
   * @returns {Promise<Object>} Detection result with multiplexer info
   */
  async detectSession() {
    // TODO: Implement session detection
    // Check environment variables:
    // - WEZTERM_PANE: WezTerm pane ID
    // - ZELLIJ_SESSION_NAME: Zellij session
    // - TMUX: tmux session info
    // Return: { multiplexer: 'name', sessionId: 'id', paneId: 'id' }
    throw new Error('MultiplexerDetector.detectSession() not yet implemented');
  }
}

module.exports = { MultiplexerDetector };

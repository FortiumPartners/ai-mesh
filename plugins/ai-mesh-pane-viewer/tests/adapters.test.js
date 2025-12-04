/**
 * Tests for terminal multiplexer adapters
 */

const {
  BaseMultiplexerAdapter,
  WeztermAdapter,
  ZellijAdapter,
  TmuxAdapter,
  MultiplexerDetector
} = require('../hooks/adapters');

describe('BaseMultiplexerAdapter', () => {
  it('should be abstract', () => {
    const adapter = new BaseMultiplexerAdapter('test');
    expect(adapter.name).toBe('test');
  });

  it('should throw on abstract methods', async () => {
    const adapter = new BaseMultiplexerAdapter('test');
    await expect(adapter.isAvailable()).rejects.toThrow('must be implemented');
    await expect(adapter.splitPane({})).rejects.toThrow('must be implemented');
    await expect(adapter.closePane('1')).rejects.toThrow('must be implemented');
    await expect(adapter.sendKeys('1', 'test')).rejects.toThrow('must be implemented');
    await expect(adapter.getPaneInfo('1')).rejects.toThrow('must be implemented');
  });
});

describe('WeztermAdapter', () => {
  it('should initialize', () => {
    const adapter = new WeztermAdapter();
    expect(adapter.name).toBe('wezterm');
  });

  // TODO: Add tests for WezTerm adapter methods
  it.todo('should detect if wezterm is available');
  it.todo('should split panes');
  it.todo('should close panes');
  it.todo('should send keys');
  it.todo('should get pane info');
});

describe('ZellijAdapter', () => {
  it('should initialize', () => {
    const adapter = new ZellijAdapter();
    expect(adapter.name).toBe('zellij');
  });

  // TODO: Add tests for Zellij adapter methods
  it.todo('should detect if zellij is available');
  it.todo('should split panes');
  it.todo('should handle floating panes');
  it.todo('should close panes');
  it.todo('should send keys');
});

describe('TmuxAdapter', () => {
  it('should initialize', () => {
    const adapter = new TmuxAdapter();
    expect(adapter.name).toBe('tmux');
  });

  // TODO: Add tests for tmux adapter methods
  it.todo('should detect if tmux is available');
  it.todo('should split panes');
  it.todo('should close panes');
  it.todo('should send keys');
  it.todo('should get pane info');
});

describe('MultiplexerDetector', () => {
  it('should initialize with adapters', () => {
    const detector = new MultiplexerDetector();
    expect(detector.adapters).toHaveLength(3);
  });

  // TODO: Add tests for detector methods
  it.todo('should detect available multiplexers');
  it.todo('should auto-select best multiplexer');
  it.todo('should get adapter by name');
  it.todo('should detect current session');
});

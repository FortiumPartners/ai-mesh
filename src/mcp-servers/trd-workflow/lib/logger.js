/**
 * Simple logger for MCP server
 *
 * Provides structured logging with levels: debug, info, warn, error
 * Logs to stderr to keep stdout clean for MCP protocol communication
 *
 * @module lib/logger
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  constructor(name = 'trd-workflow-mcp', level = 'info') {
    this.name = name;
    this.level = process.env.LOG_LEVEL || level;
    this.minLevel = LOG_LEVELS[this.level] || LOG_LEVELS.info;
  }

  /**
   * Format log entry with timestamp and metadata
   */
  _format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      name: this.name,
      message,
      ...meta
    };
    return JSON.stringify(entry);
  }

  /**
   * Write log entry to stderr
   */
  _write(level, message, meta = {}) {
    if (LOG_LEVELS[level] >= this.minLevel) {
      console.error(this._format(level, message, meta));
    }
  }

  /**
   * Log debug message (verbose operational details)
   */
  debug(message, meta = {}) {
    this._write('debug', message, meta);
  }

  /**
   * Log info message (normal operation)
   */
  info(message, meta = {}) {
    this._write('info', message, meta);
  }

  /**
   * Log warning message (recoverable issues)
   */
  warn(message, meta = {}) {
    this._write('warn', message, meta);
  }

  /**
   * Log error message (failures)
   */
  error(message, meta = {}) {
    this._write('error', message, meta);
  }

  /**
   * Log performance metrics
   */
  metric(operation, duration, meta = {}) {
    this._write('info', `Performance: ${operation}`, {
      metric: true,
      operation,
      duration_ms: duration,
      ...meta
    });
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    const childLogger = new Logger(this.name, this.level);
    childLogger._context = { ...this._context, ...context };
    return childLogger;
  }
}

// Create default logger instance
export const logger = new Logger('trd-workflow-mcp');

// Export Logger class for custom instances
export { Logger };

/**
 * BioLogger - Production-Ready Logging System for BioSkin
 * 
 * Replaces console.log with:
 * - Environment-aware logging (dev vs prod)
 * - Log levels (debug, info, warn, error)
 * - Structured logging with context
 * - Optional external integrations (Sentry, LogRocket, etc.)
 * - Zero overhead in production for debug/info logs
 * 
 * @example
 * import { bioLog } from '@aibos/bioskin';
 * 
 * bioLog.debug('Processing item', { itemId: 123 });
 * bioLog.info('Payment created', { amount: 100 });
 * bioLog.warn('Retrying request', { attempt: 2 });
 * bioLog.error('Failed to save', { error });
 */

// ============================================================
// TYPES
// ============================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  environment: 'development' | 'production' | 'test';
}

export interface LoggerConfig {
  /** Minimum level to log. 'silent' disables all logging. */
  level: LogLevel;
  /** Enable console output */
  console: boolean;
  /** Custom handler for log entries (e.g., send to Sentry) */
  handler?: (entry: LogEntry) => void;
  /** Prefix for all log messages */
  prefix?: string;
}

// ============================================================
// LEVEL PRIORITY
// ============================================================

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 999,
};

// ============================================================
// ENVIRONMENT DETECTION
// ============================================================

const getEnvironment = (): 'development' | 'production' | 'test' => {
  if (typeof process !== 'undefined') {
    if (process.env.NODE_ENV === 'test') return 'test';
    if (process.env.NODE_ENV === 'production') return 'production';
  }
  return 'development';
};

const isDev = () => getEnvironment() === 'development';
const isProd = () => getEnvironment() === 'production';

// ============================================================
// DEFAULT CONFIG
// ============================================================

const DEFAULT_CONFIG: LoggerConfig = {
  // In production: only warn and error
  // In development: show everything
  level: isProd() ? 'warn' : 'debug',
  console: true,
  prefix: '🧬 BioSkin',
};

// ============================================================
// LOGGER CLASS
// ============================================================

class BioLogger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Format log entry for console
   */
  private formatForConsole(entry: LogEntry): string[] {
    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    const levelEmoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      silent: '',
    };

    const parts = [
      `${prefix}${levelEmoji[entry.level]} [${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    return parts;
  }

  /**
   * Create a log entry
   */
  private createEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      environment: getEnvironment(),
    };
  }

  /**
   * Process and output a log
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, context);

    // Console output
    if (this.config.console) {
      const formatted = this.formatForConsole(entry);
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';

      if (context && Object.keys(context).length > 0) {
        console[consoleMethod](...formatted, context);
      } else {
        console[consoleMethod](...formatted);
      }
    }

    // Custom handler (e.g., Sentry, LogRocket)
    if (this.config.handler) {
      try {
        this.config.handler(entry);
      } catch {
        // Silently fail - don't break the app due to logging
      }
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  /**
   * Debug level - Only in development
   * Use for: Detailed debugging, variable inspection
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info level - Development and optionally production
   * Use for: Important events, state changes
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warn level - Always logged
   * Use for: Recoverable issues, deprecations
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level - Always logged
   * Use for: Failures, exceptions, critical issues
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Create a child logger with preset context
   * Useful for component-specific logging
   */
  child(componentContext: LogContext): ChildLogger {
    return new ChildLogger(this, componentContext);
  }

  /**
   * Time a function execution (development only)
   */
  time<T>(label: string, fn: () => T): T {
    if (!isDev()) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
    return result;
  }

  /**
   * Time an async function execution (development only)
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!isDev()) return fn();

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
    return result;
  }

  /**
   * Group related logs (development only)
   */
  group(label: string, fn: () => void): void {
    if (!isDev()) {
      fn();
      return;
    }

    console.group(`${this.config.prefix} ${label}`);
    fn();
    console.groupEnd();
  }

  /**
   * Assert a condition (development only)
   */
  assert(condition: boolean, message: string, context?: LogContext): void {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, context);
    }
  }
}

// ============================================================
// CHILD LOGGER (Component-specific)
// ============================================================

class ChildLogger {
  private parent: BioLogger;
  private context: LogContext;

  constructor(parent: BioLogger, context: LogContext) {
    this.parent = parent;
    this.context = context;
  }

  private mergeContext(additionalContext?: LogContext): LogContext {
    return { ...this.context, ...additionalContext };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, context?: LogContext): void {
    this.parent.error(message, this.mergeContext(context));
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const bioLog = new BioLogger();

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

export { BioLogger };

// Quick access functions (tree-shakeable)
export const logDebug = (message: string, context?: LogContext) => bioLog.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => bioLog.info(message, context);
export const logWarn = (message: string, context?: LogContext) => bioLog.warn(message, context);
export const logError = (message: string, context?: LogContext) => bioLog.error(message, context);

// ============================================================
// INTEGRATION HELPERS
// ============================================================

/**
 * Create a Sentry integration handler
 */
export function createSentryHandler(Sentry: { captureMessage: (msg: string, level: string) => void; captureException: (error: unknown) => void }) {
  return (entry: LogEntry) => {
    if (entry.level === 'error') {
      Sentry.captureMessage(entry.message, 'error');
    } else if (entry.level === 'warn') {
      Sentry.captureMessage(entry.message, 'warning');
    }
  };
}

/**
 * Create a custom fetch handler (send logs to your backend)
 */
export function createRemoteHandler(endpoint: string) {
  return async (entry: LogEntry) => {
    if (entry.level === 'error' || entry.level === 'warn') {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch {
        // Silently fail
      }
    }
  };
}

export default bioLog;

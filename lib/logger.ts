/**
 * Production Logger Utility
 * 
 * Replaces console statements with structured logging for scaling
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
        entry.context ? '\n' + JSON.stringify(entry.context, null, 2) : ''
      }${entry.error ? '\nError: ' + entry.error.stack : ''}`;
    }
    
    return JSON.stringify(entry);
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && { error }),
    };
    
    const formatted = this.formatLogEntry(entry);
    
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
    }
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }
  
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
}

export const logger = new Logger(); 
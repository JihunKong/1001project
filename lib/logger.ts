type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction && level === 'debug') {
      return false;
    }
    return true;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, stack } = entry;

    if (this.isProduction) {
      return JSON.stringify({ timestamp, level, message, context, stack });
    }

    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m'
    };

    const reset = '\x1b[0m';
    const color = levelColors[level];

    let formatted = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += `\n${color}Context:${reset} ${JSON.stringify(context, null, 2)}`;
    }

    if (stack) {
      formatted += `\n${color}Stack:${reset}\n${stack}`;
    }

    return formatted;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    const formatted = this.formatMessage(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const enrichedContext = { ...context };

    if (error instanceof Error) {
      enrichedContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (error) {
      enrichedContext.error = error;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: enrichedContext,
      stack: error instanceof Error ? error.stack : undefined
    };

    const formatted = this.formatMessage(entry);
    console.error(formatted);
  }

  auth(message: string, context?: LogContext): void {
    this.log('info', `[AUTH] ${message}`, context);
  }

  api(message: string, context?: LogContext): void {
    this.log('info', `[API] ${message}`, context);
  }

  db(message: string, context?: LogContext): void {
    this.log('info', `[DB] ${message}`, context);
  }

  security(message: string, context?: LogContext): void {
    this.log('warn', `[SECURITY] ${message}`, context);
  }
}

export const logger = new Logger();

export default logger;

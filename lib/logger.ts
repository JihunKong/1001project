import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  getActiveContext,
  getRequestContext,
  getWorkerContext,
  type LogContext as ContextType
} from './request-context';
import {
  getLoggerConfig,
  shouldLog as configShouldLog,
  shouldSample,
  type LogLevel,
  type LoggerConfig
} from './logger-config';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
  requestId?: string;
  userId?: string;
  userRole?: string;
  path?: string;
  method?: string;
  workerId?: string;
  jobId?: string;
  jobType?: string;
  duration?: number;
}

interface PerformanceTimer {
  startTime: number;
  label: string;
}

class Logger {
  private config: LoggerConfig;
  private timers: Map<string, PerformanceTimer>;

  constructor() {
    this.config = getLoggerConfig();
    this.timers = new Map();
  }

  private shouldLog(level: LogLevel): boolean {
    return configShouldLog(this.config.level, level);
  }

  private shouldSampleLog(path?: string): boolean {
    if (!this.config.enableSampling) {
      return true;
    }
    return shouldSample(path, this.config.samplingRules);
  }

  private formatMessage(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m'
    };

    const reset = '\x1b[0m';
    const color = levelColors[entry.level];

    let formatted = `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}]${reset}`;

    if (entry.requestId) {
      formatted += ` ${color}[${entry.requestId.substring(0, 8)}]${reset}`;
    }

    if (entry.workerId) {
      formatted += ` ${color}[Worker:${entry.workerId}]${reset}`;
    }

    formatted += ` ${entry.message}`;

    if (entry.duration !== undefined) {
      formatted += ` ${color}(${entry.duration}ms)${reset}`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      formatted += `\n${color}Context:${reset} ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.stack) {
      formatted += `\n${color}Stack:${reset}\n${entry.stack}`;
    }

    return formatted;
  }

  private serializeError(error: unknown): { message: string; stack?: string; [key: string]: unknown } {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        type: 'PrismaError',
        code: error.code,
        message: error.message,
        meta: error.meta,
        stack: error.stack,
      };
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        type: 'PrismaValidationError',
        message: error.message,
        stack: error.stack,
      };
    }

    if (error instanceof ZodError) {
      return {
        type: 'ZodError',
        message: 'Validation failed',
        issues: error.issues,
        formattedError: error.format(),
      };
    }

    if (error instanceof Error) {
      const serialized: { message: string; stack?: string; [key: string]: unknown } = {
        type: error.name,
        message: error.message,
        stack: error.stack,
      };

      if ('statusCode' in error) {
        serialized.statusCode = error.statusCode;
      }
      if ('code' in error) {
        serialized.code = error.code;
      }

      return serialized;
    }

    return {
      type: 'Unknown',
      message: String(error)
    };
  }

  private enrichContext(context?: LogContext): LogContext {
    const activeContext = getActiveContext();
    const baseContext: LogContext = { ...context };

    if (activeContext) {
      if ('requestId' in activeContext) {
        const reqCtx = activeContext;
        return {
          ...baseContext,
          requestId: reqCtx.requestId,
          userId: reqCtx.userId,
          userRole: reqCtx.userRole,
          path: reqCtx.path,
          method: reqCtx.method,
        };
      }
      if ('workerId' in activeContext) {
        const workerCtx = activeContext;
        return {
          ...baseContext,
          workerId: workerCtx.workerId,
          jobId: workerCtx.jobId,
          jobType: workerCtx.jobType,
        };
      }
    }

    return baseContext;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const enrichedContext = this.enrichContext(context);
    const path = typeof enrichedContext.path === 'string' ? enrichedContext.path : undefined;

    if (!this.shouldSampleLog(path)) {
      return;
    }

    const activeContext = getActiveContext();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: enrichedContext,
    };

    if (activeContext && 'requestId' in activeContext) {
      entry.requestId = activeContext.requestId;
      entry.userId = activeContext.userId;
      entry.userRole = activeContext.userRole;
      entry.path = activeContext.path;
      entry.method = activeContext.method;
    }

    if (activeContext && 'workerId' in activeContext) {
      entry.workerId = activeContext.workerId;
      entry.jobId = activeContext.jobId;
      entry.jobType = activeContext.jobType;
    }

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

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = error ? { ...context, error: this.serializeError(error) } : context;
    const enrichedContext = this.enrichContext(errorContext);
    const path = typeof enrichedContext.path === 'string' ? enrichedContext.path : undefined;

    if (!this.shouldLog('error') || !this.shouldSampleLog(path)) {
      return;
    }

    const stack = error instanceof Error ? error.stack : undefined;
    const activeContext = getActiveContext();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: enrichedContext,
      stack
    };

    if (activeContext && 'requestId' in activeContext) {
      entry.requestId = activeContext.requestId;
      entry.userId = activeContext.userId;
      entry.userRole = activeContext.userRole;
      entry.path = activeContext.path;
      entry.method = activeContext.method;
    }

    if (activeContext && 'workerId' in activeContext) {
      entry.workerId = activeContext.workerId;
      entry.jobId = activeContext.jobId;
      entry.jobType = activeContext.jobType;
    }

    const formatted = this.formatMessage(entry);
    console.error(formatted);
  }

  startTimer(label: string): void {
    if (!this.config.enablePerformanceLogging) {
      return;
    }

    this.timers.set(label, {
      startTime: Date.now(),
      label,
    });
  }

  endTimer(label: string, context?: LogContext): void {
    if (!this.config.enablePerformanceLogging) {
      return;
    }

    const timer = this.timers.get(label);
    if (!timer) {
      this.warn(`No timer found for label: ${label}`);
      return;
    }

    const duration = Date.now() - timer.startTime;
    this.timers.delete(label);

    const enrichedContext = this.enrichContext({ ...context, duration });
    const path = typeof enrichedContext.path === 'string' ? enrichedContext.path : undefined;

    if (!this.shouldLog('info') || !this.shouldSampleLog(path)) {
      return;
    }

    const activeContext = getActiveContext();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `⏱️ ${label}`,
      context: enrichedContext,
      duration,
    };

    if (activeContext && 'requestId' in activeContext) {
      entry.requestId = activeContext.requestId;
      entry.userId = activeContext.userId;
      entry.userRole = activeContext.userRole;
      entry.path = activeContext.path;
      entry.method = activeContext.method;
    }

    if (activeContext && 'workerId' in activeContext) {
      entry.workerId = activeContext.workerId;
      entry.jobId = activeContext.jobId;
      entry.jobType = activeContext.jobType;
    }

    const formatted = this.formatMessage(entry);
    console.log(formatted);
  }

  performance<T>(label: string, fn: () => T): T;
  performance<T>(label: string, fn: () => Promise<T>): Promise<T>;
  performance<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (!this.config.enablePerformanceLogging) {
      return fn();
    }

    this.startTimer(label);

    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => this.endTimer(label));
    }

    this.endTimer(label);
    return result;
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

/**
 * Centralized Error Handling System for 1001 Stories
 *
 * This module provides a comprehensive error handling strategy including:
 * - Custom error classes
 * - Error boundaries for React components
 * - Global error handlers
 * - Logging utilities
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  AUTH = 'authentication',
  AUTHZ = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  NETWORK = 'network',
  BUSINESS = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
}

// Base error class
export class AppError extends Error {
  public readonly name: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

// Specific error classes
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(
      message,
      'AUTH_REQUIRED',
      401,
      ErrorCategory.AUTH,
      ErrorSeverity.MEDIUM,
      true,
      context
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(
      message,
      'INSUFFICIENT_PERMISSIONS',
      403,
      ErrorCategory.AUTHZ,
      ErrorSeverity.MEDIUM,
      true,
      context
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      true,
      { field, ...context }
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation?: string, context?: Record<string, unknown>) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      true,
      { operation, ...context }
    );
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(
      message,
      code,
      400,
      ErrorCategory.BUSINESS,
      ErrorSeverity.MEDIUM,
      true,
      context
    );
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number, context?: Record<string, unknown>) {
    super(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      ErrorCategory.NETWORK,
      ErrorSeverity.LOW,
      true,
      { retryAfter, ...context }
    );
  }
}

// Error logging utility
export class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error | AppError, additionalContext?: Record<string, unknown>): void {
    const errorInfo: any = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    };

    if (error instanceof AppError) {
      errorInfo.code = error.code;
      errorInfo.category = error.category;
      errorInfo.severity = error.severity;
      errorInfo.context = error.context;
    }

    // Log based on severity
    if (error instanceof AppError && error.severity === ErrorSeverity.CRITICAL) {
      logger.error('CRITICAL ERROR', errorInfo);
      // Here you would integrate with external monitoring services like Sentry
    } else if (error instanceof AppError && error.severity === ErrorSeverity.HIGH) {
      logger.error('HIGH SEVERITY ERROR', errorInfo);
    } else {
      logger.warn('Error occurred', errorInfo);
    }

    // In production, you would also send to monitoring services
    this.sendToMonitoringService(errorInfo);
  }

  private sendToMonitoringService(_errorInfo: Record<string, unknown>): void {
    // Integrate with monitoring services like Sentry, LogRocket, etc.
    // Example:
    // Sentry.captureException(error, { extra: errorInfo });
  }
}

// Global error handler for API routes
export function createApiErrorHandler() {
  const logger = ErrorLogger.getInstance();

  return (error: unknown): NextResponse => {
    logger.log(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          category: error.category,
          timestamp: error.timestamp,
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      // Handle known error types
      if (error.message.includes('unique constraint')) {
        const dbError = new DatabaseError('Resource already exists', 'create');
        return NextResponse.json(
          { error: dbError.message, code: dbError.code },
          { status: 409 }
        );
      }

      if (error.message.includes('foreign key constraint')) {
        const dbError = new DatabaseError('Invalid reference', 'create');
        return NextResponse.json(
          { error: dbError.message, code: dbError.code },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  };
}

// React Error Boundary Hook
export function useErrorHandler() {
  const logger = ErrorLogger.getInstance();

  return {
    logError: (error: Error, errorInfo?: Record<string, unknown>) => {
      logger.log(error, errorInfo);
    },

    handleAsyncError: async <T>(
      asyncFn: () => Promise<T>,
      fallback?: T
    ): Promise<T | undefined> => {
      try {
        return await asyncFn();
      } catch (error) {
        logger.log(error instanceof Error ? error : new Error(String(error)));
        return fallback;
      }
    },
  };
}

// Utility functions
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// Error metrics collector
export class ErrorMetrics {
  private static errors: Map<string, number> = new Map();

  static increment(errorCode: string): void {
    const current = this.errors.get(errorCode) || 0;
    this.errors.set(errorCode, current + 1);
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.errors);
  }

  static reset(): void {
    this.errors.clear();
  }
}
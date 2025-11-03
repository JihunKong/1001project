import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ApiResponse, ApiError } from '@/types/api';
import { logger } from '@/lib/logger';

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: Array<{ field: string; message: string }>,
  code?: string
): NextResponse {
  const response: ApiError = {
    error,
    ...(details && { details }),
    ...(code && { code })
  };

  return NextResponse.json(response, { status });
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse {
  const details = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message
  }));

  return createErrorResponse(
    'Validation failed',
    400,
    details,
    'VALIDATION_ERROR'
  );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): NextResponse {
  logger.error('Database error', error);

  if (error instanceof Error) {
    // Check for specific database error types
    if (error.message.includes('Unique constraint')) {
      return createErrorResponse(
        'Resource already exists',
        409,
        undefined,
        'DUPLICATE_RESOURCE'
      );
    }

    if (error.message.includes('Foreign key constraint')) {
      return createErrorResponse(
        'Invalid reference to related resource',
        400,
        undefined,
        'INVALID_REFERENCE'
      );
    }
  }

  return createErrorResponse(
    'Database operation failed',
    500,
    undefined,
    'DATABASE_ERROR'
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message: string = 'Authentication required'): NextResponse {
  return createErrorResponse(message, 401, undefined, 'AUTH_REQUIRED');
}

/**
 * Handle authorization errors
 */
export function handleAuthzError(message: string = 'Insufficient permissions'): NextResponse {
  return createErrorResponse(message, 403, undefined, 'INSUFFICIENT_PERMISSIONS');
}

/**
 * Generic async error handler wrapper
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error('Unhandled API error', error);

      if (error instanceof ZodError) {
        return handleValidationError(error);
      }

      if (error instanceof Error) {
        return createErrorResponse(error.message, 500, undefined, 'INTERNAL_ERROR');
      }

      return createErrorResponse(
        'An unexpected error occurred',
        500,
        undefined,
        'UNKNOWN_ERROR'
      );
    }
  };
}

/**
 * Type-safe fetch wrapper for client-side API calls
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      data: result.data || result,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Create type-safe hook for API calls
 */
export function createApiHook<TParams, TResponse>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) {
  return async (params?: TParams): Promise<{ data: TResponse | null; error: string | null }> => {
    const url = method === 'GET' && params
      ? `${endpoint}?${new URLSearchParams(params as any).toString()}`
      : endpoint;

    const options: RequestInit = {
      method,
      ...(method !== 'GET' && params && {
        body: JSON.stringify(params)
      })
    };

    return apiCall<TResponse>(url, options);
  };
}
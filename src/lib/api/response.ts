// ===========================================
// API Response Utilities
// ===========================================

import { NextResponse } from 'next/server';
import type { ApiResponse, ApiError, ApiMeta } from '@/types/api';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  meta?: ApiMeta,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  },
  status = 200
): NextResponse<ApiResponse<T[]>> {
  const { page, pageSize, total } = pagination;
  const hasMore = page * pageSize < total;

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page,
        pageSize,
        total,
        hasMore,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, string[]>
): NextResponse<ApiResponse<never>> {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  return NextResponse.json(
    {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function validationError(
  details: Record<string, string[]>
): NextResponse<ApiResponse<never>> {
  return errorResponse(
    'VALIDATION_ERROR',
    'Invalid request data',
    422,
    details
  );
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedError(
  message = 'Authentication required'
): NextResponse<ApiResponse<never>> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

/**
 * Create a forbidden error response
 */
export function forbiddenError(
  message = 'Access denied'
): NextResponse<ApiResponse<never>> {
  return errorResponse('FORBIDDEN', message, 403);
}

/**
 * Create a not found error response
 */
export function notFoundError(
  resource = 'Resource'
): NextResponse<ApiResponse<never>> {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Create an internal server error response
 */
export function internalError(
  message = 'An unexpected error occurred'
): NextResponse<ApiResponse<never>> {
  return errorResponse('INTERNAL_ERROR', message, 500);
}

/**
 * Create a rate limit error response
 */
export function rateLimitError(
  retryAfter?: number
): NextResponse<ApiResponse<never>> {
  const response = errorResponse(
    'RATE_LIMITED',
    'Too many requests. Please try again later.',
    429
  );

  if (retryAfter) {
    response.headers.set('Retry-After', String(retryAfter));
  }

  return response;
}

/**
 * Handle unknown errors and return appropriate response
 */
export function handleError(error: unknown): NextResponse<ApiResponse<never>> {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Check for common error types
    if (error.message.includes('not found')) {
      return notFoundError();
    }
    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return unauthorizedError();
    }
    if (error.message.includes('forbidden') || error.message.includes('Access denied')) {
      return forbiddenError();
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return errorResponse('VALIDATION_ERROR', error.message, 422);
    }

    // Generic error with message
    return errorResponse('ERROR', error.message, 500);
  }

  // Unknown error type
  return internalError();
}

/**
 * API Utility Functions
 * 
 * Standardized response handling and request processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { createRateLimit, validateRequest, withPerformanceMonitoring, addSecurityHeaders } from './middleware';

// ================== STANDARD RATE LIMITS ==================

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
});

export const heavyApiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20 // Lower limit for calculation-heavy endpoints
});

// ================== RESPONSE BUILDERS ==================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  const response = NextResponse.json({
    success: true,
    data
  }, { status });
  
  return addSecurityHeaders(response);
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: string[]
): NextResponse {
  const response = NextResponse.json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  }, { status });
  
  return addSecurityHeaders(response);
}

export function createValidationErrorResponse(
  errors: string[],
  warnings: string[] = [],
  status: number = 400
): NextResponse {
  const response = NextResponse.json({
    success: false,
    validation: {
      isValid: false,
      errors,
      warnings
    },
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: errors
    }
  }, { status });
  
  return addSecurityHeaders(response);
}

// ================== REQUEST PROCESSORS ==================

export async function processAPIRequest<T>(
  request: NextRequest,
  endpoint: string,
  processor: (body: T) => Promise<NextResponse>
): Promise<NextResponse> {
  return withPerformanceMonitoring(endpoint, async () => {
    // Rate limiting
    const rateLimitResult = apiRateLimit(request);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        endpoint,
        clientIP: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again later.',
        429
      );
    }
    
    // Request validation
    const validationResult = validateRequest(request, {
      maxBodySize: 50 * 1024, // 50KB max body size
      requiredHeaders: ['content-type']
    });
    
    if (!validationResult.isValid) {
      return createErrorResponse(
        'INVALID_REQUEST',
        validationResult.error || 'Request validation failed',
        400
      );
    }
    
    try {
      // Parse and validate JSON body
      const body: T = await request.json();
      return await processor(body);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'INVALID_JSON',
          'Invalid JSON in request body',
          400
        );
      }
      
      logger.error('API request processing failed', error as Error, {
        endpoint,
        userAgent: request.headers.get('user-agent')
      });
      
      return createErrorResponse(
        'INTERNAL_ERROR',
        'An internal server error occurred',
        500
      );
    }
  });
}

// ================== METHOD HANDLERS ==================

export function createMethodNotAllowedResponse(allowedMethods: string[]): NextResponse {
  const response = NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    }
  }, { 
    status: 405,
    headers: {
      'Allow': allowedMethods.join(', ')
    }
  });
  
  return addSecurityHeaders(response);
} 
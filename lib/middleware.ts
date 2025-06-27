/**
 * API Middleware Utilities for Scaling
 * 
 * Includes rate limiting, request validation, and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// ================== RATE LIMITING ==================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or database-backed solution
 */
export function createRateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { success: boolean; remaining: number } => {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const key = `rate_limit:${clientIP}`;
    const now = Date.now();
    
    // Clean up expired entries to prevent memory leaks
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    const existing = rateLimitStore.get(key);
    
    if (!existing || existing.resetTime < now) {
      // New window or expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { success: true, remaining: config.maxRequests - 1 };
    }
    
    if (existing.count >= config.maxRequests) {
      return { success: false, remaining: 0 };
    }
    
    existing.count++;
    return { success: true, remaining: config.maxRequests - existing.count };
  };
}

// ================== REQUEST VALIDATION ==================

export interface ValidationMiddlewareConfig {
  maxBodySize: number; // bytes
  requiredHeaders?: string[];
  allowedOrigins?: string[];
}

export function validateRequest(request: NextRequest, config: ValidationMiddlewareConfig): {
  isValid: boolean;
  error?: string;
} {
  // Check content length
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > config.maxBodySize) {
    return {
      isValid: false,
      error: `Request body too large. Maximum size: ${config.maxBodySize} bytes`
    };
  }
  
  // Check required headers
  if (config.requiredHeaders) {
    for (const header of config.requiredHeaders) {
      if (!request.headers.get(header)) {
        return {
          isValid: false,
          error: `Missing required header: ${header}`
        };
      }
    }
  }
  
  // Check CORS
  if (config.allowedOrigins) {
    const origin = request.headers.get('origin');
    if (origin && !config.allowedOrigins.includes(origin)) {
      return {
        isValid: false,
        error: 'Origin not allowed'
      };
    }
  }
  
  return { isValid: true };
}

// ================== PERFORMANCE MONITORING ==================

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: string;
}

export function withPerformanceMonitoring<T>(
  endpoint: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  return operation()
    .then(result => {
      const duration = Date.now() - start;
      
      // Log slow requests for optimization
      if (duration > 1000) {
        logger.warn('Slow API request detected', {
          endpoint,
          duration,
          threshold: 1000
        });
      }
      
      return result;
    })
    .catch(error => {
      const duration = Date.now() - start;
      logger.error('API request failed', error instanceof Error ? error : new Error(String(error)), {
        endpoint,
        duration
      });
      throw error;
    });
}

// ================== SECURITY HEADERS ==================

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
} 
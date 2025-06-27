/**
 * Authentication API Route: Login
 * 
 * Handles email/password login with session management
 * Links Supabase auth.users.id to customer_surveys.user_id for data ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { createRateLimit, withPerformanceMonitoring, addSecurityHeaders } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import type { LoginRequest, LoginResponse } from '@/types/auth-api-contracts';

// Rate limiting: 5 login attempts per 15 minutes per IP
const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5
});

export async function POST(request: NextRequest) {
  return withPerformanceMonitoring('/api/auth/login', async () => {
    try {
      // Rate limiting
      const rateLimitResult = loginRateLimit(request);
      if (!rateLimitResult.success) {
        logger.warn('Rate limit exceeded for login attempt', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          remaining: rateLimitResult.remaining
        });
        
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many login attempts. Please try again later.',
              timestamp: new Date(),
              retryAfter: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }
          } as LoginResponse,
          { status: 429 }
        ));
      }

      // Parse request body
      const body: LoginRequest = await request.json();
      const { email, password, rememberMe = false, deviceFingerprint } = body;

      // Validate input
      if (!email || !password) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Email and password are required',
              timestamp: new Date()
            }
          } as LoginResponse,
          { status: 400 }
        ));
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_EMAIL',
              message: 'Please enter a valid email address',
              timestamp: new Date()
            }
          } as LoginResponse,
          { status: 400 }
        ));
      }

      // Create Supabase server client
      const supabase = createSupabaseServerClient();

      // Attempt authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.warn('Login attempt failed', {
          email: email.toLowerCase(),
          error: error.message,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTHENTICATION_FAILED',
              message: 'Invalid email or password',
              timestamp: new Date(),
              // Don't specify whether email or password was wrong for security
            }
          } as LoginResponse,
          { status: 401 }
        ));
      }

      if (!data.user || !data.session) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTHENTICATION_FAILED',
              message: 'Authentication failed',
              timestamp: new Date()
            }
          } as LoginResponse,
          { status: 401 }
        ));
      }

      // Log successful authentication
      logger.info('User authenticated successfully', {
        userId: data.user.id,
        email: data.user.email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      // Prepare response data
      const responseData: LoginResponse = {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email!,
            username: data.user.user_metadata.username,
            profile: {
              firstName: data.user.user_metadata.firstName,
              lastName: data.user.user_metadata.lastName,
              dateOfBirth: data.user.user_metadata.dateOfBirth ? new Date(data.user.user_metadata.dateOfBirth) : undefined,
              createdAt: new Date(data.user.created_at),
              lastLoginAt: data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at) : undefined,
            },
            preferences: {
              language: data.user.user_metadata.language || 'en',
              timezone: data.user.user_metadata.timezone || 'UTC',
              notifications: data.user.user_metadata.notifications || {
                email: { enabled: true, security: true, marketing: false, surveyReminders: true },
                sms: { enabled: false, security: false, surveyReminders: false }
              }
            },
            hipaaConsent: data.user.user_metadata.hipaaConsent || {
              hasConsented: false,
              consentVersion: '1.0',
              consentDetails: {
                dataCollection: false,
                phiProcessing: false,
                dataRetention: false,
                dataSharing: false
              }
            }
          },
          session: {
            id: data.session.access_token, // Using access token as session ID
            userId: data.user.id,
            type: 'authenticated',
            createdAt: new Date(),
            expiresAt: new Date(data.session.expires_at! * 1000),
            lastActivityAt: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            isActive: true,
            deviceFingerprint,
            auditTrail: []
          },
          requiresMfa: false, // MFA not implemented in this version
          expiresAt: new Date(data.session.expires_at! * 1000)
        }
      };

      // Set authentication cookies
      const response = addSecurityHeaders(NextResponse.json(responseData));
      
      // Set secure HTTP-only cookie for session management
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours
      
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });

      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });

      return response;

    } catch (error) {
      logger.error('Login endpoint error', error, {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return addSecurityHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during authentication',
            timestamp: new Date()
          }
        } as LoginResponse,
        { status: 500 }
      ));
    }
  });
} 
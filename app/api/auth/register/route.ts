/**
 * Authentication API Route: Registration
 * 
 * Handles user registration with HIPAA consent tracking
 * Creates user in Supabase auth and prepares for survey data linking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { createRateLimit, withPerformanceMonitoring, addSecurityHeaders } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import type { RegistrationRequest, RegistrationResponse } from '@/types/auth-api-contracts';

// Rate limiting: 3 registration attempts per hour per IP
const registrationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3
});

export async function POST(request: NextRequest) {
  return withPerformanceMonitoring('/api/auth/register', async () => {
    try {
      // Rate limiting
      const rateLimitResult = registrationRateLimit(request);
      if (!rateLimitResult.success) {
        logger.warn('Rate limit exceeded for registration attempt', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          remaining: rateLimitResult.remaining
        });
        
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many registration attempts. Please try again later.',
              timestamp: new Date(),
              retryAfter: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            }
          } as RegistrationResponse,
          { status: 429 }
        ));
      }

      // Parse request body
      const body: RegistrationRequest = await request.json();
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        dateOfBirth, 
        timezone = 'UTC', 
        language = 'en',
        hipaaConsent
      } = body;

      // Validate required fields
      if (!email || !password || !hipaaConsent) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_REQUIRED_FIELDS',
              message: 'Email, password, and HIPAA consent are required',
              timestamp: new Date()
            }
          } as RegistrationResponse,
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
          } as RegistrationResponse,
          { status: 400 }
        ));
      }

      // Password validation
      if (password.length < 8) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'WEAK_PASSWORD',
              message: 'Password must be at least 8 characters long',
              timestamp: new Date()
            }
          } as RegistrationResponse,
          { status: 400 }
        ));
      }

      // HIPAA consent validation
      if (!hipaaConsent.hasConsented || !hipaaConsent.consentDetails.dataCollection) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'HIPAA_CONSENT_REQUIRED',
              message: 'HIPAA consent is required to create an account',
              timestamp: new Date()
            }
          } as RegistrationResponse,
          { status: 400 }
        ));
      }

      // Age validation if dateOfBirth provided
      if (dateOfBirth) {
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
        if (age < 13) {
          return addSecurityHeaders(NextResponse.json(
            {
              success: false,
              error: {
                code: 'AGE_RESTRICTION',
                message: 'Users must be at least 13 years old',
                timestamp: new Date()
              }
            } as RegistrationResponse,
            { status: 400 }
          ));
        }
      }

      // Create Supabase server client
      const supabase = createSupabaseServerClient();

      // Prepare user metadata
      const userMetadata = {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth?.toISOString(),
        timezone,
        language,
        hipaaConsent: {
          ...hipaaConsent,
          consentDate: new Date().toISOString(),
          consentVersion: '1.0'
        },
        notifications: {
          email: {
            enabled: true,
            security: true,
            marketing: false,
            surveyReminders: true
          },
          sms: {
            enabled: false,
            security: false,
            surveyReminders: false
          }
        },
        registrationSource: 'web',
        registrationIp: request.headers.get('x-forwarded-for') || 'unknown',
        registrationUserAgent: request.headers.get('user-agent') || 'unknown'
      };

      // Attempt user creation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/verify-email`
        }
      });

      if (error) {
        logger.warn('Registration attempt failed', {
          email: email.toLowerCase(),
          error: error.message,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        });

        // Handle specific error cases
        if (error.message.includes('already registered')) {
          return addSecurityHeaders(NextResponse.json(
            {
              success: false,
              error: {
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'An account with this email already exists',
                timestamp: new Date()
              }
            } as RegistrationResponse,
            { status: 409 }
          ));
        }

        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'REGISTRATION_FAILED',
              message: 'Failed to create account. Please try again.',
              timestamp: new Date()
            }
          } as RegistrationResponse,
          { status: 400 }
        ));
      }

      if (!data.user) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'REGISTRATION_FAILED',
              message: 'Failed to create account',
              timestamp: new Date()
            }
          } as RegistrationResponse,
          { status: 400 }
        ));
      }

      // Log successful registration
      logger.info('User registered successfully', {
        userId: data.user.id,
        email: data.user.email,
        confirmationSent: !data.user.email_confirmed_at,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      // Prepare response
      const responseData: RegistrationResponse = {
        success: true,
        data: {
          userId: data.user.id,
          verificationRequired: !data.user.email_confirmed_at,
          verificationMethod: 'email'
        }
      };

      return addSecurityHeaders(NextResponse.json(responseData));

    } catch (error) {
      logger.error('Registration endpoint error', error, {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return addSecurityHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred during registration',
            timestamp: new Date()
          }
        } as RegistrationResponse,
        { status: 500 }
      ));
    }
  });
} 
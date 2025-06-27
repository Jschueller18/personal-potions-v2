/**
 * Intake Validation API Route
 * 
 * Validates intake field formats and provides conversion previews
 * Supports both legacy multiple-choice AND numeric serving formats
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type IntakeValidationRequest,
  type IntakeValidationResponse,
  validateIntakeFormat,
  convertIntakeToMg,
  INTAKE_FIELDS,
  extractElectrolyteFromField,
  detectFormat,
} from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<IntakeValidationResponse>> {
  try {
    const body: IntakeValidationRequest = await request.json();
    
    if (!body.intakeFields) {
      return NextResponse.json({
        success: false,
        validation: {
          isValid: false,
          errors: ['Missing intakeFields in request body'],
          warnings: [],
        },
      }, { status: 400 });
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const conversions: any = {};

    // Validate each intake field using constants for efficiency
    for (const field of INTAKE_FIELDS) {
      const value = body.intakeFields[field];
      if (value !== undefined) {
        const fieldValidation = validateIntakeFormat(value, field);
        errors.push(...fieldValidation.errors);
        warnings.push(...fieldValidation.warnings);
        
        if (fieldValidation.isValid) {
          const electrolyte = extractElectrolyteFromField(field) as 'sodium' | 'potassium' | 'magnesium' | 'calcium';
          const mg = convertIntakeToMg(value, electrolyte);
          const format = detectFormat(String(value));
          
          conversions[electrolyte] = {
            input: String(value),
            mg,
            format,
          };
        }
      }
    }

    const response: IntakeValidationResponse = {
      success: errors.length === 0,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings,
      },
      conversions: Object.keys(conversions).length > 0 ? conversions : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    // Import logger for production-ready error handling
    const { logger } = await import('@/lib/logger');
    logger.error('Intake validation failed', error as Error, {
      endpoint: '/api/intake/validate',
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json({
      success: false,
      validation: {
        isValid: false,
        errors: ['Internal server error during validation'],
        warnings: [],
      },
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    validation: {
      isValid: false,
      errors: ['GET method not supported. Use POST to validate intake fields.'],
      warnings: [],
    },
  }, { status: 405 });
} 
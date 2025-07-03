/**
 * Formula Calculation API Route - Dual Format Support with Database Integration
 * 
 * Supports both legacy multiple-choice intake formats AND numeric serving formats
 * Handles validation, conversion, formula calculation, and database storage with V1 framework
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type FormulaCalculationRequest,
  type FormulaCalculationResponse,
  type CustomerData,
  type FormulationResult,
  validateCustomerData,
  validateAllIntakeFields,
  convertAllIntakesToMg,
  detectIntakeFormats,
  applyCustomerDefaults,
  buildErrorResponse,
  buildInvalidRequestResponse,
} from '@/types';

import { V1DatabaseMappingService } from '@/lib/services/v1-database-mapping';
import { createCalculationEngine } from '@/lib/calculation-engine/factory';

export async function POST(request: NextRequest): Promise<NextResponse<FormulaCalculationResponse>> {
  try {
    // Parse request body
    const body: FormulaCalculationRequest = await request.json();
    
    // Validate request structure using utility
    if (!body.customerData) {
      const { response, status } = buildInvalidRequestResponse('Missing customerData in request body');
      return NextResponse.json(response, { status });
    }

    // Extract session and user context from headers (set by middleware)
    const sessionId = request.headers.get('x-session-id') || `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const userId = request.headers.get('x-user-id') || null;

    // Apply defaults to customer data
    const customerData: CustomerData = applyCustomerDefaults(body.customerData);

    // Validate customer data
    const basicValidation = validateCustomerData(customerData);
    if (!basicValidation.isValid) {
      return NextResponse.json({
        success: false,
        validation: basicValidation,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Customer data validation failed',
          details: basicValidation.errors,
        },
      }, { status: 400 });
    }

    // Validate intake fields (dual-format support)
    const intakeValidation = validateAllIntakeFields(customerData);
    if (!intakeValidation.isValid) {
      return NextResponse.json({
        success: false,
        validation: intakeValidation,
        error: {
          code: 'INTAKE_VALIDATION_ERROR',
          message: 'Intake field validation failed',
          details: intakeValidation.errors,
        },
      }, { status: 400 });
    }

    // If validate-only option is set, return validation results
    if (body.options?.validateOnly) {
      const formats = detectIntakeFormats(customerData);
      const converted = convertAllIntakesToMg(customerData);
      
      return NextResponse.json({
        success: true,
        validation: {
          isValid: true,
          errors: [],
          warnings: [...basicValidation.warnings, ...intakeValidation.warnings],
        },
        data: {
          formulation: {} as FormulationResult, // Empty for validation-only
          intakeAnalysis: {
            formats,
            converted,
            warnings: intakeValidation.warnings,
          },
        },
      });
    }

    // Convert intake values to mg amounts
    const convertedIntakes = convertAllIntakesToMg(customerData);
    const detectedFormats = detectIntakeFormats(customerData);

    // Calculate formulation using appropriate engine (mock in dev, real in prod)
    const engine = createCalculationEngine();
    const formulation = await engine.calculate(customerData);

    // Save customer survey data to database using service layer
    const surveyResult = await V1DatabaseMappingService.saveCustomerSurvey(
      customerData,
      sessionId,
      userId || undefined
    );

    if (!surveyResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save customer survey data',
          details: surveyResult.validation.errors,
        },
      }, { status: 500 });
    }

    // Save formulation result to database using service layer
    const formulationSaveResult = await V1DatabaseMappingService.saveFormulationResult(
      surveyResult.surveyId!,
      formulation
    );

    if (!formulationSaveResult.success) {
      // Log error but don't fail the request - we still have the calculation
      const { logger } = await import('@/lib/logger');
      logger.error('Failed to save formulation result', new Error('Database save failed'), {
        surveyId: surveyResult.surveyId,
        endpoint: '/api/formula/calculate'
      });
    }

    // Return successful response with database IDs
    const response: FormulaCalculationResponse = {
      success: true,
      data: {
        formulation: formulation,
        intakeAnalysis: {
          formats: detectedFormats,
          converted: convertedIntakes,
          warnings: [...basicValidation.warnings, ...intakeValidation.warnings],
        },
        surveyId: surveyResult.surveyId,
        formulationId: formulationSaveResult.resultId,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [...basicValidation.warnings, ...intakeValidation.warnings],
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    // Import logger for production-ready error handling
    const { logger } = await import('@/lib/logger');
    logger.error('Formula calculation failed', error as Error, {
      endpoint: '/api/formula/calculate',
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred during formula calculation',
      },
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'GET method not supported. Use POST to calculate formulas.',
    },
  }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'PUT method not supported. Use POST to calculate formulas.',
    },
  }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'DELETE method not supported. Use POST to calculate formulas.',
    },
  }, { status: 405 });
} 
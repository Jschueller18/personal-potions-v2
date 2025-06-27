/**
 * Formula Calculation API Route - Dual Format Support
 * 
 * Supports both legacy multiple-choice intake formats AND numeric serving formats
 * Handles validation, conversion, and formula calculation with V1 framework
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

// TODO: Import calculation engine when implemented
// import { PersonalPotionsEngine } from '@/lib/calculation-engine/core/implementation';

export async function POST(request: NextRequest): Promise<NextResponse<FormulaCalculationResponse>> {
  try {
    // Parse request body
    const body: FormulaCalculationRequest = await request.json();
    
    // Validate request structure using utility
    if (!body.customerData) {
      const { response, status } = buildInvalidRequestResponse('Missing customerData in request body');
      return NextResponse.json(response, { status });
    }

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

    // TODO: Implement calculation engine integration
    // const engine = new PersonalPotionsEngine();
    // const formulation = await engine.calculate(customerData);
    
    // Temporary mock response until calculation engine is implemented
    const mockFormulation: FormulationResult = {
      formulationPerServing: {
        sodium: 500,
        potassium: 400,
        magnesium: 100,
        calcium: 300,
      },
      useCase: customerData.usage || 'daily',
      metadata: {
        formulaVersion: '1.4',
        servingSize: '16 fl oz (473ml)',
        recommendedServingsPerDay: 1,
        optimalIntake: convertedIntakes,
        currentIntake: convertedIntakes,
        deficits: { sodium: 0, potassium: 0, magnesium: 0, calcium: 0 },
        electrolyteForms: {
          sodium: 'sodium-chloride',
          potassium: 'potassium-citrate',
          magnesium: 'magnesium-glycinate',
          calcium: 'calcium-citrate',
        },
        notes: {
          primary: 'Dual-format intake processing completed successfully',
          additional: [`Processed ${Object.keys(detectedFormats).length} intake fields`],
        },
        recommendations: ['Formula calculated with dual-format support'],
        calculationTimestamp: new Date(),
        customerAge: customerData.age,
        customerWeight: customerData.weight,
        detectedUseCase: customerData.usage,
      },
    };

    // Return successful response
    const response: FormulaCalculationResponse = {
      success: true,
      data: {
        formulation: mockFormulation,
        intakeAnalysis: {
          formats: detectedFormats,
          converted: convertedIntakes,
          warnings: [...basicValidation.warnings, ...intakeValidation.warnings],
        },
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
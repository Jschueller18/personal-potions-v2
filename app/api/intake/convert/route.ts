/**
 * Intake Conversion API Route
 * 
 * Converts between intake formats and mg amounts
 * Supports single conversion and batch operations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type IntakeConversionRequest,
  type IntakeConversionResponse,
  type BatchIntakeConversionRequest,
  type BatchIntakeConversionResponse,
  convertIntakeToMg,
  validateIntakeFormat,
  type IntakeLevel,
  isValidElectrolyte,
  detectFormat,
  processBatchConversions,
} from '@/types';

// Single conversion endpoint
export async function POST(request: NextRequest): Promise<NextResponse<IntakeConversionResponse | BatchIntakeConversionResponse>> {
  try {
    const body = await request.json();
    
    // Check if it's a batch conversion request
    if ('conversions' in body) {
      return handleBatchConversion(body as BatchIntakeConversionRequest);
    }
    
    // Handle single conversion
    return handleSingleConversion(body as IntakeConversionRequest);

  } catch (error) {
    // Import logger for production-ready error handling
    const { logger } = await import('@/lib/logger');
    logger.error('Intake conversion failed', error as Error, {
      endpoint: '/api/intake/convert',
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error during conversion',
      },
    }, { status: 500 });
  }
}

async function handleSingleConversion(body: IntakeConversionRequest): Promise<NextResponse<IntakeConversionResponse>> {
  const { value, electrolyte, direction = 'to-mg' } = body;
  
  if (!value || !electrolyte) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Missing required fields: value and electrolyte',
      },
    }, { status: 400 });
  }

  if (!isValidElectrolyte(electrolyte)) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Invalid electrolyte. Must be one of: sodium, potassium, magnesium, calcium',
      },
    }, { status: 400 });
  }

  // Validate the input format
  const validation = validateIntakeFormat(value, `${electrolyte}-intake`);
  if (!validation.isValid) {
    return NextResponse.json({
      success: false,
      error: {
        message: `Invalid intake format: ${validation.errors.join(', ')}`,
      },
    }, { status: 400 });
  }

  try {
    const format = detectFormat(String(value));
    
    if (direction === 'to-mg') {
      const mg = convertIntakeToMg(value, electrolyte);
      
      return NextResponse.json({
        success: true,
        data: {
          input: {
            value: String(value),
            format,
          },
          output: {
            mg,
          },
          electrolyte,
        },
      });
    } else {
      // from-mg conversion (reverse lookup)
      return NextResponse.json({
        success: false,
        error: {
          message: 'from-mg conversion not yet implemented',
        },
      }, { status: 501 });
    }

  } catch (conversionError) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Conversion failed',
      },
    }, { status: 400 });
  }
}

async function handleBatchConversion(body: BatchIntakeConversionRequest): Promise<NextResponse<BatchIntakeConversionResponse>> {
  if (!Array.isArray(body.conversions) || body.conversions.length === 0) {
    return NextResponse.json({
      success: false,
      results: [],
    }, { status: 400 });
  }

  const results = processBatchConversions(
    body.conversions,
    (conversion, index) => {
      const { value, electrolyte, id } = conversion;
      
      // Validate electrolyte
      if (!isValidElectrolyte(electrolyte)) {
        return {
          id: id || `conversion_${index}`,
          input: {
            value: String(value),
            electrolyte,
            format: 'unknown' as 'legacy' | 'numeric',
          },
          output: { mg: 0 },
          success: false,
          error: 'Invalid electrolyte',
        };
      }

      // Validate format
      const validation = validateIntakeFormat(value, `${electrolyte}-intake`);
      if (!validation.isValid) {
        return {
          id: id || `conversion_${index}`,
          input: {
            value: String(value),
            electrolyte,
            format: 'unknown' as 'legacy' | 'numeric',
          },
          output: { mg: 0 },
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Perform conversion
      const format = detectFormat(String(value));
      const mg = convertIntakeToMg(value, electrolyte);

      return {
        id: id || `conversion_${index}`,
        input: {
          value: String(value),
          electrolyte,
          format,
        },
        output: { mg },
        success: true,
      };
    },
    (conversion, index) => ({
      id: conversion.id || `conversion_${index}`,
      input: {
        value: String(conversion.value),
        electrolyte: conversion.electrolyte,
        format: 'unknown' as 'legacy' | 'numeric',
      },
      output: { mg: 0 },
      success: false,
      error: 'Conversion failed',
    })
  );

  const successCount = results.filter(r => r.success).length;

  return NextResponse.json({
    success: successCount === results.length,
    results,
  });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      message: 'GET method not supported. Use POST to convert intake values.',
    },
  }, { status: 405 });
} 
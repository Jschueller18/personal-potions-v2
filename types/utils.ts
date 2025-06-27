/**
 * Personal Potions V2 - Utility Functions
 * 
 * Reusable utilities to eliminate code duplication and improve efficiency
 */

import type { IntakeLevel } from './enums';

// ================== CONSTANTS ==================

/**
 * Cached legacy values array for performance
 */
export const LEGACY_INTAKE_VALUES: readonly IntakeLevel[] = Object.freeze([
  '0', '1-3', '4-6', '7', '8-10', '11-13', '14'
] as const);

/**
 * Valid electrolyte types
 */
export const ELECTROLYTE_TYPES = Object.freeze([
  'sodium', 'potassium', 'magnesium', 'calcium'
] as const);

/**
 * Intake field names
 */
export const INTAKE_FIELDS = Object.freeze([
  'sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake'
] as const);

// ================== FORMAT UTILITIES ==================

/**
 * Efficiently detects if a value is in legacy format
 * Uses cached array for performance
 */
export function isLegacyFormat(value: string): value is IntakeLevel {
  return LEGACY_INTAKE_VALUES.includes(value as IntakeLevel);
}

/**
 * Detects format type for a single intake value
 */
export function detectFormat(value: string): 'legacy' | 'numeric' {
  return isLegacyFormat(value) ? 'legacy' : 'numeric';
}

/**
 * Validates electrolyte type
 */
export function isValidElectrolyte(electrolyte: string): electrolyte is 'sodium' | 'potassium' | 'magnesium' | 'calcium' {
  return ELECTROLYTE_TYPES.includes(electrolyte as any);
}

// ================== ERROR RESPONSE BUILDERS ==================

/**
 * Standardized error response builder
 */
export function buildErrorResponse(
  code: string,
  message: string,
  details?: string[],
  status: number = 400
) {
  return {
    response: {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      },
    },
    status
  };
}

/**
 * Validation error response builder
 */
export function buildValidationErrorResponse(errors: string[], warnings: string[] = []) {
  return buildErrorResponse(
    'VALIDATION_ERROR',
    'Validation failed',
    errors
  );
}

/**
 * Invalid request error response
 */
export function buildInvalidRequestResponse(message: string) {
  return buildErrorResponse(
    'INVALID_REQUEST',
    message
  );
}

// ================== CONVERSION UTILITIES ==================

/**
 * Extract electrolyte name from field name
 * e.g., 'sodium-intake' -> 'sodium'
 */
export function extractElectrolyteFromField(fieldName: string): string {
  return fieldName.replace('-intake', '');
}

/**
 * Batch process conversions with error handling
 */
export function processBatchConversions<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  errorHandler: (item: T, index: number, error: unknown) => R
): R[] {
  return items.map((item, index) => {
    try {
      return processor(item, index);
    } catch (error) {
      return errorHandler(item, index, error);
    }
  });
}

// ================== PERFORMANCE UTILITIES ==================

/**
 * Simple cache for frequently accessed conversions with memory limit
 */
const conversionCache = new Map<string, number>();
const MAX_CACHE_SIZE = 1000; // Prevent unbounded memory growth

/**
 * Cached conversion for repeated operations
 */
export function getCachedConversion(key: string, computer: () => number): number {
  if (conversionCache.has(key)) {
    return conversionCache.get(key)!;
  }
  
  // Clear cache if it gets too large
  if (conversionCache.size >= MAX_CACHE_SIZE) {
    conversionCache.clear();
  }
  
  const result = computer();
  conversionCache.set(key, result);
  return result;
}

/**
 * Clear conversion cache (for testing or memory management)
 */
export function clearConversionCache(): void {
  conversionCache.clear();
}

// ================== VALIDATION HELPERS ==================

/**
 * Validates numeric serving value
 */
export function validateNumericServing(value: string): { isValid: boolean; warnings: string[] } {
  const numericValue = parseFloat(value);
  const warnings: string[] = [];
  
  if (isNaN(numericValue)) {
    return { isValid: false, warnings };
  }
  
  if (numericValue < 0) {
    return { isValid: false, warnings };
  }
  
  if (numericValue > 50) {
    warnings.push(`Serving value of ${numericValue} seems unusually high`);
  }
  
  return { isValid: true, warnings };
}

/**
 * Validates intake field name
 */
export function isValidIntakeField(field: string): field is 'sodium-intake' | 'potassium-intake' | 'magnesium-intake' | 'calcium-intake' {
  return INTAKE_FIELDS.includes(field as any);
} 
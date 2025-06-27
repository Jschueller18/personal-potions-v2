/**
 * Personal Potions V1 Validation Utilities
 * 
 * Ensures data integrity and compliance with V1 framework requirements
 */

import type {
  CustomerData,
  FormulationResult,
  ValidationResult,
  ElectrolyteAmounts,
  UseCase,
  HealthCondition
} from './index';

import {
  VALIDATION_LIMITS,
  SAFETY_LIMITS,
  FORMULA_VERSION,
  USE_CASE_DETECTION_ORDER,
  LEGACY_INTAKE_ESTIMATES
} from './constants';

import {
  isLegacyFormat,
  validateNumericServing,
  detectFormat,
  INTAKE_FIELDS,
  extractElectrolyteFromField
} from './utils';

import type { IntakeLevel } from './enums';

// ================== CUSTOMER DATA VALIDATION ==================

/**
 * Validates customer input data against V1 framework requirements
 */
export function validateCustomerData(customer: CustomerData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!customer.age || customer.age < VALIDATION_LIMITS.AGE.min || customer.age > VALIDATION_LIMITS.AGE.max) {
    errors.push(`Age must be between ${VALIDATION_LIMITS.AGE.min} and ${VALIDATION_LIMITS.AGE.max}`);
  }

  if (!customer['biological-sex'] || !['male', 'female'].includes(customer['biological-sex'])) {
    errors.push('Biological sex must be "male" or "female"');
  }

  if (!customer.weight || customer.weight < VALIDATION_LIMITS.WEIGHT.min || customer.weight > VALIDATION_LIMITS.WEIGHT.max) {
    errors.push(`Weight must be between ${VALIDATION_LIMITS.WEIGHT.min} and ${VALIDATION_LIMITS.WEIGHT.max} lbs`);
  }

  // Supplement validation
  const supplements = [
    { name: 'sodium-supplement', value: customer['sodium-supplement'], max: VALIDATION_LIMITS.SUPPLEMENT_MAX.sodium },
    { name: 'potassium-supplement', value: customer['potassium-supplement'], max: VALIDATION_LIMITS.SUPPLEMENT_MAX.potassium },
    { name: 'magnesium-supplement', value: customer['magnesium-supplement'], max: VALIDATION_LIMITS.SUPPLEMENT_MAX.magnesium },
    { name: 'calcium-supplement', value: customer['calcium-supplement'], max: VALIDATION_LIMITS.SUPPLEMENT_MAX.calcium },
  ];

  supplements.forEach(({ name, value, max }) => {
    if (value && value > max) {
      warnings.push(`${name} exceeds recommended maximum of ${max}mg`);
    }
    if (value && value < 0) {
      errors.push(`${name} cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Applies default values to customer data as per V1 framework
 */
export function applyCustomerDefaults(customer: Partial<CustomerData>): CustomerData {
  return {
    age: customer.age || 30,
    'biological-sex': customer['biological-sex'] || 'male',
    weight: customer.weight || 70,
    'activity-level': customer['activity-level'] || 'moderately-active',
    'sweat-level': customer['sweat-level'] || 'moderate',
    'daily-goals': customer['daily-goals'] || [],
    'sleep-goals': customer['sleep-goals'] || [],
    'sleep-issues': customer['sleep-issues'] || [],
    'menstrual-symptoms': customer['menstrual-symptoms'] || [],
    conditions: customer.conditions || [],
    'exercise-type': customer['exercise-type'] || [],
    'workout-frequency': customer['workout-frequency'],
    'workout-duration': customer['workout-duration'],
    'workout-intensity': customer['workout-intensity'],
    'hangover-timing': customer['hangover-timing'],
    'hangover-symptoms': customer['hangover-symptoms'] || [],
    'sodium-intake': customer['sodium-intake'] || '7',
    'potassium-intake': customer['potassium-intake'] || '7',
    'magnesium-intake': customer['magnesium-intake'] || '7',
    'calcium-intake': customer['calcium-intake'] || '7',
    'sodium-supplement': customer['sodium-supplement'] || 0,
    'potassium-supplement': customer['potassium-supplement'] || 0,
    'magnesium-supplement': customer['magnesium-supplement'] || 0,
    'calcium-supplement': customer['calcium-supplement'] || 0,
    'daily-water-intake': customer['daily-water-intake'] || 64,
    usage: customer.usage,
  };
}

// ================== DUAL-FORMAT INTAKE VALIDATION ==================

/**
 * Validates intake field format - supports both legacy and numeric formats
 * Optimized using utility functions
 */
export function validateIntakeFormat(value: IntakeLevel | string | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!value) {
    return { isValid: true, errors, warnings }; // Optional field
  }

  // Use utility function for performance
  if (isLegacyFormat(value)) {
    return { isValid: true, errors, warnings };
  }

  // Use utility function for numeric validation
  const numericValidation = validateNumericServing(value);
  if (numericValidation.isValid) {
    warnings.push(...numericValidation.warnings.map(w => `${fieldName}: ${w}`));
    return { isValid: true, errors, warnings };
  }

  // Invalid format
  errors.push(`${fieldName} must be either a legacy format (0, 1-3, 4-6, 7, 8-10, 11-13, 14) or a numeric serving value`);
  return { isValid: false, errors, warnings };
}

/**
 * Validates all intake fields in customer data
 * Optimized using constants and forEach for efficiency
 */
export function validateAllIntakeFields(customer: CustomerData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Use constant for performance and consistency
  INTAKE_FIELDS.forEach(field => {
    const value = customer[field];
    const result = validateIntakeFormat(value, field);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ================== DUAL-FORMAT INTAKE CONVERSION ==================

/**
 * Serving amounts for numeric format conversion - moved to constants for performance
 */
const NUMERIC_SERVING_AMOUNTS = Object.freeze({
  sodium: 500,    // mg per serving
  potassium: 400, // mg per serving
  magnesium: 100, // mg per serving
  calcium: 300,   // mg per serving
});

/**
 * Base intake amounts from food - moved to constants for performance
 */
const BASE_INTAKE_AMOUNTS = Object.freeze({
  sodium: 1500,
  potassium: 2000,
  magnesium: 200,
  calcium: 800,
});

/**
 * Converts intake value to mg amount - handles both legacy and numeric formats
 * Optimized with pre-computed constants
 */
export function convertIntakeToMg(
  value: IntakeLevel | string | undefined,
  electrolyte: 'sodium' | 'potassium' | 'magnesium' | 'calcium'
): number {
  if (!value) {
    return LEGACY_INTAKE_ESTIMATES[electrolyte]['7']; // Default to '7' servings
  }

  // Use utility function for performance
  if (isLegacyFormat(value)) {
    return LEGACY_INTAKE_ESTIMATES[electrolyte][value as IntakeLevel];
  }

  // Handle numeric format - convert servings to mg
  const numericValue = parseFloat(value);
  if (!isNaN(numericValue)) {
    // Use pre-computed constants for better performance
    return BASE_INTAKE_AMOUNTS[electrolyte] + (numericValue * NUMERIC_SERVING_AMOUNTS[electrolyte]);
  }

  // Fallback to default if conversion fails
  return LEGACY_INTAKE_ESTIMATES[electrolyte]['7'];
}

/**
 * Converts all intake fields to mg amounts for calculation
 * Optimized using reduce and utility functions
 */
export function convertAllIntakesToMg(customer: CustomerData): ElectrolyteAmounts {
  return INTAKE_FIELDS.reduce((amounts, field) => {
    const electrolyte = extractElectrolyteFromField(field) as keyof ElectrolyteAmounts;
    amounts[electrolyte] = convertIntakeToMg(customer[field], electrolyte);
    return amounts;
  }, {} as ElectrolyteAmounts);
}

/**
 * Detects the format of intake values for API response metadata
 * Optimized using utility functions and reduce for performance
 */
export function detectIntakeFormats(customer: CustomerData): Record<string, 'legacy' | 'numeric'> {
  return INTAKE_FIELDS.reduce((formats, field) => {
    const value = customer[field];
    formats[field] = value ? detectFormat(String(value)) : 'legacy'; // Default to legacy for undefined
    return formats;
  }, {} as Record<string, 'legacy' | 'numeric'>);
} 
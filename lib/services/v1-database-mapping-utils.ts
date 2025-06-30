/**
 * V1 Database Mapping Utilities
 * 
 * Helper functions for V1 CustomerData processing and validation
 * Extracted from main service to follow 200-300 line rule
 */

import type { CustomerData, ValidationResult } from '@/types';
import { LEGACY_INTAKE_ESTIMATES } from '@/types/constants';
import { detectFormat, INTAKE_FIELDS } from '@/types/utils';

// ================== UTILITY FUNCTIONS ==================

/**
 * Validates that all V1 CustomerData fields are preserved
 */
export function validateV1FieldPreservation(original: CustomerData, retrieved: CustomerData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const requiredFields = [
    'age', 'biological-sex', 'weight', 'activity-level', 'sweat-level',
    'daily-goals', 'sleep-goals', 'sleep-issues', 'menstrual-symptoms',
    'conditions', 'exercise-type', 'workout-frequency', 'workout-duration',
    'workout-intensity', 'hangover-timing', 'hangover-symptoms',
    'sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake',
    'sodium-supplement', 'potassium-supplement', 'magnesium-supplement',
    'calcium-supplement', 'daily-water-intake', 'usage'
  ];
  
  requiredFields.forEach(field => {
    const originalValue = original[field as keyof CustomerData];
    const retrievedValue = retrieved[field as keyof CustomerData];
    
    if (JSON.stringify(originalValue) !== JSON.stringify(retrievedValue)) {
      errors.push(`Field '${field}' not preserved: ${originalValue} → ${retrievedValue}`);
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Converts legacy intake format to mg for calculations
 */
export function convertLegacyIntakeToMg(electrolyte: string, legacyValue: string): number {
  const electrolyteMap = LEGACY_INTAKE_ESTIMATES[electrolyte as keyof typeof LEGACY_INTAKE_ESTIMATES];
  return electrolyteMap?.[legacyValue as keyof typeof electrolyteMap] || 0;
}

/**
 * Gets intake analysis for API responses
 */
export function getIntakeAnalysis(customerData: CustomerData) {
  const formats: Record<string, 'legacy' | 'numeric'> = {};
  const converted: Record<string, number> = {};
  const warnings: string[] = [];
  
  INTAKE_FIELDS.forEach(field => {
    const value = customerData[field as keyof CustomerData] as string;
    if (value) {
      const electrolyte = field.replace('-intake', '');
      const format = detectFormat(value);
      formats[electrolyte] = format;
      
      if (format === 'legacy') {
        const electrolyteMap = LEGACY_INTAKE_ESTIMATES[electrolyte as keyof typeof LEGACY_INTAKE_ESTIMATES];
        converted[electrolyte] = electrolyteMap?.[value as keyof typeof electrolyteMap] || 0;
      } else {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
          warnings.push(`Invalid numeric intake value for ${electrolyte}: ${value}`);
          converted[electrolyte] = 0;
        } else {
          converted[electrolyte] = numericValue;
        }
      }
    }
  });
  
  return { formats, converted, warnings };
} 
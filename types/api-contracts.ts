/**
 * Personal Potions V2 - API Contract Interfaces
 * 
 * Dedicated file for API request/response contracts to maintain clean separation
 * and follow the 200-300 line file size rule
 */

import type {
  CustomerData,
  FormulationResult,
  ValidationResult,
  ElectrolyteAmounts,
  IntakeLevel,
} from './interfaces';

// ================== API CONTRACT INTERFACES ==================

/**
 * API request body for formula calculation - supports dual intake formats
 */
export interface FormulaCalculationRequest {
  customerData: CustomerData;
  options?: {
    validateOnly?: boolean; // If true, only validate without calculating
    includeMetadata?: boolean; // Include detailed calculation metadata
    format?: 'v1' | 'v2'; // API version for response format
  };
}

/**
 * API response for formula calculation
 */
export interface FormulaCalculationResponse {
  success: boolean;
  data?: {
    formulation: FormulationResult;
    intakeAnalysis: {
      formats: Record<string, 'legacy' | 'numeric'>;
      converted: ElectrolyteAmounts;
      warnings: string[];
    };
  };
  validation?: ValidationResult;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

/**
 * API request for intake validation only
 */
export interface IntakeValidationRequest {
  intakeFields: {
    'sodium-intake'?: IntakeLevel | string;
    'potassium-intake'?: IntakeLevel | string;
    'magnesium-intake'?: IntakeLevel | string;
    'calcium-intake'?: IntakeLevel | string;
  };
}

/**
 * API response for intake validation
 */
export interface IntakeValidationResponse {
  success: boolean;
  validation: ValidationResult;
  conversions?: {
    sodium: { input: string; mg: number; format: 'legacy' | 'numeric' };
    potassium: { input: string; mg: number; format: 'legacy' | 'numeric' };
    magnesium: { input: string; mg: number; format: 'legacy' | 'numeric' };
    calcium: { input: string; mg: number; format: 'legacy' | 'numeric' };
  };
}

/**
 * API request for intake conversion
 */
export interface IntakeConversionRequest {
  value: IntakeLevel | string;
  electrolyte: 'sodium' | 'potassium' | 'magnesium' | 'calcium';
  direction?: 'to-mg' | 'from-mg'; // Default: 'to-mg'
}

/**
 * API response for intake conversion
 */
export interface IntakeConversionResponse {
  success: boolean;
  data?: {
    input: {
      value: string;
      format: 'legacy' | 'numeric';
    };
    output: {
      mg: number;
      servings?: number; // If converting from mg
    };
    electrolyte: string;
  };
  error?: {
    message: string;
  };
}

/**
 * Batch conversion request for multiple intake values
 */
export interface BatchIntakeConversionRequest {
  conversions: Array<{
    value: IntakeLevel | string;
    electrolyte: 'sodium' | 'potassium' | 'magnesium' | 'calcium';
    id?: string; // Optional identifier for tracking
  }>;
}

/**
 * Batch conversion response
 */
export interface BatchIntakeConversionResponse {
  success: boolean;
  results: Array<{
    id?: string;
    input: {
      value: string;
      electrolyte: string;
      format: 'legacy' | 'numeric';
    };
    output: {
      mg: number;
    };
    success: boolean;
    error?: string;
  }>;
} 
/**
 * Personal Potions V1 Database Mapping Service
 * 
 * Handles V1 CustomerData preservation with dual intake format support
 * CRITICAL: Ensures zero data loss during V1 → database conversion
 */

import type {
  CustomerData,
  FormulationResult,
  ValidationResult,
} from '@/types';

import {
  LEGACY_INTAKE_ESTIMATES,
  VALIDATION_LIMITS,
  USE_CASE_DETECTION_ORDER,
} from '@/types/constants';

import {
  validateCustomerData,
  applyCustomerDefaults,
} from '@/types/validators';

import {
  isLegacyFormat,
  validateNumericServing,
  detectFormat,
  INTAKE_FIELDS,
} from '@/types/utils';

// Database client (adjust import based on your setup)
import { PrismaClient } from '@/app/generated/prisma';
const prisma = new PrismaClient();

// ================== INTERFACES ==================

interface DatabaseSurveyData {
  id: string;
  userId?: string;
  sessionId: string;
  customerData: CustomerData;
  intakeFormats: IntakeFormatMap;
  age?: number;
  biologicalSex?: string;
  weight?: number;
  activityLevel?: string;
  sweatLevel?: string;
  detectedUseCase?: string;
  status: 'draft' | 'completed' | 'processed';
  completionPercentage?: number;
}

interface IntakeFormatMap {
  sodium: 'legacy' | 'numeric';
  potassium: 'legacy' | 'numeric';
  magnesium: 'legacy' | 'numeric';
  calcium: 'legacy' | 'numeric';
}

interface IntakeConversionRecord {
  electrolyte: string;
  originalValue: string;
  originalFormat: 'legacy' | 'numeric';
  convertedMg: number;
  conversionSource: 'LEGACY_INTAKE_ESTIMATES' | 'DIRECT_NUMERIC';
}

interface DatabaseFormulationData {
  customerSurveyId: string;
  formulationResult: FormulationResult;
  useCase: string;
  formulaVersion: string;
  servingSize: string;
  sodiumMg?: number;
  potassiumMg?: number;
  magnesiumMg?: number;
  calciumMg?: number;
  priceCents?: number;
  formulaName?: string;
}

// ================== V1 DATA MAPPING SERVICE ==================

export class V1DatabaseMappingService {
  
  /**
   * Maps V1 CustomerData to database format with dual intake support
   * CRITICAL: Preserves all 26 fields exactly with zero data loss
   */
  async saveCustomerSurvey(
    customerData: Partial<CustomerData>,
    sessionId: string,
    userId?: string
  ): Promise<{ success: boolean; surveyId?: string; validation: ValidationResult }> {
    
    try {
      // Step 1: Apply V1 defaults and validate
      const normalizedData = applyCustomerDefaults(customerData);
      const validation = validateCustomerData(normalizedData);
      
      if (!validation.isValid) {
        return { success: false, validation };
      }
      
      // Step 2: Detect and validate intake formats
      const intakeFormats = this.detectIntakeFormats(normalizedData);
      const intakeConversions = this.convertIntakeValues(normalizedData, intakeFormats);
      
      // Step 3: Extract derived fields for performance
      const derivedFields = this.extractDerivedFields(normalizedData);
      
      // Step 4: Detect use case using V1 logic
      const detectedUseCase = this.detectUseCase(normalizedData);
      
      // Step 5: Save to database with transaction
      const result = await prisma.$transaction(async (tx) => {
        
        // Create customer survey record
        const survey = await tx.customerSurvey.create({
          data: {
            userId: userId || null,
            sessionId,
            customerData: normalizedData as any, // JSONB preservation
            intakeFormats: intakeFormats as any,
            ...derivedFields,
            detectedUseCase,
            status: 'completed',
            completionPercentage: 100,
            source: 'web',
          },
        });
        
        // Create intake conversion records for audit trail
        if (intakeConversions.length > 0) {
          await tx.intakeConversion.createMany({
            data: intakeConversions.map(conversion => ({
              customerSurveyId: survey.id,
              ...conversion,
            })),
          });
        }
        
        return survey;
      });
      
      return {
        success: true,
        surveyId: result.id,
        validation,
      };
      
    } catch (error) {
      console.error('V1 Database Mapping Error:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [`Database mapping failed: ${error instanceof Error ? error.message : String(error)}`],
          warnings: [],
        },
      };
    }
  }
  
  /**
   * Saves V1 FormulationResult to database with metadata preservation
   */
  async saveFormulationResult(
    surveyId: string,
    formulationResult: FormulationResult,
    options?: {
      priceCents?: number;
      formulaName?: string;
    }
  ): Promise<{ success: boolean; resultId?: string }> {
    
    try {
      const result = await prisma.formulationResult.create({
        data: {
          customerSurveyId: surveyId,
          formulationResult: formulationResult as any, // JSONB preservation
          useCase: formulationResult.useCase,
          formulaVersion: formulationResult.metadata.formulaVersion,
          servingSize: formulationResult.metadata.servingSize,
          sodiumMg: formulationResult.formulationPerServing.sodium,
          potassiumMg: formulationResult.formulationPerServing.potassium,
          magnesiumMg: formulationResult.formulationPerServing.magnesium,
          calciumMg: formulationResult.formulationPerServing.calcium,
          priceCents: options?.priceCents,
          formulaName: options?.formulaName,
        },
      });
      
      return { success: true, resultId: result.id };
      
    } catch (error) {
      console.error('Formulation Result Save Error:', error);
      return { success: false };
    }
  }
  
  /**
   * Retrieves complete CustomerData from database with intake format reconstruction
   */
  async getCustomerSurvey(surveyId: string): Promise<CustomerData | null> {
    try {
      const survey = await prisma.customerSurvey.findUnique({
        where: { id: surveyId },
        include: {
          intakeConversions: true,
        },
      });
      
      if (!survey) return null;
      
      // Return complete V1 CustomerData structure (preserved in JSONB)
      return survey.customerData as unknown as CustomerData;
      
    } catch (error) {
      console.error('Customer Survey Retrieval Error:', error);
      return null;
    }
  }
  
  /**
   * Retrieves FormulationResult with complete metadata
   */
  async getFormulationResult(resultId: string): Promise<FormulationResult | null> {
    try {
      const result = await prisma.formulationResult.findUnique({
        where: { id: resultId },
      });
      
      if (!result) return null;
      
      // Return complete V1 FormulationResult structure (preserved in JSONB)
      return result.formulationResult as unknown as FormulationResult;
      
    } catch (error) {
      console.error('Formulation Result Retrieval Error:', error);
      return null;
    }
  }
  
  // ================== PRIVATE HELPER METHODS ==================
  
  /**
   * Detects intake formats for all 4 electrolytes
   * CRITICAL: Supports both legacy and numeric formats
   */
  private detectIntakeFormats(customerData: CustomerData): IntakeFormatMap {
    const formats: IntakeFormatMap = {
      sodium: 'legacy',
      potassium: 'legacy',
      magnesium: 'legacy',
      calcium: 'legacy',
    };
    
    INTAKE_FIELDS.forEach(field => {
      const value = customerData[field as keyof CustomerData] as string;
      if (value) {
        const electrolyte = field.replace('-intake', '') as keyof IntakeFormatMap;
        formats[electrolyte] = detectFormat(value);
      }
    });
    
    return formats;
  }
  
  /**
   * Converts intake values to mg amounts with audit trail
   */
  private convertIntakeValues(
    customerData: CustomerData,
    formats: IntakeFormatMap
  ): IntakeConversionRecord[] {
    const conversions: IntakeConversionRecord[] = [];
    
    INTAKE_FIELDS.forEach(field => {
      const value = customerData[field as keyof CustomerData] as string;
      if (value) {
        const electrolyte = field.replace('-intake', '');
        const format = formats[electrolyte as keyof IntakeFormatMap];
        
        let convertedMg: number;
        let conversionSource: 'LEGACY_INTAKE_ESTIMATES' | 'DIRECT_NUMERIC';
        
        if (format === 'legacy') {
          const electrolyteMap = LEGACY_INTAKE_ESTIMATES[electrolyte as keyof typeof LEGACY_INTAKE_ESTIMATES];
          convertedMg = electrolyteMap?.[value as keyof typeof electrolyteMap] || 0;
          conversionSource = 'LEGACY_INTAKE_ESTIMATES';
        } else {
          convertedMg = parseFloat(value);
          conversionSource = 'DIRECT_NUMERIC';
        }
        
        conversions.push({
          electrolyte,
          originalValue: value,
          originalFormat: format,
          convertedMg,
          conversionSource,
        });
      }
    });
    
    return conversions;
  }
  
  /**
   * Extracts commonly queried fields for database performance
   */
  private extractDerivedFields(customerData: CustomerData) {
    return {
      age: customerData.age,
      biologicalSex: customerData['biological-sex'],
      weight: customerData.weight,
      activityLevel: customerData['activity-level'],
      sweatLevel: customerData['sweat-level'],
    };
  }
  
  /**
   * Detects use case using V1 priority logic
   * CRITICAL: Must match exact V1 use case detection order
   */
  private detectUseCase(customerData: CustomerData): string {
    // V1 Use Case Detection Logic (PRESERVE EXACT ORDER)
    
    // 1. Bedtime - Sleep issues take highest priority
    if (customerData['sleep-issues']?.length && 
        customerData['sleep-issues'][0] !== 'none') {
      return 'bedtime';
    }
    
    // 2. Menstrual - Menstrual symptoms second
    if (customerData['menstrual-symptoms']?.length && 
        customerData['menstrual-symptoms'][0] !== 'none') {
      return 'menstrual';
    }
    
    // 3. Sweat - Heavy sweat + frequent workouts third
    if ((customerData['sweat-level'] === 'heavy' || customerData['sweat-level'] === 'excessive') &&
        (customerData['workout-frequency'] === 'daily' || customerData['workout-frequency'] === '4-6-per-week')) {
      return 'sweat';
    }
    
    // 4. Default - Daily
    return 'daily';
  }
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Validates that all V1 CustomerData fields are preserved
 */
export function validateV1FieldPreservation(
  original: CustomerData,
  retrieved: CustomerData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check all 26 required fields
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
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Converts legacy intake format to mg for calculations
 */
export function convertLegacyIntakeToMg(
  electrolyte: string,
  legacyValue: string
): number {
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

// Export singleton instance
export const v1DatabaseMapping = new V1DatabaseMappingService(); 
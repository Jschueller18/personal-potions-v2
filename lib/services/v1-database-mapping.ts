/**
 * Personal Potions V1 Database Mapping Service
 * 
 * Handles V1 CustomerData preservation with dual intake format support
 * CRITICAL: Ensures zero data loss during V1 → database conversion
 * 
 * Converted from Prisma to Supabase with proper clean architecture
 */

import type {
  CustomerData,
  FormulationResult,
  ValidationResult,
} from '@/types';

import type {
  CustomerSurveyInsert,
  FormulationResultInsert,
  IntakeConversionInsert,
} from '@/types/database';

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

import { BaseService } from './base-service';

// ================== INTERFACES ==================

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

// ================== V1 DATA MAPPING SERVICE ==================

export class V1DatabaseMappingService extends BaseService {
  
  /**
   * Maps V1 CustomerData to database format with dual intake support
   * CRITICAL: Preserves all 26 fields exactly with zero data loss
   */
  static async saveCustomerSurvey(
    customerData: Partial<CustomerData>,
    sessionId: string,
    userId?: string
  ): Promise<{ success: boolean; surveyId?: string; validation: ValidationResult }> {
    
    try {
      const normalizedData = applyCustomerDefaults(customerData);
      const validation = validateCustomerData(normalizedData);
      
      if (!validation.isValid) {
        return { success: false, validation };
      }
      
      const intakeFormats = this.detectIntakeFormats(normalizedData);
      const intakeConversions = this.convertIntakeValues(normalizedData, intakeFormats);
      const derivedFields = this.extractDerivedFields(normalizedData);
      const detectedUseCase = this.detectUseCase(normalizedData);
      
      const supabase = this.getSupabaseClient();
      
      const surveyData: CustomerSurveyInsert = {
        user_id: userId || null,
        session_id: sessionId,
        customer_data: normalizedData as any,
        intake_formats: intakeFormats as any,
        ...derivedFields,
        detected_use_case: detectedUseCase,
        status: 'completed',
        completion_percentage: 100,
        source: 'web',
      };
      
      const { data: survey, error: surveyError } = await supabase
        .from('customer_surveys')
        .insert(surveyData)
        .select()
        .single();
      
      if (surveyError) {
        return {
          success: false,
          validation: { isValid: false, errors: [`Database mapping failed: ${surveyError.message}`], warnings: [] },
        };
      }
      
      // Create intake conversion records for audit trail (best effort)
      if (intakeConversions.length > 0) {
        const conversionData: IntakeConversionInsert[] = intakeConversions.map(conversion => ({
          customer_survey_id: survey.id,
          electrolyte: conversion.electrolyte,
          original_value: conversion.originalValue,
          original_format: conversion.originalFormat,
          converted_mg: conversion.convertedMg,
          conversion_source: conversion.conversionSource,
        }));
        
        await supabase.from('intake_conversions').insert(conversionData);
      }
      
      this.handleDatabaseSuccess('save customer survey', { 
        surveyId: survey.id, sessionId: this.maskSessionId(sessionId) 
      });
      
      return { success: true, surveyId: survey.id, validation };
      
    } catch (error) {
      return {
        success: false,
        validation: { isValid: false, errors: [`Database mapping failed: ${error instanceof Error ? error.message : String(error)}`], warnings: [] },
      };
    }
  }
  
  /**
   * Saves V1 FormulationResult to database with metadata preservation
   */
  static async saveFormulationResult(
    surveyId: string,
    formulationResult: FormulationResult,
    options?: { priceCents?: number; formulaName?: string; }
  ): Promise<{ success: boolean; resultId?: string }> {
    
    try {
      const supabase = this.getSupabaseClient();
      
      const resultData: FormulationResultInsert = {
        customer_survey_id: surveyId,
        formulation_result: formulationResult as any,
        use_case: formulationResult.useCase,
        formula_version: formulationResult.metadata.formulaVersion,
        serving_size: formulationResult.metadata.servingSize,
        sodium_mg: formulationResult.formulationPerServing.sodium,
        potassium_mg: formulationResult.formulationPerServing.potassium,
        magnesium_mg: formulationResult.formulationPerServing.magnesium,
        calcium_mg: formulationResult.formulationPerServing.calcium,
        price_cents: options?.priceCents || null,
        formula_name: options?.formulaName || null,
      };
      
      const { data: result, error } = await supabase
        .from('formulation_results')
        .insert(resultData)
        .select()
        .single();
      
      if (error) {
        return { success: false };
      }
      
      this.handleDatabaseSuccess('save formulation result', { resultId: result.id, surveyId });
      return { success: true, resultId: result.id };
      
    } catch (error) {
      return { success: false };
    }
  }
  
  /**
   * Retrieves complete CustomerData from database
   */
  static async getCustomerSurvey(surveyId: string): Promise<CustomerData | null> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data: survey, error } = await supabase
        .from('customer_surveys')
        .select('*')
        .eq('id', surveyId)
        .single();
      
      if (error || !survey) {
        console.error('Customer Survey Retrieval Error:', error);
        return null;
      }
      
      return survey.customer_data as unknown as CustomerData;
      
    } catch (error) {
      console.error('Customer Survey Retrieval Error:', error);
      return null;
    }
  }
  
  /**
   * Retrieves FormulationResult with complete metadata
   */
  static async getFormulationResult(resultId: string): Promise<FormulationResult | null> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data: result, error } = await supabase
        .from('formulation_results')
        .select('*')
        .eq('id', resultId)
        .single();
      
      if (error || !result) {
        console.error('Formulation Result Retrieval Error:', error);
        return null;
      }
      
      return result.formulation_result as unknown as FormulationResult;
      
    } catch (error) {
      console.error('Formulation Result Retrieval Error:', error);
      return null;
    }
  }
  
  // ================== PRIVATE HELPER METHODS ==================
  
  private static detectIntakeFormats(customerData: CustomerData): IntakeFormatMap {
    const formats: IntakeFormatMap = { sodium: 'legacy', potassium: 'legacy', magnesium: 'legacy', calcium: 'legacy' };
    
    INTAKE_FIELDS.forEach(field => {
      const value = customerData[field as keyof CustomerData] as string;
      if (value) {
        const electrolyte = field.replace('-intake', '') as keyof IntakeFormatMap;
        formats[electrolyte] = detectFormat(value);
      }
    });
    
    return formats;
  }
  
  private static convertIntakeValues(customerData: CustomerData, formats: IntakeFormatMap): IntakeConversionRecord[] {
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
        
        conversions.push({ electrolyte, originalValue: value, originalFormat: format, convertedMg, conversionSource });
      }
    });
    
    return conversions;
  }
  
  private static extractDerivedFields(customerData: CustomerData) {
    return {
      age: customerData.age,
      biological_sex: customerData['biological-sex'],
      weight: customerData.weight,
      activity_level: customerData['activity-level'],
      sweat_level: customerData['sweat-level'],
    };
  }
  
  private static detectUseCase(customerData: CustomerData): string {
    // V1 Use Case Detection Logic (PRESERVE EXACT ORDER)
    if (customerData['sleep-issues']?.length && customerData['sleep-issues'][0] !== 'none') {
      return 'bedtime';
    }
    if (customerData['menstrual-symptoms']?.length && customerData['menstrual-symptoms'][0] !== 'none') {
      return 'menstrual';
    }
    if ((customerData['sweat-level'] === 'heavy' || customerData['sweat-level'] === 'excessive') &&
        (customerData['workout-frequency'] === 'daily' || customerData['workout-frequency'] === '4-6-per-week')) {
      return 'sweat';
    }
    return 'daily';
  }
}

// Export utilities separately to avoid circular dependencies
export { validateV1FieldPreservation, convertLegacyIntakeToMg, getIntakeAnalysis } from './v1-database-mapping-utils';

// Export singleton instance (maintain backward compatibility)
export const v1DatabaseMapping = {
  saveCustomerSurvey: V1DatabaseMappingService.saveCustomerSurvey,
  saveFormulationResult: V1DatabaseMappingService.saveFormulationResult,
  getCustomerSurvey: V1DatabaseMappingService.getCustomerSurvey,
  getFormulationResult: V1DatabaseMappingService.getFormulationResult,
}; 
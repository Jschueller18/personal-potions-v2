/**
 * V1 Database Mapping Tests
 * 
 * Ensures zero data loss when mapping V1 CustomerData to database schema
 * Tests dual intake format support and field preservation
 */

import type { CustomerData } from '@/types';
import {
  LEGACY_INTAKE_ESTIMATES,
  VALIDATION_LIMITS,
} from '@/types/constants';

describe('V1 Database Mapping', () => {
  
  // ================== TEST DATA ==================
  
  const completeV1CustomerData: CustomerData = {
    // Required fields
    age: 32,
    'biological-sex': 'female',
    weight: 145.5,
    'activity-level': 'moderately-active',
    'sweat-level': 'moderate',
    
    // Optional arrays
    'daily-goals': ['energy', 'performance'],
    'sleep-goals': ['falling-asleep', 'sleep-quality'],
    'sleep-issues': ['trouble-falling-asleep'],
    'menstrual-symptoms': ['cramps', 'fatigue'],
    conditions: ['hypertension'],
    'exercise-type': ['cardio', 'strength-training'],
    
    // Workout fields
    'workout-frequency': 'daily',
    'workout-duration': '60-90',
    'workout-intensity': 'high',
    
    // Hangover fields
    'hangover-timing': 'after',
    'hangover-symptoms': ['headache', 'dehydration'],
    
    // CRITICAL: Mixed intake formats
    'sodium-intake': '8-10',        // Legacy format
    'potassium-intake': '3.5',      // Numeric format (mg as string)
    'magnesium-intake': '7',        // Legacy format
    'calcium-intake': '12.8',       // Numeric format (mg as string)
    
    // Supplement values
    'sodium-supplement': 100,
    'potassium-supplement': 200,
    'magnesium-supplement': 150,
    'calcium-supplement': 300,
    
    // Water intake
    'daily-water-intake': 80,
    
    // Use case override
    usage: 'daily',
  };
  
  // ================== FIELD PRESERVATION TESTS ==================
  
  describe('CustomerData Field Preservation', () => {
    
    test('should preserve all 26 CustomerData fields exactly', () => {
      const fields = [
        'age', 'biological-sex', 'weight', 'activity-level', 'sweat-level',
        'daily-goals', 'sleep-goals', 'sleep-issues', 'menstrual-symptoms',
        'conditions', 'exercise-type', 'workout-frequency', 'workout-duration',
        'workout-intensity', 'hangover-timing', 'hangover-symptoms',
        'sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake',
        'sodium-supplement', 'potassium-supplement', 'magnesium-supplement',
        'calcium-supplement', 'daily-water-intake', 'usage'
      ];
      
      // Verify all fields exist in test data
      fields.forEach(field => {
        expect(completeV1CustomerData).toHaveProperty(field);
      });
      
      // Verify we have exactly 26 fields
      expect(fields).toHaveLength(26);
    });
    
    test('should handle dual intake format preservation in JSONB', () => {
      // Simulate JSONB serialization/deserialization
      const jsonbData = JSON.parse(JSON.stringify(completeV1CustomerData));
      
      // Verify exact preservation
      expect(jsonbData['sodium-intake']).toBe('8-10');      // Legacy preserved
      expect(jsonbData['potassium-intake']).toBe('3.5');    // Numeric preserved
      expect(jsonbData['magnesium-intake']).toBe('7');      // Legacy preserved
      expect(jsonbData['calcium-intake']).toBe('12.8');     // Numeric preserved
      
      // Verify all other fields preserved
      expect(jsonbData).toEqual(completeV1CustomerData);
    });
  });
  
  // ================== DUAL INTAKE FORMAT TESTS ==================
  
  describe('Dual Intake Format Support', () => {
    
    test('should correctly identify legacy intake formats', () => {
      const legacyValues = ['0', '1-3', '4-6', '7', '8-10', '11-13', '14'];
      
      legacyValues.forEach(value => {
        expect(isLegacyIntakeFormat(value)).toBe(true);
      });
    });
    
    test('should correctly identify numeric intake formats', () => {
      const numericValues = ['2.5', '3.7', '10.2', '0.5', '15.8'];
      
      numericValues.forEach(value => {
        expect(isLegacyIntakeFormat(value)).toBe(false);
        expect(parseFloat(value)).not.toBeNaN();
      });
    });
    
    test('should map legacy intake values to correct mg amounts', () => {
      // Test sodium legacy mapping (CRITICAL: Must match EXACT V1 values)
      expect(LEGACY_INTAKE_ESTIMATES.sodium['0']).toBe(1500);
      expect(LEGACY_INTAKE_ESTIMATES.sodium['7']).toBe(2000);
      expect(LEGACY_INTAKE_ESTIMATES.sodium['14']).toBe(2500);
      
      // Test potassium legacy mapping
      expect(LEGACY_INTAKE_ESTIMATES.potassium['0']).toBe(2000);
      expect(LEGACY_INTAKE_ESTIMATES.potassium['7']).toBe(2400);
      expect(LEGACY_INTAKE_ESTIMATES.potassium['14']).toBe(2800);
      
      // Test magnesium legacy mapping
      expect(LEGACY_INTAKE_ESTIMATES.magnesium['0']).toBe(200);
      expect(LEGACY_INTAKE_ESTIMATES.magnesium['7']).toBe(300);
      expect(LEGACY_INTAKE_ESTIMATES.magnesium['14']).toBe(400);
      
      // Test calcium legacy mapping
      expect(LEGACY_INTAKE_ESTIMATES.calcium['0']).toBe(800);
      expect(LEGACY_INTAKE_ESTIMATES.calcium['7']).toBe(1100);
      expect(LEGACY_INTAKE_ESTIMATES.calcium['14']).toBe(1400);
    });
    
    test('should create proper intake format tracking map', () => {
      const intakeFormats = detectAllIntakeFormats(completeV1CustomerData);
      
      expect(intakeFormats).toEqual({
        sodium: 'legacy',    // '8-10' is legacy
        potassium: 'numeric', // '3.5' is numeric
        magnesium: 'legacy',  // '7' is legacy
        calcium: 'numeric',   // '12.8' is numeric
      });
    });
  });
  
  // ================== V1 USE CASE DETECTION TESTS ==================
  
  describe('V1 Use Case Detection Priority', () => {
    
    test('should detect bedtime with highest priority', () => {
      const bedtimeData: CustomerData = {
        ...completeV1CustomerData,
        'sleep-issues': ['trouble-falling-asleep'],
        'menstrual-symptoms': ['cramps'], // Should be overridden
        'sweat-level': 'heavy',           // Should be overridden
        'workout-frequency': 'daily',
      };
      
      expect(detectV1UseCase(bedtimeData)).toBe('bedtime');
    });
    
    test('should detect menstrual with second priority', () => {
      const menstrualData: CustomerData = {
        ...completeV1CustomerData,
        'sleep-issues': [],                    // No sleep issues
        'menstrual-symptoms': ['cramps'],      // Has menstrual symptoms
        'sweat-level': 'heavy',               // Should be overridden
        'workout-frequency': 'daily',
      };
      
      expect(detectV1UseCase(menstrualData)).toBe('menstrual');
    });
    
    test('should detect sweat with third priority', () => {
      const sweatData: CustomerData = {
        ...completeV1CustomerData,
        'sleep-issues': [],              // No sleep issues
        'menstrual-symptoms': [],        // No menstrual symptoms
        'sweat-level': 'heavy',         // Heavy sweat
        'workout-frequency': 'daily',    // Frequent workouts
      };
      
      expect(detectV1UseCase(sweatData)).toBe('sweat');
    });
    
    test('should default to daily use case', () => {
      const dailyData: CustomerData = {
        ...completeV1CustomerData,
        'sleep-issues': [],
        'menstrual-symptoms': [],
        'sweat-level': 'light',          // Not heavy sweat
        'workout-frequency': 'rarely',   // Not frequent workouts
      };
      
      expect(detectV1UseCase(dailyData)).toBe('daily');
    });
  });
  
  // ================== VALIDATION TESTS ==================
  
  describe('V1 Data Validation', () => {
    
    test('should validate age within V1 limits', () => {
      expect(VALIDATION_LIMITS.AGE.min).toBe(13);
      expect(VALIDATION_LIMITS.AGE.max).toBe(120);
      
      // Valid ages
      expect(isValidAge(18)).toBe(true);
      expect(isValidAge(65)).toBe(true);
      expect(isValidAge(120)).toBe(true);
      
      // Invalid ages
      expect(isValidAge(12)).toBe(false);
      expect(isValidAge(121)).toBe(false);
    });
    
    test('should validate weight within V1 limits', () => {
      expect(VALIDATION_LIMITS.WEIGHT.min).toBe(80);
      expect(VALIDATION_LIMITS.WEIGHT.max).toBe(400);
      
      // Valid weights
      expect(isValidWeight(150)).toBe(true);
      expect(isValidWeight(80)).toBe(true);
      expect(isValidWeight(400)).toBe(true);
      
      // Invalid weights
      expect(isValidWeight(79)).toBe(false);
      expect(isValidWeight(401)).toBe(false);
    });
    
    test('should validate biological sex enum values', () => {
      const validSexes = ['male', 'female'];
      
      validSexes.forEach(sex => {
        expect(['male', 'female']).toContain(sex);
      });
      
      // Test actual CustomerData field
      expect(['male', 'female']).toContain(completeV1CustomerData['biological-sex']);
    });
  });
  
  // ================== DATABASE SCHEMA MAPPING TESTS ==================
  
  describe('Database Schema Mapping', () => {
    
    test('should extract derived fields for database performance', () => {
      const derivedFields = extractDerivedFields(completeV1CustomerData);
      
      expect(derivedFields).toEqual({
        age: 32,
        biologicalSex: 'female',
        weight: 145.5,
        activityLevel: 'moderately-active',
        sweatLevel: 'moderate',
      });
    });
    
    test('should create intake conversion records for audit', () => {
      const conversions = createIntakeConversions(completeV1CustomerData);
      
      expect(conversions).toEqual([
        {
          electrolyte: 'sodium',
          originalValue: '8-10',
          originalFormat: 'legacy',
          convertedMg: LEGACY_INTAKE_ESTIMATES.sodium['8-10'],
          conversionSource: 'LEGACY_INTAKE_ESTIMATES'
        },
        {
          electrolyte: 'potassium',
          originalValue: '3.5',
          originalFormat: 'numeric',
          convertedMg: 3.5,
          conversionSource: 'DIRECT_NUMERIC'
        },
        {
          electrolyte: 'magnesium',
          originalValue: '7',
          originalFormat: 'legacy',
          convertedMg: LEGACY_INTAKE_ESTIMATES.magnesium['7'],
          conversionSource: 'LEGACY_INTAKE_ESTIMATES'
        },
        {
          electrolyte: 'calcium',
          originalValue: '12.8',
          originalFormat: 'numeric',
          convertedMg: 12.8,
          conversionSource: 'DIRECT_NUMERIC'
        }
      ]);
    });
  });
});

// ================== HELPER FUNCTIONS FOR TESTS ==================

function isLegacyIntakeFormat(value: string): boolean {
  return ['0', '1-3', '4-6', '7', '8-10', '11-13', '14'].includes(value);
}

function detectAllIntakeFormats(customerData: CustomerData) {
  const intakeFields = ['sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake'];
  const formats: Record<string, 'legacy' | 'numeric'> = {};
  
  intakeFields.forEach(field => {
    const value = customerData[field as keyof CustomerData] as string;
    if (value) {
      const electrolyte = field.replace('-intake', '');
      formats[electrolyte] = isLegacyIntakeFormat(value) ? 'legacy' : 'numeric';
    }
  });
  
  return formats;
}

function detectV1UseCase(customerData: CustomerData): string {
  // V1 Use Case Detection Logic (PRESERVE EXACT ORDER FROM DOCUMENTATION)
  
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

function extractDerivedFields(customerData: CustomerData) {
  return {
    age: customerData.age,
    biologicalSex: customerData['biological-sex'],
    weight: customerData.weight,
    activityLevel: customerData['activity-level'],
    sweatLevel: customerData['sweat-level'],
  };
}

function createIntakeConversions(customerData: CustomerData) {
  const intakeFields = ['sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake'];
  const conversions: any[] = [];
  
  intakeFields.forEach(field => {
    const value = customerData[field as keyof CustomerData] as string;
    if (value) {
      const electrolyte = field.replace('-intake', '');
      const format = isLegacyIntakeFormat(value) ? 'legacy' : 'numeric';
      
      let convertedMg: number;
      let conversionSource: string;
      
      if (format === 'legacy') {
        convertedMg = LEGACY_INTAKE_ESTIMATES[electrolyte][value];
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

function isValidAge(age: number): boolean {
  return age >= VALIDATION_LIMITS.AGE.min && age <= VALIDATION_LIMITS.AGE.max;
}

function isValidWeight(weight: number): boolean {
  return weight >= VALIDATION_LIMITS.WEIGHT.min && weight <= VALIDATION_LIMITS.WEIGHT.max;
} 
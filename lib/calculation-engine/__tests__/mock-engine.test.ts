/**
 * Mock Calculation Engine Tests
 * 
 * Verifies that the mock engine provides realistic responses
 * based on survey inputs for development use
 */

process.env.NODE_ENV = 'test';

import { MockPersonalPotionsEngine } from '../mock/PersonalPotionsEngine';
import { createCalculationEngine } from '../factory';
import type { CustomerData } from '@/types';

describe('Mock Calculation Engine', () => {
  
  const mockCustomerData: CustomerData = {
    age: 32,
    'biological-sex': 'female',
    weight: 145,
    'activity-level': 'moderately-active',
    'sweat-level': 'moderate',
    'sodium-intake': '7',
    'potassium-intake': '3.5',
    'magnesium-intake': '8-10',
    'calcium-intake': '2.1',
    usage: 'daily'
  };

  describe('MockPersonalPotionsEngine', () => {
    
    it('should calculate formulation based on survey inputs', async () => {
      const engine = new MockPersonalPotionsEngine();
      const result = await engine.calculate(mockCustomerData);
      
      expect(result.formulationPerServing).toBeDefined();
      expect(result.formulationPerServing.sodium).toBeGreaterThan(0);
      expect(result.formulationPerServing.potassium).toBeGreaterThan(0);
      expect(result.formulationPerServing.magnesium).toBeGreaterThan(0);
      expect(result.formulationPerServing.calcium).toBeGreaterThan(0);
      
      expect(result.useCase).toBe('daily');
      expect(result.metadata.formulaVersion).toBe('1.4-mock');
      expect(result.metadata.customerAge).toBe(32);
      expect(result.metadata.customerWeight).toBe(145);
    });

    it('should detect bedtime use case from sleep issues', async () => {
      const sleepData: CustomerData = {
        ...mockCustomerData,
        'sleep-issues': ['trouble-falling-asleep']
      };
      
      const engine = new MockPersonalPotionsEngine();
      const result = await engine.calculate(sleepData);
      
      expect(result.useCase).toBe('bedtime');
      expect(result.metadata.recommendations).toContain('Take 30-60 minutes before bed');
    });

    it('should detect menstrual use case from symptoms', async () => {
      const menstrualData: CustomerData = {
        ...mockCustomerData,
        'menstrual-symptoms': ['cramps', 'fatigue']
      };
      
      const engine = new MockPersonalPotionsEngine();
      const result = await engine.calculate(menstrualData);
      
      expect(result.useCase).toBe('menstrual');
    });

    it('should adjust formulation based on activity level', async () => {
      const sedentaryData: CustomerData = {
        ...mockCustomerData,
        'activity-level': 'sedentary'
      };
      
      const activeData: CustomerData = {
        ...mockCustomerData,
        'activity-level': 'extremely-active'
      };
      
      const engine = new MockPersonalPotionsEngine();
      const sedentaryResult = await engine.calculate(sedentaryData);
      const activeResult = await engine.calculate(activeData);
      
      // Active should have higher amounts
      expect(activeResult.formulationPerServing.sodium).toBeGreaterThan(
        sedentaryResult.formulationPerServing.sodium
      );
      expect(activeResult.metadata.recommendedServingsPerDay).toBeGreaterThanOrEqual(
        sedentaryResult.metadata.recommendedServingsPerDay
      );
    });
  });

  describe('Factory Pattern', () => {
    
    it('should return mock engine in test environment', () => {
      const engine = createCalculationEngine();
      expect(engine).toBeInstanceOf(MockPersonalPotionsEngine);
    });
    
    it('should provide consistent interface', async () => {
      const engine = createCalculationEngine();
      const result = await engine.calculate(mockCustomerData);
      
      expect(result).toHaveProperty('formulationPerServing');
      expect(result).toHaveProperty('useCase');
      expect(result).toHaveProperty('metadata');
    });
  });
}); 
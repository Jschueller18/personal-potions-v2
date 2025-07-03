/**
 * Calculation Engine Factory
 * 
 * Simple factory to switch between real and mock implementations
 * based on environment configuration
 */

import type { CustomerData, FormulationResult } from '@/types';

// Interface for calculation engine (matches Reference-Docs/reference spec)
export interface CalculationEngine {
  calculate(surveyData: CustomerData): Promise<FormulationResult>;
}

/**
 * Create appropriate calculation engine based on environment
 * 
 * Uses mock engine in development/test environments
 * Will use real engine in production when implemented
 */
export function createCalculationEngine(): CalculationEngine {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Use mock engine for development and testing
  if (isDevelopment || isTest) {
    const { MockPersonalPotionsEngine } = require('./mock/PersonalPotionsEngine');
    return new MockPersonalPotionsEngine();
  }
  
  // TODO: Use real engine in production when implemented
  // const { PersonalPotionsEngine } = require('./core/PersonalPotionsEngine');
  // return new PersonalPotionsEngine();
  
  // Fallback to mock for now (remove when real engine is implemented)
  const { MockPersonalPotionsEngine } = require('./mock/PersonalPotionsEngine');
  return new MockPersonalPotionsEngine();
} 
/**
 * Mock Personal Potions Calculation Engine
 * 
 * Development-time mock that provides realistic responses based on survey inputs
 * Extracted from existing API route mock logic and enhanced for better testing
 * Used only in development/test environments - never in production
 */

import type { CustomerData, FormulationResult, ElectrolyteAmounts, UseCase } from '@/types';
import { convertAllIntakesToMg } from '@/types';

// Constants to avoid magic numbers
const AGE_THRESHOLDS = {
  YOUTH: 18,
  SENIOR: 65,
} as const;

const MULTIPLIERS = {
  YOUTH_AGE: 0.8,
  SENIOR_AGE: 0.9,
  ADULT_AGE: 1.0,
  DEFICIT_RATE: 0.2,
} as const;

const ACTIVITY_MULTIPLIERS = {
  'sedentary': 0.9,
  'lightly-active': 1.0,
  'moderately-active': 1.1,
  'very-active': 1.2,
  'extremely-active': 1.3,
} as const;

// Base formulations from Reference-Docs/reference
const BASE_FORMULATIONS = {
  daily: { sodium: 150, potassium: 400, magnesium: 100, calcium: 200 },
  menstrual: { sodium: 250, potassium: 450, magnesium: 150, calcium: 250 },
  hangover: { sodium: 500, potassium: 400, magnesium: 150, calcium: 200 },
  sweat: { sodium: 300, potassium: 500, magnesium: 120, calcium: 240 },
  bedtime: { sodium: 50, potassium: 300, magnesium: 200, calcium: 400 },
} as const;

export class MockPersonalPotionsEngine {
  
  /**
   * Calculate personalized formulation with intelligent mock logic
   * Responds to actual survey inputs for realistic development experience
   */
  async calculate(surveyData: CustomerData): Promise<FormulationResult> {
    const convertedIntakes = convertAllIntakesToMg(surveyData);
    const useCase = this.determineUseCase(surveyData);
    const baseFormulation = this.generateBaseFormulation(useCase, surveyData);
    
    return {
      formulationPerServing: baseFormulation,
      useCase,
      metadata: {
        formulaVersion: '1.4-mock',
        servingSize: '16 fl oz (473ml)',
        recommendedServingsPerDay: this.calculateServingsPerDay(useCase, surveyData),
        optimalIntake: convertedIntakes,
        currentIntake: convertedIntakes,
        deficits: this.calculateMockDeficits(convertedIntakes),
        electrolyteForms: {
          sodium: 'sodium-chloride',
          potassium: 'potassium-citrate',
          magnesium: 'magnesium-glycinate',
          calcium: 'calcium-citrate',
        },
        notes: {
          primary: `Mock calculation for ${useCase} use case`,
          additional: [
            `Based on age: ${surveyData.age}`,
            `Activity level: ${surveyData['activity-level']}`,
            `Mock engine - replace with real calculation in production`
          ],
        },
        recommendations: this.generateRecommendations(useCase, surveyData),
        calculationTimestamp: new Date(),
        customerAge: surveyData.age,
        customerWeight: surveyData.weight,
        detectedUseCase: useCase,
      },
    };
  }

  /**
   * Determine primary use case based on survey data
   * Uses optional chaining for null safety
   */
  private determineUseCase(surveyData: CustomerData): UseCase {
    // Follow the priority from Reference-Docs/reference
    if (surveyData['sleep-issues']?.length > 0) {
      return 'bedtime';
    }
    if (surveyData['menstrual-symptoms']?.length > 0) {
      return 'menstrual';
    }
    if (surveyData['sweat-level'] === 'heavy' && surveyData['workout-frequency'] === 'daily') {
      return 'sweat';
    }
    if (surveyData['hangover-symptoms']?.length > 0) {
      return 'hangover';
    }
    // Ensure we return a valid UseCase type
    const validUseCases: UseCase[] = ['daily', 'sweat', 'bedtime', 'menstrual', 'hangover'];
    return validUseCases.includes(surveyData.usage as UseCase) ? (surveyData.usage as UseCase) : 'daily';
  }

  /**
   * Generate base formulation based on use case and customer data
   * Uses constants to avoid magic numbers
   */
  private generateBaseFormulation(useCase: UseCase, surveyData: CustomerData): ElectrolyteAmounts {
    const base = BASE_FORMULATIONS[useCase] || BASE_FORMULATIONS.daily;
    
    // Apply age-based adjustments using constants
    const ageMultiplier = surveyData.age < AGE_THRESHOLDS.YOUTH 
      ? MULTIPLIERS.YOUTH_AGE 
      : surveyData.age > AGE_THRESHOLDS.SENIOR 
        ? MULTIPLIERS.SENIOR_AGE 
        : MULTIPLIERS.ADULT_AGE;
    
    // Apply activity level adjustments with type safety
    const activityLevel = surveyData['activity-level'];
    const activityMultiplier = this.getActivityMultiplier(activityLevel);

    return {
      sodium: Math.round(base.sodium * ageMultiplier * activityMultiplier),
      potassium: Math.round(base.potassium * ageMultiplier * activityMultiplier),
      magnesium: Math.round(base.magnesium * ageMultiplier * activityMultiplier),
      calcium: Math.round(base.calcium * ageMultiplier * activityMultiplier),
    };
  }

  /**
   * Get activity multiplier with type safety
   */
  private getActivityMultiplier(activityLevel: string): number {
    const validLevels = Object.keys(ACTIVITY_MULTIPLIERS);
    return validLevels.includes(activityLevel)
      ? ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS]
      : MULTIPLIERS.ADULT_AGE;
  }

  /**
   * Calculate recommended servings per day based on use case
   */
  private calculateServingsPerDay(useCase: UseCase, surveyData: CustomerData): number {
    if (useCase === 'hangover') return 2;
    if (useCase === 'sweat' && surveyData['workout-frequency'] === 'daily') return 2;
    if (surveyData['activity-level'] === 'extremely-active') return 2;
    return 1;
  }

  /**
   * Calculate mock deficits for metadata
   * Uses constant for deficit rate
   */
  private calculateMockDeficits(currentIntake: ElectrolyteAmounts): ElectrolyteAmounts {
    return {
      sodium: Math.round(currentIntake.sodium * MULTIPLIERS.DEFICIT_RATE),
      potassium: Math.round(currentIntake.potassium * MULTIPLIERS.DEFICIT_RATE),
      magnesium: Math.round(currentIntake.magnesium * MULTIPLIERS.DEFICIT_RATE),
      calcium: Math.round(currentIntake.calcium * MULTIPLIERS.DEFICIT_RATE),
    };
  }

  /**
   * Generate contextual recommendations
   */
  private generateRecommendations(useCase: UseCase, surveyData: CustomerData): string[] {
    const recommendations = [`Formulated for ${useCase} use case`];
    
    if (surveyData['activity-level'] === 'extremely-active') {
      recommendations.push('Consider splitting dose pre/post workout');
    }
    if (useCase === 'bedtime') {
      recommendations.push('Take 30-60 minutes before bed');
    }
    if (useCase === 'hangover') {
      recommendations.push('Consume immediately upon waking');
    }
    if (surveyData.conditions?.includes('hypertension')) {
      recommendations.push('Reduced sodium formulation for blood pressure');
    }
    
    return recommendations;
  }
} 
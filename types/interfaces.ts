/**
 * Personal Potions V1 Core Interfaces
 * 
 * Main data structures for customer input and formulation output
 */

import type {
  BiologicalSex,
  ActivityLevel,
  SweatLevel,
  WorkoutDuration,
  WorkoutIntensity,
  WorkoutFrequency,
  UseCase,
  DailyGoal,
  SleepGoal,
  SleepIssue,
  MenstrualSymptom,
  HealthCondition,
  ExerciseType,
  HangoverTiming,
  HangoverSymptom,
  IntakeLevel,
  ElectrolyteForm
} from './enums';

// Re-export IntakeLevel for other modules
export type { IntakeLevel };

/**
 * Customer input data structure - matches V1 exactly
 */
export interface CustomerData {
  // Required fields with fallbacks
  age: number; // Default: 30
  'biological-sex': BiologicalSex; // Default: 'male'
  weight: number; // in lbs, Default: 70
  'activity-level': ActivityLevel; // Default: 'moderately-active'
  'sweat-level': SweatLevel; // Default: 'moderate'
  
  // Optional arrays
  'daily-goals'?: DailyGoal[];
  'sleep-goals'?: SleepGoal[];
  'sleep-issues'?: SleepIssue[];
  'menstrual-symptoms'?: MenstrualSymptom[];
  conditions?: HealthCondition[];
  'exercise-type'?: ExerciseType[];
  
  // Workout-specific fields
  'workout-frequency'?: WorkoutFrequency;
  'workout-duration'?: WorkoutDuration;
  'workout-intensity'?: WorkoutIntensity;
  
  // Hangover-specific fields
  'hangover-timing'?: HangoverTiming;
  'hangover-symptoms'?: HangoverSymptom[];
  
  // Intake values - support both formats
  'sodium-intake'?: IntakeLevel | string;
  'potassium-intake'?: IntakeLevel | string;
  'magnesium-intake'?: IntakeLevel | string;
  'calcium-intake'?: IntakeLevel | string;
  
  // Supplement values (mg)
  'sodium-supplement'?: number; // Default: 0
  'potassium-supplement'?: number; // Default: 0
  'magnesium-supplement'?: number; // Default: 0
  'calcium-supplement'?: number; // Default: 0
  
  // Water intake (fl oz)
  'daily-water-intake'?: number; // Default: 64
  
  // Override use case
  usage?: UseCase;
}

/**
 * Electrolyte amounts structure (mg)
 */
export interface ElectrolyteAmounts {
  sodium: number;
  potassium: number;
  magnesium: number;
  calcium: number;
}

/**
 * Electrolyte forms mapping
 */
export interface ElectrolyteForms {
  sodium: ElectrolyteForm;
  potassium: ElectrolyteForm;
  magnesium: ElectrolyteForm;
  calcium: ElectrolyteForm;
}

/**
 * Calculation metadata
 */
export interface CalculationMetadata {
  formulaVersion: string; // "1.4"
  servingSize: string; // "16 fl oz (473ml)"
  recommendedServingsPerDay: number;
  optimalIntake: ElectrolyteAmounts;
  currentIntake: ElectrolyteAmounts;
  deficits: ElectrolyteAmounts;
  electrolyteForms: ElectrolyteForms;
  notes: {
    primary: string;
    additional: string[];
  };
  recommendations: string[];
  calculationTimestamp?: Date;
  customerAge?: number;
  customerWeight?: number;
  detectedUseCase?: UseCase;
  appliedMultipliers?: Record<string, number>;
  safetyLimitsApplied?: boolean;
  ratioOptimization?: {
    calciumMagnesiumRatio: number;
    targetRatio: number;
    ratioAdjustment: string;
  };
}

/**
 * Complete formulation result - matches V1 output exactly
 */
export interface FormulationResult {
  formulationPerServing: ElectrolyteAmounts;
  useCase: UseCase;
  metadata: CalculationMetadata;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ================== MULTIPLIER & RATIO INTERFACES ==================

/**
 * Optimal electrolyte ratios by use case
 */
export interface ElectrolyteRatios {
  min: number;
  target: number;
  max: number;
}

export interface UseCaseRatios {
  daily: ElectrolyteRatios;
  sweat: ElectrolyteRatios;
  bedtime: ElectrolyteRatios;
  menstrual: ElectrolyteRatios;
  hangover: ElectrolyteRatios;
}

/**
 * Activity multipliers by electrolyte
 */
export interface ActivityMultipliers {
  sodium: number;
  potassium: number;
  magnesium: number;
  calcium: number;
}

/**
 * Complete activity multiplier mapping
 */
export interface ActivityMultiplierMap {
  sedentary: ActivityMultipliers;
  'lightly-active': ActivityMultipliers;
  'moderately-active': ActivityMultipliers;
  'very-active': ActivityMultipliers;
  'extremely-active': ActivityMultipliers;
}

/**
 * Sweat level addition amounts (mg)
 */
export interface SweatAdditions {
  minimal: number;
  light: number;
  moderate: number;
  heavy: number;
  excessive: number;
}

/**
 * Goal-specific multipliers
 */
export interface GoalMultipliers {
  energy: Partial<ElectrolyteAmounts>;
  'mental-clarity': Partial<ElectrolyteAmounts>;
  'muscle-function': Partial<ElectrolyteAmounts>;
  recovery: Partial<ElectrolyteAmounts>;
  hydration: Partial<ElectrolyteAmounts>;
  performance: Partial<ElectrolyteAmounts>;
}

/**
 * Sleep goal multipliers
 */
export interface SleepGoalMultipliers {
  'falling-asleep': Partial<ElectrolyteAmounts>;
  'staying-asleep': Partial<ElectrolyteAmounts>;
  'sleep-quality': Partial<ElectrolyteAmounts>;
  'muscle-relaxation': Partial<ElectrolyteAmounts>;
  'reduce-cramping': Partial<ElectrolyteAmounts>;
  recovery: Partial<ElectrolyteAmounts>;
}

/**
 * Hangover timing multipliers
 */
export interface HangoverTimingMultipliers {
  before: Partial<ElectrolyteAmounts>;
  during: Partial<ElectrolyteAmounts>;
  after: Partial<ElectrolyteAmounts>;
}

/**
 * Hangover symptom multipliers
 */
export interface HangoverSymptomMultipliers {
  headache: Partial<ElectrolyteAmounts>;
  nausea: Partial<ElectrolyteAmounts>;
  dehydration: Partial<ElectrolyteAmounts>;
  fatigue: Partial<ElectrolyteAmounts>;
}

/**
 * Safety limits by use case
 */
export interface SafetyLimits {
  sodium: { min: number; max: number };
  potassium: { min: number; max: number };
  magnesium: { min: number; max: number };
  calcium: { min: number; max: number };
}

export interface SafetyLimitMap {
  daily: SafetyLimits;
  sweat: SafetyLimits;
  bedtime: SafetyLimits;
  menstrual: SafetyLimits;
  hangover: SafetyLimits;
}

/**
 * Health condition multipliers
 */
export interface HealthConditionMultipliers {
  hypertension: Partial<ElectrolyteAmounts>;
  'kidney-disease': Partial<ElectrolyteAmounts>;
  'heart-disease': Partial<ElectrolyteAmounts>;
  diabetes: Partial<ElectrolyteAmounts>;
  osteoporosis: Partial<ElectrolyteAmounts>;
}

/**
 * Legacy multiple choice intake estimates (mg)
 */
export interface LegacyIntakeEstimates {
  sodium: Record<IntakeLevel, number>;
  potassium: Record<IntakeLevel, number>;
  magnesium: Record<IntakeLevel, number>;
  calcium: Record<IntakeLevel, number>;
} 
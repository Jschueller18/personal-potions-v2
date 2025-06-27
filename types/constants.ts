/**
 * Personal Potions V1 Calculation Framework Constants
 * 
 * ⚠️ CRITICAL: These constants match the V1 calculation framework exactly.
 * DO NOT modify these values without updating the corresponding calculation logic.
 * All values are research-backed and must be preserved.
 */

import type {
  ActivityMultiplierMap,
  SweatAdditions,
  UseCaseRatios,
  GoalMultipliers,
  SleepGoalMultipliers,
  HangoverTimingMultipliers,
  HangoverSymptomMultipliers,
  SafetyLimitMap,
  HealthConditionMultipliers,
  LegacyIntakeEstimates,
} from './interfaces';

import type { IntakeLevel } from './enums';

// ================== CORE FRAMEWORK CONSTANTS ==================

export const FORMULA_VERSION = '1.4';
export const SERVING_SIZE = '16 fl oz (473ml)';
export const DEFAULT_WATER_INTAKE = 64; // fl oz

// ================== RESEARCH-BACKED BASE VALUES ==================

/**
 * Base electrolyte values - DO NOT MODIFY
 * Research citations preserved from V1 documentation
 */

// Sodium - O'Donnell, M., et al. (2014)
export const SODIUM_BASE = 2500; // mg
export const SODIUM_WEIGHT_MULTIPLIER = 7; // mg per kg body weight
export const SODIUM_OPTIMAL_RANGE = { min: 3000, max: 5000 }; // mg

// Potassium - FDA/Institute of Medicine (2019)
export const POTASSIUM_BASE = 4700; // mg

// Magnesium - Institute of Medicine (1997)
export const MAGNESIUM_RDA = {
  MALE_OVER_30: 420, // mg
  MALE_UNDER_30: 400, // mg
  FEMALE_OVER_30: 320, // mg
  FEMALE_UNDER_30: 310, // mg
};

export const MAGNESIUM_REFERENCE_WEIGHTS = {
  MALE: 70, // kg
  FEMALE: 57, // kg
};

// Calcium - National Institutes of Health (2022)
export const CALCIUM_RDA = {
  UNDER_19: 1300, // mg
  AGE_19_TO_50: 1000, // mg
  FEMALE_AGE_51_TO_70: 1200, // mg
  MALE_AGE_51_TO_70: 1000, // mg
  OVER_70: 1200, // mg
};

// ================== SERVING AMOUNTS ==================

export const SERVING_AMOUNTS = {
  SODIUM: 500, // mg per serving
  POTASSIUM: 400, // mg per serving
  MAGNESIUM: 100, // mg per serving
  CALCIUM: 300, // mg per serving
} as const;

// ================== AGE MULTIPLIERS ==================

export const POTASSIUM_AGE_MULTIPLIERS = {
  UNDER_18: 0.8,
  OVER_70: 0.9,
  NORMAL: 1.0,
} as const;

// ================== ACTIVITY MULTIPLIERS ==================

/**
 * Activity level multipliers by electrolyte - PRESERVE EXACT VALUES
 */
export const ACTIVITY_MULTIPLIERS: ActivityMultiplierMap = {
  sedentary: { sodium: 0.8, potassium: 0.9, magnesium: 0.9, calcium: 1.0 },
  'lightly-active': { sodium: 1.0, potassium: 0.95, magnesium: 0.95, calcium: 1.0 },
  'moderately-active': { sodium: 1.2, potassium: 1.0, magnesium: 1.0, calcium: 1.0 },
  'very-active': { sodium: 2.4, potassium: 1.2, magnesium: 1.1, calcium: 1.05 },
  'extremely-active': { sodium: 2.8, potassium: 1.3, magnesium: 1.15, calcium: 1.1 },
} as const;

// ================== SWEAT LEVEL ADDITIONS ==================

/**
 * Sweat level additions in mg - PRESERVE EXACT VALUES
 */
export const SWEAT_ADDITIONS: SweatAdditions = {
  minimal: 0,
  light: 300,
  moderate: 700,
  heavy: 1200,
  excessive: 1800,
} as const;

// ================== SWEAT MULTIPLIERS ==================

export const SWEAT_MULTIPLIERS = {
  minimal: 1.0,
  light: 1.2,
  moderate: 1.5,
  heavy: 2.0,
  excessive: 2.5,
} as const;

export const DURATION_MULTIPLIERS = {
  '30-60': 1.0,
  '60-90': 1.3,
  '90-120': 1.6,
  '120+': 2.0,
} as const;

export const INTENSITY_MULTIPLIERS = {
  low: 0.8,
  moderate: 1.0,
  high: 1.3,
  'very-high': 1.6,
} as const;

// ================== USE CASE RATIOS ==================

/**
 * Calcium:Magnesium ratios by use case - CRITICAL RATIOS
 */
export const USE_CASE_RATIOS: UseCaseRatios = {
  daily: { min: 1.8, target: 2.0, max: 2.2 },
  sweat: { min: 1.7, target: 2.0, max: 2.3 },
  bedtime: { min: 1.8, target: 2.0, max: 2.2 },
  menstrual: { min: 1.5, target: 1.8, max: 2.0 },
  hangover: { min: 0.3, target: 0.5, max: 0.8 },
} as const;

// ================== GOAL MULTIPLIERS ==================

/**
 * Daily goal multipliers - PRESERVE EXACT VALUES
 */
export const GOAL_MULTIPLIERS: GoalMultipliers = {
  energy: { 
    magnesium: 1.2,   // +20%
    sodium: 1.1,      // +10%
    potassium: 1.05   // +5%
  },
  'mental-clarity': { 
    magnesium: 1.25,  // +25%
    sodium: 0.8,      // -20%
    potassium: 1.1    // +10%
  },
  'muscle-function': { 
    potassium: 1.3,   // +30%
    magnesium: 1.15,  // +15%
    calcium: 1.1      // +10%
  },
  recovery: { 
    potassium: 1.25,  // +25%
    calcium: 1.15,    // +15%
    sodium: 1.1,      // +10%
    magnesium: 1.1    // +10%
  },
  hydration: { 
    sodium: 1.2,      // +20%
    potassium: 1.1    // +10%
  },
  performance: { 
    sodium: 1.15,     // +15%
    potassium: 1.2,   // +20%
    magnesium: 1.1    // +10%
  },
} as const;

// ================== SLEEP GOAL MULTIPLIERS ==================

/**
 * Sleep goal multipliers - PRESERVE EXACT VALUES
 */
export const SLEEP_GOAL_MULTIPLIERS: SleepGoalMultipliers = {
  'falling-asleep': { magnesium: 1.3, calcium: 1.2 },
  'staying-asleep': { magnesium: 1.2, calcium: 1.15 },
  'sleep-quality': { magnesium: 1.25, calcium: 1.1 },
  'muscle-relaxation': { magnesium: 1.4, calcium: 1.25 },
  'reduce-cramping': { magnesium: 1.35, calcium: 1.2 },
  recovery: { magnesium: 1.2, calcium: 1.15 },
} as const;

// ================== HANGOVER MULTIPLIERS ==================

/**
 * Hangover timing multipliers - PRESERVE EXACTLY
 */
export const HANGOVER_TIMING_MULTIPLIERS: HangoverTimingMultipliers = {
  before: { sodium: 1.0, potassium: 1.0, magnesium: 1.1 },
  during: { sodium: 1.3, potassium: 1.1, magnesium: 1.2 },
  after: { sodium: 1.8, potassium: 1.3, magnesium: 1.4 },
} as const;

/**
 * Hangover symptom multipliers
 */
export const HANGOVER_SYMPTOM_MULTIPLIERS: HangoverSymptomMultipliers = {
  headache: { sodium: 1.2, magnesium: 1.3 },
  nausea: { sodium: 1.1, potassium: 1.2 },
  dehydration: { sodium: 1.4, potassium: 1.2 },
  fatigue: { magnesium: 1.2, potassium: 1.1 },
} as const;

// ================== SAFETY LIMITS ==================

/**
 * Safety limits by use case - CRITICAL - DO NOT MODIFY
 */
export const SAFETY_LIMITS: SafetyLimitMap = {
  daily: {
    sodium: { min: 150, max: 800 },
    potassium: { min: 400, max: 600 },
    magnesium: { min: 80, max: 200 },
    calcium: { min: 200, max: 300 },
  },
  sweat: {
    sodium: { min: 200, max: 1000 },
    potassium: { min: 300, max: 700 },
    magnesium: { min: 80, max: 200 },
    calcium: { min: 200, max: 300 },
  },
  bedtime: {
    sodium: { min: 150, max: 800 },
    potassium: { min: 400, max: 600 },
    magnesium: { min: 80, max: 200 },
    calcium: { min: 200, max: 300 },
  },
  menstrual: {
    sodium: { min: 150, max: 800 },
    potassium: { min: 400, max: 600 },
    magnesium: { min: 80, max: 200 },
    calcium: { min: 200, max: 300 },
  },
  hangover: {
    sodium: { min: 200, max: 450 },
    potassium: { min: 350, max: 600 },
    magnesium: { min: 100, max: 400 },
    calcium: { min: 50, max: 150 },
  },
} as const;

// ================== HEALTH CONDITION MULTIPLIERS ==================

/**
 * Health condition restrictions - PRESERVE EXACT VALUES
 */
export const HEALTH_CONDITION_MULTIPLIERS: HealthConditionMultipliers = {
  hypertension: { 
    sodium: 0.7,      // -30%
    potassium: 1.1    // +10%
  },
  'kidney-disease': { 
    potassium: 0.7,   // -30%
    calcium: 1000     // max limit
  },
  'heart-disease': { 
    sodium: 0.8       // -20%
  },
  diabetes: { 
    magnesium: 1.1    // +10%
  },
  osteoporosis: { 
    calcium: 1.2,     // +20%
    magnesium: 1.1    // +10%
  },
} as const;

// ================== LEGACY INTAKE ESTIMATES ==================

/**
 * Legacy multiple choice intake estimates - PRESERVE EXACT VALUES
 */
export const LEGACY_INTAKE_ESTIMATES: LegacyIntakeEstimates = {
  sodium: {
    '0': 1500,
    '1-3': 1500 + (2 * 500 / 7),
    '4-6': 1500 + (5 * 500 / 7),
    '7': 1500 + (7 * 500 / 7),
    '8-10': 1500 + (9 * 500 / 7),
    '11-13': 1500 + (12 * 500 / 7),
    '14': 1500 + (14 * 500 / 7),
  },
  potassium: {
    '0': 2000,
    '1-3': 2000 + (2 * 400 / 7),
    '4-6': 2000 + (5 * 400 / 7),
    '7': 2000 + (7 * 400 / 7),
    '8-10': 2000 + (9 * 400 / 7),
    '11-13': 2000 + (12 * 400 / 7),
    '14': 2000 + (14 * 400 / 7),
  },
  magnesium: {
    '0': 200,
    '1-3': 200 + (2 * 100 / 7),
    '4-6': 200 + (5 * 100 / 7),
    '7': 200 + (7 * 100 / 7),
    '8-10': 200 + (9 * 100 / 7),
    '11-13': 200 + (12 * 100 / 7),
    '14': 200 + (14 * 100 / 7),
  },
  calcium: {
    '0': 800,
    '1-3': 800 + (2 * 300 / 7),
    '4-6': 800 + (5 * 300 / 7),
    '7': 800 + (7 * 300 / 7),
    '8-10': 800 + (9 * 300 / 7),
    '11-13': 800 + (12 * 300 / 7),
    '14': 800 + (14 * 300 / 7),
  },
} as const;

// ================== USE CASE DETECTION ORDER ==================

/**
 * Use case detection priority order - MUST PRESERVE EXACT ORDER
 * This is the critical decision tree from the V1 framework
 */
export const USE_CASE_DETECTION_ORDER = [
  'bedtime',    // Sleep issues take highest priority
  'menstrual',  // Menstrual symptoms second
  'sweat',      // Heavy sweat + frequent workouts third
  'daily',      // Default fallback
] as const;

// ================== ELECTROLYTE FORMS ==================

export const DEFAULT_ELECTROLYTE_FORMS = {
  sodium: 'sodium-chloride',
  potassium: 'potassium-citrate',
  magnesium: 'magnesium-glycinate',
  calcium: 'calcium-citrate',
} as const;

// ================== VALIDATION CONSTANTS ==================

export const VALIDATION_LIMITS = {
  AGE: { min: 13, max: 120 },
  WEIGHT: { min: 80, max: 400 }, // lbs
  DAILY_WATER_INTAKE: { min: 32, max: 200 }, // fl oz
  SUPPLEMENT_MAX: {
    sodium: 2000,
    potassium: 1000,
    magnesium: 500,
    calcium: 1200,
  },
} as const; 
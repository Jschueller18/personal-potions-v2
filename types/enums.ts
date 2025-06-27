/**
 * Personal Potions V1 Enum Types
 * 
 * All possible values for the calculation framework fields
 */

export type BiologicalSex = 'male' | 'female';

export type ActivityLevel = 
  | 'sedentary' 
  | 'lightly-active' 
  | 'moderately-active' 
  | 'very-active' 
  | 'extremely-active';

export type SweatLevel = 
  | 'minimal' 
  | 'light' 
  | 'moderate' 
  | 'heavy' 
  | 'excessive';

export type WorkoutDuration = 
  | '30-60' 
  | '60-90' 
  | '90-120' 
  | '120+';

export type WorkoutIntensity = 
  | 'low' 
  | 'moderate' 
  | 'high' 
  | 'very-high';

export type WorkoutFrequency = 
  | 'never' 
  | '1-per-week' 
  | '2-3-per-week' 
  | '4-6-per-week' 
  | 'daily';

export type UseCase = 
  | 'daily' 
  | 'sweat' 
  | 'bedtime' 
  | 'menstrual' 
  | 'hangover';

export type DailyGoal = 
  | 'energy' 
  | 'mental-clarity' 
  | 'muscle-function' 
  | 'recovery' 
  | 'hydration' 
  | 'performance';

export type SleepGoal = 
  | 'falling-asleep' 
  | 'staying-asleep' 
  | 'sleep-quality' 
  | 'muscle-relaxation' 
  | 'reduce-cramping' 
  | 'recovery';

export type SleepIssue = 
  | 'none' 
  | 'trouble-falling-asleep' 
  | 'frequent-waking' 
  | 'early-waking' 
  | 'restless-sleep' 
  | 'muscle-cramps' 
  | 'stress-related';

export type MenstrualSymptom = 
  | 'none' 
  | 'cramps' 
  | 'bloating' 
  | 'mood-swings' 
  | 'fatigue' 
  | 'headaches' 
  | 'muscle-aches';

export type HealthCondition = 
  | 'hypertension' 
  | 'kidney-disease' 
  | 'heart-disease' 
  | 'diabetes' 
  | 'osteoporosis';

export type ExerciseType = 
  | 'cardio' 
  | 'strength-training' 
  | 'endurance' 
  | 'high-intensity' 
  | 'yoga' 
  | 'sports';

export type HangoverTiming = 
  | 'before' 
  | 'during' 
  | 'after';

export type HangoverSymptom = 
  | 'headache' 
  | 'nausea' 
  | 'dehydration' 
  | 'fatigue';

// Legacy intake format (multiple choice)
export type IntakeLevel = 
  | '0' 
  | '1-3' 
  | '4-6' 
  | '7' 
  | '8-10' 
  | '11-13' 
  | '14';

export type ElectrolyteForm = 
  | 'sodium-chloride' 
  | 'potassium-citrate' 
  | 'magnesium-glycinate' 
  | 'calcium-citrate'; 
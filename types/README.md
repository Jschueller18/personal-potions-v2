# Personal Potions V1 TypeScript Interface Documentation

This directory contains comprehensive TypeScript interfaces and utilities for the Personal Potions V1 calculation framework. These types ensure exact compatibility with the research-backed V1 system.

## 📁 Files Overview

### `index.ts`
Main type definitions file containing:
- **15+ Core Data Fields** matching V1 exactly
- **Enum Types**: All possible values for activity levels, sweat levels, use cases, goals, etc.
- **Data Structures**: Customer input, formulation output, and calculation metadata
- **Function Types**: Type signatures for all calculator functions
- **Validation Types**: Interfaces for validation results

### `constants.ts`
Research-backed constants from V1 framework:
- **Base Values**: Sodium (2500mg), Potassium (4700mg), Magnesium (420mg), Calcium (1000mg)
- **Multipliers**: Activity, sweat, goal, and health condition adjustments
- **Safety Limits**: Min/max values for each use case
- **Ratios**: Calcium:Magnesium optimal ranges
- **Legacy Mappings**: Multiple choice intake estimates

### `validators.ts`
Validation utilities ensuring data integrity:
- **Customer Data Validation**: Required fields, ranges, and formats
- **Default Value Application**: V1-compatible fallback values
- **Type Safety**: Runtime validation of input data

## 🔍 Key Features

### ✅ Complete V1 Compatibility
- **Exact Field Names**: All 15+ fields match V1 (`biological-sex`, `activity-level`, etc.)
- **Dual Input Support**: Legacy multiple-choice AND numeric serving formats
- **Research Values**: All multipliers, ratios, and limits preserved exactly
- **Use Case Logic**: Priority order and detection rules maintained

### ✅ Type Safety
- **Strict Enums**: All possible values defined explicitly
- **Required vs Optional**: Clear distinction following V1 patterns
- **Validation Results**: Structured error and warning reporting
- **Function Signatures**: Type-safe calculator interfaces

### ✅ Research Integrity
- **Citations Preserved**: All research sources documented in constants
- **Formula Version**: Locked to V1.4 specification
- **Safety Limits**: Health condition restrictions enforced
- **Ratio Validation**: Calcium:Magnesium ratios within research ranges

## 📊 Data Model Structure

### Customer Input (15+ Fields)
```typescript
interface CustomerData {
  // Core demographics (3 fields)
  age: number;
  'biological-sex': BiologicalSex;
  weight: number;
  
  // Activity profile (3 fields)
  'activity-level': ActivityLevel;
  'sweat-level': SweatLevel;
  'workout-frequency'?: WorkoutFrequency;
  
  // Goals and conditions (4+ arrays)
  'daily-goals'?: DailyGoal[];
  'sleep-goals'?: SleepGoal[];
  'sleep-issues'?: SleepIssue[];
  conditions?: HealthCondition[];
  
  // Intake tracking (8 fields)
  'sodium-intake'?: IntakeLevel | string;
  'potassium-intake'?: IntakeLevel | string;
  'magnesium-intake'?: IntakeLevel | string;
  'calcium-intake'?: IntakeLevel | string;
  'sodium-supplement'?: number;
  'potassium-supplement'?: number;
  'magnesium-supplement'?: number;
  'calcium-supplement'?: number;
  
  // Additional context
  'daily-water-intake'?: number;
  usage?: UseCase;
}
```

### Formulation Output
```typescript
interface FormulationResult {
  formulationPerServing: ElectrolyteAmounts;
  useCase: UseCase;
  metadata: CalculationMetadata; // 10+ metadata fields
}
```

## 🎯 Use Cases Supported

1. **Daily**: General wellness and hydration
2. **Sweat**: Heavy exercise and athletic performance
3. **Bedtime**: Sleep support and muscle relaxation
4. **Menstrual**: Symptom relief and hormonal support
5. **Hangover**: Recovery and rehydration

## 🔬 Research-Backed Values

### Base Calculations
- **Sodium**: 2500mg base + 7mg per kg body weight
- **Potassium**: 4700mg base (FDA recommendation)
- **Magnesium**: 420mg male/320mg female (RDA values)
- **Calcium**: Age-based RDA values (1000-1300mg)

### Safety Limits (Per Serving)
- **Daily Use**: Na 150-800mg, K 400-600mg, Mg 80-200mg, Ca 200-300mg
- **Sweat Use**: Na 200-1000mg, K 300-700mg (higher limits)
- **Hangover**: Na 200-450mg, K 350-600mg, Mg 100-400mg, Ca 50-150mg

### Critical Ratios
- **Ca:Mg Daily**: 1.8-2.2 (target 2.0)
- **Ca:Mg Menstrual**: 1.5-2.0 (target 1.8)
- **Ca:Mg Hangover**: 0.3-0.8 (target 0.5)

## 🚀 Usage Examples

### Basic Customer Data
```typescript
import { CustomerData, applyCustomerDefaults } from './types';

const customer: CustomerData = applyCustomerDefaults({
  age: 28,
  'biological-sex': 'female',
  weight: 140,
  'activity-level': 'very-active',
  'daily-goals': ['energy', 'recovery'],
  'sodium-intake': '5'
});
```

### Validation
```typescript
import { validateCustomerData } from './types/validators';

const validation = validateCustomerData(customer);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

## ⚠️ Critical Notes

1. **DO NOT MODIFY** research-backed constants without updating calculation logic
2. **Preserve exact field names** from V1 (hyphenated format)
3. **Maintain dual input support** for legacy and numeric formats
4. **Validate all inputs** against V1 safety limits
5. **Use exact multipliers** from research citations

## 🔗 Integration Points

These types are designed to integrate with:
- **Calculation Engine**: `lib/calculation-engine/`
- **API Endpoints**: `app/api/formula/`
- **Survey Forms**: Data collection and validation
- **Database Models**: Supabase schema alignment

---

*Generated for Personal Potions V2 - Maintaining V1 Calculation Framework Integrity* 
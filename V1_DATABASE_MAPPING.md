# Personal Potions V1 → Database Schema Mapping

## **CRITICAL DATA INTEGRITY REQUIREMENTS**

**⚠️ WARNING: This mapping ensures ZERO DATA LOSS when converting V1 customer data to database storage.**

All V1 calculation framework field names and values must be preserved exactly to maintain backward compatibility and calculation accuracy.

---

## **V1 CustomerData Interface Analysis**

### **Total Fields: 26 Core Fields**
Based on `personal-potions-v2/types/interfaces.ts`, the CustomerData interface contains:

```typescript
export interface CustomerData {
  // Required fields (5) - with fallback values
  age: number;                              // Default: 30
  'biological-sex': BiologicalSex;          // Default: 'male'
  weight: number;                           // in lbs, Default: 70
  'activity-level': ActivityLevel;          // Default: 'moderately-active'
  'sweat-level': SweatLevel;               // Default: 'moderate'
  
  // Optional arrays (6)
  'daily-goals'?: DailyGoal[];
  'sleep-goals'?: SleepGoal[];
  'sleep-issues'?: SleepIssue[];
  'menstrual-symptoms'?: MenstrualSymptom[];
  conditions?: HealthCondition[];
  'exercise-type'?: ExerciseType[];
  
  // Workout-specific fields (3)
  'workout-frequency'?: WorkoutFrequency;
  'workout-duration'?: WorkoutDuration;
  'workout-intensity'?: WorkoutIntensity;
  
  // Hangover-specific fields (2)
  'hangover-timing'?: HangoverTiming;
  'hangover-symptoms'?: HangoverSymptom[];
  
  // **CRITICAL: Dual Format Intake Fields (4)**
  'sodium-intake'?: IntakeLevel | string;
  'potassium-intake'?: IntakeLevel | string;
  'magnesium-intake'?: IntakeLevel | string;
  'calcium-intake'?: IntakeLevel | string;
  
  // Supplement values (4)
  'sodium-supplement'?: number;            // mg, Default: 0
  'potassium-supplement'?: number;         // mg, Default: 0
  'magnesium-supplement'?: number;         // mg, Default: 0
  'calcium-supplement'?: number;           // mg, Default: 0
  
  // Water intake (1)
  'daily-water-intake'?: number;           // fl oz, Default: 64
  
  // Use case override (1)
  usage?: UseCase;
}
```

---

## **CRITICAL: Dual Input Format Support**

### **Intake Fields Must Support TWO Formats:**

1. **Legacy Multiple-Choice Format:**
   ```typescript
   'sodium-intake': '0' | '1-3' | '4-6' | '7' | '8-10' | '11-13' | '14'
   ```

2. **Numeric Serving Format:**
   ```typescript
   'sodium-intake': '2.5' | '3.7' | '10.2' // Direct mg amounts as strings
   ```

### **Legacy Intake Mapping (PRESERVE EXACT VALUES):**
From `personal-potions-v2/types/constants.ts`:

```typescript
export const LEGACY_INTAKE_ESTIMATES = {
  sodium: {
    '0': 1500,
    '1-3': 1500 + (2 * 500 / 7),      // ~1642.86
    '4-6': 1500 + (5 * 500 / 7),      // ~1857.14
    '7': 1500 + (7 * 500 / 7),        // 2000
    '8-10': 1500 + (9 * 500 / 7),     // ~2142.86
    '11-13': 1500 + (12 * 500 / 7),   // ~2357.14
    '14': 1500 + (14 * 500 / 7),      // 2500
  },
  potassium: {
    '0': 2000,
    '1-3': 2000 + (2 * 400 / 7),      // ~2114.29
    '4-6': 2000 + (5 * 400 / 7),      // ~2285.71
    '7': 2000 + (7 * 400 / 7),        // 2400
    '8-10': 2000 + (9 * 400 / 7),     // ~2514.29
    '11-13': 2000 + (12 * 400 / 7),   // ~2685.71
    '14': 2000 + (14 * 400 / 7),      // 2800
  },
  magnesium: {
    '0': 200,
    '1-3': 200 + (2 * 100 / 7),       // ~228.57
    '4-6': 200 + (5 * 100 / 7),       // ~271.43
    '7': 200 + (7 * 100 / 7),         // 300
    '8-10': 200 + (9 * 100 / 7),      // ~328.57
    '11-13': 200 + (12 * 100 / 7),    // ~371.43
    '14': 200 + (14 * 100 / 7),       // 400
  },
  calcium: {
    '0': 800,
    '1-3': 800 + (2 * 300 / 7),       // ~885.71
    '4-6': 800 + (5 * 300 / 7),       // ~1014.29
    '7': 800 + (7 * 300 / 7),         // 1100
    '8-10': 800 + (9 * 300 / 7),      // ~1185.71
    '11-13': 800 + (12 * 300 / 7),    // ~1314.29
    '14': 800 + (14 * 300 / 7),       // 1400
  }
};
```

---

## **Database Schema Design**

### **Core Principles:**
1. **Preserve V1 field names exactly** - no transformation or normalization
2. **Support dual input formats** with proper validation
3. **JSONB for flexibility** - store complex arrays without loss
4. **Audit trail** - track all data changes for HIPAA compliance
5. **Performance optimization** - indexed fields for calculations

### **Primary Tables:**

#### **1. `customer_surveys` Table**
Stores complete V1 customer data with audit trail:

```sql
CREATE TABLE customer_surveys (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255) NOT NULL,
  
  -- V1 Customer Data (JSONB for exact preservation)
  customer_data JSONB NOT NULL,
  
  -- Derived/computed fields for performance (indexed)
  age INTEGER,
  biological_sex TEXT,
  weight DECIMAL(5,2),
  activity_level TEXT,
  sweat_level TEXT,
  detected_use_case TEXT,
  
  -- Intake format tracking (CRITICAL)
  intake_formats JSONB, -- {'sodium': 'legacy', 'potassium': 'numeric', ...}
  
  -- Status and metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'processed')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- HIPAA audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source TEXT DEFAULT 'web',
  ip_address INET,
  user_agent TEXT,
  
  -- Indexing for queries
  CONSTRAINT valid_customer_data CHECK (jsonb_typeof(customer_data) = 'object'),
  CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Performance indexes
CREATE INDEX idx_customer_surveys_user_id ON customer_surveys(user_id);
CREATE INDEX idx_customer_surveys_session_id ON customer_surveys(session_id);
CREATE INDEX idx_customer_surveys_status ON customer_surveys(status);
CREATE INDEX idx_customer_surveys_age ON customer_surveys(age);
CREATE INDEX idx_customer_surveys_biological_sex ON customer_surveys(biological_sex);
CREATE INDEX idx_customer_surveys_use_case ON customer_surveys(detected_use_case);
CREATE INDEX idx_customer_surveys_created_at ON customer_surveys(created_at);

-- JSONB indexes for fast queries
CREATE INDEX idx_customer_surveys_customer_data_gin ON customer_surveys USING GIN (customer_data);
CREATE INDEX idx_customer_surveys_intake_formats ON customer_surveys USING GIN (intake_formats);
```

#### **2. `formulation_results` Table**
Stores calculated formulation outputs:

```sql
CREATE TABLE formulation_results (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_survey_id UUID NOT NULL REFERENCES customer_surveys(id) ON DELETE CASCADE,
  
  -- V1 Formulation Result (exact structure)
  formulation_result JSONB NOT NULL,
  
  -- Quick access fields (indexed)
  use_case TEXT NOT NULL,
  formula_version TEXT NOT NULL DEFAULT '1.4',
  serving_size TEXT DEFAULT '16 fl oz (473ml)',
  
  -- Electrolyte amounts (per serving, in mg)
  sodium_mg DECIMAL(8,3),
  potassium_mg DECIMAL(8,3),
  magnesium_mg DECIMAL(8,3),
  calcium_mg DECIMAL(8,3),
  
  -- Business fields
  price_cents INTEGER,
  formula_name TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_formulation_result CHECK (jsonb_typeof(formulation_result) = 'object'),
  CONSTRAINT positive_amounts CHECK (
    sodium_mg >= 0 AND potassium_mg >= 0 AND 
    magnesium_mg >= 0 AND calcium_mg >= 0
  )
);

-- Performance indexes
CREATE INDEX idx_formulation_results_survey_id ON formulation_results(customer_survey_id);
CREATE INDEX idx_formulation_results_use_case ON formulation_results(use_case);
CREATE INDEX idx_formulation_results_created_at ON formulation_results(created_at);

-- JSONB index
CREATE INDEX idx_formulation_results_formulation_gin ON formulation_results USING GIN (formulation_result);
```

#### **3. `intake_conversions` Table**
Tracks dual format conversions for audit:

```sql
CREATE TABLE intake_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_survey_id UUID NOT NULL REFERENCES customer_surveys(id) ON DELETE CASCADE,
  
  -- Conversion tracking
  electrolyte TEXT NOT NULL CHECK (electrolyte IN ('sodium', 'potassium', 'magnesium', 'calcium')),
  original_value TEXT NOT NULL,
  original_format TEXT NOT NULL CHECK (original_format IN ('legacy', 'numeric')),
  converted_mg DECIMAL(8,3) NOT NULL,
  conversion_source TEXT NOT NULL, -- 'LEGACY_INTAKE_ESTIMATES' or 'DIRECT_NUMERIC'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_converted_mg CHECK (converted_mg >= 0)
);

-- Indexes
CREATE INDEX idx_intake_conversions_survey_id ON intake_conversions(customer_survey_id);
CREATE INDEX idx_intake_conversions_electrolyte ON intake_conversions(electrolyte);
CREATE INDEX idx_intake_conversions_format ON intake_conversions(original_format);
```

---

## **Field-by-Field Mapping**

### **CustomerData → customer_surveys.customer_data (JSONB)**

**All 26 fields stored in JSONB with exact V1 field names:**

```json
{
  "age": 30,
  "biological-sex": "male",
  "weight": 170.5,
  "activity-level": "moderately-active",
  "sweat-level": "moderate",
  "daily-goals": ["energy", "performance"],
  "sleep-goals": ["falling-asleep"],
  "sleep-issues": ["trouble-falling-asleep"],
  "menstrual-symptoms": ["cramps", "fatigue"],
  "conditions": ["hypertension"],
  "exercise-type": ["cardio", "strength-training"],
  "workout-frequency": "daily",
  "workout-duration": "60-90",
  "workout-intensity": "high",
  "hangover-timing": "after",
  "hangover-symptoms": ["headache", "dehydration"],
  "sodium-intake": "8-10",
  "potassium-intake": "3.5",
  "magnesium-intake": "7",
  "calcium-intake": "12.8",
  "sodium-supplement": 0,
  "potassium-supplement": 200,
  "magnesium-supplement": 100,
  "calcium-supplement": 500,
  "daily-water-intake": 64,
  "usage": "daily"
}
```

### **Additional Indexed Fields:**

```sql
-- Extracted for performance (derived from JSONB)
age = customer_data->>'age'::INTEGER
biological_sex = customer_data->>'biological-sex'
weight = (customer_data->>'weight')::DECIMAL(5,2)
activity_level = customer_data->>'activity-level'
sweat_level = customer_data->>'sweat-level'
detected_use_case = [calculated based on V1 use case detection logic]
```

### **Intake Format Tracking:**

```sql
-- intake_formats JSONB example
{
  "sodium": "legacy",      -- Used IntakeLevel enum value
  "potassium": "numeric",  -- Used direct mg string
  "magnesium": "legacy",   -- Used IntakeLevel enum value
  "calcium": "numeric"     -- Used direct mg string
}
```

---

## **Data Validation Rules**

### **1. V1 Framework Compliance:**
- All enum values must match exactly with `personal-potions-v2/types/enums.ts`
- Default values applied per `personal-potions-v2/types/validators.ts`
- Intake values support both `IntakeLevel | string` formats

### **2. Database Constraints:**
```sql
-- Age validation
CONSTRAINT valid_age CHECK ((customer_data->>'age')::INTEGER BETWEEN 13 AND 120)

-- Weight validation  
CONSTRAINT valid_weight CHECK ((customer_data->>'weight')::NUMERIC BETWEEN 80 AND 400)

-- Intake format validation
CONSTRAINT valid_intake_formats CHECK (
  intake_formats ? 'sodium' AND intake_formats ? 'potassium' AND 
  intake_formats ? 'magnesium' AND intake_formats ? 'calcium'
)

-- Biological sex validation
CONSTRAINT valid_biological_sex CHECK (
  customer_data->>'biological-sex' IN ('male', 'female')
)
```

### **3. Dual Format Validation:**
```typescript
// Validation logic for intake fields
function validateIntakeField(value: string, electrolyte: string): {
  isValid: boolean;
  format: 'legacy' | 'numeric';
  convertedMg: number;
} {
  // Check if legacy format
  if (['0', '1-3', '4-6', '7', '8-10', '11-13', '14'].includes(value)) {
    return {
      isValid: true,
      format: 'legacy',
      convertedMg: LEGACY_INTAKE_ESTIMATES[electrolyte][value]
    };
  }
  
  // Check if numeric format
  const numericValue = parseFloat(value);
  if (!isNaN(numericValue) && numericValue >= 0) {
    return {
      isValid: true,
      format: 'numeric',
      convertedMg: numericValue
    };
  }
  
  return { isValid: false, format: 'unknown', convertedMg: 0 };
}
```

---

## **Migration Strategy**

### **1. Schema Creation Order:**
```sql
-- Step 1: Create core tables
CREATE TABLE customer_surveys (...);
CREATE TABLE formulation_results (...);
CREATE TABLE intake_conversions (...);

-- Step 2: Create indexes
-- [All index creation statements]

-- Step 3: Create validation functions
-- [Validation function definitions]
```

### **2. Data Population:**
- All V1 customer data inserted with exact field preservation
- Intake formats detected and tracked in `intake_formats`
- Conversions logged in `intake_conversions` table
- Derived fields populated for query performance

### **3. Testing Requirements:**
- Validate all 26 CustomerData fields preserve correctly
- Test dual intake format support with edge cases
- Verify LEGACY_INTAKE_ESTIMATES mapping accuracy
- Confirm calculation framework compatibility

---

## **API Integration Points**

### **Save Survey Data:**
```typescript
// POST /api/survey/save
{
  customerData: CustomerData, // Full V1 structure
  sessionId: string,
  userId?: string
}
```

### **Calculate Formula:**
```typescript
// POST /api/formula/calculate
{
  surveyId: string // References customer_surveys.id
}
// Returns FormulationResult with intake analysis
```

### **Retrieve Survey:**
```typescript
// GET /api/survey/{id}
// Returns complete CustomerData structure from JSONB
```

---

## **Performance Considerations**

### **1. Query Optimization:**
- Indexed derived fields for common queries
- GIN indexes on JSONB for complex searches
- Partitioning by created_at for large datasets

### **2. Intake Conversion Caching:**
- Pre-computed conversions stored in `intake_conversions`
- Avoids repeated LEGACY_INTAKE_ESTIMATES lookups
- Fast retrieval for formula calculations

### **3. Memory Usage:**
- JSONB compression for storage efficiency
- Selective field extraction for API responses
- Proper connection pooling for concurrent access

---

## **HIPAA Compliance**

### **1. Data Retention:**
- `expires_at` field for automatic cleanup
- Audit trail preservation requirements
- User consent tracking integration

### **2. Access Logging:**
- All customer_data access logged
- IP address and user agent tracking
- Encryption state monitoring

### **3. Data Minimization:**
- Only store necessary V1 framework fields
- Session-based access for anonymous users
- Automatic PHI detection and handling

---

## **Testing Checklist**

### **✅ V1 Compatibility Tests:**
- [ ] All 26 CustomerData fields preserve exactly
- [ ] Legacy intake format mapping accuracy
- [ ] Numeric intake format validation
- [ ] Default value application per V1 specs
- [ ] Enum value validation against V1 types

### **✅ Database Integrity Tests:**
- [ ] JSONB structure validation
- [ ] Constraint enforcement
- [ ] Index performance benchmarks
- [ ] Concurrent access handling
- [ ] Data cleanup procedures

### **✅ Calculation Integration Tests:**
- [ ] V1 calculation framework compatibility
- [ ] Intake conversion accuracy
- [ ] Use case detection preservation
- [ ] Formula output structure matching
- [ ] Metadata preservation completeness 
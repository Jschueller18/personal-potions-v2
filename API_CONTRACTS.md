# Personal Potions V2 - Dual-Format API Contracts

## 🔄 Overview

The Personal Potions V2 API supports **dual intake formats** for maximum flexibility:
- **Legacy Format**: Multiple-choice strings (`"0"`, `"1-3"`, `"4-6"`, `"7"`, `"8-10"`, `"11-13"`, `"14"`)
- **Numeric Format**: Direct serving values (`"2.5"`, `"3.7"`, `"10.2"`)

All intake fields (`sodium-intake`, `potassium-intake`, `magnesium-intake`, `calcium-intake`) accept both formats seamlessly.

## 📋 API Endpoints

### 1. Formula Calculation
**POST** `/api/formula/calculate`

Calculate personalized electrolyte formulations with dual-format intake support.

#### Request Body
```typescript
{
  "customerData": {
    // Required fields
    "age": 30,
    "biological-sex": "male" | "female",
    "weight": 150, // lbs
    "activity-level": "moderately-active",
    "sweat-level": "moderate",
    
    // Dual-format intake fields
    "sodium-intake": "7" | "2.5",        // Legacy OR numeric
    "potassium-intake": "4-6" | "3.2",   // Legacy OR numeric  
    "magnesium-intake": "8-10" | "4.1",  // Legacy OR numeric
    "calcium-intake": "1-3" | "1.8",     // Legacy OR numeric
    
    // Optional fields
    "daily-goals": ["energy", "hydration"],
    "conditions": ["hypertension"],
    "usage": "daily"
  },
  "options": {
    "validateOnly": false,        // Set to true for validation-only
    "includeMetadata": true,      // Include detailed calculation metadata
    "format": "v2"               // API response format version
  }
}
```

#### Response Format
```typescript
{
  "success": true,
  "data": {
    "formulation": {
      "formulationPerServing": {
        "sodium": 500,    // mg
        "potassium": 400, // mg
        "magnesium": 100, // mg
        "calcium": 300    // mg
      },
      "useCase": "daily",
      "metadata": {
        "formulaVersion": "1.4",
        "servingSize": "16 fl oz (473ml)",
        "recommendedServingsPerDay": 1,
        "optimalIntake": { /* mg amounts */ },
        "currentIntake": { /* mg amounts */ },
        "deficits": { /* mg deficits */ }
      }
    },
    "intakeAnalysis": {
      "formats": {
        "sodium-intake": "legacy",   // or "numeric"
        "potassium-intake": "legacy",
        "magnesium-intake": "numeric",
        "calcium-intake": "numeric"
      },
      "converted": {
        "sodium": 2900,    // mg (converted from input)
        "potassium": 3400, // mg
        "magnesium": 400,  // mg
        "calcium": 1100    // mg
      },
      "warnings": ["High sodium intake detected"]
    }
  },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": ["High sodium intake detected"]
  }
}
```

### 2. Intake Validation
**POST** `/api/intake/validate`

Validate intake field formats and preview conversions.

#### Request Body
```typescript
{
  "intakeFields": {
    "sodium-intake": "7",      // Legacy format
    "potassium-intake": "3.5", // Numeric format
    "magnesium-intake": "invalid", // Will trigger error
    "calcium-intake": "1-3"    // Legacy format
  }
}
```

#### Response Format
```typescript
{
  "success": false,
  "validation": {
    "isValid": false,
    "errors": [
      "magnesium-intake must be either a legacy format (0, 1-3, 4-6, 7, 8-10, 11-13, 14) or a numeric serving value"
    ],
    "warnings": []
  },
  "conversions": {
    "sodium": { "input": "7", "mg": 2900, "format": "legacy" },
    "potassium": { "input": "3.5", "mg": 3400, "format": "numeric" },
    "calcium": { "input": "1-3", "mg": 1086, "format": "legacy" }
  }
}
```

### 3. Intake Conversion
**POST** `/api/intake/convert`

Convert individual intake values or batches to mg amounts.

#### Single Conversion
```typescript
// Request
{
  "value": "4-6",
  "electrolyte": "sodium",
  "direction": "to-mg"
}

// Response
{
  "success": true,
  "data": {
    "input": { "value": "4-6", "format": "legacy" },
    "output": { "mg": 2800 },
    "electrolyte": "sodium"
  }
}
```

#### Batch Conversion
```typescript
// Request
{
  "conversions": [
    { "value": "7", "electrolyte": "sodium", "id": "user_sodium" },
    { "value": "2.5", "electrolyte": "potassium", "id": "user_potassium" }
  ]
}

// Response
{
  "success": true,
  "results": [
    {
      "id": "user_sodium",
      "input": { "value": "7", "electrolyte": "sodium", "format": "legacy" },
      "output": { "mg": 2900 },
      "success": true
    },
    {
      "id": "user_potassium", 
      "input": { "value": "2.5", "electrolyte": "potassium", "format": "numeric" },
      "output": { "mg": 3000 },
      "success": true
    }
  ]
}
```

## 🔢 Conversion Logic

### Legacy Format Conversion
Legacy values are converted using research-backed estimates from `LEGACY_INTAKE_ESTIMATES`:

```typescript
// Example: sodium intake "7" servings per week
LEGACY_INTAKE_ESTIMATES.sodium["7"] = 2900; // mg
```

### Numeric Format Conversion
Numeric values represent servings and are converted using:
```
mg = baseIntake + (servings × mgPerServing)
```

**Base Intakes (from food):**
- Sodium: 1500mg
- Potassium: 2000mg  
- Magnesium: 200mg
- Calcium: 800mg

**Per Serving Amounts:**
- Sodium: 500mg
- Potassium: 400mg
- Magnesium: 100mg  
- Calcium: 300mg

### Examples
```typescript
// Legacy: "7" servings → 2900mg (from lookup table)
// Numeric: "3.5" servings → 2000 + (3.5 × 400) = 3400mg potassium
```

## ⚠️ Error Handling

### Common Error Codes
- `INVALID_REQUEST`: Missing required fields
- `VALIDATION_ERROR`: Customer data validation failed
- `INTAKE_VALIDATION_ERROR`: Intake format validation failed
- `INTERNAL_ERROR`: Server error during processing
- `METHOD_NOT_ALLOWED`: Unsupported HTTP method

### Validation Rules
1. **Legacy Format**: Must be one of `"0"`, `"1-3"`, `"4-6"`, `"7"`, `"8-10"`, `"11-13"`, `"14"`
2. **Numeric Format**: Must be parseable number ≥ 0, warns if > 50
3. **Customer Data**: Age 13-120, weight 80-400 lbs, valid enums
4. **Supplements**: Max limits enforced per electrolyte

## 🚀 Usage Examples

### Frontend Implementation
```typescript
// Legacy user input
const legacyData = {
  customerData: {
    age: 28,
    'biological-sex': 'female',
    weight: 130,
    'activity-level': 'very-active',
    'sweat-level': 'heavy',
    'sodium-intake': '8-10',
    'potassium-intake': '7',
    'magnesium-intake': '4-6',
    'calcium-intake': '11-13'
  }
};

// Numeric user input
const numericData = {
  customerData: {
    age: 35,
    'biological-sex': 'male', 
    weight: 180,
    'activity-level': 'moderately-active',
    'sweat-level': 'moderate',
    'sodium-intake': '2.5',
    'potassium-intake': '4.2',
    'magnesium-intake': '1.8',
    'calcium-intake': '3.0'
  }
};

// Both work seamlessly
const response = await fetch('/api/formula/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(legacyData) // or numericData
});
```

### Migration Support
```typescript
// Validate existing data before migration
const validateResponse = await fetch('/api/intake/validate', {
  method: 'POST',
  body: JSON.stringify({
    intakeFields: {
      'sodium-intake': existingData.sodium,
      'potassium-intake': existingData.potassium
    }
  })
});

if (validateResponse.data.success) {
  // Safe to migrate
  const conversions = validateResponse.data.conversions;
}
```

## 🔧 Implementation Notes

### Type Safety
All API contracts use strict TypeScript interfaces from `@/types`:
- Input validation with `validateCustomerData()`
- Format detection with `detectIntakeFormats()`
- Conversion with `convertAllIntakesToMg()`

### Backward Compatibility
- Existing legacy format clients continue working unchanged
- New numeric format clients get enhanced precision
- API responses include format detection metadata

### Performance
- Validation happens before conversion for efficiency
- Batch operations supported for bulk conversions  
- Minimal overhead for format detection

## 📝 Integration Checklist

- [ ] Update frontend to handle both input formats
- [ ] Implement format detection in UI
- [ ] Add validation feedback for users
- [ ] Test migration scenarios thoroughly
- [ ] Monitor API usage patterns
- [ ] Document client-side conversion utilities 
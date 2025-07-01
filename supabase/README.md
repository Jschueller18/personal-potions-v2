# Personal Potions V2 - Supabase Database Migrations

## Overview

This directory contains the Supabase database migrations that successfully converted from a dual database approach (Supabase auth + Prisma surveys) to a single unified Supabase database. This migration maintains **zero data loss** and preserves complete V1 calculation framework compatibility.

**✅ MIGRATION STATUS: COMPLETED** - All Prisma dependencies removed, application running on pure Supabase architecture.

## Migration Files

### 📋 **Migration Order** (CRITICAL - Apply in sequence)

1. **`20240101000001_initial_schema.sql`** - Core database schema
2. **`20240101000002_validation_constraints.sql`** - Business logic constraints  
3. **`20240101000003_rls_policies.sql`** - Row Level Security policies
4. **`20240101000004_core_functions.sql`** - Core database functions (survey, formulation, intake)
5. **`20240101000005_query_functions.sql`** - Query and maintenance functions

**Note**: Functions were split into two files to maintain the <300 line coding standard and reduce code duplication through shared validation helpers.

## 🎯 **What This Migration Accomplishes**

### **FROM**: Dual Database Issues
- ❌ No referential integrity between Supabase auth and Prisma surveys
- ❌ Orphaned data risk when users delete accounts
- ❌ Complex deployment requiring two database connections
- ❌ Maintenance overhead with dual schema management

### **TO**: Single Supabase Benefits
- ✅ **Proper Foreign Keys**: `customer_surveys.user_id` → `auth.users.id`
- ✅ **Cascade Deletes**: Automatic cleanup when users delete accounts
- ✅ **HIPAA Compliance**: Enhanced RLS policies for data protection
- ✅ **Referential Integrity**: Database-level constraints prevent orphaned data
- ✅ **Simplified Architecture**: Single database connection and schema

## 📊 **Database Schema**

### **Core Tables Created**

#### `public.customer_surveys`
- **Purpose**: Main survey data with complete V1 CustomerData preservation
- **Key Features**:
  - JSONB storage for exact 26-field V1 compatibility
  - Dual intake format tracking (legacy + numeric)
  - Derived fields for performance (age, biological_sex, weight, etc.)
  - HIPAA audit trail (IP, user agent, timestamps)
  - Proper foreign key to `auth.users.id`

#### `public.formulation_results`  
- **Purpose**: Calculated V1 formulation outputs with metadata
- **Key Features**:
  - Complete FormulationResult interface as JSONB
  - Extracted electrolyte amounts for fast queries
  - Business fields (price, formula name, version)
  - Links to customer surveys via foreign key

#### `public.intake_conversions`
- **Purpose**: Audit trail for dual format intake conversions
- **Key Features**:
  - Tracks legacy-to-mg and numeric conversions
  - Conversion source identification
  - Electrolyte-specific conversion records

## 🔐 **Security Features**

### **Row Level Security (RLS) Policies**
- **User Data Isolation**: Users can only access their own survey data
- **Anonymous Survey Support**: Session-based access for anonymous surveys
- **Admin Access**: Special policies for support staff (with audit logging)
- **Service Role Bypass**: System operations and migrations bypass RLS

### **HIPAA Compliance Enhancements**
- **Audit Trail**: Complete logging of data access and modifications
- **Data Encryption**: JSONB fields encrypted at rest in Supabase
- **Access Controls**: Granular permissions with RLS policies
- **Cascade Deletes**: Automatic cleanup respects user privacy rights

## 🔧 **Validation Constraints**

### **V1 Framework Compatibility**
- **Age Validation**: 13-120 years (matches V1 limits)
- **Weight Validation**: 80-400 lbs (matches V1 limits)
- **Enum Validation**: All V1 enum values preserved exactly
- **JSONB Structure**: Validates customer_data and formulation_result objects

### **Business Logic Constraints**
- **Electrolyte Limits**: Safety checks prevent unreasonable amounts
- **Format Validation**: Ensures intake formats track all 4 electrolytes
- **Status Validation**: Enforces valid survey status transitions
- **Positive Values**: Ensures all amounts are non-negative

## 🚀 **Helper Functions**

### **Survey Management**
- `create_survey_draft()` - Creates new surveys with validation
- `update_survey_progress()` - Updates surveys with derived field extraction
- `cleanup_expired_surveys()` - Maintenance function for anonymous surveys

### **Formulation Operations**
- `store_formulation_result()` - Stores results with electrolyte extraction
- `record_intake_conversion()` - Records conversions for audit trail

### **User Operations**
- `link_anonymous_survey_to_user()` - Safely links anonymous surveys to accounts
- `get_survey_summary()` - Dashboard summary statistics
- `get_formulation_history()` - User's formulation history with pagination

## 📈 **Performance Optimizations**

### **Indexes Created**
- **B-tree indexes**: Foreign keys, status, dates, demographic fields
- **GIN indexes**: JSONB fields for fast JSON queries
- **Composite indexes**: Multi-column queries for common access patterns

### **Query Optimization**
- **Derived Fields**: Extract common JSONB fields to regular columns
- **Statistics Updates**: Function to update PostgreSQL query statistics
- **Partitioning Ready**: Schema designed for future partitioning by date

## 🧪 **Testing the Migration**

### **Pre-Migration Checklist**
1. **Backup existing Prisma data** (if any exists in production)
2. **Verify Supabase connection** with service role credentials
3. **Test in development environment** first
4. **Validate V1 calculation framework** compatibility

### **Post-Migration Validation**
```sql
-- Test basic table creation
SELECT COUNT(*) FROM public.customer_surveys;
SELECT COUNT(*) FROM public.formulation_results;
SELECT COUNT(*) FROM public.intake_conversions;

-- Test RLS policies (should return 0 for non-authenticated users)
SET role TO 'anon';
SELECT COUNT(*) FROM public.customer_surveys;
RESET role;

-- Test helper functions
SELECT create_survey_draft('test-session-123');
SELECT cleanup_expired_surveys();

-- Test constraints (should fail)
INSERT INTO public.customer_surveys (customer_data, session_id) 
VALUES ('{"age": 5}', 'test'); -- Should fail age constraint
```

## 🔄 **Migration Application**

### **Method 1: Supabase Dashboard**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste each migration file content
3. Execute in order (001 → 002 → 003 → 004)
4. Verify successful execution

### **Method 2: Supabase CLI**
```bash
# If using Supabase CLI
supabase db reset
supabase migration up

# Or apply individual migrations
supabase db push --file supabase/migrations/20240101000001_initial_schema.sql
supabase db push --file supabase/migrations/20240101000002_validation_constraints.sql
supabase db push --file supabase/migrations/20240101000003_rls_policies.sql
supabase db push --file supabase/migrations/20240101000004_core_functions.sql
supabase db push --file supabase/migrations/20240101000005_query_functions.sql
```

### **Method 3: Direct PostgreSQL**
```bash
# Connect to your Supabase PostgreSQL instance
psql "postgresql://postgres:[password]@[host]:[port]/postgres"

# Apply migrations in order
\i supabase/migrations/20240101000001_initial_schema.sql
\i supabase/migrations/20240101000002_validation_constraints.sql  
\i supabase/migrations/20240101000003_rls_policies.sql
\i supabase/migrations/20240101000004_core_functions.sql
\i supabase/migrations/20240101000005_query_functions.sql
```

## ⚠️ **Important Notes**

### **Critical Requirements**
- ✅ **Apply migrations in sequence** - Dependencies exist between files
- ✅ **Test in development first** - Validate before production deployment
- ✅ **Backup existing data** - Always have a recovery plan
- ✅ **Update application code** - Service layer needs to be rewritten after this

### **✅ Completed Migration Steps**
1. **✅ Updated TypeScript types** (`types/database.ts`)
2. **✅ Rewritten service layer** (`lib/services/auth-service.ts`, `lib/services/v1-database-mapping.ts`)
3. **✅ Updated tests** to use Supabase client instead of Prisma - 45/45 tests passing
4. **✅ Removed Prisma dependencies** and generated files
5. **✅ Updated documentation** and comments throughout codebase

## 📞 **Troubleshooting**

### **Common Issues**

#### **Migration 001 Fails**
- Check Supabase service role permissions
- Verify `auth` schema exists and is accessible
- Ensure PostgreSQL extensions are enabled

#### **Migration 002 Fails**  
- Usually constraint violations on existing data
- Check if any existing data violates V1 validation rules
- Consider data cleanup before applying constraints

#### **Migration 003 Fails**
- RLS policy conflicts with existing policies
- Check if custom policies already exist
- Review policy names for conflicts

#### **Migration 004 Fails**
- Function dependencies not met
- Ensure all previous migrations succeeded
- Check PostgreSQL version compatibility

### **Rollback Strategy**
```sql
-- Emergency rollback (use with caution)
DROP TABLE public.intake_conversions CASCADE;
DROP TABLE public.formulation_results CASCADE;  
DROP TABLE public.customer_surveys CASCADE;

-- Drop functions
DROP FUNCTION create_survey_draft(TEXT, UUID, JSONB, TEXT);
DROP FUNCTION update_survey_progress(UUID, JSONB, DECIMAL);
-- ... (drop other functions as needed)
```

## 🎯 **Migration Success Criteria**

✅ All tables created with proper foreign key constraints  
✅ All indexes created and functional  
✅ All validation constraints active  
✅ RLS policies enforced  
✅ Helper functions operational  
✅ No data loss from existing systems  
✅ V1 calculation framework compatibility maintained  
✅ HIPAA compliance enhanced  

---

*This migration converts Personal Potions from a dual database architecture to a unified Supabase database while maintaining complete V1 compatibility and enhancing security with proper referential integrity.* 
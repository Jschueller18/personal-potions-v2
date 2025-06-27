# Authentication State Interfaces Documentation

## 🔐 Overview

This document describes the comprehensive authentication state interfaces for Personal Potions V2, designed with HIPAA compliance, multi-factor authentication, and PHI protection at the core.

## 📁 Interface Files

### Core Files
- **`auth-interfaces.ts`** - Main authentication state interfaces
- **`auth-api-contracts.ts`** - API request/response contracts
- **`auth-utils.ts`** - Utility functions and type guards

## 🏥 HIPAA Compliance Features

### Key Security Implementations
- **Session-based audit logging** for all PHI access
- **Multi-factor authentication** requirements
- **User consent tracking** with versioning
- **Field-level encryption** state management
- **Risk-based authentication** with session scoring
- **Automatic session expiration** and cleanup

### PHI Protection
- All PHI access requires explicit consent
- Audit trail for every PHI field access
- Encryption state tracking
- Data retention policy enforcement

## 🔧 Core Interface Groups

### 1. Authentication State (`AuthState`)
```typescript
interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: UserSession | null;
  mfa: MfaState | null;
  permissions: UserPermissions;
  lastActivity: Date | null;
  error: AuthError | null;
}
```

**Key Features:**
- Comprehensive user authentication tracking
- MFA state management
- Permission-based access control
- Error state handling

### 2. User Session Management (`UserSession`)
```typescript
interface UserSession {
  id: string;
  userId: string;
  type: SessionType;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  deviceFingerprint?: string;
  auditTrail: SessionAuditEntry[];
}
```

**Key Features:**
- Complete session lifecycle tracking
- Device fingerprinting for security
- HIPAA-compliant audit trail
- Risk-based session validation

### 3. Survey Draft Management (`SurveyDraftState`)
```typescript
interface SurveyDraftState {
  id: string;
  userId?: string;
  sessionId: string;
  status: SurveyStatus;
  data: Partial<CustomerData>;
  metadata: SurveyDraftMetadata;
  validation: SurveyValidationState;
  encryption: EncryptionState;
}
```

**Key Features:**
- PHI-aware survey state management
- Automatic expiration (7 days for HIPAA)
- Field-level encryption tracking
- Validation state management

### 4. Multi-Factor Authentication (`MfaState`)
```typescript
interface MfaState {
  isRequired: boolean;
  isCompleted: boolean;
  availableMethods: MfaMethod[];
  attemptCount: number;
  maxAttempts: number;
  lockedUntil?: Date;
  challenge?: MfaChallenge;
}
```

**Supported Methods:**
- SMS verification
- Email verification
- TOTP (Time-based One-Time Password)
- Backup codes

### 5. HIPAA Consent Management (`HipaaConsent`)
```typescript
interface HipaaConsent {
  hasConsented: boolean;
  consentDate?: Date;
  consentVersion: string;
  consentDetails: {
    dataCollection: boolean;
    phiProcessing: boolean;
    dataRetention: boolean;
    dataSharing: boolean;
  };
  revokedAt?: Date;
  revokedReason?: string;
}
```

**Compliance Features:**
- Granular consent tracking
- Version management for consent changes
- Revocation tracking with reasons
- Digital signature support

## 🛡️ Security Utilities

### Session Risk Scoring
```typescript
function calculateSessionRiskScore(session: UserSession): number
```
- Evaluates session age, activity, and security events
- Returns risk score 0-100
- Used for determining when to require reauthentication

### Type Guards
```typescript
function isAuthenticated(authState: AuthState): boolean
function requiresMfa(authState: AuthState): boolean
function hasValidSession(session: UserSession): boolean
function hasPhiConsent(authState: AuthState): boolean
```

### PHI Access Control
```typescript
function requiresReauth(authState: AuthState, operation: string): boolean
```
**Reauth Thresholds:**
- PHI access: 30 minutes
- PHI modify: 15 minutes
- Export data: 10 minutes
- Delete data: 5 minutes

## 🔌 API Integration

### Authentication Endpoints
- `POST /api/auth/login` - User login with MFA support
- `POST /api/auth/mfa/verify` - MFA code verification
- `POST /api/auth/register` - User registration with consent
- `POST /api/auth/logout` - Session termination

### Session Management
- `GET /api/auth/session/validate` - Session validation
- `POST /api/auth/session/refresh` - Session refresh
- `GET /api/auth/sessions` - List active sessions
- `DELETE /api/auth/session/{id}` - Terminate session

### Survey Drafts
- `POST /api/survey/draft` - Create draft
- `PUT /api/survey/draft/{id}` - Save draft
- `GET /api/survey/draft/{id}` - Load draft
- `DELETE /api/survey/draft/{id}` - Delete draft

### Consent Management
- `POST /api/consent/grant` - Grant consent
- `POST /api/consent/revoke` - Revoke consent
- `GET /api/consent/status` - Get consent status

## 📊 Audit and Compliance

### Audit Trail Features
- Every PHI access logged with timestamp
- User identification for all actions
- IP address and device tracking
- Risk score calculation and storage
- Retention policy enforcement

### Security Events
- Suspicious login detection
- Multiple failure tracking
- New device alerts
- Location change monitoring
- Session hijacking detection

## 🔄 Usage Examples

### Basic Authentication Flow
```typescript
// Initialize auth state
const authState: AuthState = {
  status: 'unauthenticated',
  user: null,
  session: null,
  mfa: null,
  permissions: defaultPermissions,
  lastActivity: null,
  error: null
};

// Check if user is authenticated
if (isAuthenticated(authState)) {
  // User has valid session and can access protected resources
  if (hasPhiConsent(authState)) {
    // Can access PHI data
  }
}
```

### Survey Draft Management
```typescript
// Create survey draft
const draftRequest: CreateSurveyDraftRequest = {
  sessionId: currentSession.id,
  initialData: {},
  useCase: 'daily',
  source: 'web'
};

// Save draft with PHI tracking
const saveRequest: SaveSurveyDraftRequest = {
  draftId: draft.id,
  sessionId: currentSession.id,
  data: surveyData,
  currentStep: 3,
  isComplete: false
};
```

### MFA Verification
```typescript
// Verify MFA code
const mfaRequest: MfaVerificationRequest = {
  sessionId: currentSession.id,
  challengeId: challenge.id,
  code: userEnteredCode,
  method: 'totp'
};
```

## ⚠️ Important Security Notes

1. **Never store passwords in plain text** - Interfaces explicitly prevent this
2. **Always encrypt PHI data** - Use `EncryptionState` to track field encryption
3. **Audit all PHI access** - Use `createPhiAuditEntry()` utility
4. **Validate sessions frequently** - Use risk scoring for security decisions
5. **Expire drafts automatically** - 7-day maximum for HIPAA compliance
6. **Track consent carefully** - Version all consent changes

## 🔗 Integration Points

### With Existing V1 Interfaces
- Maintains compatibility with `CustomerData` interface
- Supports dual intake format validation
- Preserves all existing field names and types

### With Middleware
- Integrates with existing rate limiting
- Extends security headers
- Adds session validation middleware

### With API Routes
- `/api/formula/calculate` - Now requires session validation
- `/api/intake/validate` - Tracks PHI access in audit logs
- `/api/intake/convert` - Requires user consent for PHI processing

## 📈 Next Steps

1. **Implement API endpoints** using these contracts
2. **Create authentication middleware** for route protection
3. **Build frontend auth components** using these state interfaces
4. **Set up database schema** for sessions and audit logs
5. **Configure encryption services** for PHI protection
6. **Implement consent management UI** for HIPAA compliance

---

*This documentation supports the HIPAA-compliant authentication system for Personal Potions V2, ensuring secure handling of Protected Health Information (PHI) while maintaining excellent user experience.* 
/**
 * Personal Potions V2 - Authentication API Contracts
 * 
 * API request/response contracts for authentication, session management, and survey drafts
 * HIPAA-compliant endpoints with audit logging and security features
 */

import type {
  AuthState,
  User,
  UserSession,
  MfaChallenge,
  MfaMethod,
  SurveyDraftState,
  ConsentType,
  ConsentGrant,
  SecurityEvent,
  SessionAuditEntry,
  HipaaConsent,
  AuthError
} from './auth-interfaces';

// ================== AUTHENTICATION API CONTRACTS ==================

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceFingerprint?: string;
  captchaToken?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    session: UserSession;
    requiresMfa: boolean;
    mfaChallenge?: MfaChallenge;
    expiresAt: Date;
  };
  error?: AuthError;
}

/**
 * MFA verification request
 */
export interface MfaVerificationRequest {
  sessionId: string;
  challengeId: string;
  code: string;
  method: MfaMethod;
}

/**
 * MFA verification response
 */
export interface MfaVerificationResponse {
  success: boolean;
  data?: {
    isVerified: boolean;
    session: UserSession;
    backupCodes?: string[]; // Only returned on first setup
  };
  error?: AuthError;
}

/**
 * Registration request
 */
export interface RegistrationRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  timezone?: string;
  language?: string;
  hipaaConsent: HipaaConsent;
  captchaToken?: string;
}

/**
 * Registration response
 */
export interface RegistrationResponse {
  success: boolean;
  data?: {
    userId: string;
    verificationRequired: boolean;
    verificationMethod: 'email' | 'sms';
  };
  error?: AuthError;
}

/**
 * Email verification request
 */
export interface EmailVerificationRequest {
  email: string;
  verificationCode: string;
}

/**
 * Email verification response
 */
export interface EmailVerificationResponse {
  success: boolean;
  data?: {
    isVerified: boolean;
    canLogin: boolean;
  };
  error?: AuthError;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  captchaToken?: string;
}

/**
 * Password reset response
 */
export interface PasswordResetResponse {
  success: boolean;
  data?: {
    resetTokenSent: boolean;
    expiresAt: Date;
  };
  error?: AuthError;
}

/**
 * Password reset confirmation request
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password reset confirmation response
 */
export interface PasswordResetConfirmResponse {
  success: boolean;
  data?: {
    passwordChanged: boolean;
    requiresLogin: boolean;
  };
  error?: AuthError;
}

/**
 * Logout request
 */
export interface LogoutRequest {
  sessionId: string;
  allDevices?: boolean; // Logout from all devices
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
  data?: {
    loggedOut: boolean;
    sessionsTerminated: number;
  };
  error?: AuthError;
}

// ================== SESSION MANAGEMENT API CONTRACTS ==================

/**
 * Session validation request
 */
export interface SessionValidationRequest {
  sessionId: string;
  requiresFresh?: boolean; // Require recent authentication
  requiresMfa?: boolean; // Require MFA for sensitive operations
}

/**
 * Session validation response
 */
export interface SessionValidationResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    session: UserSession;
    user: User;
    requiresRefresh: boolean;
    requiresMfa: boolean;
  };
  error?: AuthError;
}

/**
 * Session refresh request
 */
export interface SessionRefreshRequest {
  sessionId: string;
  extendExpiration?: boolean;
}

/**
 * Session refresh response
 */
export interface SessionRefreshResponse {
  success: boolean;
  data?: {
    session: UserSession;
    expiresAt: Date;
  };
  error?: AuthError;
}

/**
 * Active sessions list request
 */
export interface ActiveSessionsRequest {
  userId: string;
}

/**
 * Active sessions list response
 */
export interface ActiveSessionsResponse {
  success: boolean;
  data?: {
    sessions: UserSession[];
    currentSessionId: string;
  };
  error?: AuthError;
}

/**
 * Terminate session request
 */
export interface TerminateSessionRequest {
  sessionId: string;
  targetSessionId?: string; // If different from current session
}

/**
 * Terminate session response
 */
export interface TerminateSessionResponse {
  success: boolean;
  data?: {
    terminated: boolean;
    sessionId: string;
  };
  error?: AuthError;
}

// ================== SURVEY DRAFT API CONTRACTS ==================

/**
 * Create survey draft request
 */
export interface CreateSurveyDraftRequest {
  sessionId: string;
  initialData?: Record<string, any>;
  useCase?: string;
  source?: 'web' | 'mobile' | 'api';
}

/**
 * Create survey draft response
 */
export interface CreateSurveyDraftResponse {
  success: boolean;
  data?: {
    draftId: string;
    expiresAt: Date;
  };
  error?: AuthError;
}

/**
 * Save survey draft request
 */
export interface SaveSurveyDraftRequest {
  draftId: string;
  sessionId: string;
  data: Record<string, any>;
  currentStep?: number;
  isComplete?: boolean;
}

/**
 * Save survey draft response
 */
export interface SaveSurveyDraftResponse {
  success: boolean;
  data?: {
    saved: boolean;
    draftId: string;
    lastModifiedAt: Date;
    completionPercentage: number;
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
  error?: AuthError;
}

/**
 * Load survey draft request
 */
export interface LoadSurveyDraftRequest {
  draftId: string;
  sessionId: string;
}

/**
 * Load survey draft response
 */
export interface LoadSurveyDraftResponse {
  success: boolean;
  data?: {
    draft: SurveyDraftState;
    isExpired: boolean;
  };
  error?: AuthError;
}

/**
 * List survey drafts request
 */
export interface ListSurveyDraftsRequest {
  sessionId: string;
  userId?: string;
  includeExpired?: boolean;
}

/**
 * List survey drafts response
 */
export interface ListSurveyDraftsResponse {
  success: boolean;
  data?: {
    drafts: Array<{
      id: string;
      createdAt: Date;
      lastModifiedAt: Date;
      expiresAt: Date;
      completionPercentage: number;
      status: string;
      useCase?: string;
    }>;
    total: number;
  };
  error?: AuthError;
}

/**
 * Delete survey draft request
 */
export interface DeleteSurveyDraftRequest {
  draftId: string;
  sessionId: string;
  reason?: string; // For audit purposes
}

/**
 * Delete survey draft response
 */
export interface DeleteSurveyDraftResponse {
  success: boolean;
  data?: {
    deleted: boolean;
    draftId: string;
    auditRecorded: boolean;
  };
  error?: AuthError;
}

// ================== CONSENT MANAGEMENT API CONTRACTS ==================

/**
 * Grant consent request
 */
export interface GrantConsentRequest {
  sessionId: string;
  consents: Array<{
    type: ConsentType;
    granted: boolean;
    version: string;
  }>;
  signature?: string; // Digital signature for legal compliance
}

/**
 * Grant consent response
 */
export interface GrantConsentResponse {
  success: boolean;
  data?: {
    consentsRecorded: number;
    effectiveDate: Date;
    auditRecorded: boolean;
  };
  error?: AuthError;
}

/**
 * Revoke consent request
 */
export interface RevokeConsentRequest {
  sessionId: string;
  consentType: ConsentType;
  reason: string;
  signature?: string;
}

/**
 * Revoke consent response
 */
export interface RevokeConsentResponse {
  success: boolean;
  data?: {
    revoked: boolean;
    effectiveDate: Date;
    dataRetentionDays: number;
    auditRecorded: boolean;
  };
  error?: AuthError;
}

/**
 * Get consent status request
 */
export interface GetConsentStatusRequest {
  sessionId: string;
  consentTypes?: ConsentType[];
}

/**
 * Get consent status response
 */
export interface GetConsentStatusResponse {
  success: boolean;
  data?: {
    consents: Record<ConsentType, ConsentGrant>;
    lastUpdated: Date;
  };
  error?: AuthError;
}

// ================== AUDIT AND SECURITY API CONTRACTS ==================

/**
 * Get audit log request
 */
export interface GetAuditLogRequest {
  sessionId: string;
  startDate?: Date;
  endDate?: Date;
  actions?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Get audit log response
 */
export interface GetAuditLogResponse {
  success: boolean;
  data?: {
    entries: SessionAuditEntry[];
    total: number;
    hasMore: boolean;
  };
  error?: AuthError;
}

/**
 * Report security event request
 */
export interface ReportSecurityEventRequest {
  sessionId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

/**
 * Report security event response
 */
export interface ReportSecurityEventResponse {
  success: boolean;
  data?: {
    eventId: string;
    recorded: boolean;
    requiresAction: boolean;
    recommendations: string[];
  };
  error?: AuthError;
}

/**
 * Get security events request
 */
export interface GetSecurityEventsRequest {
  sessionId: string;
  severity?: string[];
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get security events response
 */
export interface GetSecurityEventsResponse {
  success: boolean;
  data?: {
    events: SecurityEvent[];
    total: number;
    hasMore: boolean;
  };
  error?: AuthError;
} 
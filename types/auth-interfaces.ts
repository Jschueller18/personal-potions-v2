/**
 * Personal Potions V2 - Authentication State Interfaces
 * 
 * HIPAA-compliant authentication, session management, and survey draft interfaces
 * Supports multi-factor authentication, consent tracking, and audit logging
 */

import type { CustomerData } from './interfaces';
import type { UseCase } from './enums';

// ================== AUTHENTICATION ENUMS ==================

export type AuthStatus = 
  | 'unauthenticated'
  | 'authenticating' 
  | 'authenticated'
  | 'mfa-required'
  | 'session-expired'
  | 'locked-out';

export type SessionType = 
  | 'anonymous'
  | 'authenticated'
  | 'admin';

export type MfaMethod = 
  | 'sms'
  | 'email'
  | 'totp'
  | 'backup-codes';

export type ConsentType = 
  | 'data-collection'
  | 'phi-processing'
  | 'marketing'
  | 'analytics'
  | 'cookies';

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'mfa-attempt'
  | 'phi-access'
  | 'phi-modify'
  | 'survey-start'
  | 'survey-save'
  | 'survey-submit'
  | 'consent-grant'
  | 'consent-revoke'
  | 'password-change'
  | 'account-lock'
  | 'session-timeout';

export type SurveyStatus = 
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'abandoned'
  | 'expired';

// ================== CORE AUTHENTICATION INTERFACES ==================

/**
 * User authentication state
 */
export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: UserSession | null;
  mfa: MfaState | null;
  permissions: UserPermissions;
  lastActivity: Date | null;
  error: AuthError | null;
}

/**
 * User profile information
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  profile: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    createdAt: Date;
    lastLoginAt?: Date;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: NotificationPreferences;
  };
  hipaaConsent: HipaaConsent;
}

/**
 * HIPAA consent tracking
 */
export interface HipaaConsent {
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

/**
 * User session management
 */
export interface UserSession {
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
  // HIPAA: Audit trail for session
  auditTrail: SessionAuditEntry[];
}

/**
 * Session audit entry for HIPAA compliance
 */
export interface SessionAuditEntry {
  id: string;
  sessionId: string;
  action: AuditAction;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  resource?: string; // What was accessed/modified
  details?: Record<string, any>;
  riskScore?: number; // Security risk assessment
}

/**
 * Multi-factor authentication state
 */
export interface MfaState {
  isRequired: boolean;
  isCompleted: boolean;
  availableMethods: MfaMethod[];
  attemptCount: number;
  maxAttempts: number;
  lockedUntil?: Date;
  challenge?: MfaChallenge;
}

/**
 * MFA challenge details
 */
export interface MfaChallenge {
  id: string;
  method: MfaMethod;
  expiresAt: Date;
  delivered: boolean;
  attemptsRemaining: number;
  // Obfuscated delivery details (last 4 digits of phone, etc.)
  deliveryHint?: string;
}

/**
 * User permissions for role-based access
 */
export interface UserPermissions {
  canAccessPhi: boolean;
  canModifyPhi: boolean;
  canExportData: boolean;
  canDeleteData: boolean;
  canManageConsent: boolean;
  canViewAuditLogs: boolean;
  isAdmin: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: {
    enabled: boolean;
    security: boolean;
    marketing: boolean;
    surveyReminders: boolean;
  };
  sms: {
    enabled: boolean;
    security: boolean;
    surveyReminders: boolean;
  };
}

/**
 * Authentication error details
 */
export interface AuthError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  retryAfter?: Date;
  requiresMfa?: boolean;
}

// ================== SURVEY DRAFT INTERFACES ==================

/**
 * Survey draft state management
 */
export interface SurveyDraftState {
  id: string;
  userId?: string; // null for anonymous users
  sessionId: string;
  status: SurveyStatus;
  data: Partial<CustomerData>;
  metadata: SurveyDraftMetadata;
  validation: SurveyValidationState;
  encryption: EncryptionState;
}

/**
 * Survey draft metadata
 */
export interface SurveyDraftMetadata {
  createdAt: Date;
  lastModifiedAt: Date;
  expiresAt: Date;
  version: string;
  completionPercentage: number;
  currentStep: number;
  totalSteps: number;
  useCase?: UseCase;
  source: 'web' | 'mobile' | 'api';
  // HIPAA: Track all PHI access
  phiAccessLog: PhiAccessEntry[];
}

/**
 * PHI access tracking for HIPAA compliance
 */
export interface PhiAccessEntry {
  timestamp: Date;
  action: 'read' | 'write' | 'delete';
  field: string; // Which PHI field was accessed
  sessionId: string;
  userId?: string;
  ipAddress: string;
  previousValue?: string; // For audit trail (encrypted)
  newValue?: string; // For audit trail (encrypted)
}

/**
 * Survey validation state
 */
export interface SurveyValidationState {
  isValid: boolean;
  errors: FieldValidationError[];
  warnings: FieldValidationWarning[];
  requiredFields: string[];
  completedFields: string[];
}

/**
 * Field validation error
 */
export interface FieldValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Field validation warning
 */
export interface FieldValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * Encryption state for PHI protection
 */
export interface EncryptionState {
  isEncrypted: boolean;
  encryptionMethod: 'AES-256-GCM' | 'none';
  keyVersion: string;
  encryptedFields: string[];
  lastEncryptedAt?: Date;
}

// ================== AUTHENTICATION FLOW INTERFACES ==================

/**
 * Login flow state
 */
export interface LoginFlowState {
  step: 'credentials' | 'mfa' | 'complete';
  credentials: LoginCredentials | null;
  mfa: MfaFlowState | null;
  isLoading: boolean;
  error: AuthError | null;
  rememberMe: boolean;
}

/**
 * Login credentials (never stored in plain text)
 */
export interface LoginCredentials {
  email: string;
  // password is never stored in state - only during transmission
  hashedPassword?: never; // Explicitly prevent storage
}

/**
 * MFA flow state
 */
export interface MfaFlowState {
  selectedMethod: MfaMethod | null;
  challenge: MfaChallenge | null;
  isVerifying: boolean;
  error: AuthError | null;
}

/**
 * Registration flow state
 */
export interface RegistrationFlowState {
  step: 'details' | 'verification' | 'consent' | 'complete';
  userDetails: RegistrationDetails | null;
  verification: VerificationState | null;
  consent: ConsentFlowState | null;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * User registration details
 */
export interface RegistrationDetails {
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  // password is never stored in state
  hashedPassword?: never;
}

/**
 * Email/SMS verification state
 */
export interface VerificationState {
  method: 'email' | 'sms';
  isVerified: boolean;
  verificationCode?: string;
  expiresAt: Date;
  attemptsRemaining: number;
}

/**
 * Consent flow state for HIPAA compliance
 */
export interface ConsentFlowState {
  requiredConsents: ConsentItem[];
  grantedConsents: Record<ConsentType, ConsentGrant>;
  isComplete: boolean;
  error: AuthError | null;
}

/**
 * Individual consent item
 */
export interface ConsentItem {
  type: ConsentType;
  title: string;
  description: string;
  isRequired: boolean;
  version: string;
  effectiveDate: Date;
}

/**
 * Consent grant record
 */
export interface ConsentGrant {
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress: string;
  userAgent: string;
  // Digital signature for legal compliance
  signature?: string;
}

// ================== SESSION MANAGEMENT INTERFACES ==================

/**
 * Session management state
 */
export interface SessionManagementState {
  activeSessions: UserSession[];
  currentSession: UserSession | null;
  sessionLimits: SessionLimits;
  securityEvents: SecurityEvent[];
}

/**
 * Session limits configuration
 */
export interface SessionLimits {
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  inactivityTimeoutMinutes: number;
  absoluteTimeoutHours: number;
  requireMfaAfterMinutes: number;
}

/**
 * Security event for monitoring
 */
export interface SecurityEvent {
  id: string;
  type: 'suspicious-login' | 'multiple-failures' | 'new-device' | 'location-change' | 'session-hijack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details: Record<string, any>;
  resolved: boolean;
  actions: SecurityAction[];
}

/**
 * Security action taken
 */
export interface SecurityAction {
  type: 'block-ip' | 'require-mfa' | 'terminate-session' | 'notify-user' | 'escalate';
  timestamp: Date;
  result: 'success' | 'failed' | 'pending';
  details?: string;
} 
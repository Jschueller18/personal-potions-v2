/**
 * Personal Potions V2 - Authentication Utility Types
 * 
 * Utility types and helper functions for authentication state management
 * HIPAA-compliant helpers with security-focused utilities
 */

import type {
  AuthState,
  AuthStatus,
  UserSession,
  SurveyDraftState,
  MfaMethod,
  ConsentType,
  AuditAction,
  SecurityEvent
} from './auth-interfaces';

// ================== UTILITY TYPES ==================

/**
 * Session validation result
 */
export type SessionValidationResult = {
  isValid: boolean;
  isExpired: boolean;
  requiresRefresh: boolean;
  requiresMfa: boolean;
  riskScore: number;
  warnings: string[];
};

/**
 * PHI access permission check result
 */
export type PhiAccessPermission = {
  canAccess: boolean;
  canModify: boolean;
  requiresConsent: boolean;
  requiresReauth: boolean;
  auditRequired: boolean;
  reason?: string;
};

/**
 * Authentication flow step
 */
export type AuthFlowStep = 
  | { type: 'credentials'; required: ['email', 'password'] }
  | { type: 'mfa'; required: ['code']; methods: MfaMethod[] }
  | { type: 'consent'; required: ConsentType[] }
  | { type: 'complete'; user: string };

/**
 * Survey draft validation result
 */
export type SurveyDraftValidationResult = {
  isValid: boolean;
  completionPercentage: number;
  missingRequiredFields: string[];
  invalidFields: Array<{ field: string; error: string }>;
  securityWarnings: string[];
  canSubmit: boolean;
};

/**
 * Audit log filter options
 */
export type AuditLogFilter = {
  actions?: AuditAction[];
  startDate?: Date;
  endDate?: Date;
  riskScoreMin?: number;
  riskScoreMax?: number;
  includePhi?: boolean;
  sessionId?: string;
  userId?: string;
};

// ================== AUTHENTICATION STATE GUARDS ==================

/**
 * Type guard for authenticated user state
 */
export function isAuthenticated(authState: AuthState): authState is AuthState & { 
  user: NonNullable<AuthState['user']>;
  session: NonNullable<AuthState['session']>;
} {
  return authState.status === 'authenticated' && 
         authState.user !== null && 
         authState.session !== null;
}

/**
 * Type guard for MFA required state
 */
export function requiresMfa(authState: AuthState): authState is AuthState & {
  mfa: NonNullable<AuthState['mfa']>;
} {
  return authState.status === 'mfa-required' && authState.mfa !== null;
}

/**
 * Type guard for valid session
 */
export function hasValidSession(session: UserSession | null): session is UserSession {
  if (!session) return false;
  const now = new Date();
  return session.isActive && 
         session.expiresAt > now && 
         session.lastActivityAt > new Date(now.getTime() - (30 * 60 * 1000)); // 30 min activity window
}

/**
 * Type guard for PHI consent
 */
export function hasPhiConsent(authState: AuthState): boolean {
  return isAuthenticated(authState) && 
         authState.user.hipaaConsent.hasConsented &&
         authState.user.hipaaConsent.consentDetails.phiProcessing &&
         !authState.user.hipaaConsent.revokedAt;
}

/**
 * Type guard for survey draft expiration
 */
export function isDraftExpired(draft: SurveyDraftState): boolean {
  return new Date() > draft.metadata.expiresAt;
}

// ================== SECURITY UTILITY FUNCTIONS ==================

/**
 * Calculate session risk score based on various factors
 */
export function calculateSessionRiskScore(session: UserSession): number {
  let riskScore = 0;
  
  // Time-based risk factors
  const sessionAge = Date.now() - session.createdAt.getTime();
  const lastActivity = Date.now() - session.lastActivityAt.getTime();
  
  // Longer sessions increase risk
  if (sessionAge > 24 * 60 * 60 * 1000) riskScore += 30; // > 24 hours
  else if (sessionAge > 8 * 60 * 60 * 1000) riskScore += 15; // > 8 hours
  
  // Inactive sessions increase risk
  if (lastActivity > 60 * 60 * 1000) riskScore += 25; // > 1 hour inactive
  else if (lastActivity > 30 * 60 * 1000) riskScore += 10; // > 30 min inactive
  
  // Multiple security events increase risk
  const recentEvents = session.auditTrail.filter(
    entry => Date.now() - entry.timestamp.getTime() < 60 * 60 * 1000
  );
  riskScore += Math.min(recentEvents.length * 5, 30);
  
  // Device changes increase risk
  if (!session.deviceFingerprint) riskScore += 20;
  
  return Math.min(riskScore, 100); // Cap at 100
}

/**
 * Determine if reauthentication is required for sensitive operations
 */
export function requiresReauth(authState: AuthState, operation: 'phi-access' | 'phi-modify' | 'export-data' | 'delete-data'): boolean {
  if (!isAuthenticated(authState)) return true;
  
  const session = authState.session;
  const riskScore = calculateSessionRiskScore(session);
  
  // High-risk sessions always require reauth
  if (riskScore > 70) return true;
  
  // Time-based reauth requirements
  const lastActivity = Date.now() - session.lastActivityAt.getTime();
  const reauthThresholds = {
    'phi-access': 30 * 60 * 1000, // 30 minutes
    'phi-modify': 15 * 60 * 1000, // 15 minutes
    'export-data': 10 * 60 * 1000, // 10 minutes
    'delete-data': 5 * 60 * 1000,  // 5 minutes
  };
  
  return lastActivity > reauthThresholds[operation];
}

/**
 * Generate audit log entry for PHI access
 */
export function createPhiAuditEntry(
  sessionId: string,
  action: AuditAction,
  field: string,
  previousValue?: string,
  newValue?: string
): Omit<import('./auth-interfaces').PhiAccessEntry, 'timestamp' | 'ipAddress'> {
  return {
    action: action as 'read' | 'write' | 'delete',
    field,
    sessionId,
    previousValue: previousValue ? '[ENCRYPTED]' : undefined,
    newValue: newValue ? '[ENCRYPTED]' : undefined,
  };
}

// ================== VALIDATION UTILITY FUNCTIONS ==================

/**
 * Validate password strength for HIPAA compliance
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length requirements
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else feedback.push('Password must be at least 8 characters (12+ recommended)');
  
  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Include uppercase letters');
  
  if (/\d/.test(password)) score += 15;
  else feedback.push('Include numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  else feedback.push('Include special characters');
  
  // Common patterns (reduce score)
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    score -= 15;
    feedback.push('Avoid common sequences');
  }
  
  return {
    isValid: score >= 70 && feedback.length === 0,
    score: Math.max(0, Math.min(100, score)),
    feedback
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate MFA code format
 */
export function validateMfaCode(code: string, method: MfaMethod): boolean {
  switch (method) {
    case 'sms':
    case 'email':
      return /^\d{6}$/.test(code);
    case 'totp':
      return /^\d{6}$/.test(code);
    case 'backup-codes':
      return /^[a-f0-9]{8}$/i.test(code);
    default:
      return false;
  }
}

// ================== SURVEY DRAFT UTILITY FUNCTIONS ==================

/**
 * Calculate survey completion percentage
 */
export function calculateCompletionPercentage(
  data: Record<string, any>,
  requiredFields: string[]
): number {
  if (requiredFields.length === 0) return 0;
  
  const completedFields = requiredFields.filter(field => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });
  
  return Math.round((completedFields.length / requiredFields.length) * 100);
}

/**
 * Identify PHI fields in survey data
 */
export function identifyPhiFields(data: Record<string, any>): string[] {
  const phiFields = [
    'age', 'biological-sex', 'weight', 'conditions', 
    'menstrual-symptoms', 'sleep-issues', 'daily-water-intake',
    'sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake'
  ];
  
  return Object.keys(data).filter(field => phiFields.includes(field));
}

/**
 * Generate survey draft expiration date
 */
export function generateDraftExpiration(createdAt: Date = new Date()): Date {
  // Drafts expire after 7 days for HIPAA compliance
  const expirationDate = new Date(createdAt);
  expirationDate.setDate(expirationDate.getDate() + 7);
  return expirationDate;
}

// ================== SECURITY EVENT UTILITY FUNCTIONS ==================

/**
 * Classify security event severity
 */
export function classifySecurityEventSeverity(
  eventType: SecurityEvent['type'],
  details: Record<string, any>
): SecurityEvent['severity'] {
  switch (eventType) {
    case 'session-hijack':
      return 'critical';
    case 'multiple-failures':
      return details.attemptCount > 10 ? 'high' : 'medium';
    case 'suspicious-login':
      return details.riskScore > 80 ? 'high' : 'medium';
    case 'new-device':
    case 'location-change':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Generate security recommendations based on event
 */
export function generateSecurityRecommendations(event: SecurityEvent): string[] {
  const recommendations: string[] = [];
  
  switch (event.type) {
    case 'session-hijack':
      recommendations.push('Terminate all active sessions immediately');
      recommendations.push('Force password reset');
      recommendations.push('Enable MFA if not already active');
      break;
    case 'multiple-failures':
      recommendations.push('Temporarily lock account');
      recommendations.push('Require CAPTCHA for login attempts');
      recommendations.push('Send security alert to user');
      break;
    case 'suspicious-login':
      recommendations.push('Require additional verification');
      recommendations.push('Monitor session closely');
      break;
    case 'new-device':
      recommendations.push('Send device verification email');
      recommendations.push('Require MFA for sensitive operations');
      break;
    case 'location-change':
      recommendations.push('Send location alert to user');
      recommendations.push('Verify identity with security questions');
      break;
  }
  
  return recommendations;
} 
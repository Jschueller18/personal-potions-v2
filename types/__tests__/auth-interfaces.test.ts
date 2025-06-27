/**
 * Personal Potions V2 - Authentication Interfaces Tests
 * 
 * Comprehensive tests for HIPAA-compliant authentication state interfaces
 * Tests type safety, validation, and business logic compliance
 */

import {
  AuthState,
  AuthStatus,
  User,
  UserSession,
  SessionType,
  MfaState,
  MfaMethod,
  MfaChallenge,
  UserPermissions,
  HipaaConsent,
  ConsentType,
  SurveyDraftState,
  SurveyStatus,
  SurveyDraftMetadata,
  SurveyValidationState,
  EncryptionState,
  LoginFlowState,
  RegistrationFlowState,
  MfaFlowState,
  ConsentFlowState,
  SessionManagementState,
  SecurityEvent,
  AuditAction,
  PhiAccessEntry,
  SessionAuditEntry
} from '../auth-interfaces';
import { CustomerData } from '../interfaces';

describe('Authentication State Interfaces', () => {
  
  // ================== MOCK DATA FACTORIES ==================
  
  const createMockUser = (): User => ({
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      createdAt: new Date(),
      lastLoginAt: new Date()
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: {
          enabled: true,
          security: true,
          marketing: false,
          surveyReminders: true
        },
        sms: {
          enabled: false,
          security: true,
          surveyReminders: false
        }
      }
    },
    hipaaConsent: {
      hasConsented: true,
      consentDate: new Date(),
      consentVersion: '1.0',
      consentDetails: {
        dataCollection: true,
        phiProcessing: true,
        dataRetention: true,
        dataSharing: false
      }
    }
  });

  const createMockSession = (): UserSession => ({
    id: 'session-123',
    userId: 'user-123',
    type: 'authenticated' as SessionType,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    lastActivityAt: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    isActive: true,
    deviceFingerprint: 'fp-123',
    auditTrail: []
  });

  const createMockMfaState = (): MfaState => ({
    isRequired: true,
    isCompleted: false,
    availableMethods: ['email', 'sms'] as MfaMethod[],
    attemptCount: 0,
    maxAttempts: 3,
    challenge: {
      id: 'challenge-123',
      method: 'email' as MfaMethod,
      expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
      delivered: true,
      attemptsRemaining: 3,
      deliveryHint: 'test***@example.com'
    }
  });

  // ================== AUTH STATE TESTS ==================

  describe('AuthState Interface', () => {
    test('should create valid authenticated state', () => {
      const authState: AuthState = {
        status: 'authenticated' as AuthStatus,
        user: createMockUser(),
        session: createMockSession(),
        mfa: null,
        permissions: {
          canAccessPhi: true,
          canModifyPhi: true,
          canExportData: false,
          canDeleteData: false,
          canManageConsent: true,
          canViewAuditLogs: false,
          isAdmin: false
        },
        lastActivity: new Date(),
        error: null
      };

      expect(authState.status).toBe('authenticated');
      expect(authState.user).toBeTruthy();
      expect(authState.session).toBeTruthy();
      expect(authState.permissions.canAccessPhi).toBe(true);
    });

    test('should create valid unauthenticated state', () => {
      const authState: AuthState = {
        status: 'unauthenticated' as AuthStatus,
        user: null,
        session: null,
        mfa: null,
        permissions: {
          canAccessPhi: false,
          canModifyPhi: false,
          canExportData: false,
          canDeleteData: false,
          canManageConsent: false,
          canViewAuditLogs: false,
          isAdmin: false
        },
        lastActivity: null,
        error: null
      };

      expect(authState.status).toBe('unauthenticated');
      expect(authState.user).toBeNull();
      expect(authState.session).toBeNull();
      expect(authState.permissions.canAccessPhi).toBe(false);
    });

    test('should handle MFA required state', () => {
      const authState: AuthState = {
        status: 'mfa-required' as AuthStatus,
        user: createMockUser(),
        session: createMockSession(),
        mfa: createMockMfaState(),
        permissions: {
          canAccessPhi: false, // Should be false until MFA complete
          canModifyPhi: false,
          canExportData: false,
          canDeleteData: false,
          canManageConsent: false,
          canViewAuditLogs: false,
          isAdmin: false
        },
        lastActivity: new Date(),
        error: null
      };

      expect(authState.status).toBe('mfa-required');
      expect(authState.mfa?.isRequired).toBe(true);
      expect(authState.mfa?.isCompleted).toBe(false);
      expect(authState.permissions.canAccessPhi).toBe(false);
    });
  });

  // ================== USER SESSION TESTS ==================

  describe('UserSession Interface', () => {
    test('should create valid session with audit trail', () => {
      const auditEntry: SessionAuditEntry = {
        id: 'audit-123',
        sessionId: 'session-123',
        action: 'login' as AuditAction,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        resource: 'auth/login',
        details: { loginMethod: 'email' },
        riskScore: 15
      };

      const session: UserSession = {
        ...createMockSession(),
        auditTrail: [auditEntry]
      };

      expect(session.id).toBeTruthy();
      expect(session.isActive).toBe(true);
      expect(session.auditTrail).toHaveLength(1);
      expect(session.auditTrail[0].action).toBe('login');
      expect(session.auditTrail[0].riskScore).toBe(15);
    });

    test('should handle session expiration', () => {
      const expiredSession: UserSession = {
        ...createMockSession(),
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        isActive: false
      };

      expect(expiredSession.expiresAt.getTime()).toBeLessThan(Date.now());
      expect(expiredSession.isActive).toBe(false);
    });
  });

  // ================== SURVEY DRAFT TESTS ==================

  describe('SurveyDraftState Interface', () => {
    test('should create valid survey draft with PHI protection', () => {
      const phiAccessEntry: PhiAccessEntry = {
        timestamp: new Date(),
        action: 'write',
        field: 'biological-sex',
        sessionId: 'session-123',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        newValue: 'encrypted-value-123'
      };

      const surveyDraft: SurveyDraftState = {
        id: 'draft-123',
        userId: 'user-123',
        sessionId: 'session-123',
        status: 'in-progress' as SurveyStatus,
        data: {
          'biological-sex': 'female',
          'activity-level': 'moderately-active'
        } as Partial<CustomerData>,
        metadata: {
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
          version: '1.0',
          completionPercentage: 25,
          currentStep: 2,
          totalSteps: 5,
          useCase: 'daily',
          source: 'web',
          phiAccessLog: [phiAccessEntry]
        },
        validation: {
          isValid: false,
          errors: [{
            field: 'age',
            code: 'REQUIRED',
            message: 'Age is required',
            severity: 'error'
          }],
          warnings: [],
          requiredFields: ['biological-sex', 'age', 'activity-level'],
          completedFields: ['biological-sex', 'activity-level']
        },
        encryption: {
          isEncrypted: true,
          encryptionMethod: 'AES-256-GCM',
          keyVersion: 'v1',
          encryptedFields: ['biological-sex'],
          lastEncryptedAt: new Date()
        }
      };

      expect(surveyDraft.status).toBe('in-progress');
      expect(surveyDraft.metadata.completionPercentage).toBe(25);
      expect(surveyDraft.metadata.phiAccessLog).toHaveLength(1);
      expect(surveyDraft.validation.isValid).toBe(false);
      expect(surveyDraft.encryption.isEncrypted).toBe(true);
      expect(surveyDraft.encryption.encryptedFields).toContain('biological-sex');
    });

    test('should handle anonymous survey drafts', () => {
      const anonymousDraft: SurveyDraftState = {
        id: 'draft-anon-123',
        userId: undefined, // Anonymous user
        sessionId: 'session-anon-123',
        status: 'in-progress' as SurveyStatus,
        data: {},
        metadata: {
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 3600000), // 24 hours for anonymous
          version: '1.0',
          completionPercentage: 0,
          currentStep: 1,
          totalSteps: 5,
          source: 'web',
          phiAccessLog: []
        },
        validation: {
          isValid: false,
          errors: [],
          warnings: [],
          requiredFields: [],
          completedFields: []
        },
        encryption: {
          isEncrypted: false,
          encryptionMethod: 'none',
          keyVersion: 'v1',
          encryptedFields: []
        }
      };

      expect(anonymousDraft.userId).toBeUndefined();
      expect(anonymousDraft.encryption.isEncrypted).toBe(false);
      expect(anonymousDraft.metadata.phiAccessLog).toHaveLength(0);
    });
  });

  // ================== AUTH FLOW TESTS ==================

  describe('LoginFlowState Interface', () => {
    test('should create valid login flow state', () => {
      const loginFlow: LoginFlowState = {
        step: 'credentials',
        credentials: {
          email: 'test@example.com'
        },
        mfa: null,
        isLoading: false,
        error: null,
        rememberMe: true
      };

      expect(loginFlow.step).toBe('credentials');
      expect(loginFlow.credentials?.email).toBe('test@example.com');
      expect(loginFlow.rememberMe).toBe(true);
    });

    test('should handle MFA step', () => {
      const loginFlow: LoginFlowState = {
        step: 'mfa',
        credentials: {
          email: 'test@example.com'
        },
        mfa: {
          selectedMethod: 'email' as MfaMethod,
          challenge: {
            id: 'challenge-123',
            method: 'email' as MfaMethod,
            expiresAt: new Date(Date.now() + 300000),
            delivered: true,
            attemptsRemaining: 3,
            deliveryHint: 'test***@example.com'
          },
          isVerifying: false,
          error: null
        },
        isLoading: false,
        error: null,
        rememberMe: false
      };

      expect(loginFlow.step).toBe('mfa');
      expect(loginFlow.mfa?.selectedMethod).toBe('email');
      expect(loginFlow.mfa?.challenge?.delivered).toBe(true);
    });
  });

  describe('RegistrationFlowState Interface', () => {
    test('should create valid registration flow', () => {
      const registrationFlow: RegistrationFlowState = {
        step: 'details',
        userDetails: {
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1995-05-15')
        },
        verification: null,
        consent: null,
        isLoading: false,
        error: null
      };

      expect(registrationFlow.step).toBe('details');
      expect(registrationFlow.userDetails?.email).toBe('newuser@example.com');
      expect(registrationFlow.userDetails?.firstName).toBe('Jane');
    });

    test('should handle consent step', () => {
      const registrationFlow: RegistrationFlowState = {
        step: 'consent',
        userDetails: {
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        verification: {
          method: 'email',
          isVerified: true,
          expiresAt: new Date(Date.now() + 3600000),
          attemptsRemaining: 2
        },
        consent: {
          requiredConsents: [{
            type: 'phi-processing' as ConsentType,
            title: 'PHI Processing Consent',
            description: 'Allow processing of protected health information',
            isRequired: true,
            version: '1.0',
            effectiveDate: new Date()
          }],
          grantedConsents: {
            'phi-processing': {
              granted: true,
              timestamp: new Date(),
              version: '1.0',
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0 Test Browser',
              signature: 'digital-signature-123'
            }
          } as Record<ConsentType, any>,
          isComplete: true,
          error: null
        },
        isLoading: false,
        error: null
      };

      expect(registrationFlow.step).toBe('consent');
      expect(registrationFlow.consent?.isComplete).toBe(true);
      expect(registrationFlow.consent?.grantedConsents['phi-processing'].granted).toBe(true);
    });
  });

  // ================== HIPAA CONSENT TESTS ==================

  describe('HipaaConsent Interface', () => {
    test('should create valid HIPAA consent', () => {
      const consent: HipaaConsent = {
        hasConsented: true,
        consentDate: new Date(),
        consentVersion: '1.2',
        consentDetails: {
          dataCollection: true,
          phiProcessing: true,
          dataRetention: true,
          dataSharing: false
        }
      };

      expect(consent.hasConsented).toBe(true);
      expect(consent.consentDetails.phiProcessing).toBe(true);
      expect(consent.consentDetails.dataSharing).toBe(false);
      expect(consent.revokedAt).toBeUndefined();
    });

    test('should handle consent revocation', () => {
      const revokedConsent: HipaaConsent = {
        hasConsented: false,
        consentDate: new Date('2023-01-01'),
        consentVersion: '1.2',
        consentDetails: {
          dataCollection: false,
          phiProcessing: false,
          dataRetention: false,
          dataSharing: false
        },
        revokedAt: new Date(),
        revokedReason: 'User requested data deletion'
      };

      expect(revokedConsent.hasConsented).toBe(false);
      expect(revokedConsent.revokedAt).toBeTruthy();
      expect(revokedConsent.revokedReason).toBe('User requested data deletion');
    });
  });

  // ================== SESSION MANAGEMENT TESTS ==================

  describe('SessionManagementState Interface', () => {
    test('should create valid session management state', () => {
      const sessionManagement: SessionManagementState = {
        activeSessions: [createMockSession()],
        currentSession: createMockSession(),
        sessionLimits: {
          maxConcurrentSessions: 3,
          sessionTimeoutMinutes: 60,
          inactivityTimeoutMinutes: 30,
          absoluteTimeoutHours: 8,
          requireMfaAfterMinutes: 15
        },
        securityEvents: [{
          id: 'event-123',
          type: 'new-device',
          severity: 'medium',
          timestamp: new Date(),
          details: { deviceFingerprint: 'new-fp-456' },
          resolved: false,
          actions: [{
            type: 'require-mfa',
            timestamp: new Date(),
            result: 'success'
          }]
        }]
      };

      expect(sessionManagement.activeSessions).toHaveLength(1);
      expect(sessionManagement.sessionLimits.maxConcurrentSessions).toBe(3);
      expect(sessionManagement.securityEvents).toHaveLength(1);
      expect(sessionManagement.securityEvents[0].type).toBe('new-device');
    });
  });

  // ================== BUSINESS LOGIC TESTS ==================

  describe('Business Logic Validation', () => {
    test('should enforce HIPAA compliance rules', () => {
      const userWithoutConsent: User = {
        ...createMockUser(),
        hipaaConsent: {
          hasConsented: false,
          consentVersion: '1.0',
          consentDetails: {
            dataCollection: false,
            phiProcessing: false,
            dataRetention: false,
            dataSharing: false
          }
        }
      };

      const authState: AuthState = {
        status: 'authenticated' as AuthStatus,
        user: userWithoutConsent,
        session: createMockSession(),
        mfa: null,
        permissions: {
          canAccessPhi: false, // Should be false without consent
          canModifyPhi: false,
          canExportData: false,
          canDeleteData: false,
          canManageConsent: true,
          canViewAuditLogs: false,
          isAdmin: false
        },
        lastActivity: new Date(),
        error: null
      };

      expect(authState.user.hipaaConsent.hasConsented).toBe(false);
      expect(authState.permissions.canAccessPhi).toBe(false);
    });

    test('should handle survey draft expiration', () => {
      const expiredDraft: SurveyDraftState = {
        id: 'draft-expired-123',
        userId: 'user-123',
        sessionId: 'session-123',
        status: 'expired' as SurveyStatus,
        data: {},
        metadata: {
          createdAt: new Date(Date.now() - 8 * 24 * 3600000), // 8 days ago
          lastModifiedAt: new Date(Date.now() - 7 * 24 * 3600000), // 7 days ago
          expiresAt: new Date(Date.now() - 24 * 3600000), // 1 day ago
          version: '1.0',
          completionPercentage: 50,
          currentStep: 3,
          totalSteps: 5,
          source: 'web',
          phiAccessLog: []
        },
        validation: {
          isValid: false,
          errors: [],
          warnings: [],
          requiredFields: [],
          completedFields: []
        },
        encryption: {
          isEncrypted: false,
          encryptionMethod: 'none',
          keyVersion: 'v1',
          encryptedFields: []
        }
      };

      expect(expiredDraft.status).toBe('expired');
      expect(expiredDraft.metadata.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    test('should validate MFA attempt limits', () => {
      const lockedMfaState: MfaState = {
        isRequired: true,
        isCompleted: false,
        availableMethods: ['email'] as MfaMethod[],
        attemptCount: 3,
        maxAttempts: 3,
        lockedUntil: new Date(Date.now() + 900000), // 15 minutes from now
        challenge: null
      };

      expect(lockedMfaState.attemptCount).toBe(lockedMfaState.maxAttempts);
      expect(lockedMfaState.lockedUntil).toBeTruthy();
      expect(lockedMfaState.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // ================== TYPE SAFETY TESTS ==================

  describe('Type Safety', () => {
    test('should enforce correct enum values', () => {
      const validStatuses: AuthStatus[] = [
        'unauthenticated',
        'authenticating',
        'authenticated',
        'mfa-required',
        'session-expired',
        'locked-out'
      ];

      validStatuses.forEach(status => {
        const authState: AuthState = {
          status,
          user: null,
          session: null,
          mfa: null,
          permissions: {
            canAccessPhi: false,
            canModifyPhi: false,
            canExportData: false,
            canDeleteData: false,
            canManageConsent: false,
            canViewAuditLogs: false,
            isAdmin: false
          },
          lastActivity: null,
          error: null
        };

        expect(authState.status).toBe(status);
      });
    });

    test('should enforce MFA method types', () => {
      const validMethods: MfaMethod[] = ['sms', 'email', 'totp', 'backup-codes'];
      
      validMethods.forEach(method => {
        const mfaState: MfaState = {
          isRequired: true,
          isCompleted: false,
          availableMethods: [method],
          attemptCount: 0,
          maxAttempts: 3
        };

        expect(mfaState.availableMethods).toContain(method);
      });
    });
  });
}); 
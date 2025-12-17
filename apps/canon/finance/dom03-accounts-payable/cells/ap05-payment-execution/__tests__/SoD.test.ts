/**
 * Segregation of Duties Tests
 * 
 * AP-05 Control Tests: SoD Violations = 0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMemoryPolicyAdapter,
  setUserRoles,
  clearPolicyData,
} from '@aibos/kernel-adapters';

describe('Segregation of Duties (SoD)', () => {
  let policyAdapter: ReturnType<typeof createMemoryPolicyAdapter>;

  beforeEach(() => {
    clearPolicyData();
    policyAdapter = createMemoryPolicyAdapter();
  });

  // ==========================================================================
  // CORE SOD RULE: MAKER != CHECKER
  // ==========================================================================

  describe('test_creator_cannot_approve_own_payment', () => {
    it('rejects self-approval', async () => {
      const creatorId = 'user-001';
      const approverId = 'user-001'; // Same user

      const result = await policyAdapter.evaluateSoD(creatorId, approverId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maker cannot be Checker');
      expect(result.violation?.violationType).toBe('SELF_APPROVAL');
    });

    it('allows different user to approve', async () => {
      const creatorId = 'user-001';
      const approverId = 'user-002'; // Different user

      const result = await policyAdapter.evaluateSoD(creatorId, approverId);

      expect(result.allowed).toBe(true);
    });
  });

  // ==========================================================================
  // APPROVAL LIMITS
  // ==========================================================================

  describe('Approval Limits', () => {
    beforeEach(() => {
      setUserRoles('manager-001', ['ROLE_MANAGER']);
      setUserRoles('director-001', ['ROLE_DIRECTOR']);
      setUserRoles('vp-001', ['ROLE_VP']);
      setUserRoles('cfo-001', ['ROLE_CFO']);
      setUserRoles('staff-001', ['ROLE_STAFF']);
    });

    it('manager can approve amounts up to $25,000', async () => {
      const result = await policyAdapter.canApprove(
        'manager-001',
        '10000.00',
        'USD',
        'tenant-001',
        1
      );

      expect(result.allowed).toBe(true);
    });

    it('staff cannot approve high-value payments', async () => {
      const result = await policyAdapter.canApprove(
        'staff-001',
        '50000.00',
        'USD',
        'tenant-001',
        1
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('requires approval');
    });

    it('Director required for amounts > $25,000 up to $50,000', async () => {
      const requirements = await policyAdapter.getApprovalRequirements(
        '30000.00',
        'USD',
        'tenant-001'
      );

      expect(requirements.requiredRoles[0]).toContain('ROLE_DIRECTOR');
      expect(requirements.requiresExecutive).toBe(false);
    });

    it('VP required for amounts > $50,000 up to $100,000', async () => {
      const requirements = await policyAdapter.getApprovalRequirements(
        '75000.00',
        'USD',
        'tenant-001'
      );

      expect(requirements.requiredRoles[0]).toContain('ROLE_VP');
      expect(requirements.requiresExecutive).toBe(true);
    });

    it('CFO required for amounts > $100,000', async () => {
      const requirements = await policyAdapter.getApprovalRequirements(
        '150000.00',
        'USD',
        'tenant-001'
      );

      expect(requirements.requiredRoles[0]).toEqual(['ROLE_CFO']);
      expect(requirements.requiresExecutive).toBe(true);
    });

    it('auto-approve for small amounts (< $500)', async () => {
      const requirements = await policyAdapter.getApprovalRequirements(
        '250.00',
        'USD',
        'tenant-001'
      );

      expect(requirements.levels).toBe(0); // No approval needed
    });
  });

  // ==========================================================================
  // SOD EXEMPTIONS (for testing only)
  // ==========================================================================

  describe('SoD Exemptions', () => {
    it('exempted pairs can self-approve (test scenario only)', async () => {
      const { addSoDExemption } = await import('@aibos/kernel-adapters');

      const userId = 'system-user';
      addSoDExemption(userId, userId);

      const result = await policyAdapter.evaluateSoD(userId, userId);

      expect(result.allowed).toBe(true);
      expect(result.policyCode).toBe('POLICY_SOD_EXEMPT');
    });
  });
});

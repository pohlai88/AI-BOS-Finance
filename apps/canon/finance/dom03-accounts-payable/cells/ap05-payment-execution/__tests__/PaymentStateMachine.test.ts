/**
 * Payment State Machine Tests
 * 
 * AP-05 Control Tests: State Machine Integrity
 */

import { describe, it, expect } from 'vitest';
import {
  PaymentStateMachine,
  IllegalStateTransitionError,
} from '@aibos/canon-governance';

describe('PaymentStateMachine', () => {
  // ==========================================================================
  // STATE TRANSITION TESTS
  // ==========================================================================

  describe('canTransition', () => {
    it('draft can transition to pending_approval via submit', () => {
      expect(PaymentStateMachine.canTransition('draft', 'submit')).toBe(true);
    });

    it('pending_approval can transition to approved via approve', () => {
      expect(PaymentStateMachine.canTransition('pending_approval', 'approve')).toBe(true);
    });

    it('pending_approval can transition to rejected via reject', () => {
      expect(PaymentStateMachine.canTransition('pending_approval', 'reject')).toBe(true);
    });

    it('approved can transition to processing via execute', () => {
      expect(PaymentStateMachine.canTransition('approved', 'execute')).toBe(true);
    });

    it('processing can transition to completed via complete', () => {
      expect(PaymentStateMachine.canTransition('processing', 'complete')).toBe(true);
    });

    it('processing can transition to failed via fail', () => {
      expect(PaymentStateMachine.canTransition('processing', 'fail')).toBe(true);
    });

    it('failed can transition to pending_approval via retry', () => {
      expect(PaymentStateMachine.canTransition('failed', 'retry')).toBe(true);
    });
  });

  describe('getNextStatus', () => {
    it('returns correct next status for valid transitions', () => {
      expect(PaymentStateMachine.getNextStatus('draft', 'submit')).toBe('pending_approval');
      expect(PaymentStateMachine.getNextStatus('pending_approval', 'approve')).toBe('approved');
      expect(PaymentStateMachine.getNextStatus('pending_approval', 'reject')).toBe('rejected');
      expect(PaymentStateMachine.getNextStatus('approved', 'execute')).toBe('processing');
      expect(PaymentStateMachine.getNextStatus('processing', 'complete')).toBe('completed');
      expect(PaymentStateMachine.getNextStatus('processing', 'fail')).toBe('failed');
      expect(PaymentStateMachine.getNextStatus('failed', 'retry')).toBe('pending_approval');
    });

    it('throws IllegalStateTransitionError for invalid transitions', () => {
      expect(() => PaymentStateMachine.getNextStatus('draft', 'approve'))
        .toThrow(IllegalStateTransitionError);

      expect(() => PaymentStateMachine.getNextStatus('completed', 'retry'))
        .toThrow(IllegalStateTransitionError);

      expect(() => PaymentStateMachine.getNextStatus('rejected', 'approve'))
        .toThrow(IllegalStateTransitionError);
    });
  });

  // ==========================================================================
  // TERMINAL STATE TESTS
  // ==========================================================================

  describe('isTerminal', () => {
    it('rejected is a terminal state', () => {
      expect(PaymentStateMachine.isTerminal('rejected')).toBe(true);
    });

    it('completed is a terminal state', () => {
      expect(PaymentStateMachine.isTerminal('completed')).toBe(true);
    });

    it('draft is NOT a terminal state', () => {
      expect(PaymentStateMachine.isTerminal('draft')).toBe(false);
    });

    it('failed is NOT a terminal state (can retry)', () => {
      expect(PaymentStateMachine.isTerminal('failed')).toBe(false);
    });
  });

  // ==========================================================================
  // IMMUTABILITY TESTS
  // ==========================================================================

  describe('isImmutable', () => {
    it('approved is immutable', () => {
      expect(PaymentStateMachine.isImmutable('approved')).toBe(true);
    });

    it('processing is immutable', () => {
      expect(PaymentStateMachine.isImmutable('processing')).toBe(true);
    });

    it('completed is immutable', () => {
      expect(PaymentStateMachine.isImmutable('completed')).toBe(true);
    });

    it('draft is NOT immutable', () => {
      expect(PaymentStateMachine.isImmutable('draft')).toBe(false);
    });

    it('pending_approval is NOT immutable', () => {
      expect(PaymentStateMachine.isImmutable('pending_approval')).toBe(false);
    });
  });

  // ==========================================================================
  // PATH VALIDATION TESTS
  // ==========================================================================

  describe('validateActionSequence', () => {
    it('validates happy path: draft → pending → approved → processing → completed', () => {
      const result = PaymentStateMachine.validateActionSequence(
        'draft',
        ['submit', 'approve', 'execute', 'complete']
      );
      expect(result.valid).toBe(true);
      expect(result.endStatus).toBe('completed');
    });

    it('validates rejection path: draft → pending → rejected', () => {
      const result = PaymentStateMachine.validateActionSequence(
        'draft',
        ['submit', 'reject']
      );
      expect(result.valid).toBe(true);
      expect(result.endStatus).toBe('rejected');
    });

    it('validates retry path: failed → pending → approved', () => {
      const result = PaymentStateMachine.validateActionSequence(
        'failed',
        ['retry', 'approve']
      );
      expect(result.valid).toBe(true);
      expect(result.endStatus).toBe('approved');
    });

    it('rejects invalid sequences', () => {
      const result = PaymentStateMachine.validateActionSequence(
        'draft',
        ['approve'] // Can't approve from draft
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot perform "approve" from "draft"');
    });
  });

  // ==========================================================================
  // AVAILABLE ACTIONS TESTS
  // ==========================================================================

  describe('getAvailableActions', () => {
    it('draft has only submit action', () => {
      expect(PaymentStateMachine.getAvailableActions('draft')).toEqual(['submit']);
    });

    it('pending_approval has approve and reject actions', () => {
      const actions = PaymentStateMachine.getAvailableActions('pending_approval');
      expect(actions).toContain('approve');
      expect(actions).toContain('reject');
    });

    it('terminal states have no actions', () => {
      expect(PaymentStateMachine.getAvailableActions('completed')).toEqual([]);
      expect(PaymentStateMachine.getAvailableActions('rejected')).toEqual([]);
    });
  });
});

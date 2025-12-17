/**
 * InvoiceStateMachine Unit Tests
 * 
 * Tests for the invoice state machine transitions.
 */

import { describe, it, expect } from 'vitest';
import {
  InvoiceStateMachine,
  IllegalInvoiceStateTransitionError,
} from '../InvoiceStateMachine';

describe('InvoiceStateMachine', () => {
  describe('State Transitions', () => {
    it('should allow draft -> submitted transition', () => {
      expect(InvoiceStateMachine.canTransition('draft', 'submit')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('draft', 'submit')).toBe('submitted');
    });

    it('should allow submitted -> matched transition', () => {
      expect(InvoiceStateMachine.canTransition('submitted', 'match')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('submitted', 'match')).toBe('matched');
    });

    it('should allow submitted -> matched via skip_match', () => {
      expect(InvoiceStateMachine.canTransition('submitted', 'skip_match')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('submitted', 'skip_match')).toBe('matched');
    });

    it('should allow matched -> approved transition', () => {
      expect(InvoiceStateMachine.canTransition('matched', 'approve')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('matched', 'approve')).toBe('approved');
    });

    it('should allow approved -> posted transition', () => {
      expect(InvoiceStateMachine.canTransition('approved', 'post')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('approved', 'post')).toBe('posted');
    });

    it('should allow posted -> paid transition', () => {
      expect(InvoiceStateMachine.canTransition('posted', 'pay')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('posted', 'pay')).toBe('paid');
    });

    it('should allow paid -> closed transition', () => {
      expect(InvoiceStateMachine.canTransition('paid', 'close')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('paid', 'close')).toBe('closed');
    });
  });

  describe('Rejection Transitions', () => {
    it('should allow submitted -> draft rejection', () => {
      expect(InvoiceStateMachine.canTransition('submitted', 'reject')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('submitted', 'reject')).toBe('draft');
    });

    it('should allow matched -> draft rejection', () => {
      expect(InvoiceStateMachine.canTransition('matched', 'reject')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('matched', 'reject')).toBe('draft');
    });

    it('should allow approved -> draft rejection', () => {
      expect(InvoiceStateMachine.canTransition('approved', 'reject')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('approved', 'reject')).toBe('draft');
    });
  });

  describe('Void Transitions', () => {
    it('should allow approved -> voided', () => {
      expect(InvoiceStateMachine.canTransition('approved', 'void')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('approved', 'void')).toBe('voided');
    });

    it('should allow posted -> voided', () => {
      expect(InvoiceStateMachine.canTransition('posted', 'void')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('posted', 'void')).toBe('voided');
    });

    it('should allow paid -> voided', () => {
      expect(InvoiceStateMachine.canTransition('paid', 'void')).toBe(true);
      expect(InvoiceStateMachine.getNextStatus('paid', 'void')).toBe('voided');
    });
  });

  describe('Invalid Transitions', () => {
    it('should not allow draft -> approved directly', () => {
      expect(InvoiceStateMachine.canTransition('draft', 'approve')).toBe(false);
    });

    it('should not allow draft -> posted directly', () => {
      expect(InvoiceStateMachine.canTransition('draft', 'post')).toBe(false);
    });

    it('should not allow any transition from closed', () => {
      expect(InvoiceStateMachine.canTransition('closed', 'submit')).toBe(false);
      expect(InvoiceStateMachine.canTransition('closed', 'void')).toBe(false);
    });

    it('should not allow any transition from voided', () => {
      expect(InvoiceStateMachine.canTransition('voided', 'submit')).toBe(false);
      expect(InvoiceStateMachine.canTransition('voided', 'approve')).toBe(false);
    });

    it('should throw IllegalInvoiceStateTransitionError for invalid transitions', () => {
      expect(() => {
        InvoiceStateMachine.getNextStatus('draft', 'approve');
      }).toThrow(IllegalInvoiceStateTransitionError);
    });
  });

  describe('Terminal States', () => {
    it('should identify closed as terminal', () => {
      expect(InvoiceStateMachine.isTerminal('closed')).toBe(true);
    });

    it('should identify voided as terminal', () => {
      expect(InvoiceStateMachine.isTerminal('voided')).toBe(true);
    });

    it('should not identify draft as terminal', () => {
      expect(InvoiceStateMachine.isTerminal('draft')).toBe(false);
    });

    it('should not identify posted as terminal', () => {
      expect(InvoiceStateMachine.isTerminal('posted')).toBe(false);
    });
  });

  describe('Immutable States', () => {
    it('should identify posted as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('posted')).toBe(true);
    });

    it('should identify paid as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('paid')).toBe(true);
    });

    it('should identify closed as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('closed')).toBe(true);
    });

    it('should identify voided as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('voided')).toBe(true);
    });

    it('should not identify draft as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('draft')).toBe(false);
    });

    it('should not identify approved as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('approved')).toBe(false);
    });
  });

  describe('Can Post to GL', () => {
    it('should only allow posting from approved status', () => {
      expect(InvoiceStateMachine.canPostToGL('approved')).toBe(true);
      expect(InvoiceStateMachine.canPostToGL('draft')).toBe(false);
      expect(InvoiceStateMachine.canPostToGL('submitted')).toBe(false);
      expect(InvoiceStateMachine.canPostToGL('matched')).toBe(false);
      expect(InvoiceStateMachine.canPostToGL('posted')).toBe(false);
    });
  });

  describe('Requires Matching', () => {
    it('should require matching for submitted status', () => {
      expect(InvoiceStateMachine.requiresMatching('submitted')).toBe(true);
      expect(InvoiceStateMachine.requiresMatching('draft')).toBe(false);
      expect(InvoiceStateMachine.requiresMatching('matched')).toBe(false);
    });
  });

  describe('Requires Approval', () => {
    it('should require approval for matched status', () => {
      expect(InvoiceStateMachine.requiresApproval('matched')).toBe(true);
      expect(InvoiceStateMachine.requiresApproval('draft')).toBe(false);
      expect(InvoiceStateMachine.requiresApproval('submitted')).toBe(false);
    });
  });

  describe('Available Actions', () => {
    it('should return submit for draft status', () => {
      const actions = InvoiceStateMachine.getAvailableActions('draft');
      expect(actions).toContain('submit');
      expect(actions).toHaveLength(1);
    });

    it('should return match, skip_match, reject for submitted status', () => {
      const actions = InvoiceStateMachine.getAvailableActions('submitted');
      expect(actions).toContain('match');
      expect(actions).toContain('skip_match');
      expect(actions).toContain('reject');
      expect(actions).toHaveLength(3);
    });

    it('should return empty array for closed status', () => {
      const actions = InvoiceStateMachine.getAvailableActions('closed');
      expect(actions).toHaveLength(0);
    });
  });

  describe('Path to Posted', () => {
    it('should return full path from draft', () => {
      const path = InvoiceStateMachine.getPathToPosted('draft');
      expect(path).toEqual(['submit', 'match', 'approve', 'post']);
    });

    it('should return partial path from submitted', () => {
      const path = InvoiceStateMachine.getPathToPosted('submitted');
      expect(path).toEqual(['match', 'approve', 'post']);
    });

    it('should return empty array from posted', () => {
      const path = InvoiceStateMachine.getPathToPosted('posted');
      expect(path).toEqual([]);
    });

    it('should return null from closed or voided', () => {
      expect(InvoiceStateMachine.getPathToPosted('closed')).toBeNull();
      expect(InvoiceStateMachine.getPathToPosted('voided')).toBeNull();
    });
  });

  describe('Validate Action Sequence', () => {
    it('should validate happy path sequence', () => {
      const result = InvoiceStateMachine.validateActionSequence(
        'draft',
        ['submit', 'match', 'approve', 'post']
      );
      expect(result.valid).toBe(true);
      expect(result.endStatus).toBe('posted');
    });

    it('should reject invalid sequence', () => {
      const result = InvoiceStateMachine.validateActionSequence(
        'draft',
        ['approve'] // Can't approve directly from draft
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot perform');
    });
  });

  describe('Can Edit', () => {
    it('should only allow editing in draft status', () => {
      expect(InvoiceStateMachine.canEdit('draft')).toBe(true);
      expect(InvoiceStateMachine.canEdit('submitted')).toBe(false);
      expect(InvoiceStateMachine.canEdit('approved')).toBe(false);
      expect(InvoiceStateMachine.canEdit('posted')).toBe(false);
    });
  });

  describe('Can Void', () => {
    it('should allow voiding from approved, posted, or paid', () => {
      expect(InvoiceStateMachine.canVoid('approved')).toBe(true);
      expect(InvoiceStateMachine.canVoid('posted')).toBe(true);
      expect(InvoiceStateMachine.canVoid('paid')).toBe(true);
    });

    it('should not allow voiding from draft or submitted', () => {
      expect(InvoiceStateMachine.canVoid('draft')).toBe(false);
      expect(InvoiceStateMachine.canVoid('submitted')).toBe(false);
      expect(InvoiceStateMachine.canVoid('matched')).toBe(false);
    });

    it('should not allow voiding from closed or voided', () => {
      expect(InvoiceStateMachine.canVoid('closed')).toBe(false);
      expect(InvoiceStateMachine.canVoid('voided')).toBe(false);
    });
  });
});

// ============================================================================
// RULE_PAY_02: INTERCOMPANY ELIMINATION LOGIC
// ============================================================================
// Prevents approval of unmatched IC transactions
// Enforces the "Nightmare Catcher" - no Black Hole variance
// ============================================================================

import { useMemo } from 'react';
import { PAYMENT_CONFIG, type Payment, type ICPosition, IC_POSITIONS } from '../data';

// ============================================================================
// TYPES
// ============================================================================

export interface ICValidationResult {
  isIC: boolean;
  isMatched: boolean;
  canApprove: boolean;
  blockReason: string | null;
  counterpartyEntity: string | null;
  matchingPosition: ICPosition | null;
  nettingOpportunity: string | null;
}

// ============================================================================
// RULE_PAY_02: IC VALIDATION FUNCTION
// ============================================================================

export function validateICTransaction(payment: Payment): ICValidationResult {
  // Not an IC transaction
  if (payment.tx_type !== 'intercompany') {
    return {
      isIC: false,
      isMatched: true,
      canApprove: true,
      blockReason: null,
      counterpartyEntity: null,
      matchingPosition: null,
      nettingOpportunity: null,
    };
  }

  const { ic_rules } = PAYMENT_CONFIG;
  
  // Find matching IC position
  const matchingPosition = IC_POSITIONS.find(
    pos => pos.from_entity === payment.entity || pos.to_entity === payment.entity
  ) || null;
  
  // Check elimination status
  const isMatched = payment.elimination_status === 'matched';
  
  // Block if unmatched and rules require matching
  const canApprove = isMatched || !ic_rules.require_elimination_match;
  
  // Generate block reason
  let blockReason: string | null = null;
  if (!canApprove) {
    blockReason = 'IC transaction has no matching entry in counterparty books';
  }
  
  // Check for netting opportunities
  let nettingOpportunity: string | null = null;
  if (matchingPosition && matchingPosition.loan_ref) {
    nettingOpportunity = `Can be netted against ${matchingPosition.loan_ref}`;
  }

  return {
    isIC: true,
    isMatched,
    canApprove,
    blockReason,
    counterpartyEntity: payment.counterparty_entity || null,
    matchingPosition,
    nettingOpportunity,
  };
}

// ============================================================================
// IC VALIDATION HOOK
// ============================================================================

export function useICValidation(payment: Payment | null): ICValidationResult | null {
  return useMemo(() => {
    if (!payment) return null;
    return validateICTransaction(payment);
  }, [payment]);
}

// ============================================================================
// IC ROUTE DISPLAY
// ============================================================================

export function formatICRoute(payment: Payment): string {
  if (payment.tx_type !== 'intercompany') return '';
  return `${payment.entity} → ${payment.counterparty_entity || 'Unknown'}`;
}

// ============================================================================
// IC SETTLEMENT STATUS
// ============================================================================

export type ICSettlementStep = 
  | 'identify_mismatch'
  | 'contact_counterparty'
  | 'create_matching_entry'
  | 'confirm_elimination'
  | 'approve_both';

export interface ICSettlementStatus {
  currentStep: ICSettlementStep;
  steps: Array<{
    step: ICSettlementStep;
    label: string;
    completed: boolean;
  }>;
  canProceed: boolean;
}

export function getICSettlementStatus(payment: Payment): ICSettlementStatus {
  const isMatched = payment.elimination_status === 'matched';
  
  return {
    currentStep: isMatched ? 'approve_both' : 'identify_mismatch',
    steps: [
      { step: 'identify_mismatch', label: 'Identify Mismatch', completed: true },
      { step: 'contact_counterparty', label: 'Contact Counterparty', completed: false },
      { step: 'create_matching_entry', label: 'Create Matching Entry', completed: false },
      { step: 'confirm_elimination', label: 'Confirm Elimination', completed: isMatched },
      { step: 'approve_both', label: 'Approve Both Sides', completed: false },
    ],
    canProceed: !isMatched,
  };
}


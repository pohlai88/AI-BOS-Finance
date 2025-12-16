// ============================================================================
// UNIFIED PAYMENT APPROVAL HOOK
// ============================================================================
// Combines all governance rules into a single approval decision
// Orchestrates: SoD, IC Validation, Document Completeness
// ============================================================================

import { useMemo, useCallback, useState } from 'react';
import type { Payment, PaymentStatus } from '../data';
import { checkSoD, type CurrentUser, type SoDCheckResult } from './usePaymentGovernance';
import { validateICTransaction, type ICValidationResult } from './useICValidation';
import { validateDocuments, type DocumentValidationResult } from './useDocumentValidation';

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalDecision {
  canApprove: boolean;
  canReject: boolean;
  blockReasons: string[];
  warnings: string[];
  sodCheck: SoDCheckResult;
  icCheck: ICValidationResult;
  docCheck: DocumentValidationResult;
  requiresICSettlement: boolean;
}

export interface PaymentApprovalState {
  payments: Payment[];
  selectedId: string | null;
  isProcessing: boolean;
  lastAction: {
    type: 'approve' | 'reject' | null;
    paymentId: string | null;
    timestamp: Date | null;
  };
}

// ============================================================================
// UNIFIED APPROVAL CHECK
// ============================================================================

export function checkApproval(
  payment: Payment,
  currentUser: CurrentUser,
): ApprovalDecision {
  const sodCheck = checkSoD(payment, currentUser);
  const icCheck = validateICTransaction(payment);
  const docCheck = validateDocuments(payment);
  
  const blockReasons: string[] = [];
  const warnings: string[] = [];
  
  // SoD violations are hard blocks
  if (!sodCheck.allowed) {
    blockReasons.push(sodCheck.message!);
  }
  
  // IC unmatched is a hard block
  if (!icCheck.canApprove) {
    blockReasons.push(icCheck.blockReason!);
  }
  
  // Document issues are warnings (MVP)
  if (!docCheck.isComplete) {
    warnings.push(docCheck.warningMessage!);
  }
  
  // Hard block if doc validation says so (Phase 2)
  if (docCheck.blockApproval) {
    blockReasons.push('Required documents missing');
  }
  
  return {
    canApprove: blockReasons.length === 0 && payment.status === 'pending',
    canReject: payment.status === 'pending',
    blockReasons,
    warnings,
    sodCheck,
    icCheck,
    docCheck,
    requiresICSettlement: icCheck.isIC && !icCheck.isMatched,
  };
}

// ============================================================================
// PAYMENT APPROVAL HOOK
// ============================================================================

export function usePaymentApproval(
  initialPayments: Payment[],
  currentUser: CurrentUser,
) {
  const [state, setState] = useState<PaymentApprovalState>({
    payments: initialPayments,
    selectedId: null,
    isProcessing: false,
    lastAction: {
      type: null,
      paymentId: null,
      timestamp: null,
    },
  });

  // Get selected payment
  const selectedPayment = useMemo(() => 
    state.payments.find(p => p.id === state.selectedId) || null,
    [state.payments, state.selectedId]
  );

  // Get approval decision for selected payment
  const approvalDecision = useMemo(() => {
    if (!selectedPayment) return null;
    return checkApproval(selectedPayment, currentUser);
  }, [selectedPayment, currentUser]);

  // Select a payment
  const selectPayment = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  // Approve a payment
  const approvePayment = useCallback((id: string) => {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) return { success: false, error: 'Payment not found' };
    
    const decision = checkApproval(payment, currentUser);
    if (!decision.canApprove) {
      return { 
        success: false, 
        error: decision.blockReasons[0] || 'Cannot approve',
      };
    }
    
    setState(prev => ({
      ...prev,
      isProcessing: true,
    }));
    
    // Simulate async approval
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        payments: prev.payments.map(p => 
          p.id === id 
            ? { 
                ...p, 
                status: 'approved' as PaymentStatus, 
                approved_by: currentUser.name,
                approver_id: currentUser.id,
                approved_at: new Date().toISOString(),
              } 
            : p
        ),
        isProcessing: false,
        lastAction: {
          type: 'approve',
          paymentId: id,
          timestamp: new Date(),
        },
      }));
    }, 300);
    
    return { success: true };
  }, [state.payments, currentUser]);

  // Reject a payment
  const rejectPayment = useCallback((id: string, reason?: string) => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
    }));
    
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        payments: prev.payments.map(p => 
          p.id === id 
            ? { ...p, status: 'rejected' as PaymentStatus } 
            : p
        ),
        selectedId: null,
        isProcessing: false,
        lastAction: {
          type: 'reject',
          paymentId: id,
          timestamp: new Date(),
        },
      }));
    }, 300);
    
    return { success: true };
  }, []);

  // Filter payments by status
  const getPaymentsByStatus = useCallback((status: PaymentStatus | 'all') => {
    if (status === 'all') return state.payments;
    return state.payments.filter(p => p.status === status);
  }, [state.payments]);

  // Stats
  const stats = useMemo(() => ({
    total: state.payments.length,
    pending: state.payments.filter(p => p.status === 'pending').length,
    approved: state.payments.filter(p => p.status === 'approved').length,
    rejected: state.payments.filter(p => p.status === 'rejected').length,
    pendingAmount: state.payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    approvedAmount: state.payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0),
  }), [state.payments]);

  return {
    // State
    payments: state.payments,
    selectedPayment,
    selectedId: state.selectedId,
    isProcessing: state.isProcessing,
    lastAction: state.lastAction,
    
    // Decision
    approvalDecision,
    
    // Actions
    selectPayment,
    approvePayment,
    rejectPayment,
    getPaymentsByStatus,
    
    // Stats
    stats,
    
    // Current user
    currentUser,
  };
}

// ============================================================================
// DEFAULT CURRENT USER (for demo)
// ============================================================================

export const DEFAULT_USER: CurrentUser = {
  id: 'USR-CFO',
  name: 'CFO (You)',
  role: 'cfo',
};


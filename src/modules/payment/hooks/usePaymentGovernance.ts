// ============================================================================
// RULE_PAY_01: SEGREGATION OF DUTIES (SoD)
// ============================================================================
// Prevents self-approval and enforces role-based approval thresholds
// ============================================================================

import { useMemo } from 'react'
import { PAYMENT_CONFIG, type Payment } from '../mock-data''

// ============================================================================
// TYPES
// ============================================================================

export type ApproverRole = 'clerk' | 'manager' | 'vp' | 'cfo' | 'group_cfo'

export interface SoDCheckResult {
  allowed: boolean
  violation: 'self_approval' | 'insufficient_role' | null
  message: string | null
  requiredRole: ApproverRole
}

export interface CurrentUser {
  id: string
  name: string
  role: ApproverRole
}

// ============================================================================
// ROLE HIERARCHY
// ============================================================================

const ROLE_HIERARCHY: Record<ApproverRole, number> = {
  clerk: 1,
  manager: 2,
  vp: 3,
  cfo: 4,
  group_cfo: 5,
}

// ============================================================================
// RULE_PAY_01: SOD CHECK FUNCTION
// ============================================================================

export function checkSoD(
  payment: Payment,
  currentUser: CurrentUser
): SoDCheckResult {
  const { approval_thresholds, sod_rules } = PAYMENT_CONFIG

  // Rule 1: Self-approval check
  if (
    sod_rules.self_approval_blocked &&
    payment.requestor_id === currentUser.id
  ) {
    return {
      allowed: false,
      violation: 'self_approval',
      message: 'You cannot approve your own payment request',
      requiredRole: getRequiredRole(payment.amount),
    }
  }

  // Rule 2: Amount-based role check
  const requiredRole = getRequiredRole(payment.amount)
  const userLevel = ROLE_HIERARCHY[currentUser.role]
  const requiredLevel = ROLE_HIERARCHY[requiredRole]

  if (userLevel < requiredLevel) {
    return {
      allowed: false,
      violation: 'insufficient_role',
      message: `Amount requires ${formatRole(requiredRole)} approval`,
      requiredRole,
    }
  }

  return {
    allowed: true,
    violation: null,
    message: null,
    requiredRole,
  }
}

/**
 * Determine required approval role based on amount
 */
function getRequiredRole(amount: number): ApproverRole {
  const { approval_thresholds } = PAYMENT_CONFIG

  if (amount < approval_thresholds.auto_approve) {
    return 'clerk'
  }
  if (amount < approval_thresholds.manager_required) {
    return 'clerk'
  }
  if (amount < approval_thresholds.vp_required) {
    return 'manager'
  }
  if (amount < approval_thresholds.cfo_required) {
    return 'vp'
  }
  return 'cfo'
}

/**
 * Format role for display
 */
function formatRole(role: ApproverRole): string {
  const roleNames: Record<ApproverRole, string> = {
    clerk: 'AP Clerk',
    manager: 'Manager',
    vp: 'VP',
    cfo: 'CFO',
    group_cfo: 'Group CFO',
  }
  return roleNames[role]
}

// ============================================================================
// SOD HOOK
// ============================================================================

export function useSoDCheck(
  payment: Payment | null,
  currentUser: CurrentUser
): SoDCheckResult | null {
  return useMemo(() => {
    if (!payment) return null
    return checkSoD(payment, currentUser)
  }, [payment, currentUser])
}

/**
 * Payment State Machine
 * 
 * Defines the valid states and transitions for the AP-05 Payment Execution lifecycle.
 * 
 * State Diagram:
 * 
 *   draft → pending_approval → approved → processing → completed
 *                    ↓              ↓          ↓
 *               rejected         (none)     failed → (retry) → pending_approval
 * 
 * Terminal States: rejected, completed
 * Immutable States: approved, processing, completed (DB constraint)
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Payment Status - All possible states in the payment lifecycle
 */
export type PaymentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Payment Action - All valid actions that can trigger state transitions
 */
export type PaymentAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'execute'
  | 'complete'
  | 'fail'
  | 'retry';

/**
 * State transition definition
 */
interface StateTransition {
  from: PaymentStatus;
  action: PaymentAction;
  to: PaymentStatus;
}

// ============================================================================
// 2. ERRORS
// ============================================================================

export class IllegalStateTransitionError extends Error {
  constructor(
    public readonly currentState: PaymentStatus,
    public readonly action: PaymentAction
  ) {
    super(
      `Illegal state transition: cannot perform action "${action}" from state "${currentState}"`
    );
    this.name = 'IllegalStateTransitionError';
  }
}

// ============================================================================
// 3. TRANSITION DEFINITIONS
// ============================================================================

/**
 * All valid state transitions
 */
const TRANSITIONS: Record<PaymentStatus, Partial<Record<PaymentAction, PaymentStatus>>> = {
  draft: {
    submit: 'pending_approval',
  },
  pending_approval: {
    approve: 'approved',
    reject: 'rejected',
  },
  approved: {
    execute: 'processing',
  },
  rejected: {
    // Terminal state - no outbound transitions
  },
  processing: {
    complete: 'completed',
    fail: 'failed',
  },
  completed: {
    // Terminal state - no outbound transitions
  },
  failed: {
    retry: 'pending_approval',
  },
};

/**
 * Terminal states (no outbound transitions)
 */
const TERMINAL_STATES: Set<PaymentStatus> = new Set(['rejected', 'completed']);

/**
 * Immutable states (DB enforces no edits)
 */
const IMMUTABLE_STATES: Set<PaymentStatus> = new Set(['approved', 'processing', 'completed']);

/**
 * States that require approval
 */
const REQUIRES_APPROVAL_STATES: Set<PaymentStatus> = new Set(['pending_approval']);

// ============================================================================
// 4. STATE MACHINE
// ============================================================================

/**
 * Payment State Machine
 * 
 * Static class providing state machine operations for the payment lifecycle.
 * All methods are pure functions with no side effects.
 * 
 * @example
 * ```typescript
 * // Check if transition is valid
 * if (PaymentStateMachine.canTransition('draft', 'submit')) {
 *   const nextStatus = PaymentStateMachine.getNextStatus('draft', 'submit');
 *   // nextStatus = 'pending_approval'
 * }
 * 
 * // Get available actions
 * const actions = PaymentStateMachine.getAvailableActions('pending_approval');
 * // actions = ['approve', 'reject']
 * ```
 */
export class PaymentStateMachine {
  /**
   * Check if a transition is valid
   * 
   * @param current - Current payment status
   * @param action - Action to perform
   * @returns true if the transition is valid
   */
  static canTransition(current: PaymentStatus, action: PaymentAction): boolean {
    return TRANSITIONS[current]?.[action] !== undefined;
  }

  /**
   * Get the next status after performing an action
   * 
   * @param current - Current payment status
   * @param action - Action to perform
   * @returns Next status
   * @throws IllegalStateTransitionError if transition is invalid
   */
  static getNextStatus(current: PaymentStatus, action: PaymentAction): PaymentStatus {
    const next = TRANSITIONS[current]?.[action];
    if (!next) {
      throw new IllegalStateTransitionError(current, action);
    }
    return next;
  }

  /**
   * Check if a status is a terminal state
   * Terminal states have no outbound transitions
   */
  static isTerminal(status: PaymentStatus): boolean {
    return TERMINAL_STATES.has(status);
  }

  /**
   * Check if a status is immutable
   * Immutable states cannot be edited (DB constraint enforces)
   */
  static isImmutable(status: PaymentStatus): boolean {
    return IMMUTABLE_STATES.has(status);
  }

  /**
   * Check if a status requires approval action
   */
  static requiresApproval(status: PaymentStatus): boolean {
    return REQUIRES_APPROVAL_STATES.has(status);
  }

  /**
   * Get all available actions from a given status
   */
  static getAvailableActions(status: PaymentStatus): PaymentAction[] {
    const transitions = TRANSITIONS[status] || {};
    return Object.keys(transitions) as PaymentAction[];
  }

  /**
   * Get all valid state transitions as an array
   */
  static getAllTransitions(): StateTransition[] {
    const result: StateTransition[] = [];

    for (const [from, actions] of Object.entries(TRANSITIONS)) {
      for (const [action, to] of Object.entries(actions)) {
        result.push({
          from: from as PaymentStatus,
          action: action as PaymentAction,
          to: to as PaymentStatus,
        });
      }
    }

    return result;
  }

  /**
   * Get all possible statuses
   */
  static getAllStatuses(): PaymentStatus[] {
    return Object.keys(TRANSITIONS) as PaymentStatus[];
  }

  /**
   * Check if a status can eventually reach 'completed'
   */
  static canReachCompleted(status: PaymentStatus): boolean {
    const cannotComplete: Set<PaymentStatus> = new Set(['rejected']);
    return !cannotComplete.has(status);
  }

  /**
   * Get the "happy path" from a given status to completion
   */
  static getPathToCompleted(status: PaymentStatus): PaymentAction[] | null {
    const paths: Record<PaymentStatus, PaymentAction[] | null> = {
      draft: ['submit', 'approve', 'execute', 'complete'],
      pending_approval: ['approve', 'execute', 'complete'],
      approved: ['execute', 'complete'],
      processing: ['complete'],
      completed: [],
      rejected: null,
      failed: ['retry', 'approve', 'execute', 'complete'],
    };

    return paths[status];
  }

  /**
   * Validate a sequence of actions
   */
  static validateActionSequence(
    startStatus: PaymentStatus,
    actions: PaymentAction[]
  ): { valid: boolean; endStatus?: PaymentStatus; error?: string } {
    let currentStatus = startStatus;

    for (const action of actions) {
      if (!this.canTransition(currentStatus, action)) {
        return {
          valid: false,
          error: `Cannot perform "${action}" from "${currentStatus}"`,
        };
      }
      currentStatus = this.getNextStatus(currentStatus, action);
    }

    return { valid: true, endStatus: currentStatus };
  }
}

// ============================================================================
// 5. STATUS METADATA
// ============================================================================

/**
 * Status display information
 */
export interface StatusMetadata {
  label: string;
  description: string;
  color: 'gray' | 'amber' | 'green' | 'red' | 'blue';
  icon: string;
}

export const STATUS_METADATA: Record<PaymentStatus, StatusMetadata> = {
  draft: {
    label: 'Draft',
    description: 'Payment is being prepared',
    color: 'gray',
    icon: 'file-edit',
  },
  pending_approval: {
    label: 'Pending Approval',
    description: 'Waiting for approver action',
    color: 'amber',
    icon: 'clock',
  },
  approved: {
    label: 'Approved',
    description: 'Payment approved, ready for execution',
    color: 'green',
    icon: 'check-circle',
  },
  rejected: {
    label: 'Rejected',
    description: 'Payment was rejected',
    color: 'red',
    icon: 'x-circle',
  },
  processing: {
    label: 'Processing',
    description: 'Payment is being processed by bank',
    color: 'blue',
    icon: 'loader',
  },
  completed: {
    label: 'Completed',
    description: 'Payment confirmed by bank',
    color: 'green',
    icon: 'check-check',
  },
  failed: {
    label: 'Failed',
    description: 'Payment processing failed',
    color: 'red',
    icon: 'alert-triangle',
  },
};

// ============================================================================
// 6. EXPORTS
// ============================================================================

export {
  TRANSITIONS,
  TERMINAL_STATES,
  IMMUTABLE_STATES,
  type StateTransition,
};

export default PaymentStateMachine;

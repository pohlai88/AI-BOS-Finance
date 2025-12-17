/**
 * Invoice State Machine
 * 
 * Defines the valid states and transitions for the AP-02 Invoice Entry lifecycle.
 * 
 * State Diagram:
 * 
 *   draft → submitted → matched → approved → posted → paid → closed
 *              ↓            ↓          ↓         ↓       ↓
 *          (reject)     (skip)    (reject)   (void)  (void)
 *              ↓                      ↓
 *           draft                  draft
 * 
 * Terminal States: closed, voided
 * Immutable States: posted, paid, closed (DB constraint prevents edits)
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Invoice Status - All possible states in the invoice lifecycle
 */
export type InvoiceStatus =
  | 'draft'
  | 'submitted'
  | 'matched'
  | 'approved'
  | 'posted'
  | 'paid'
  | 'closed'
  | 'voided';

/**
 * Invoice Action - All valid actions that can trigger state transitions
 */
export type InvoiceAction =
  | 'submit'
  | 'match'
  | 'skip_match'
  | 'approve'
  | 'reject'
  | 'post'
  | 'pay'
  | 'close'
  | 'void';

/**
 * Match status from AP-03 3-Way Engine
 */
export type MatchStatus = 'passed' | 'exception' | 'skipped';

/**
 * State transition definition
 */
interface StateTransition {
  from: InvoiceStatus;
  action: InvoiceAction;
  to: InvoiceStatus;
}

// ============================================================================
// 2. ERRORS
// ============================================================================

export class IllegalInvoiceStateTransitionError extends Error {
  constructor(
    public readonly currentState: InvoiceStatus,
    public readonly action: InvoiceAction
  ) {
    super(
      `Illegal state transition: cannot perform action "${action}" from state "${currentState}"`
    );
    this.name = 'IllegalInvoiceStateTransitionError';
  }
}

// ============================================================================
// 3. TRANSITION DEFINITIONS
// ============================================================================

/**
 * All valid state transitions
 */
const TRANSITIONS: Record<InvoiceStatus, Partial<Record<InvoiceAction, InvoiceStatus>>> = {
  draft: {
    submit: 'submitted',
  },
  submitted: {
    match: 'matched',
    skip_match: 'matched', // Skip AP-03 matching
    reject: 'draft',
  },
  matched: {
    approve: 'approved',
    reject: 'draft',
  },
  approved: {
    post: 'posted',
    reject: 'draft', // Rejection before posting allowed
    void: 'voided',
  },
  posted: {
    pay: 'paid',
    void: 'voided', // Creates reversal journal
  },
  paid: {
    close: 'closed',
    void: 'voided', // Creates reversal journal + payment reversal
  },
  closed: {
    // Terminal state - no outbound transitions
  },
  voided: {
    // Terminal state - no outbound transitions
  },
};

/**
 * Terminal states (no outbound transitions)
 */
const TERMINAL_STATES: Set<InvoiceStatus> = new Set(['closed', 'voided']);

/**
 * Immutable states (DB enforces no edits)
 */
const IMMUTABLE_STATES: Set<InvoiceStatus> = new Set(['posted', 'paid', 'closed', 'voided']);

/**
 * States that can be posted to GL
 */
const CAN_POST_TO_GL: Set<InvoiceStatus> = new Set(['approved']);

/**
 * States requiring matching (AP-03)
 */
const REQUIRES_MATCHING: Set<InvoiceStatus> = new Set(['submitted']);

/**
 * States requiring approval (AP-04)
 */
const REQUIRES_APPROVAL: Set<InvoiceStatus> = new Set(['matched']);

/**
 * States that can trigger payment (AP-05)
 */
const CAN_TRIGGER_PAYMENT: Set<InvoiceStatus> = new Set(['posted']);

// ============================================================================
// 4. STATE MACHINE
// ============================================================================

/**
 * Invoice State Machine
 * 
 * Static class providing state machine operations for the invoice lifecycle.
 * All methods are pure functions with no side effects.
 * 
 * @example
 * ```typescript
 * // Check if transition is valid
 * if (InvoiceStateMachine.canTransition('draft', 'submit')) {
 *   const nextStatus = InvoiceStateMachine.getNextStatus('draft', 'submit');
 *   // nextStatus = 'submitted'
 * }
 * 
 * // Get available actions
 * const actions = InvoiceStateMachine.getAvailableActions('submitted');
 * // actions = ['match', 'skip_match', 'reject']
 * ```
 */
export class InvoiceStateMachine {
  /**
   * Check if a transition is valid
   * 
   * @param current - Current invoice status
   * @param action - Action to perform
   * @returns true if the transition is valid
   */
  static canTransition(current: InvoiceStatus, action: InvoiceAction): boolean {
    return TRANSITIONS[current]?.[action] !== undefined;
  }

  /**
   * Get the next status after performing an action
   * 
   * @param current - Current invoice status
   * @param action - Action to perform
   * @returns Next status
   * @throws IllegalInvoiceStateTransitionError if transition is invalid
   */
  static getNextStatus(current: InvoiceStatus, action: InvoiceAction): InvoiceStatus {
    const next = TRANSITIONS[current]?.[action];
    if (!next) {
      throw new IllegalInvoiceStateTransitionError(current, action);
    }
    return next;
  }

  /**
   * Check if a status is a terminal state
   * Terminal states have no outbound transitions
   */
  static isTerminal(status: InvoiceStatus): boolean {
    return TERMINAL_STATES.has(status);
  }

  /**
   * Check if a status is immutable
   * Immutable states cannot be edited (DB constraint enforces)
   */
  static isImmutable(status: InvoiceStatus): boolean {
    return IMMUTABLE_STATES.has(status);
  }

  /**
   * Check if a status can be posted to GL
   */
  static canPostToGL(status: InvoiceStatus): boolean {
    return CAN_POST_TO_GL.has(status);
  }

  /**
   * Check if a status requires matching (AP-03)
   */
  static requiresMatching(status: InvoiceStatus): boolean {
    return REQUIRES_MATCHING.has(status);
  }

  /**
   * Check if a status requires approval (AP-04)
   */
  static requiresApproval(status: InvoiceStatus): boolean {
    return REQUIRES_APPROVAL.has(status);
  }

  /**
   * Check if a status can trigger payment (AP-05)
   */
  static canTriggerPayment(status: InvoiceStatus): boolean {
    return CAN_TRIGGER_PAYMENT.has(status);
  }

  /**
   * Get all available actions from a given status
   */
  static getAvailableActions(status: InvoiceStatus): InvoiceAction[] {
    const transitions = TRANSITIONS[status] || {};
    return Object.keys(transitions) as InvoiceAction[];
  }

  /**
   * Get all valid state transitions as an array
   */
  static getAllTransitions(): StateTransition[] {
    const result: StateTransition[] = [];

    for (const [from, actions] of Object.entries(TRANSITIONS)) {
      for (const [action, to] of Object.entries(actions)) {
        result.push({
          from: from as InvoiceStatus,
          action: action as InvoiceAction,
          to: to as InvoiceStatus,
        });
      }
    }

    return result;
  }

  /**
   * Get all possible statuses
   */
  static getAllStatuses(): InvoiceStatus[] {
    return Object.keys(TRANSITIONS) as InvoiceStatus[];
  }

  /**
   * Check if a status can eventually reach 'posted'
   */
  static canReachPosted(status: InvoiceStatus): boolean {
    const cannotPost: Set<InvoiceStatus> = new Set(['closed', 'voided']);
    return !cannotPost.has(status);
  }

  /**
   * Get the "happy path" from a given status to posted
   */
  static getPathToPosted(status: InvoiceStatus): InvoiceAction[] | null {
    const paths: Record<InvoiceStatus, InvoiceAction[] | null> = {
      draft: ['submit', 'match', 'approve', 'post'],
      submitted: ['match', 'approve', 'post'],
      matched: ['approve', 'post'],
      approved: ['post'],
      posted: [],
      paid: null, // Already past posted
      closed: null,
      voided: null,
    };

    return paths[status];
  }

  /**
   * Validate a sequence of actions
   */
  static validateActionSequence(
    startStatus: InvoiceStatus,
    actions: InvoiceAction[]
  ): { valid: boolean; endStatus?: InvoiceStatus; error?: string } {
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

  /**
   * Check if invoice can be voided
   * Voiding is allowed from approved, posted, or paid states
   */
  static canVoid(status: InvoiceStatus): boolean {
    return this.canTransition(status, 'void');
  }

  /**
   * Check if invoice can be edited
   * Only draft invoices can be edited
   */
  static canEdit(status: InvoiceStatus): boolean {
    return status === 'draft';
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
  color: 'gray' | 'amber' | 'green' | 'red' | 'blue' | 'purple';
  icon: string;
}

export const INVOICE_STATUS_METADATA: Record<InvoiceStatus, StatusMetadata> = {
  draft: {
    label: 'Draft',
    description: 'Invoice is being prepared',
    color: 'gray',
    icon: 'file-edit',
  },
  submitted: {
    label: 'Submitted',
    description: 'Waiting for 3-way matching',
    color: 'amber',
    icon: 'clock',
  },
  matched: {
    label: 'Matched',
    description: '3-way matching passed, awaiting approval',
    color: 'blue',
    icon: 'check-double',
  },
  approved: {
    label: 'Approved',
    description: 'Approved, ready for GL posting',
    color: 'green',
    icon: 'check-circle',
  },
  posted: {
    label: 'Posted',
    description: 'Posted to General Ledger',
    color: 'green',
    icon: 'book',
  },
  paid: {
    label: 'Paid',
    description: 'Payment executed',
    color: 'purple',
    icon: 'banknotes',
  },
  closed: {
    label: 'Closed',
    description: 'Invoice fully processed',
    color: 'gray',
    icon: 'archive',
  },
  voided: {
    label: 'Voided',
    description: 'Invoice reversed/cancelled',
    color: 'red',
    icon: 'x-circle',
  },
};

// ============================================================================
// 6. EXPORTS
// ============================================================================

export {
  TRANSITIONS,
  TERMINAL_STATES,
  IMMUTABLE_STATES,
  CAN_POST_TO_GL,
  type StateTransition,
};

export default InvoiceStateMachine;

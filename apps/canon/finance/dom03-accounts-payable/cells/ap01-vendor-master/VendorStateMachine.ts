/**
 * Vendor State Machine
 * 
 * Defines the valid states and transitions for the AP-01 Vendor Master lifecycle.
 * 
 * State Diagram:
 * 
 *   draft → submitted → approved → suspended → archived
 *              ↓            ↓           ↓
 *          (reject)    (suspend)  (reactivate)
 *              ↓
 *           draft
 * 
 * Terminal States: archived
 * Immutable States: approved (DB constraint prevents edits)
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Vendor Status - All possible states in the vendor lifecycle
 */
export type VendorStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'suspended'
  | 'archived';

/**
 * Vendor Action - All valid actions that can trigger state transitions
 */
export type VendorAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'reactivate'
  | 'archive';

/**
 * State transition definition
 */
interface StateTransition {
  from: VendorStatus;
  action: VendorAction;
  to: VendorStatus;
}

// ============================================================================
// 2. ERRORS
// ============================================================================

export class IllegalVendorStateTransitionError extends Error {
  constructor(
    public readonly currentState: VendorStatus,
    public readonly action: VendorAction
  ) {
    super(
      `Illegal state transition: cannot perform action "${action}" from state "${currentState}"`
    );
    this.name = 'IllegalVendorStateTransitionError';
  }
}

// ============================================================================
// 3. TRANSITION DEFINITIONS
// ============================================================================

/**
 * All valid state transitions
 */
const TRANSITIONS: Record<VendorStatus, Partial<Record<VendorAction, VendorStatus>>> = {
  draft: {
    submit: 'submitted',
  },
  submitted: {
    approve: 'approved',
    reject: 'draft',
  },
  approved: {
    suspend: 'suspended',
    archive: 'archived',
  },
  suspended: {
    reactivate: 'approved',
    archive: 'archived',
  },
  archived: {
    // Terminal state - no outbound transitions
  },
};

/**
 * Terminal states (no outbound transitions)
 */
const TERMINAL_STATES: Set<VendorStatus> = new Set(['archived']);

/**
 * Immutable states (DB enforces no edits)
 */
const IMMUTABLE_STATES: Set<VendorStatus> = new Set(['approved']);

/**
 * States that require approval
 */
const REQUIRES_APPROVAL_STATES: Set<VendorStatus> = new Set(['submitted']);

/**
 * States that can receive payments
 */
const CAN_RECEIVE_PAYMENTS_STATES: Set<VendorStatus> = new Set(['approved']);

// ============================================================================
// 4. STATE MACHINE
// ============================================================================

/**
 * Vendor State Machine
 * 
 * Static class providing state machine operations for the vendor lifecycle.
 * All methods are pure functions with no side effects.
 * 
 * @example
 * ```typescript
 * // Check if transition is valid
 * if (VendorStateMachine.canTransition('draft', 'submit')) {
 *   const nextStatus = VendorStateMachine.getNextStatus('draft', 'submit');
 *   // nextStatus = 'submitted'
 * }
 * 
 * // Get available actions
 * const actions = VendorStateMachine.getAvailableActions('submitted');
 * // actions = ['approve', 'reject']
 * ```
 */
export class VendorStateMachine {
  /**
   * Check if a transition is valid
   * 
   * @param current - Current vendor status
   * @param action - Action to perform
   * @returns true if the transition is valid
   */
  static canTransition(current: VendorStatus, action: VendorAction): boolean {
    return TRANSITIONS[current]?.[action] !== undefined;
  }

  /**
   * Get the next status after performing an action
   * 
   * @param current - Current vendor status
   * @param action - Action to perform
   * @returns Next status
   * @throws IllegalVendorStateTransitionError if transition is invalid
   */
  static getNextStatus(current: VendorStatus, action: VendorAction): VendorStatus {
    const next = TRANSITIONS[current]?.[action];
    if (!next) {
      throw new IllegalVendorStateTransitionError(current, action);
    }
    return next;
  }

  /**
   * Check if a status is a terminal state
   * Terminal states have no outbound transitions
   */
  static isTerminal(status: VendorStatus): boolean {
    return TERMINAL_STATES.has(status);
  }

  /**
   * Check if a status is immutable
   * Immutable states cannot be edited (DB constraint enforces)
   */
  static isImmutable(status: VendorStatus): boolean {
    return IMMUTABLE_STATES.has(status);
  }

  /**
   * Check if a status requires approval action
   */
  static requiresApproval(status: VendorStatus): boolean {
    return REQUIRES_APPROVAL_STATES.has(status);
  }

  /**
   * Check if a status can receive payments
   * Only approved vendors can receive payments
   */
  static canReceivePayments(status: VendorStatus): boolean {
    return CAN_RECEIVE_PAYMENTS_STATES.has(status);
  }

  /**
   * Get all available actions from a given status
   */
  static getAvailableActions(status: VendorStatus): VendorAction[] {
    const transitions = TRANSITIONS[status] || {};
    return Object.keys(transitions) as VendorAction[];
  }

  /**
   * Get all valid state transitions as an array
   */
  static getAllTransitions(): StateTransition[] {
    const result: StateTransition[] = [];

    for (const [from, actions] of Object.entries(TRANSITIONS)) {
      for (const [action, to] of Object.entries(actions)) {
        result.push({
          from: from as VendorStatus,
          action: action as VendorAction,
          to: to as VendorStatus,
        });
      }
    }

    return result;
  }

  /**
   * Get all possible statuses
   */
  static getAllStatuses(): VendorStatus[] {
    return Object.keys(TRANSITIONS) as VendorStatus[];
  }

  /**
   * Check if a status can eventually reach 'approved'
   */
  static canReachApproved(status: VendorStatus): boolean {
    const cannotApprove: Set<VendorStatus> = new Set(['archived']);
    return !cannotApprove.has(status);
  }

  /**
   * Get the "happy path" from a given status to approval
   */
  static getPathToApproved(status: VendorStatus): VendorAction[] | null {
    const paths: Record<VendorStatus, VendorAction[] | null> = {
      draft: ['submit', 'approve'],
      submitted: ['approve'],
      approved: [],
      suspended: ['reactivate'],
      archived: null,
    };

    return paths[status];
  }

  /**
   * Validate a sequence of actions
   */
  static validateActionSequence(
    startStatus: VendorStatus,
    actions: VendorAction[]
  ): { valid: boolean; endStatus?: VendorStatus; error?: string } {
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

export const STATUS_METADATA: Record<VendorStatus, StatusMetadata> = {
  draft: {
    label: 'Draft',
    description: 'Vendor is being prepared',
    color: 'gray',
    icon: 'file-edit',
  },
  submitted: {
    label: 'Submitted',
    description: 'Waiting for approval',
    color: 'amber',
    icon: 'clock',
  },
  approved: {
    label: 'Approved',
    description: 'Vendor approved, can receive payments',
    color: 'green',
    icon: 'check-circle',
  },
  suspended: {
    label: 'Suspended',
    description: 'Vendor temporarily suspended',
    color: 'red',
    icon: 'pause-circle',
  },
  archived: {
    label: 'Archived',
    description: 'Vendor archived (historical only)',
    color: 'gray',
    icon: 'archive',
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

export default VendorStateMachine;

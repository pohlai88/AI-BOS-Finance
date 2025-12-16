/**
 * BioPermissionProvider - RBAC & Governance Context
 *
 * Sprint E6: Governance Layer
 * Provides role-based access control, field-level security, and audit logging.
 *
 * @example
 * // Basic setup
 * <BioPermissionProvider
 *   user={{ id: 'user-1', roles: ['accountant', 'viewer'] }}
 *   permissions={{
 *     'invoice:create': ['admin', 'accountant'],
 *     'invoice:delete': ['admin'],
 *     'invoice:view': ['admin', 'accountant', 'viewer'],
 *   }}
 * >
 *   <App />
 * </BioPermissionProvider>
 *
 * @example
 * // Using the hook
 * const { can, canAll, canAny, user } = usePermissions();
 * if (can('invoice:create')) { ... }
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

/** User identity with roles */
export interface BioUser {
  /** Unique user identifier */
  id: string;
  /** User's assigned roles */
  roles: string[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/** Permission definition: action -> allowed roles */
export type BioPermissionMap = Record<string, string[]>;

/** Field security rule */
export interface BioFieldRule {
  /** Field is hidden from UI */
  hidden?: boolean;
  /** Field is read-only */
  readonly?: boolean;
  /** Field is required */
  required?: boolean;
  /** Custom validation message */
  message?: string;
}

/** Field-level security: field -> role -> rules */
export type BioFieldSecurityMap = Record<string, Record<string, BioFieldRule>>;

/** Audit event for logging */
export interface BioAuditEvent {
  /** Event type */
  action: 'create' | 'read' | 'update' | 'delete' | 'submit' | 'approve' | 'reject' | 'custom';
  /** Resource type (e.g., 'invoice', 'payment') */
  resource: string;
  /** Resource identifier */
  resourceId?: string;
  /** User who performed the action */
  userId: string;
  /** Timestamp */
  timestamp: Date;
  /** Previous value (for updates) */
  previousValue?: unknown;
  /** New value (for creates/updates) */
  newValue?: unknown;
  /** Additional context */
  metadata?: Record<string, unknown>;
}

/** Audit callback function */
export type BioAuditCallback = (event: BioAuditEvent) => void | Promise<void>;

/** Document/record state for state-based permissions */
export type BioDocumentState = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';

/** State-based permission rule */
export interface BioStatePermission {
  /** Allowed transitions from this state */
  allowedTransitions: BioDocumentState[];
  /** Actions allowed in this state */
  allowedActions: string[];
  /** Roles that can perform actions in this state */
  allowedRoles: string[];
}

/** State permission map: state -> rules */
export type BioStatePermissionMap = Record<BioDocumentState, BioStatePermission>;

// ============================================================
// Context Value
// ============================================================

export interface BioPermissionContextValue {
  /** Current user */
  user: BioUser | null;
  /** Check if user can perform action */
  can: (action: string) => boolean;
  /** Check if user can perform ALL actions */
  canAll: (...actions: string[]) => boolean;
  /** Check if user can perform ANY action */
  canAny: (...actions: string[]) => boolean;
  /** Check if user has role */
  hasRole: (role: string) => boolean;
  /** Check if user has ANY of the roles */
  hasAnyRole: (...roles: string[]) => boolean;
  /** Get field rules for current user */
  getFieldRules: (fieldName: string) => BioFieldRule;
  /** Check if state transition is allowed */
  canTransition: (from: BioDocumentState, to: BioDocumentState) => boolean;
  /** Check if action is allowed in state */
  canActInState: (state: BioDocumentState, action: string) => boolean;
  /** Log audit event */
  audit: (event: Omit<BioAuditEvent, 'userId' | 'timestamp'>) => void;
  /** Set current user */
  setUser: (user: BioUser | null) => void;
}

// ============================================================
// Default State Permissions (ERP-style workflow)
// ============================================================

const DEFAULT_STATE_PERMISSIONS: BioStatePermissionMap = {
  draft: {
    allowedTransitions: ['submitted', 'cancelled'],
    allowedActions: ['edit', 'delete', 'submit'],
    allowedRoles: ['admin', 'editor', 'creator'],
  },
  submitted: {
    allowedTransitions: ['approved', 'rejected', 'draft'],
    allowedActions: ['view', 'approve', 'reject', 'return'],
    allowedRoles: ['admin', 'approver', 'manager'],
  },
  approved: {
    allowedTransitions: ['cancelled'],
    allowedActions: ['view', 'cancel'],
    allowedRoles: ['admin'],
  },
  rejected: {
    allowedTransitions: ['draft'],
    allowedActions: ['view', 'resubmit'],
    allowedRoles: ['admin', 'editor', 'creator'],
  },
  cancelled: {
    allowedTransitions: [],
    allowedActions: ['view'],
    allowedRoles: ['admin', 'viewer'],
  },
};

// ============================================================
// Context
// ============================================================

const BioPermissionContext = React.createContext<BioPermissionContextValue | null>(null);

// ============================================================
// Provider Props
// ============================================================

export interface BioPermissionProviderProps {
  children: React.ReactNode;
  /** Current user (can be null if not authenticated) */
  user?: BioUser | null;
  /** Permission map: action -> allowed roles */
  permissions?: BioPermissionMap;
  /** Field-level security rules */
  fieldSecurity?: BioFieldSecurityMap;
  /** State-based permissions */
  statePermissions?: BioStatePermissionMap;
  /** Audit callback for logging */
  onAudit?: BioAuditCallback;
  /** Default role for unauthenticated users */
  guestRole?: string;
}

// ============================================================
// Provider Component
// ============================================================

export function BioPermissionProvider({
  children,
  user: initialUser = null,
  permissions = {},
  fieldSecurity = {},
  statePermissions = DEFAULT_STATE_PERMISSIONS,
  onAudit,
  guestRole = 'guest',
}: BioPermissionProviderProps) {
  const [user, setUser] = React.useState<BioUser | null>(initialUser);

  // Update user when prop changes
  React.useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Get effective roles (user roles + guest if no user)
  const effectiveRoles = React.useMemo(() => {
    if (user) return user.roles;
    return [guestRole];
  }, [user, guestRole]);

  // Check if user can perform action
  const can = React.useCallback(
    (action: string): boolean => {
      const allowedRoles = permissions[action];
      if (!allowedRoles) return false;
      return effectiveRoles.some(role => allowedRoles.includes(role));
    },
    [permissions, effectiveRoles]
  );

  // Check if user can perform ALL actions
  const canAll = React.useCallback(
    (...actions: string[]): boolean => {
      return actions.every(action => can(action));
    },
    [can]
  );

  // Check if user can perform ANY action
  const canAny = React.useCallback(
    (...actions: string[]): boolean => {
      return actions.some(action => can(action));
    },
    [can]
  );

  // Check if user has role
  const hasRole = React.useCallback(
    (role: string): boolean => {
      return effectiveRoles.includes(role);
    },
    [effectiveRoles]
  );

  // Check if user has ANY of the roles
  const hasAnyRole = React.useCallback(
    (...roles: string[]): boolean => {
      return roles.some(role => effectiveRoles.includes(role));
    },
    [effectiveRoles]
  );

  // Get field rules for current user
  const getFieldRules = React.useCallback(
    (fieldName: string): BioFieldRule => {
      const fieldRules = fieldSecurity[fieldName];
      if (!fieldRules) return {};

      // Merge rules from all matching roles (most restrictive wins)
      let result: BioFieldRule = {};

      for (const role of effectiveRoles) {
        const roleRule = fieldRules[role];
        if (roleRule) {
          result = {
            hidden: result.hidden || roleRule.hidden,
            readonly: result.readonly || roleRule.readonly,
            required: result.required || roleRule.required,
            message: roleRule.message || result.message,
          };
        }
      }

      // Check for '*' (all roles) rules
      const allRolesRule = fieldRules['*'];
      if (allRolesRule) {
        result = {
          hidden: result.hidden ?? allRolesRule.hidden,
          readonly: result.readonly ?? allRolesRule.readonly,
          required: result.required ?? allRolesRule.required,
          message: result.message ?? allRolesRule.message,
        };
      }

      return result;
    },
    [fieldSecurity, effectiveRoles]
  );

  // Check if state transition is allowed
  const canTransition = React.useCallback(
    (from: BioDocumentState, to: BioDocumentState): boolean => {
      const stateRule = statePermissions[from];
      if (!stateRule) return false;

      // Check if transition is allowed
      if (!stateRule.allowedTransitions.includes(to)) return false;

      // Check if user has permission
      return effectiveRoles.some(role => stateRule.allowedRoles.includes(role));
    },
    [statePermissions, effectiveRoles]
  );

  // Check if action is allowed in state
  const canActInState = React.useCallback(
    (state: BioDocumentState, action: string): boolean => {
      const stateRule = statePermissions[state];
      if (!stateRule) return false;

      // Check if action is allowed in this state
      if (!stateRule.allowedActions.includes(action)) return false;

      // Check if user has permission
      return effectiveRoles.some(role => stateRule.allowedRoles.includes(role));
    },
    [statePermissions, effectiveRoles]
  );

  // Log audit event
  const audit = React.useCallback(
    (event: Omit<BioAuditEvent, 'userId' | 'timestamp'>) => {
      if (!onAudit) return;

      const fullEvent: BioAuditEvent = {
        ...event,
        userId: user?.id || 'anonymous',
        timestamp: new Date(),
      };

      // Fire async without blocking
      Promise.resolve(onAudit(fullEvent)).catch(err => {
        console.error('[BioPermission] Audit callback failed:', err);
      });
    },
    [onAudit, user]
  );

  const value: BioPermissionContextValue = React.useMemo(
    () => ({
      user,
      can,
      canAll,
      canAny,
      hasRole,
      hasAnyRole,
      getFieldRules,
      canTransition,
      canActInState,
      audit,
      setUser,
    }),
    [user, can, canAll, canAny, hasRole, hasAnyRole, getFieldRules, canTransition, canActInState, audit]
  );

  return (
    <BioPermissionContext.Provider value={value}>
      {children}
    </BioPermissionContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function usePermissions(): BioPermissionContextValue {
  const context = React.useContext(BioPermissionContext);

  if (!context) {
    // Return a no-op implementation for components used outside provider
    return {
      user: null,
      can: () => true, // Permissive by default when no provider
      canAll: () => true,
      canAny: () => true,
      hasRole: () => false,
      hasAnyRole: () => false,
      getFieldRules: () => ({}),
      canTransition: () => true,
      canActInState: () => true,
      audit: () => { },
      setUser: () => { },
    };
  }

  return context;
}

// ============================================================
// Component Meta
// ============================================================

export const PERMISSION_COMPONENT_META = {
  code: 'BIOSKIN_BioPermissionProvider',
  version: '1.0.0',
  layer: 'providers',
  family: 'GOVERNANCE',
  status: 'stable',
} as const;

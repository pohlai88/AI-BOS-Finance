/**
 * withFieldSecurity - Higher-Order Component for Field-Level Security
 *
 * Sprint E6: Governance Layer
 * Wraps form fields to apply RBAC-based visibility, readonly, and required rules.
 *
 * @example
 * const SecureInput = withFieldSecurity(Input);
 * <SecureInput name="salary" fieldName="employee.salary" />
 * // If user role has { hidden: true } for "employee.salary", field won't render
 * // If user role has { readonly: true }, field will be disabled
 */

'use client';

import * as React from 'react';
import { usePermissions, type BioFieldRule } from './BioPermissionProvider';

// ============================================================
// Types
// ============================================================

export interface FieldSecurityProps {
  /** Field name for security lookup */
  fieldName?: string;
  /** Override: force hidden */
  forceHidden?: boolean;
  /** Override: force readonly */
  forceReadonly?: boolean;
  /** Override: force required */
  forceRequired?: boolean;
}

export interface SecuredFieldProps extends FieldSecurityProps {
  /** Applied security rules (injected by HOC) */
  __securityRules?: BioFieldRule;
  /** Whether field is secured */
  __isSecured?: boolean;
}

// ============================================================
// HOC Factory
// ============================================================

/**
 * Higher-Order Component that applies field-level security rules
 */
export function withFieldSecurity<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & FieldSecurityProps> {
  const SecuredComponent: React.FC<P & FieldSecurityProps> = ({
    fieldName,
    forceHidden,
    forceReadonly,
    forceRequired,
    ...props
  }) => {
    const { getFieldRules } = usePermissions();

    // Get security rules for this field
    const rules = fieldName ? getFieldRules(fieldName) : {};

    // Apply overrides
    const isHidden = forceHidden ?? rules.hidden;
    const isReadonly = forceReadonly ?? rules.readonly;
    const isRequired = forceRequired ?? rules.required;

    // Don't render if hidden
    if (isHidden) {
      return null;
    }

    // Inject security props into wrapped component
    const securedProps = {
      ...props,
      disabled: isReadonly || (props as Record<string, unknown>).disabled,
      readOnly: isReadonly || (props as Record<string, unknown>).readOnly,
      required: isRequired || (props as Record<string, unknown>).required,
      'aria-readonly': isReadonly || undefined,
      __securityRules: rules,
      __isSecured: true,
    } as unknown as P & SecuredFieldProps;

    return <WrappedComponent {...securedProps} />;
  };

  SecuredComponent.displayName = `withFieldSecurity(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return SecuredComponent;
}

// ============================================================
// Utility Hook
// ============================================================

/**
 * Hook to get field security rules for a specific field
 */
export function useFieldSecurity(fieldName: string): BioFieldRule & {
  isHidden: boolean;
  isReadonly: boolean;
  isRequired: boolean;
} {
  const { getFieldRules } = usePermissions();
  const rules = getFieldRules(fieldName);

  return {
    ...rules,
    isHidden: rules.hidden ?? false,
    isReadonly: rules.readonly ?? false,
    isRequired: rules.required ?? false,
  };
}

// ============================================================
// Conditional Render Component
// ============================================================

export interface SecuredFieldWrapperProps {
  /** Field name for security lookup */
  fieldName: string;
  /** Children to render if not hidden */
  children: React.ReactNode;
  /** Fallback if hidden */
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for conditional rendering based on field security
 */
export function SecuredField({
  fieldName,
  children,
  fallback = null,
}: SecuredFieldWrapperProps) {
  const { isHidden } = useFieldSecurity(fieldName);

  if (isHidden) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

SecuredField.displayName = 'SecuredField';

// ============================================================
// Action Gate Component
// ============================================================

export interface ActionGateProps {
  /** Required permission(s) - single or array */
  permission: string | string[];
  /** Require ALL permissions (default: false = ANY) */
  requireAll?: boolean;
  /** Children to render if permitted */
  children: React.ReactNode;
  /** Fallback if not permitted */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on action permissions
 */
export function ActionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: ActionGateProps) {
  const { can, canAll, canAny } = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasPermission = requireAll
    ? canAll(...permissions)
    : canAny(...permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

ActionGate.displayName = 'ActionGate';

// ============================================================
// Role Gate Component
// ============================================================

export interface RoleGateProps {
  /** Required role(s) - single or array */
  role: string | string[];
  /** Require ALL roles (default: false = ANY) */
  requireAll?: boolean;
  /** Children to render if has role */
  children: React.ReactNode;
  /** Fallback if doesn't have role */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on user roles
 */
export function RoleGate({
  role,
  requireAll = false,
  children,
  fallback = null,
}: RoleGateProps) {
  const { hasRole, hasAnyRole } = usePermissions();

  const roles = Array.isArray(role) ? role : [role];

  const hasRequiredRole = requireAll
    ? roles.every(r => hasRole(r))
    : hasAnyRole(...roles);

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

RoleGate.displayName = 'RoleGate';

// ============================================================
// State Gate Component
// ============================================================

export interface StateGateProps {
  /** Current document state */
  state: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  /** Required action */
  action: string;
  /** Children to render if action allowed */
  children: React.ReactNode;
  /** Fallback if action not allowed */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on document state and action
 */
export function StateGate({
  state,
  action,
  children,
  fallback = null,
}: StateGateProps) {
  const { canActInState } = usePermissions();

  if (!canActInState(state, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

StateGate.displayName = 'StateGate';

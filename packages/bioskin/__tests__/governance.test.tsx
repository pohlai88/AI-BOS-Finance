/**
 * Governance Tests - Sprint E6
 *
 * Tests for RBAC, field-level security, and audit logging.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';

import {
  BioPermissionProvider,
  usePermissions,
  useAudit,
  withFieldSecurity,
  useFieldSecurity,
  SecuredField,
  ActionGate,
  RoleGate,
  StateGate,
  type BioUser,
  type BioPermissionMap,
  type BioFieldSecurityMap,
  type BioAuditEvent,
} from '../src/providers';

// ============================================================
// Test Setup
// ============================================================

const testUser: BioUser = {
  id: 'user-1',
  roles: ['accountant', 'viewer'],
};

const adminUser: BioUser = {
  id: 'admin-1',
  roles: ['admin'],
};

const testPermissions: BioPermissionMap = {
  'invoice:create': ['admin', 'accountant'],
  'invoice:read': ['admin', 'accountant', 'viewer'],
  'invoice:update': ['admin', 'accountant'],
  'invoice:delete': ['admin'],
  'invoice:approve': ['admin', 'manager'],
  'report:view': ['admin', 'accountant', 'viewer'],
  'settings:manage': ['admin'],
};

const testFieldSecurity: BioFieldSecurityMap = {
  'employee.salary': {
    viewer: { hidden: true },
    accountant: { readonly: true },
    admin: {},
  },
  'employee.ssn': {
    '*': { hidden: true },
    admin: { hidden: false, readonly: true },
  },
  'invoice.amount': {
    viewer: { readonly: true },
    accountant: {},
    admin: {},
  },
};

// ============================================================
// Test Components
// ============================================================

function PermissionDisplay() {
  const { user, can, hasRole } = usePermissions();
  return (
    <div>
      <div data-testid="user-id">{user?.id || 'none'}</div>
      <div data-testid="can-create">{can('invoice:create') ? 'yes' : 'no'}</div>
      <div data-testid="can-delete">{can('invoice:delete') ? 'yes' : 'no'}</div>
      <div data-testid="has-admin">{hasRole('admin') ? 'yes' : 'no'}</div>
    </div>
  );
}

function AuditLogger({ resource }: { resource: string }) {
  const audit = useAudit(resource);
  return (
    <div>
      <button onClick={() => audit.create({ name: 'Test' })} data-testid="btn-create">
        Create
      </button>
      <button onClick={() => audit.update('123', { old: true }, { new: true })} data-testid="btn-update">
        Update
      </button>
      <button onClick={() => audit.delete('123', { deleted: true })} data-testid="btn-delete">
        Delete
      </button>
      <button onClick={() => audit.submit('123')} data-testid="btn-submit">
        Submit
      </button>
    </div>
  );
}

// Simple input for HOC testing
const TestInput = (props: React.InputHTMLAttributes<HTMLInputElement> & { __isSecured?: boolean }) => (
  <input data-testid="test-input" data-secured={props.__isSecured} {...props} />
);

const SecuredInput = withFieldSecurity(TestInput);

function FieldSecurityDisplay({ fieldName }: { fieldName: string }) {
  const { isHidden, isReadonly, isRequired } = useFieldSecurity(fieldName);
  return (
    <div>
      <div data-testid="is-hidden">{isHidden ? 'yes' : 'no'}</div>
      <div data-testid="is-readonly">{isReadonly ? 'yes' : 'no'}</div>
      <div data-testid="is-required">{isRequired ? 'yes' : 'no'}</div>
    </div>
  );
}

// ============================================================
// BioPermissionProvider Tests
// ============================================================

describe('BioPermissionProvider - Basic', () => {
  it('provides user context', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <PermissionDisplay />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
  });

  it('handles null user (guest)', () => {
    render(
      <BioPermissionProvider user={null} permissions={testPermissions}>
        <PermissionDisplay />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
  });
});

describe('BioPermissionProvider - Permission Checks', () => {
  it('can() returns true for allowed actions', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <PermissionDisplay />
      </BioPermissionProvider>
    );

    // Accountant can create invoices
    expect(screen.getByTestId('can-create')).toHaveTextContent('yes');
  });

  it('can() returns false for denied actions', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <PermissionDisplay />
      </BioPermissionProvider>
    );

    // Accountant cannot delete invoices
    expect(screen.getByTestId('can-delete')).toHaveTextContent('no');
  });

  it('admin can do everything', () => {
    render(
      <BioPermissionProvider user={adminUser} permissions={testPermissions}>
        <PermissionDisplay />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('can-create')).toHaveTextContent('yes');
    expect(screen.getByTestId('can-delete')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-admin')).toHaveTextContent('yes');
  });
});

// ============================================================
// usePermissions Hook Tests
// ============================================================

describe('usePermissions - Hook', () => {
  it('returns permissive defaults when outside provider', () => {
    // Component outside provider
    function OutsideProvider() {
      const { can, user } = usePermissions();
      return (
        <div>
          <div data-testid="outside-user">{user ? 'has-user' : 'no-user'}</div>
          <div data-testid="outside-can">{can('anything') ? 'yes' : 'no'}</div>
        </div>
      );
    }

    render(<OutsideProvider />);

    // Should be permissive when no provider
    expect(screen.getByTestId('outside-user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('outside-can')).toHaveTextContent('yes');
  });
});

// ============================================================
// Audit Logging Tests
// ============================================================

describe('useAudit - Hook', () => {
  it('calls onAudit callback on create', () => {
    const onAudit = vi.fn();

    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions} onAudit={onAudit}>
        <AuditLogger resource="invoice" />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByTestId('btn-create'));

    expect(onAudit).toHaveBeenCalledTimes(1);
    expect(onAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        resource: 'invoice',
        userId: 'user-1',
        newValue: { name: 'Test' },
      })
    );
  });

  it('calls onAudit callback on update', () => {
    const onAudit = vi.fn();

    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions} onAudit={onAudit}>
        <AuditLogger resource="invoice" />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByTestId('btn-update'));

    expect(onAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update',
        resource: 'invoice',
        resourceId: '123',
        previousValue: { old: true },
        newValue: { new: true },
      })
    );
  });

  it('calls onAudit callback on delete', () => {
    const onAudit = vi.fn();

    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions} onAudit={onAudit}>
        <AuditLogger resource="invoice" />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByTestId('btn-delete'));

    expect(onAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete',
        resource: 'invoice',
        resourceId: '123',
      })
    );
  });

  it('includes timestamp in audit events', () => {
    const onAudit = vi.fn();
    const beforeTime = new Date();

    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions} onAudit={onAudit}>
        <AuditLogger resource="invoice" />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByTestId('btn-submit'));

    const afterTime = new Date();
    const event = onAudit.mock.calls[0][0] as BioAuditEvent;

    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});

// ============================================================
// Field Security Tests
// ============================================================

describe('useFieldSecurity - Hook', () => {
  it('returns hidden=true for viewer on salary field', () => {
    const viewerUser: BioUser = { id: 'viewer-1', roles: ['viewer'] };

    render(
      <BioPermissionProvider user={viewerUser} fieldSecurity={testFieldSecurity}>
        <FieldSecurityDisplay fieldName="employee.salary" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('is-hidden')).toHaveTextContent('yes');
  });

  it('returns readonly=true for accountant-only on salary field', () => {
    // Create user with only accountant role (no viewer role which would hide it)
    const accountantOnlyUser: BioUser = { id: 'acc-1', roles: ['accountant'] };

    render(
      <BioPermissionProvider user={accountantOnlyUser} fieldSecurity={testFieldSecurity}>
        <FieldSecurityDisplay fieldName="employee.salary" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('is-readonly')).toHaveTextContent('yes');
    expect(screen.getByTestId('is-hidden')).toHaveTextContent('no');
  });

  it('applies wildcard (*) rules', () => {
    // SSN is hidden for all by default
    render(
      <BioPermissionProvider user={testUser} fieldSecurity={testFieldSecurity}>
        <FieldSecurityDisplay fieldName="employee.ssn" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('is-hidden')).toHaveTextContent('yes');
  });

  it('admin overrides wildcard rules', () => {
    render(
      <BioPermissionProvider user={adminUser} fieldSecurity={testFieldSecurity}>
        <FieldSecurityDisplay fieldName="employee.ssn" />
      </BioPermissionProvider>
    );

    // Admin can see SSN but it's readonly
    expect(screen.getByTestId('is-hidden')).toHaveTextContent('no');
    expect(screen.getByTestId('is-readonly')).toHaveTextContent('yes');
  });
});

describe('withFieldSecurity - HOC', () => {
  it('renders field when not hidden', () => {
    render(
      <BioPermissionProvider user={testUser} fieldSecurity={testFieldSecurity}>
        <SecuredInput fieldName="invoice.amount" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  it('hides field when hidden rule applies', () => {
    const viewerUser: BioUser = { id: 'viewer-1', roles: ['viewer'] };

    render(
      <BioPermissionProvider user={viewerUser} fieldSecurity={testFieldSecurity}>
        <SecuredInput fieldName="employee.salary" />
      </BioPermissionProvider>
    );

    expect(screen.queryByTestId('test-input')).not.toBeInTheDocument();
  });

  it('makes field readonly when rule applies', () => {
    const viewerUser: BioUser = { id: 'viewer-1', roles: ['viewer'] };

    render(
      <BioPermissionProvider user={viewerUser} fieldSecurity={testFieldSecurity}>
        <SecuredInput fieldName="invoice.amount" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('test-input')).toHaveAttribute('readonly');
  });

  it('marks secured component with __isSecured', () => {
    render(
      <BioPermissionProvider user={testUser} fieldSecurity={testFieldSecurity}>
        <SecuredInput fieldName="invoice.amount" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('test-input')).toHaveAttribute('data-secured', 'true');
  });
});

// ============================================================
// Gate Component Tests
// ============================================================

describe('ActionGate - Component', () => {
  it('renders children when permission granted', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <ActionGate permission="invoice:create">
          <div data-testid="protected-content">Protected</div>
        </ActionGate>
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders fallback when permission denied', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <ActionGate
          permission="invoice:delete"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected-content">Protected</div>
        </ActionGate>
      </BioPermissionProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('supports multiple permissions with requireAll=false (ANY)', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <ActionGate permission={['invoice:delete', 'invoice:read']}>
          <div data-testid="any-content">Any Permission</div>
        </ActionGate>
      </BioPermissionProvider>
    );

    // User can read but not delete, should still render
    expect(screen.getByTestId('any-content')).toBeInTheDocument();
  });

  it('supports multiple permissions with requireAll=true (ALL)', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <ActionGate permission={['invoice:delete', 'invoice:read']} requireAll>
          <div data-testid="all-content">All Permissions</div>
        </ActionGate>
      </BioPermissionProvider>
    );

    // User can read but not delete, should NOT render
    expect(screen.queryByTestId('all-content')).not.toBeInTheDocument();
  });
});

describe('RoleGate - Component', () => {
  it('renders children when user has role', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <RoleGate role="accountant">
          <div data-testid="role-content">Accountant Only</div>
        </RoleGate>
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('role-content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks role', () => {
    render(
      <BioPermissionProvider user={testUser} permissions={testPermissions}>
        <RoleGate role="admin" fallback={<div data-testid="no-role">No Admin</div>}>
          <div data-testid="admin-content">Admin Only</div>
        </RoleGate>
      </BioPermissionProvider>
    );

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('no-role')).toBeInTheDocument();
  });
});

describe('SecuredField - Component', () => {
  it('renders children when field not hidden', () => {
    render(
      <BioPermissionProvider user={testUser} fieldSecurity={testFieldSecurity}>
        <SecuredField fieldName="invoice.amount">
          <input data-testid="secured-input" />
        </SecuredField>
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('secured-input')).toBeInTheDocument();
  });

  it('renders fallback when field hidden', () => {
    const viewerUser: BioUser = { id: 'viewer-1', roles: ['viewer'] };

    render(
      <BioPermissionProvider user={viewerUser} fieldSecurity={testFieldSecurity}>
        <SecuredField
          fieldName="employee.salary"
          fallback={<div data-testid="hidden-fallback">Hidden</div>}
        >
          <input data-testid="salary-input" />
        </SecuredField>
      </BioPermissionProvider>
    );

    expect(screen.queryByTestId('salary-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('hidden-fallback')).toBeInTheDocument();
  });
});

// ============================================================
// State-Based Permission Tests
// ============================================================

describe('State Permissions', () => {
  function StatePermissionDisplay({ state, action }: { state: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'; action: string }) {
    const { canActInState, canTransition } = usePermissions();
    return (
      <div>
        <div data-testid="can-act">{canActInState(state, action) ? 'yes' : 'no'}</div>
        <div data-testid="can-submit">{canTransition('draft', 'submitted') ? 'yes' : 'no'}</div>
      </div>
    );
  }

  it('allows edit in draft state', () => {
    const editorUser: BioUser = { id: 'editor-1', roles: ['editor'] };

    render(
      <BioPermissionProvider user={editorUser}>
        <StatePermissionDisplay state="draft" action="edit" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('can-act')).toHaveTextContent('yes');
  });

  it('denies edit in approved state', () => {
    const editorUser: BioUser = { id: 'editor-1', roles: ['editor'] };

    render(
      <BioPermissionProvider user={editorUser}>
        <StatePermissionDisplay state="approved" action="edit" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('can-act')).toHaveTextContent('no');
  });

  it('allows transition from draft to submitted', () => {
    const editorUser: BioUser = { id: 'editor-1', roles: ['editor'] };

    render(
      <BioPermissionProvider user={editorUser}>
        <StatePermissionDisplay state="draft" action="submit" />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('can-submit')).toHaveTextContent('yes');
  });
});

describe('StateGate - Component', () => {
  it('renders children when action allowed in state', () => {
    const editorUser: BioUser = { id: 'editor-1', roles: ['editor'] };

    render(
      <BioPermissionProvider user={editorUser}>
        <StateGate state="draft" action="edit">
          <button data-testid="edit-btn">Edit</button>
        </StateGate>
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
  });

  it('renders fallback when action not allowed in state', () => {
    const editorUser: BioUser = { id: 'editor-1', roles: ['editor'] };

    render(
      <BioPermissionProvider user={editorUser}>
        <StateGate
          state="approved"
          action="edit"
          fallback={<span data-testid="no-edit">Cannot edit approved</span>}
        >
          <button data-testid="edit-btn">Edit</button>
        </StateGate>
      </BioPermissionProvider>
    );

    expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('no-edit')).toBeInTheDocument();
  });
});

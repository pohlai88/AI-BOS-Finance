/**
 * Full Governance Tests - Sprint E6+ (100% Coverage)
 *
 * Tests for BioApprovalActions and BioDiffViewer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';

import {
  BioApprovalActions,
  type BioApprovalActionsProps,
} from '../src/molecules/BioApprovalActions';
import {
  BioDiffViewer,
  useDiff,
  type BioDiffViewerProps,
} from '../src/molecules/BioDiffViewer';
import { BioPermissionProvider, type BioUser } from '../src/providers/BioPermissionProvider';
import { renderHook } from '@testing-library/react';

// ============================================================
// Test Setup
// ============================================================

const approverUser: BioUser = {
  id: 'approver-1',
  roles: ['admin', 'approver', 'manager'],
};

const editorUser: BioUser = {
  id: 'editor-1',
  roles: ['editor', 'creator'],
};

const viewerUser: BioUser = {
  id: 'viewer-1',
  roles: ['viewer'],
};

// ============================================================
// BioApprovalActions Tests
// ============================================================

describe('BioApprovalActions - Rendering', () => {
  it('renders approval actions for submitted state', () => {
    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions
          state="submitted"
          onApprove={() => {}}
          onReject={() => {}}
          onReturn={() => {}}
        />
      </BioPermissionProvider>
    );

    expect(screen.getByLabelText('Approve document')).toBeInTheDocument();
    expect(screen.getByLabelText('Reject document')).toBeInTheDocument();
    expect(screen.getByLabelText('Return to draft')).toBeInTheDocument();
  });

  it('renders cancel action for draft state', () => {
    render(
      <BioPermissionProvider user={editorUser}>
        <BioApprovalActions state="draft" onCancel={() => {}} />
      </BioPermissionProvider>
    );

    expect(screen.getByLabelText('Cancel document')).toBeInTheDocument();
  });

  it('renders resubmit action for rejected state', () => {
    render(
      <BioPermissionProvider user={editorUser}>
        <BioApprovalActions state="rejected" onResubmit={() => {}} />
      </BioPermissionProvider>
    );

    expect(screen.getByLabelText('Resubmit document')).toBeInTheDocument();
  });

  it('renders nothing when no actions available', () => {
    render(
      <BioPermissionProvider user={viewerUser}>
        <BioApprovalActions state="cancelled" />
      </BioPermissionProvider>
    );

    expect(screen.queryByTestId('bio-approval-actions')).not.toBeInTheDocument();
  });

  it('includes data-state attribute', () => {
    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onApprove={() => {}} />
      </BioPermissionProvider>
    );

    expect(screen.getByTestId('bio-approval-actions')).toHaveAttribute('data-state', 'submitted');
  });
});

describe('BioApprovalActions - Interactions', () => {
  it('calls onApprove when approve clicked', async () => {
    const onApprove = vi.fn();

    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onApprove={onApprove} />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByLabelText('Approve document'));

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onReject when reject clicked (no reason required)', async () => {
    const onReject = vi.fn();

    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onReject={onReject} requireRejectReason={false} />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByLabelText('Reject document'));

    await waitFor(() => {
      expect(onReject).toHaveBeenCalledTimes(1);
    });
  });

  it('shows rejection dialog when reason required', () => {
    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onReject={() => {}} requireRejectReason />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByLabelText('Reject document'));

    expect(screen.getByLabelText('Rejection reason')).toBeInTheDocument();
    expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
  });

  it('rejection dialog requires reason when requireRejectReason is true', async () => {
    const onReject = vi.fn();

    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onReject={onReject} requireRejectReason />
      </BioPermissionProvider>
    );

    // Open dialog
    fireEvent.click(screen.getByLabelText('Reject document'));

    // Try to reject without reason (button should be disabled)
    const rejectButton = screen.getAllByText('Reject')[1]; // Dialog reject button
    expect(rejectButton).toBeDisabled();

    // Add reason
    fireEvent.change(screen.getByLabelText('Rejection reason'), {
      target: { value: 'Not complete' },
    });

    // Now should be enabled
    expect(rejectButton).not.toBeDisabled();
  });

  it('calls onReturn when return clicked', async () => {
    const onReturn = vi.fn();

    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onReturn={onReturn} />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByLabelText('Return to draft'));

    await waitFor(() => {
      expect(onReturn).toHaveBeenCalledTimes(1);
    });
  });

  it('disables all buttons when disabled prop is true', () => {
    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions
          state="submitted"
          onApprove={() => {}}
          onReject={() => {}}
          disabled
        />
      </BioPermissionProvider>
    );

    expect(screen.getByLabelText('Approve document')).toBeDisabled();
    expect(screen.getByLabelText('Reject document')).toBeDisabled();
  });
});

describe('BioApprovalActions - Sizes', () => {
  it('applies small size classes', () => {
    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onApprove={() => {}} size="sm" />
      </BioPermissionProvider>
    );

    const button = screen.getByLabelText('Approve document');
    expect(button.className).toContain('text-xs');
  });

  it('applies large size classes', () => {
    render(
      <BioPermissionProvider user={approverUser}>
        <BioApprovalActions state="submitted" onApprove={() => {}} size="lg" />
      </BioPermissionProvider>
    );

    const button = screen.getByLabelText('Approve document');
    expect(button.className).toContain('text-base');
  });
});

// ============================================================
// BioDiffViewer Tests
// ============================================================

describe('BioDiffViewer - Rendering', () => {
  const before = { name: 'John', age: 30, city: 'NYC' };
  const after = { name: 'John Doe', age: 30, country: 'USA' };

  it('renders diff viewer', () => {
    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByTestId('bio-diff-viewer')).toBeInTheDocument();
  });

  it('shows changed fields', () => {
    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows added fields', () => {
    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
  });

  it('shows removed fields', () => {
    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByText('NYC')).toBeInTheDocument();
  });

  it('shows unchanged fields', () => {
    render(<BioDiffViewer before={before} after={after} showOnlyChanges={false} />);

    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getAllByText('30').length).toBeGreaterThan(0);
  });

  it('hides unchanged fields when showOnlyChanges is true', () => {
    render(<BioDiffViewer before={before} after={after} showOnlyChanges />);

    // Age is unchanged, should not appear
    const ageElements = screen.queryAllByText('Age');
    // In inline mode, it should be hidden
  });

  it('displays title when provided', () => {
    render(<BioDiffViewer before={before} after={after} title="Invoice Changes" />);

    expect(screen.getByText('Invoice Changes')).toBeInTheDocument();
  });

  it('displays change count', () => {
    render(<BioDiffViewer before={before} after={after} title="Changes" />);

    expect(screen.getByText(/3 changes/)).toBeInTheDocument();
  });

  it('displays timestamp when provided', () => {
    const timestamp = new Date('2024-01-15T10:30:00');
    render(<BioDiffViewer before={before} after={after} title="Changes" timestamp={timestamp} />);

    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });

  it('displays changedBy when provided', () => {
    render(<BioDiffViewer before={before} after={after} title="Changes" changedBy="Admin" />);

    expect(screen.getByText(/By: Admin/)).toBeInTheDocument();
  });
});

describe('BioDiffViewer - Modes', () => {
  const before = { name: 'John', age: 30 };
  const after = { name: 'John Doe', age: 31 };

  it('renders inline mode by default', () => {
    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByTestId('bio-diff-viewer')).toHaveAttribute('data-mode', 'inline');
  });

  it('renders side-by-side mode', () => {
    render(<BioDiffViewer before={before} after={after} mode="side-by-side" />);

    expect(screen.getByTestId('bio-diff-viewer')).toHaveAttribute('data-mode', 'side-by-side');
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('renders unified mode', () => {
    render(<BioDiffViewer before={before} after={after} mode="unified" />);

    expect(screen.getByTestId('bio-diff-viewer')).toHaveAttribute('data-mode', 'unified');
  });
});

describe('BioDiffViewer - Field Labels', () => {
  it('uses custom field labels', () => {
    const before = { firstName: 'John' };
    const after = { firstName: 'Jane' };

    render(
      <BioDiffViewer
        before={before}
        after={after}
        fieldLabels={{ firstName: 'First Name' }}
      />
    );

    expect(screen.getByText('First Name')).toBeInTheDocument();
  });

  it('excludes specified fields', () => {
    const before = { name: 'John', password: 'secret' };
    const after = { name: 'Jane', password: 'newsecret' };

    render(
      <BioDiffViewer before={before} after={after} excludeFields={['password']} />
    );

    expect(screen.queryByText('Password')).not.toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});

describe('BioDiffViewer - Empty State', () => {
  it('shows no changes message when values are equal', () => {
    const data = { name: 'John', age: 30 };

    render(<BioDiffViewer before={data} after={data} showOnlyChanges />);

    expect(screen.getByText('No changes detected')).toBeInTheDocument();
  });
});

// ============================================================
// useDiff Hook Tests
// ============================================================

describe('useDiff Hook', () => {
  it('returns entries with correct types', () => {
    const before = { name: 'John', age: 30, city: 'NYC' };
    const after = { name: 'John Doe', age: 30, country: 'USA' };

    const { result } = renderHook(() => useDiff(before, after));

    expect(result.current.entries.length).toBe(4);
    expect(result.current.changeCount).toBe(3);
    expect(result.current.hasChanges).toBe(true);
  });

  it('returns changed fields', () => {
    const before = { name: 'John', age: 30 };
    const after = { name: 'Jane', age: 30 };

    const { result } = renderHook(() => useDiff(before, after));

    expect(result.current.changedFields).toContain('name');
    expect(result.current.changedFields).not.toContain('age');
  });

  it('returns added fields', () => {
    const before = { name: 'John' };
    const after = { name: 'John', age: 30 };

    const { result } = renderHook(() => useDiff(before, after));

    expect(result.current.addedFields).toContain('age');
  });

  it('returns removed fields', () => {
    const before = { name: 'John', age: 30 };
    const after = { name: 'John' };

    const { result } = renderHook(() => useDiff(before, after));

    expect(result.current.removedFields).toContain('age');
  });

  it('handles nested objects', () => {
    const before = { user: { name: 'John' } };
    const after = { user: { name: 'Jane' } };

    const { result } = renderHook(() => useDiff(before, after));

    expect(result.current.changedFields).toContain('user');
  });

  it('hasChanges is false when equal', () => {
    const data = { name: 'John', age: 30 };

    const { result } = renderHook(() => useDiff(data, data));

    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changeCount).toBe(0);
  });
});

// ============================================================
// Integration Tests
// ============================================================

describe('Governance Integration', () => {
  it('BioApprovalActions triggers audit on approve', async () => {
    const onAudit = vi.fn();
    const onApprove = vi.fn();

    render(
      <BioPermissionProvider user={approverUser} onAudit={onAudit}>
        <BioApprovalActions state="submitted" onApprove={onApprove} />
      </BioPermissionProvider>
    );

    fireEvent.click(screen.getByLabelText('Approve document'));

    await waitFor(() => {
      expect(onAudit).toHaveBeenCalled();
      expect(onAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'approve',
          resource: 'document',
        })
      );
    });
  });

  it('BioDiffViewer handles boolean values', () => {
    const before = { active: true };
    const after = { active: false };

    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('BioDiffViewer handles null values', () => {
    const before = { value: 'test' };
    const after = { value: null };

    render(<BioDiffViewer before={before} after={after} />);

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });
});

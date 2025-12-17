/**
 * Finance ERP Components Test Suite
 *
 * Tests for Sprint F1-F4 components:
 * - BioDrilldown
 * - BioActiveFilters
 * - BioReconciliation
 * - BioPeriodClose
 * - BioSavedViews
 * - BioBulkActions
 * - BioExplainer
 * - BioExceptionDashboard
 * - BioPrintTemplate
 * - Accounting Schemas
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';

// Components
import { BioDrilldown } from '../src/molecules/BioDrilldown';
import { BioActiveFilters } from '../src/molecules/BioActiveFilters';
import { BioSavedViews } from '../src/molecules/BioSavedViews';
import { BioBulkActions } from '../src/molecules/BioBulkActions';
import { BioExplainer } from '../src/molecules/BioExplainer';
import { BioExceptionDashboard } from '../src/molecules/BioExceptionDashboard';
import { BioPrintTemplate } from '../src/molecules/BioPrintTemplate';
import { BioReconciliation } from '../src/organisms/BioReconciliation';
import { BioPeriodClose } from '../src/organisms/BioPeriodClose';

// Schemas
import {
  JournalEntrySchema,
  JournalEntryLineSchema,
  InvoiceSchema,
  validateBalance,
  requiresTaxCode,
  createReversalEntry,
  roundAmount,
  amountsEqual,
  sumAmounts,
} from '../src/schemas/accounting';

// Provider wrapper
import { BioLocaleProvider } from '../src/providers/BioLocaleProvider';
import { BioPermissionProvider } from '../src/providers/BioPermissionProvider';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BioLocaleProvider>
    <BioPermissionProvider user={{ id: '1', roles: ['admin'] }}>
      {children}
    </BioPermissionProvider>
  </BioLocaleProvider>
);

// ============================================================
// BioDrilldown Tests
// ============================================================

describe('BioDrilldown', () => {
  it('renders formatted currency value', () => {
    render(
      <Wrapper>
        <BioDrilldown value={1500.50} format="currency" currency="USD" />
      </Wrapper>
    );

    // Should contain the formatted amount
    expect(screen.getByRole('button')).toHaveTextContent('$');
    expect(screen.getByRole('button')).toHaveTextContent('1,500');
  });

  it('renders percent format', () => {
    render(
      <Wrapper>
        <BioDrilldown value={25} format="percent" />
      </Wrapper>
    );

    expect(screen.getByRole('button')).toHaveTextContent('25%');
  });

  it('shows negative values in red', () => {
    render(
      <Wrapper>
        <BioDrilldown value={-1000} format="currency" />
      </Wrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-red-600');
  });

  it('calls onDrilldown with filters', async () => {
    const onDrilldown = vi.fn();
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioDrilldown
          value={1000}
          filters={{ account: '4000', period: '2025-01' }}
          entity="gl"
          onDrilldown={onDrilldown}
        />
      </Wrapper>
    );

    await user.click(screen.getByRole('button'));

    expect(onDrilldown).toHaveBeenCalledWith({
      entity: 'gl',
      filters: { account: '4000', period: '2025-01' },
    });
  });

  it('shows trend indicator', () => {
    render(
      <Wrapper>
        <BioDrilldown value={1000} trend="up" />
      </Wrapper>
    );

    // Should have green trend icon
    const button = screen.getByRole('button');
    expect(button.querySelector('.text-green-600')).toBeInTheDocument();
  });
});

// ============================================================
// BioActiveFilters Tests
// ============================================================

describe('BioActiveFilters', () => {
  const filters = [
    { field: 'entity', label: 'Entity', value: 'Company A' },
    { field: 'period', label: 'Period', value: '2025-01' },
    { field: 'status', label: 'Status', value: 'Posted' },
  ];

  it('renders all filter chips', () => {
    render(
      <Wrapper>
        <BioActiveFilters filters={filters} />
      </Wrapper>
    );

    expect(screen.getByText('Entity')).toBeInTheDocument();
    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('2025-01')).toBeInTheDocument();
  });

  it('shows filter count', () => {
    render(
      <Wrapper>
        <BioActiveFilters filters={filters} />
      </Wrapper>
    );

    expect(screen.getByText('3 filters:')).toBeInTheDocument();
  });

  it('calls onClear when filter is removed', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioActiveFilters filters={filters} onClear={onClear} />
      </Wrapper>
    );

    const clearButtons = screen.getAllByRole('button', { name: /clear/i });
    await user.click(clearButtons[0]);

    expect(onClear).toHaveBeenCalledWith('entity');
  });

  it('calls onClearAll when clear all is clicked', async () => {
    const onClearAll = vi.fn();
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioActiveFilters filters={filters} onClearAll={onClearAll} />
      </Wrapper>
    );

    await user.click(screen.getByText('Clear all'));

    expect(onClearAll).toHaveBeenCalled();
  });

  it('returns null when no filters', () => {
    const { container } = render(
      <Wrapper>
        <BioActiveFilters filters={[]} />
      </Wrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});

// ============================================================
// BioSavedViews Tests
// ============================================================

describe('BioSavedViews', () => {
  const views = [
    { id: '1', name: 'My Draft Invoices', entityType: 'invoices', filters: { status: 'draft' } },
    { id: '2', name: 'Posted Q1', entityType: 'invoices', filters: { status: 'posted', period: 'Q1' }, isDefault: true },
  ];

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioSavedViews
          entityType="invoices"
          currentFilters={{}}
          views={views}
        />
      </Wrapper>
    );

    await user.click(screen.getByText('Saved Views'));

    expect(screen.getByText('My Draft Invoices')).toBeInTheDocument();
    expect(screen.getByText('Posted Q1')).toBeInTheDocument();
  });

  it('shows default view indicator', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioSavedViews
          entityType="invoices"
          currentFilters={{}}
          views={views}
        />
      </Wrapper>
    );

    await user.click(screen.getByText('Saved Views'));

    // Default view should have star icon
    const defaultView = screen.getByText('Posted Q1').closest('div');
    expect(defaultView?.querySelector('.fill-amber-500')).toBeInTheDocument();
  });

  it('calls onLoad when view is selected', async () => {
    const onLoad = vi.fn();
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioSavedViews
          entityType="invoices"
          currentFilters={{}}
          views={views}
          onLoad={onLoad}
        />
      </Wrapper>
    );

    await user.click(screen.getByText('Saved Views'));
    await user.click(screen.getByText('My Draft Invoices'));

    expect(onLoad).toHaveBeenCalledWith(views[0]);
  });
});

// ============================================================
// BioBulkActions Tests
// ============================================================

describe('BioBulkActions', () => {
  const selectedItems = [
    { id: '1', status: 'submitted' },
    { id: '2', status: 'submitted' },
    { id: '3', status: 'draft' },
  ];

  const actions = [
    {
      id: 'approve',
      label: 'Approve',
      requiredState: 'submitted',
      onExecute: vi.fn().mockResolvedValue({ success: [], failed: [], skipped: [] }),
    },
    {
      id: 'post',
      label: 'Post',
      requiredState: 'approved',
      onExecute: vi.fn().mockResolvedValue({ success: [], failed: [], skipped: [] }),
    },
  ];

  it('shows selected count', () => {
    render(
      <Wrapper>
        <BioBulkActions selectedItems={selectedItems} actions={actions} />
      </Wrapper>
    );

    expect(screen.getByText('Actions (3)')).toBeInTheDocument();
  });

  it('shows eligible count for actions', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioBulkActions selectedItems={selectedItems} actions={actions} />
      </Wrapper>
    );

    await user.click(screen.getByText('Actions (3)'));

    // 2 items are in 'submitted' state, so approve should show 2 of 3 eligible
    expect(screen.getByText('2 of 3 eligible')).toBeInTheDocument();
  });

  it('returns null when no items selected', () => {
    const { container } = render(
      <Wrapper>
        <BioBulkActions selectedItems={[]} actions={actions} />
      </Wrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});

// ============================================================
// BioExplainer Tests
// ============================================================

describe('BioExplainer', () => {
  const explanation = {
    formula: 'SUM(lines.amount)',
    accounts: ['4000 - Sales', '4010 - Services'],
    currency: 'USD',
    rounding: 'half-up, 2 decimals',
  };

  it('renders value with info icon', () => {
    render(
      <Wrapper>
        <BioExplainer value={10000} format="currency" explanation={explanation} />
      </Wrapper>
    );

    expect(screen.getByLabelText('Explain this number')).toBeInTheDocument();
  });

  it('opens popover on click', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioExplainer value={10000} format="currency" explanation={explanation} />
      </Wrapper>
    );

    await user.click(screen.getByLabelText('Explain this number'));

    expect(screen.getByText('Number Explanation')).toBeInTheDocument();
    expect(screen.getByText('SUM(lines.amount)')).toBeInTheDocument();
    expect(screen.getByText('4000 - Sales')).toBeInTheDocument();
  });

  it('shows FX rate info when provided', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioExplainer
          value={10000}
          format="currency"
          explanation={{
            ...explanation,
            fxRate: { source: 'ECB', rate: 1.08, date: '2025-01-15' },
          }}
        />
      </Wrapper>
    );

    await user.click(screen.getByLabelText('Explain this number'));

    expect(screen.getByText(/1\.0800/)).toBeInTheDocument();
    expect(screen.getByText(/ECB/)).toBeInTheDocument();
  });
});

// ============================================================
// BioExceptionDashboard Tests
// ============================================================

describe('BioExceptionDashboard', () => {
  const exceptions = [
    {
      type: 'duplicate_invoice',
      label: 'Duplicate Invoice',
      severity: 'high' as const,
      count: 3,
      items: [
        { id: '1', data: {}, message: 'Invoice INV-001 may be duplicate' },
        { id: '2', data: {}, message: 'Invoice INV-002 may be duplicate' },
      ],
    },
    {
      type: 'missing_tax',
      label: 'Missing Tax Code',
      severity: 'medium' as const,
      count: 5,
      items: [],
    },
  ];

  it('renders exception cards', () => {
    render(
      <Wrapper>
        <BioExceptionDashboard exceptions={exceptions} />
      </Wrapper>
    );

    expect(screen.getByText('Duplicate Invoice')).toBeInTheDocument();
    expect(screen.getByText('Missing Tax Code')).toBeInTheDocument();
  });

  it('shows total count', () => {
    render(
      <Wrapper>
        <BioExceptionDashboard exceptions={exceptions} />
      </Wrapper>
    );

    expect(screen.getByText('8')).toBeInTheDocument(); // 3 + 5
  });

  it('shows empty state when no exceptions', () => {
    render(
      <Wrapper>
        <BioExceptionDashboard exceptions={[]} />
      </Wrapper>
    );

    expect(screen.getByText('No Exceptions')).toBeInTheDocument();
    expect(screen.getByText('All items are in good standing')).toBeInTheDocument();
  });

  it('expands to show items', async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <BioExceptionDashboard exceptions={exceptions} />
      </Wrapper>
    );

    await user.click(screen.getByText('Duplicate Invoice'));

    expect(screen.getByText('Invoice INV-001 may be duplicate')).toBeInTheDocument();
  });
});

// ============================================================
// BioPrintTemplate Tests
// ============================================================

describe('BioPrintTemplate', () => {
  it('renders invoice template', () => {
    const invoiceData = {
      invoiceNo: 'INV-001',
      invoiceDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      customerName: 'Acme Corp',
      lines: [
        { description: 'Consulting', quantity: 10, unitPrice: 100, amount: 1000 },
      ],
      subtotal: 1000,
      taxTotal: 70,
      total: 1070,
      currency: 'USD',
    };

    render(
      <Wrapper>
        <BioPrintTemplate
          type="invoice"
          data={invoiceData}
          config={{
            header: { title: 'Invoice' },
          }}
        />
      </Wrapper>
    );

    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText('#INV-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Consulting')).toBeInTheDocument();
  });

  it('renders journal entry template', () => {
    const jeData = {
      documentNo: 'JE-001',
      postingDate: new Date('2025-01-15'),
      description: 'Month-end adjustment',
      lines: [
        { account: '4000', accountName: 'Sales', debit: 0, credit: 1000 },
        { account: '1200', accountName: 'AR', debit: 1000, credit: 0 },
      ],
      currency: 'USD',
    };

    render(
      <Wrapper>
        <BioPrintTemplate
          type="journal_entry"
          data={jeData}
          config={{
            header: { title: 'Journal Entry' },
          }}
        />
      </Wrapper>
    );

    expect(screen.getByText('Journal Entry')).toBeInTheDocument();
    expect(screen.getByText('Month-end adjustment')).toBeInTheDocument();
    expect(screen.getByText('4000')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('shows signatures in footer', () => {
    render(
      <Wrapper>
        <BioPrintTemplate
          type="invoice"
          data={{}}
          config={{
            footer: {
              signatures: ['Prepared By', 'Approved By'],
            },
          }}
        />
      </Wrapper>
    );

    expect(screen.getByText('Prepared By')).toBeInTheDocument();
    expect(screen.getByText('Approved By')).toBeInTheDocument();
  });
});

// ============================================================
// BioReconciliation Tests
// ============================================================

describe('BioReconciliation', () => {
  const leftPane = {
    title: 'Bank Statement',
    data: [
      { id: '1', data: {}, amount: 1000, date: new Date(), reference: 'TXN001' },
      { id: '2', data: {}, amount: 500, date: new Date(), reference: 'TXN002' },
    ],
    columns: [
      { id: 'amount', header: 'Amount', accessor: (item: any) => `$${item.amount}` },
    ],
  };

  const rightPane = {
    title: 'Ledger',
    data: [
      { id: 'a', data: {}, amount: 1000, date: new Date(), reference: 'INV001' },
      { id: 'b', data: {}, amount: 500, date: new Date(), reference: 'INV002' },
    ],
    columns: [
      { id: 'amount', header: 'Amount', accessor: (item: any) => `$${item.amount}` },
    ],
  };

  it('renders both panes', () => {
    render(
      <Wrapper>
        <BioReconciliation leftPane={leftPane} rightPane={rightPane} />
      </Wrapper>
    );

    expect(screen.getByText('Bank Statement')).toBeInTheDocument();
    expect(screen.getByText('Ledger')).toBeInTheDocument();
  });

  it('shows unmatched counts', () => {
    render(
      <Wrapper>
        <BioReconciliation leftPane={leftPane} rightPane={rightPane} />
      </Wrapper>
    );

    expect(screen.getAllByText('2 unmatched')).toHaveLength(2);
  });

  it('shows totals', () => {
    render(
      <Wrapper>
        <BioReconciliation leftPane={leftPane} rightPane={rightPane} />
      </Wrapper>
    );

    expect(screen.getAllByText('$1,500.00')).toHaveLength(2);
  });
});

// ============================================================
// BioPeriodClose Tests
// ============================================================

describe('BioPeriodClose', () => {
  const checklist = [
    { id: 'unposted', label: 'Post all documents', isBlocking: true, check: () => 0 },
    { id: 'recon', label: 'Complete reconciliation', isBlocking: true, check: () => 2 },
    { id: 'review', label: 'Manager review', isBlocking: false, check: () => 1 },
  ];

  it('renders period header', () => {
    render(
      <Wrapper>
        <BioPeriodClose period={{ year: 2025, month: 1 }} checklist={checklist} />
      </Wrapper>
    );

    expect(screen.getByText('January 2025')).toBeInTheDocument();
    expect(screen.getByText('Period Close Cockpit')).toBeInTheDocument();
  });

  it('renders checklist items', () => {
    render(
      <Wrapper>
        <BioPeriodClose period={{ year: 2025, month: 1 }} checklist={checklist} />
      </Wrapper>
    );

    expect(screen.getByText('Post all documents')).toBeInTheDocument();
    expect(screen.getByText('Complete reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Manager review')).toBeInTheDocument();
  });

  it('shows lock button when can close', async () => {
    const onLock = vi.fn();
    const allCompleteChecklist = [
      { id: 'test', label: 'Test item', isBlocking: true, check: () => 0 },
    ];

    render(
      <Wrapper>
        <BioPeriodClose
          period={{ year: 2025, month: 1 }}
          checklist={allCompleteChecklist}
          onLock={onLock}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Close & Lock Period')).not.toBeDisabled();
    });
  });
});

// ============================================================
// Accounting Schema Tests
// ============================================================

describe('Accounting Schemas', () => {
  describe('JournalEntryLineSchema', () => {
    it('validates a correct line', () => {
      const result = JournalEntryLineSchema.safeParse({
        account: '4000',
        debit: 1000,
        credit: 0,
      });

      expect(result.success).toBe(true);
    });

    it('rejects line with both debit and credit', () => {
      const result = JournalEntryLineSchema.safeParse({
        account: '4000',
        debit: 1000,
        credit: 500,
      });

      expect(result.success).toBe(false);
    });

    it('rejects line with zero amounts', () => {
      const result = JournalEntryLineSchema.safeParse({
        account: '4000',
        debit: 0,
        credit: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('JournalEntrySchema', () => {
    it('validates balanced entry', () => {
      const result = JournalEntrySchema.safeParse({
        postingDate: new Date(),
        lines: [
          { account: '4000', debit: 1000, credit: 0 },
          { account: '1200', debit: 0, credit: 1000 },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('rejects unbalanced entry', () => {
      const result = JournalEntrySchema.safeParse({
        postingDate: new Date(),
        lines: [
          { account: '4000', debit: 1000, credit: 0 },
          { account: '1200', debit: 0, credit: 500 },
        ],
      });

      expect(result.success).toBe(false);
    });

    it('rejects entry with only one line', () => {
      const result = JournalEntrySchema.safeParse({
        postingDate: new Date(),
        lines: [
          { account: '4000', debit: 1000, credit: 0 },
        ],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateBalance', () => {
    it('returns balanced for equal debits/credits', () => {
      const result = validateBalance([
        { account: '4000', debit: 1000, credit: 0 },
        { account: '1200', debit: 0, credit: 1000 },
      ]);

      expect(result.isBalanced).toBe(true);
      expect(result.difference).toBe(0);
    });

    it('returns unbalanced with correct difference', () => {
      const result = validateBalance([
        { account: '4000', debit: 1000, credit: 0 },
        { account: '1200', debit: 0, credit: 700 },
      ]);

      expect(result.isBalanced).toBe(false);
      expect(result.difference).toBe(300);
    });
  });

  describe('requiresTaxCode', () => {
    it('returns true for P&L accounts', () => {
      expect(requiresTaxCode('4000')).toBe(true); // Revenue
      expect(requiresTaxCode('5000')).toBe(true); // COGS
      expect(requiresTaxCode('6000')).toBe(true); // Expense
      expect(requiresTaxCode('7000')).toBe(true); // Other income
    });

    it('returns false for balance sheet accounts', () => {
      expect(requiresTaxCode('1000')).toBe(false); // Asset
      expect(requiresTaxCode('2000')).toBe(false); // Liability
      expect(requiresTaxCode('3000')).toBe(false); // Equity
    });
  });

  describe('roundAmount', () => {
    it('rounds to 2 decimals by default', () => {
      expect(roundAmount(10.126)).toBe(10.13);
      expect(roundAmount(10.124)).toBe(10.12);
    });

    it('handles specified decimal places', () => {
      expect(roundAmount(10.1266, 3)).toBe(10.127);
      expect(roundAmount(10.1264, 3)).toBe(10.126);
    });
  });

  describe('amountsEqual', () => {
    it('returns true for equal amounts', () => {
      expect(amountsEqual(100.00, 100.00)).toBe(true);
    });

    it('returns true within tolerance', () => {
      expect(amountsEqual(100.00, 100.004)).toBe(true);
    });

    it('returns false outside tolerance', () => {
      expect(amountsEqual(100.00, 100.01)).toBe(false);
    });
  });

  describe('sumAmounts', () => {
    it('sums with proper rounding', () => {
      expect(sumAmounts([10.10, 20.20, 30.30])).toBe(60.60);
    });

    it('handles floating point precision', () => {
      expect(sumAmounts([0.1, 0.2, 0.3])).toBe(0.60);
    });
  });

  describe('createReversalEntry', () => {
    it('creates reversal with swapped debits/credits', () => {
      const original = {
        documentNo: 'JE-001',
        postingDate: new Date('2025-01-15'),
        currency: 'USD',
        exchangeRate: 1,
        lines: [
          { account: '4000', debit: 1000, credit: 0, description: 'Original' },
          { account: '1200', debit: 0, credit: 1000, description: 'Original' },
        ],
      };

      const reversal = createReversalEntry(original as any, new Date('2025-01-20'), 'Error correction');

      expect(reversal.isReversal).toBe(true);
      expect(reversal.reversedEntryRef).toBe('JE-001');
      expect(reversal.lines[0].debit).toBe(0);
      expect(reversal.lines[0].credit).toBe(1000);
      expect(reversal.lines[1].debit).toBe(1000);
      expect(reversal.lines[1].credit).toBe(0);
    });
  });
});

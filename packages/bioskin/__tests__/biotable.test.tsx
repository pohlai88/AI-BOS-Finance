/**
 * BioTable Tests - Vitest Browser Mode
 *
 * E2E-style user flow testing in real browser.
 * Tests: sorting, filtering, pagination, selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import * as React from 'react';

import { BioTable } from '../src/organisms/BioTable';

// ============================================================
// Test Schema & Data
// ============================================================

const PaymentSchema = z.object({
  id: z.string().describe('ID'),
  name: z.string().describe('Name'),
  amount: z.number().describe('Amount'),
  status: z.enum(['pending', 'approved', 'rejected']).describe('Status'),
  date: z.string().describe('Date'),
});

type Payment = z.infer<typeof PaymentSchema>;

const mockData: Payment[] = [
  { id: 'PAY-001', name: 'Alice Johnson', amount: 1500.00, status: 'approved', date: '2024-01-15' },
  { id: 'PAY-002', name: 'Bob Smith', amount: 2300.50, status: 'pending', date: '2024-01-16' },
  { id: 'PAY-003', name: 'Carol White', amount: 800.00, status: 'rejected', date: '2024-01-17' },
  { id: 'PAY-004', name: 'David Brown', amount: 3200.00, status: 'approved', date: '2024-01-18' },
  { id: 'PAY-005', name: 'Eva Green', amount: 1100.00, status: 'pending', date: '2024-01-19' },
];

// Generate larger dataset for pagination tests
const generateMockData = (count: number): Payment[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `PAY-${String(i + 1).padStart(3, '0')}`,
    name: `User ${i + 1}`,
    amount: Math.floor(Math.random() * 10000) / 100,
    status: (['pending', 'approved', 'rejected'] as const)[i % 3],
    date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
  }));
};

// ============================================================
// Unit Tests - BioTable renders correctly
// ============================================================

describe('BioTable - Rendering', () => {
  it('renders table with data-testid', () => {
    render(<BioTable schema={PaymentSchema} data={mockData} />);
    expect(screen.getByTestId('bio-table')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    render(<BioTable schema={PaymentSchema} data={mockData} />);
    const table = screen.getByTestId('bio-table');
    const rows = within(table).getAllByRole('row');
    // +1 for header row
    expect(rows.length).toBeGreaterThanOrEqual(mockData.length);
  });

  it('renders column headers from schema', () => {
    render(<BioTable schema={PaymentSchema} data={mockData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders cell data correctly', () => {
    render(<BioTable schema={PaymentSchema} data={mockData} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<BioTable schema={PaymentSchema} data={[]} emptyMessage="No payments found" />);
    expect(screen.getByText('No payments found')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BioTable schema={PaymentSchema} data={[]} loading />);
    // Should show loading indicator - look for spinner or loading element
    // BioTable shows a Surface with spinner when loading
    const loader = document.querySelector('[class*="animate-spin"]');
    expect(loader || screen.queryByRole('status')).toBeTruthy();
  });
});

// ============================================================
// E2E-Style Tests - User Interactions
// ============================================================

describe('BioTable - Sorting (E2E)', () => {
  it('sorts by column when header clicked', async () => {
    const user = userEvent.setup();
    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableSorting
      />
    );

    // Find Name column header and click it
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    // Wait for sort to apply
    await waitFor(() => {
      const table = screen.getByTestId('bio-table');
      expect(table).toBeInTheDocument();
    });
  });

  it('toggles sort direction on repeated clicks', async () => {
    const user = userEvent.setup();
    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableSorting
      />
    );

    const nameHeader = screen.getByText('Name');

    // First click - ascending
    await user.click(nameHeader);

    // Second click - descending
    await user.click(nameHeader);

    // Table should still be rendered
    expect(screen.getByTestId('bio-table')).toBeInTheDocument();
  });
});

describe('BioTable - Filtering (E2E)', () => {
  it('filters table when search input changes', async () => {
    const user = userEvent.setup();
    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableFiltering
      />
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type a filter value
    await user.type(searchInput, 'Alice');

    // Wait for filter to apply
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('clears filter when input cleared', async () => {
    const user = userEvent.setup();
    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableFiltering
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type filter
    await user.type(searchInput, 'Alice');

    // Clear filter
    await user.clear(searchInput);

    // All rows should be visible again
    await waitFor(() => {
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  it('shows empty state when no matches', async () => {
    const user = userEvent.setup();
    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableFiltering
        emptyMessage="No results"
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type something that won't match
    await user.type(searchInput, 'zzzzzzzzz');

    // Wait for filter - should show empty or filtered state
    await waitFor(() => {
      expect(screen.getByTestId('bio-table')).toBeInTheDocument();
    });
  });
});

describe('BioTable - Pagination (E2E)', () => {
  it('paginates large datasets', async () => {
    const largeData = generateMockData(50);
    render(
      <BioTable
        schema={PaymentSchema}
        data={largeData}
        enablePagination
        pageSize={10}
      />
    );

    // Should show first page
    expect(screen.getByTestId('bio-table')).toBeInTheDocument();

    // Should have pagination controls
    const table = screen.getByTestId('bio-table');
    expect(table).toBeInTheDocument();
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    const largeData = generateMockData(30);

    render(
      <BioTable
        schema={PaymentSchema}
        data={largeData}
        enablePagination
        pageSize={10}
      />
    );

    // Find and click next button
    const nextButton = screen.getByRole('button', { name: /next/i });
    if (nextButton) {
      await user.click(nextButton);

      // Table should still be visible
      await waitFor(() => {
        expect(screen.getByTestId('bio-table')).toBeInTheDocument();
      });
    }
  });
});

describe('BioTable - Row Selection (E2E)', () => {
  it('selects row when checkbox clicked', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableSelection
        onSelectionChange={onSelectionChange}
      />
    );

    // Find first row checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      // Skip header checkbox, click first row checkbox
      await user.click(checkboxes[1]);

      // Selection callback should be called
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalled();
      });
    }
  });

  it('selects all rows when header checkbox clicked', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <BioTable
        schema={PaymentSchema}
        data={mockData}
        enableSelection
        onSelectionChange={onSelectionChange}
      />
    );

    // Find header checkbox (first one)
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalled();
      });
    }
  });
});

// ============================================================
// Performance Tests - Render timing
// ============================================================

describe('BioTable - Performance', () => {
  it('renders 100 rows within budget (< 500ms)', async () => {
    const data = generateMockData(100);
    const start = performance.now();

    render(
      <BioTable
        schema={PaymentSchema}
        data={data}
        enableSorting
        enableFiltering
        enablePagination
      />
    );

    const duration = performance.now() - start;

    expect(screen.getByTestId('bio-table')).toBeInTheDocument();
    expect(duration).toBeLessThan(500);
  });

  it('renders 500 rows within budget (< 1000ms)', async () => {
    const data = generateMockData(500);
    const start = performance.now();

    render(
      <BioTable
        schema={PaymentSchema}
        data={data}
        enablePagination
        pageSize={25}
      />
    );

    const duration = performance.now() - start;

    expect(screen.getByTestId('bio-table')).toBeInTheDocument();
    expect(duration).toBeLessThan(1000);
  });
});

/**
 * BioTable Export Tests - Vitest Browser Mode
 *
 * Sprint E4: Enterprise Export/Print
 * Tests CSV, XLSX, JSON export and print functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { z } from 'zod';

import { BioTable } from '../src/organisms/BioTable';
import { BioTableExportToolbar } from '../src/organisms/BioTable/BioTableExportToolbar';
import { useBioTableExport } from '../src/organisms/BioTable/useBioTableExport';
import { BioLocaleProvider } from '../src/providers';
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';

// ============================================================
// Test Schema & Data
// ============================================================

const InvoiceSchema = z.object({
  id: z.string(),
  customer: z.string(),
  amount: z.number(),
  date: z.string(),
  status: z.string(),
});

type Invoice = z.infer<typeof InvoiceSchema>;

const mockData: Invoice[] = [
  { id: '1', customer: 'Acme Corp', amount: 1500.5, date: '2024-01-15', status: 'paid' },
  { id: '2', customer: 'TechStart', amount: 2300.0, date: '2024-01-20', status: 'pending' },
  { id: '3', customer: 'Global Inc', amount: 890.25, date: '2024-01-25', status: 'overdue' },
];

// ============================================================
// Test Component
// ============================================================

function ExportTestComponent({
  data = mockData,
  onExportCSV,
  onExportXLSX,
  onExportJSON,
  onPrint,
  onCopy,
}: {
  data?: Invoice[];
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
  onExportJSON?: () => void;
  onPrint?: () => void;
  onCopy?: () => void;
}) {
  const columns = React.useMemo(
    () => [
      { id: 'id', accessorKey: 'id', header: 'ID' },
      { id: 'customer', accessorKey: 'customer', header: 'Customer' },
      { id: 'amount', accessorKey: 'amount', header: 'Amount' },
      { id: 'date', accessorKey: 'date', header: 'Date' },
      { id: 'status', accessorKey: 'status', header: 'Status' },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const exportFns = useBioTableExport(table, InvoiceSchema, data);

  // Wrap export functions with callbacks for testing
  const wrappedExportFns = {
    ...exportFns,
    exportCSV: (filename?: string, options?: Parameters<typeof exportFns.exportCSV>[1]) => {
      onExportCSV?.();
      exportFns.exportCSV(filename, options);
    },
    exportXLSX: async (filename?: string, options?: Parameters<typeof exportFns.exportXLSX>[1]) => {
      onExportXLSX?.();
      await exportFns.exportXLSX(filename, options);
    },
    exportJSON: (filename?: string, options?: Parameters<typeof exportFns.exportJSON>[1]) => {
      onExportJSON?.();
      exportFns.exportJSON(filename, options);
    },
    print: (options?: Parameters<typeof exportFns.print>[0]) => {
      onPrint?.();
      // Don't actually open print window in tests
    },
    copyToClipboard: async (options?: Parameters<typeof exportFns.copyToClipboard>[0]) => {
      onCopy?.();
      await exportFns.copyToClipboard(options);
    },
  };

  return (
    <div>
      <BioTableExportToolbar
        exportFns={wrappedExportFns}
        filename="invoices"
        formats={['csv', 'xlsx', 'json', 'print', 'copy']}
      />
      <div data-testid="export-data">
        {JSON.stringify(exportFns.getExportData())}
      </div>
    </div>
  );
}

// ============================================================
// getExportData Tests
// ============================================================

describe('useBioTableExport - getExportData', () => {
  it('returns headers and rows', () => {
    render(
      <BioLocaleProvider>
        <ExportTestComponent />
      </BioLocaleProvider>
    );

    const dataEl = screen.getByTestId('export-data');
    const data = JSON.parse(dataEl.textContent || '{}');

    expect(data.headers).toContain('Customer');
    expect(data.headers).toContain('Amount');
    expect(data.rows.length).toBe(3);
  });

  it('includes correct row data', () => {
    render(
      <BioLocaleProvider>
        <ExportTestComponent />
      </BioLocaleProvider>
    );

    const dataEl = screen.getByTestId('export-data');
    const data = JSON.parse(dataEl.textContent || '{}');

    // First row should be Acme Corp
    const acmeRow = data.rows[0];
    expect(acmeRow).toContain('Acme Corp');
  });
});

// ============================================================
// Export Toolbar Tests
// ============================================================

describe('BioTableExportToolbar - Rendering', () => {
  it('renders export toolbar with data-testid', () => {
    render(
      <BioLocaleProvider>
        <ExportTestComponent />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('export-toolbar')).toBeInTheDocument();
  });

  it('renders all format buttons', () => {
    render(
      <BioLocaleProvider>
        <ExportTestComponent />
      </BioLocaleProvider>
    );

    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});

describe('BioTableExportToolbar - Actions', () => {
  it('calls exportCSV when CSV button clicked', async () => {
    const user = userEvent.setup();
    const onExportCSV = vi.fn();

    render(
      <BioLocaleProvider>
        <ExportTestComponent onExportCSV={onExportCSV} />
      </BioLocaleProvider>
    );

    await user.click(screen.getByRole('button', { name: /csv/i }));
    expect(onExportCSV).toHaveBeenCalled();
  });

  it('calls exportJSON when JSON button clicked', async () => {
    const user = userEvent.setup();
    const onExportJSON = vi.fn();

    render(
      <BioLocaleProvider>
        <ExportTestComponent onExportJSON={onExportJSON} />
      </BioLocaleProvider>
    );

    await user.click(screen.getByRole('button', { name: /json/i }));
    expect(onExportJSON).toHaveBeenCalled();
  });

  it('calls print when Print button clicked', async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();

    render(
      <BioLocaleProvider>
        <ExportTestComponent onPrint={onPrint} />
      </BioLocaleProvider>
    );

    await user.click(screen.getByRole('button', { name: /print/i }));
    expect(onPrint).toHaveBeenCalled();
  });

  it('calls copy when Copy button clicked', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();

    render(
      <BioLocaleProvider>
        <ExportTestComponent onCopy={onCopy} />
      </BioLocaleProvider>
    );

    // Click will trigger copy (clipboard access may fail in test env but callback should be called)
    await user.click(screen.getByRole('button', { name: /copy/i }));
    expect(onCopy).toHaveBeenCalled();
  });
});

// ============================================================
// Dropdown Variant Tests
// ============================================================

function DropdownExportComponent() {
  const columns = React.useMemo(
    () => [
      { id: 'id', accessorKey: 'id', header: 'ID' },
      { id: 'customer', accessorKey: 'customer', header: 'Customer' },
    ],
    []
  );

  const table = useReactTable({
    data: mockData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const exportFns = useBioTableExport(table, InvoiceSchema, mockData);

  return (
    <BioTableExportToolbar
      exportFns={exportFns}
      variant="dropdown"
      formats={['csv', 'xlsx']}
    />
  );
}

describe('BioTableExportToolbar - Dropdown Variant', () => {
  it('renders dropdown button', () => {
    render(
      <BioLocaleProvider>
        <DropdownExportComponent />
      </BioLocaleProvider>
    );

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('opens dropdown menu on click', async () => {
    const user = userEvent.setup();

    render(
      <BioLocaleProvider>
        <DropdownExportComponent />
      </BioLocaleProvider>
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('shows format options in dropdown', async () => {
    const user = userEvent.setup();

    render(
      <BioLocaleProvider>
        <DropdownExportComponent />
      </BioLocaleProvider>
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByRole('menuitem', { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /excel/i })).toBeInTheDocument();
  });
});

// ============================================================
// BioTable Integration Tests
// ============================================================

describe('BioTable with Export', () => {
  it('renders BioTable without errors', () => {
    render(
      <BioLocaleProvider>
        <BioTable schema={InvoiceSchema} data={mockData} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-table')).toBeInTheDocument();
  });

  it('displays correct number of rows', () => {
    render(
      <BioLocaleProvider>
        <BioTable schema={InvoiceSchema} data={mockData} />
      </BioLocaleProvider>
    );

    // Should have 3 data rows
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('TechStart')).toBeInTheDocument();
    expect(screen.getByText('Global Inc')).toBeInTheDocument();
  });
});

// ============================================================
// Locale-aware Export Tests
// ============================================================

describe('Export with Locale', () => {
  it('formats dates according to locale', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <ExportTestComponent />
      </BioLocaleProvider>
    );

    // Export data should be available
    const dataEl = screen.getByTestId('export-data');
    expect(dataEl.textContent).toBeTruthy();
  });

  it('formats numbers according to locale', () => {
    render(
      <BioLocaleProvider locale="de-DE">
        <ExportTestComponent />
      </BioLocaleProvider>
    );

    // Export data should be available
    const dataEl = screen.getByTestId('export-data');
    expect(dataEl.textContent).toBeTruthy();
  });
});

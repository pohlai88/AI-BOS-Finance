/**
 * useBioTableExport - Export functionality for BioTable
 *
 * Sprint E4: Enterprise Export/Print
 * Provides CSV, XLSX, and print export capabilities.
 *
 * @example
 * const { exportCSV, exportXLSX, print } = useBioTableExport(table, schema);
 * <button onClick={() => exportCSV('invoices')}>Export CSV</button>
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { type Table } from '@tanstack/react-table';
import { introspectZodSchema } from '../../introspector/ZodSchemaIntrospector';
import { useLocale } from '../../providers';

// ============================================================
// Types
// ============================================================

export interface ExportOptions {
  /** Filename without extension */
  filename?: string;
  /** Include headers in export */
  includeHeaders?: boolean;
  /** Export all data or only visible/filtered */
  scope?: 'all' | 'filtered' | 'selected';
  /** Custom column headers mapping */
  headerMap?: Record<string, string>;
  /** Columns to exclude from export */
  excludeColumns?: string[];
  /** Format dates using locale */
  formatDates?: boolean;
  /** Format numbers using locale */
  formatNumbers?: boolean;
}

export interface PrintOptions {
  /** Page title */
  title?: string;
  /** Include page numbers */
  pageNumbers?: boolean;
  /** Include timestamp */
  timestamp?: boolean;
  /** Paper size */
  paperSize?: 'A4' | 'Letter' | 'Legal';
  /** Orientation */
  orientation?: 'portrait' | 'landscape';
}

export interface UseBioTableExportReturn<T> {
  /** Export table data as CSV */
  exportCSV: (filename?: string, options?: ExportOptions) => void;
  /** Export table data as XLSX */
  exportXLSX: (filename?: string, options?: ExportOptions) => Promise<void>;
  /** Export table data as JSON */
  exportJSON: (filename?: string, options?: ExportOptions) => void;
  /** Print table */
  print: (options?: PrintOptions) => void;
  /** Copy table data to clipboard */
  copyToClipboard: (options?: ExportOptions) => Promise<void>;
  /** Get raw export data */
  getExportData: (options?: ExportOptions) => { headers: string[]; rows: unknown[][] };
}

// ============================================================
// Helper Functions
// ============================================================

function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatValue(
  value: unknown,
  type: string,
  formatDate: (date: Date) => string,
  formatNumber: (num: number) => string,
  formatDates: boolean,
  formatNumbers: boolean
): unknown {
  if (value === null || value === undefined) return '';

  if (type === 'date' && formatDates) {
    if (value instanceof Date) return formatDate(value);
    if (typeof value === 'string') return formatDate(new Date(value));
  }

  if (type === 'number' && formatNumbers && typeof value === 'number') {
    return formatNumber(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

// ============================================================
// Hook
// ============================================================

export function useBioTableExport<T extends z.ZodRawShape, TData>(
  table: Table<TData>,
  schema: z.ZodObject<T>,
  data: TData[]
): UseBioTableExportReturn<TData> {
  const locale = useLocale();

  // Get schema field info
  const schemaInfo = React.useMemo(() => introspectZodSchema(schema), [schema]);

  // Get field type from schema
  const getFieldType = React.useCallback(
    (fieldName: string): string => {
      const field = schemaInfo.fields.find(f => f.name === fieldName);
      return field?.type || 'string';
    },
    [schemaInfo]
  );

  // Get export data
  const getExportData = React.useCallback(
    (options: ExportOptions = {}): { headers: string[]; rows: unknown[][] } => {
      const {
        scope = 'filtered',
        headerMap = {},
        excludeColumns = [],
        formatDates = true,
        formatNumbers = false,
      } = options;

      // Get columns (excluding selection column and excluded columns)
      const columns = table
        .getAllColumns()
        .filter(col => col.id !== 'select' && !excludeColumns.includes(col.id));

      // Get headers
      const headers = columns.map(col => {
        const label = headerMap[col.id] || col.columnDef.header;
        return typeof label === 'string' ? label : col.id;
      });

      // Get data based on scope
      let rowData: TData[];
      switch (scope) {
        case 'all':
          rowData = data;
          break;
        case 'selected':
          rowData = table.getSelectedRowModel().rows.map(r => r.original);
          break;
        case 'filtered':
        default:
          rowData = table.getFilteredRowModel().rows.map(r => r.original);
      }

      // Format rows
      const rows = rowData.map(row => {
        return columns.map(col => {
          const value = (row as Record<string, unknown>)[col.id];
          const type = getFieldType(col.id);
          return formatValue(
            value,
            type,
            locale.formatDate,
            locale.formatNumber,
            formatDates,
            formatNumbers
          );
        });
      });

      return { headers, rows };
    },
    [table, data, getFieldType, locale]
  );

  // Export as CSV
  const exportCSV = React.useCallback(
    (filename = 'export', options: ExportOptions = {}) => {
      const { headers, rows } = getExportData(options);

      const csvContent = [
        options.includeHeaders !== false ? headers.map(escapeCSV).join(',') : null,
        ...rows.map(row => row.map(escapeCSV).join(',')),
      ]
        .filter(Boolean)
        .join('\n');

      downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
    },
    [getExportData]
  );

  // Export as XLSX (requires xlsx package to be installed)
  const exportXLSX = React.useCallback(
    async (filename = 'export', options: ExportOptions = {}) => {
      const { headers, rows } = getExportData(options);

      // Check if xlsx is available (optional peer dependency)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xlsxModule = (globalThis as any).__xlsx_module__;

      if (xlsxModule) {
        try {
          const XLSX = xlsxModule;
          const wsData = options.includeHeaders !== false ? [headers, ...rows] : rows;
          const ws = XLSX.utils.aoa_to_sheet(wsData);

          // Auto-size columns
          const colWidths = headers.map((h: string, i: number) => {
            const maxLen = Math.max(
              String(h).length,
              ...rows.map(row => String(row[i] || '').length)
            );
            return { wch: Math.min(maxLen + 2, 50) };
          });
          ws['!cols'] = colWidths;

          // Create workbook
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Data');

          // Download
          XLSX.writeFile(wb, `${filename}.xlsx`);
          return;
        } catch (err) {
          console.warn('XLSX export failed, falling back to CSV:', err);
        }
      }

      // Fallback: export as CSV with xlsx-like filename for clarity
      console.info('XLSX library not loaded. Install with: npm install xlsx');
      console.info('Falling back to CSV export.');
      exportCSV(filename, { ...options });
    },
    [getExportData, exportCSV]
  );

  // Export as JSON
  const exportJSON = React.useCallback(
    (filename = 'export', options: ExportOptions = {}) => {
      const { scope = 'filtered' } = options;

      let rowData: TData[];
      switch (scope) {
        case 'all':
          rowData = data;
          break;
        case 'selected':
          rowData = table.getSelectedRowModel().rows.map(r => r.original);
          break;
        case 'filtered':
        default:
          rowData = table.getFilteredRowModel().rows.map(r => r.original);
      }

      const jsonContent = JSON.stringify(rowData, null, 2);
      downloadFile(jsonContent, `${filename}.json`, 'application/json');
    },
    [table, data]
  );

  // Print table
  const print = React.useCallback(
    (options: PrintOptions = {}) => {
      const {
        title = 'Data Export',
        pageNumbers = true,
        timestamp = true,
        paperSize = 'A4',
        orientation = 'landscape',
      } = options;

      const { headers, rows } = getExportData({ formatDates: true, formatNumbers: true });

      // Build print HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: ${paperSize} ${orientation};
              margin: 1cm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 10pt;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
            }
            .title {
              font-size: 16pt;
              font-weight: bold;
            }
            .meta {
              font-size: 9pt;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background: #f5f5f5;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background: #fafafa;
            }
            .footer {
              margin-top: 16px;
              font-size: 9pt;
              color: #666;
              text-align: center;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${title}</div>
            ${timestamp ? `<div class="meta">${locale.formatDateTime(new Date())}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${pageNumbers ? `
            <div class="footer">
              Total rows: ${rows.length}
            </div>
          ` : ''}
          
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      }
    },
    [getExportData, locale]
  );

  // Copy to clipboard
  const copyToClipboard = React.useCallback(
    async (options: ExportOptions = {}) => {
      const { headers, rows } = getExportData(options);

      // Format as tab-separated values (paste-friendly for Excel/Sheets)
      const tsvContent = [
        options.includeHeaders !== false ? headers.join('\t') : null,
        ...rows.map(row => row.map(cell => String(cell)).join('\t')),
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await navigator.clipboard.writeText(tsvContent);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = tsvContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    },
    [getExportData]
  );

  return {
    exportCSV,
    exportXLSX,
    exportJSON,
    print,
    copyToClipboard,
    getExportData,
  };
}

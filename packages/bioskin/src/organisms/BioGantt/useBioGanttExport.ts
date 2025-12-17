/**
 * useBioGanttExport - Export functionality for BioGantt
 *
 * Sprint E4+: Export/Print 100%
 * Provides CSV, JSON, and print export for Gantt charts.
 *
 * @example
 * const { exportCSV, exportJSON, print } = useBioGanttExport(tasks);
 *
 * <button onClick={() => exportCSV('project-timeline')}>Export CSV</button>
 */

'use client';

import * as React from 'react';
import type { GanttTask } from './BioGantt';
import { useLocale } from '../../providers/BioLocaleProvider';

// ============================================================
// Types
// ============================================================

export interface GanttExportOptions {
  /** Include dependencies in export */
  includeDependencies?: boolean;
  /** Date format (default: ISO) */
  dateFormat?: 'iso' | 'locale';
  /** Include progress percentage */
  includeProgress?: boolean;
}

export interface UseBioGanttExportReturn {
  /** Export tasks as CSV */
  exportCSV: (filename?: string, options?: GanttExportOptions) => void;
  /** Export tasks as JSON */
  exportJSON: (filename?: string) => void;
  /** Print the Gantt chart */
  print: (title?: string) => void;
  /** Copy tasks to clipboard (tab-separated) */
  copyToClipboard: (options?: GanttExportOptions) => Promise<void>;
  /** Get export data */
  getExportData: (options?: GanttExportOptions) => { headers: string[]; rows: string[][] };
}

// ============================================================
// Hook
// ============================================================

export function useBioGanttExport(
  tasks: GanttTask[],
  ganttRef?: React.RefObject<HTMLDivElement | null>
): UseBioGanttExportReturn {
  const locale = useLocale();

  /**
   * Format date based on options
   */
  const formatDate = React.useCallback(
    (date: Date, format: 'iso' | 'locale' = 'iso'): string => {
      if (format === 'locale') {
        return locale.formatDate(date, { dateStyle: 'short' });
      }
      return date.toISOString().split('T')[0];
    },
    [locale]
  );

  /**
   * Get export data (headers + rows)
   */
  const getExportData = React.useCallback(
    (options: GanttExportOptions = {}): { headers: string[]; rows: string[][] } => {
      const {
        includeDependencies = true,
        dateFormat = 'iso',
        includeProgress = true,
      } = options;

      const headers = ['ID', 'Name', 'Start Date', 'End Date'];
      if (includeProgress) headers.push('Progress (%)');
      if (includeDependencies) headers.push('Dependencies');

      const rows = tasks.map((task) => {
        const row = [
          task.id,
          task.name,
          formatDate(new Date(task.start), dateFormat),
          formatDate(new Date(task.end), dateFormat),
        ];

        if (includeProgress) {
          row.push(String(task.progress ?? 0));
        }

        if (includeDependencies) {
          // Dependencies may be in task.data if present
          const deps = (task.data as Record<string, unknown> | undefined)?.dependencies;
          row.push(Array.isArray(deps) ? deps.join(', ') : '');
        }

        return row;
      });

      return { headers, rows };
    },
    [tasks, formatDate]
  );

  /**
   * Export tasks as CSV
   */
  const exportCSV = React.useCallback(
    (filename: string = 'gantt-tasks', options: GanttExportOptions = {}) => {
      const { headers, rows } = getExportData(options);

      // Escape CSV values
      const escapeCSV = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [getExportData]
  );

  /**
   * Export tasks as JSON
   */
  const exportJSON = React.useCallback(
    (filename: string = 'gantt-tasks') => {
      const jsonContent = JSON.stringify(tasks, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [tasks]
  );

  /**
   * Print the Gantt chart
   */
  const print = React.useCallback(
    (title: string = 'Project Timeline') => {
      const { headers, rows } = getExportData({ includeProgress: true, includeDependencies: true });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.warn('[BioGanttExport] Could not open print window');
        return;
      }

      const tableHTML = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                body { font-family: system-ui, sans-serif; margin: 20px; }
                h1 { font-size: 18px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: 600; }
                tr:nth-child(even) { background-color: #fafafa; }
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p>Total Tasks: ${tasks.length}</p>
            ${tableHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    },
    [getExportData, tasks.length]
  );

  /**
   * Copy tasks to clipboard (tab-separated)
   */
  const copyToClipboard = React.useCallback(
    async (options: GanttExportOptions = {}) => {
      const { headers, rows } = getExportData(options);

      const tsvContent = [
        headers.join('\t'),
        ...rows.map((row) => row.join('\t')),
      ].join('\n');

      try {
        await navigator.clipboard.writeText(tsvContent);
      } catch (err) {
        console.warn('[BioGanttExport] Clipboard copy failed:', err);
      }
    },
    [getExportData]
  );

  return {
    exportCSV,
    exportJSON,
    print,
    copyToClipboard,
    getExportData,
  };
}

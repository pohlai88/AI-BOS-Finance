/**
 * useBioTimelineExport - Export timeline data to CSV/PDF
 *
 * Features:
 * - CSV export
 * - PDF export (print-ready)
 * - Filtered export
 * - Custom formatters
 */

'use client';

import * as React from 'react';
import { type TimelineItem } from './BioTimeline';
import { type TimelineFilters } from './BioTimelineFilters';

// ============================================================
// Types
// ============================================================

export interface TimelineExportOptions {
  /** Export format */
  format: 'csv' | 'pdf' | 'json';
  /** Filename (without extension) */
  filename?: string;
  /** Include items matching filters only */
  filters?: TimelineFilters;
  /** Date format for export */
  dateFormat?: string;
  /** Title for PDF export */
  title?: string;
  /** Include metadata */
  includeMetadata?: boolean;
}

export interface UseBioTimelineExportOptions<T> {
  /** Timeline items */
  items: TimelineItem<T>[];
  /** Title for exports */
  title?: string;
}

export interface UseBioTimelineExportReturn {
  /** Export to CSV */
  exportToCSV: (options?: Partial<TimelineExportOptions>) => void;
  /** Export to PDF (opens print dialog) */
  exportToPDF: (options?: Partial<TimelineExportOptions>) => void;
  /** Export to JSON */
  exportToJSON: (options?: Partial<TimelineExportOptions>) => void;
  /** Is export in progress */
  isExporting: boolean;
}

// ============================================================
// Helpers
// ============================================================

function formatDate(date: Date | string, format?: string): string {
  const d = new Date(date);
  return d.toLocaleString();
}

function filterItems<T>(
  items: TimelineItem<T>[],
  filters?: TimelineFilters
): TimelineItem<T>[] {
  if (!filters) return items;

  return items.filter((item) => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !item.title.toLowerCase().includes(search) &&
        !item.description?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // User filter
    if (filters.users?.length && item.user) {
      // Assuming user.name matches one of the filter users
      if (!filters.users.some(u => item.user?.name.includes(u))) {
        return false;
      }
    }

    // Type filter
    if (filters.types?.length && item.type) {
      if (!filters.types.includes(item.type)) {
        return false;
      }
    }

    // Date range filter
    const itemDate = new Date(item.timestamp);
    if (filters.dateFrom && itemDate < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && itemDate > filters.dateTo) {
      return false;
    }

    return true;
  });
}

function itemToRow<T>(item: TimelineItem<T>, dateFormat?: string): Record<string, string> {
  return {
    ID: item.id,
    Title: item.title,
    Description: item.description || '',
    Type: item.type || 'default',
    User: item.user?.name || '',
    Timestamp: formatDate(item.timestamp, dateFormat),
  };
}

function generateCSV(rows: Record<string, string>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
    ),
  ];

  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generatePrintHTML<T>(
  items: TimelineItem<T>[],
  title?: string,
  dateFormat?: string
): string {
  const rows = items.map((item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${formatDate(item.timestamp, dateFormat)}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong>
        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${item.type || 'default'}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${item.user?.name || '-'}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Timeline Export'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        h1 {
          margin-bottom: 20px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 12px 8px;
          background: #f5f5f5;
          border-bottom: 2px solid #ddd;
        }
        .meta {
          color: #666;
          font-size: 12px;
          margin-bottom: 20px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title || 'Activity Timeline'}</h1>
      <p class="meta">
        Generated: ${new Date().toLocaleString()} | 
        Total items: ${items.length}
      </p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Type</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
}

// ============================================================
// Hook
// ============================================================

export function useBioTimelineExport<T = Record<string, unknown>>({
  items,
  title,
}: UseBioTimelineExportOptions<T>): UseBioTimelineExportReturn {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportToCSV = React.useCallback(
    (options?: Partial<TimelineExportOptions>) => {
      setIsExporting(true);
      try {
        const filtered = filterItems(items, options?.filters);
        const rows = filtered.map((item) => itemToRow(item, options?.dateFormat));
        const csv = generateCSV(rows);
        const filename = `${options?.filename || 'timeline-export'}.csv`;
        downloadFile(csv, filename, 'text/csv');
      } finally {
        setIsExporting(false);
      }
    },
    [items]
  );

  const exportToPDF = React.useCallback(
    (options?: Partial<TimelineExportOptions>) => {
      setIsExporting(true);
      try {
        const filtered = filterItems(items, options?.filters);
        const html = generatePrintHTML(filtered, options?.title || title, options?.dateFormat);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      } finally {
        setIsExporting(false);
      }
    },
    [items, title]
  );

  const exportToJSON = React.useCallback(
    (options?: Partial<TimelineExportOptions>) => {
      setIsExporting(true);
      try {
        const filtered = filterItems(items, options?.filters);
        const data = options?.includeMetadata
          ? {
            exportedAt: new Date().toISOString(),
            title: options?.title || title,
            itemCount: filtered.length,
            items: filtered,
          }
          : filtered;
        const json = JSON.stringify(data, null, 2);
        const filename = `${options?.filename || 'timeline-export'}.json`;
        downloadFile(json, filename, 'application/json');
      } finally {
        setIsExporting(false);
      }
    },
    [items, title]
  );

  return {
    exportToCSV,
    exportToPDF,
    exportToJSON,
    isExporting,
  };
}

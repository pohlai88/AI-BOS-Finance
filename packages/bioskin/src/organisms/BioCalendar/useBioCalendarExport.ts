/**
 * useBioCalendarExport - Export functionality for BioCalendar
 *
 * Sprint E4+: Export/Print 100%
 * Provides ICS (iCal), CSV, JSON, and print export for calendar events.
 *
 * @example
 * const { exportICS, exportCSV, print } = useBioCalendarExport(events);
 *
 * <button onClick={() => exportICS('my-calendar')}>Export to Calendar</button>
 */

'use client';

import * as React from 'react';
import type { CalendarEvent } from './BioCalendar';
import { useLocale } from '../../providers/BioLocaleProvider';

// ============================================================
// Types
// ============================================================

export interface CalendarExportOptions {
  /** Date format for CSV (default: ISO) */
  dateFormat?: 'iso' | 'locale';
  /** Include all-day flag */
  includeAllDay?: boolean;
}

export interface UseBioCalendarExportReturn {
  /** Export events as ICS (iCal) file */
  exportICS: (filename?: string, calendarName?: string) => void;
  /** Export events as CSV */
  exportCSV: (filename?: string, options?: CalendarExportOptions) => void;
  /** Export events as JSON */
  exportJSON: (filename?: string) => void;
  /** Print calendar events */
  print: (title?: string) => void;
  /** Copy events to clipboard (tab-separated) */
  copyToClipboard: (options?: CalendarExportOptions) => Promise<void>;
  /** Get export data */
  getExportData: (options?: CalendarExportOptions) => { headers: string[]; rows: string[][] };
}

// ============================================================
// ICS Format Helpers
// ============================================================

/**
 * Format date as ICS date-time (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escape text for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a unique ID for ICS events
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@bioskin`;
}

// ============================================================
// Hook
// ============================================================

export function useBioCalendarExport(events: CalendarEvent[]): UseBioCalendarExportReturn {
  const locale = useLocale();

  /**
   * Format date based on options
   */
  const formatDate = React.useCallback(
    (date: Date, format: 'iso' | 'locale' = 'iso'): string => {
      if (format === 'locale') {
        return locale.formatDate(date, { dateStyle: 'short', timeStyle: 'short' });
      }
      return date.toISOString();
    },
    [locale]
  );

  /**
   * Export events as ICS (iCal) format
   */
  const exportICS = React.useCallback(
    (filename: string = 'calendar', calendarName: string = 'BioSkin Calendar') => {
      const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BioSkin//BioCalendar//EN',
        `X-WR-CALNAME:${escapeICSText(calendarName)}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
      ];

      for (const event of events) {
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${generateUID()}`);
        lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
        lines.push(`DTSTART:${formatICSDate(new Date(event.start))}`);
        lines.push(`DTEND:${formatICSDate(new Date(event.end ?? event.start))}`);
        lines.push(`SUMMARY:${escapeICSText(event.title)}`);

        if (event.type) {
          lines.push(`X-TYPE:${event.type}`);
        }

        lines.push('END:VEVENT');
      }

      lines.push('END:VCALENDAR');

      const icsContent = lines.join('\r\n');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [events]
  );

  /**
   * Get export data (headers + rows)
   */
  const getExportData = React.useCallback(
    (options: CalendarExportOptions = {}): { headers: string[]; rows: string[][] } => {
      const { dateFormat = 'iso', includeAllDay = true } = options;

      const headers = ['ID', 'Title', 'Start', 'End'];
      if (includeAllDay) headers.push('All Day');
      headers.push('Type');

      const rows = events.map((event) => {
        const row = [
          event.id,
          event.title,
          formatDate(new Date(event.start), dateFormat),
          formatDate(new Date(event.end ?? event.start), dateFormat),
        ];

        if (includeAllDay) {
          row.push(event.allDay ? 'Yes' : 'No');
        }

        row.push(event.type ?? '');

        return row;
      });

      return { headers, rows };
    },
    [events, formatDate]
  );

  /**
   * Export events as CSV
   */
  const exportCSV = React.useCallback(
    (filename: string = 'calendar-events', options: CalendarExportOptions = {}) => {
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
   * Export events as JSON
   */
  const exportJSON = React.useCallback(
    (filename: string = 'calendar-events') => {
      const jsonContent = JSON.stringify(events, null, 2);

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
    [events]
  );

  /**
   * Print calendar events
   */
  const print = React.useCallback(
    (title: string = 'Calendar Events') => {
      const { headers, rows } = getExportData({ includeAllDay: true });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.warn('[BioCalendarExport] Could not open print window');
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
            <p>Total Events: ${events.length}</p>
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
    [getExportData, events.length]
  );

  /**
   * Copy events to clipboard (tab-separated)
   */
  const copyToClipboard = React.useCallback(
    async (options: CalendarExportOptions = {}) => {
      const { headers, rows } = getExportData(options);

      const tsvContent = [
        headers.join('\t'),
        ...rows.map((row) => row.join('\t')),
      ].join('\n');

      try {
        await navigator.clipboard.writeText(tsvContent);
      } catch (err) {
        console.warn('[BioCalendarExport] Clipboard copy failed:', err);
      }
    },
    [getExportData]
  );

  return {
    exportICS,
    exportCSV,
    exportJSON,
    print,
    copyToClipboard,
    getExportData,
  };
}

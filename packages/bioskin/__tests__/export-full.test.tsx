/**
 * Full Export Tests - Sprint E4+ (100% Coverage)
 *
 * Tests for Chart, Gantt, Calendar export functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as React from 'react';

import { useBioChartExport } from '../src/organisms/BioChart/useBioChartExport';
import { useBioGanttExport } from '../src/organisms/BioGantt/useBioGanttExport';
import { useBioCalendarExport } from '../src/organisms/BioCalendar/useBioCalendarExport';
import { BioLocaleProvider } from '../src/providers/BioLocaleProvider';
import type { GanttTask } from '../src/organisms/BioGantt';
import type { CalendarEvent } from '../src/organisms/BioCalendar';

// ============================================================
// Test Data
// ============================================================

const mockGanttTasks: GanttTask[] = [
  {
    id: '1',
    name: 'Task 1',
    start: new Date('2024-01-01'),
    end: new Date('2024-01-15'),
    progress: 50,
    dependencies: ['2'],
  },
  {
    id: '2',
    name: 'Task 2',
    start: new Date('2024-01-16'),
    end: new Date('2024-01-31'),
    progress: 25,
  },
];

const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Meeting',
    start: new Date('2024-01-15T10:00:00'),
    end: new Date('2024-01-15T11:00:00'),
    color: '#blue',
  },
  {
    id: '2',
    title: 'Conference',
    start: new Date('2024-01-20T09:00:00'),
    end: new Date('2024-01-20T17:00:00'),
    allDay: true,
  },
];

// ============================================================
// Wrapper for hooks that need locale
// ============================================================

const LocaleWrapper = ({ children }: { children: React.ReactNode }) => (
  <BioLocaleProvider locale="en-US" timezone="UTC">
    {children}
  </BioLocaleProvider>
);

// ============================================================
// useBioChartExport Tests
// ============================================================

describe('useBioChartExport', () => {
  it('provides export functions', () => {
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useBioChartExport(ref));

    expect(result.current.exportPNG).toBeInstanceOf(Function);
    expect(result.current.exportSVG).toBeInstanceOf(Function);
    expect(result.current.print).toBeInstanceOf(Function);
    expect(result.current.copyToClipboard).toBeInstanceOf(Function);
    expect(result.current.getDataURL).toBeInstanceOf(Function);
  });

  it('exportSVG warns when no SVG found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useBioChartExport(ref));

    act(() => {
      result.current.exportSVG('test-chart');
    });

    expect(warnSpy).toHaveBeenCalledWith('[BioChartExport] No chart found to export');
    warnSpy.mockRestore();
  });

  it('print warns when no SVG found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useBioChartExport(ref));

    act(() => {
      result.current.print('Test');
    });

    expect(warnSpy).toHaveBeenCalledWith('[BioChartExport] No chart found to print');
    warnSpy.mockRestore();
  });

  it('handles null ref gracefully', async () => {
    const ref = { current: null };

    const { result } = renderHook(() => useBioChartExport(ref));

    // Should not throw
    await act(async () => {
      result.current.exportSVG('test');
      await result.current.exportPNG('test');
      result.current.print('test');
    });
  });

  it('getDataURL returns empty string when no SVG', async () => {
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useBioChartExport(ref));

    let dataUrl = '';
    await act(async () => {
      dataUrl = await result.current.getDataURL();
    });

    expect(dataUrl).toBe('');
  });
});

// ============================================================
// useBioGanttExport Tests
// ============================================================

describe('useBioGanttExport', () => {
  it('provides export functions', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    expect(result.current.exportCSV).toBeInstanceOf(Function);
    expect(result.current.exportJSON).toBeInstanceOf(Function);
    expect(result.current.print).toBeInstanceOf(Function);
    expect(result.current.copyToClipboard).toBeInstanceOf(Function);
    expect(result.current.getExportData).toBeInstanceOf(Function);
  });

  it('getExportData returns correct headers', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    const { headers } = result.current.getExportData();

    expect(headers).toContain('ID');
    expect(headers).toContain('Name');
    expect(headers).toContain('Start Date');
    expect(headers).toContain('End Date');
    expect(headers).toContain('Progress (%)');
    expect(headers).toContain('Dependencies');
  });

  it('getExportData returns correct row count', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    const { rows } = result.current.getExportData();

    expect(rows).toHaveLength(2);
  });

  it('getExportData includes task data', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    const { rows } = result.current.getExportData();

    expect(rows[0][0]).toBe('1'); // ID
    expect(rows[0][1]).toBe('Task 1'); // Name
    expect(rows[0][4]).toBe('50'); // Progress
    expect(rows[0][5]).toBe('2'); // Dependencies
  });

  it('getExportData respects includeDependencies option', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    const { headers } = result.current.getExportData({ includeDependencies: false });

    expect(headers).not.toContain('Dependencies');
  });

  it('getExportData respects includeProgress option', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    const { headers } = result.current.getExportData({ includeProgress: false });

    expect(headers).not.toContain('Progress (%)');
  });

  it('works with empty tasks', () => {
    const { result } = renderHook(() => useBioGanttExport([]), {
      wrapper: LocaleWrapper,
    });

    const { headers, rows } = result.current.getExportData();

    expect(headers.length).toBeGreaterThan(0);
    expect(rows).toHaveLength(0);
  });
});

// ============================================================
// useBioCalendarExport Tests
// ============================================================

describe('useBioCalendarExport', () => {
  it('provides export functions', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    expect(result.current.exportICS).toBeInstanceOf(Function);
    expect(result.current.exportCSV).toBeInstanceOf(Function);
    expect(result.current.exportJSON).toBeInstanceOf(Function);
    expect(result.current.print).toBeInstanceOf(Function);
    expect(result.current.copyToClipboard).toBeInstanceOf(Function);
    expect(result.current.getExportData).toBeInstanceOf(Function);
  });

  it('getExportData returns correct headers', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    const { headers } = result.current.getExportData();

    expect(headers).toContain('ID');
    expect(headers).toContain('Title');
    expect(headers).toContain('Start');
    expect(headers).toContain('End');
    expect(headers).toContain('All Day');
    expect(headers).toContain('Color');
  });

  it('getExportData returns correct row count', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    const { rows } = result.current.getExportData();

    expect(rows).toHaveLength(2);
  });

  it('getExportData includes event data', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    const { rows } = result.current.getExportData();

    expect(rows[0][1]).toBe('Meeting');
    expect(rows[1][1]).toBe('Conference');
    expect(rows[1][4]).toBe('Yes'); // All day
  });

  it('getExportData respects includeAllDay option', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    const { headers } = result.current.getExportData({ includeAllDay: false });

    expect(headers).not.toContain('All Day');
  });

  it('works with empty events', () => {
    const { result } = renderHook(() => useBioCalendarExport([]), {
      wrapper: LocaleWrapper,
    });

    const { headers, rows } = result.current.getExportData();

    expect(headers.length).toBeGreaterThan(0);
    expect(rows).toHaveLength(0);
  });
});

// ============================================================
// Export Function Execution Tests
// ============================================================

describe('Export Functions Execute Without Error', () => {
  it('Gantt exportCSV executes', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    // Should not throw
    expect(() => {
      act(() => {
        result.current.exportCSV('test');
      });
    }).not.toThrow();
  });

  it('Gantt exportJSON executes', () => {
    const { result } = renderHook(() => useBioGanttExport(mockGanttTasks), {
      wrapper: LocaleWrapper,
    });

    expect(() => {
      act(() => {
        result.current.exportJSON('test');
      });
    }).not.toThrow();
  });

  it('Calendar exportCSV executes', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    expect(() => {
      act(() => {
        result.current.exportCSV('test');
      });
    }).not.toThrow();
  });

  it('Calendar exportJSON executes', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    expect(() => {
      act(() => {
        result.current.exportJSON('test');
      });
    }).not.toThrow();
  });

  it('Calendar exportICS executes', () => {
    const { result } = renderHook(() => useBioCalendarExport(mockCalendarEvents), {
      wrapper: LocaleWrapper,
    });

    expect(() => {
      act(() => {
        result.current.exportICS('test', 'Test Calendar');
      });
    }).not.toThrow();
  });
});

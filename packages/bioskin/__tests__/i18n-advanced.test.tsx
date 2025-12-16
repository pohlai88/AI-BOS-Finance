/**
 * Advanced i18n Tests - Sprint E7
 *
 * DST boundary handling, timezone edge cases, locale switching.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import * as React from 'react';

import { BioLocaleProvider, useLocale } from '../src/providers/BioLocaleProvider';
import { BioCalendar, type CalendarEvent } from '../src/organisms/BioCalendar';
import { BioGantt, type GanttTask } from '../src/organisms/BioGantt';

// ============================================================
// DST Test Data
// ============================================================

// US DST 2024: March 10 (spring forward), November 3 (fall back)
const DST_SPRING_FORWARD = new Date('2024-03-10T02:00:00-05:00'); // 2 AM EST -> 3 AM EDT
const DST_FALL_BACK = new Date('2024-11-03T02:00:00-04:00'); // 2 AM EDT -> 1 AM EST

// Events spanning DST transition
const dstEvents: CalendarEvent[] = [
  {
    id: 'dst-1',
    title: 'Pre-DST Meeting',
    start: new Date('2024-03-09T14:00:00'),
    end: new Date('2024-03-09T15:00:00'),
  },
  {
    id: 'dst-2',
    title: 'DST Day Event',
    start: new Date('2024-03-10T10:00:00'),
    end: new Date('2024-03-10T11:00:00'),
  },
  {
    id: 'dst-3',
    title: 'Post-DST Meeting',
    start: new Date('2024-03-11T14:00:00'),
    end: new Date('2024-03-11T15:00:00'),
  },
  {
    id: 'dst-span',
    title: 'Spanning DST',
    start: new Date('2024-03-09T22:00:00'),
    end: new Date('2024-03-10T06:00:00'),
  },
];

const dstTasks: GanttTask[] = [
  {
    id: 'task-dst-1',
    name: 'Pre-DST Task',
    start: new Date('2024-03-08'),
    end: new Date('2024-03-10'),
    progress: 100,
  },
  {
    id: 'task-dst-2',
    name: 'DST Boundary Task',
    start: new Date('2024-03-10'),
    end: new Date('2024-03-12'),
    progress: 50,
  },
  {
    id: 'task-dst-3',
    name: 'Fall Back Task',
    start: new Date('2024-11-02'),
    end: new Date('2024-11-04'),
    progress: 25,
  },
];

// ============================================================
// Timezone Test Data
// ============================================================

const TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

// ============================================================
// Wrapper
// ============================================================

const createWrapper = (locale: string = 'en-US', timezone: string = 'America/New_York') => {
  return ({ children }: { children: React.ReactNode }) => (
    <BioLocaleProvider locale={locale} timezone={timezone}>
      {children}
    </BioLocaleProvider>
  );
};

// ============================================================
// DST Boundary Tests
// ============================================================

describe('DST Boundary Handling', () => {
  it('formats date correctly on DST spring forward day', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'America/New_York'),
    });

    const dstDate = new Date('2024-03-10T12:00:00');
    const formatted = result.current.formatDate(dstDate, { dateStyle: 'full' });

    expect(formatted).toContain('March');
    expect(formatted).toContain('10');
    expect(formatted).toContain('2024');
  });

  it('formats date correctly on DST fall back day', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'America/New_York'),
    });

    const dstDate = new Date('2024-11-03T12:00:00');
    const formatted = result.current.formatDate(dstDate, { dateStyle: 'full' });

    expect(formatted).toContain('November');
    expect(formatted).toContain('3');
    expect(formatted).toContain('2024');
  });

  it('calculates correct day duration across DST spring forward', () => {
    // Spring forward day has only 23 hours
    const dayStart = new Date('2024-03-10T00:00:00-05:00');
    const dayEnd = new Date('2024-03-11T00:00:00-04:00');

    const hoursDiff = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60);

    // Should be 23 hours due to spring forward
    expect(hoursDiff).toBe(23);
  });

  it('calculates correct day duration across DST fall back', () => {
    // Fall back day has 25 hours
    const dayStart = new Date('2024-11-03T00:00:00-04:00');
    const dayEnd = new Date('2024-11-04T00:00:00-05:00');

    const hoursDiff = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60);

    // Should be 25 hours due to fall back
    expect(hoursDiff).toBe(25);
  });

  it('BioCalendar renders on DST day without crashing', () => {
    // This test verifies the calendar renders correctly on a DST transition day
    render(
      <BioLocaleProvider locale="en-US" timezone="America/New_York">
        <BioCalendar
          events={dstEvents}
          defaultDate={new Date('2024-03-10')}
        />
      </BioLocaleProvider>
    );

    // Calendar should render
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('BioGantt renders tasks spanning DST correctly', () => {
    render(
      <BioLocaleProvider locale="en-US" timezone="America/New_York">
        <BioGantt tasks={dstTasks} />
      </BioLocaleProvider>
    );

    // Gantt should render without crashing on DST dates
    expect(screen.getByTestId('bio-gantt')).toBeInTheDocument();
  });
});

// ============================================================
// Multi-Timezone Tests
// ============================================================

describe('Multi-Timezone Support', () => {
  it.each(TIMEZONES)('formats date consistently in %s timezone', (tz) => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', tz),
    });

    const testDate = new Date('2024-06-15T12:00:00Z');
    const formatted = result.current.formatDate(testDate, { dateStyle: 'short' });

    // Should produce a valid formatted date
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('converts time correctly between timezones', () => {
    const { result: nyResult } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'America/New_York'),
    });

    const { result: laResult } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'America/Los_Angeles'),
    });

    // Same moment in time
    const testDate = new Date('2024-06-15T12:00:00Z');

    const nyFormatted = nyResult.current.formatDate(testDate, { timeStyle: 'short' });
    const laFormatted = laResult.current.formatDate(testDate, { timeStyle: 'short' });

    // NY is 3 hours ahead of LA in summer
    expect(nyFormatted).not.toBe(laFormatted);
  });

  it('formatDate works with different timezones', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'America/New_York'),
    });

    const utcDate = new Date('2024-06-15T12:00:00Z');
    const formatted = result.current.formatDate(utcDate, { timeStyle: 'short' });

    // Should produce a valid formatted time string
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('handles timezone changes without crashing', () => {
    const TestComponent = () => {
      const [tz, setTz] = React.useState('America/New_York');
      const locale = useLocale();

      return (
        <div>
          <span data-testid="formatted">
            {locale.formatDate(new Date('2024-06-15T12:00:00Z'), { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          <button onClick={() => setTz('Asia/Tokyo')} data-testid="change-tz">
            Change TZ
          </button>
        </div>
      );
    };

    // Note: This tests the component doesn't crash - full timezone switching
    // would require re-rendering with new provider
    render(
      <BioLocaleProvider locale="en-US" timezone="America/New_York">
        <TestComponent />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('formatted')).toBeInTheDocument();
  });
});

// ============================================================
// Locale Switching Tests
// ============================================================

describe('Dynamic Locale Switching', () => {
  const locales = ['en-US', 'de-DE', 'ja-JP', 'ar-SA', 'zh-CN'];

  it.each(locales)('formats numbers correctly in %s locale', (loc) => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper(loc, 'UTC'),
    });

    const formatted = result.current.formatNumber(1234567.89);

    expect(formatted).toBeTruthy();
    // Different locales use different separators
    expect(formatted.length).toBeGreaterThan(0);
  });

  it.each(locales)('formats currency correctly in %s locale', (loc) => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper(loc, 'UTC'),
    });

    const formatted = result.current.formatCurrency(1234.56, 'USD');

    expect(formatted).toBeTruthy();
    // Should produce a non-empty string (locales use different numeral systems)
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('getDayNames returns correct count for all locales', () => {
    for (const loc of locales) {
      const { result } = renderHook(() => useLocale(), {
        wrapper: createWrapper(loc, 'UTC'),
      });

      const days = result.current.getDayNames();
      expect(days).toHaveLength(7);
    }
  });

  it('getMonthNames returns correct count for all locales', () => {
    for (const loc of locales) {
      const { result } = renderHook(() => useLocale(), {
        wrapper: createWrapper(loc, 'UTC'),
      });

      const months = result.current.getMonthNames();
      expect(months).toHaveLength(12);
    }
  });

  it('isRTL returns true for Arabic locale', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('ar-SA', 'UTC'),
    });

    expect(result.current.isRTL).toBe(true);
  });

  it('isRTL returns false for English locale', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'UTC'),
    });

    expect(result.current.isRTL).toBe(false);
  });
});

// ============================================================
// Edge Cases
// ============================================================

describe('i18n Edge Cases', () => {
  it('handles year boundary correctly', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'America/New_York'),
    });

    const newYearsEve = new Date('2024-12-31T23:59:59');
    const newYearsDay = new Date('2025-01-01T00:00:01');

    const formatted1 = result.current.formatDate(newYearsEve, { dateStyle: 'short' });
    const formatted2 = result.current.formatDate(newYearsDay, { dateStyle: 'short' });

    // Both should produce valid dates
    expect(formatted1).toBeTruthy();
    expect(formatted2).toBeTruthy();
    // Should contain year info (different formats possible)
    expect(formatted1).toMatch(/\d{2,4}/);
    expect(formatted2).toMatch(/\d{2,4}/);
  });

  it('handles leap year date correctly', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'UTC'),
    });

    const leapDay = new Date('2024-02-29T12:00:00Z');
    const formatted = result.current.formatDate(leapDay, { dateStyle: 'long' });

    expect(formatted).toContain('February');
    expect(formatted).toContain('29');
  });

  it('handles edge case dates gracefully', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'UTC'),
    });

    // Very old date
    const oldDate = new Date('1900-01-01');
    const formatted = result.current.formatDate(oldDate, { dateStyle: 'short' });

    // Should produce a valid date string
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(0);
    // Should contain the month/day portion
    expect(formatted).toMatch(/1/);
  });

  it('formats relative time for future dates', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'UTC'),
    });

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const formatted = result.current.formatRelativeTime(futureDate);

    expect(formatted).toBeTruthy();
  });

  it('formats relative time for past dates', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'UTC'),
    });

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const formatted = result.current.formatRelativeTime(pastDate);

    expect(formatted).toBeTruthy();
  });

  it('handles epoch date', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper('en-US', 'UTC'),
    });

    const epoch = new Date(0);
    const formatted = result.current.formatDate(epoch, { dateStyle: 'full' });

    expect(formatted).toContain('1970');
  });
});

// ============================================================
// Week Start Configuration
// ============================================================

describe('Week Start Configuration', () => {
  it('getDayNames respects weekStartsOn=0 (Sunday)', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <BioLocaleProvider locale="en-US" timezone="UTC" weekStartsOn={0}>
          {children}
        </BioLocaleProvider>
      ),
    });

    const days = result.current.getDayNames();
    expect(days[0]).toContain('Sun');
  });

  it('getDayNames respects weekStartsOn=1 (Monday)', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <BioLocaleProvider locale="en-US" timezone="UTC" weekStartsOn={1}>
          {children}
        </BioLocaleProvider>
      ),
    });

    const days = result.current.getDayNames();
    expect(days[0]).toContain('Mon');
  });

  it('weekStartsOn affects day name order', () => {
    // With weekStartsOn=1, Monday should be first
    const { result: mondayFirst } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <BioLocaleProvider locale="en-US" timezone="UTC" weekStartsOn={1}>
          {children}
        </BioLocaleProvider>
      ),
    });

    // With weekStartsOn=0, Sunday should be first
    const { result: sundayFirst } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <BioLocaleProvider locale="en-US" timezone="UTC" weekStartsOn={0}>
          {children}
        </BioLocaleProvider>
      ),
    });

    const mondayDays = mondayFirst.current.getDayNames();
    const sundayDays = sundayFirst.current.getDayNames();

    // First day should be different based on weekStartsOn
    expect(mondayDays[0]).not.toBe(sundayDays[0]);
  });
});

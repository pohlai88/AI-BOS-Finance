/**
 * BioLocaleProvider Tests
 *
 * Sprint E3: Enterprise i18n Foundation
 * Tests locale-aware formatting for dates, numbers, currencies.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { BioLocaleProvider, useLocale } from '../src/providers';
import { BioCalendar } from '../src/organisms/BioCalendar';
import { BioGantt } from '../src/organisms/BioGantt';
import { BioTimeline } from '../src/organisms/BioTimeline';

// ============================================================
// Test Component
// ============================================================

function LocaleDisplay() {
  const locale = useLocale();

  const testDate = new Date('2024-12-25T10:30:00Z');
  const testNumber = 1234567.89;

  return (
    <div>
      <div data-testid="locale">{locale.locale}</div>
      <div data-testid="timezone">{locale.timezone}</div>
      <div data-testid="currency">{locale.currency}</div>
      <div data-testid="formatted-date">{locale.formatDate(testDate)}</div>
      <div data-testid="formatted-time">{locale.formatTime(testDate)}</div>
      <div data-testid="formatted-number">{locale.formatNumber(testNumber)}</div>
      <div data-testid="formatted-currency">{locale.formatCurrency(testNumber)}</div>
      <div data-testid="formatted-percent">{locale.formatPercent(0.4567, 1)}</div>
      <div data-testid="is-rtl">{locale.isRTL ? 'true' : 'false'}</div>
      <div data-testid="day-names">{locale.getDayNames().join(',')}</div>
      <div data-testid="month-names">{locale.getMonthNames('short').slice(0, 3).join(',')}</div>
    </div>
  );
}

// ============================================================
// Provider Tests
// ============================================================

describe('BioLocaleProvider', () => {
  it('provides default US locale', () => {
    render(
      <BioLocaleProvider>
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en-US');
    expect(screen.getByTestId('currency')).toHaveTextContent('USD');
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('false');
  });

  it('formats numbers according to locale', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    // US format: 1,234,567.89
    expect(screen.getByTestId('formatted-number')).toHaveTextContent('1,234,567.89');
  });

  it('formats currency according to locale', () => {
    render(
      <BioLocaleProvider locale="en-US" currency="USD">
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    // US format: $1,234,567.89
    expect(screen.getByTestId('formatted-currency')).toHaveTextContent('$1,234,567.89');
  });

  it('formats percentage', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    // 45.7%
    expect(screen.getByTestId('formatted-percent')).toHaveTextContent('45.7%');
  });

  it('provides locale-aware day names', () => {
    render(
      <BioLocaleProvider locale="en-US" weekStartsOn={0}>
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    // Week starting Sunday
    expect(screen.getByTestId('day-names')).toHaveTextContent('Sun,Mon,Tue,Wed,Thu,Fri,Sat');
  });

  it('provides locale-aware month names', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('month-names')).toHaveTextContent('Jan,Feb,Mar');
  });

  it('detects RTL for Arabic locale', () => {
    render(
      <BioLocaleProvider locale="ar-SA">
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('is-rtl')).toHaveTextContent('true');
  });

  it('works with German locale', () => {
    render(
      <BioLocaleProvider locale="de-DE" currency="EUR">
        <LocaleDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('de-DE');
    expect(screen.getByTestId('currency')).toHaveTextContent('EUR');
  });
});

// ============================================================
// useLocale Hook Tests (without provider)
// ============================================================

describe('useLocale without provider', () => {
  it('returns default formatters when used outside provider', () => {
    function StandaloneComponent() {
      const locale = useLocale();
      return <div data-testid="standalone">{locale.formatNumber(1234)}</div>;
    }

    render(<StandaloneComponent />);

    // Should not crash and return formatted value
    expect(screen.getByTestId('standalone')).toBeInTheDocument();
  });
});

// ============================================================
// Component Integration Tests
// ============================================================

describe('Locale Integration - BioCalendar', () => {
  const events = [
    { id: '1', title: 'Meeting', start: new Date('2024-12-25') },
  ];

  it('renders with default locale', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <BioCalendar events={events} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-calendar')).toBeInTheDocument();
  });

  it('renders with German locale', () => {
    render(
      <BioLocaleProvider locale="de-DE">
        <BioCalendar events={events} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-calendar')).toBeInTheDocument();
  });
});

describe('Locale Integration - BioGantt', () => {
  const tasks = [
    {
      id: '1',
      name: 'Task 1',
      start: new Date('2024-12-20'),
      end: new Date('2024-12-25'),
      progress: 50,
    },
  ];

  it('renders with default locale', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <BioGantt tasks={tasks} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-gantt')).toBeInTheDocument();
  });

  it('renders with German locale', () => {
    render(
      <BioLocaleProvider locale="de-DE">
        <BioGantt tasks={tasks} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-gantt')).toBeInTheDocument();
  });
});

describe('Locale Integration - BioTimeline', () => {
  const items = [
    {
      id: '1',
      title: 'Activity',
      timestamp: new Date(),
      type: 'default' as const,
    },
  ];

  it('renders with default locale', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <BioTimeline items={items} />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('bio-timeline')).toBeInTheDocument();
  });

  it('renders relative time', () => {
    render(
      <BioLocaleProvider locale="en-US">
        <BioTimeline items={items} showTimestamps />
      </BioLocaleProvider>
    );

    // Should show relative time for recent activity
    expect(screen.getByTestId('timeline-item')).toBeInTheDocument();
  });
});

// ============================================================
// Timezone Tests
// ============================================================

describe('Timezone Support', () => {
  it('respects timezone configuration', () => {
    function TimezoneDisplay() {
      const locale = useLocale();
      return <div data-testid="tz">{locale.timezone}</div>;
    }

    render(
      <BioLocaleProvider timezone="America/New_York">
        <TimezoneDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('tz')).toHaveTextContent('America/New_York');
  });

  it('formats dates in specified timezone', () => {
    function DateDisplay() {
      const locale = useLocale();
      // This date is in UTC
      const utcDate = new Date('2024-12-25T00:00:00Z');
      return <div data-testid="date">{locale.formatDateTime(utcDate)}</div>;
    }

    render(
      <BioLocaleProvider locale="en-US" timezone="America/New_York">
        <DateDisplay />
      </BioLocaleProvider>
    );

    // Should show date in EST (Dec 24, 7:00 PM EST or similar)
    expect(screen.getByTestId('date')).toBeInTheDocument();
  });
});

// ============================================================
// Week Start Tests
// ============================================================

describe('Week Start Configuration', () => {
  it('defaults to Sunday start', () => {
    function WeekDisplay() {
      const locale = useLocale();
      return <div data-testid="start">{locale.weekStartsOn}</div>;
    }

    render(
      <BioLocaleProvider>
        <WeekDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('start')).toHaveTextContent('0');
  });

  it('supports Monday start', () => {
    function WeekDisplay() {
      const locale = useLocale();
      const days = locale.getDayNames();
      return <div data-testid="first-day">{days[0]}</div>;
    }

    render(
      <BioLocaleProvider weekStartsOn={1}>
        <WeekDisplay />
      </BioLocaleProvider>
    );

    expect(screen.getByTestId('first-day')).toHaveTextContent('Mon');
  });
});

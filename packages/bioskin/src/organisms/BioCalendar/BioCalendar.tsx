/**
 * BioCalendar - Event calendar component
 *
 * Sprint 5 per BIOSKIN 2.1 PRD - ERPNext Expansion
 * Production-grade calendar for scheduling, leave management.
 *
 * @example
 * // Basic usage
 * <BioCalendar events={events} />
 *
 * @example
 * // Full featured
 * <BioCalendar
 *   events={events}
 *   onDateSelect={handleSelect}
 *   onEventClick={handleEventClick}
 *   view="month"
 * />
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';
import { useLocale } from '../../providers';

// ============================================================
// Types
// ============================================================

export type CalendarView = 'month' | 'week' | 'day';

export type CalendarEventType =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface CalendarEvent<T = Record<string, unknown>> {
  /** Unique identifier */
  id: string;
  /** Event title */
  title: string;
  /** Start date/time */
  start: Date | string;
  /** End date/time (optional for all-day) */
  end?: Date | string;
  /** Is all-day event */
  allDay?: boolean;
  /** Event type/color */
  type?: CalendarEventType;
  /** Custom data */
  data?: T;
}

export interface BioCalendarProps<T = Record<string, unknown>> {
  /** Calendar events */
  events: CalendarEvent<T>[];
  /** Current view */
  view?: CalendarView;
  /** Initial date to display */
  initialDate?: Date;
  /** Called when date is selected */
  onDateSelect?: (date: Date) => void;
  /** Called when event is clicked */
  onEventClick?: (event: CalendarEvent<T>) => void;
  /** Called when add button is clicked */
  onAddEvent?: (date: Date) => void;
  /** Called when view changes */
  onViewChange?: (view: CalendarView) => void;
  /** Show view switcher */
  showViewSwitcher?: boolean;
  /** Show add button */
  showAddButton?: boolean;
  /** Week starts on (0 = Sunday, 1 = Monday) */
  weekStartsOn?: 0 | 1;
  /** Additional className */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'CAL01',
  version: '1.0.0',
  name: 'BioCalendar',
  family: 'CALENDAR',
  purpose: 'SCHEDULE',
  poweredBy: 'native',
  status: 'active',
} as const;

// ============================================================
// Helper Functions
// ============================================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getEventsForDate<T>(events: CalendarEvent<T>[], date: Date): CalendarEvent<T>[] {
  return events.filter(event => {
    const eventDate = new Date(event.start);
    return isSameDay(eventDate, date);
  });
}

// ============================================================
// Event Colors
// ============================================================

const eventColors: Record<CalendarEventType, string> = {
  default: 'bg-surface-subtle text-text-primary',
  primary: 'bg-accent-primary/20 text-accent-primary',
  success: 'bg-status-success/20 text-status-success',
  warning: 'bg-status-warning/20 text-status-warning',
  danger: 'bg-status-danger/20 text-status-danger',
  info: 'bg-status-info/20 text-status-info',
};

// ============================================================
// CalendarDay Component (Memoized)
// ============================================================

interface CalendarDayProps<T> {
  date: Date;
  events: CalendarEvent<T>[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onSelect: (date: Date) => void;
  onEventClick?: (event: CalendarEvent<T>) => void;
}

/**
 * CalendarDay - Single day cell in the calendar grid
 * Wrapped in React.memo since 42 instances render per month view
 */
const CalendarDay = React.memo(function CalendarDay<T>({
  date,
  events,
  isCurrentMonth,
  isSelected,
  onSelect,
  onEventClick,
}: CalendarDayProps<T>) {
  const dayEvents = getEventsForDate(events, date);
  const isCurrentDay = isToday(date);

  // Memoized click handler
  const handleSelect = React.useCallback(() => {
    onSelect(date);
  }, [date, onSelect]);

  // Memoized keydown handler
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSelect(date);
    }
  }, [date, onSelect]);

  // Memoized event click handler factory
  const handleEventClick = React.useCallback((event: CalendarEvent<T>) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  }, [onEventClick]);

  return (
    <div
      role="gridcell"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'min-h-[80px] p-1 border-b border-r border-default cursor-pointer',
        'transition-colors hover:bg-surface-hover',
        !isCurrentMonth && 'bg-surface-subtle/50',
        isSelected && 'bg-accent-primary/5 ring-1 ring-accent-primary ring-inset'
      )}
      data-testid="calendar-day"
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-full text-small',
            isCurrentDay && 'bg-accent-primary text-white font-medium',
            !isCurrentDay && !isCurrentMonth && 'text-text-muted',
            !isCurrentDay && isCurrentMonth && 'text-text-primary'
          )}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {dayEvents.slice(0, 3).map(event => (
          <div
            key={event.id}
            onClick={handleEventClick(event)}
            className={cn(
              'px-1 py-0.5 rounded text-micro truncate cursor-pointer',
              'hover:opacity-80 transition-opacity',
              eventColors[event.type || 'default']
            )}
            title={event.title}
          >
            {event.title}
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="text-micro text-text-muted px-1">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}) as <T>(props: CalendarDayProps<T>) => React.ReactElement;

// ============================================================
// Component
// ============================================================

export function BioCalendar<T = Record<string, unknown>>({
  events,
  view = 'month',
  initialDate,
  onDateSelect,
  onEventClick,
  onAddEvent,
  onViewChange,
  showViewSwitcher = true,
  showAddButton = true,
  weekStartsOn: weekStartsOnProp,
  className,
  loading = false,
}: BioCalendarProps<T>) {
  // i18n support
  const locale = useLocale();
  const weekStartsOn = weekStartsOnProp ?? locale.weekStartsOn;

  const [currentDate, setCurrentDate] = React.useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [currentView, setCurrentView] = React.useState<CalendarView>(view);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Locale-aware names
  const MONTHS = locale.getMonthNames('long');
  const DAYS = locale.getDayNames('short');

  // Navigate - memoized for stable references
  const goToPrevMonth = React.useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = React.useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = React.useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Handle date select - memoized
  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  }, [onDateSelect]);

  // Handle view change - memoized
  const handleViewChange = React.useCallback((newView: CalendarView) => {
    setCurrentView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Calculate grid days
  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month days
  const startOffset = weekStartsOn === 1 ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
  for (let i = startOffset - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  // Day headers (DAYS already respects weekStartsOn from locale)
  const dayHeaders = DAYS;

  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-surface-subtle rounded animate-pulse" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface-subtle rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-calendar">
      {/* Header */}
      <div className="px-4 py-3 border-b border-default flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={goToPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Btn>
          <Txt variant="label" weight="semibold" className="min-w-[150px] text-center" aria-live="polite">
            {MONTHS[month]} {year}
          </Txt>
          <Btn variant="ghost" size="sm" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Btn>
          <Btn variant="ghost" size="sm" onClick={goToToday} aria-label="Go to today">
            Today
          </Btn>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          {showViewSwitcher && (
            <div className="flex rounded-md border border-default overflow-hidden" role="group" aria-label="Calendar view">
              {(['month', 'week', 'day'] as CalendarView[]).map(v => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={cn(
                    'px-3 py-1 text-small capitalize transition-colors',
                    currentView === v
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-card text-text-secondary hover:bg-surface-hover'
                  )}
                  aria-pressed={currentView === v}
                  aria-label={`${v} view`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Add button */}
          {showAddButton && selectedDate && (
            <Btn
              variant="primary"
              size="sm"
              onClick={() => onAddEvent?.(selectedDate)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Btn>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1" role="row" aria-label="Days of week">
          {dayHeaders.map(day => (
            <div
              key={day}
              role="columnheader"
              className="py-2 text-center text-caption font-medium text-text-secondary"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid - using table-like structure for proper a11y */}
        <div
          role="grid"
          aria-label={`${MONTHS[month]} ${year} calendar`}
          className="border-l border-t border-default"
        >
          {/* Render rows of 7 days */}
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} role="row" className="grid grid-cols-7">
              {calendarDays.slice(rowIdx * 7, (rowIdx + 1) * 7).map(({ date, isCurrentMonth }, idx) => (
                <CalendarDay
                  key={`${date.toISOString()}-${rowIdx * 7 + idx}`}
                  date={date}
                  events={events}
                  isCurrentMonth={isCurrentMonth}
                  isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
                  onSelect={handleDateSelect}
                  onEventClick={onEventClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Surface>
  );
}

BioCalendar.displayName = 'BioCalendar';

'use client';

/**
 * @aibos/bioskin/calendar - Granular entry point for BioCalendar
 *
 * Use this for better tree-shaking when you only need calendar components.
 * Bundle size: ~10KB
 *
 * @example
 * import { BioCalendar } from '@aibos/bioskin/calendar';
 *
 * // Or with Next.js dynamic import:
 * const LazyCalendar = dynamic(() => import('@aibos/bioskin/calendar').then(m => m.BioCalendar), {
 *   loading: () => <LoadingState />
 * });
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { BioCalendar, type BioCalendarProps, type CalendarEvent, type CalendarView } from './organisms/BioCalendar';
export { useBioCalendarExport } from './organisms/BioCalendar/useBioCalendarExport';

'use client';

/**
 * @aibos/bioskin/gantt - Granular entry point for BioGantt
 *
 * Use this for better tree-shaking when you only need gantt components.
 * Bundle size: ~12KB
 *
 * @example
 * import { BioGantt } from '@aibos/bioskin/gantt';
 *
 * // Or with Next.js dynamic import:
 * const LazyGantt = dynamic(() => import('@aibos/bioskin/gantt').then(m => m.BioGantt), {
 *   ssr: false,
 *   loading: () => <LoadingState />
 * });
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { BioGantt, type BioGanttProps, type GanttTask, type GanttTaskStatus } from './organisms/BioGantt';
export { useBioGanttExport } from './organisms/BioGantt/useBioGanttExport';

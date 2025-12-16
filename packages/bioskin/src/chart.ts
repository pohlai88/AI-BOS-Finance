'use client';

/**
 * @aibos/bioskin/chart - Granular entry point for BioChart
 *
 * Use this for better tree-shaking when you only need chart components.
 * Bundle size: ~15KB
 *
 * @example
 * import { BioChart } from '@aibos/bioskin/chart';
 *
 * // Or with Next.js dynamic import:
 * const LazyChart = dynamic(() => import('@aibos/bioskin/chart').then(m => m.BioChart), {
 *   ssr: false,
 *   loading: () => <LoadingState />
 * });
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { BioChart, type BioChartProps, type ChartDataPoint, type ChartType } from './organisms/BioChart';
export { useBioChartExport } from './organisms/BioChart/useBioChartExport';

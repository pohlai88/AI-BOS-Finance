'use client';

/**
 * @aibos/bioskin/kanban - Granular entry point for BioKanban
 *
 * Use this for better tree-shaking when you only need kanban components.
 * Bundle size: ~20KB (@dnd-kit included)
 *
 * @example
 * import { BioKanban } from '@aibos/bioskin/kanban';
 *
 * // Or with Next.js dynamic import:
 * const LazyKanban = dynamic(() => import('@aibos/bioskin/kanban').then(m => m.BioKanban), {
 *   loading: () => <LoadingState />
 * });
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { BioKanban, type BioKanbanProps, type KanbanCard, type KanbanColumn } from './organisms/BioKanban';
export { useBioKanban, type UseBioKanbanOptions } from './organisms/BioKanban/useBioKanban';

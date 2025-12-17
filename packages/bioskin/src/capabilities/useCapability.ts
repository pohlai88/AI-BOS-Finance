'use client';

/**
 * @fileoverview React Hooks for BioCapabilities
 *
 * Provides React hooks for checking capabilities in components.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 */

import { useMemo, useSyncExternalStore, useCallback } from 'react';
import { BioRegistry } from '../registry/BioRegistry';
import { BioCapabilities } from './BioCapabilities';
import type {
  CapabilityPath,
  CapabilityContext,
  CapabilityResult,
  CapabilityTree,
  CapabilityCategory,
} from './types';

// ============================================================
// STABLE CONTEXT KEY HELPER
// ============================================================

/**
 * Create a stable string key from context object
 */
function getContextKey(context?: CapabilityContext): string {
  if (!context) return '';
  return `${context.userId ?? ''}:${context.userRole ?? ''}:${context.entityState ?? ''}:${context.periodStatus ?? ''}:${context.entityType ?? ''}:${context.moduleCode ?? ''}`;
}

// ============================================================
// USE CAPABILITY HOOK
// ============================================================

/**
 * Hook to check a single capability
 *
 * Uses useSyncExternalStore to react to registry and capability changes.
 *
 * @param path - The capability path (e.g., 'table.inlineEdit')
 * @param context - Optional context for evaluation
 * @returns Capability result with enabled status, reason, and source
 *
 * @example
 * ```tsx
 * function InlineEditButton() {
 *   const { enabled, reason } = useCapability('table.inlineEdit');
 *
 *   if (!enabled) {
 *     return <span title={reason}>Edit disabled</span>;
 *   }
 *
 *   return <button>Edit</button>;
 * }
 * ```
 */
export function useCapability(
  path: CapabilityPath,
  context?: CapabilityContext
): CapabilityResult {
  const contextKey = getContextKey(context);

  // Simple memoization - recompute only when path or context changes
  return useMemo(() => BioCapabilities.check(path, context), [path, contextKey]);
}

// ============================================================
// USE CAPABILITIES HOOK
// ============================================================

/**
 * Hook to check multiple capabilities at once
 *
 * Uses useSyncExternalStore to react to registry and capability changes.
 *
 * @param paths - Array of capability paths
 * @param context - Optional context for evaluation
 * @returns Record of capabilities and their results
 *
 * @example
 * ```tsx
 * function TableToolbar() {
 *   const capabilities = useCapabilities([
 *     'table.inlineEdit',
 *     'table.bulkEdit',
 *     'table.csvExport',
 *   ]);
 *
 *   return (
 *     <div>
 *       {capabilities['table.inlineEdit'].enabled && <EditButton />}
 *       {capabilities['table.bulkEdit'].enabled && <BulkEditButton />}
 *       {capabilities['table.csvExport'].enabled && <ExportButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCapabilities(
  paths: CapabilityPath[],
  context?: CapabilityContext
): Record<CapabilityPath, CapabilityResult> {
  const pathsKey = useMemo(() => paths.join(','), [paths]);
  const contextKey = getContextKey(context);

  // Simple memoization - recompute only when paths or context changes
  return useMemo(() => {
    const results: Record<string, CapabilityResult> = {};
    for (const path of paths) {
      results[path] = BioCapabilities.check(path, context);
    }
    return results as Record<CapabilityPath, CapabilityResult>;
  }, [pathsKey, contextKey]);
}

// ============================================================
// USE CATEGORY CAPABILITIES HOOK
// ============================================================

/**
 * Hook to check all capabilities in a category
 *
 * Uses useSyncExternalStore to react to registry and capability changes.
 *
 * @param category - The capability category
 * @param context - Optional context for evaluation
 * @returns Record of all capabilities in the category
 *
 * @example
 * ```tsx
 * function TableComponent() {
 *   const tableCapabilities = useCategoryCapabilities('table');
 *
 *   return (
 *     <Table
 *       enableInlineEdit={tableCapabilities.inlineEdit.enabled}
 *       enableBulkEdit={tableCapabilities.bulkEdit.enabled}
 *       enableRowSelection={tableCapabilities.rowSelection.enabled}
 *     />
 *   );
 * }
 * ```
 */
export function useCategoryCapabilities<K extends CapabilityCategory>(
  category: K,
  context?: CapabilityContext
): Record<keyof CapabilityTree[K], CapabilityResult> {
  const contextKey = getContextKey(context);

  // Simple memoization - recompute only when category or context changes
  return useMemo(
    () => BioCapabilities.checkCategory(category, context),
    [category, contextKey]
  );
}

// ============================================================
// USE CAPABILITY ENABLED HOOK
// ============================================================

/**
 * Simplified hook that returns just a boolean
 *
 * @param path - The capability path
 * @param context - Optional context
 * @returns True if the capability is enabled
 *
 * @example
 * ```tsx
 * function EditButton() {
 *   const canEdit = useCapabilityEnabled('table.inlineEdit');
 *
 *   if (!canEdit) return null;
 *
 *   return <button>Edit</button>;
 * }
 * ```
 */
export function useCapabilityEnabled(
  path: CapabilityPath,
  context?: CapabilityContext
): boolean {
  const result = useCapability(path, context);
  return result.enabled;
}

// ============================================================
// USE CAPABILITY SUBSCRIPTION HOOK
// ============================================================

/**
 * Hook that subscribes to capability changes
 *
 * Use this when you need to react to adapter changes or role registrations.
 *
 * @returns Current capability stats
 */
export function useCapabilityStats() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    return BioCapabilities.subscribe(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    return BioCapabilities.getStats();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

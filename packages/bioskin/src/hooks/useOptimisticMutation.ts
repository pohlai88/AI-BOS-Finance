/**
 * useOptimisticMutation - Hook for optimistic UI updates
 *
 * Provides optimistic updates with automatic rollback on error.
 * Compatible with React Query or standalone usage.
 *
 * @example
 * const { mutate, isPending, isOptimistic } = useOptimisticMutation({
 *   mutationFn: updateInvoice,
 *   onOptimisticUpdate: (variables) => {
 *     // Update local state immediately
 *     setInvoice(prev => ({ ...prev, ...variables }));
 *   },
 *   onError: (error, variables, rollback) => {
 *     // Rollback on error
 *     rollback();
 *     toast.error('Failed to update');
 *   },
 * });
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface UseOptimisticMutationOptions<TData, TVariables> {
  /** The mutation function to call */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Called immediately with variables to update UI optimistically */
  onOptimisticUpdate?: (variables: TVariables) => void;
  /** Called on successful mutation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called on error with rollback function */
  onError?: (error: Error, variables: TVariables, rollback: () => void) => void;
  /** Called when mutation settles (success or error) */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  /** Rollback function to restore previous state */
  rollbackFn?: (variables: TVariables) => void;
  /** Delay before showing loading state (ms) */
  loadingDelay?: number;
}

export interface UseOptimisticMutationReturn<TData, TVariables> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  /** Execute the mutation (async) */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Is mutation in progress */
  isPending: boolean;
  /** Is showing optimistic state */
  isOptimistic: boolean;
  /** Last error */
  error: Error | null;
  /** Last successful data */
  data: TData | undefined;
  /** Reset mutation state */
  reset: () => void;
}

// ============================================================
// Hook
// ============================================================

export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  onOptimisticUpdate,
  onSuccess,
  onError,
  onSettled,
  rollbackFn,
  loadingDelay = 0,
}: UseOptimisticMutationOptions<TData, TVariables>): UseOptimisticMutationReturn<TData, TVariables> {
  const [isPending, setIsPending] = React.useState(false);
  const [isOptimistic, setIsOptimistic] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<TData | undefined>(undefined);

  // Track previous variables for rollback
  const previousVariablesRef = React.useRef<TVariables | null>(null);

  const rollback = React.useCallback(() => {
    if (previousVariablesRef.current && rollbackFn) {
      rollbackFn(previousVariablesRef.current);
    }
    setIsOptimistic(false);
  }, [rollbackFn]);

  const mutateAsync = React.useCallback(
    async (variables: TVariables): Promise<TData> => {
      setError(null);
      previousVariablesRef.current = variables;

      // Apply optimistic update immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(variables);
        setIsOptimistic(true);
      }

      // Delay showing loading state if configured
      let loadingTimeout: NodeJS.Timeout | undefined;
      if (loadingDelay > 0) {
        loadingTimeout = setTimeout(() => setIsPending(true), loadingDelay);
      } else {
        setIsPending(true);
      }

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsOptimistic(false);
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error, variables, rollback);
        onSettled?.(undefined, error, variables);
        throw error;
      } finally {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setIsPending(false);
      }
    },
    [mutationFn, onOptimisticUpdate, onSuccess, onError, onSettled, rollback, loadingDelay]
  );

  const mutate = React.useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        return undefined;
      }
    },
    [mutateAsync]
  );

  const reset = React.useCallback(() => {
    setIsPending(false);
    setIsOptimistic(false);
    setError(null);
    setData(undefined);
    previousVariablesRef.current = null;
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending,
    isOptimistic,
    error,
    data,
    reset,
  };
}

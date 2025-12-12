/**
 * useFieldContext Hook - Silent Killer Frontend
 * 
 * Fetches complete field context from Kernel API for sidebar display.
 * Includes field definition, lineage summary, AI suggestions, and quality signals.
 * 
 * @see GET /metadata/context/field/{dict_id}
 */

import { useState, useEffect } from 'react';
import { kernelClient } from '@/lib/kernel-client';
import type { FieldContextResponse } from '@aibos/schemas/kernel';

interface UseFieldContextOptions {
  dictId: string | null;
  enabled?: boolean;
}

interface UseFieldContextResult {
  data: FieldContextResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFieldContext({
  dictId,
  enabled = true,
}: UseFieldContextOptions): UseFieldContextResult {
  const [data, setData] = useState<FieldContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFieldContext = async () => {
    if (!dictId || !enabled) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = await kernelClient.getFieldContext(dictId);
      setData(context);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch field context');
      setError(error);
      setData(null);
      console.error('Failed to fetch field context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldContext();
  }, [dictId, enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchFieldContext,
  };
}

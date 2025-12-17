/**
 * useSmartDefaults - Hook for context-aware form defaults
 * 
 * Provides smart defaults based on:
 * - Current user
 * - Current date/time
 * - Last used values
 * - Related records
 * - User preferences
 */

'use client';

import * as React from 'react';
import { z } from 'zod';

// ============================================================
// Types
// ============================================================

export interface SmartDefaultConfig<T = Record<string, unknown>> {
  /** Get default for a field */
  [fieldName: string]: (context: SmartDefaultContext) => unknown;
}

export interface SmartDefaultContext {
  /** Current user ID */
  userId?: string;
  /** Current date */
  now: Date;
  /** Last used values (from localStorage or context) */
  lastUsed?: Record<string, unknown>;
  /** Related record data */
  relatedRecord?: Record<string, unknown>;
  /** User preferences */
  preferences?: Record<string, unknown>;
}

export interface UseSmartDefaultsOptions<T extends z.ZodRawShape> {
  /** Zod schema */
  schema: z.ZodObject<T>;
  /** Smart default configuration */
  config?: SmartDefaultConfig<z.infer<z.ZodObject<T>>>;
  /** Context for smart defaults */
  context?: Partial<SmartDefaultContext>;
  /** Storage key for last used values */
  storageKey?: string;
}

export interface UseSmartDefaultsReturn<T extends z.ZodRawShape> {
  /** Computed default values */
  defaultValues: Partial<z.infer<z.ZodObject<T>>>;
  /** Update last used value for a field */
  updateLastUsed: (fieldName: string, value: unknown) => void;
  /** Get default for a specific field */
  getDefault: (fieldName: string) => unknown;
}

// ============================================================
// Hook
// ============================================================

export function useSmartDefaults<T extends z.ZodRawShape>({
  schema,
  config = {},
  context = {},
  storageKey = 'bioskin_last_used',
}: UseSmartDefaultsOptions<T>): UseSmartDefaultsReturn<T> {
  const [lastUsed, setLastUsed] = React.useState<Record<string, unknown>>({});

  // Load last used values from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setLastUsed(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load last used values:', error);
    }
  }, [storageKey]);

  // Build context
  const defaultContext: SmartDefaultContext = React.useMemo(
    () => ({
      userId: context.userId,
      now: context.now || new Date(),
      lastUsed,
      relatedRecord: context.relatedRecord,
      preferences: context.preferences,
    }),
    [context, lastUsed]
  );

  // Compute default values
  const defaultValues = React.useMemo(() => {
    const result: Partial<z.infer<z.ZodObject<T>>> = {};

    // Get schema shape
    const shape = schema.shape;

    for (const [fieldName] of Object.entries(shape)) {
      // Check if there's a smart default config
      if (config[fieldName]) {
        try {
          result[fieldName as keyof typeof result] = config[fieldName](defaultContext) as never;
        } catch (error) {
          console.error(`Failed to compute default for ${fieldName}:`, error);
        }
      } else {
        // Use common defaults based on field name
        const lowerName = fieldName.toLowerCase();

        if (lowerName.includes('date') && !lowerName.includes('birth')) {
          result[fieldName as keyof typeof result] = defaultContext.now.toISOString().split('T')[0] as never;
        } else if (lowerName.includes('created') || lowerName.includes('updated')) {
          result[fieldName as keyof typeof result] = defaultContext.now.toISOString() as never;
        } else if (lowerName.includes('user') && defaultContext.userId) {
          result[fieldName as keyof typeof result] = defaultContext.userId as never;
        } else if (lastUsed[fieldName] !== undefined) {
          result[fieldName as keyof typeof result] = lastUsed[fieldName] as never;
        }
      }
    }

    return result;
  }, [schema, config, defaultContext, lastUsed]);

  // Update last used value
  const updateLastUsed = React.useCallback(
    (fieldName: string, value: unknown) => {
      const updated = { ...lastUsed, [fieldName]: value };
      setLastUsed(updated);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save last used value:', error);
      }
    },
    [lastUsed, storageKey]
  );

  // Get default for specific field
  const getDefault = React.useCallback(
    (fieldName: string): unknown => {
      if (config[fieldName]) {
        return config[fieldName](defaultContext);
      }
      return defaultValues[fieldName as keyof typeof defaultValues];
    },
    [config, defaultContext, defaultValues]
  );

  return {
    defaultValues,
    updateLastUsed,
    getDefault,
  };
}

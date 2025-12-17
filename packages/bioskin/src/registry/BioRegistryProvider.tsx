'use client';

/**
 * @fileoverview BioRegistry React Provider
 *
 * React context provider for BioRegistry initialization.
 * Provides a clean way to initialize the registry at app root.
 *
 * @module @aibos/bioskin/registry
 * @version 1.0.0
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  useCallback,
  type ReactNode,
} from 'react';
import { BioRegistry } from './BioRegistry';
import type { IndustryAdapter, AdapterCluster } from './types';

// ============================================================
// CONTEXT TYPES
// ============================================================

export interface BioRegistryContextValue {
  /** Active adapter ID */
  activeAdapterId: AdapterCluster | null;
  /** Whether the registry is initialized and ready */
  isReady: boolean;
  /** All registered adapter IDs */
  registeredAdapterIds: AdapterCluster[];
}

// ============================================================
// CONTEXT
// ============================================================

const BioRegistryContext = createContext<BioRegistryContextValue>({
  activeAdapterId: null,
  isReady: false,
  registeredAdapterIds: [],
});

// ============================================================
// PROVIDER PROPS
// ============================================================

export interface BioRegistryProviderProps {
  /** Adapter to register and activate */
  adapter: IndustryAdapter;
  /** Additional adapters to register (optional) */
  additionalAdapters?: IndustryAdapter[];
  /** Children to render */
  children: ReactNode;
  /** Fallback to show while initializing (optional) */
  fallback?: ReactNode;
}

// ============================================================
// PROVIDER COMPONENT
// ============================================================

/**
 * BioRegistryProvider - Initialize BioRegistry at app root
 *
 * Registers the adapter and activates it on mount.
 * Provides context for checking registry state.
 *
 * @example
 * ```tsx
 * // In your root layout or app
 * import { BioRegistryProvider } from '@aibos/bioskin';
 * import { SupplyChainAdapter } from './adapters/supplychain';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <BioRegistryProvider adapter={SupplyChainAdapter}>
 *       {children}
 *     </BioRegistryProvider>
 *   );
 * }
 * ```
 */
export function BioRegistryProvider({
  adapter,
  additionalAdapters = [],
  children,
  fallback,
}: BioRegistryProviderProps): React.ReactElement {
  const [isReady, setIsReady] = useState(false);

  // Initialize registry on mount
  useEffect(() => {
    // Register main adapter
    if (!BioRegistry.isRegistered(adapter.id)) {
      BioRegistry.register(adapter);
    }

    // Register additional adapters
    for (const additional of additionalAdapters) {
      if (!BioRegistry.isRegistered(additional.id)) {
        BioRegistry.register(additional);
      }
    }

    // Activate main adapter
    BioRegistry.activate(adapter.id);
    setIsReady(true);

    // Cleanup on unmount
    return () => {
      BioRegistry.deactivate();
    };
  }, [adapter, additionalAdapters]);

  // Subscribe to registry changes
  const subscribe = useCallback((onStoreChange: () => void) => {
    return BioRegistry.subscribe(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    return {
      activeAdapterId: BioRegistry.getActiveAdapterId(),
      registeredAdapterIds: BioRegistry.getRegisteredAdapterIds(),
    };
  }, []);

  const registryState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const contextValue: BioRegistryContextValue = {
    ...registryState,
    isReady,
  };

  // Show fallback while initializing
  if (!isReady && fallback) {
    return <>{fallback}</>;
  }

  return (
    <BioRegistryContext.Provider value={contextValue}>
      {children}
    </BioRegistryContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

/**
 * useRegistryContext - Access registry context
 *
 * @returns Registry context value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { activeAdapterId, isReady } = useRegistryContext();
 *
 *   if (!isReady) return <Skeleton />;
 *
 *   return <div>Active: {activeAdapterId}</div>;
 * }
 * ```
 */
export function useRegistryContext(): BioRegistryContextValue {
  return useContext(BioRegistryContext);
}

/**
 * useRegistryReady - Check if registry is ready
 *
 * @returns True if registry is initialized
 */
export function useRegistryReady(): boolean {
  const { isReady } = useRegistryContext();
  return isReady;
}

/**
 * useActiveAdapter - Get the active adapter ID
 *
 * @returns Active adapter ID or null
 */
export function useActiveAdapter(): AdapterCluster | null {
  const { activeAdapterId } = useRegistryContext();
  return activeAdapterId;
}

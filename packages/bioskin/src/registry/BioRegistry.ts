/**
 * @fileoverview BioRegistry - Industry Adapter Registry
 * 
 * Singleton registry for managing industry adapters.
 * Implements dependency inversion for multi-industry UI support.
 * Per CONT_12: BioRegistry & Industry Adapters
 * 
 * @module @aibos/bioskin/registry
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * import { BioRegistry } from '@aibos/bioskin';
 * import { SupplyChainAdapter } from './adapters/supplychain';
 * 
 * // Register adapter at app startup
 * BioRegistry.register(SupplyChainAdapter);
 * 
 * // Activate for current session
 * BioRegistry.activate('supplychain');
 * 
 * // Components can then query the registry
 * const emptyState = BioRegistry.getEmptyState('shipments');
 * const commands = BioRegistry.getCommands('warehouse');
 * ```
 */

import type {
  IndustryAdapter,
  AdapterCluster,
  EmptyStateConfig,
  CommandConfig,
  CommandCategory,
  FilterPreset,
  ExceptionTypeConfig,
  QuickAction,
  DesignTokenOverrides,
  ModuleConfig,
} from './types';
import { validateAdapterOrThrow, formatValidationErrors } from './validation';
import { z } from 'zod';

// ============================================================
// REGISTRY EVENTS
// ============================================================

/**
 * Event types for registry state changes
 */
export type RegistryEvent =
  | { type: 'adapter:registered'; adapter: IndustryAdapter }
  | { type: 'adapter:activated'; adapterId: AdapterCluster }
  | { type: 'adapter:deactivated' };

/**
 * Event listener callback
 */
export type RegistryEventListener = (event: RegistryEvent) => void;

// ============================================================
// BIO REGISTRY IMPLEMENTATION
// ============================================================

/**
 * BioRegistry - Singleton for industry adapter management
 * 
 * Provides dependency inversion for industry-specific configurations.
 * Components query the registry for empty states, commands, presets, etc.
 * without knowing about specific industries.
 */
class BioRegistryImpl {
  /** Registered adapters */
  private adapters = new Map<AdapterCluster, IndustryAdapter>();

  /** Currently active adapter ID */
  private activeAdapterId: AdapterCluster | null = null;

  /** Event listeners */
  private listeners = new Set<RegistryEventListener>();

  /** Debug mode flag */
  private debugMode = false;

  // ============================================================
  // REGISTRATION & ACTIVATION
  // ============================================================

  /**
   * Register an industry adapter
   * 
   * @param adapter - The adapter to register
   * @throws ZodError if adapter validation fails
   * 
   * @example
   * ```typescript
   * BioRegistry.register(SupplyChainAdapter);
   * ```
   */
  register(adapter: IndustryAdapter): void {
    try {
      // Validate adapter schema
      validateAdapterOrThrow(adapter);

      // Store adapter
      this.adapters.set(adapter.id, adapter);

      // Emit event
      this.emit({ type: 'adapter:registered', adapter });

      if (this.debugMode) {
        console.log(`[BioRegistry] Registered adapter: ${adapter.name} (${adapter.id})`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = formatValidationErrors(error);
        console.error(`[BioRegistry] Invalid adapter "${(adapter as IndustryAdapter)?.id}":`, messages);
      }
      throw error;
    }
  }

  /**
   * Activate an adapter for the current session
   * 
   * @param adapterId - The adapter ID to activate
   * @throws Error if adapter is not registered
   * 
   * @example
   * ```typescript
   * BioRegistry.activate('supplychain');
   * ```
   */
  activate(adapterId: AdapterCluster): void {
    if (!this.adapters.has(adapterId)) {
      const registered = Array.from(this.adapters.keys()).join(', ') || 'none';
      throw new Error(
        `[BioRegistry] Adapter "${adapterId}" not found. ` +
        `Registered adapters: ${registered}. ` +
        `Did you call BioRegistry.register() first?`
      );
    }

    this.activeAdapterId = adapterId;

    // Emit event
    this.emit({ type: 'adapter:activated', adapterId });

    if (this.debugMode) {
      console.log(`[BioRegistry] Activated adapter: ${adapterId}`);
    }
  }

  /**
   * Deactivate the current adapter
   */
  deactivate(): void {
    this.activeAdapterId = null;
    this.emit({ type: 'adapter:deactivated' });

    if (this.debugMode) {
      console.log('[BioRegistry] Deactivated adapter');
    }
  }

  /**
   * Check if an adapter is registered
   * 
   * @param adapterId - The adapter ID to check
   * @returns True if registered
   */
  isRegistered(adapterId: AdapterCluster): boolean {
    return this.adapters.has(adapterId);
  }

  /**
   * Get all registered adapter IDs
   * 
   * @returns Array of registered adapter IDs
   */
  getRegisteredAdapterIds(): AdapterCluster[] {
    return Array.from(this.adapters.keys());
  }

  // ============================================================
  // ADAPTER ACCESS
  // ============================================================

  /**
   * Get the active adapter
   * 
   * @returns The active adapter or null
   */
  getActiveAdapter(): IndustryAdapter | null {
    if (!this.activeAdapterId) return null;
    return this.adapters.get(this.activeAdapterId) ?? null;
  }

  /**
   * Get the active adapter ID
   * 
   * @returns The active adapter ID or null
   */
  getActiveAdapterId(): AdapterCluster | null {
    return this.activeAdapterId;
  }

  /**
   * Get a specific adapter by ID
   * 
   * @param adapterId - The adapter ID
   * @returns The adapter or undefined
   */
  getAdapter(adapterId: AdapterCluster): IndustryAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  // ============================================================
  // EMPTY STATE ACCESS
  // ============================================================

  /**
   * Get empty state config for a module/entity
   * 
   * @param key - The module or entity key (e.g., 'shipments', 'invoices')
   * @returns Empty state config or undefined
   * 
   * @example
   * ```typescript
   * const config = BioRegistry.getEmptyState('shipments');
   * if (config) {
   *   return <EmptyState {...config} />;
   * }
   * ```
   */
  getEmptyState(key: string): EmptyStateConfig | undefined {
    const adapter = this.getActiveAdapter();
    return adapter?.emptyStates[key];
  }

  /**
   * Get all empty state keys for the active adapter
   * 
   * @returns Array of empty state keys
   */
  getEmptyStateKeys(): string[] {
    const adapter = this.getActiveAdapter();
    return adapter ? Object.keys(adapter.emptyStates) : [];
  }

  // ============================================================
  // COMMAND ACCESS
  // ============================================================

  /**
   * Get commands for the active adapter
   * 
   * @param module - Optional module filter
   * @returns Array of command configs
   * 
   * @example
   * ```typescript
   * // Get all commands
   * const allCommands = BioRegistry.getCommands();
   * 
   * // Get commands for a specific module
   * const warehouseCommands = BioRegistry.getCommands('warehouse');
   * ```
   */
  getCommands(module?: string): CommandConfig[] {
    const adapter = this.getActiveAdapter();
    if (!adapter) return [];

    if (module) {
      return adapter.commands.filter((cmd) => cmd.module === module);
    }

    return adapter.commands;
  }

  /**
   * Get command categories for the active adapter
   * 
   * @returns Array of command categories
   */
  getCommandCategories(): CommandCategory[] {
    const adapter = this.getActiveAdapter();
    return adapter?.commandCategories ?? [];
  }

  /**
   * Search commands by query (fuzzy matching)
   * 
   * @param query - Search query
   * @returns Matching commands
   */
  searchCommands(query: string): CommandConfig[] {
    const commands = this.getCommands();
    const lowerQuery = query.toLowerCase();

    return commands.filter((cmd) => {
      // Match on label
      if (cmd.label.toLowerCase().includes(lowerQuery)) return true;

      // Match on keywords
      if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))) return true;

      // Match on module
      if (cmd.module.toLowerCase().includes(lowerQuery)) return true;

      return false;
    });
  }

  // ============================================================
  // FILTER PRESET ACCESS
  // ============================================================

  /**
   * Get filter presets for a module
   * 
   * @param module - The module code
   * @returns Array of filter presets
   * 
   * @example
   * ```typescript
   * const presets = BioRegistry.getFilterPresets('warehouse');
   * ```
   */
  getFilterPresets(module: string): FilterPreset[] {
    const adapter = this.getActiveAdapter();
    return adapter?.filterPresets[module] ?? [];
  }

  /**
   * Get the default filter preset for a module
   * 
   * @param module - The module code
   * @returns The default preset or undefined
   */
  getDefaultFilterPreset(module: string): FilterPreset | undefined {
    const presets = this.getFilterPresets(module);
    return presets.find((p) => p.isDefault);
  }

  // ============================================================
  // EXCEPTION TYPE ACCESS
  // ============================================================

  /**
   * Get exception types for the active adapter
   * 
   * @param module - Optional module filter
   * @returns Array of exception type configs
   */
  getExceptionTypes(module?: string): ExceptionTypeConfig[] {
    const adapter = this.getActiveAdapter();
    if (!adapter) return [];

    if (module) {
      return adapter.exceptionTypes.filter((ex) => ex.module === module);
    }

    return adapter.exceptionTypes;
  }

  /**
   * Get exception type by code
   * 
   * @param code - The exception code
   * @returns Exception type config or undefined
   */
  getExceptionType(code: string): ExceptionTypeConfig | undefined {
    const adapter = this.getActiveAdapter();
    return adapter?.exceptionTypes.find((ex) => ex.code === code);
  }

  // ============================================================
  // QUICK ACTION ACCESS
  // ============================================================

  /**
   * Get quick actions for an entity type
   * 
   * @param entityType - The entity type (e.g., 'shipment', 'invoice')
   * @returns Array of quick actions
   */
  getQuickActions(entityType: string): QuickAction[] {
    const adapter = this.getActiveAdapter();
    return adapter?.quickActions?.[entityType] ?? [];
  }

  // ============================================================
  // VALIDATION MESSAGE ACCESS
  // ============================================================

  /**
   * Get validation message override
   * 
   * @param code - The validation message code
   * @returns Override message or undefined
   * 
   * @example
   * ```typescript
   * const message = BioRegistry.getValidationMessage('FEFO_VIOLATION');
   * // Returns: "This item violates FEFO rules..."
   * ```
   */
  getValidationMessage(code: string): string | undefined {
    const adapter = this.getActiveAdapter();
    return adapter?.validationMessages?.[code];
  }

  // ============================================================
  // MODULE ACCESS
  // ============================================================

  /**
   * Get modules for the active adapter
   * 
   * @returns Array of module configs
   */
  getModules(): ModuleConfig[] {
    const adapter = this.getActiveAdapter();
    return adapter?.modules ?? [];
  }

  /**
   * Get a module by code
   * 
   * @param code - The module code
   * @returns Module config or undefined
   */
  getModule(code: string): ModuleConfig | undefined {
    const adapter = this.getActiveAdapter();
    return adapter?.modules.find((m) => m.code === code);
  }

  // ============================================================
  // TOKEN ACCESS
  // ============================================================

  /**
   * Get design token overrides for the active adapter
   * 
   * @returns Token overrides or undefined
   */
  getTokenOverrides(): DesignTokenOverrides | undefined {
    const adapter = this.getActiveAdapter();
    return adapter?.tokens;
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  /**
   * Subscribe to registry events
   * 
   * @param listener - Event listener callback
   * @returns Unsubscribe function
   */
  subscribe(listener: RegistryEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: RegistryEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[BioRegistry] Event listener error:', error);
      }
    });
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  /**
   * Enable debug mode for logging
   * 
   * @param enabled - Whether to enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Reset the registry (useful for testing)
   * 
   * @internal
   */
  reset(): void {
    this.adapters.clear();
    this.activeAdapterId = null;
    this.listeners.clear();
    this.debugMode = false;
  }

  /**
   * Get registry statistics
   * 
   * @returns Registry stats object
   */
  getStats(): {
    registeredCount: number;
    activeAdapterId: AdapterCluster | null;
    listenerCount: number;
  } {
    return {
      registeredCount: this.adapters.size,
      activeAdapterId: this.activeAdapterId,
      listenerCount: this.listeners.size,
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

/**
 * BioRegistry singleton instance
 * 
 * @example
 * ```typescript
 * import { BioRegistry } from '@aibos/bioskin';
 * 
 * BioRegistry.register(myAdapter);
 * BioRegistry.activate('supplychain');
 * 
 * const emptyState = BioRegistry.getEmptyState('shipments');
 * ```
 */
export const BioRegistry = new BioRegistryImpl();

// Export the class type for typing purposes
export type { BioRegistryImpl };

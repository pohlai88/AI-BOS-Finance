/**
 * @fileoverview BioCapabilities - Feature Flag System
 *
 * Singleton for checking capabilities based on adapter, role, context, and compliance.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { BioCapabilities, BioRegistry } from '@aibos/bioskin';
 *
 * // After adapter is activated
 * BioRegistry.activate('supplychain');
 *
 * // Check a capability
 * const result = BioCapabilities.check('table.inlineEdit');
 * if (result.enabled) {
 *   // Render inline edit UI
 * }
 *
 * // Check with context
 * const contextResult = BioCapabilities.check('actions.update', {
 *   periodStatus: 'closed',
 * });
 * // Returns { enabled: false, reason: 'Period is closed...', source: 'context' }
 * ```
 */

import { BioRegistry } from '../registry/BioRegistry';
import { CapabilityProfiles, DefaultCapabilities } from './profiles';
import { getComplianceOverrides } from './compliance';
import type {
  CapabilityTree,
  CapabilityPath,
  CapabilityResult,
  CapabilityContext,
  CapabilityCategory,
  PartialCapabilityTree,
  CapabilityEvent,
  CapabilityEventListener,
} from './types';

// ============================================================
// BIO CAPABILITIES IMPLEMENTATION
// ============================================================

/**
 * BioCapabilities - Feature flag system with multi-layer evaluation
 *
 * Evaluation order (highest priority first):
 * 1. Compliance Rules (cannot be overridden)
 * 2. Context (period lock, entity state)
 * 3. Role Overrides
 * 4. Adapter Profile
 */
class BioCapabilitiesImpl {
  /** Role-based capability overrides */
  private roleOverrides = new Map<string, PartialCapabilityTree>();

  /** Event listeners */
  private listeners = new Set<CapabilityEventListener>();

  /** Debug mode flag */
  private debugMode = false;

  // ============================================================
  // CAPABILITY CHECKING
  // ============================================================

  /**
   * Check if a capability is enabled
   *
   * @param path - The capability path (e.g., 'table.inlineEdit')
   * @param context - Optional context for evaluation
   * @returns Capability result with enabled status, reason, and source
   *
   * @example
   * ```typescript
   * const result = BioCapabilities.check('table.inlineEdit');
   * // { enabled: true, source: 'adapter' }
   *
   * const result2 = BioCapabilities.check('actions.update', { periodStatus: 'closed' });
   * // { enabled: false, reason: 'Period is closed...', source: 'context' }
   * ```
   */
  check(path: CapabilityPath, context?: CapabilityContext): CapabilityResult {
    const [category, feature] = path.split('.') as [CapabilityCategory, string];

    // 1. Get adapter and profile
    const adapter = BioRegistry.getActiveAdapter();
    if (!adapter) {
      // Use default capabilities when no adapter is active
      const defaultValue = this.getDefaultCapability(category, feature);
      return { enabled: defaultValue, source: 'default' };
    }

    // 2. Check compliance rules FIRST (cannot be overridden)
    const complianceOverrides = getComplianceOverrides(adapter.id);
    const complianceBlock = complianceOverrides.find((o) => o.path === path && !o.enabled);
    if (complianceBlock) {
      if (this.debugMode) {
        console.log(`[BioCapabilities] ${path} blocked by compliance: ${complianceBlock.reason}`);
      }
      return {
        enabled: false,
        reason: complianceBlock.reason,
        source: 'compliance',
      };
    }

    // 3. Check context (period lock, entity state)
    if (context) {
      const contextResult = this.checkContext(path, context);
      if (!contextResult.enabled) {
        if (this.debugMode) {
          console.log(`[BioCapabilities] ${path} blocked by context: ${contextResult.reason}`);
        }
        return contextResult;
      }
    }

    // 4. Check role overrides
    if (context?.userRole) {
      const roleProfile = this.roleOverrides.get(context.userRole);
      if (roleProfile) {
        const categoryProfile = roleProfile[category] as Record<string, boolean> | undefined;
        const roleOverride = categoryProfile?.[feature];
        if (roleOverride !== undefined) {
          return { enabled: roleOverride, source: 'role' };
        }
      }
    }

    // 5. Return adapter profile default
    const profile = CapabilityProfiles[adapter.id];
    const categoryProfile = profile?.[category] as Record<string, boolean> | undefined;
    const adapterDefault = categoryProfile?.[feature] ?? this.getDefaultCapability(category, feature);

    return { enabled: adapterDefault, source: 'adapter' };
  }

  /**
   * Check all capabilities for a category
   *
   * @param category - The capability category
   * @param context - Optional context for evaluation
   * @returns Record of all capabilities in the category with their results
   *
   * @example
   * ```typescript
   * const tableCapabilities = BioCapabilities.checkCategory('table');
   * // { inlineEdit: { enabled: true, ... }, bulkEdit: { enabled: true, ... }, ... }
   * ```
   */
  checkCategory<K extends CapabilityCategory>(
    category: K,
    context?: CapabilityContext
  ): Record<keyof CapabilityTree[K], CapabilityResult> {
    const defaultCategory = DefaultCapabilities[category];
    const results = {} as Record<keyof CapabilityTree[K], CapabilityResult>;

    for (const feature of Object.keys(defaultCategory)) {
      const path = `${category}.${feature}` as CapabilityPath;
      results[feature as keyof CapabilityTree[K]] = this.check(path, context);
    }

    return results;
  }

  /**
   * Check multiple capabilities at once
   *
   * @param paths - Array of capability paths
   * @param context - Optional context for evaluation
   * @returns Record of capabilities and their results
   */
  checkMultiple(
    paths: CapabilityPath[],
    context?: CapabilityContext
  ): Record<CapabilityPath, CapabilityResult> {
    const results: Record<string, CapabilityResult> = {};

    for (const path of paths) {
      results[path] = this.check(path, context);
    }

    return results as Record<CapabilityPath, CapabilityResult>;
  }

  /**
   * Quick check if a capability is enabled (boolean only)
   *
   * @param path - The capability path
   * @param context - Optional context
   * @returns True if enabled
   */
  isEnabled(path: CapabilityPath, context?: CapabilityContext): boolean {
    return this.check(path, context).enabled;
  }

  // ============================================================
  // CONTEXT CHECKING
  // ============================================================

  /**
   * Check context-based restrictions
   */
  private checkContext(path: CapabilityPath, context: CapabilityContext): CapabilityResult {
    // Period lock check
    if (context.periodStatus === 'closed') {
      const writeActions = [
        'actions.update',
        'actions.delete',
        'actions.void',
        'table.inlineEdit',
        'table.bulkEdit',
        'table.bulkDelete',
      ];
      if (writeActions.includes(path)) {
        return {
          enabled: false,
          reason: 'Period is closed. No modifications allowed.',
          source: 'context',
        };
      }
    }

    // Entity state checks
    if (context.entityState === 'approved') {
      const restrictedInApproved = ['actions.update', 'actions.delete'];
      if (restrictedInApproved.includes(path)) {
        return {
          enabled: false,
          reason: 'Cannot modify approved records. Void and recreate if needed.',
          source: 'context',
        };
      }
    }

    if (context.entityState === 'posted') {
      const restrictedInPosted = ['actions.update', 'actions.delete', 'table.inlineEdit'];
      if (restrictedInPosted.includes(path)) {
        return {
          enabled: false,
          reason: 'Cannot modify posted records.',
          source: 'context',
        };
      }
    }

    return { enabled: true, source: 'context' };
  }

  /**
   * Get default capability value
   */
  private getDefaultCapability(category: string, feature: string): boolean {
    const categoryDefaults = DefaultCapabilities[category as CapabilityCategory];
    return (categoryDefaults as Record<string, boolean>)?.[feature] ?? false;
  }

  // ============================================================
  // ROLE MANAGEMENT
  // ============================================================

  /**
   * Register role-based capability overrides
   *
   * @param role - The role name
   * @param capabilities - Partial capability tree for this role
   *
   * @example
   * ```typescript
   * BioCapabilities.registerRoleOverrides('viewer', {
   *   actions: { create: false, update: false, delete: false },
   *   table: { inlineEdit: false, bulkEdit: false },
   * });
   * ```
   */
  registerRoleOverrides(role: string, capabilities: PartialCapabilityTree): void {
    this.roleOverrides.set(role, capabilities);
    this.emit({ type: 'role:registered', role });

    if (this.debugMode) {
      console.log(`[BioCapabilities] Registered role overrides for: ${role}`);
    }
  }

  /**
   * Get role overrides for a role
   *
   * @param role - The role name
   * @returns The role's capability overrides or undefined
   */
  getRoleOverrides(role: string): PartialCapabilityTree | undefined {
    return this.roleOverrides.get(role);
  }

  /**
   * Clear role overrides for a role
   *
   * @param role - The role name
   */
  clearRoleOverrides(role: string): void {
    this.roleOverrides.delete(role);
  }

  /**
   * Get all registered roles
   *
   * @returns Array of role names
   */
  getRegisteredRoles(): string[] {
    return Array.from(this.roleOverrides.keys());
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  /**
   * Subscribe to capability events
   *
   * @param listener - Event listener callback
   * @returns Unsubscribe function
   */
  subscribe(listener: CapabilityEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: CapabilityEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[BioCapabilities] Event listener error:', error);
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
   * Reset the capabilities system (useful for testing)
   *
   * @internal
   */
  reset(): void {
    this.roleOverrides.clear();
    this.listeners.clear();
    this.debugMode = false;
  }

  /**
   * Get system statistics
   *
   * @returns Statistics object
   */
  getStats(): {
    registeredRoles: number;
    listenerCount: number;
    activeAdapterId: string | null;
  } {
    return {
      registeredRoles: this.roleOverrides.size,
      listenerCount: this.listeners.size,
      activeAdapterId: BioRegistry.getActiveAdapterId(),
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

/**
 * BioCapabilities singleton instance
 *
 * @example
 * ```typescript
 * import { BioCapabilities } from '@aibos/bioskin';
 *
 * // Check capability
 * const result = BioCapabilities.check('table.inlineEdit');
 *
 * // Check with context
 * const result2 = BioCapabilities.check('actions.update', {
 *   periodStatus: 'closed',
 *   userRole: 'viewer',
 * });
 * ```
 */
export const BioCapabilities = new BioCapabilitiesImpl();

// Export the class type for typing purposes
export type { BioCapabilitiesImpl };

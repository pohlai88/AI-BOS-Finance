/**
 * @fileoverview BioCapabilities Unit Tests
 *
 * Tests for the feature flag system.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/__tests__/capabilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FileBox, Truck, Thermometer, Package } from 'lucide-react';
import {
  BioCapabilities,
  BioRegistry,
  type IndustryAdapter,
  type CapabilityPath,
  type CapabilityContext,
  CapabilityGate,
  RequireCapability,
  RequireAnyCapability,
  getComplianceOverrides,
  CapabilityProfiles,
} from '../src';

// ============================================================
// TEST FIXTURES
// ============================================================

/**
 * Valid SupplyChain adapter for testing
 */
const createSupplyChainAdapter = (): IndustryAdapter => ({
  id: 'supplychain',
  name: 'Supply Chain & Cold Chain',
  modules: [
    { code: 'warehouse', name: 'Warehouse', icon: FileBox, route: '/warehouse' },
    { code: 'coldchain', name: 'Cold Chain', icon: Thermometer, route: '/coldchain' },
  ],
  emptyStates: {
    shipments: {
      icon: Truck,
      title: 'No shipments yet',
      description: 'Create your first shipment',
      action: { label: 'Create Shipment', route: '/shipments/new' },
    },
  },
  commands: [
    { id: 'scan-receive', label: 'Scan to Receive', module: 'warehouse' },
  ],
  filterPresets: {
    warehouse: [
      { id: 'low-stock', name: 'Low Stock', filters: [{ field: 'qty', operator: 'lt', value: 10 }] },
    ],
  },
  exceptionTypes: [
    { code: 'TEMP_BREACH', label: 'Temperature Breach', severity: 'critical', module: 'coldchain' },
  ],
});

/**
 * Valid Corporate adapter for testing SOX compliance
 */
const createCorporateAdapter = (): IndustryAdapter => ({
  id: 'corporate',
  name: 'Corporate Finance',
  modules: [
    { code: 'gl', name: 'General Ledger', icon: Package, route: '/gl' },
  ],
  emptyStates: {
    journals: {
      icon: Package,
      title: 'No journals',
      description: 'Create your first journal',
      action: { label: 'Create Journal', route: '/journals/new' },
    },
  },
  commands: [
    { id: 'post-journal', label: 'Post Journal', module: 'gl' },
  ],
  filterPresets: {
    gl: [
      { id: 'unposted', name: 'Unposted', filters: [{ field: 'status', operator: 'eq', value: 'draft' }] },
    ],
  },
  exceptionTypes: [
    { code: 'UNBALANCED', label: 'Unbalanced Entry', severity: 'critical', module: 'gl' },
  ],
});

// ============================================================
// RESET BEFORE EACH TEST
// ============================================================

describe('BioCapabilities', () => {
  beforeEach(() => {
    BioRegistry.reset();
    BioCapabilities.reset();
  });

  // ============================================================
  // ADAPTER PROFILE TESTS
  // ============================================================

  describe('Adapter Profile', () => {
    beforeEach(() => {
      BioRegistry.register(createSupplyChainAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns adapter default for enabled capability', () => {
      const result = BioCapabilities.check('table.inlineEdit');
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('adapter');
    });

    it('returns adapter default for disabled capability', () => {
      // SupplyChain profile has bulkDelete = false
      const result = BioCapabilities.check('table.bulkDelete');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('adapter');
    });

    it('returns default when no adapter is active', () => {
      BioRegistry.deactivate();
      const result = BioCapabilities.check('table.inlineEdit');
      expect(result.source).toBe('default');
    });

    it('checks entire category', () => {
      const tableCapabilities = BioCapabilities.checkCategory('table');
      expect(tableCapabilities.inlineEdit.enabled).toBe(true);
      expect(tableCapabilities.bulkDelete.enabled).toBe(false);
      expect(tableCapabilities.virtualization.enabled).toBe(true);
    });

    it('checks multiple capabilities', () => {
      const results = BioCapabilities.checkMultiple([
        'table.inlineEdit',
        'table.bulkDelete',
        'form.offlineMode',
      ]);
      expect(results['table.inlineEdit'].enabled).toBe(true);
      expect(results['table.bulkDelete'].enabled).toBe(false);
      expect(results['form.offlineMode'].enabled).toBe(true); // SupplyChain has offline
    });

    it('isEnabled returns boolean', () => {
      expect(BioCapabilities.isEnabled('table.inlineEdit')).toBe(true);
      expect(BioCapabilities.isEnabled('table.bulkDelete')).toBe(false);
    });
  });

  // ============================================================
  // CONTEXT OVERRIDE TESTS
  // ============================================================

  describe('Context Overrides', () => {
    beforeEach(() => {
      BioRegistry.register(createSupplyChainAdapter());
      BioRegistry.activate('supplychain');
    });

    it('disables edit when period is closed', () => {
      const context: CapabilityContext = { periodStatus: 'closed' };
      const result = BioCapabilities.check('table.inlineEdit', context);

      expect(result.enabled).toBe(false);
      expect(result.source).toBe('context');
      expect(result.reason).toContain('Period is closed');
    });

    it('disables update for approved entities', () => {
      const context: CapabilityContext = { entityState: 'approved' };
      const result = BioCapabilities.check('actions.update', context);

      expect(result.enabled).toBe(false);
      expect(result.source).toBe('context');
      expect(result.reason).toContain('Cannot modify approved');
    });

    it('disables inline edit for posted entities', () => {
      const context: CapabilityContext = { entityState: 'posted' };
      const result = BioCapabilities.check('table.inlineEdit', context);

      expect(result.enabled).toBe(false);
      expect(result.source).toBe('context');
      expect(result.reason).toContain('Cannot modify posted');
    });

    it('allows read operations when period is closed', () => {
      const context: CapabilityContext = { periodStatus: 'closed' };
      const result = BioCapabilities.check('audit.viewHistory', context);

      expect(result.enabled).toBe(true);
    });
  });

  // ============================================================
  // COMPLIANCE RULES TESTS
  // ============================================================

  describe('Compliance Rules', () => {
    it('SOX disables audit rollback for corporate', () => {
      BioRegistry.register(createCorporateAdapter());
      BioRegistry.activate('corporate');

      const result = BioCapabilities.check('audit.rollback');

      expect(result.enabled).toBe(false);
      expect(result.source).toBe('compliance');
      expect(result.reason).toContain('SOX');
    });

    it('FEFO applies to supplychain', () => {
      BioRegistry.register(createSupplyChainAdapter());
      BioRegistry.activate('supplychain');

      // Check that FEFO compliance is loaded
      const overrides = getComplianceOverrides('supplychain');
      expect(overrides.length).toBeGreaterThan(0);
      expect(overrides.some(o => o.reason?.includes('FEFO'))).toBe(true);
    });

    it('compliance overrides cannot be bypassed by role', () => {
      BioRegistry.register(createCorporateAdapter());
      BioRegistry.activate('corporate');

      // Register role that tries to enable rollback
      BioCapabilities.registerRoleOverrides('admin', {
        audit: { rollback: true },
      });

      // Should still be disabled due to SOX compliance
      const result = BioCapabilities.check('audit.rollback', { userRole: 'admin' });
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('compliance');
    });
  });

  // ============================================================
  // ROLE OVERRIDE TESTS
  // ============================================================

  describe('Role Overrides', () => {
    beforeEach(() => {
      BioRegistry.register(createSupplyChainAdapter());
      BioRegistry.activate('supplychain');
    });

    it('registers and applies role overrides', () => {
      BioCapabilities.registerRoleOverrides('viewer', {
        actions: { create: false, update: false, delete: false },
        table: { inlineEdit: false },
      });

      const context: CapabilityContext = { userRole: 'viewer' };

      const createResult = BioCapabilities.check('actions.create', context);
      expect(createResult.enabled).toBe(false);
      expect(createResult.source).toBe('role');

      const editResult = BioCapabilities.check('table.inlineEdit', context);
      expect(editResult.enabled).toBe(false);
      expect(editResult.source).toBe('role');
    });

    it('falls back to adapter default for unspecified capabilities', () => {
      BioCapabilities.registerRoleOverrides('viewer', {
        actions: { create: false },
      });

      const context: CapabilityContext = { userRole: 'viewer' };

      // This capability is not overridden by role
      const result = BioCapabilities.check('table.csvExport', context);
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('adapter');
    });

    it('returns registered roles', () => {
      BioCapabilities.registerRoleOverrides('viewer', { actions: { create: false } });
      BioCapabilities.registerRoleOverrides('editor', { actions: { create: true } });

      const roles = BioCapabilities.getRegisteredRoles();
      expect(roles).toContain('viewer');
      expect(roles).toContain('editor');
    });

    it('clears role overrides', () => {
      BioCapabilities.registerRoleOverrides('viewer', { actions: { create: false } });
      BioCapabilities.clearRoleOverrides('viewer');

      const context: CapabilityContext = { userRole: 'viewer' };
      const result = BioCapabilities.check('actions.create', context);
      expect(result.source).toBe('adapter'); // Falls back to adapter
    });
  });

  // ============================================================
  // EVENT HANDLING TESTS
  // ============================================================

  describe('Event Handling', () => {
    it('emits role:registered event', () => {
      const listener = vi.fn();
      BioCapabilities.subscribe(listener);

      BioCapabilities.registerRoleOverrides('viewer', { actions: { create: false } });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'role:registered', role: 'viewer' })
      );
    });

    it('unsubscribes correctly', () => {
      const listener = vi.fn();
      const unsubscribe = BioCapabilities.subscribe(listener);

      unsubscribe();
      BioCapabilities.registerRoleOverrides('viewer', { actions: { create: false } });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // PROFILE TESTS
  // ============================================================

  describe('Capability Profiles', () => {
    it('has profiles for all adapter clusters', () => {
      const clusters = ['corporate', 'supplychain', 'production', 'agriops', 'outlet'];
      for (const cluster of clusters) {
        expect(CapabilityProfiles[cluster as keyof typeof CapabilityProfiles]).toBeDefined();
      }
    });

    it('supplychain has offline mode enabled', () => {
      const profile = CapabilityProfiles.supplychain;
      expect(profile.form?.offlineMode).toBe(true);
    });

    it('corporate has offline mode disabled', () => {
      const profile = CapabilityProfiles.corporate;
      expect(profile.form?.offlineMode).toBe(false);
    });
  });

  // ============================================================
  // UTILITY TESTS
  // ============================================================

  describe('Utilities', () => {
    it('returns correct stats', () => {
      BioRegistry.register(createSupplyChainAdapter());
      BioRegistry.activate('supplychain');
      BioCapabilities.registerRoleOverrides('viewer', { actions: { create: false } });

      const stats = BioCapabilities.getStats();
      expect(stats.registeredRoles).toBe(1);
      expect(stats.activeAdapterId).toBe('supplychain');
    });

    it('resets correctly', () => {
      BioCapabilities.registerRoleOverrides('viewer', { actions: { create: false } });
      BioCapabilities.reset();

      expect(BioCapabilities.getRegisteredRoles()).toHaveLength(0);
    });
  });
});

// ============================================================
// REACT COMPONENT TESTS
// ============================================================

describe('CapabilityGate Component', () => {
  beforeEach(() => {
    BioRegistry.reset();
    BioCapabilities.reset();
    BioRegistry.register(createSupplyChainAdapter());
    BioRegistry.activate('supplychain');
  });

  it('renders children when capability is enabled', () => {
    render(
      <CapabilityGate capability="table.inlineEdit">
        <button>Edit</button>
      </CapabilityGate>
    );

    expect(screen.getByText('Edit')).toBeDefined();
  });

  it('renders nothing when capability is disabled and no fallback', () => {
    const { container } = render(
      <CapabilityGate capability="table.bulkDelete">
        <button>Delete All</button>
      </CapabilityGate>
    );

    expect(container.textContent).toBe('');
  });

  it('renders fallback when capability is disabled', () => {
    render(
      <CapabilityGate
        capability="table.bulkDelete"
        fallback={<span>Delete disabled</span>}
      >
        <button>Delete All</button>
      </CapabilityGate>
    );

    expect(screen.getByText('Delete disabled')).toBeDefined();
  });
});

describe('RequireCapability Component', () => {
  beforeEach(() => {
    BioRegistry.reset();
    BioCapabilities.reset();
    BioRegistry.register(createSupplyChainAdapter());
    BioRegistry.activate('supplychain');
  });

  it('renders children when all capabilities are enabled', () => {
    render(
      <RequireCapability capabilities={['table.inlineEdit', 'table.csvExport']}>
        <span>Advanced Mode</span>
      </RequireCapability>
    );

    expect(screen.getByText('Advanced Mode')).toBeDefined();
  });

  it('renders fallback when any capability is disabled', () => {
    render(
      <RequireCapability
        capabilities={['table.inlineEdit', 'table.bulkDelete']}
        fallback={<span>Not available</span>}
      >
        <span>Advanced Mode</span>
      </RequireCapability>
    );

    expect(screen.getByText('Not available')).toBeDefined();
  });
});

describe('RequireAnyCapability Component', () => {
  beforeEach(() => {
    BioRegistry.reset();
    BioCapabilities.reset();
    BioRegistry.register(createSupplyChainAdapter());
    BioRegistry.activate('supplychain');
  });

  it('renders children when any capability is enabled', () => {
    render(
      <RequireAnyCapability capabilities={['table.bulkDelete', 'table.csvExport']}>
        <span>Export Available</span>
      </RequireAnyCapability>
    );

    expect(screen.getByText('Export Available')).toBeDefined();
  });

  it('renders fallback when all capabilities are disabled', () => {
    // SupplyChain has bulkDelete=false and columnPinning=false
    render(
      <RequireAnyCapability
        capabilities={['table.bulkDelete', 'table.columnPinning']}
        fallback={<span>Not available</span>}
      >
        <span>Feature</span>
      </RequireAnyCapability>
    );

    expect(screen.getByText('Not available')).toBeDefined();
  });
});

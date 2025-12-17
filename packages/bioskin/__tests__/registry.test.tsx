/**
 * @fileoverview BioRegistry Unit Tests
 * 
 * Tests for the industry adapter registry system.
 * Per CONT_12: BioRegistry & Industry Adapters
 * 
 * @module @aibos/bioskin/__tests__/registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileBox, Truck, Thermometer, Building2, AlertTriangle, Package } from 'lucide-react';
import {
  BioRegistry,
  type IndustryAdapter,
  type AdapterCluster,
  validateAdapter,
  validateAdapterOrThrow,
  formatValidationErrors,
} from '../src/registry';

// ============================================================
// TEST FIXTURES
// ============================================================

/**
 * Valid SupplyChain adapter for testing
 */
const createValidAdapter = (id: AdapterCluster = 'supplychain'): IndustryAdapter => ({
  id,
  name: 'Supply Chain & Cold Chain',
  modules: [
    { code: 'warehouse', name: 'Warehouse', icon: FileBox, route: '/warehouse' },
    { code: 'coldchain', name: 'Cold Chain', icon: Thermometer, route: '/coldchain' },
  ],
  emptyStates: {
    'shipments': {
      icon: Truck,
      title: 'No shipments yet',
      description: 'Create your first shipment to start tracking deliveries',
      action: { label: 'Create Shipment', route: '/shipments/new' },
      hints: ['Tip: Use barcode scanning for faster receiving'],
    },
    'warehouse': {
      icon: Package,
      title: 'No inventory items',
      description: 'Add inventory to get started',
      action: { label: 'Add Item', route: '/warehouse/add' },
    },
  },
  commands: [
    { id: 'scan-receive', label: 'Scan to Receive', module: 'warehouse', shortcut: 'R' },
    { id: 'check-temp', label: 'Check Temperature', module: 'coldchain' },
    { id: 'create-shipment', label: 'Create Shipment', module: 'warehouse', icon: Truck },
  ],
  filterPresets: {
    'warehouse': [
      { id: 'low-stock', name: 'Low Stock', filters: [{ field: 'qty', operator: 'lt', value: 10 }] },
      { id: 'expiring', name: 'Expiring Soon', filters: [{ field: 'expiryDays', operator: 'lt', value: 7 }] },
    ],
  },
  validationMessages: {
    'FEFO_VIOLATION': 'This item violates FEFO rules. Please select a different lot.',
    'TEMP_BREACH': 'Temperature reading is outside acceptable range.',
  },
  quickActions: {
    'shipment': [
      { id: 'track', label: 'Track', icon: Truck, route: '/track' },
    ],
  },
  exceptionTypes: [
    { code: 'TEMP_BREACH', label: 'Temperature Breach', severity: 'critical', module: 'coldchain' },
    { code: 'FEFO_VIOLATION', label: 'FEFO Violation', severity: 'critical', module: 'warehouse' },
    { code: 'EXPIRY_ALERT', label: 'Expiry Alert', severity: 'warning', module: 'warehouse' },
  ],
});

/**
 * Valid Corporate adapter for testing
 */
const createCorporateAdapter = (): IndustryAdapter => ({
  id: 'corporate',
  name: 'Corporate & Holding',
  modules: [
    { code: 'consolidation', name: 'Consolidation', icon: Building2, route: '/consolidation' },
  ],
  emptyStates: {
    'consolidation': {
      icon: Building2,
      title: 'No consolidation runs',
      description: 'Set up your group structure',
      action: { label: 'Configure', route: '/consolidation/setup' },
    },
  },
  commands: [
    { id: 'run-consolidation', label: 'Run Consolidation', module: 'consolidation' },
  ],
  filterPresets: {
    'consolidation': [
      { id: 'pending', name: 'Pending', filters: [{ field: 'status', operator: 'eq', value: 'pending' }] },
    ],
  },
  exceptionTypes: [
    { code: 'IC_MISMATCH', label: 'IC Mismatch', severity: 'critical', module: 'consolidation' },
  ],
});

// ============================================================
// RESET BEFORE EACH TEST
// ============================================================

describe('BioRegistry', () => {
  beforeEach(() => {
    // Reset registry state before each test
    BioRegistry.reset();
  });

  // ============================================================
  // REGISTRATION TESTS
  // ============================================================

  describe('Registration', () => {
    it('registers a valid adapter', () => {
      const adapter = createValidAdapter();

      expect(() => BioRegistry.register(adapter)).not.toThrow();
      expect(BioRegistry.isRegistered('supplychain')).toBe(true);
    });

    it('throws on invalid adapter', () => {
      const invalidAdapter = {
        id: 'invalid', // Not a valid cluster
        name: '',      // Empty name
        modules: [],   // No modules
      };

      expect(() => BioRegistry.register(invalidAdapter as IndustryAdapter)).toThrow();
    });

    it('allows registering multiple adapters', () => {
      BioRegistry.register(createValidAdapter('supplychain'));
      BioRegistry.register(createCorporateAdapter());

      expect(BioRegistry.getRegisteredAdapterIds()).toContain('supplychain');
      expect(BioRegistry.getRegisteredAdapterIds()).toContain('corporate');
    });

    it('overwrites adapter on re-registration', () => {
      const adapter1 = createValidAdapter();
      const adapter2 = { ...createValidAdapter(), name: 'Updated Name' };

      BioRegistry.register(adapter1);
      BioRegistry.register(adapter2);

      const active = BioRegistry.getAdapter('supplychain');
      expect(active?.name).toBe('Updated Name');
    });
  });

  // ============================================================
  // ACTIVATION TESTS
  // ============================================================

  describe('Activation', () => {
    it('activates a registered adapter', () => {
      BioRegistry.register(createValidAdapter());

      expect(() => BioRegistry.activate('supplychain')).not.toThrow();
      expect(BioRegistry.getActiveAdapterId()).toBe('supplychain');
    });

    it('throws on activating unregistered adapter', () => {
      expect(() => BioRegistry.activate('supplychain')).toThrow(/not found/);
    });

    it('switches active adapter', () => {
      BioRegistry.register(createValidAdapter('supplychain'));
      BioRegistry.register(createCorporateAdapter());

      BioRegistry.activate('supplychain');
      expect(BioRegistry.getActiveAdapterId()).toBe('supplychain');

      BioRegistry.activate('corporate');
      expect(BioRegistry.getActiveAdapterId()).toBe('corporate');
    });

    it('deactivates adapter', () => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
      BioRegistry.deactivate();

      expect(BioRegistry.getActiveAdapterId()).toBeNull();
      expect(BioRegistry.getActiveAdapter()).toBeNull();
    });
  });

  // ============================================================
  // EMPTY STATE ACCESS TESTS
  // ============================================================

  describe('Empty State Access', () => {
    beforeEach(() => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns empty state config for valid key', () => {
      const config = BioRegistry.getEmptyState('shipments');

      expect(config).toBeDefined();
      expect(config?.title).toBe('No shipments yet');
      expect(config?.hints).toHaveLength(1);
    });

    it('returns undefined for invalid key', () => {
      const config = BioRegistry.getEmptyState('nonexistent');
      expect(config).toBeUndefined();
    });

    it('returns undefined when no adapter is active', () => {
      BioRegistry.deactivate();
      const config = BioRegistry.getEmptyState('shipments');
      expect(config).toBeUndefined();
    });

    it('returns all empty state keys', () => {
      const keys = BioRegistry.getEmptyStateKeys();
      expect(keys).toContain('shipments');
      expect(keys).toContain('warehouse');
    });
  });

  // ============================================================
  // COMMAND ACCESS TESTS
  // ============================================================

  describe('Command Access', () => {
    beforeEach(() => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns all commands', () => {
      const commands = BioRegistry.getCommands();
      expect(commands).toHaveLength(3);
    });

    it('filters commands by module', () => {
      const warehouseCommands = BioRegistry.getCommands('warehouse');
      expect(warehouseCommands).toHaveLength(2);
      expect(warehouseCommands.every(c => c.module === 'warehouse')).toBe(true);
    });

    it('searches commands by label', () => {
      const results = BioRegistry.searchCommands('scan');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('scan-receive');
    });

    it('searches commands by module', () => {
      const results = BioRegistry.searchCommands('coldchain');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('check-temp');
    });

    it('returns empty array when no adapter is active', () => {
      BioRegistry.deactivate();
      const commands = BioRegistry.getCommands();
      expect(commands).toHaveLength(0);
    });
  });

  // ============================================================
  // FILTER PRESET ACCESS TESTS
  // ============================================================

  describe('Filter Preset Access', () => {
    beforeEach(() => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns filter presets for module', () => {
      const presets = BioRegistry.getFilterPresets('warehouse');
      expect(presets).toHaveLength(2);
    });

    it('returns empty array for unknown module', () => {
      const presets = BioRegistry.getFilterPresets('unknown');
      expect(presets).toHaveLength(0);
    });

    it('returns default preset', () => {
      // Add a default preset
      const adapter = createValidAdapter();
      adapter.filterPresets['warehouse'][0].isDefault = true;
      BioRegistry.reset();
      BioRegistry.register(adapter);
      BioRegistry.activate('supplychain');

      const defaultPreset = BioRegistry.getDefaultFilterPreset('warehouse');
      expect(defaultPreset).toBeDefined();
      expect(defaultPreset?.id).toBe('low-stock');
    });
  });

  // ============================================================
  // EXCEPTION TYPE ACCESS TESTS
  // ============================================================

  describe('Exception Type Access', () => {
    beforeEach(() => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns all exception types', () => {
      const types = BioRegistry.getExceptionTypes();
      expect(types).toHaveLength(3);
    });

    it('filters by module', () => {
      const coldchainTypes = BioRegistry.getExceptionTypes('coldchain');
      expect(coldchainTypes).toHaveLength(1);
      expect(coldchainTypes[0].code).toBe('TEMP_BREACH');
    });

    it('returns exception type by code', () => {
      const type = BioRegistry.getExceptionType('FEFO_VIOLATION');
      expect(type).toBeDefined();
      expect(type?.severity).toBe('critical');
    });
  });

  // ============================================================
  // VALIDATION MESSAGE ACCESS TESTS
  // ============================================================

  describe('Validation Message Access', () => {
    beforeEach(() => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns validation message for code', () => {
      const message = BioRegistry.getValidationMessage('FEFO_VIOLATION');
      expect(message).toContain('FEFO');
    });

    it('returns undefined for unknown code', () => {
      const message = BioRegistry.getValidationMessage('UNKNOWN');
      expect(message).toBeUndefined();
    });
  });

  // ============================================================
  // MODULE ACCESS TESTS
  // ============================================================

  describe('Module Access', () => {
    beforeEach(() => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
    });

    it('returns all modules', () => {
      const modules = BioRegistry.getModules();
      expect(modules).toHaveLength(2);
    });

    it('returns module by code', () => {
      const module = BioRegistry.getModule('warehouse');
      expect(module).toBeDefined();
      expect(module?.name).toBe('Warehouse');
    });
  });

  // ============================================================
  // EVENT HANDLING TESTS
  // ============================================================

  describe('Event Handling', () => {
    it('emits adapter:registered event', () => {
      const listener = vi.fn();
      BioRegistry.subscribe(listener);

      BioRegistry.register(createValidAdapter());

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'adapter:registered' })
      );
    });

    it('emits adapter:activated event', () => {
      const listener = vi.fn();
      BioRegistry.register(createValidAdapter());
      BioRegistry.subscribe(listener);

      BioRegistry.activate('supplychain');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'adapter:activated', adapterId: 'supplychain' })
      );
    });

    it('unsubscribes correctly', () => {
      const listener = vi.fn();
      const unsubscribe = BioRegistry.subscribe(listener);

      unsubscribe();
      BioRegistry.register(createValidAdapter());

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // UTILITY TESTS
  // ============================================================

  describe('Utilities', () => {
    it('returns correct stats', () => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');

      const stats = BioRegistry.getStats();
      expect(stats.registeredCount).toBe(1);
      expect(stats.activeAdapterId).toBe('supplychain');
    });

    it('resets correctly', () => {
      BioRegistry.register(createValidAdapter());
      BioRegistry.activate('supplychain');
      BioRegistry.reset();

      expect(BioRegistry.getRegisteredAdapterIds()).toHaveLength(0);
      expect(BioRegistry.getActiveAdapter()).toBeNull();
    });
  });
});

// ============================================================
// VALIDATION FUNCTION TESTS
// ============================================================

describe('Validation Functions', () => {
  describe('validateAdapter', () => {
    it('returns success for valid adapter', () => {
      const result = validateAdapter(createValidAdapter());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('returns errors for invalid adapter', () => {
      const result = validateAdapter({ id: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateAdapterOrThrow', () => {
    it('returns adapter for valid input', () => {
      const adapter = createValidAdapter();
      const result = validateAdapterOrThrow(adapter);
      expect(result.id).toBe('supplychain');
    });

    it('throws for invalid input', () => {
      expect(() => validateAdapterOrThrow({ id: 'invalid' })).toThrow();
    });
  });

  describe('formatValidationErrors', () => {
    it('formats errors correctly', () => {
      const result = validateAdapter({ id: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();

      if (result.errors) {
        const messages = formatValidationErrors(result.errors);
        expect(messages.length).toBeGreaterThan(0);
      }
    });
  });
});

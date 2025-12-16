/**
 * Bundle Size & Tree-Shaking Tests - Sprint E9
 *
 * Verify that imports work correctly and components are tree-shakeable.
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// Separate Import Tests (Tree-Shaking Verification)
// ============================================================

describe('Tree-Shaking - Separate Imports', () => {
  it('can import BioTable separately', async () => {
    const { BioTable } = await import('../src/organisms/BioTable');
    expect(BioTable).toBeDefined();
    expect(typeof BioTable).toBe('function');
  });

  it('can import BioForm separately', async () => {
    const { BioForm } = await import('../src/organisms/BioForm');
    expect(BioForm).toBeDefined();
    expect(typeof BioForm).toBe('function');
  });

  it('can import BioCalendar separately', async () => {
    const { BioCalendar } = await import('../src/organisms/BioCalendar');
    expect(BioCalendar).toBeDefined();
    expect(typeof BioCalendar).toBe('function');
  });

  it('can import BioGantt separately', async () => {
    const { BioGantt } = await import('../src/organisms/BioGantt');
    expect(BioGantt).toBeDefined();
    expect(typeof BioGantt).toBe('function');
  });

  it('can import BioChart separately', async () => {
    const { BioChart } = await import('../src/organisms/BioChart');
    expect(BioChart).toBeDefined();
    expect(typeof BioChart).toBe('function');
  });

  it('can import BioKanban separately', async () => {
    const { BioKanban } = await import('../src/organisms/BioKanban');
    expect(BioKanban).toBeDefined();
    expect(typeof BioKanban).toBe('function');
  });

  it('can import BioTree separately', async () => {
    const { BioTree } = await import('../src/organisms/BioTree');
    expect(BioTree).toBeDefined();
    expect(typeof BioTree).toBe('function');
  });

  it('can import BioTimeline separately', async () => {
    const { BioTimeline } = await import('../src/organisms/BioTimeline');
    expect(BioTimeline).toBeDefined();
    expect(typeof BioTimeline).toBe('function');
  });

  it('can import BioDropzone separately', async () => {
    const { BioDropzone } = await import('../src/organisms/BioDropzone');
    expect(BioDropzone).toBeDefined();
    expect(typeof BioDropzone).toBe('function');
  });

  it('can import BioObject separately', async () => {
    const { BioObject } = await import('../src/organisms/BioObject');
    expect(BioObject).toBeDefined();
    expect(typeof BioObject).toBe('function');
  });
});

describe('Tree-Shaking - Providers', () => {
  it('can import BioLocaleProvider separately', async () => {
    const { BioLocaleProvider, useLocale } = await import('../src/providers/BioLocaleProvider');
    expect(BioLocaleProvider).toBeDefined();
    expect(useLocale).toBeDefined();
  });

  it('can import BioPermissionProvider separately', async () => {
    const { BioPermissionProvider, usePermissions } = await import('../src/providers/BioPermissionProvider');
    expect(BioPermissionProvider).toBeDefined();
    expect(usePermissions).toBeDefined();
  });

  it('can import withFieldSecurity separately', async () => {
    const { withFieldSecurity, ActionGate, RoleGate } = await import('../src/providers/withFieldSecurity');
    expect(withFieldSecurity).toBeDefined();
    expect(ActionGate).toBeDefined();
    expect(RoleGate).toBeDefined();
  });
});

describe('Tree-Shaking - Molecules', () => {
  it('can import StatusBadge separately', async () => {
    const { StatusBadge } = await import('../src/molecules/StatusBadge');
    expect(StatusBadge).toBeDefined();
  });

  it('can import Spinner separately', async () => {
    const { Spinner } = await import('../src/molecules/Spinner');
    expect(Spinner).toBeDefined();
  });

  it('can import MotionEffect separately', async () => {
    const { MotionEffect } = await import('../src/molecules/MotionEffect');
    expect(MotionEffect).toBeDefined();
  });

  it('can import StatCard separately', async () => {
    const { StatCard } = await import('../src/molecules/StatCard');
    expect(StatCard).toBeDefined();
  });

  it('can import BioApprovalActions separately', async () => {
    const { BioApprovalActions } = await import('../src/molecules/BioApprovalActions');
    expect(BioApprovalActions).toBeDefined();
  });

  it('can import BioDiffViewer separately', async () => {
    const { BioDiffViewer, useDiff } = await import('../src/molecules/BioDiffViewer');
    expect(BioDiffViewer).toBeDefined();
    expect(useDiff).toBeDefined();
  });
});

describe('Tree-Shaking - Atoms', () => {
  it('can import Surface separately', async () => {
    const { Surface } = await import('../src/atoms/Surface');
    expect(Surface).toBeDefined();
  });

  it('can import Txt separately', async () => {
    const { Txt } = await import('../src/atoms/Txt');
    expect(Txt).toBeDefined();
  });

  it('can import Btn separately', async () => {
    const { Btn } = await import('../src/atoms/Btn');
    expect(Btn).toBeDefined();
  });

  it('can import Field separately', async () => {
    const { Field } = await import('../src/atoms/Field');
    expect(Field).toBeDefined();
  });

  it('can import Icon separately', async () => {
    const { Icon } = await import('../src/atoms/Icon');
    expect(Icon).toBeDefined();
  });
});

describe('Tree-Shaking - Hooks', () => {
  it('can import useKeyboardNavigation separately', async () => {
    const { useKeyboardNavigation } = await import('../src/hooks/useKeyboardNavigation');
    expect(useKeyboardNavigation).toBeDefined();
    expect(typeof useKeyboardNavigation).toBe('function');
  });

  it('can import useRovingTabIndex separately', async () => {
    const { useRovingTabIndex } = await import('../src/hooks/useKeyboardNavigation');
    expect(useRovingTabIndex).toBeDefined();
    expect(typeof useRovingTabIndex).toBe('function');
  });
});

describe('Tree-Shaking - Export Hooks', () => {
  it('can import useBioTableExport separately', async () => {
    const { useBioTableExport } = await import('../src/organisms/BioTable/useBioTableExport');
    expect(useBioTableExport).toBeDefined();
  });

  it('can import useBioChartExport separately', async () => {
    const { useBioChartExport } = await import('../src/organisms/BioChart/useBioChartExport');
    expect(useBioChartExport).toBeDefined();
  });

  it('can import useBioGanttExport separately', async () => {
    const { useBioGanttExport } = await import('../src/organisms/BioGantt/useBioGanttExport');
    expect(useBioGanttExport).toBeDefined();
  });

  it('can import useBioCalendarExport separately', async () => {
    const { useBioCalendarExport } = await import('../src/organisms/BioCalendar/useBioCalendarExport');
    expect(useBioCalendarExport).toBeDefined();
  });
});

// ============================================================
// Main Index Export Tests
// ============================================================

describe('Main Index Exports', () => {
  it('exports all atoms from main index', async () => {
    const bioskin = await import('../src/index');

    expect(bioskin.Surface).toBeDefined();
    expect(bioskin.Txt).toBeDefined();
    expect(bioskin.Btn).toBeDefined();
    expect(bioskin.Field).toBeDefined();
    expect(bioskin.Icon).toBeDefined();
  });

  it('exports all molecules from main index', async () => {
    const bioskin = await import('../src/index');

    expect(bioskin.StatusBadge).toBeDefined();
    expect(bioskin.Spinner).toBeDefined();
    expect(bioskin.MotionEffect).toBeDefined();
    expect(bioskin.StatCard).toBeDefined();
    expect(bioskin.EmptyState).toBeDefined();
    expect(bioskin.LoadingState).toBeDefined();
    expect(bioskin.ErrorState).toBeDefined();
    expect(bioskin.BioApprovalActions).toBeDefined();
    expect(bioskin.BioDiffViewer).toBeDefined();
  });

  it('exports all organisms from main index', async () => {
    const bioskin = await import('../src/index');

    expect(bioskin.BioTable).toBeDefined();
    expect(bioskin.BioForm).toBeDefined();
    expect(bioskin.BioObject).toBeDefined();
    expect(bioskin.BioKanban).toBeDefined();
    expect(bioskin.BioTree).toBeDefined();
    expect(bioskin.BioTimeline).toBeDefined();
    expect(bioskin.BioDropzone).toBeDefined();
    expect(bioskin.BioCalendar).toBeDefined();
    expect(bioskin.BioGantt).toBeDefined();
    expect(bioskin.BioChart).toBeDefined();
  });

  it('exports all providers from main index', async () => {
    const bioskin = await import('../src/index');

    expect(bioskin.BioLocaleProvider).toBeDefined();
    expect(bioskin.useLocale).toBeDefined();
    expect(bioskin.BioPermissionProvider).toBeDefined();
    expect(bioskin.usePermissions).toBeDefined();
    expect(bioskin.useAudit).toBeDefined();
    expect(bioskin.withFieldSecurity).toBeDefined();
    expect(bioskin.ActionGate).toBeDefined();
    expect(bioskin.RoleGate).toBeDefined();
    expect(bioskin.StateGate).toBeDefined();
  });
});

// ============================================================
// Bundle Size Budget Tests
// ============================================================

describe('Bundle Size Budget', () => {
  // These tests verify components can be imported without errors
  // Actual size checking requires build tooling

  it('all organism imports resolve without circular dependencies', async () => {
    // If there are circular deps, these imports will hang or error
    const imports = await Promise.all([
      import('../src/organisms/BioTable'),
      import('../src/organisms/BioForm'),
      import('../src/organisms/BioCalendar'),
      import('../src/organisms/BioGantt'),
      import('../src/organisms/BioChart'),
      import('../src/organisms/BioKanban'),
      import('../src/organisms/BioTree'),
      import('../src/organisms/BioTimeline'),
      import('../src/organisms/BioDropzone'),
      import('../src/organisms/BioObject'),
    ]);

    expect(imports).toHaveLength(10);
    imports.forEach((mod) => {
      expect(mod).toBeDefined();
    });
  });

  it('provider imports are independent', async () => {
    const [locale, permission, fieldSecurity] = await Promise.all([
      import('../src/providers/BioLocaleProvider'),
      import('../src/providers/BioPermissionProvider'),
      import('../src/providers/withFieldSecurity'),
    ]);

    expect(locale.BioLocaleProvider).toBeDefined();
    expect(permission.BioPermissionProvider).toBeDefined();
    expect(fieldSecurity.withFieldSecurity).toBeDefined();
  });

  it('utility imports are lightweight', async () => {
    const utils = await import('../src/atoms/utils');

    expect(utils.cn).toBeDefined();
    expect(typeof utils.cn).toBe('function');
  });
});

// ============================================================
// Type Export Tests
// ============================================================

describe('Type Exports', () => {
  it('BioTable exports types', async () => {
    // TypeScript would catch if these don't exist
    const mod = await import('../src/organisms/BioTable');

    // These should be re-exported
    expect(mod.COMPONENT_META).toBeDefined();
  });

  it('BioForm exports types', async () => {
    const mod = await import('../src/organisms/BioForm');
    expect(mod.COMPONENT_META).toBeDefined();
  });

  it('providers export types', async () => {
    const localeProvider = await import('../src/providers/BioLocaleProvider');
    expect(localeProvider.COMPONENT_META).toBeDefined();

    const permissionProvider = await import('../src/providers/BioPermissionProvider');
    expect(permissionProvider.PERMISSION_COMPONENT_META).toBeDefined();
  });
});

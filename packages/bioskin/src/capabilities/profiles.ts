/**
 * @fileoverview Capability Profiles for Industry Adapters
 *
 * Defines default capability settings per adapter cluster.
 * Per CONT_13: BioCapabilities Feature Flag System
 *
 * @module @aibos/bioskin/capabilities
 * @version 1.0.0
 */

import type { CapabilityTree, PartialCapabilityTree } from './types';
import type { AdapterCluster } from '../registry/types';

// ============================================================
// DEFAULT CAPABILITY TREE
// ============================================================

/**
 * Default capability tree with all features enabled
 * Used as baseline when no adapter is active
 */
export const DefaultCapabilities: CapabilityTree = {
  table: {
    inlineEdit: true,
    bulkEdit: true,
    bulkDelete: true,
    csvImport: true,
    csvExport: true,
    excelExport: true,
    virtualization: true,
    columnPinning: true,
    columnReorder: true,
    rowSelection: true,
    keyboardNavigation: true,
  },
  form: {
    templates: true,
    cloning: true,
    smartDefaults: true,
    autoRepair: true,
    draftSave: true,
    offlineMode: true,
  },
  timeline: {
    comments: true,
    attachments: true,
    diffs: true,
    export: true,
    filtering: true,
  },
  navigation: {
    tabs: true,
    splitView: true,
    breadcrumbs: true,
    recentHistory: true,
    bookmarks: true,
  },
  actions: {
    create: true,
    update: true,
    delete: true,
    approve: true,
    reject: true,
    void: true,
    clone: true,
    archive: true,
  },
  audit: {
    viewHistory: true,
    exportHistory: true,
    compareVersions: true,
    rollback: false, // Default disabled for safety
  },
  sharing: {
    shareLink: true,
    shareFilters: true,
    exportPdf: true,
    print: true,
  },
};

// ============================================================
// INDUSTRY CAPABILITY PROFILES
// ============================================================

/**
 * Default capability profiles per adapter cluster
 */
export const CapabilityProfiles: Record<AdapterCluster, PartialCapabilityTree> = {
  // ============================================================
  // CORPORATE - Finance/Holding/Trading
  // Full capabilities with SOX compliance
  // ============================================================
  corporate: {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: true,
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: true,
      columnReorder: true,
      rowSelection: true,
      keyboardNavigation: true,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: true,
      draftSave: true,
      offlineMode: false, // Disabled for audit integrity
    },
    timeline: {
      comments: false, // Formal audit only
      attachments: true,
      diffs: true,
      export: true,
      filtering: true,
    },
    navigation: {
      tabs: true,
      splitView: true,
      breadcrumbs: true,
      recentHistory: true,
      bookmarks: true,
    },
    actions: {
      create: true,
      update: true,
      delete: true,
      approve: true,
      reject: true,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: true,
      rollback: false, // SOX compliance
    },
    sharing: {
      shareLink: true,
      shareFilters: true,
      exportPdf: true,
      print: true,
    },
  },

  // ============================================================
  // SUPPLY CHAIN - Cold Chain/Warehouse/Logistics
  // Scan-first, exception-driven
  // ============================================================
  supplychain: {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: false, // Use void instead
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: false,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: false, // Scan-first
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: false, // Manual verification required
      draftSave: false,
      offlineMode: true, // Warehouse connectivity issues
    },
    timeline: {
      comments: true,
      attachments: true,
      diffs: true,
      export: true,
      filtering: true,
    },
    navigation: {
      tabs: false, // Simplified UI
      splitView: false,
      breadcrumbs: true,
      recentHistory: true,
      bookmarks: false,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: false, // Automated workflows
      reject: false,
      void: true,
      clone: false,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: true,
      rollback: false,
    },
    sharing: {
      shareLink: false,
      shareFilters: false,
      exportPdf: true,
      print: true,
    },
  },

  // ============================================================
  // PRODUCTION - Manufacturing/Central Kitchen
  // QA-controlled, FDA compliance
  // ============================================================
  production: {
    table: {
      inlineEdit: true,
      bulkEdit: false, // QA controlled
      bulkDelete: false,
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: true,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: true,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: false, // FDA compliance
      draftSave: true,
      offlineMode: true,
    },
    timeline: {
      comments: true,
      attachments: true,
      diffs: true,
      export: false, // Controlled document export
      filtering: true,
    },
    navigation: {
      tabs: true,
      splitView: true,
      breadcrumbs: true,
      recentHistory: true,
      bookmarks: true,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: true,
      reject: true,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: false, // FDA controlled
      compareVersions: true,
      rollback: false,
    },
    sharing: {
      shareLink: false,
      shareFilters: true,
      exportPdf: false, // Controlled
      print: true,
    },
  },

  // ============================================================
  // AGRIOPS - Plantation/Vertical Farming/Greenhouse
  // Field-friendly, offline-capable
  // ============================================================
  agriops: {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: false,
      csvImport: true,
      csvExport: true,
      excelExport: false,
      virtualization: true,
      columnPinning: false,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: false,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: true,
      draftSave: true,
      offlineMode: true, // Field connectivity
    },
    timeline: {
      comments: true,
      attachments: true,
      diffs: false,
      export: true,
      filtering: false,
    },
    navigation: {
      tabs: false,
      splitView: false,
      breadcrumbs: true,
      recentHistory: true,
      bookmarks: false,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: false,
      reject: false,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: false,
      rollback: false,
    },
    sharing: {
      shareLink: false,
      shareFilters: false,
      exportPdf: true,
      print: true,
    },
  },

  // ============================================================
  // OUTLET - F&B/Franchise/Retail/E-commerce
  // POS-focused, resilient
  // ============================================================
  outlet: {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: false,
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: false,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: true,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: true,
      draftSave: false,
      offlineMode: true, // POS resilience
    },
    timeline: {
      comments: false,
      attachments: false,
      diffs: true,
      export: true,
      filtering: true,
    },
    navigation: {
      tabs: true,
      splitView: false,
      breadcrumbs: true,
      recentHistory: true,
      bookmarks: true,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: false,
      reject: false,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: true,
      rollback: false,
    },
    sharing: {
      shareLink: true,
      shareFilters: true,
      exportPdf: true,
      print: true,
    },
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get the capability profile for an adapter
 *
 * @param adapterId - The adapter cluster ID
 * @returns The capability profile
 */
export function getCapabilityProfile(adapterId: AdapterCluster): PartialCapabilityTree {
  return CapabilityProfiles[adapterId] ?? {};
}

/**
 * Get a specific capability value from a profile
 *
 * @param adapterId - The adapter cluster ID
 * @param category - The capability category
 * @param feature - The feature within the category
 * @returns The capability value or undefined
 */
export function getProfileCapability<K extends keyof CapabilityTree>(
  adapterId: AdapterCluster,
  category: K,
  feature: keyof CapabilityTree[K]
): boolean | undefined {
  const profile = CapabilityProfiles[adapterId];
  const categoryProfile = profile?.[category] as Partial<CapabilityTree[K]> | undefined;
  return categoryProfile?.[feature] as boolean | undefined;
}

/**
 * Merge profiles (later profiles override earlier)
 *
 * @param profiles - Profiles to merge
 * @returns Merged profile
 */
export function mergeProfiles(
  ...profiles: PartialCapabilityTree[]
): PartialCapabilityTree {
  const result: PartialCapabilityTree = {};

  for (const profile of profiles) {
    for (const [category, features] of Object.entries(profile)) {
      const categoryKey = category as keyof CapabilityTree;
      result[categoryKey] = {
        ...(result[categoryKey] ?? {}),
        ...(features as object),
      } as CapabilityTree[typeof categoryKey];
    }
  }

  return result;
}

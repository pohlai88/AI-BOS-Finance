// ============================================================================
// METADATA COMPONENTS - Barrel Export
// ============================================================================

// === TABLE OPTIONS ===
// SuperTable:     TanStack-powered, full feature set, recommended for most cases
// SuperTableLite: Modular assembly, simpler internals, good for learning/customization
export { SuperTable } from './SuperTable';
export { SuperTableLite } from './SuperTableLite';

// === MODULAR COMPONENTS (for custom table builds) ===
// Use these when you need granular control outside of SuperTable/Lite
export { SuperTableHeader } from './SuperTableHeader';
export { SuperTableBody } from './SuperTableBody';
export { SuperTablePagination } from './SuperTablePagination';

// Column Visibility Options:
// - ColumnVisibilityMenu: Modifies column.visible property directly
// - ColumnVisibilitySelector: Uses Set<string> for visibility (parent controls state)
export { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
export { ColumnVisibilitySelector } from './ColumnVisibilitySelector';

// Filter & Detail Components
export { FlexibleFilterBar } from './FlexibleFilterBar';
export { DetailDrawer } from './DetailDrawer';
export { CanonDetailPanel } from './CanonDetailPanel';
export { FieldContextSidebar } from './FieldContextSidebar';
export { MetadataFieldSidebar } from './MetadataFieldSidebar';

// Governance Forms
export { MetadataRequestForm } from './MetadataRequestForm';

// Types
export type { ColumnDef } from './SuperTableHeader';


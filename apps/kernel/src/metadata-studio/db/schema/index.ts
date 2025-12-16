// metadata-studio/db/schema/index.ts
// =============================================================================
// CONT_06 Core Tables (Metadata Registry)
// =============================================================================

// Core registry tables
export * from './standard-pack.tables';
export * from './metadata.tables';
export * from './alias.tables';
export * from './entity-catalog.tables';
export * from './metadata-mapping.tables';
export * from './remediation.tables';

// Extended features (derived from .tempo)
export * from './lineage.tables';
export * from './kpi.tables';

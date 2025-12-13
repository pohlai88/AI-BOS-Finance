// ============================================================================
// METADATA MODULE - Main Export
// ============================================================================
// The Knowledge Graph - Metadata management and visualization
// ============================================================================

export * from './components'

// Kernel (Schema Column Generator)
export * from './kernel'

// Views (Organ Transplant Migration)
export { default as MetadataGodView } from './views/META_02_MetadataGodView'
export { default as MetadataArchitecturePage } from './views/META_01_MetadataArchitecturePage'
export { default as ThePrismPage } from './views/META_03_ThePrismPage'
export { default as MetaRiskRadarPage } from './views/META_04_MetaRiskRadarPage'
export { default as MetaCanonMatrixPage } from './views/META_05_MetaCanonMatrixPage'
export { default as MetaHealthScanPage } from './views/META_06_MetaHealthScanPage'
export { default as MetaLynxCodexPage } from './views/META_07_MetaLynxCodexPage'
export { default as ImplementationPlaybookPage } from './views/META_08_ImplementationPlaybookPage'

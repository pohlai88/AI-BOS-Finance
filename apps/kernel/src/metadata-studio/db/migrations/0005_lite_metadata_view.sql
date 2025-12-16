-- Migration: 0005_lite_metadata_view
-- Purpose: Create developer-friendly view for liteMetadata DX
-- Author: System
-- Date: 2025-12-16
-- =============================================================================

-- =============================================================================
-- vw_mdm_lite_metadata
-- =============================================================================
-- A simplified, developer-friendly view that presents metadata in a flat format
-- similar to the historical "liteMetadata" pattern. This view:
-- 
-- 1. Joins entity_catalog with global_metadata for complete context
-- 2. Extracts field_name from canonical_key for easier access
-- 3. Provides computed full_urn for lineage tools
-- 4. Hides internal columns (audit, draft status)
--
-- Use Case: 
--   - UI generators
--   - Developer tools
--   - AI Orchestras (Tier 0-1 read access)
--   - Quick lookups without understanding full schema
-- =============================================================================

CREATE OR REPLACE VIEW vw_mdm_lite_metadata AS
SELECT
  -- Identity
  g.id                                          AS field_id,
  g.tenant_id,
  
  -- Entity context
  e.entity_urn,
  e.entity_name,
  e.entity_type,
  
  -- Field identity
  g.canonical_key,
  -- Extract field_name from canonical_key (last segment after dot)
  CASE 
    WHEN g.canonical_key LIKE '%.%' 
    THEN SUBSTRING(g.canonical_key FROM '[^.]+$')
    ELSE g.canonical_key
  END                                           AS field_name,
  
  -- Human-readable
  g.label,
  g.description,
  
  -- Classification
  g.domain,
  g.module,
  g.tier,
  g.standard_pack_id,
  
  -- Technical
  g.data_type,
  g.format,
  
  -- Governance
  g.status,
  g.owner_id,
  g.steward_id,
  
  -- Standard pack details (denormalized for convenience)
  sp.pack_name                                  AS standard_pack_name,
  sp.standard_body,
  sp.category                                   AS standard_category,
  
  -- Entity details (denormalized for convenience)
  e.criticality                                 AS entity_criticality,
  e.system                                      AS source_system

FROM mdm_global_metadata g
LEFT JOIN mdm_entity_catalog e 
  ON e.tenant_id = g.tenant_id 
 AND e.entity_urn = g.entity_urn
LEFT JOIN mdm_standard_pack sp 
  ON sp.pack_id = g.standard_pack_id
WHERE g.status = 'active'
  AND (g.is_draft = false OR g.is_draft IS NULL);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON VIEW vw_mdm_lite_metadata IS 
  'Developer-friendly metadata view for quick lookups. Joins entities, fields, and standard packs. Excludes drafts and deprecated fields.';

COMMENT ON COLUMN vw_mdm_lite_metadata.field_name IS 
  'Extracted short field name from canonical_key (last segment)';

COMMENT ON COLUMN vw_mdm_lite_metadata.canonical_key IS 
  'Full canonical key in format entity_urn.field_name';

-- =============================================================================
-- vw_mdm_lite_entities
-- =============================================================================
-- Simplified entity view for quick entity lookups

CREATE OR REPLACE VIEW vw_mdm_lite_entities AS
SELECT
  e.id                                          AS entity_id,
  e.tenant_id,
  e.entity_urn,
  e.entity_name,
  e.entity_type,
  e.domain,
  e.module,
  e.system                                      AS source_system,
  e.criticality,
  e.description,
  e.lifecycle_status                            AS status,
  -- Field count (denormalized for quick stats)
  (SELECT COUNT(*) 
   FROM mdm_global_metadata g 
   WHERE g.tenant_id = e.tenant_id 
     AND g.entity_urn = e.entity_urn
     AND g.status = 'active')                   AS field_count,
  -- Tier distribution (for governance dashboards)
  (SELECT COUNT(*) 
   FROM mdm_global_metadata g 
   WHERE g.tenant_id = e.tenant_id 
     AND g.entity_urn = e.entity_urn
     AND g.tier IN ('tier1', 'tier2'))          AS governed_field_count

FROM mdm_entity_catalog e
WHERE e.lifecycle_status = 'active';

COMMENT ON VIEW vw_mdm_lite_entities IS 
  'Simplified entity view with field counts. Excludes deprecated entities.';

-- =============================================================================
-- vw_mdm_governance_dashboard
-- =============================================================================
-- Aggregated view for governance dashboards and telemetry

CREATE OR REPLACE VIEW vw_mdm_governance_dashboard AS
SELECT
  g.tenant_id,
  g.domain,
  g.tier,
  COUNT(*)                                      AS total_fields,
  COUNT(*) FILTER (WHERE g.standard_pack_id IS NOT NULL) AS anchored_fields,
  COUNT(*) FILTER (WHERE g.standard_pack_id IS NULL 
                     AND g.tier IN ('tier1', 'tier2')) AS unanchored_high_tier,
  COUNT(*) FILTER (WHERE g.is_draft = true)     AS draft_fields,
  COUNT(*) FILTER (WHERE g.status = 'deprecated') AS deprecated_fields

FROM mdm_global_metadata g
GROUP BY g.tenant_id, g.domain, g.tier;

COMMENT ON VIEW vw_mdm_governance_dashboard IS 
  'Aggregated governance metrics by domain and tier. Use for dashboards and alerts.';

-- =============================================================================
-- Index Recommendations (if not already exists)
-- =============================================================================

-- These indexes support the view joins. Check if they exist before creating:
-- CREATE INDEX IF NOT EXISTS idx_mdm_global_metadata_status 
--   ON mdm_global_metadata(tenant_id, status, is_draft);

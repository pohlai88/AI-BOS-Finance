-- ============================================================================
-- LIVELY LAYER: Canvas Tables for AP Manager
-- Migration: 200_create_canvas_tables.sql
-- 
-- Creates tables for the FigJam-style collaborative canvas:
-- - canvas_zones: Workflow areas (Inbox, In Progress, Review, Done)
-- - canvas_objects: Hydrated stickies and annotations
-- - canvas_connectors: Lines between objects
-- - canvas_reactions: Team emoji reactions
-- - canvas_acknowledgments: Pre-flight acknowledgments
-- - canvas_audit_log: Immutable action history
-- ============================================================================

-- ============================================================================
-- CANVAS ZONES (Workflow Areas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.canvas_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Zone Definition
  name VARCHAR(100) NOT NULL,
  zone_type VARCHAR(30) NOT NULL CHECK (zone_type IN (
    'inbox', 'in_progress', 'review', 'done', 'blocked', 'custom'
  )),
  
  -- Position & Bounds
  position_x NUMERIC(10, 2) NOT NULL DEFAULT 0,
  position_y NUMERIC(10, 2) NOT NULL DEFAULT 0,
  width NUMERIC(10, 2) NOT NULL DEFAULT 300,
  height NUMERIC(10, 2) NOT NULL DEFAULT 800,
  
  -- Style
  background_color VARCHAR(7) DEFAULT '#F3F4F6',
  border_color VARCHAR(7) DEFAULT '#D1D5DB',
  
  -- Trigger Configuration
  trigger_action VARCHAR(30) DEFAULT 'none' CHECK (trigger_action IN (
    'none', 'status_update', 'notify', 'archive', 'escalate'
  )),
  trigger_config JSONB DEFAULT '{}',
  
  -- RBAC: Who can move objects to this zone
  allowed_roles TEXT[] DEFAULT '{}',
  
  -- Ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Optimistic Locking
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default zones for each tenant will be created via application logic

-- ============================================================================
-- CANVAS OBJECTS (Hydrated Stickies & Annotations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.canvas_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Type & Classification
  object_type VARCHAR(30) NOT NULL CHECK (object_type IN (
    'hydrated_sticky', 'plain_sticky', 'annotation'
  )),
  layer_type VARCHAR(20) NOT NULL CHECK (layer_type IN ('data', 'team', 'personal')),
  
  -- Ownership (required for personal layer)
  owner_id UUID,
  CONSTRAINT personal_layer_needs_owner CHECK (
    layer_type != 'personal' OR owner_id IS NOT NULL
  ),
  
  -- Source Binding (Magic Link to AP entities)
  source_ref VARCHAR(200),  -- urn:aibos:ap:02:invoice:uuid
  source_status VARCHAR(20) DEFAULT 'active' CHECK (source_status IN (
    'active', 'archived', 'deleted', 'orphaned'
  )),
  source_last_sync TIMESTAMPTZ,
  
  -- Position & Size
  position_x NUMERIC(10, 2) NOT NULL DEFAULT 0,
  position_y NUMERIC(10, 2) NOT NULL DEFAULT 0,
  width NUMERIC(10, 2) NOT NULL DEFAULT 280,
  height NUMERIC(10, 2) NOT NULL DEFAULT 180,
  z_index INTEGER NOT NULL DEFAULT 100,
  
  -- Display Data (denormalized from source for performance)
  display_data JSONB NOT NULL DEFAULT '{}',
  
  -- Style
  style JSONB NOT NULL DEFAULT '{"backgroundColor": "#FEF3C7"}',
  
  -- Tags for filtering/search
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Zone placement
  zone_id UUID REFERENCES finance.canvas_zones(id) ON DELETE SET NULL,
  
  -- Pre-Flight Priority
  priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Optimistic Locking
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps & Actors
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  
  -- Soft Delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- ============================================================================
-- CANVAS CONNECTORS (Lines between objects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.canvas_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  from_object_id UUID NOT NULL REFERENCES finance.canvas_objects(id) ON DELETE CASCADE,
  to_object_id UUID NOT NULL REFERENCES finance.canvas_objects(id) ON DELETE CASCADE,
  
  connector_style VARCHAR(20) DEFAULT 'arrow' CHECK (connector_style IN (
    'arrow', 'line', 'dashed', 'double'
  )),
  label VARCHAR(200),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- ============================================================================
-- CANVAS REACTIONS (Team-visible emojis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.canvas_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES finance.canvas_objects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  emoji VARCHAR(10) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(object_id, user_id, emoji)
);

-- ============================================================================
-- CANVAS ACKNOWLEDGMENTS (Pre-flight tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.canvas_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES finance.canvas_objects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comment TEXT,
  
  -- Link to kernel audit system
  audit_event_id UUID,
  
  UNIQUE(object_id, user_id)
);

-- ============================================================================
-- CANVAS AUDIT LOG (Immutable action history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance.canvas_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- What happened
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'object_created', 'object_moved', 'object_updated', 'object_deleted',
    'zone_enter', 'zone_exit', 'zone_trigger_fired',
    'reaction_added', 'reaction_removed',
    'acknowledged', 'tag_added', 'tag_removed',
    'source_status_changed'
  )),
  
  -- Who did it
  actor_id UUID NOT NULL,
  actor_name VARCHAR(200),
  
  -- What was affected
  object_id UUID,
  object_source_ref VARCHAR(200),
  zone_id UUID,
  
  -- Before/After state for audit trail
  before_state JSONB,
  after_state JSONB,
  
  -- Context
  reason TEXT,
  correlation_id UUID,  -- Link to business transaction
  
  -- Timestamp (immutable - no updated_at)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Canvas Zones
CREATE INDEX IF NOT EXISTS idx_canvas_zones_tenant 
  ON finance.canvas_zones(tenant_id);

-- Canvas Objects: Layer queries
CREATE INDEX IF NOT EXISTS idx_canvas_objects_layer 
  ON finance.canvas_objects(tenant_id, layer_type) 
  WHERE deleted_at IS NULL;

-- Canvas Objects: Personal layer lookup
CREATE INDEX IF NOT EXISTS idx_canvas_objects_personal 
  ON finance.canvas_objects(tenant_id, owner_id) 
  WHERE layer_type = 'personal' AND deleted_at IS NULL;

-- Canvas Objects: Source binding lookup (for sync)
CREATE INDEX IF NOT EXISTS idx_canvas_objects_source 
  ON finance.canvas_objects(source_ref) 
  WHERE source_ref IS NOT NULL AND deleted_at IS NULL;

-- Canvas Objects: Pre-flight queries (urgent unacknowledged)
CREATE INDEX IF NOT EXISTS idx_canvas_objects_preflight 
  ON finance.canvas_objects(tenant_id, requires_acknowledgment, priority_score DESC)
  WHERE layer_type = 'team' 
    AND requires_acknowledgment = TRUE 
    AND deleted_at IS NULL;

-- Canvas Objects: Tag-based search (GIN for array containment)
CREATE INDEX IF NOT EXISTS idx_canvas_objects_tags 
  ON finance.canvas_objects USING GIN(tags);

-- Canvas Objects: Zone membership
CREATE INDEX IF NOT EXISTS idx_canvas_objects_zone
  ON finance.canvas_objects(zone_id)
  WHERE zone_id IS NOT NULL AND deleted_at IS NULL;

-- Canvas Reactions: Object lookup
CREATE INDEX IF NOT EXISTS idx_canvas_reactions_object 
  ON finance.canvas_reactions(object_id);

-- Canvas Acknowledgments: Object lookup
CREATE INDEX IF NOT EXISTS idx_canvas_acknowledgments_object
  ON finance.canvas_acknowledgments(object_id);

-- Canvas Acknowledgments: User's acknowledgments
CREATE INDEX IF NOT EXISTS idx_canvas_acknowledgments_user
  ON finance.canvas_acknowledgments(user_id, acknowledged_at DESC);

-- Canvas Audit Log: Object history
CREATE INDEX IF NOT EXISTS idx_canvas_audit_object 
  ON finance.canvas_audit_log(object_id, created_at DESC);

-- Canvas Audit Log: Source ref history (for AP entity tracing)
CREATE INDEX IF NOT EXISTS idx_canvas_audit_source 
  ON finance.canvas_audit_log(object_source_ref, created_at DESC)
  WHERE object_source_ref IS NOT NULL;

-- Canvas Audit Log: Tenant timeline
CREATE INDEX IF NOT EXISTS idx_canvas_audit_tenant_time 
  ON finance.canvas_audit_log(tenant_id, created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE finance.canvas_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.canvas_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.canvas_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.canvas_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.canvas_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.canvas_audit_log ENABLE ROW LEVEL SECURITY;

-- Tenant isolation for all tables
CREATE POLICY canvas_zones_tenant_isolation ON finance.canvas_zones
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY canvas_objects_tenant_isolation ON finance.canvas_objects
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY canvas_connectors_tenant_isolation ON finance.canvas_connectors
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY canvas_reactions_tenant_isolation ON finance.canvas_reactions
  USING (EXISTS (
    SELECT 1 FROM finance.canvas_objects o 
    WHERE o.id = object_id 
    AND o.tenant_id = current_setting('app.tenant_id', true)::UUID
  ));

CREATE POLICY canvas_acknowledgments_tenant_isolation ON finance.canvas_acknowledgments
  USING (EXISTS (
    SELECT 1 FROM finance.canvas_objects o 
    WHERE o.id = object_id 
    AND o.tenant_id = current_setting('app.tenant_id', true)::UUID
  ));

CREATE POLICY canvas_audit_tenant_isolation ON finance.canvas_audit_log
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Personal layer privacy: Only owner can see personal objects
CREATE POLICY canvas_objects_personal_privacy ON finance.canvas_objects
  FOR SELECT
  USING (
    layer_type != 'personal' 
    OR owner_id = current_setting('app.user_id', true)::UUID
  );

-- Data layer is system-controlled (no direct user mutations)
-- This is enforced at application level via API

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE finance.canvas_zones IS 'Workflow zones for drag-drop status triggers (Inbox, In Progress, Review, Done)';
COMMENT ON TABLE finance.canvas_objects IS 'Canvas objects including hydrated stickies bound to AP entities';
COMMENT ON TABLE finance.canvas_connectors IS 'Visual connectors/arrows between canvas objects';
COMMENT ON TABLE finance.canvas_reactions IS 'Team-visible emoji reactions on canvas objects';
COMMENT ON TABLE finance.canvas_acknowledgments IS 'Pre-flight acknowledgments for urgent items';
COMMENT ON TABLE finance.canvas_audit_log IS 'Immutable audit trail for all canvas actions';

COMMENT ON COLUMN finance.canvas_objects.source_ref IS 'URN binding to AP entity (e.g., urn:aibos:ap:02:invoice:uuid)';
COMMENT ON COLUMN finance.canvas_objects.priority_score IS 'Pre-flight priority: 80+ hard stop, 50+ soft stop, 20+ informational';
COMMENT ON COLUMN finance.canvas_zones.trigger_action IS 'Action to execute when object dropped into zone';

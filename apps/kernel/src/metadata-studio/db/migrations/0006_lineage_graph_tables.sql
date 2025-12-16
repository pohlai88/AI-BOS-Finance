-- Migration: 0006_lineage_graph_tables
-- Description: Replace old mdm_lineage_field with graph-based lineage (mdm_lineage_node + mdm_lineage_edge)
-- Created: 2025-12-16

-- Drop old lineage table (if exists)
DROP TABLE IF EXISTS "mdm_lineage_field" CASCADE;

-- Create new lineage node table
CREATE TABLE IF NOT EXISTS "mdm_lineage_node" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"urn" varchar(512) NOT NULL,
	"node_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"entity_type" varchar(100),
	"label" varchar(255),
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create new lineage edge table
CREATE TABLE IF NOT EXISTS "mdm_lineage_edge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_urn" varchar(512) NOT NULL,
	"target_urn" varchar(512) NOT NULL,
	"edge_type" varchar(50) NOT NULL,
	"transformation" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes for lineage nodes
CREATE INDEX IF NOT EXISTS "idx_lineage_node_tenant" ON "mdm_lineage_node" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lineage_node_urn" ON "mdm_lineage_node" USING btree ("urn");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lineage_node_type" ON "mdm_lineage_node" USING btree ("node_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lineage_node_entity" ON "mdm_lineage_node" USING btree ("entity_id", "entity_type");
--> statement-breakpoint

-- Create indexes for lineage edges
CREATE INDEX IF NOT EXISTS "idx_lineage_edge_tenant" ON "mdm_lineage_edge" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lineage_edge_source" ON "mdm_lineage_edge" USING btree ("source_urn");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lineage_edge_target" ON "mdm_lineage_edge" USING btree ("target_urn");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lineage_edge_type" ON "mdm_lineage_edge" USING btree ("edge_type");
--> statement-breakpoint

-- Add comments
COMMENT ON TABLE "mdm_lineage_node" IS 'Lineage graph nodes representing metadata assets (fields, entities, KPIs, reports, etc.)';
COMMENT ON TABLE "mdm_lineage_edge" IS 'Lineage graph edges representing relationships between nodes (produces, consumes, derived_from, transforms, references)';

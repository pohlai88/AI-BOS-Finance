-- Migration: 0007_composite_kpi_table
-- Description: Create mdm_composite_kpi table for numerator/denominator KPI definitions
-- Created: 2025-12-16

-- Create composite KPI table
CREATE TABLE IF NOT EXISTS "mdm_composite_kpi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"canonical_key" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"numerator" jsonb NOT NULL,
	"denominator" jsonb NOT NULL,
	"governance_tier" varchar(20) DEFAULT 'tier3' NOT NULL,
	"standard_pack_id" uuid,
	"owner_id" uuid,
	"steward_id" uuid,
	"entity_urn" varchar(512),
	"domain" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deprecated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes for composite KPI
CREATE INDEX IF NOT EXISTS "idx_composite_kpi_tenant" ON "mdm_composite_kpi" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_composite_kpi_canonical" ON "mdm_composite_kpi" USING btree ("canonical_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_composite_kpi_domain" ON "mdm_composite_kpi" USING btree ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_composite_kpi_tier" ON "mdm_composite_kpi" USING btree ("governance_tier");
--> statement-breakpoint

-- Add unique constraint on tenant_id + canonical_key
CREATE UNIQUE INDEX IF NOT EXISTS "idx_composite_kpi_unique_key" ON "mdm_composite_kpi" USING btree ("tenant_id", "canonical_key");
--> statement-breakpoint

-- Add comments
COMMENT ON TABLE "mdm_composite_kpi" IS 'Composite KPI definitions with numerator and denominator components';
COMMENT ON COLUMN "mdm_composite_kpi"."numerator" IS 'Numerator component: { fieldId, expression, standardPackId, description }';
COMMENT ON COLUMN "mdm_composite_kpi"."denominator" IS 'Denominator component: { fieldId, expression, standardPackId, description }';

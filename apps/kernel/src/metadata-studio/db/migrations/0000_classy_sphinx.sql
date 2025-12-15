CREATE TABLE IF NOT EXISTS "mdm_approval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"entity_key" text,
	"tier" text NOT NULL,
	"lane" text NOT NULL,
	"payload" jsonb NOT NULL,
	"current_state" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"decision_reason" text,
	"requested_by" text NOT NULL,
	"decided_by" text,
	"requested_at" timestamp with time zone DEFAULT now(),
	"decided_at" timestamp with time zone,
	"required_role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_business_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_type" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tier" text NOT NULL,
	"lane" text NOT NULL,
	"environment" text DEFAULT 'live' NOT NULL,
	"configuration" jsonb NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_standard_pack" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_id" text NOT NULL,
	"pack_name" text NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"tier" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"standard_body" text NOT NULL,
	"standard_reference" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_global_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"canonical_key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"domain" text NOT NULL,
	"module" text NOT NULL,
	"entity_urn" text NOT NULL,
	"tier" text NOT NULL,
	"standard_pack_id" text,
	"data_type" text NOT NULL,
	"format" text,
	"aliases_raw" text,
	"owner_id" text NOT NULL,
	"steward_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_global_metadata" ADD CONSTRAINT "mdm_global_metadata_standard_pack_id_mdm_standard_pack_pack_id_fk" FOREIGN KEY ("standard_pack_id") REFERENCES "public"."mdm_standard_pack"("pack_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_approval_tenant_status_idx" ON "mdm_approval" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_approval_tenant_entity_idx" ON "mdm_approval" USING btree ("tenant_id","entity_type","entity_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_business_rule_tenant_rule_version_uq" ON "mdm_business_rule" USING btree ("tenant_id","rule_type","key","environment","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_business_rule_active_idx" ON "mdm_business_rule" USING btree ("tenant_id","rule_type","environment","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_business_rule_tier_lane_idx" ON "mdm_business_rule" USING btree ("tenant_id","tier","lane");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_standard_pack_pack_id_uq" ON "mdm_standard_pack" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_standard_pack_category_tier_idx" ON "mdm_standard_pack" USING btree ("category","tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_standard_pack_primary_idx" ON "mdm_standard_pack" USING btree ("category","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_global_metadata_tenant_canonical_key_uq" ON "mdm_global_metadata" USING btree ("tenant_id","canonical_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_global_metadata_domain_module_idx" ON "mdm_global_metadata" USING btree ("tenant_id","domain","module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_global_metadata_tier_status_idx" ON "mdm_global_metadata" USING btree ("tenant_id","tier","status");
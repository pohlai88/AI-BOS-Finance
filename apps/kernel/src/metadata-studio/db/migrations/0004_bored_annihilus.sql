CREATE TABLE IF NOT EXISTS "mdm_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"entity_urn" text NOT NULL,
	"profile" jsonb NOT NULL,
	"completeness" text,
	"uniqueness" text,
	"validity" text,
	"quality_score" text,
	"governance_tier" text,
	"standard_pack_id" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_usage_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"entity_urn" text NOT NULL,
	"concept_id" uuid,
	"actor_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"event_type" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb NOT NULL,
	"governance_tier" text,
	"source" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profile_tenant_entity_time" ON "mdm_profile" USING btree ("tenant_id","entity_urn","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_tenant_entity_time" ON "mdm_usage_log" USING btree ("tenant_id","entity_urn","used_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_concept" ON "mdm_usage_log" USING btree ("tenant_id","concept_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_actor_type" ON "mdm_usage_log" USING btree ("tenant_id","actor_type","used_at");
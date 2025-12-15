CREATE TABLE IF NOT EXISTS "mdm_kpi_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kpi_id" uuid NOT NULL,
	"role" text NOT NULL,
	"metadata_id" uuid NOT NULL,
	"metadata_canonical_key" text NOT NULL,
	"component_expression" text,
	"sequence" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_kpi_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"canonical_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" text NOT NULL,
	"category" text NOT NULL,
	"standard_pack_id" text,
	"tier" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expression" text NOT NULL,
	"expression_language" text DEFAULT 'METADATA_DSL' NOT NULL,
	"primary_metadata_id" uuid,
	"primary_metadata_canonical_key" text,
	"aggregation_level" text,
	"owner_id" text NOT NULL,
	"steward_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_kpi_component" ADD CONSTRAINT "mdm_kpi_component_kpi_id_mdm_kpi_definition_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."mdm_kpi_definition"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_kpi_component" ADD CONSTRAINT "mdm_kpi_component_metadata_id_mdm_global_metadata_id_fk" FOREIGN KEY ("metadata_id") REFERENCES "public"."mdm_global_metadata"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_kpi_definition" ADD CONSTRAINT "mdm_kpi_definition_primary_metadata_id_mdm_global_metadata_id_fk" FOREIGN KEY ("primary_metadata_id") REFERENCES "public"."mdm_global_metadata"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_kpi_component_uq" ON "mdm_kpi_component" USING btree ("tenant_id","kpi_id","role","metadata_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_kpi_component_kpi_idx" ON "mdm_kpi_component" USING btree ("tenant_id","kpi_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_kpi_component_metadata_idx" ON "mdm_kpi_component" USING btree ("tenant_id","metadata_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_kpi_tenant_canonical_uq" ON "mdm_kpi_definition" USING btree ("tenant_id","canonical_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_kpi_tenant_domain_idx" ON "mdm_kpi_definition" USING btree ("tenant_id","domain","category");
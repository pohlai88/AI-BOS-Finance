CREATE TABLE IF NOT EXISTS "mdm_lineage_field" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_metadata_id" uuid NOT NULL,
	"target_metadata_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"transformation_type" text,
	"transformation_expression" text,
	"is_primary_path" boolean DEFAULT true NOT NULL,
	"confidence_score" integer DEFAULT 100 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_lineage_field" ADD CONSTRAINT "mdm_lineage_field_source_metadata_id_mdm_global_metadata_id_fk" FOREIGN KEY ("source_metadata_id") REFERENCES "public"."mdm_global_metadata"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_lineage_field" ADD CONSTRAINT "mdm_lineage_field_target_metadata_id_mdm_global_metadata_id_fk" FOREIGN KEY ("target_metadata_id") REFERENCES "public"."mdm_global_metadata"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_lineage_field_edge_uq" ON "mdm_lineage_field" USING btree ("tenant_id","source_metadata_id","target_metadata_id","relationship_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_lineage_field_target_idx" ON "mdm_lineage_field" USING btree ("tenant_id","target_metadata_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_lineage_field_source_idx" ON "mdm_lineage_field" USING btree ("tenant_id","source_metadata_id");
CREATE TABLE IF NOT EXISTS "mdm_glossary_term" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"canonical_key" text NOT NULL,
	"term" text NOT NULL,
	"description" text,
	"domain" text NOT NULL,
	"category" text NOT NULL,
	"standard_pack_id" text,
	"language" text DEFAULT 'en' NOT NULL,
	"tier" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"synonyms_raw" text,
	"related_canonical_keys" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"standard_pack_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mdm_tag_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_canonical_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mdm_tag_assignment" ADD CONSTRAINT "mdm_tag_assignment_tag_id_mdm_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."mdm_tag"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_glossary_tenant_canonical_uq" ON "mdm_glossary_term" USING btree ("tenant_id","canonical_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_glossary_term_idx" ON "mdm_glossary_term" USING btree ("tenant_id","term");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_tag_tenant_key_uq" ON "mdm_tag" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_tag_tenant_category_idx" ON "mdm_tag" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_tag_assignment_uq" ON "mdm_tag_assignment" USING btree ("tenant_id","tag_id","target_type","target_canonical_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_tag_assignment_target_idx" ON "mdm_tag_assignment" USING btree ("tenant_id","target_type","target_canonical_key");
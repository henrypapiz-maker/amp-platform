CREATE TABLE "ai_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"user_id" uuid,
	"evaluation_id" uuid,
	"dimension_name" text,
	"provider" text NOT NULL,
	"input_token_count" integer,
	"output_token_count" integer,
	"input_hash" text,
	"documents_included" text[],
	"response_summary" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"ai_enabled" boolean DEFAULT false,
	"ai_provider" text,
	"document_opt_in" text DEFAULT 'per_document',
	"data_residency" text DEFAULT 'us',
	"dpa_signed" boolean DEFAULT false,
	"dpa_signed_at" timestamp,
	"enabled_by" uuid,
	"enabled_at" timestamp,
	CONSTRAINT "ai_settings_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"target_name" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dimension_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid,
	"dimension_name" text NOT NULL,
	"score" numeric(4, 2),
	"rationale" text,
	"ai_suggested_score" numeric(4, 2),
	"ai_confidence" text,
	"ai_evidence_quotes" jsonb,
	"ai_gaps" jsonb,
	"confirmed_by" uuid,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "evidence_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid,
	"evidence_artifact_id" text NOT NULL,
	"link_type" text,
	"label" text NOT NULL,
	"ref" text NOT NULL,
	"file_size" text,
	"note" text,
	"extension" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gate_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid,
	"gate_code" text NOT NULL,
	"gate_status" text DEFAULT 'pending',
	"composite_score" numeric(5, 2),
	"evaluated_by" uuid,
	"evaluated_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persona_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"acquisition_thesis" text,
	"horizon_bias" text,
	"integration_philosophy" text,
	"risk_tolerance" text,
	"irr_hurdle" integer,
	"process_maturity" integer,
	"strategic_clarity" integer,
	"primary_sectors" text,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid,
	CONSTRAINT "persona_config_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "persona_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"filename" text NOT NULL,
	"file_type" text,
	"blob_url" text,
	"status" text DEFAULT 'processing',
	"extracted_attrs" text[],
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"name" text NOT NULL,
	"sector" text,
	"revenue" text,
	"status" text DEFAULT 'new',
	"current_gate" integer DEFAULT 0,
	"composite_score" numeric(5, 2),
	"outcome" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'viewer',
	"locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weight_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"gate_code" text NOT NULL,
	"dimension_name" text NOT NULL,
	"base_weight" numeric(5, 2) NOT NULL,
	"persona_adj" numeric(5, 2) DEFAULT '0',
	"manual_override" numeric(5, 2),
	"locked" boolean DEFAULT false,
	"persona_reason" text,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_evaluation_id_gate_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_enabled_by_users_id_fk" FOREIGN KEY ("enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dimension_scores" ADD CONSTRAINT "dimension_scores_evaluation_id_gate_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dimension_scores" ADD CONSTRAINT "dimension_scores_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_evaluation_id_gate_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "gate_evaluations_evaluated_by_users_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_config" ADD CONSTRAINT "persona_config_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_config" ADD CONSTRAINT "persona_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_documents" ADD CONSTRAINT "persona_documents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_documents" ADD CONSTRAINT "persona_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_overrides" ADD CONSTRAINT "weight_overrides_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_overrides" ADD CONSTRAINT "weight_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_gate_dim_idx" ON "weight_overrides" USING btree ("org_id","gate_code","dimension_name");
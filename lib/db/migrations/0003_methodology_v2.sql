-- ═══════════════════════════════════════════════════════════════
-- AMP v2 Migration 0003: Modules, Crystallization, Full v2
-- ═══════════════════════════════════════════════════════════════

-- ── Methodology Templates ─────────────────────────────────────
CREATE TABLE "methodology_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "archetype" text NOT NULL,
  "description" text,
  "version" text NOT NULL DEFAULT '1.0.0',
  "gates_config" jsonb NOT NULL,
  "persona_schema" jsonb,
  "weight_propagation_rules" jsonb,
  "is_published" boolean DEFAULT false,
  "is_default" boolean DEFAULT false,
  "published_at" timestamp,
  "authored_by" text,
  "change_log" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ── Evaluation Modules (gate-level analytical frameworks) ─────
CREATE TABLE "evaluation_modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid,
  "gate_code" text NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "when_to_use" text,
  "when_not_to_use" text,
  "dimensions_config" jsonb NOT NULL,
  "evidence_artifacts" jsonb,
  "minimum_score" numeric(5, 2),
  "decline_threshold" numeric(5, 2),
  "sort_order" integer DEFAULT 0,
  "is_default" boolean DEFAULT false,
  "is_published" boolean DEFAULT true,
  "org_id" uuid,
  "source" text DEFAULT 'alio_foundry',
  "author_name" text,
  "version" integer DEFAULT 1,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ── Organization Methodology ──────────────────────────────────
CREATE TABLE "org_methodology" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid UNIQUE,
  "template_id" uuid,
  "template_version" text,
  "custom_gates_config" jsonb,
  "customizations" jsonb,
  "sector_overlay_id" uuid,
  "selected_at" timestamp DEFAULT now(),
  "selected_by" uuid,
  "last_upstream_version" text,
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ── Evaluation Lenses (now with module scoping) ───────────────
CREATE TABLE "evaluation_lenses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "gate_code" text NOT NULL,
  "dimension_name" text NOT NULL,
  "module_id" uuid,
  "name" text NOT NULL,
  "framework" text,
  "guidance" text NOT NULL,
  "key_questions" jsonb,
  "evidence_needs" jsonb,
  "calibration_anchors" jsonb,
  "blind_spots" jsonb,
  "template_id" uuid,
  "org_id" uuid,
  "is_default" boolean DEFAULT true,
  "is_published" boolean DEFAULT true,
  "source" text DEFAULT 'alio_foundry',
  "author_name" text,
  "author_org" text,
  "version" integer DEFAULT 1,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ── Lens Notes ────────────────────────────────────────────────
CREATE TABLE "lens_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_id" uuid,
  "lens_id" uuid,
  "dimension_name" text NOT NULL,
  "lens_score" numeric(4, 2),
  "observation" text,
  "ai_lens_score" numeric(4, 2),
  "ai_lens_rationale" text,
  "ai_confidence" text,
  "author_id" uuid,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ── Crystal Break Log (audit trail for unfreezing gates) ──────
CREATE TABLE "crystal_break_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_id" uuid,
  "gate_code" text NOT NULL,
  "target_id" uuid NOT NULL,
  "broken_by" uuid NOT NULL,
  "justification" text NOT NULL,
  "prior_crystallized_config" jsonb NOT NULL,
  "prior_composite_score" numeric(5, 2),
  "prior_gate_status" text,
  "prior_scores_snapshot" jsonb,
  "prior_approvals_snapshot" jsonb,
  "recrystallized_at" timestamp,
  "recrystallized_config" jsonb,
  "broken_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "sector_overlays" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid,
  "sector_name" text NOT NULL,
  "description" text,
  "dimension_adjustments" jsonb,
  "additional_lenses" jsonb,
  "additional_modules" jsonb,
  "is_published" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "deal_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "target_id" uuid NOT NULL,
  "overrides" jsonb NOT NULL,
  "justification" text NOT NULL,
  "created_by" uuid,
  "approved_by" uuid,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "ai_consent_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid, "user_id" uuid, "evaluation_id" uuid,
  "consent_gate" text NOT NULL, "action" text NOT NULL,
  "scope" text, "is_blanket_inherited" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "ai_document_context" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_id" uuid, "evidence_link_id" uuid,
  "opted_in" boolean DEFAULT false,
  "is_blanket_inherited" boolean DEFAULT false,
  "opted_in_by" uuid, "opted_in_at" timestamp, "revoked_at" timestamp
);
--> statement-breakpoint

CREATE TABLE "ai_prompt_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "gate_code" text, "dimension_name" text,
  "module_id" uuid,
  "prompt_type" text NOT NULL,
  "system_instructions" text NOT NULL,
  "persona_context_template" text,
  "gate_context_template" text,
  "dimension_context_template" text,
  "output_schema" jsonb,
  "confidence_calibration" text,
  "org_id" uuid,
  "is_default" boolean DEFAULT true,
  "version" integer DEFAULT 1,
  "updated_by" uuid,
  "updated_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "narrative_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "evaluation_id" uuid, "target_id" uuid NOT NULL,
  "draft_version" integer DEFAULT 1,
  "ai_draft_content" text, "analyst_edited_content" text,
  "status" text DEFAULT 'draft', "generated_by" text,
  "token_count" integer,
  "generated_at" timestamp DEFAULT now(),
  "reviewed_by" uuid, "reviewed_at" timestamp, "exported_at" timestamp
);
--> statement-breakpoint

CREATE TABLE "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid UNIQUE,
  "tier" text NOT NULL DEFAULT 'free',
  "status" text DEFAULT 'active',
  "max_users" integer DEFAULT 1,
  "max_active_targets" integer DEFAULT 1,
  "ai_enabled" boolean DEFAULT false,
  "custom_methodology" boolean DEFAULT false,
  "cross_deal_analytics" boolean DEFAULT false,
  "trial_started_at" timestamp, "trial_expires_at" timestamp,
  "stripe_customer_id" text, "stripe_subscription_id" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "knowledge_base_articles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL, "slug" text NOT NULL UNIQUE,
  "category" text NOT NULL, "summary" text, "content" text NOT NULL,
  "related_gates" jsonb, "related_dimensions" jsonb,
  "related_modules" jsonb, "related_lenses" jsonb,
  "is_published" boolean DEFAULT false, "author_name" text,
  "version" integer DEFAULT 1, "published_at" timestamp,
  "created_at" timestamp DEFAULT now(), "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════════════
-- FOREIGN KEYS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "evaluation_modules" ADD CONSTRAINT "modules_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."methodology_templates"("id");
ALTER TABLE "evaluation_modules" ADD CONSTRAINT "modules_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");
ALTER TABLE "org_methodology" ADD CONSTRAINT "org_method_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");
ALTER TABLE "org_methodology" ADD CONSTRAINT "org_method_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."methodology_templates"("id");
ALTER TABLE "org_methodology" ADD CONSTRAINT "org_method_selected_by_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."users"("id");
ALTER TABLE "evaluation_lenses" ADD CONSTRAINT "lenses_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."evaluation_modules"("id");
ALTER TABLE "evaluation_lenses" ADD CONSTRAINT "lenses_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."methodology_templates"("id");
ALTER TABLE "evaluation_lenses" ADD CONSTRAINT "lenses_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");
ALTER TABLE "lens_notes" ADD CONSTRAINT "lens_notes_eval_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE cascade;
ALTER TABLE "lens_notes" ADD CONSTRAINT "lens_notes_lens_fk" FOREIGN KEY ("lens_id") REFERENCES "public"."evaluation_lenses"("id");
ALTER TABLE "lens_notes" ADD CONSTRAINT "lens_notes_author_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id");
ALTER TABLE "crystal_break_log" ADD CONSTRAINT "crystal_break_eval_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id");
ALTER TABLE "crystal_break_log" ADD CONSTRAINT "crystal_break_user_fk" FOREIGN KEY ("broken_by") REFERENCES "public"."users"("id");
ALTER TABLE "sector_overlays" ADD CONSTRAINT "overlays_template_fk" FOREIGN KEY ("template_id") REFERENCES "public"."methodology_templates"("id");
ALTER TABLE "deal_overrides" ADD CONSTRAINT "deal_overrides_target_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE cascade;
ALTER TABLE "deal_overrides" ADD CONSTRAINT "deal_overrides_created_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");
ALTER TABLE "deal_overrides" ADD CONSTRAINT "deal_overrides_approved_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");
ALTER TABLE "ai_consent_log" ADD CONSTRAINT "consent_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");
ALTER TABLE "ai_consent_log" ADD CONSTRAINT "consent_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "ai_document_context" ADD CONSTRAINT "doc_ctx_eval_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE cascade;
ALTER TABLE "ai_document_context" ADD CONSTRAINT "doc_ctx_evidence_fk" FOREIGN KEY ("evidence_link_id") REFERENCES "public"."evidence_links"("id") ON DELETE cascade;
ALTER TABLE "ai_document_context" ADD CONSTRAINT "doc_ctx_user_fk" FOREIGN KEY ("opted_in_by") REFERENCES "public"."users"("id");
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "prompts_module_fk" FOREIGN KEY ("module_id") REFERENCES "public"."evaluation_modules"("id");
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "prompts_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "prompts_user_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");
ALTER TABLE "narrative_drafts" ADD CONSTRAINT "narratives_eval_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."gate_evaluations"("id") ON DELETE cascade;
ALTER TABLE "narrative_drafts" ADD CONSTRAINT "narratives_user_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX "module_gate_idx" ON "evaluation_modules" USING btree ("template_id", "gate_code");
CREATE INDEX "lens_gate_dim_idx" ON "evaluation_lenses" USING btree ("gate_code", "dimension_name");
CREATE INDEX "lens_module_idx" ON "evaluation_lenses" USING btree ("module_id");
CREATE INDEX "prompt_scope_idx" ON "ai_prompt_templates" USING btree ("gate_code", "dimension_name", "prompt_type");
CREATE INDEX "consent_log_org_idx" ON "ai_consent_log" USING btree ("org_id", "consent_gate");
CREATE INDEX "lens_notes_eval_idx" ON "lens_notes" USING btree ("evaluation_id", "dimension_name");
CREATE INDEX "crystal_break_eval_idx" ON "crystal_break_log" USING btree ("evaluation_id");

-- ═══════════════════════════════════════════════════════════════
-- MODIFY EXISTING TABLES — Gate crystallization + module support
-- ═══════════════════════════════════════════════════════════════

-- Per-gate crystallization on gate_evaluations
ALTER TABLE "gate_evaluations" ADD COLUMN "module_id" uuid;
ALTER TABLE "gate_evaluations" ADD COLUMN "module_name" text;
ALTER TABLE "gate_evaluations" ADD COLUMN "template_version_snapshot" text;
ALTER TABLE "gate_evaluations" ADD COLUMN "crystallized_at" timestamp;
ALTER TABLE "gate_evaluations" ADD COLUMN "crystallized_config" jsonb;
ALTER TABLE "gate_evaluations" ADD COLUMN "crystallized_by" uuid;
ALTER TABLE "gate_evaluations" ADD COLUMN "is_crystallized" boolean DEFAULT false;
ALTER TABLE "gate_evaluations" ADD COLUMN "ai_enabled" boolean DEFAULT false;
ALTER TABLE "gate_evaluations" ADD COLUMN "ai_blanket_consent" boolean DEFAULT false;

-- FK for module reference
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "eval_module_fk" FOREIGN KEY ("module_id") REFERENCES "public"."evaluation_modules"("id");
ALTER TABLE "gate_evaluations" ADD CONSTRAINT "eval_crystallized_by_fk" FOREIGN KEY ("crystallized_by") REFERENCES "public"."users"("id");

-- Deal override + methodology on targets
ALTER TABLE "targets" ADD COLUMN "deal_override_id" uuid;
ALTER TABLE "persona_config" ADD COLUMN "methodology_template_id" uuid;

-- AI traceability on dimension_scores
ALTER TABLE "dimension_scores" ADD COLUMN "ai_request_id" uuid;

-- Expanded ai_settings
ALTER TABLE "ai_settings" ADD COLUMN "dpa_document_url" text;
ALTER TABLE "ai_settings" ADD COLUMN "dpa_renewal_date" timestamp;
ALTER TABLE "ai_settings" ADD COLUMN "allowed_models" text[];
ALTER TABLE "ai_settings" ADD COLUMN "max_tokens_per_request" integer DEFAULT 4096;
ALTER TABLE "ai_settings" ADD COLUMN "cost_budget_monthly" numeric(10, 2);
ALTER TABLE "ai_settings" ADD COLUMN "blanket_evaluation_consent" boolean DEFAULT false;
ALTER TABLE "ai_settings" ADD COLUMN "blanket_document_consent" boolean DEFAULT false;

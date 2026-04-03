// AMP v2 Schema — Modules + Crystallization + Full Architecture
// See schema companion doc for field descriptions

import {
  pgTable, uuid, text, boolean, numeric,
  timestamp, integer, jsonb, uniqueIndex, index
} from "drizzle-orm/pg-core";
import { organizations, users, gateEvaluations, evidenceLinks } from "./schema";

export const methodologyTemplates = pgTable("methodology_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  archetype: text("archetype").notNull(),
  description: text("description"),
  version: text("version").notNull().default("1.0.0"),
  gatesConfig: jsonb("gates_config").notNull(),
  personaSchema: jsonb("persona_schema"),
  weightPropagationRules: jsonb("weight_propagation_rules"),
  isPublished: boolean("is_published").default(false),
  isDefault: boolean("is_default").default(false),
  publishedAt: timestamp("published_at"),
  authoredBy: text("authored_by"),
  changeLog: jsonb("change_log"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const evaluationModules = pgTable("evaluation_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => methodologyTemplates.id),
  gateCode: text("gate_code").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  whenToUse: text("when_to_use"),
  whenNotToUse: text("when_not_to_use"),
  dimensionsConfig: jsonb("dimensions_config").notNull(),
  evidenceArtifacts: jsonb("evidence_artifacts"),
  minimumScore: numeric("minimum_score", { precision: 5, scale: 2 }),
  declineThreshold: numeric("decline_threshold", { precision: 5, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
  isDefault: boolean("is_default").default(false),
  isPublished: boolean("is_published").default(true),
  orgId: uuid("org_id").references(() => organizations.id),
  source: text("source").default("alio_foundry"),
  authorName: text("author_name"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  gateModuleIdx: index("module_gate_idx").on(table.templateId, table.gateCode),
}));

export const orgMethodology = pgTable("org_methodology", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).unique(),
  templateId: uuid("template_id").references(() => methodologyTemplates.id),
  templateVersion: text("template_version"),
  customGatesConfig: jsonb("custom_gates_config"),
  customizations: jsonb("customizations"),
  sectorOverlayId: uuid("sector_overlay_id"),
  selectedAt: timestamp("selected_at").defaultNow(),
  selectedBy: uuid("selected_by").references(() => users.id),
  lastUpstreamVersion: text("last_upstream_version"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const evaluationLenses = pgTable("evaluation_lenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  gateCode: text("gate_code").notNull(),
  dimensionName: text("dimension_name").notNull(),
  moduleId: uuid("module_id").references(() => evaluationModules.id),
  name: text("name").notNull(),
  framework: text("framework"),
  guidance: text("guidance").notNull(),
  keyQuestions: jsonb("key_questions"),
  evidenceNeeds: jsonb("evidence_needs"),
  calibrationAnchors: jsonb("calibration_anchors"),
  blindSpots: jsonb("blind_spots"),
  templateId: uuid("template_id").references(() => methodologyTemplates.id),
  orgId: uuid("org_id").references(() => organizations.id),
  isDefault: boolean("is_default").default(true),
  isPublished: boolean("is_published").default(true),
  source: text("source").default("alio_foundry"),
  authorName: text("author_name"),
  authorOrg: text("author_org"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  gateDimIdx: index("lens_gate_dim_idx").on(table.gateCode, table.dimensionName),
  moduleIdx: index("lens_module_idx").on(table.moduleId),
}));

export const lensNotes = pgTable("lens_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id, { onDelete: "cascade" }),
  lensId: uuid("lens_id").references(() => evaluationLenses.id),
  dimensionName: text("dimension_name").notNull(),
  lensScore: numeric("lens_score", { precision: 4, scale: 2 }),
  observation: text("observation"),
  aiLensScore: numeric("ai_lens_score", { precision: 4, scale: 2 }),
  aiLensRationale: text("ai_lens_rationale"),
  aiConfidence: text("ai_confidence"),
  authorId: uuid("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const crystalBreakLog = pgTable("crystal_break_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id),
  gateCode: text("gate_code").notNull(),
  targetId: uuid("target_id").notNull(),
  brokenBy: uuid("broken_by").references(() => users.id).notNull(),
  justification: text("justification").notNull(),
  priorCrystallizedConfig: jsonb("prior_crystallized_config").notNull(),
  priorCompositeScore: numeric("prior_composite_score", { precision: 5, scale: 2 }),
  priorGateStatus: text("prior_gate_status"),
  priorScoresSnapshot: jsonb("prior_scores_snapshot"),
  priorApprovalsSnapshot: jsonb("prior_approvals_snapshot"),
  recrystallizedAt: timestamp("recrystallized_at"),
  recrystallizedConfig: jsonb("recrystallized_config"),
  brokenAt: timestamp("broken_at").defaultNow(),
});

export const sectorOverlays = pgTable("sector_overlays", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => methodologyTemplates.id),
  sectorName: text("sector_name").notNull(),
  description: text("description"),
  dimensionAdjustments: jsonb("dimension_adjustments"),
  additionalLenses: jsonb("additional_lenses"),
  additionalModules: jsonb("additional_modules"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealOverrides = pgTable("deal_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetId: uuid("target_id").notNull(),
  overrides: jsonb("overrides").notNull(),
  justification: text("justification").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiConsentLog = pgTable("ai_consent_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  evaluationId: uuid("evaluation_id"),
  consentGate: text("consent_gate").notNull(),
  action: text("action").notNull(),
  scope: text("scope"),
  isBlanketInherited: boolean("is_blanket_inherited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiDocumentContext = pgTable("ai_document_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id, { onDelete: "cascade" }),
  evidenceLinkId: uuid("evidence_link_id").references(() => evidenceLinks.id, { onDelete: "cascade" }),
  optedIn: boolean("opted_in").default(false),
  isBlanketInherited: boolean("is_blanket_inherited").default(false),
  optedInBy: uuid("opted_in_by").references(() => users.id),
  optedInAt: timestamp("opted_in_at"),
  revokedAt: timestamp("revoked_at"),
});

export const aiPromptTemplates = pgTable("ai_prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  gateCode: text("gate_code"),
  dimensionName: text("dimension_name"),
  moduleId: uuid("module_id").references(() => evaluationModules.id),
  promptType: text("prompt_type").notNull(),
  systemInstructions: text("system_instructions").notNull(),
  personaContextTemplate: text("persona_context_template"),
  gateContextTemplate: text("gate_context_template"),
  dimensionContextTemplate: text("dimension_context_template"),
  outputSchema: jsonb("output_schema"),
  confidenceCalibration: text("confidence_calibration"),
  orgId: uuid("org_id").references(() => organizations.id),
  isDefault: boolean("is_default").default(true),
  version: integer("version").default(1),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  promptScopeIdx: index("prompt_scope_idx").on(table.gateCode, table.dimensionName, table.promptType),
}));

export const narrativeDrafts = pgTable("narrative_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id, { onDelete: "cascade" }),
  targetId: uuid("target_id").notNull(),
  draftVersion: integer("draft_version").default(1),
  aiDraftContent: text("ai_draft_content"),
  analystEditedContent: text("analyst_edited_content"),
  status: text("status").default("draft"),
  generatedBy: text("generated_by"),
  tokenCount: integer("token_count"),
  generatedAt: timestamp("generated_at").defaultNow(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  exportedAt: timestamp("exported_at"),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).unique(),
  tier: text("tier").notNull().default("free"),
  status: text("status").default("active"),
  maxUsers: integer("max_users").default(1),
  maxActiveTargets: integer("max_active_targets").default(1),
  aiEnabled: boolean("ai_enabled").default(false),
  customMethodology: boolean("custom_methodology").default(false),
  crossDealAnalytics: boolean("cross_deal_analytics").default(false),
  trialStartedAt: timestamp("trial_started_at"),
  trialExpiresAt: timestamp("trial_expires_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  relatedGates: jsonb("related_gates"),
  relatedDimensions: jsonb("related_dimensions"),
  relatedModules: jsonb("related_modules"),
  relatedLenses: jsonb("related_lenses"),
  isPublished: boolean("is_published").default(false),
  authorName: text("author_name"),
  version: integer("version").default(1),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Evidence Reference Library ───────────────────────────────
// Standalone reference catalog of sample templates, guides, and
// frameworks organized by gate. Users browse, download, customize,
// then upload their version as deal evidence separately.
export const evidenceTemplates = pgTable("evidence_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  gateCode: text("gate_code").notNull(),
  artifactId: text("artifact_id").notNull(),
  name: text("name").notNull(),
  category: text("category").default("template"),
  description: text("description"),
  sections: jsonb("sections"),
  qualityCriteria: text("quality_criteria"),
  templateBlobUrl: text("template_blob_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: text("file_size"),
  templateId: uuid("template_id").references(() => methodologyTemplates.id),
  isPublished: boolean("is_published").default(true),
  authorName: text("author_name"),
  tags: jsonb("tags"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  gateIdx: index("evidence_template_gate_idx").on(table.gateCode),
  artifactIdx: index("evidence_template_artifact_idx").on(table.artifactId),
}));

import {
  pgTable, uuid, text, boolean, numeric,
  timestamp, integer, jsonb, uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Organizations ──────────────────────────────────────────────
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Users ──────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "analyst", "viewer"] }).default("viewer"),
  locked: boolean("locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Acquirer Persona Config ────────────────────────────────────
export const personaConfig = pgTable("persona_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).unique(),
  acquisitionThesis: text("acquisition_thesis"),
  horizonBias: text("horizon_bias"),
  integrationPhilosophy: text("integration_philosophy"),
  riskTolerance: text("risk_tolerance"),
  irrHurdle: integer("irr_hurdle"),
  processMaturity: integer("process_maturity"),
  strategicClarity: integer("strategic_clarity"),
  primarySectors: text("primary_sectors"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id),
  // v2: methodology template selection
  methodologyTemplateId: uuid("methodology_template_id"),
});

// ── Targets (Acquisition Candidates) ──────────────────────────
export const targets = pgTable("targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  name: text("name").notNull(),
  sector: text("sector"),
  revenue: text("revenue"),
  status: text("status", { enum: ["new", "inflight", "closed"] }).default("new"),
  currentGate: integer("current_gate").default(0),
  compositeScore: numeric("composite_score", { precision: 5, scale: 2 }),
  outcome: text("outcome", { enum: ["pursue", "conditional", "pass"] }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // v2: deal-level methodology overrides
  dealOverrideId: uuid("deal_override_id"),
  // v2: FIX-5 — per-deal persona overrides (thesis, horizon, risk tolerance, etc.)
  personaOverrides: jsonb("persona_overrides"),
  // v2: FIX-6 — user-defined custom dimensions per gate for this deal
  customDimensions: jsonb("custom_dimensions"),
});

// ── Gate Evaluations ──────────────────────────────────────────
export const gateEvaluations = pgTable("gate_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetId: uuid("target_id").references(() => targets.id, { onDelete: "cascade" }),
  gateCode: text("gate_code").notNull(),
  gateStatus: text("gate_status").default("pending"),
  compositeScore: numeric("composite_score", { precision: 5, scale: 2 }),
  evaluatedBy: uuid("evaluated_by").references(() => users.id),
  evaluatedAt: timestamp("evaluated_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  // v2: module selection + crystallization
  moduleId: uuid("module_id"),
  moduleName: text("module_name"),
  templateVersionSnapshot: text("template_version_snapshot"),
  isCrystallized: boolean("is_crystallized").default(false),
  crystallizedAt: timestamp("crystallized_at"),
  crystallizedConfig: jsonb("crystallized_config"),
  crystallizedBy: uuid("crystallized_by").references(() => users.id),
  aiEnabled: boolean("ai_enabled").default(false),
  aiBlanketConsent: boolean("ai_blanket_consent").default(false),
});

// ── Dimension Scores ──────────────────────────────────────────
export const dimensionScores = pgTable("dimension_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id, { onDelete: "cascade" }),
  dimensionName: text("dimension_name").notNull(),
  score: numeric("score", { precision: 4, scale: 2 }),
  rationale: text("rationale"),
  // Phase 2: AI-assisted scoring (only populated when AI enabled + analyst requests)
  aiSuggestedScore: numeric("ai_suggested_score", { precision: 4, scale: 2 }),
  aiConfidence: text("ai_confidence"),
  aiEvidenceQuotes: jsonb("ai_evidence_quotes"),
  aiGaps: jsonb("ai_gaps"),
  confirmedBy: uuid("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  // v2: AI request traceability
  aiRequestId: uuid("ai_request_id"),
  // v2: FIX-4 — score version history (prior scores preserved as array)
  scoreHistory: jsonb("score_history"),
});

// ── Weight Overrides ──────────────────────────────────────────
export const weightOverrides = pgTable("weight_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  gateCode: text("gate_code").notNull(),
  dimensionName: text("dimension_name").notNull(),
  baseWeight: numeric("base_weight", { precision: 5, scale: 2 }).notNull(),
  personaAdj: numeric("persona_adj", { precision: 5, scale: 2 }).default("0"),
  manualOverride: numeric("manual_override", { precision: 5, scale: 2 }),
  locked: boolean("locked").default(false),
  personaReason: text("persona_reason"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgGateDim: uniqueIndex("org_gate_dim_idx").on(table.orgId, table.gateCode, table.dimensionName),
}));

// ── Evidence Links ────────────────────────────────────────────
export const evidenceLinks = pgTable("evidence_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id, { onDelete: "cascade" }),
  evidenceArtifactId: text("evidence_artifact_id").notNull(),
  linkType: text("link_type", { enum: ["file", "url", "db", "flatfile"] }),
  label: text("label").notNull(),
  ref: text("ref").notNull(),
  fileSize: text("file_size"),
  note: text("note"),
  extension: text("extension"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// ── Persona Documents ─────────────────────────────────────────
export const personaDocuments = pgTable("persona_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  filename: text("filename").notNull(),
  fileType: text("file_type"),
  blobUrl: text("blob_url"),
  status: text("status").default("processing"),
  extractedAttrs: text("extracted_attrs").array(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// ── Gate Approvals (dual authorization) ───────────────────────
export const gateApprovals = pgTable("gate_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  decision: text("decision").notNull(), // "approve" | "reject" | "conditional"
  rationale: text("rationale"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Gate Tolerance Config (org-level overrides) ───────────────
export const gateTolerances = pgTable("gate_tolerances", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  gateCode: text("gate_code").notNull(),
  minimumScore: numeric("minimum_score", { precision: 5, scale: 2 }),
  declineThreshold: numeric("decline_threshold", { precision: 5, scale: 2 }),
  requiredApprovals: integer("required_approvals").default(2),
  approverRoles: text("approver_roles").array(), // e.g., ["admin", "analyst"]
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgGate: uniqueIndex("org_gate_tol_idx").on(table.orgId, table.gateCode),
}));

// ── Dimension Criteria (org-level overrides) ──────────────────
export const dimensionCriteria = pgTable("dimension_criteria", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  gateCode: text("gate_code").notNull(),
  dimensionName: text("dimension_name").notNull(),
  testGuidance: text("test_guidance"),
  acceptanceParams: jsonb("acceptance_params"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgGateDim: uniqueIndex("dim_criteria_idx").on(table.orgId, table.gateCode, table.dimensionName),
}));

// ── Audit Log ─────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  targetName: text("target_name"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── AI Settings (OFF by default — Zone 2 isolation) ───────────
export const aiSettings = pgTable("ai_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).unique(),
  aiEnabled: boolean("ai_enabled").default(false),
  aiProvider: text("ai_provider"),
  documentOptIn: text("document_opt_in").default("per_document"),
  dataResidency: text("data_residency").default("us"),
  dpaSigned: boolean("dpa_signed").default(false),
  dpaSignedAt: timestamp("dpa_signed_at"),
  enabledBy: uuid("enabled_by").references(() => users.id),
  enabledAt: timestamp("enabled_at"),
  // v2: expanded AI settings
  dpaDocumentUrl: text("dpa_document_url"),
  dpaRenewalDate: timestamp("dpa_renewal_date"),
  allowedModels: text("allowed_models").array(),
  maxTokensPerRequest: integer("max_tokens_per_request").default(4096),
  costBudgetMonthly: numeric("cost_budget_monthly", { precision: 10, scale: 2 }),
  blanketEvaluationConsent: boolean("blanket_evaluation_consent").default(false),
  blanketDocumentConsent: boolean("blanket_document_consent").default(false),
});

// ── AI Audit Log (separate for compliance) ────────────────────
export const aiAuditLog = pgTable("ai_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  evaluationId: uuid("evaluation_id").references(() => gateEvaluations.id),
  dimensionName: text("dimension_name"),
  provider: text("provider").notNull(),
  inputTokenCount: integer("input_token_count"),
  outputTokenCount: integer("output_token_count"),
  inputHash: text("input_hash"),
  documentsIncluded: text("documents_included").array(),
  responseSummary: text("response_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

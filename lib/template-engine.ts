// ═══════════════════════════════════════════════════════════════
// AMP v2 Template Engine — Modules + Crystallization
//
// Resolution hierarchy:
//   Template → Gate → Module (selected at eval start) → Dimensions → Lenses
//
// Crystallization model:
//   - Gate methodology freezes when gate passes dual auth
//   - Frozen gates are immune to template updates
//   - Break-crystal requires admin + justification + re-approval
//   - Active (non-crystallized) gates always use latest methodology
// ═══════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { GATES, type GateDefinition, type Dimension } from "@/lib/gates";
import {
  gateEvaluations, dimensionScores, gateApprovals, auditLog
} from "@/lib/db/schema";

// Dynamic imports for v2 tables (graceful fallback pre-migration)
let v2: any = null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { v2 = require("@/lib/db/schema-v2"); } catch { /* pre-migration */ }

// ── Types ──────────────────────────────────────────────────────

export interface LensDefinition {
  id: string;
  name: string;
  framework: string;
  guidance: string;
  keyQuestions: string[];
  evidenceNeeds: string[];
  calibrationAnchors: Array<{ score: number; label: string }>;
  blindSpots: string[];
  isDefault: boolean;
  source: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whenToUse: string | null;
  whenNotToUse: string | null;
  dimensions: Array<Dimension & { lenses: LensDefinition[] }>;
  evidenceArtifacts: any[];
  minimumScore: number | null;
  declineThreshold: number | null;
  isDefault: boolean;
  source: string;
}

export interface EnrichedGate {
  code: string;
  name: string;
  purpose: string;
  type: "binary" | "scored" | "decision";
  rule: string;
  minimumScore: number | null;
  declineThreshold: number | null;
  modules: ModuleDefinition[];          // Available modules for this gate
  defaultModuleId: string | null;       // Pre-selected module
  evidenceArtifacts: any[];
  templateSource: "crystallized" | "deal_override" | "org_custom" | "template" | "static_fallback";
}

export interface MethodologyContext {
  templateId: string | null;
  templateName: string | null;
  templateVersion: string | null;
  archetype: string | null;
  isCustomized: boolean;
  gates: EnrichedGate[];
}

export interface CrystallizedGateConfig {
  moduleId: string;
  moduleName: string;
  dimensions: any[];
  lenses: LensDefinition[];
  weights: Record<string, number>;
  tolerances: { minimumScore: number | null; declineThreshold: number | null };
  templateVersion: string;
  crystallizedAt: string;
}

// ── Module Resolution ──────────────────────────────────────────

/**
 * Get available modules for a specific gate.
 * Modules come from: template defaults + org custom modules + sector overlays
 */
export async function resolveModules(
  gateCode: string,
  templateId: string | null,
  orgId: string
): Promise<ModuleDefinition[]> {
  if (!v2?.evaluationModules) return [];

  try {
    const rows = await db
      .select()
      .from(v2.evaluationModules)
      .where(
        and(
          eq(v2.evaluationModules.gateCode, gateCode),
          eq(v2.evaluationModules.isPublished, true)
        )
      );

    const relevant = rows.filter((m: any) => {
      const isGlobal = !m.templateId && !m.orgId;
      const isTemplateMatch = m.templateId === templateId;
      const isOrgMatch = m.orgId === orgId;
      return isGlobal || isTemplateMatch || isOrgMatch;
    });

    // For each module, resolve its lenses
    const modules: ModuleDefinition[] = [];
    for (const row of relevant) {
      const dims = Array.isArray(row.dimensionsConfig) ? row.dimensionsConfig : [];
      const lenses = await resolveLensesForModule(gateCode, row.id, templateId, orgId);

      // Attach lenses to their dimensions
      const enrichedDims = dims.map((d: any) => ({
        ...d,
        lenses: lenses.filter((l) => l.dimensionName === d.name),
      }));

      modules.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        whenToUse: row.whenToUse,
        whenNotToUse: row.whenNotToUse,
        dimensions: enrichedDims,
        evidenceArtifacts: row.evidenceArtifacts || [],
        minimumScore: row.minimumScore ? Number(row.minimumScore) : null,
        declineThreshold: row.declineThreshold ? Number(row.declineThreshold) : null,
        isDefault: row.isDefault,
        source: row.source || "alio_foundry",
      });
    }

    return modules.sort((a, b) => (a.isDefault ? -1 : 1));
  } catch {
    return [];
  }
}

/**
 * Get lenses scoped to a specific module (or universal lenses).
 */
async function resolveLensesForModule(
  gateCode: string,
  moduleId: string,
  templateId: string | null,
  orgId: string
): Promise<(LensDefinition & { dimensionName: string })[]> {
  if (!v2?.evaluationLenses) return [];

  try {
    const rows = await db
      .select()
      .from(v2.evaluationLenses)
      .where(
        and(
          eq(v2.evaluationLenses.gateCode, gateCode),
          eq(v2.evaluationLenses.isPublished, true)
        )
      );

    return rows
      .filter((l: any) => {
        // Include if: no module scope (universal), or scoped to this module
        const moduleMatch = !l.moduleId || l.moduleId === moduleId;
        const scopeMatch = !l.templateId && !l.orgId ||
          l.templateId === templateId ||
          l.orgId === orgId;
        return moduleMatch && scopeMatch;
      })
      .map((l: any) => ({
        id: l.id,
        dimensionName: l.dimensionName,
        name: l.name,
        framework: l.framework || "",
        guidance: l.guidance,
        keyQuestions: l.keyQuestions || [],
        evidenceNeeds: l.evidenceNeeds || [],
        calibrationAnchors: l.calibrationAnchors || [],
        blindSpots: l.blindSpots || [],
        isDefault: l.isDefault,
        source: l.source || "alio_foundry",
      }));
  } catch {
    return [];
  }
}

// ── Methodology Resolution ─────────────────────────────────────

/**
 * Resolve the complete methodology for an organization.
 * Returns gates with available modules. The analyst selects a module
 * when starting a gate evaluation.
 */
export async function resolveMethodology(orgId: string): Promise<MethodologyContext> {
  if (v2?.orgMethodology) {
    try {
      const [orgMethod] = await db
        .select().from(v2.orgMethodology)
        .where(eq(v2.orgMethodology.orgId, orgId)).limit(1);

      const templateId = orgMethod?.templateId || null;
      const templateVersion = orgMethod?.templateVersion || null;

      // Get base gate structure from template or org config
      let baseGates: GateDefinition[];
      let templateName: string | null = null;
      let archetype: string | null = null;
      let source: EnrichedGate["templateSource"] = "template";

      if (orgMethod?.customGatesConfig) {
        baseGates = parseGatesConfig(orgMethod.customGatesConfig);
        source = "org_custom";
      } else if (templateId) {
        const [template] = await db
          .select().from(v2.methodologyTemplates)
          .where(eq(v2.methodologyTemplates.id, templateId)).limit(1);
        if (template) {
          baseGates = parseGatesConfig(template.gatesConfig);
          templateName = template.name;
          archetype = template.archetype;
        } else {
          baseGates = GATES;
          source = "static_fallback";
        }
      } else {
        baseGates = GATES;
        source = "static_fallback";
      }

      // Enrich each gate with its available modules
      const enrichedGates: EnrichedGate[] = [];
      for (const gate of baseGates) {
        const modules = await resolveModules(gate.code, templateId, orgId);

        enrichedGates.push({
          code: gate.code,
          name: gate.name,
          purpose: gate.purpose,
          type: gate.type,
          rule: gate.rule,
          minimumScore: gate.minimumScore,
          declineThreshold: gate.declineThreshold,
          modules,
          defaultModuleId: modules.find((m) => m.isDefault)?.id || null,
          evidenceArtifacts: gate.evidenceArtifacts || [],
          templateSource: source,
        });
      }

      return {
        templateId,
        templateName,
        templateVersion,
        archetype,
        isCustomized: source === "org_custom",
        gates: enrichedGates,
      };
    } catch (err) {
      console.warn("Template engine: v2 resolution failed", err);
    }
  }

  // Static fallback — wrap v1 gates with empty module arrays
  return {
    templateId: null,
    templateName: "AMP Default (v1)",
    templateVersion: "1.0.0",
    archetype: null,
    isCustomized: false,
    gates: GATES.map((g) => ({
      ...g,
      modules: [{
        id: `static-${g.code}`,
        name: "Default",
        slug: "default",
        description: null,
        whenToUse: null,
        whenNotToUse: null,
        dimensions: g.dimensions.map((d) => ({ ...d, lenses: [] })),
        evidenceArtifacts: g.evidenceArtifacts || [],
        minimumScore: g.minimumScore,
        declineThreshold: g.declineThreshold,
        isDefault: true,
        source: "static_fallback",
      }],
      defaultModuleId: `static-${g.code}`,
      templateSource: "static_fallback" as const,
    })),
  };
}

// ── Crystallization ────────────────────────────────────────────

/**
 * Crystallize a gate evaluation.
 * Called after dual authorization passes. Freezes the methodology
 * config so it's immune to future template/module/lens changes.
 */
export async function crystallizeGate(
  evaluationId: string,
  userId: string
): Promise<CrystallizedGateConfig> {
  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, evaluationId));

  if (!evaluation) throw new Error("Evaluation not found");

  // Gather current state to freeze
  const scores = await db
    .select().from(dimensionScores)
    .where(eq(dimensionScores.evaluationId, evaluationId));

  // Build the crystallized config from the current module + dimensions + lenses
  const config: CrystallizedGateConfig = {
    moduleId: (evaluation as any).moduleId || "",
    moduleName: (evaluation as any).moduleName || "Default",
    dimensions: scores.map((s) => ({
      name: s.dimensionName,
      score: s.score,
      rationale: s.rationale,
    })),
    lenses: [], // Will be populated from lens_notes
    weights: {}, // Will be populated from current weight config
    tolerances: {
      minimumScore: null,
      declineThreshold: null,
    },
    templateVersion: (evaluation as any).templateVersionSnapshot || "1.0.0",
    crystallizedAt: new Date().toISOString(),
  };

  // Get lens notes for this evaluation
  if (v2?.lensNotes) {
    try {
      const notes = await db
        .select().from(v2.lensNotes)
        .where(eq(v2.lensNotes.evaluationId, evaluationId));
      (config as any).lensNotesSnapshot = notes.map((n: any) => ({
        id: n.lensId,
        dimensionName: n.dimensionName,
        lensScore: n.lensScore,
        observation: n.observation,
      }));
    } catch { /* pre-migration */ }
  }

  // Write crystallization to gate_evaluations
  await db.update(gateEvaluations).set({
    gateStatus: "passed",
    evaluatedAt: new Date(),
    ...(v2 ? {
      crystallizedAt: new Date(),
      crystallizedConfig: config,
      crystallizedBy: userId,
      isCrystallized: true,
    } : {}),
  } as any).where(eq(gateEvaluations.id, evaluationId));

  return config;
}

/**
 * Break a crystallized gate. Requires admin role + justification.
 * Records the full prior state in crystal_break_log.
 * Resets gate to "in_progress" requiring fresh dual auth.
 */
export async function breakCrystal(
  evaluationId: string,
  userId: string,
  orgId: string,
  justification: string
): Promise<void> {
  if (!v2?.crystalBreakLog) {
    throw new Error("Crystal break requires v2 schema");
  }

  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, evaluationId));

  if (!evaluation) throw new Error("Evaluation not found");
  if (!(evaluation as any).isCrystallized) throw new Error("Gate is not crystallized");

  // Snapshot all current scores
  const scores = await db
    .select().from(dimensionScores)
    .where(eq(dimensionScores.evaluationId, evaluationId));

  // Snapshot all approvals
  const approvals = await db
    .select().from(gateApprovals)
    .where(eq(gateApprovals.evaluationId, evaluationId));

  // Record break event with full prior state
  await db.insert(v2.crystalBreakLog).values({
    evaluationId,
    gateCode: evaluation.gateCode,
    targetId: evaluation.targetId,
    brokenBy: userId,
    justification,
    priorCrystallizedConfig: (evaluation as any).crystallizedConfig,
    priorCompositeScore: evaluation.compositeScore,
    priorGateStatus: evaluation.gateStatus,
    priorScoresSnapshot: scores,
    priorApprovalsSnapshot: approvals,
  });

  // Reset gate to in_progress — requires fresh dual auth
  await db.update(gateEvaluations).set({
    gateStatus: "in_progress",
    crystallizedAt: null,
    crystallizedConfig: null,
    crystallizedBy: null,
    isCrystallized: false,
  } as any).where(eq(gateEvaluations.id, evaluationId));

  // Delete existing approvals (gate needs fresh dual auth)
  await db.delete(gateApprovals)
    .where(eq(gateApprovals.evaluationId, evaluationId));

  // Audit log
  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "crystal_broken",
    targetName: null,
    details: {
      evaluationId,
      gateCode: evaluation.gateCode,
      justification,
      priorScore: evaluation.compositeScore,
      priorStatus: evaluation.gateStatus,
    },
  });
}

/**
 * Get the effective methodology for a gate evaluation.
 * If crystallized → returns the frozen config.
 * If active → resolves the latest methodology.
 */
export async function resolveGateMethodology(
  evaluationId: string,
  gateCode: string,
  orgId: string
): Promise<{
  source: "crystallized" | "live";
  dimensions: any[];
  isCrystallized: boolean;
  gate?: any;
  activeModule?: any;
  templateVersion?: string;
}> {
  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, evaluationId));

  if (!evaluation) throw new Error("Evaluation not found");

  // If crystallized, return frozen config with flattened dimensions
  if ((evaluation as any).isCrystallized && (evaluation as any).crystallizedConfig) {
    const frozen = (evaluation as any).crystallizedConfig;
    return {
      source: "crystallized",
      dimensions: frozen.dimensions || frozen.gate?.dimensions || [],
      isCrystallized: true,
      gate: frozen.gate || frozen,
      activeModule: frozen.activeModule || null,
      templateVersion: frozen.templateVersion,
    };
  }

  // Otherwise resolve live methodology
  const methodology = await resolveMethodology(orgId);
  const gate = methodology.gates.find((g: any) => g.code === gateCode);

  // If a module was selected, use that module's dimensions
  const moduleId = (evaluation as any).moduleId;
  let activeModule = null;
  let dimensions: any[] = (gate as any)?.dimensions || [];

  if (moduleId && gate) {
    activeModule = gate.modules?.find((m: any) => m.id === moduleId);
    if (activeModule?.dimensions) {
      dimensions = activeModule.dimensions;
    }
  }

  return {
    source: "live",
    dimensions,
    isCrystallized: false,
    gate,
    activeModule,
    templateVersion: methodology.templateVersion || undefined,
  };
}

/**
 * Snapshot methodology when starting a new gate evaluation.
 * Records the template version so we know what was current at start time.
 * Does NOT crystallize — that happens on dual auth passage.
 */
export async function snapshotForEvaluation(
  orgId: string,
  moduleId: string | null
): Promise<{ templateVersion: string; moduleName: string | null }> {
  const methodology = await resolveMethodology(orgId);

  let moduleName: string | null = null;
  if (moduleId) {
    for (const gate of methodology.gates) {
      const mod = gate.modules.find((m) => m.id === moduleId);
      if (mod) { moduleName = mod.name; break; }
    }
  }

  return {
    templateVersion: methodology.templateVersion || "1.0.0",
    moduleName,
  };
}

// ── Helpers ────────────────────────────────────────────────────

function parseGatesConfig(config: any): GateDefinition[] {
  if (Array.isArray(config)) return config;
  if (config?.gates && Array.isArray(config.gates)) return config.gates;
  return GATES;
}

// ── Tier Gating ────────────────────────────────────────────────

export type FeatureFlag =
  | "multi_target" | "multi_user" | "custom_methodology"
  | "ai_scoring" | "ai_extraction" | "ai_narrative"
  | "cross_deal_analytics" | "template_authoring"
  | "lens_authoring" | "prompt_editor" | "module_authoring"
  | "break_crystal";

const TIER_FEATURES: Record<string, FeatureFlag[]> = {
  free: [],
  team: ["multi_target", "multi_user", "custom_methodology", "break_crystal"],
  intelligence: [
    "multi_target", "multi_user", "custom_methodology", "break_crystal",
    "ai_scoring", "ai_extraction", "ai_narrative",
  ],
  platform: [
    "multi_target", "multi_user", "custom_methodology", "break_crystal",
    "ai_scoring", "ai_extraction", "ai_narrative",
    "cross_deal_analytics", "template_authoring", "lens_authoring",
    "prompt_editor", "module_authoring",
  ],
};

export function hasFeature(tier: string, feature: FeatureFlag): boolean {
  return (TIER_FEATURES[tier] || []).includes(feature);
}

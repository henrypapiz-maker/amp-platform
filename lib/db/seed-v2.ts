// ═══════════════════════════════════════════════════════════════
// AMP v2 Seed Script
//
// Run AFTER the v1 seed (lib/db/seed.ts) and migration 0003.
// Populates: PE Platform Build template, G4 modules, evaluation
// lenses, and subscription records.
//
// Usage: npx tsx lib/db/seed-v2.ts
// ═══════════════════════════════════════════════════════════════

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import * as v2 from "./schema-v2";
import { GATES } from "@/lib/gates";
import { PE_PLATFORM_LENSES } from "@/lib/lenses/pe-platform-lenses";
import { G4_MODULES } from "@/lib/modules/g4-modules";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { ...schema, ...v2 } });

async function seedV2() {
  console.log("\n\u{1F331} Seeding AMP v2 data...\n");

  // ── Get existing org ────────────────────────────────────
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.name, "Alio Foundry"))
    .limit(1);

  if (!org) {
    console.error("\u274C Organization 'Alio Foundry' not found. Run v1 seed first.");
    process.exit(1);
  }

  const [admin] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "henry@aliofoundry.com"))
    .limit(1);

  console.log(`  Found org: ${org.name} (${org.id})`);

  // ── 1. Create PE Platform Build Template ────────────────
  console.log("\n  Creating PE Platform Build template...");

  const [template] = await db.insert(v2.methodologyTemplates).values({
    name: "PE Platform Build",
    slug: "pe-platform-build",
    archetype: "pe_platform",
    description: "Complete evaluation framework for mid-market PE firms acquiring platform companies. Overweights financial returns (G4) and management assessment (G5). Includes LBO returns analysis and exit optionality dimensions.",
    version: "1.0.0",
    gatesConfig: GATES, // Start with the base 8-gate waterfall
    personaSchema: {
      fields: [
        { key: "acquisitionThesis", label: "Fund Thesis", required: true },
        { key: "horizonBias", label: "Investment Horizon", required: true },
        { key: "riskTolerance", label: "Risk Tolerance", required: true },
        { key: "irrHurdle", label: "IRR Hurdle (1-5)", required: true },
        { key: "integrationPhilosophy", label: "Integration Approach", required: false },
        { key: "processMaturity", label: "Process Maturity (1-5)", required: false },
        { key: "primarySectors", label: "Target Sectors", required: false },
      ],
    },
    weightPropagationRules: [
      { condition: "acquisitionThesis === 'Capability Buy'", gateCode: "G1", dimensionName: "Capability Gap Fill", adjustment: 10, reason: "Capability Buy thesis" },
      { condition: "acquisitionThesis === 'Market Extension'", gateCode: "G2", dimensionName: "Market Growth Rate", adjustment: 10, reason: "Market Extension thesis" },
      { condition: "horizonBias?.includes('H1')", gateCode: "G4", dimensionName: "Valuation Attractiveness", adjustment: 15, reason: "H1 horizon bias" },
      { condition: "riskTolerance === 'Conservative'", gateCode: "G6", dimensionName: "Legal & Regulatory", adjustment: 10, reason: "Conservative risk tolerance" },
      { condition: "irrHurdle >= 4", gateCode: "G4", dimensionName: "Valuation Attractiveness", adjustment: 10, reason: "High IRR hurdle" },
    ],
    isPublished: true,
    isDefault: true,
    publishedAt: new Date(),
    authoredBy: "Alio Foundry",
    changeLog: [{ version: "1.0.0", date: new Date().toISOString(), changes: ["Initial release"] }],
  }).returning();

  console.log(`  \u2705 Template created: ${template.name} (${template.id})`);

  // ── 2. Create G4 Modules ────────────────────────────────
  console.log("\n  Creating G4 evaluation modules...");

  const moduleRecords = [];
  for (const mod of G4_MODULES) {
    const [record] = await db.insert(v2.evaluationModules).values({
      templateId: template.id,
      gateCode: mod.gateCode,
      name: mod.name,
      slug: mod.slug,
      description: mod.description,
      whenToUse: mod.whenToUse,
      whenNotToUse: mod.whenNotToUse,
      dimensionsConfig: mod.dimensions,
      evidenceArtifacts: mod.evidenceArtifacts,
      minimumScore: mod.minimumScore?.toString() || null,
      declineThreshold: mod.declineThreshold?.toString() || null,
      isDefault: mod.isDefault,
      source: "alio_foundry",
      authorName: "Alio Foundry",
    }).returning();

    moduleRecords.push(record);
    console.log(`  \u2705 Module: ${record.name} (${record.id})`);
  }

  // ── 3. Create Default Modules for Other Gates ───────────
  // Gates without specialized modules get a single "Default" module
  // that wraps the gate's static dimensions from gates.ts
  console.log("\n  Creating default modules for G0-G3, G5-G7...");

  for (const gate of GATES) {
    if (gate.code === "G4") continue; // Already has specialized modules

    const [record] = await db.insert(v2.evaluationModules).values({
      templateId: template.id,
      gateCode: gate.code,
      name: `${gate.name} \u2014 Standard`,
      slug: `${gate.code.toLowerCase()}-standard`,
      description: gate.purpose,
      whenToUse: `Default evaluation framework for ${gate.name}. Suitable for most acquisition targets.`,
      whenNotToUse: null,
      dimensionsConfig: gate.dimensions,
      evidenceArtifacts: gate.evidenceArtifacts,
      minimumScore: gate.minimumScore?.toString() || null,
      declineThreshold: gate.declineThreshold?.toString() || null,
      isDefault: true,
      source: "alio_foundry",
      authorName: "Alio Foundry",
    }).returning();

    console.log(`  \u2705 Default module: ${gate.code} \u2014 ${record.name}`);
  }

  // ── 4. Seed Evaluation Lenses ───────────────────────────
  console.log("\n  Creating evaluation lenses...");

  // Find the Standard Financial module for G4 lenses
  const standardFinancialModule = moduleRecords.find(
    (m) => m.slug === "standard-financial"
  );

  for (const lens of PE_PLATFORM_LENSES) {
    // Determine module scoping for G4 lenses
    let moduleId: string | null = null;
    if (lens.gateCode === "G4" && standardFinancialModule) {
      moduleId = standardFinancialModule.id;
    }

    await db.insert(v2.evaluationLenses).values({
      gateCode: lens.gateCode,
      dimensionName: lens.dimensionName,
      moduleId,
      name: lens.name,
      framework: lens.framework,
      guidance: lens.guidance,
      keyQuestions: lens.keyQuestions,
      evidenceNeeds: lens.evidenceNeeds,
      calibrationAnchors: lens.calibrationAnchors,
      blindSpots: lens.blindSpots,
      templateId: template.id,
      isDefault: lens.isDefault,
      source: "alio_foundry",
      authorName: "Alio Foundry",
    });

    console.log(`  \u2705 Lens: ${lens.gateCode} / ${lens.dimensionName} \u2014 ${lens.name}`);
  }

  // ── 5. Link Org to Template ─────────────────────────────
  console.log("\n  Linking organization to template...");

  await db.insert(v2.orgMethodology).values({
    orgId: org.id,
    templateId: template.id,
    templateVersion: "1.0.0",
    customGatesConfig: null, // No customizations yet \u2014 using upstream
    selectedBy: admin?.id,
  });

  console.log(`  \u2705 Org linked to PE Platform Build template`);

  // ── 6. Create Subscription (Free Tier) ──────────────────
  console.log("\n  Creating subscription record...");

  await db.insert(v2.subscriptions).values({
    orgId: org.id,
    tier: "team", // Demo org gets team tier for full features
    status: "active",
    maxUsers: 10,
    maxActiveTargets: 50,
    aiEnabled: false, // AI off by default
    customMethodology: true,
    crossDealAnalytics: true,
  });

  console.log(`  \u2705 Subscription: Team tier (demo)`);

  // ── 7. Seed Knowledge Base Articles ─────────────────────
  console.log("\n  Creating Knowledge Base articles...");

  const articles = [
    {
      title: "Understanding the 8-Gate Waterfall",
      slug: "understanding-8-gate-waterfall",
      category: "methodology",
      summary: "An overview of AMP's structured evaluation methodology and how targets progress from universe qualification through IC decision.",
      content: `# The 8-Gate Waterfall\n\nAMP evaluates acquisition targets through an 8-gate waterfall methodology. Each gate examines a distinct aspect of the target, building a comprehensive picture that culminates in an Investment Committee recommendation.\n\n## Gate Sequence\n\n**G0 \u2014 Universe Qualification** is a binary pass/fail filter. Targets that fail any dimension are removed from the pipeline immediately.\n\n**G1 \u2014 Strategic Alignment** maps the target against the acquirer's strategic model. This is where thesis fit, capability gaps, and competitive optionality are assessed.\n\n**G2 \u2014 Market & Competitive Position** evaluates the structural attractiveness of the target's market and its competitive positioning within it.\n\n**G3 \u2014 Business Model Compatibility** surfaces reinforcements, extensions, and conflicts between the acquirer's and target's business models.\n\n**G4 \u2014 Financial Profile & Valuation** is where the numbers tell their story. Different analytical modules are available depending on the target type.\n\n**G5 \u2014 Operational & Integration** assesses the complexity and cost of integrating the target.\n\n**G6 \u2014 Risk Assessment** systematically identifies and quantifies material risks.\n\n**G7 \u2014 IC Decision** synthesizes all prior gate outputs into a unified recommendation: PURSUE, CONDITIONAL, or PASS.`,
      relatedGates: ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"],
    },
    {
      title: "How Evaluation Lenses Work",
      slug: "how-evaluation-lenses-work",
      category: "methodology",
      summary: "Evaluation lenses provide multiple analytical frameworks for each dimension. Where lenses converge, confidence is high. Where they diverge, that's a flag worth investigating.",
      content: `# Multi-Lens Evaluation\n\nEach dimension in AMP can be evaluated through multiple lenses \u2014 structured analytical frameworks that examine the same question from different angles.\n\n## Why Multiple Lenses?\n\nA single analytical framework always has blind spots. A DCF valuation ignores what the market is willing to pay. Comparable transactions are backward-looking. An LBO model is leverage-dependent. By evaluating through multiple lenses and observing where they converge or diverge, you build a more robust assessment.\n\n## Convergence and Divergence\n\n**Strong convergence** means all lenses point to a similar score range. You can score with high confidence.\n\n**Partial convergence** means most lenses agree but one diverges. The divergent lens is highlighted \u2014 investigate why it sees something different.\n\n**Divergence** means lenses produce materially different assessments. This is valuable information, not a problem to solve. Document your reasoning for weighting one lens over another.\n\n## Per-Lens Notes\n\nYou can record observations for each lens without affecting the overall dimension score. These notes appear in the IC scorecard export and become part of the institutional evaluation record.`,
      relatedGates: ["G1", "G4", "G6"],
    },
    {
      title: "Scoring Consistency: Using Rubric Anchors",
      slug: "scoring-consistency-rubric-anchors",
      category: "scoring_playbook",
      summary: "How to use the 5-point rubric anchor system to ensure scoring consistency across analysts and deals.",
      content: `# Rubric-Anchored Scoring\n\nEvery dimension in AMP uses a 5-point rubric anchor system (0, 3, 5, 7, 10) to ensure scoring consistency.\n\n## The Anchor Scale\n\n| Score | Meaning | When to Use |\n|-------|---------|-------------|\n| 10 | Exceptional | Target exceeds all criteria; best-in-class |\n| 7 | Strong | Clear strength with minor gaps |\n| 5 | Adequate | Meets threshold; satisfactory but not differentiating |\n| 3 | Weak | Material concerns requiring mitigation |\n| 0 | Fail | Fundamental issue; may block deal progression |\n\n## Half-Point Increments\n\nYou can score at 0.5 increments (e.g., 6.5) when the target falls between two anchors. Always reference the nearest anchor in your rationale.\n\n## Writing Good Rationale\n\nA strong rationale:\n- References the specific rubric anchor the score maps to\n- Cites evidence from uploaded documents\n- Notes which evaluation lenses informed the assessment\n- Acknowledges uncertainty where evidence is limited\n\nA weak rationale: "Looks good" or "Score of 7 because it's above average." These don't create institutional knowledge.`,
      relatedGates: [],
      relatedDimensions: [],
    },
    {
      title: "Gate Crystallization: How Immutability Works",
      slug: "gate-crystallization",
      category: "methodology",
      summary: "When a gate passes dual authorization, its methodology and scores are crystallized \u2014 frozen against future template changes. Here's how it works and how to break the crystal when needed.",
      content: `# Gate Crystallization\n\nWhen a gate evaluation passes dual authorization (two independent approvals with no rejections), it crystallizes. This means the entire evaluation \u2014 the module selection, dimensions, scores, lens notes, weights, and methodology version \u2014 is frozen.\n\n## Why Crystallize?\n\nA deal evaluation that takes 4 months should produce consistent results. If the methodology template is updated in month 3, gates scored in month 1 should not retroactively change. Crystallization ensures that each gate is evaluated against the methodology that was current when it was scored.\n\n## What Freezes\n\n- The selected evaluation module and its dimensions\n- All dimension scores and rationale\n- All lens notes and observations\n- The effective weights at time of scoring\n- The tolerance thresholds (minimum score, decline threshold)\n- The template version\n\n## Breaking the Crystal\n\nIn rare cases, material new information may require re-evaluating a crystallized gate. An admin can break the crystal, which:\n- Records the full prior state (scores, approvals, methodology) in a permanent audit log\n- Resets the gate to "in progress"\n- Deletes existing approvals \u2014 the gate needs fresh dual authorization\n- Creates an audit entry documenting who broke it and why\n\nBreaking crystal requires a written justification of at least 20 characters.`,
      relatedGates: [],
    },
  ];

  for (const article of articles) {
    await db.insert(v2.knowledgeBaseArticles).values({
      ...article,
      isPublished: true,
      authorName: "Alio Foundry",
      publishedAt: new Date(),
    });
    console.log(`  \u2705 Article: ${article.title}`);
  }

  // ── Summary ─────────────────────────────────────────────
  console.log("\n\u2705 v2 Seed complete!");
  console.log("  \u2022 1 methodology template (PE Platform Build)");
  console.log("  \u2022 10 evaluation modules (3 specialized G4 + 7 default gates)");
  console.log(`  \u2022 ${PE_PLATFORM_LENSES.length} evaluation lenses`);
  console.log("  \u2022 1 org methodology linkage");
  console.log("  \u2022 1 subscription record (Team tier)");
  console.log("  \u2022 4 Knowledge Base articles");
  console.log("\n  Ready to test the v2 evaluation flow!\n");
}

seedV2().catch((err) => {
  console.error("\u274C v2 Seed failed:", err);
  process.exit(1);
});

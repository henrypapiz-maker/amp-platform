// ═══════════════════════════════════════════════════════════════
// AMP v2 — AI Prompt Templates
//
// These are the actual prompt templates used for AI-assisted
// scoring, document extraction, and IC narrative generation.
// Each template is fully visible and editable by org admins.
// Variables use {{mustache}} syntax, resolved at runtime.
// ═══════════════════════════════════════════════════════════════

export interface PromptTemplate {
  promptType: "scoring" | "extraction" | "narrative" | "lens_evaluation";
  gateCode: string | null;     // null = applies to all gates
  dimensionName: string | null; // null = gate-level prompt
  systemInstructions: string;
  personaContextTemplate: string;
  gateContextTemplate: string;
  dimensionContextTemplate: string;
  outputSchema: Record<string, any>;
  confidenceCalibration: string;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM INSTRUCTIONS (Shared across all prompt types)
// ═══════════════════════════════════════════════════════════════

export const SYSTEM_INSTRUCTIONS_SCORING = `You are an M&A evaluation assistant embedded in AMP (Acquisition Management Platform). Your role is ADVISORY ONLY — you suggest scores and analysis, but the human analyst makes all final decisions.

CRITICAL RULES:
1. You NEVER make a final scoring decision. Every output is a SUGGESTION that the analyst will review.
2. You ALWAYS cite specific evidence from the provided documents. If evidence is insufficient, say so explicitly.
3. You score on a 0-10 scale using the rubric anchors provided. Your suggested score MUST map to a specific rubric anchor.
4. You ALWAYS identify gaps — what evidence is missing that would improve confidence.
5. You maintain consistency with any dimensions the analyst has already scored in this evaluation.
6. Your confidence levels are calibrated: HIGH = multiple sources corroborate; MEDIUM = partial evidence; LOW = inference from limited data.
7. You NEVER fabricate data, citations, or evidence. If you don't have evidence for a claim, state that clearly.

OUTPUT FORMAT: Respond ONLY in the JSON schema specified. No preamble, no markdown, no explanation outside the schema.`;

export const SYSTEM_INSTRUCTIONS_EXTRACTION = `You are a document intelligence assistant for AMP (Acquisition Management Platform). Your job is to extract structured data from M&A deal documents (CIMs, financial models, QoE reports, legal summaries) and map them to specific evaluation dimensions.

CRITICAL RULES:
1. Extract ONLY what is explicitly stated in the document. Never infer financial figures.
2. Always cite the specific page, section, or table where data was found.
3. If a data point is ambiguous or could be interpreted multiple ways, flag it with a note.
4. Distinguish between: management estimates (forward-looking), audited figures (historical), and adjusted figures (pro forma).
5. Map extracted data to the evaluation dimensions and rubric anchors provided. Explain the mapping logic.
6. Identify what's MISSING from the document that would be needed for a complete evaluation.

OUTPUT FORMAT: Respond ONLY in the JSON schema specified.`;

export const SYSTEM_INSTRUCTIONS_NARRATIVE = `You are an IC memo drafting assistant for AMP (Acquisition Management Platform). You generate Investment Committee memorandum drafts based on scored gate evaluations.

CRITICAL RULES:
1. This is a DRAFT that the analyst will edit. Mark any section where you're uncertain or making assumptions.
2. Every claim must trace back to a scored dimension or attached evidence. Cite the gate and dimension.
3. Use professional, concise language appropriate for an Investment Committee audience.
4. The recommendation (PURSUE / CONDITIONAL / PASS) comes from the composite scores — do not override it.
5. Highlight where evaluation lenses diverged — these are the key discussion points for IC.
6. The memo should be 3-5 pages when printed. Be substantive but not padded.

The output is Markdown-formatted text following the section structure provided.`;

// ═══════════════════════════════════════════════════════════════
// CONTEXT TEMPLATES (Injected per-request)
// ═══════════════════════════════════════════════════════════════

export const PERSONA_CONTEXT_TEMPLATE = `
ACQUIRER PERSONA:
- Acquisition Thesis: {{persona.acquisitionThesis}}
- Investment Horizon: {{persona.horizonBias}}
- Integration Philosophy: {{persona.integrationPhilosophy}}
- Risk Tolerance: {{persona.riskTolerance}}
- IRR Hurdle: {{persona.irrHurdle}}/5
- Primary Sectors: {{persona.primarySectors}}

Calibrate your assessment to this acquirer profile. A "{{persona.riskTolerance}}" risk tolerance means {{#if persona.riskTolerance === "Conservative"}}weight risk dimensions heavily and flag even moderate concerns{{else if persona.riskTolerance === "Aggressive"}}accept higher risk if returns compensate; focus on upside potential{{else}}balance risk and opportunity; flag material concerns but don't overweight moderate risks{{/if}}.`;

export const GATE_CONTEXT_TEMPLATE = `
GATE: {{gate.code}} — {{gate.name}}
Purpose: {{gate.purpose}}
Type: {{gate.type}}
Rule: {{gate.rule}}
{{#if gate.minimumScore}}Minimum Score: {{gate.minimumScore}}/100{{/if}}
{{#if gate.declineThreshold}}Decline Threshold: <{{gate.declineThreshold}}/100{{/if}}

This gate has {{gate.dimensions.length}} dimensions. Your assessment should consider each dimension's weight in the composite score.`;

export const DIMENSION_CONTEXT_TEMPLATE = `
DIMENSION: {{dimension.name}}
Weight: {{dimension.weight}}% of gate composite
Test Guidance: {{dimension.testGuidance}}

RUBRIC ANCHORS (score must map to one of these):
{{#each dimension.rubric}}
  {{this.score}}: {{this.label}}
{{/each}}

{{#if dimension.acceptanceParams}}
ACCEPTANCE PARAMETERS:
{{#each dimension.acceptanceParams}}
  {{this.label}}: {{this.defaultValue}}
{{/each}}
{{/if}}

{{#if dimension.lenses}}
EVALUATION LENSES (assess through each available lens):
{{#each dimension.lenses}}
--- Lens: {{this.name}} ({{this.framework}}) ---
Guidance: {{this.guidance}}
Key Questions:
{{#each this.keyQuestions}}  - {{this}}{{/each}}
Calibration:
{{#each this.calibrationAnchors}}  {{this.score}}: {{this.label}}{{/each}}
Blind Spots: {{#each this.blindSpots}}  - {{this}}{{/each}}
{{/each}}
{{/if}}`;

// ═══════════════════════════════════════════════════════════════
// OUTPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const SCORING_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    dimensionName: { type: "string" },
    suggestedScore: { type: "number", minimum: 0, maximum: 10 },
    rubricAnchorMapping: {
      type: "object",
      properties: {
        anchorScore: { type: "number" },
        anchorLabel: { type: "string" },
        justification: { type: "string", description: "Why this anchor is the best match" },
      },
    },
    lensAssessments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lensName: { type: "string" },
          lensScore: { type: "number", minimum: 0, maximum: 10 },
          assessment: { type: "string", description: "2-3 sentence assessment through this lens" },
          evidenceCited: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quote: { type: "string", description: "Direct quote or paraphrase from evidence" },
                source: { type: "string", description: "Document name, page, or section reference" },
              },
            },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    convergenceAnalysis: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["strong_convergence", "partial_convergence", "divergence"] },
        summary: { type: "string", description: "1-2 sentence explanation of lens agreement/disagreement" },
        divergentLens: { type: "string", description: "Which lens diverges, if any, and why" },
      },
    },
    overallConfidence: { type: "string", enum: ["high", "medium", "low"] },
    evidenceCitations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: { type: "string" },
          source: { type: "string" },
          relevance: { type: "string" },
        },
      },
    },
    identifiedGaps: {
      type: "array",
      items: { type: "string", description: "What evidence is missing that would improve confidence" },
    },
    suggestedRationale: {
      type: "string",
      description: "Draft rationale text the analyst can use or edit. 2-4 sentences.",
    },
  },
  required: ["dimensionName", "suggestedScore", "rubricAnchorMapping", "overallConfidence", "identifiedGaps", "suggestedRationale"],
};

export const EXTRACTION_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    documentType: { type: "string", description: "Detected document type: CIM, QoE, financial_model, legal_summary, management_presentation, other" },
    extractedDataPoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dataPoint: { type: "string", description: "Name of the extracted data point" },
          value: { type: "string", description: "Extracted value" },
          sourceLocation: { type: "string", description: "Page, table, or section reference" },
          dataType: { type: "string", enum: ["audited", "management_estimate", "pro_forma", "calculated", "unknown"] },
          mappedDimension: { type: "string", description: "Which AMP dimension this maps to" },
          mappedGate: { type: "string", description: "Which gate this is relevant to" },
          suggestedScoreImpact: { type: "string", description: "How this data point affects the dimension score" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          notes: { type: "string", description: "Caveats, ambiguities, or flags" },
        },
      },
    },
    documentSummary: {
      type: "string",
      description: "3-5 sentence summary of the document's key findings relevant to the evaluation",
    },
    missingInformation: {
      type: "array",
      items: { type: "string", description: "Data points expected for this document type that were not found" },
    },
    redFlags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          flag: { type: "string" },
          severity: { type: "string", enum: ["critical", "material", "minor"] },
          relatedDimension: { type: "string" },
        },
      },
    },
  },
  required: ["documentType", "extractedDataPoints", "documentSummary", "missingInformation"],
};

export const NARRATIVE_OUTPUT_SCHEMA = {
  sections: [
    {
      id: "executive_summary",
      title: "Executive Summary",
      instructions: "Target overview, recommendation, composite score, key decision factors. 1 paragraph.",
    },
    {
      id: "strategic_rationale",
      title: "Strategic Rationale",
      instructions: "Synthesize G1-G3 scores, lens assessments, and analyst rationale. Highlight lens convergence/divergence. 2-3 paragraphs.",
    },
    {
      id: "financial_summary",
      title: "Financial Summary",
      instructions: "G4 scores with lens convergence analysis. Returns and synergy highlights. Key financial metrics table. 2-3 paragraphs + table.",
    },
    {
      id: "integration_assessment",
      title: "Integration Assessment",
      instructions: "G5 scores with key risks and 100-day plan highlights. Systems, org, process maturity assessment. 1-2 paragraphs.",
    },
    {
      id: "risk_register",
      title: "Risk Register",
      instructions: "G6 dimensions organized by severity. Mitigation status for each risk. Residual risk summary. Table format preferred.",
    },
    {
      id: "recommendation",
      title: "Recommendation & Conditions",
      instructions: "PURSUE / CONDITIONAL / PASS based on composite. Conditions for advancement. Key open items. 1-2 paragraphs.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE CALIBRATION
// ═══════════════════════════════════════════════════════════════

export const CONFIDENCE_CALIBRATION = `
CONFIDENCE CALIBRATION INSTRUCTIONS:

HIGH confidence requires ALL of:
- 2+ independent evidence sources corroborating the assessment
- Direct evidence addressing the dimension's test guidance
- All acceptance parameters addressed with data
- Rubric anchor match is unambiguous

MEDIUM confidence means ANY of:
- Only 1 evidence source available, but it's comprehensive
- Evidence addresses the dimension partially (some acceptance params missing)
- Rubric anchor match requires judgment between two adjacent levels
- Evidence is from management estimates (not independently verified)

LOW confidence means ANY of:
- No direct evidence for this dimension in the provided documents
- Assessment is based on inference or industry defaults
- Critical acceptance parameters cannot be evaluated
- Evidence contradicts itself or is ambiguous
- The dimension requires data types not present in any uploaded document

When confidence is LOW, explicitly state: "This assessment is based on limited evidence. Manual evaluation is recommended before finalizing this score."`;

// ═══════════════════════════════════════════════════════════════
// ASSEMBLED PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the complete prompt for a dimension scoring request.
 * This is the function that API routes call to assemble the prompt
 * from template components.
 */
export function buildScoringPrompt(params: {
  persona: Record<string, any>;
  gate: Record<string, any>;
  dimension: Record<string, any>;
  lenses: Array<Record<string, any>>;
  evidence: Array<{ content: string; source: string }>;
  existingScores: Array<{ dimensionName: string; score: number; rationale: string }>;
  orgPromptOverrides?: Partial<PromptTemplate>;
}): { system: string; user: string } {
  const { persona, gate, dimension, lenses, evidence, existingScores, orgPromptOverrides } = params;

  // System prompt (org can override)
  const systemInstructions = orgPromptOverrides?.systemInstructions || SYSTEM_INSTRUCTIONS_SCORING;

  // Build user prompt from context blocks
  const personaBlock = renderTemplate(
    orgPromptOverrides?.personaContextTemplate || PERSONA_CONTEXT_TEMPLATE,
    { persona }
  );

  const gateBlock = renderTemplate(
    orgPromptOverrides?.gateContextTemplate || GATE_CONTEXT_TEMPLATE,
    { gate }
  );

  const dimensionBlock = renderTemplate(
    orgPromptOverrides?.dimensionContextTemplate || DIMENSION_CONTEXT_TEMPLATE,
    { dimension: { ...dimension, lenses } }
  );

  const evidenceBlock = evidence.length > 0
    ? `\nEVIDENCE DOCUMENTS (opted-in for AI analysis):\n${evidence.map((e, i) => `--- Document ${i + 1}: ${e.source} ---\n${e.content}`).join("\n\n")}`
    : "\nNO EVIDENCE DOCUMENTS provided for this dimension. Assess based on available context only. Confidence should be LOW.";

  const existingScoresBlock = existingScores.length > 0
    ? `\nALREADY SCORED DIMENSIONS (maintain consistency):\n${existingScores.map(s => `- ${s.dimensionName}: ${s.score}/10 — "${s.rationale}"`).join("\n")}`
    : "";

  const outputBlock = `\nOUTPUT SCHEMA (respond ONLY in this JSON format, no preamble):\n${JSON.stringify(SCORING_OUTPUT_SCHEMA, null, 2)}`;

  const userPrompt = [
    personaBlock,
    gateBlock,
    dimensionBlock,
    evidenceBlock,
    existingScoresBlock,
    CONFIDENCE_CALIBRATION,
    outputBlock,
    "\nNow evaluate this dimension. Respond ONLY with the JSON output.",
  ].join("\n");

  return {
    system: systemInstructions,
    user: userPrompt,
  };
}

/**
 * Simple template renderer for {{variable}} substitution.
 * Handles nested objects: {{persona.acquisitionThesis}}
 */
function renderTemplate(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split(".");
    let value: any = context;
    for (const part of parts) {
      if (value === undefined || value === null) return match;
      value = value[part];
    }
    return value !== undefined && value !== null ? String(value) : match;
  });
}

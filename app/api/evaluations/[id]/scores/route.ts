// ═══════════════════════════════════════════════════════════════
// AMP v2 — /api/evaluations/[id]/scores
// Updated to:
//   - Resolve rubrics and weights from template engine
//   - Use crystallized methodology if gate is frozen
//   - Support lens note save/load
//   - Calculate composite score with resolved weights
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  gateEvaluations, dimensionScores, targets, auditLog,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { resolveGateMethodology } from "@/lib/template-engine";
import { getGate } from "@/lib/gates";

// Try lens notes table
let lensNotesTable: any = null;
let lensesTable: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v2 = require("@/lib/db/schema-v2");
  lensNotesTable = v2.lensNotes;
  lensesTable = v2.evaluationLenses;
} catch { /* pre-migration */ }

// ── GET: Scores + Rubrics + Lenses for an evaluation ──────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scores = await db
    .select().from(dimensionScores)
    .where(eq(dimensionScores.evaluationId, params.id));

  // ── Resolve methodology ─────────────────────────────────
  let dimensions: any[] = [];
  let isCrystallized = false;

  try {
    const methodology = await resolveGateMethodology(
      params.id,
      evaluation.gateCode,
      orgId
    );
    dimensions = methodology.dimensions || [];
    isCrystallized = methodology.isCrystallized || false;
  } catch {
    // Fallback to static
    const staticGate = getGate(evaluation.gateCode);
    if (staticGate) dimensions = staticGate.dimensions;
  }

  // ── Merge scores with dimension metadata ────────────────
  const enrichedScores = scores.map((s) => {
    const dimDef = dimensions.find((d: any) => d.name === s.dimensionName);
    return {
      ...s,
      weight: dimDef?.weight || 0,
      rubric: dimDef?.rubric || [],
      testGuidance: dimDef?.testGuidance || null,
      acceptanceParams: dimDef?.acceptanceParams || [],
    };
  });

  // ── Load lenses for each dimension ──────────────────────
  const lensesByDimension: Record<string, any[]> = {};
  const notesByLens: Record<string, any> = {};

  if (lensesTable) {
    try {
      const lenses = await db
        .select()
        .from(lensesTable)
        .where(eq(lensesTable.gateCode, evaluation.gateCode));

      for (const lens of lenses) {
        const key = lens.dimensionName;
        if (!lensesByDimension[key]) lensesByDimension[key] = [];
        lensesByDimension[key].push(lens);
      }

      // Load lens notes
      if (lensNotesTable) {
        const notes = await db
          .select()
          .from(lensNotesTable)
          .where(eq(lensNotesTable.evaluationId, params.id));

        for (const note of notes) {
          notesByLens[note.lensId] = note;
        }
      }
    } catch { /* lenses not available */ }
  }

  // ── Composite score calculation ─────────────────────────
  const totalWeight = enrichedScores.reduce((sum, s) => sum + (s.weight || 0), 0);
  let compositeScore: number | null = null;

  const scoredDimensions = enrichedScores.filter((s) => s.score !== null);
  if (scoredDimensions.length > 0 && totalWeight > 0) {
    const weightedSum = scoredDimensions.reduce(
      (sum, s) => sum + (Number(s.score) || 0) * (s.weight || 0),
      0
    );
    compositeScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  return NextResponse.json({
    evaluationId: params.id,
    gateCode: evaluation.gateCode,
    gateStatus: evaluation.gateStatus,
    isCrystallized,
    moduleName: (evaluation as any).moduleName || null,
    compositeScore,
    scores: enrichedScores,
    lensesByDimension,
    notesByLens,
    progress: {
      scored: scoredDimensions.length,
      total: enrichedScores.length,
    },
  });
}

// ── PATCH: Update a dimension score ───────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "score_dimension")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;

  // Check crystallization
  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if ((evaluation as any).isCrystallized) {
    return NextResponse.json(
      { error: "Gate is crystallized. Break crystal to modify scores." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { dimensionName, score, rationale } = body;

  if (!dimensionName) {
    return NextResponse.json({ error: "dimensionName required" }, { status: 400 });
  }

  // Validate score range
  if (score !== null && score !== undefined) {
    if (score < 0 || score > 10) {
      return NextResponse.json({ error: "Score must be 0-10" }, { status: 400 });
    }
  }

  // FIX-4: Snapshot prior score before overwrite
  const [priorScore] = await db
    .select()
    .from(dimensionScores)
    .where(
      and(
        eq(dimensionScores.evaluationId, params.id),
        eq(dimensionScores.dimensionName, dimensionName)
      )
    )
    .limit(1);

  let scoreHistory: any[] = ((priorScore as any)?.scoreHistory as any[]) || [];
  if (priorScore?.score !== null && priorScore?.score !== undefined) {
    scoreHistory = [
      ...scoreHistory,
      {
        score: priorScore.score,
        rationale: priorScore.rationale,
        scoredBy: priorScore.confirmedBy,
        scoredAt: priorScore.confirmedAt?.toISOString?.() || new Date().toISOString(),
      },
    ];
  }

  // Update
  const [updated] = await db
    .update(dimensionScores)
    .set({
      score: score?.toString() || null,
      rationale: rationale || null,
      confirmedBy: userId,
      confirmedAt: new Date(),
      scoreHistory: scoreHistory.length > 0 ? scoreHistory : undefined,
    } as any)
    .where(
      and(
        eq(dimensionScores.evaluationId, params.id),
        eq(dimensionScores.dimensionName, dimensionName)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Dimension not found" }, { status: 404 });
  }

  // Recalculate composite
  const allScores = await db
    .select().from(dimensionScores)
    .where(eq(dimensionScores.evaluationId, params.id));

  let dimensions: any[] = [];
  try {
    const methodology = await resolveGateMethodology(params.id, evaluation.gateCode, orgId);
    dimensions = methodology.dimensions || [];
  } catch {
    const staticGate = getGate(evaluation.gateCode);
    if (staticGate) dimensions = staticGate.dimensions;
  }

  const totalWeight = dimensions.reduce((sum: number, d: any) => sum + (d.weight || 0), 0);
  const scored = allScores.filter((s) => s.score !== null);
  let compositeScore: number | null = null;

  if (scored.length > 0 && totalWeight > 0) {
    const weightedSum = scored.reduce((sum, s) => {
      const dim = dimensions.find((d: any) => d.name === s.dimensionName);
      return sum + (Number(s.score) || 0) * (dim?.weight || 0);
    }, 0);
    compositeScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  // Update evaluation composite
  await db.update(gateEvaluations)
    .set({ compositeScore: compositeScore?.toString() || null })
    .where(eq(gateEvaluations.id, params.id));

  // Audit
  const [target] = evaluation.targetId
    ? await db.select().from(targets).where(eq(targets.id, evaluation.targetId))
    : [null];

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "score_updated",
    targetName: target?.name,
    details: {
      evaluationId: params.id,
      gateCode: evaluation.gateCode,
      dimensionName,
      score,
      compositeScore,
    },
  });

  return NextResponse.json({
    ...updated,
    compositeScore,
  });
}

// ── POST: Save lens note ──────────────────────────────────────
// Separate endpoint for lens notes to keep the scoring PATCH clean
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!lensNotesTable) {
    return NextResponse.json({ error: "Lens notes not available" }, { status: 404 });
  }

  const userId = (session.user as any).id;

  // Check crystallization
  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if ((evaluation as any).isCrystallized) {
    return NextResponse.json(
      { error: "Gate is crystallized. Lens notes are frozen." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { lensId, content } = body;

  if (!lensId) {
    return NextResponse.json({ error: "lensId required" }, { status: 400 });
  }

  // Upsert lens note
  const existingResult = await db
    .select()
    .from(lensNotesTable)
    .where(
      and(
        eq(lensNotesTable.evaluationId, params.id),
        eq(lensNotesTable.lensId, lensId)
      )
    )
    .limit(1);
  const existing = (existingResult as any[])[0];

  if (existing) {
    const updatedResult = await db
      .update(lensNotesTable)
      .set({ observation: content, updatedBy: userId, updatedAt: new Date() })
      .where(eq(lensNotesTable.id, existing.id))
      .returning();
    const updated = (updatedResult as any[])[0];

    return NextResponse.json(updated);
  }

  const result = await db
    .insert(lensNotesTable)
    .values({
      evaluationId: params.id,
      lensId,
      dimensionName: body.dimensionName || "",
      observation: content,
      authorId: userId,
    })
    .returning();
  const created = (result as any[])[0];

  return NextResponse.json(created, { status: 201 });
}

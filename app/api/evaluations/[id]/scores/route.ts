import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dimensionScores, gateEvaluations, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { getGate } from "@/lib/gates";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scores = await db
    .select()
    .from(dimensionScores)
    .where(eq(dimensionScores.evaluationId, params.id));

  return NextResponse.json(scores);
}

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

  const body = await req.json();
  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;

  // Update individual dimension score
  const { dimensionName, score, rationale } = body;

  const [updated] = await db
    .update(dimensionScores)
    .set({
      score: score?.toString(),
      rationale,
      confirmedBy: userId,
      confirmedAt: new Date(),
    })
    .where(
      and(
        eq(dimensionScores.evaluationId, params.id),
        eq(dimensionScores.dimensionName, dimensionName)
      )
    )
    .returning();

  // Recalculate gate composite score
  const allScores = await db
    .select()
    .from(dimensionScores)
    .where(eq(dimensionScores.evaluationId, params.id));

  const [evaluation] = await db
    .select()
    .from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  const gate = getGate(evaluation.gateCode);
  if (gate) {
    let compositeScore = 0;
    let totalWeight = 0;

    for (const dim of gate.dimensions) {
      const dimScore = allScores.find((s) => s.dimensionName === dim.name);
      if (dimScore?.score) {
        const scoreVal = Number(dimScore.score);
        compositeScore += scoreVal * (dim.weight / 100);
        totalWeight += dim.weight / 100;
      }
    }

    // Normalize to 100 scale (scores are 0-10, we want 0-100)
    const normalizedScore = totalWeight > 0 ? (compositeScore / totalWeight) * 10 : 0;

    await db.update(gateEvaluations)
      .set({ compositeScore: normalizedScore.toFixed(2) })
      .where(eq(gateEvaluations.id, params.id));
  }

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "score_updated",
    details: { evaluationId: params.id, dimensionName, score },
  });

  return NextResponse.json(updated);
}

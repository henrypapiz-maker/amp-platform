import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gateEvaluations, dimensionScores, targets, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { getGate } from "@/lib/gates";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "score_dimension")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { targetId, gateCode } = body;
  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;

  // Check if evaluation already exists
  const existing = await db
    .select()
    .from(gateEvaluations)
    .where(
      and(
        eq(gateEvaluations.targetId, targetId),
        eq(gateEvaluations.gateCode, gateCode)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  // Create new evaluation
  const [evaluation] = await db.insert(gateEvaluations).values({
    targetId,
    gateCode,
    gateStatus: "in_progress",
    evaluatedBy: userId,
  }).returning();

  // Create dimension score placeholders
  const gate = getGate(gateCode);
  if (gate) {
    await db.insert(dimensionScores).values(
      gate.dimensions.map((d) => ({
        evaluationId: evaluation.id,
        dimensionName: d.name,
      }))
    );
  }

  // Update target gate if this is a new highest gate
  const [target] = await db.select().from(targets).where(eq(targets.id, targetId));
  const gateNum = parseInt(gateCode.replace("G", ""));
  if (target && gateNum >= (target.currentGate || 0)) {
    await db.update(targets)
      .set({ currentGate: gateNum, status: gateNum > 0 ? "inflight" : target.status, updatedAt: new Date() })
      .where(eq(targets.id, targetId));
  }

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "evaluation_started",
    targetName: target?.name,
    details: { targetId, gateCode },
  });

  return NextResponse.json(evaluation, { status: 201 });
}

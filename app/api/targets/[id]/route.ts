import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { targets, auditLog, gateEvaluations, dimensionScores, evidenceLinks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [target] = await db
    .select()
    .from(targets)
    .where(eq(targets.id, params.id))
    .limit(1);

  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get gate evaluations with scores
  const evaluations = await db
    .select()
    .from(gateEvaluations)
    .where(eq(gateEvaluations.targetId, params.id));

  const evalWithScores = await Promise.all(
    evaluations.map(async (ev) => {
      const scores = await db
        .select()
        .from(dimensionScores)
        .where(eq(dimensionScores.evaluationId, ev.id));
      const evidence = await db
        .select()
        .from(evidenceLinks)
        .where(eq(evidenceLinks.evaluationId, ev.id));
      return { ...ev, scores, evidence };
    })
  );

  return NextResponse.json({ ...target, evaluations: evalWithScores });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "edit_target")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  const updateData: any = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.sector !== undefined) updateData.sector = body.sector;
  if (body.revenue !== undefined) updateData.revenue = body.revenue;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.currentGate !== undefined) updateData.currentGate = body.currentGate;
  if (body.compositeScore !== undefined) updateData.compositeScore = body.compositeScore;
  if (body.outcome !== undefined) updateData.outcome = body.outcome;
  // FIX-5: Deal-level persona overrides
  if (body.personaOverrides !== undefined) updateData.personaOverrides = body.personaOverrides;
  // FIX-6: Custom dimensions per deal
  if (body.customDimensions !== undefined) updateData.customDimensions = body.customDimensions;

  const [updated] = await db
    .update(targets)
    .set(updateData)
    .where(and(eq(targets.id, params.id), eq(targets.orgId, orgId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "target_updated",
    targetName: updated.name,
    details: { targetId: updated.id, changes: Object.keys(updateData) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "delete_target")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  const [deleted] = await db
    .delete(targets)
    .where(and(eq(targets.id, params.id), eq(targets.orgId, orgId)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "target_deleted",
    targetName: deleted.name,
    details: { targetId: deleted.id },
  });

  return NextResponse.json({ success: true });
}

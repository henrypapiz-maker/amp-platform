import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  gateApprovals, gateEvaluations, gateTolerances,
  targets, auditLog
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { GATES } from "@/lib/gates";

// GET — fetch approvals for an evaluation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const approvals = await db
    .select()
    .from(gateApprovals)
    .where(eq(gateApprovals.evaluationId, params.id))
    .orderBy(gateApprovals.createdAt);

  // Get the evaluation to find tolerance config
  const [evaluation] = await db
    .select()
    .from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get org tolerance config for this gate
  const orgId = (session.user as any).orgId;
  const [tolerance] = await db
    .select()
    .from(gateTolerances)
    .where(
      and(
        eq(gateTolerances.orgId, orgId),
        eq(gateTolerances.gateCode, evaluation.gateCode)
      )
    )
    .limit(1);

  // Default gate config from definitions
  const gateDef = GATES.find((g) => g.code === evaluation.gateCode);
  const requiredApprovals = tolerance?.requiredApprovals || 2;
  const approverRoles = tolerance?.approverRoles || ["admin", "analyst"];

  const approveCount = approvals.filter((a) => a.decision === "approve").length;
  const rejectCount = approvals.filter((a) => a.decision === "reject").length;

  return NextResponse.json({
    approvals,
    config: {
      requiredApprovals,
      approverRoles,
      minimumScore: tolerance?.minimumScore
        ? Number(tolerance.minimumScore)
        : gateDef?.minimumScore || null,
      declineThreshold: tolerance?.declineThreshold
        ? Number(tolerance.declineThreshold)
        : gateDef?.declineThreshold || null,
    },
    summary: {
      approveCount,
      rejectCount,
      totalRequired: requiredApprovals,
      canAdvance: approveCount >= requiredApprovals && rejectCount === 0,
    },
  });
}

// POST — submit an approval or rejection
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "approve_gate") && !hasPermission(role, "score_dimension")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;
  const body = await req.json();
  const { decision, rationale } = body;

  if (!["approve", "reject", "conditional"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision. Must be: approve, reject, conditional" }, { status: 400 });
  }

  // Get evaluation
  const [evaluation] = await db
    .select()
    .from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  if (!evaluation) return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });

  // Check this user hasn't already approved this evaluation
  const existingApprovals = await db
    .select()
    .from(gateApprovals)
    .where(eq(gateApprovals.evaluationId, params.id));

  const alreadyApproved = existingApprovals.find((a) => a.userId === userId);
  if (alreadyApproved) {
    return NextResponse.json(
      { error: "You have already submitted an approval decision for this gate." },
      { status: 409 }
    );
  }

  // Insert approval
  const [approval] = await db.insert(gateApprovals).values({
    evaluationId: params.id,
    userId,
    decision,
    rationale: rationale || null,
  }).returning();

  // Check if we've reached required approvals
  const allApprovals = [...existingApprovals, approval];
  const approveCount = allApprovals.filter((a) => a.decision === "approve").length;
  const rejectCount = allApprovals.filter((a) => a.decision === "reject").length;

  // Get tolerance config
  const [tolerance] = await db
    .select()
    .from(gateTolerances)
    .where(
      and(
        eq(gateTolerances.orgId, orgId),
        eq(gateTolerances.gateCode, evaluation.gateCode)
      )
    )
    .limit(1);

  const requiredApprovals = tolerance?.requiredApprovals || 2;

  // Auto-update gate status if threshold met
  let newStatus = evaluation.gateStatus;
  if (rejectCount > 0) {
    newStatus = "failed";
  } else if (approveCount >= requiredApprovals) {
    newStatus = "passed";
  }

  if (newStatus !== evaluation.gateStatus) {
    await db.update(gateEvaluations)
      .set({ gateStatus: newStatus, evaluatedAt: new Date() })
      .where(eq(gateEvaluations.id, params.id));

    // If passed, update target's current gate to next gate
    if (newStatus === "passed" && evaluation.targetId) {
      const gateNum = parseInt(evaluation.gateCode.replace("G", ""));
      const [target] = await db.select().from(targets).where(eq(targets.id, evaluation.targetId));
      if (target && gateNum >= (target.currentGate || 0)) {
        const updates: any = {
          currentGate: gateNum + 1,
          updatedAt: new Date(),
        };
        // Status transitions
        if (gateNum === 0 && target.status === "new") updates.status = "inflight";
        if (gateNum === 7) {
          updates.status = "closed";
          const score = evaluation.compositeScore ? Number(evaluation.compositeScore) : 0;
          updates.outcome = score >= 65 ? "pursue" : score >= 50 ? "conditional" : "pass";
        }
        await db.update(targets).set(updates).where(eq(targets.id, evaluation.targetId));
      }
    }
  }

  // Audit log
  const [target] = evaluation.targetId
    ? await db.select().from(targets).where(eq(targets.id, evaluation.targetId))
    : [null];

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: `gate_${decision}`,
    targetName: target?.name,
    details: {
      evaluationId: params.id,
      gateCode: evaluation.gateCode,
      decision,
      rationale,
      approveCount,
      requiredApprovals,
      resultingStatus: newStatus,
    },
  });

  return NextResponse.json({
    approval,
    gateStatus: newStatus,
    approveCount,
    requiredApprovals,
    canAdvance: approveCount >= requiredApprovals && rejectCount === 0,
  }, { status: 201 });
}

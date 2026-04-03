// ═══════════════════════════════════════════════════════════════
// AMP v2 — /api/evaluations/[id]/approve
// Updated with:
//   - Crystallization on dual auth passage
//   - Break-crystal endpoint (DELETE method)
//   - Full prior-state snapshotting
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  gateApprovals, gateEvaluations, gateTolerances,
  dimensionScores, targets, auditLog
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { GATES } from "@/lib/gates";
import { crystallizeGate, breakCrystal } from "@/lib/template-engine";

// ── GET: Fetch approval status + crystallization state ────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  const approvals = await db
    .select().from(gateApprovals)
    .where(eq(gateApprovals.evaluationId, params.id))
    .orderBy(gateApprovals.createdAt);

  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));

  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get tolerance config
  const [tolerance] = await db
    .select().from(gateTolerances)
    .where(and(
      eq(gateTolerances.orgId, orgId),
      eq(gateTolerances.gateCode, evaluation.gateCode)
    )).limit(1);

  const gateDef = GATES.find((g) => g.code === evaluation.gateCode);
  const requiredApprovals = tolerance?.requiredApprovals || 2;
  const approverRoles = tolerance?.approverRoles || ["admin", "analyst"];

  const approveCount = approvals.filter((a) => a.decision === "approve").length;
  const rejectCount = approvals.filter((a) => a.decision === "reject").length;

  // Crystallization state
  const isCrystallized = (evaluation as any).isCrystallized || false;
  const crystallizedAt = (evaluation as any).crystallizedAt || null;
  const moduleName = (evaluation as any).moduleName || null;

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
    crystallization: {
      isCrystallized,
      crystallizedAt,
      moduleName,
      templateVersion: (evaluation as any).templateVersionSnapshot || null,
    },
  });
}

// ── POST: Submit approval (triggers crystallization if threshold met)
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
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  // Get evaluation
  const [evaluation] = await db
    .select().from(gateEvaluations)
    .where(eq(gateEvaluations.id, params.id));
  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Block approvals on crystallized gates
  if ((evaluation as any).isCrystallized) {
    return NextResponse.json(
      { error: "Gate is crystallized. Break crystal before modifying approvals." },
      { status: 409 }
    );
  }

  // Check for duplicate approval
  const existingApprovals = await db
    .select().from(gateApprovals)
    .where(eq(gateApprovals.evaluationId, params.id));

  if (existingApprovals.find((a) => a.userId === userId)) {
    return NextResponse.json(
      { error: "You have already submitted a decision for this gate." },
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

  // Check threshold
  const allApprovals = [...existingApprovals, approval];
  const approveCount = allApprovals.filter((a) => a.decision === "approve").length;
  const rejectCount = allApprovals.filter((a) => a.decision === "reject").length;

  const [tolerance] = await db
    .select().from(gateTolerances)
    .where(and(
      eq(gateTolerances.orgId, orgId),
      eq(gateTolerances.gateCode, evaluation.gateCode)
    )).limit(1);

  const requiredApprovals = tolerance?.requiredApprovals || 2;

  // ── Determine gate outcome ────────────────────────────────
  let newStatus = evaluation.gateStatus;
  let crystallized = false;

  if (rejectCount > 0) {
    newStatus = "failed";
  } else if (approveCount >= requiredApprovals) {
    newStatus = "passed";

    // ═══════════════════════════════════════════════════════
    // CRYSTALLIZE: Gate has passed dual auth
    // Freeze the entire methodology config for this gate
    // ═══════════════════════════════════════════════════════
    try {
      await crystallizeGate(params.id, userId);
      crystallized = true;
    } catch (err) {
      // Crystallization failed — gate still passes but methodology
      // isn't frozen. Log the error but don't block the approval.
      console.error("Crystallization failed:", err);
      // Still update status to passed
      await db.update(gateEvaluations)
        .set({ gateStatus: "passed", evaluatedAt: new Date() })
        .where(eq(gateEvaluations.id, params.id));
    }
  }

  // If gate passed (and crystallization handled status), handle target progression
  if (newStatus !== evaluation.gateStatus && !crystallized) {
    await db.update(gateEvaluations)
      .set({ gateStatus: newStatus, evaluatedAt: new Date() })
      .where(eq(gateEvaluations.id, params.id));
  }

  // ── Target status transitions on gate passage ─────────────
  if (newStatus === "passed" && evaluation.targetId) {
    const gateNum = parseInt(evaluation.gateCode.replace("G", ""));
    const [target] = await db.select().from(targets).where(eq(targets.id, evaluation.targetId));

    if (target && gateNum >= (target.currentGate || 0)) {
      const updates: any = {
        currentGate: gateNum + 1,
        updatedAt: new Date(),
      };

      if (gateNum === 0 && target.status === "new") updates.status = "inflight";
      if (gateNum === 7) {
        updates.status = "closed";
        const score = evaluation.compositeScore ? Number(evaluation.compositeScore) : 0;
        updates.outcome = score >= 65 ? "pursue" : score >= 50 ? "conditional" : "pass";
      }

      await db.update(targets).set(updates).where(eq(targets.id, evaluation.targetId));
    }
  }

  // ── Audit ─────────────────────────────────────────────────
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
      crystallized,
      moduleName: (evaluation as any).moduleName || null,
    },
  });

  return NextResponse.json({
    approval,
    gateStatus: newStatus,
    approveCount,
    requiredApprovals,
    canAdvance: approveCount >= requiredApprovals && rejectCount === 0,
    crystallized,
  }, { status: 201 });
}

// ── DELETE: Break crystal (admin only) ────────────────────────
// Unfreezes a crystallized gate for re-evaluation.
// Requires admin role + justification.
// Deletes existing approvals — gate needs fresh dual auth.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "approve_gate")) {
    return NextResponse.json(
      { error: "Only admins can break gate crystallization" },
      { status: 403 }
    );
  }

  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;
  const body = await req.json();
  const { justification } = body;

  if (!justification || justification.trim().length < 20) {
    return NextResponse.json(
      { error: "Justification required (minimum 20 characters). Explain why this gate needs re-evaluation." },
      { status: 400 }
    );
  }

  try {
    await breakCrystal(params.id, userId, orgId, justification);

    return NextResponse.json({
      success: true,
      message: "Crystal broken. Gate reset to in_progress. Fresh dual authorization required.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to break crystal" },
      { status: 400 }
    );
  }
}

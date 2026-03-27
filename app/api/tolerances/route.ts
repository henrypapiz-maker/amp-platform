import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gateTolerances, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { GATES } from "@/lib/gates";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  // Get org-level overrides
  const overrides = await db
    .select()
    .from(gateTolerances)
    .where(eq(gateTolerances.orgId, orgId));

  // Build full tolerance map combining defaults + overrides
  const tolerances = GATES.map((gate) => {
    const override = overrides.find((o) => o.gateCode === gate.code);
    return {
      gateCode: gate.code,
      gateName: gate.name,
      gateType: gate.type,
      // Scoring tolerances
      minimumScore: override?.minimumScore
        ? Number(override.minimumScore)
        : gate.minimumScore,
      declineThreshold: override?.declineThreshold
        ? Number(override.declineThreshold)
        : gate.declineThreshold,
      // Approval config
      requiredApprovals: override?.requiredApprovals || 2,
      approverRoles: override?.approverRoles || ["admin", "analyst"],
      // Source tracking
      isOverridden: !!override,
      defaultMinimum: gate.minimumScore,
      defaultDecline: gate.declineThreshold,
    };
  });

  return NextResponse.json(tolerances);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "edit_weights")) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;
  const body = await req.json();
  const { gateCode, minimumScore, declineThreshold, requiredApprovals, approverRoles } = body;

  if (!gateCode) return NextResponse.json({ error: "gateCode required" }, { status: 400 });

  // Upsert
  const [existing] = await db
    .select()
    .from(gateTolerances)
    .where(
      and(
        eq(gateTolerances.orgId, orgId),
        eq(gateTolerances.gateCode, gateCode)
      )
    )
    .limit(1);

  if (existing) {
    const updateData: any = { updatedBy: userId, updatedAt: new Date() };
    if (minimumScore !== undefined) updateData.minimumScore = minimumScore?.toString();
    if (declineThreshold !== undefined) updateData.declineThreshold = declineThreshold?.toString();
    if (requiredApprovals !== undefined) updateData.requiredApprovals = requiredApprovals;
    if (approverRoles !== undefined) updateData.approverRoles = approverRoles;

    await db.update(gateTolerances).set(updateData).where(eq(gateTolerances.id, existing.id));
  } else {
    await db.insert(gateTolerances).values({
      orgId,
      gateCode,
      minimumScore: minimumScore?.toString(),
      declineThreshold: declineThreshold?.toString(),
      requiredApprovals: requiredApprovals || 2,
      approverRoles: approverRoles || ["admin", "analyst"],
      updatedBy: userId,
    });
  }

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "tolerance_updated",
    details: { gateCode, minimumScore, declineThreshold, requiredApprovals },
  });

  return NextResponse.json({ success: true });
}

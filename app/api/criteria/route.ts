import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dimensionCriteria, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { GATES } from "@/lib/gates";

// GET — returns merged criteria (defaults from gates.ts + org overrides from DB)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const gateCode = req.nextUrl.searchParams.get("gateCode");

  // Get org-level overrides
  const overrides = gateCode
    ? await db.select().from(dimensionCriteria)
        .where(and(eq(dimensionCriteria.orgId, orgId), eq(dimensionCriteria.gateCode, gateCode)))
    : await db.select().from(dimensionCriteria)
        .where(eq(dimensionCriteria.orgId, orgId));

  // Build merged criteria: defaults + overrides
  const gates = gateCode ? GATES.filter((g) => g.code === gateCode) : GATES;

  const criteria = gates.flatMap((gate) =>
    gate.dimensions.map((dim) => {
      const override = overrides.find(
        (o) => o.gateCode === gate.code && o.dimensionName === dim.name
      );
      return {
        gateCode: gate.code,
        gateName: gate.name,
        dimensionName: dim.name,
        weight: dim.weight,
        // Merged guidance: override wins if present
        testGuidance: override?.testGuidance || dim.testGuidance,
        acceptanceParams: override?.acceptanceParams || dim.acceptanceParams,
        // Track source
        isOverridden: !!override,
        defaultGuidance: dim.testGuidance,
        defaultParams: dim.acceptanceParams,
      };
    })
  );

  return NextResponse.json(criteria);
}

// PATCH — admin updates org-level criteria for a specific dimension
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
  const { gateCode, dimensionName, testGuidance, acceptanceParams } = body;

  if (!gateCode || !dimensionName) {
    return NextResponse.json({ error: "gateCode and dimensionName required" }, { status: 400 });
  }

  // Upsert
  const [existing] = await db
    .select()
    .from(dimensionCriteria)
    .where(
      and(
        eq(dimensionCriteria.orgId, orgId),
        eq(dimensionCriteria.gateCode, gateCode),
        eq(dimensionCriteria.dimensionName, dimensionName)
      )
    )
    .limit(1);

  if (existing) {
    const updateData: any = { updatedBy: userId, updatedAt: new Date() };
    if (testGuidance !== undefined) updateData.testGuidance = testGuidance;
    if (acceptanceParams !== undefined) updateData.acceptanceParams = acceptanceParams;
    await db.update(dimensionCriteria).set(updateData).where(eq(dimensionCriteria.id, existing.id));
  } else {
    await db.insert(dimensionCriteria).values({
      orgId,
      gateCode,
      dimensionName,
      testGuidance: testGuidance || null,
      acceptanceParams: acceptanceParams || null,
      updatedBy: userId,
    });
  }

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "criteria_updated",
    details: { gateCode, dimensionName },
  });

  return NextResponse.json({ success: true });
}

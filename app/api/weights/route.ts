import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { weightOverrides, personaConfig, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { GATES } from "@/lib/gates";
import { getPersonaAdjustments } from "@/lib/weights";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  // Get persona
  const [persona] = await db
    .select()
    .from(personaConfig)
    .where(eq(personaConfig.orgId, orgId))
    .limit(1);

  // Get existing overrides
  const overrides = await db
    .select()
    .from(weightOverrides)
    .where(eq(weightOverrides.orgId, orgId));

  // Calculate persona adjustments
  const adjustments = persona ? getPersonaAdjustments(persona) : [];

  // Build full weight map
  const weights = GATES.flatMap((gate) =>
    gate.dimensions.map((dim) => {
      const override = overrides.find(
        (o) => o.gateCode === gate.code && o.dimensionName === dim.name
      );
      const adj = adjustments.find(
        (a) => a.gateCode === gate.code && a.dimensionName === dim.name
      );

      const baseWeight = dim.weight;
      const personaAdj = adj?.adjustment || 0;
      const manualOverride = override?.manualOverride ? Number(override.manualOverride) : null;
      const locked = override?.locked || false;

      const effective = manualOverride !== null
        ? manualOverride
        : Math.max(5, Math.min(50, baseWeight + personaAdj));

      return {
        gateCode: gate.code,
        dimensionName: dim.name,
        baseWeight,
        personaAdj,
        personaReason: adj?.reason || null,
        manualOverride,
        locked,
        effectiveWeight: effective,
      };
    })
  );

  return NextResponse.json(weights);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "edit_weights")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;
  const body = await req.json();
  const { gateCode, dimensionName, manualOverride, locked } = body;

  // Upsert
  const existing = await db
    .select()
    .from(weightOverrides)
    .where(
      and(
        eq(weightOverrides.orgId, orgId),
        eq(weightOverrides.gateCode, gateCode),
        eq(weightOverrides.dimensionName, dimensionName)
      )
    )
    .limit(1);

  const gate = GATES.find((g) => g.code === gateCode);
  const dim = gate?.dimensions.find((d) => d.name === dimensionName);
  const baseWeight = dim?.weight || 0;

  if (existing.length > 0) {
    const updateData: any = { updatedBy: userId, updatedAt: new Date() };
    if (manualOverride !== undefined) updateData.manualOverride = manualOverride?.toString();
    if (locked !== undefined) updateData.locked = locked;

    await db.update(weightOverrides)
      .set(updateData)
      .where(eq(weightOverrides.id, existing[0].id));
  } else {
    await db.insert(weightOverrides).values({
      orgId,
      gateCode,
      dimensionName,
      baseWeight: baseWeight.toString(),
      manualOverride: manualOverride?.toString() || null,
      locked: locked || false,
      updatedBy: userId,
    });
  }

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "weight_updated",
    details: { gateCode, dimensionName, manualOverride, locked },
  });

  return NextResponse.json({ success: true });
}

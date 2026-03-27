import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { personaConfig, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const [persona] = await db
    .select()
    .from(personaConfig)
    .where(eq(personaConfig.orgId, orgId))
    .limit(1);

  return NextResponse.json(persona || null);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "edit_persona")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;
  const body = await req.json();

  const updateData: any = { updatedAt: new Date(), updatedBy: userId };
  if (body.acquisitionThesis !== undefined) updateData.acquisitionThesis = body.acquisitionThesis;
  if (body.horizonBias !== undefined) updateData.horizonBias = body.horizonBias;
  if (body.integrationPhilosophy !== undefined) updateData.integrationPhilosophy = body.integrationPhilosophy;
  if (body.riskTolerance !== undefined) updateData.riskTolerance = body.riskTolerance;
  if (body.irrHurdle !== undefined) updateData.irrHurdle = body.irrHurdle;
  if (body.processMaturity !== undefined) updateData.processMaturity = body.processMaturity;
  if (body.strategicClarity !== undefined) updateData.strategicClarity = body.strategicClarity;
  if (body.primarySectors !== undefined) updateData.primarySectors = body.primarySectors;

  const [updated] = await db
    .update(personaConfig)
    .set(updateData)
    .where(eq(personaConfig.orgId, orgId))
    .returning();

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "persona_updated",
    details: { changes: Object.keys(updateData) },
  });

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { targets, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { withTargetLimit } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const rows = await db
    .select()
    .from(targets)
    .where(eq(targets.orgId, orgId))
    .orderBy(targets.updatedAt);

  return NextResponse.json(rows);
}

export const POST = withTargetLimit(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "create_target")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  const [target] = await db.insert(targets).values({
    orgId,
    name: body.name,
    sector: body.sector || null,
    revenue: body.revenue || null,
    notes: body.notes || null,
    status: "new",
    currentGate: 0,
    createdBy: userId,
  }).returning();

  // Audit log
  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "target_created",
    targetName: target.name,
    details: { targetId: target.id, sector: target.sector },
  });

  return NextResponse.json(target, { status: 201 });
});

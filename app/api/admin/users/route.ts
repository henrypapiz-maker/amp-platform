import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "access_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      locked: users.locked,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.orgId, orgId));

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "manage_users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  const updateData: any = {};
  if (body.role !== undefined) updateData.role = body.role;
  if (body.locked !== undefined) updateData.locked = body.locked;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(and(eq(users.id, body.userId), eq(users.orgId, orgId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "user_updated",
    targetName: updated.name,
    details: { targetUserId: body.userId, changes: updateData },
  });

  return NextResponse.json({ success: true });
}

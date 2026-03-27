import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "view_audit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;

  const logs = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetName: auditLog.targetName,
      details: auditLog.details,
      createdAt: auditLog.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(eq(auditLog.orgId, orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return NextResponse.json(logs);
}

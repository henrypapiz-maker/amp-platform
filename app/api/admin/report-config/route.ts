import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportConfig, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

// ── GET: Current report config ────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;

  const [config] = await db.select().from(reportConfig)
    .where(eq(reportConfig.orgId, orgId)).limit(1);

  return NextResponse.json(config || {});
}

// ── PATCH: Update report config ───────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "access_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;
  const body = await req.json();

  // Build update object from allowed fields
  const allowed = [
    "companyName", "primaryColor", "accentColor", "logoUrl", "fontFamily",
    "includeTitle", "includeExecSummary", "includePersona", "includeGateOverview",
    "includeGateDetails", "includeRiskSummary", "includeEvidenceSummary",
    "includeScoreHistory", "gateDetailMode", "footerText", "disclaimerText",
  ];

  const updates: any = { updatedBy: userId, updatedAt: new Date() };
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Upsert
  const [existing] = await db.select().from(reportConfig)
    .where(eq(reportConfig.orgId, orgId)).limit(1);

  let result;
  if (existing) {
    [result] = await db.update(reportConfig).set(updates)
      .where(eq(reportConfig.orgId, orgId)).returning();
  } else {
    [result] = await db.insert(reportConfig).values({ orgId, ...updates }).returning();
  }

  // Audit
  await db.insert(auditLog).values({
    orgId, userId,
    action: "report_config_updated",
    details: { changedFields: Object.keys(updates).filter(k => k !== "updatedBy" && k !== "updatedAt") },
  });

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { evidenceLinks, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const evaluationId = req.nextUrl.searchParams.get("evaluationId");
  if (!evaluationId) return NextResponse.json({ error: "evaluationId required" }, { status: 400 });

  const evidence = await db
    .select()
    .from(evidenceLinks)
    .where(eq(evidenceLinks.evaluationId, evaluationId));

  return NextResponse.json(evidence);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "upload_evidence")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;

  const [link] = await db.insert(evidenceLinks).values({
    evaluationId: body.evaluationId,
    evidenceArtifactId: body.evidenceArtifactId,
    linkType: body.linkType,
    label: body.label,
    ref: body.ref,
    fileSize: body.fileSize || null,
    note: body.note || null,
    extension: body.extension || null,
    uploadedBy: userId,
  }).returning();

  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "evidence_attached",
    details: { evaluationId: body.evaluationId, label: body.label, linkType: body.linkType },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "delete_evidence")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;

  const [deleted] = await db.delete(evidenceLinks).where(eq(evidenceLinks.id, id)).returning();

  if (deleted) {
    await db.insert(auditLog).values({
      orgId,
      userId,
      action: "evidence_deleted",
      details: { evidenceId: id, label: deleted.label },
    });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { personaDocuments, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTENSIONS = [
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt",
  "csv", "png", "jpg", "jpeg", "txt",
];

// ── GET: List persona documents for the org ────────────────────
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const docs = await db
    .select()
    .from(personaDocuments)
    .where(eq(personaDocuments.orgId, orgId))
    .orderBy(personaDocuments.uploadedAt);

  return NextResponse.json(docs);
}

// ── POST: Upload a strategic document ──────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "edit_persona")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `File type .${extension} not allowed.` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const pathname = `persona/${orgId}/${Date.now()}-${file.name}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Store in DB
    const [doc] = await db.insert(personaDocuments).values({
      orgId,
      filename: file.name,
      fileType: extension,
      blobUrl: blob.url,
      status: "uploaded",
      uploadedBy: userId,
    }).returning();

    // Audit
    await db.insert(auditLog).values({
      orgId,
      userId,
      action: "persona_document_uploaded",
      details: { filename: file.name, fileType: extension, docId: doc.id },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error("Persona document upload failed:", error);
    if (error?.message?.includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json(
        { error: "File storage not configured. Contact administrator." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

// ── DELETE: Remove a persona document ──────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "edit_persona")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("id");

  if (!docId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [doc] = await db
    .select()
    .from(personaDocuments)
    .where(and(eq(personaDocuments.id, docId), eq(personaDocuments.orgId, orgId)))
    .limit(1);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from blob storage
  if (doc.blobUrl) {
    try { await del(doc.blobUrl); } catch { /* blob may already be deleted */ }
  }

  // Delete from DB
  await db.delete(personaDocuments).where(eq(personaDocuments.id, docId));

  // Audit
  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "persona_document_deleted",
    details: { filename: doc.filename, docId },
  });

  return NextResponse.json({ success: true });
}

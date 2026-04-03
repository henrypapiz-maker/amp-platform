import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { hasPermission } from "@/lib/permissions";

// Allowed file types and max size
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTENSIONS = [
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt",
  "csv", "png", "jpg", "jpeg", "gif", "txt", "msg",
];
const ALLOWED_MIME_PREFIXES = [
  "application/pdf",
  "application/vnd.openxmlformats",
  "application/vnd.ms-",
  "application/msword",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "application/vnd.ms-outlook",
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!hasPermission(role, "upload_evidence")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const evaluationId = formData.get("evaluationId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!evaluationId) {
      return NextResponse.json({ error: "evaluationId required" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Validate file type
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `File type .${extension} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const mimeAllowed = ALLOWED_MIME_PREFIXES.some(
      (prefix) => file.type.startsWith(prefix)
    );
    if (!mimeAllowed && file.type !== "") {
      return NextResponse.json(
        { error: `MIME type ${file.type} not allowed.` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const pathname = `evidence/${orgId}/${evaluationId}/${Date.now()}-${file.name}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Audit log
    await db.insert(auditLog).values({
      orgId,
      userId,
      action: "evidence_file_uploaded",
      details: {
        evaluationId,
        filename: file.name,
        fileSize: file.size,
        extension,
        blobUrl: blob.url,
      },
    });

    // Format file size for display
    const fileSizeFormatted = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      sizeFormatted: fileSizeFormatted,
      extension,
    }, { status: 201 });
  } catch (error: any) {
    console.error("File upload failed:", error);

    if (error?.message?.includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json(
        { error: "File storage not configured. Contact administrator." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "File upload failed. Please try again." },
      { status: 500 }
    );
  }
}

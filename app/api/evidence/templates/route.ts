import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// Dynamic import for v2 schema
let templatesTable: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v2 = require("@/lib/db/schema-v2");
  templatesTable = v2.evidenceTemplates;
} catch { /* pre-migration */ }

// ── GET: Browse evidence reference library ─────────────────────
// Query params: ?gate=G1, ?category=template, ?q=search
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!templatesTable) {
    return NextResponse.json({ error: "Evidence reference library not available" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const gateFilter = searchParams.get("gate");
  const categoryFilter = searchParams.get("category");

  const query = db.select().from(templatesTable)
    .where(eq(templatesTable.isPublished, true));

  const results = await query;

  // Apply filters in JS (simpler than building dynamic where clauses)
  let filtered = results as any[];
  if (gateFilter) {
    filtered = filtered.filter((t: any) => t.gateCode === gateFilter.toUpperCase());
  }
  if (categoryFilter) {
    filtered = filtered.filter((t: any) => t.category === categoryFilter);
  }

  // Sort by gate code, then by name
  filtered.sort((a: any, b: any) => {
    if (a.gateCode !== b.gateCode) return a.gateCode.localeCompare(b.gateCode);
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(filtered);
}

// ═══════════════════════════════════════════════════════════════
// AMP v2 — GET /api/knowledge-base
// Serves methodology articles. Accessible to ALL tiers (including
// free POC). This is the Trojan horse — vocabulary adoption
// happens before payment.
//
// Query params:
//   ?category=methodology    Filter by category
//   ?gate=G4                 Filter by related gate
//   ?q=crystallization       Full-text search
//   ?slug=gate-crystallization  Fetch single article by slug
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and, like, or, sql } from "drizzle-orm";

// Try v2 schema; if not migrated, return 404
let kbTable: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v2 = require("@/lib/db/schema-v2");
  kbTable = v2.knowledgeBaseArticles;
} catch { /* pre-migration */ }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!kbTable) {
    return NextResponse.json({ error: "Knowledge Base not available" }, { status: 404 });
  }

  const category = req.nextUrl.searchParams.get("category");
  const gate = req.nextUrl.searchParams.get("gate");
  const query = req.nextUrl.searchParams.get("q");
  const slug = req.nextUrl.searchParams.get("slug");

  // Single article by slug
  if (slug) {
    const [article] = await db
      .select()
      .from(kbTable)
      .where(and(eq(kbTable.slug, slug), eq(kbTable.isPublished, true)))
      .limit(1);

    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    return NextResponse.json(article);
  }

  // Build conditions
  const conditions: any[] = [eq(kbTable.isPublished, true)];

  if (category) {
    conditions.push(eq(kbTable.category, category));
  }

  if (gate) {
    // relatedGates is a JSON array — use SQL contains
    conditions.push(sql`${kbTable.relatedGates}::jsonb @> ${JSON.stringify([gate])}::jsonb`);
  }

  if (query) {
    conditions.push(
      or(
        like(kbTable.title, `%${query}%`),
        like(kbTable.summary, `%${query}%`),
        like(kbTable.content, `%${query}%`)
      )
    );
  }

  const articles = await db
    .select({
      id: kbTable.id,
      title: kbTable.title,
      slug: kbTable.slug,
      category: kbTable.category,
      summary: kbTable.summary,
      content: kbTable.content,
      relatedGates: kbTable.relatedGates,
      authorName: kbTable.authorName,
      publishedAt: kbTable.publishedAt,
    })
    .from(kbTable)
    .where(and(...conditions))
    .orderBy(kbTable.publishedAt);

  return NextResponse.json(articles);
}

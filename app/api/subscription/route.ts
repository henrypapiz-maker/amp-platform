// ═══════════════════════════════════════════════════════════════
// AMP v2 — GET /api/subscription
// Returns the current org's subscription state.
// Used by the frontend to show tier badges, upgrade prompts,
// and feature gates.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscriptionState } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const state = await getSubscriptionState(orgId);

  return NextResponse.json(state);
}

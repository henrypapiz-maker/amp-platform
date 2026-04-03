import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveMethodology } from "@/lib/template-engine";

// ── GET: Live methodology reference for the org's active template ──
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (session.user as any).orgId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  try {
    const methodology = await resolveMethodology(orgId);

    // Optional gate filter for deep-links: ?gate=G4
    const { searchParams } = new URL(req.url);
    const gateFilter = searchParams.get("gate");

    if (gateFilter) {
      const filteredGate = methodology.gates.find(
        (g) => g.code === gateFilter.toUpperCase()
      );
      if (!filteredGate) {
        return NextResponse.json({ error: `Gate ${gateFilter} not found` }, { status: 404 });
      }
      return NextResponse.json({
        ...methodology,
        gates: [filteredGate],
      });
    }

    return NextResponse.json(methodology);
  } catch (error) {
    console.error("Failed to resolve methodology:", error);
    return NextResponse.json(
      { error: "Failed to load methodology. Template may not be configured." },
      { status: 500 }
    );
  }
}

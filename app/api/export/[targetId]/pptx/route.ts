import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { targets, gateEvaluations, dimensionScores, evidenceLinks, personaConfig, reportConfig, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GATES } from "@/lib/gates";
import { generateICReport } from "@/lib/report/pptx-generator";
import { mergeConfig, type ReportData } from "@/lib/report/report-config";

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;
  const userName = session.user?.name || "Unknown";

  try {
    // ── Fetch all data ──────────────────────────────────────
    const [target] = await db.select().from(targets)
      .where(eq(targets.id, params.targetId)).limit(1);

    if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

    const evaluations = await db.select().from(gateEvaluations)
      .where(eq(gateEvaluations.targetId, params.targetId));

    const evalWithScores = await Promise.all(
      evaluations.map(async (ev) => {
        const scores = await db.select().from(dimensionScores)
          .where(eq(dimensionScores.evaluationId, ev.id));
        const evidence = await db.select().from(evidenceLinks)
          .where(eq(evidenceLinks.evaluationId, ev.id));
        return {
          gateCode: ev.gateCode,
          gateStatus: ev.gateStatus || "pending",
          compositeScore: ev.compositeScore,
          evaluatedAt: ev.evaluatedAt?.toISOString() || null,
          moduleName: (ev as any).moduleName || null,
          scores: scores.map(s => ({
            dimensionName: s.dimensionName,
            score: s.score,
            rationale: s.rationale,
            scoreHistory: (s as any).scoreHistory || null,
          })),
          evidence: evidence.map(e => ({
            label: e.label,
            linkType: e.linkType || "url",
            ref: e.ref,
          })),
        };
      })
    );

    const [persona] = await db.select().from(personaConfig)
      .where(eq(personaConfig.orgId, orgId)).limit(1);

    // ── Get report config ───────────────────────────────────
    let dbConfig = null;
    try {
      const [rc] = await db.select().from(reportConfig)
        .where(eq(reportConfig.orgId, orgId)).limit(1);
      dbConfig = rc;
    } catch { /* table may not exist */ }

    const config = mergeConfig(dbConfig as any);

    // ── Build report data ───────────────────────────────────
    const reportData: ReportData = {
      target: {
        name: target.name,
        sector: target.sector,
        revenue: target.revenue,
        status: target.status || "new",
        currentGate: target.currentGate || 0,
        compositeScore: target.compositeScore,
        outcome: target.outcome,
        notes: target.notes,
      },
      evaluations: evalWithScores,
      persona: persona ? {
        acquisitionThesis: persona.acquisitionThesis,
        horizonBias: persona.horizonBias,
        integrationPhilosophy: persona.integrationPhilosophy,
        riskTolerance: persona.riskTolerance,
        irrHurdle: persona.irrHurdle,
        primarySectors: persona.primarySectors,
      } : null,
      gates: GATES.map(g => ({
        code: g.code,
        name: g.name,
        type: g.type,
        minimumScore: g.minimumScore,
        declineThreshold: g.declineThreshold,
        dimensions: g.dimensions.map(d => ({ name: d.name, weight: d.weight })),
      })),
      preparedBy: userName,
      generatedAt: new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }),
    };

    // ── Generate PPTX ───────────────────────────────────────
    const buffer = await generateICReport(reportData, config);

    // ── Audit log ───────────────────────────────────────────
    await db.insert(auditLog).values({
      orgId,
      userId,
      action: "pptx_report_generated",
      targetName: target.name,
      details: { targetId: params.targetId, slides: Object.entries(config).filter(([k, v]) => k.startsWith("include") && v).length },
    });

    // ── Return file ─────────────────────────────────────────
    const filename = `${target.name.replace(/[^a-zA-Z0-9]/g, "-")}-IC-Scorecard.pptx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PPTX generation failed:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// AMP v2 — POST /api/evaluations
// Updated to support module selection at gate start.
// When an analyst starts a gate evaluation, they select a module.
// The module determines which dimensions, rubrics, and lenses apply.
// Template version is snapshotted at creation time.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gateEvaluations, dimensionScores, targets, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import {
  resolveMethodology,
  snapshotForEvaluation,
} from "@/lib/template-engine";
import { getGate } from "@/lib/gates";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!hasPermission(role, "score_dimension")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { targetId, gateCode, moduleId } = body;
  const userId = (session.user as any).id;
  const orgId = (session.user as any).orgId;

  // Check if evaluation already exists for this target + gate
  const existing = await db
    .select()
    .from(gateEvaluations)
    .where(
      and(
        eq(gateEvaluations.targetId, targetId),
        eq(gateEvaluations.gateCode, gateCode)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  // ── Resolve methodology and module ────────────────────────
  let dimensions: any[] = [];
  let evaluationModuleId: string | null = null;
  let evaluationModuleName: string | null = null;
  let templateVersionSnapshot: string = "1.0.0";

  try {
    // Try v2 resolution: template engine with modules
    const methodology = await resolveMethodology(orgId);
    templateVersionSnapshot = methodology.templateVersion || "1.0.0";
    const gate = methodology.gates.find((g) => g.code === gateCode);

    if (gate && gate.modules.length > 0) {
      // Module selection: use provided moduleId or fall back to default
      const selectedModule = moduleId
        ? gate.modules.find((m) => m.id === moduleId)
        : gate.modules.find((m) => m.isDefault) || gate.modules[0];

      if (selectedModule) {
        dimensions = selectedModule.dimensions;
        evaluationModuleId = selectedModule.id;
        evaluationModuleName = selectedModule.name;
      }
    }
  } catch {
    // v2 not available — fall through to static
  }

  // Fallback to v1 static gates if no module resolved
  if (dimensions.length === 0) {
    const staticGate = getGate(gateCode);
    if (staticGate) {
      dimensions = staticGate.dimensions;
    }
  }

  // ── Create evaluation record ──────────────────────────────
  const evalValues: any = {
    targetId,
    gateCode,
    gateStatus: "in_progress",
    evaluatedBy: userId,
  };

  // Always snapshot template version at eval creation
  evalValues.templateVersionSnapshot = templateVersionSnapshot;
  evalValues.isCrystallized = false;

  // Add v2 module fields if module was resolved
  if (evaluationModuleId) {
    evalValues.moduleId = evaluationModuleId;
    evalValues.moduleName = evaluationModuleName;
  }

  const [evaluation] = await db
    .insert(gateEvaluations)
    .values(evalValues)
    .returning();

  // ── Create dimension score placeholders from module ────────
  if (dimensions.length > 0) {
    await db.insert(dimensionScores).values(
      dimensions.map((d: any) => ({
        evaluationId: evaluation.id,
        dimensionName: d.name,
      }))
    );
  }

  // ── Update target gate position ───────────────────────────
  const [target] = await db.select().from(targets).where(eq(targets.id, targetId));
  const gateNum = parseInt(gateCode.replace("G", ""));
  if (target && gateNum >= (target.currentGate || 0)) {
    await db.update(targets)
      .set({
        currentGate: gateNum,
        status: gateNum > 0 ? "inflight" : target.status,
        updatedAt: new Date(),
      })
      .where(eq(targets.id, targetId));
  }

  // ── Audit log ─────────────────────────────────────────────
  await db.insert(auditLog).values({
    orgId,
    userId,
    action: "evaluation_started",
    targetName: target?.name,
    details: {
      targetId,
      gateCode,
      moduleId: evaluationModuleId,
      moduleName: evaluationModuleName,
      templateVersion: templateVersionSnapshot,
    },
  });

  return NextResponse.json({
    ...evaluation,
    moduleId: evaluationModuleId,
    moduleName: evaluationModuleName,
    templateVersion: templateVersionSnapshot,
    dimensionCount: dimensions.length,
  }, { status: 201 });
}

// ── GET /api/evaluations/modules?gateCode=G4 ─────────────────
// Returns available modules for a gate (used by module selection UI)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const gateCode = req.nextUrl.searchParams.get("gateCode");

  if (!gateCode) {
    return NextResponse.json({ error: "gateCode required" }, { status: 400 });
  }

  try {
    const methodology = await resolveMethodology(orgId);
    const gate = methodology.gates.find((g) => g.code === gateCode);

    if (!gate) {
      return NextResponse.json({ error: "Gate not found" }, { status: 404 });
    }

    // Return modules with dimension summaries (not full config)
    const modules = gate.modules.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      description: m.description,
      whenToUse: m.whenToUse,
      whenNotToUse: m.whenNotToUse,
      dimensionCount: m.dimensions.length,
      dimensionNames: m.dimensions.map((d) => d.name),
      isDefault: m.isDefault,
      source: m.source,
      minimumScore: m.minimumScore,
      declineThreshold: m.declineThreshold,
    }));

    return NextResponse.json({
      gateCode,
      gateName: gate.name,
      modules,
      defaultModuleId: gate.defaultModuleId,
    });
  } catch {
    // v2 not available — return static gate info
    const staticGate = getGate(gateCode);
    if (!staticGate) return NextResponse.json({ error: "Gate not found" }, { status: 404 });

    return NextResponse.json({
      gateCode,
      gateName: staticGate.name,
      modules: [{
        id: `static-${gateCode}`,
        name: "Default",
        slug: "default",
        description: staticGate.purpose,
        dimensionCount: staticGate.dimensions.length,
        dimensionNames: staticGate.dimensions.map((d) => d.name),
        isDefault: true,
        source: "static_fallback",
      }],
      defaultModuleId: `static-${gateCode}`,
    });
  }
}

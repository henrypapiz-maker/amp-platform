// ═══════════════════════════════════════════════════════════════
// AMP v2 — AI Consent Chain Middleware
//
// Enforces the 4-gate authorization chain before any request
// reaches an AI provider. If ANY gate fails, returns 403.
//
// Gate 1: Platform flag (AI_ENABLED env var)
// Gate 2: Org DPA (signed + not expired)
// Gate 3: Evaluation consent (per-eval or blanket)
// Gate 4: Document opt-in (per-doc or blanket)
//
// This middleware wraps all /api/ai/* routes.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { aiSettings } from "@/lib/db/schema";

// Try to import v2 consent tables
let consentLogTable: any = null;
let docContextTable: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v2 = require("@/lib/db/schema-v2");
  consentLogTable = v2.aiConsentLog;
  docContextTable = v2.aiDocumentContext;
} catch { /* pre-migration */ }

// ── Types ──────────────────────────────────────────────────────

export interface ConsentCheckResult {
  allowed: boolean;
  failedGate: 1 | 2 | 3 | 4 | null;
  reason: string | null;
  context: {
    platformEnabled: boolean;
    orgDpaSigned: boolean;
    orgDpaExpired: boolean;
    evaluationConsent: boolean;
    evaluationBlanket: boolean;
    documentOptIns: string[]; // IDs of opted-in evidence documents
  };
}

// ── Main Consent Check ─────────────────────────────────────────

/**
 * Check the full 4-gate consent chain for an AI request.
 * Call this before sending ANY data to an AI provider.
 *
 * Returns: { allowed: true } or { allowed: false, failedGate, reason }
 */
export async function checkConsentChain(
  orgId: string,
  evaluationId: string | null,
  requestedDocumentIds?: string[]
): Promise<ConsentCheckResult> {
  const result: ConsentCheckResult = {
    allowed: false,
    failedGate: null,
    reason: null,
    context: {
      platformEnabled: false,
      orgDpaSigned: false,
      orgDpaExpired: false,
      evaluationConsent: false,
      evaluationBlanket: false,
      documentOptIns: [],
    },
  };

  // ── Gate 1: Platform Feature Flag ───────────────────────
  const platformEnabled = process.env.AI_ENABLED === "true";
  result.context.platformEnabled = platformEnabled;

  if (!platformEnabled) {
    result.failedGate = 1;
    result.reason = "AI features are disabled at the platform level.";
    return result;
  }

  // ── Gate 2: Organization DPA ────────────────────────────
  const [settings] = await db
    .select()
    .from(aiSettings)
    .where(eq(aiSettings.orgId, orgId))
    .limit(1);

  if (!settings?.aiEnabled || !settings?.dpaSigned) {
    result.failedGate = 2;
    result.reason = settings?.aiEnabled
      ? "Data Processing Agreement has not been signed. An admin must sign the DPA in Admin > AI Integration."
      : "AI features are not enabled for your organization. Contact your admin.";
    return result;
  }

  result.context.orgDpaSigned = true;

  // Check DPA expiry (if renewal date is set)
  const dpaRenewalDate = (settings as any).dpaRenewalDate;
  if (dpaRenewalDate && new Date(dpaRenewalDate) < new Date()) {
    result.context.orgDpaExpired = true;
    result.failedGate = 2;
    result.reason = "Data Processing Agreement has expired. An admin must renew the DPA.";
    return result;
  }

  // ── Gate 3: Evaluation Consent ──────────────────────────
  if (evaluationId) {
    // Check blanket org-level consent first
    const blanketEval = (settings as any).blanketEvaluationConsent;

    if (blanketEval) {
      result.context.evaluationConsent = true;
      result.context.evaluationBlanket = true;
    } else {
      // Check per-evaluation consent
      try {
        // Look for evaluation-level AI enabled flag
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { gateEvaluations } = require("@/lib/db/schema");
        const [evaluation] = await db
          .select()
          .from(gateEvaluations)
          .where(eq(gateEvaluations.id, evaluationId))
          .limit(1);

        if (evaluation && (evaluation as any).aiEnabled) {
          result.context.evaluationConsent = true;
        }
      } catch { /* evaluation check failed */ }
    }

    if (!result.context.evaluationConsent) {
      result.failedGate = 3;
      result.reason = "AI assistance is not enabled for this evaluation. Toggle 'Enable AI' on the evaluation to proceed.";
      return result;
    }
  }

  // ── Gate 4: Document Opt-In ─────────────────────────────
  if (requestedDocumentIds && requestedDocumentIds.length > 0 && docContextTable) {
    const blanketDoc = (settings as any).blanketDocumentConsent;

    if (blanketDoc) {
      // Blanket doc consent — all documents in this evaluation are opted in
      result.context.documentOptIns = requestedDocumentIds;
    } else {
      // Check per-document opt-in
      try {
        for (const docId of requestedDocumentIds) {
          const [docCtx] = await db
            .select()
            .from(docContextTable)
            .where(
              and(
                eq(docContextTable.evidenceLinkId, docId),
                eq(docContextTable.optedIn, true)
              )
            )
            .limit(1);

          if (docCtx && !docCtx.revokedAt) {
            result.context.documentOptIns.push(docId);
          }
        }
      } catch { /* doc context check failed */ }
    }

    // If specific documents were requested but none are opted in
    if (result.context.documentOptIns.length === 0) {
      result.failedGate = 4;
      result.reason = "None of the requested documents are opted in for AI analysis. Enable AI processing on individual documents in the Evidence tab.";
      return result;
    }
  }

  // ── All gates passed ────────────────────────────────────
  result.allowed = true;

  // Log the successful consent check
  if (consentLogTable) {
    try {
      const session = await auth();
      await db.insert(consentLogTable).values({
        orgId,
        userId: (session?.user as any)?.id,
        evaluationId,
        consentGate: "full_chain",
        action: "verified",
        scope: requestedDocumentIds?.join(",") || null,
        isBlanketInherited:
          result.context.evaluationBlanket || false,
      });
    } catch { /* logging failure shouldn't block the request */ }
  }

  return result;
}

// ── Middleware Wrapper for AI Routes ────────────────────────────

/**
 * Wrap an AI API handler with consent chain enforcement.
 * Use this to protect any /api/ai/* route.
 *
 * Usage:
 *   export const POST = withAIConsent(async (req, consentResult) => {
 *     // consentResult.context has the opted-in document IDs
 *     // ... your AI handler logic
 *   });
 */
export function withAIConsent(
  handler: (
    req: NextRequest,
    consent: ConsentCheckResult,
    params?: any
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeParams?: any) => {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).orgId;

    // Extract evaluation and document context from request
    let evaluationId: string | null = null;
    let documentIds: string[] | undefined;

    try {
      const body = await req.clone().json();
      evaluationId = body.evaluationId || null;
      documentIds = body.documentIds || undefined;
    } catch {
      // GET request or no body — evaluation might be in URL
    }

    // If evaluationId is in route params
    if (!evaluationId && routeParams?.params?.id) {
      evaluationId = routeParams.params.id;
    }

    // Run consent chain
    const consent = await checkConsentChain(orgId, evaluationId, documentIds);

    if (!consent.allowed) {
      return NextResponse.json({
        error: "AI consent check failed",
        failedGate: consent.failedGate,
        reason: consent.reason,
        gateDetails: ({
          1: "Platform AI feature flag",
          2: "Organization Data Processing Agreement",
          3: "Evaluation-level AI consent",
          4: "Document-level AI opt-in",
        } as Record<number, string>)[consent.failedGate || 0],
      }, { status: 403 });
    }

    return handler(req, consent, routeParams);
  };
}

// ── Consent Management Helpers ─────────────────────────────────

/**
 * Enable AI for an evaluation (Gate 3 toggle).
 * Called from the evaluation UI when analyst toggles AI on.
 */
export async function enableEvaluationAI(
  evaluationId: string,
  userId: string,
  orgId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { gateEvaluations } = require("@/lib/db/schema");

  await db.update(gateEvaluations)
    .set({ aiEnabled: true } as any)
    .where(eq(gateEvaluations.id, evaluationId));

  if (consentLogTable) {
    await db.insert(consentLogTable).values({
      orgId,
      userId,
      evaluationId,
      consentGate: "evaluation",
      action: "granted",
    });
  }
}

/**
 * Opt a document in for AI processing (Gate 4 toggle).
 * Called from the evidence UI when analyst opts in a document.
 */
export async function optInDocument(
  evaluationId: string,
  evidenceLinkId: string,
  userId: string,
  orgId: string,
  isBlanket: boolean = false
): Promise<void> {
  if (!docContextTable) return;

  // Upsert
  const [existing] = await db
    .select()
    .from(docContextTable)
    .where(
      and(
        eq(docContextTable.evaluationId, evaluationId),
        eq(docContextTable.evidenceLinkId, evidenceLinkId)
      )
    )
    .limit(1);

  if (existing) {
    await db.update(docContextTable)
      .set({
        optedIn: true,
        isBlanketInherited: isBlanket,
        optedInBy: userId,
        optedInAt: new Date(),
        revokedAt: null,
      })
      .where(eq(docContextTable.id, existing.id));
  } else {
    await db.insert(docContextTable).values({
      evaluationId,
      evidenceLinkId,
      optedIn: true,
      isBlanketInherited: isBlanket,
      optedInBy: userId,
      optedInAt: new Date(),
    });
  }

  if (consentLogTable) {
    await db.insert(consentLogTable).values({
      orgId,
      userId,
      evaluationId,
      consentGate: "document",
      action: "granted",
      scope: evidenceLinkId,
      isBlanketInherited: isBlanket,
    });
  }
}

/**
 * Revoke document AI opt-in.
 */
export async function revokeDocumentOptIn(
  evaluationId: string,
  evidenceLinkId: string,
  userId: string,
  orgId: string
): Promise<void> {
  if (!docContextTable) return;

  await db.update(docContextTable)
    .set({ optedIn: false, revokedAt: new Date() })
    .where(
      and(
        eq(docContextTable.evaluationId, evaluationId),
        eq(docContextTable.evidenceLinkId, evidenceLinkId)
      )
    );

  if (consentLogTable) {
    await db.insert(consentLogTable).values({
      orgId,
      userId,
      evaluationId,
      consentGate: "document",
      action: "revoked",
      scope: evidenceLinkId,
    });
  }
}

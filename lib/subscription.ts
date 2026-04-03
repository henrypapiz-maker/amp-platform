// ═══════════════════════════════════════════════════════════════
// AMP v2 — Subscription Tier Middleware
//
// Enforces tier limits on API routes:
//   POC (free):  1 user, 1 active target, 90-day trial,
//                full methodology read access, no AI
//   Team:        10 users, 50 active targets, custom methodology,
//                cross-deal analytics, optional AI
//   Enterprise:  Unlimited users/targets, SSO, API access,
//                dedicated support, full AI
//
// Upgrade triggers: second target, team access, AI assist.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and, count } from "drizzle-orm";
import { targets } from "@/lib/db/schema";

// Try v2 schema
let subscriptionsTable: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v2 = require("@/lib/db/schema-v2");
  subscriptionsTable = v2.subscriptions;
} catch { /* pre-migration — all features enabled */ }

// ── Tier Limits ────────────────────────────────────────────────

export const TIER_LIMITS = {
  poc: {
    maxUsers: 1,
    maxActiveTargets: 1,
    trialDays: 90,
    aiEnabled: false,
    customMethodology: false,
    crossDealAnalytics: false,
    knowledgeBaseAccess: true, // Trojan horse — always on
    exportEnabled: false,
    apiAccess: false,
  },
  team: {
    maxUsers: 10,
    maxActiveTargets: 50,
    trialDays: null, // No trial limit
    aiEnabled: true, // Available but requires DPA
    customMethodology: true,
    crossDealAnalytics: true,
    knowledgeBaseAccess: true,
    exportEnabled: true,
    apiAccess: false,
  },
  enterprise: {
    maxUsers: null, // Unlimited
    maxActiveTargets: null,
    trialDays: null,
    aiEnabled: true,
    customMethodology: true,
    crossDealAnalytics: true,
    knowledgeBaseAccess: true,
    exportEnabled: true,
    apiAccess: true,
  },
};

export type Tier = keyof typeof TIER_LIMITS;

// ── Types ──────────────────────────────────────────────────────

export interface SubscriptionState {
  tier: Tier;
  status: "active" | "trial" | "expired" | "cancelled";
  limits: typeof TIER_LIMITS[Tier];
  usage: {
    activeTargets: number;
    userCount: number;
  };
  trialExpiresAt: string | null;
  upgradeRequired: boolean;
  upgradeReason: string | null;
}

// ── Get Subscription State ─────────────────────────────────────

export async function getSubscriptionState(orgId: string): Promise<SubscriptionState> {
  // Default to team if v2 schema not available
  if (!subscriptionsTable) {
    return {
      tier: "team",
      status: "active",
      limits: TIER_LIMITS.team,
      usage: { activeTargets: 0, userCount: 1 },
      trialExpiresAt: null,
      upgradeRequired: false,
      upgradeReason: null,
    };
  }

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.orgId, orgId))
    .limit(1);

  if (!subscription) {
    // No subscription record — create a POC trial
    return {
      tier: "poc",
      status: "trial",
      limits: TIER_LIMITS.poc,
      usage: { activeTargets: 0, userCount: 1 },
      trialExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      upgradeRequired: false,
      upgradeReason: null,
    };
  }

  const tier = (subscription.tier as Tier) || "poc";
  const limits = TIER_LIMITS[tier];

  // Count active targets
  const [targetCount] = await db
    .select({ count: count() })
    .from(targets)
    .where(
      and(
        eq(targets.orgId, orgId),
        // Count non-closed targets
      )
    );

  const activeTargets = Number(targetCount?.count || 0);

  // Check trial expiry for POC tier
  let status: SubscriptionState["status"] = subscription.status as any || "active";
  let trialExpiresAt: string | null = null;

  if (tier === "poc") {
    const created = new Date(subscription.createdAt || Date.now());
    const expiresAt = new Date(created.getTime() + 90 * 24 * 60 * 60 * 1000);
    trialExpiresAt = expiresAt.toISOString();

    if (new Date() > expiresAt) {
      status = "expired";
    } else {
      status = "trial";
    }
  }

  // Determine upgrade requirement
  let upgradeRequired = false;
  let upgradeReason: string | null = null;

  if (limits.maxActiveTargets && activeTargets >= limits.maxActiveTargets) {
    upgradeRequired = true;
    upgradeReason = `You've reached the ${tier.toUpperCase()} limit of ${limits.maxActiveTargets} active target${limits.maxActiveTargets > 1 ? "s" : ""}. Upgrade to add more targets.`;
  }

  if (status === "expired") {
    upgradeRequired = true;
    upgradeReason = "Your POC trial has expired. Upgrade to continue evaluating targets.";
  }

  return {
    tier,
    status,
    limits,
    usage: { activeTargets, userCount: 1 },
    trialExpiresAt,
    upgradeRequired,
    upgradeReason,
  };
}

// ── Feature Check ──────────────────────────────────────────────

export function hasFeature(state: SubscriptionState, feature: keyof typeof TIER_LIMITS.poc): boolean {
  const value = state.limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return true; // Has a limit but the feature exists
  return value !== null;
}

// ── Middleware: Enforce Target Limit ────────────────────────────

export function withTargetLimit(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, params?: any) => {
    // Only enforce on POST (creating new targets)
    if (req.method !== "POST") return handler(req, params);

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = (session.user as any).orgId;
    const state = await getSubscriptionState(orgId);

    if (state.status === "expired") {
      return NextResponse.json({
        error: "Trial expired",
        upgradeRequired: true,
        reason: state.upgradeReason,
      }, { status: 402 });
    }

    if (state.upgradeRequired) {
      return NextResponse.json({
        error: "Target limit reached",
        upgradeRequired: true,
        reason: state.upgradeReason,
        currentUsage: state.usage.activeTargets,
        limit: state.limits.maxActiveTargets,
      }, { status: 402 });
    }

    return handler(req, params);
  };
}

// ── Middleware: Enforce Feature Access ──────────────────────────

export function withFeature(feature: keyof typeof TIER_LIMITS.poc) {
  return function (
    handler: (req: NextRequest, params?: any) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, params?: any) => {
      const session = await auth();
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const orgId = (session.user as any).orgId;
      const state = await getSubscriptionState(orgId);

      if (!hasFeature(state, feature)) {
        return NextResponse.json({
          error: "Feature not available on your plan",
          feature,
          currentTier: state.tier,
          upgradeRequired: true,
          reason: `The ${String(feature).replace(/([A-Z])/g, " $1").toLowerCase()} feature requires a ${
            feature === "apiAccess" ? "Enterprise" : "Team"
          } plan.`,
        }, { status: 402 });
      }

      return handler(req, params);
    };
  };
}

// ── API Route: GET /api/subscription ───────────────────────────
// Returns the current org's subscription state for the frontend.

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).orgId;
  const state = await getSubscriptionState(orgId);

  return NextResponse.json(state);
}

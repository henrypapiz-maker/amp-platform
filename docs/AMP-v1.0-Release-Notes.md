# AMP v1.0 — Release Notes

## Acquisition Management Platform · Alio Foundry · March 2026

**Version:** 1.0.0
**Release Date:** March 30, 2026
**Authors:** Henry Papiz (Architecture & Product), Alio Foundry Development Team
**Stack:** Next.js 14 · Vercel · Neon PostgreSQL · Drizzle ORM · NextAuth v5 · Tailwind CSS · shadcn/ui
**Repository:** github.com/henrypapiz-maker/amp-platform
**Deployment:** Vercel (US East — IAD1)

---

## 1. What is AMP?

AMP is a structured M&A evaluation platform built around an **8-gate waterfall methodology**. It guides acquisition analysts through a disciplined, evidence-backed scoring process — from initial universe qualification (G0) through Investment Committee decision (G7).

The platform replaces fragmented spreadsheet-and-email evaluation workflows with a single system of record where the evaluation methodology, evidence, scoring, and governance all live together.

---

## 2. What Ships in v1.0

### Core Evaluation Workflow
- **8-gate waterfall** with 29 scored dimensions across G0–G7
- **Binary gate (G0)** — 4 pass/fail checks for universe qualification
- **Scored gates (G1–G6)** — 0–10 scale per dimension with rubric anchors at 0/3/5/7/10
- **Decision gate (G7)** — IC recommendation: PURSUE / CONDITIONAL / PASS
- **Composite scoring** — weighted average of dimension scores per gate
- **Gate status tracking** — pending → in_progress → passed/failed

### Prescriptive Dimension Guidance
- **Test Guidance** for all 29 dimensions — explains what to evaluate and how
- **Acceptance Parameters** per dimension — configurable thresholds (geographies, revenue bands, excluded structures, etc.)
- **Admin-editable criteria** — override defaults per organization
- **Reset to defaults** — restore AMP methodology at any time

### Acquirer Persona System
- **8 configurable attributes** (thesis, horizon, integration, risk tolerance, IRR hurdle, maturity, clarity, sectors)
- **Dynamic weight propagation** — persona attributes automatically adjust dimension weights
- **Influence map** — transparent view of all active persona-driven weight adjustments
- **Effective weight clamping** — weights bounded between 5–50% to prevent extreme skewing

### Dual Authorization Governance
- **2-person approval** required to advance any gate (configurable)
- **Rejection override** — any single rejection fails the gate
- **Approval audit trail** — who approved, when, with what rationale
- **Configurable approval roles** and required count per gate

### Evidence Management
- **4 evidence link types** — file, URL, database reference, flat file path
- **Per-gate evidence artifacts** — defined evidence requirements per gate
- **Attachment tracking** — shows which artifacts are linked vs. outstanding

### Administration & Governance
- **3-role RBAC** — Admin, Analyst, Viewer with granular permissions
- **User management** — role assignment, account lock/unlock
- **Comprehensive audit trail** — every mutation logged with user, action, timestamp, details
- **Configurable gate tolerances** — admin-adjustable pass/fail thresholds per gate
- **Permission matrix** — transparent view of all role capabilities

### IC Scorecard Export
- **Print-optimized layout** — white background, clean typography
- **Full gate breakdown** — scores, dimensions, rationale, evidence counts
- **Persona context** — shows acquirer identity that influenced the evaluation
- **Recommendation banner** — color-coded PURSUE / CONDITIONAL / PASS

### Security & Data Isolation
- **No external API calls** in Phase 1 — complete data isolation
- **AI disabled by default** — Zone 2 isolation architecture, /api/ai/* returns 403
- **No search indexing** — robots.txt + X-Robots-Tag on all responses
- **No analytics or tracking** — zero external scripts
- **Security headers** — DENY framing, no-referrer, no-sniff
- **Private evidence storage** — no public URLs
- **Contextual help system** — HelpTip, PageHelp, and TabHelp components throughout

---

## 3. Architecture Decisions

### Why Next.js 14 (not 15/16)?
Stability for production deployment. Next.js 14 with App Router provides mature SSR, API routes, and middleware patterns. v15/16 introduce breaking changes not needed for this use case.

### Why Neon PostgreSQL?
Serverless Postgres with auto-scaling, connection pooling, and branch-per-preview capability. Matches Vercel's serverless model without connection pool management overhead.

### Why Drizzle ORM (not Prisma)?
Lighter weight, direct SQL mapping, better serverless performance. Drizzle generates clean SQL without the ORM abstraction overhead that impacts cold start times on Vercel.

### Why NextAuth v5 beta (not v4)?
App Router native support, middleware integration, cleaner JWT callbacks. The beta is stable for credentials-only providers.

### Why credentials auth (not OAuth)?
M&A platforms handle confidential deal materials. Third-party OAuth introduces trust boundary expansion that corp dev teams reject. Phase 2 may add enterprise SSO.

### Why no Zustand stores for server data?
API routes with fetch() on component mount provides simpler data flow for this application size. Zustand is installed for future client-side state needs (filters, UI preferences).

---

## 4. Database Schema Version

**Current migration state:** 3 migrations applied

| Migration | Tables Created/Modified |
|-----------|------------------------|
| `0000_slim_black_cat.sql` | organizations, users, persona_config, targets, gate_evaluations, dimension_scores, weight_overrides, evidence_links, persona_documents, audit_log, ai_settings, ai_audit_log |
| `0001_burly_sabretooth.sql` | gate_approvals, gate_tolerances, dimension_criteria |
| `0002_rainy_cerise.sql` | Schema refinements |

**15 tables total.** See Code Index for complete table reference.

---

## 5. Seed Data

The seed script (`lib/db/seed.ts`) populates:

| Entity | Data |
|--------|------|
| Organization | Alio Foundry |
| Users | Henry Papiz (admin), Angus Gow (analyst), Andrew Rufener (analyst), Client Viewer (viewer) |
| Persona | Capability Buy thesis, H1 horizon, Moderate risk, IRR hurdle 3/5, Full Integration |
| Targets | Precision Dynamics (G3, score 71), MidWest Fabricators (G5, score 64), Alloy Systems (G0, new), TechSource Analytics (G7, closed/pursue, score 82), Cascade Industrial (G4, closed/pass, score 38) |
| AI Settings | Disabled (default) |

---

## 6. Known Limitations (v1.0)

| Area | Limitation | Resolution Path |
|------|-----------|-----------------|
| File upload | Evidence attachments are link-based only (URL/path). No direct file upload to Vercel Blob. | Phase 1.1: Vercel Blob integration |
| Analytics | No cross-deal comparison dashboard. | Phase 1.1: Score distribution charts, gate attrition analytics |
| Multiple personas | Single persona per organization. Some teams need multiple strategic lenses. | Phase 2: Multi-persona profiles, selectable per target |
| Gate enforcement | Gate progression is advisory. Analysts can work any gate in any order. | By design — corp dev teams work non-linearly. G7 requires all gates to have status. |
| Mobile UI | Responsive but not mobile-optimized. Best experience on desktop/tablet. | Phase 1.1: Mobile layout refinements |
| PDF export | Uses browser print (Ctrl+P). No server-side PDF generation. | Phase 1.1: jsPDF server-side generation |
| Search | No target search or filter beyond status tabs. | Phase 1.1: Search + sector/score filters |
| Notifications | No email or in-app notifications for approvals, assignments. | Phase 2: Notification system |
| LLM Integration | AI scoring, extraction, and narrative generation are disabled. | Phase 2: Anthropic Claude API integration with prompt scaffolding |

---

## 7. Phase 2 Roadmap (Seed Round, Q3–Q4 2026)

| Feature | Priority | Effort |
|---------|----------|--------|
| LLM Standard Tier — AI-assisted dimension scoring | P0 | 3–4 sprints |
| Financial data extraction from CIMs/models | P0 | 2–3 sprints |
| IC narrative auto-drafting | P1 | 2 sprints |
| Vercel Blob file uploads for evidence | P1 | 1 sprint |
| Cross-deal analytics dashboard | P1 | 2 sprints |
| Email notifications (approvals, assignments) | P2 | 1 sprint |
| Multi-persona profiles per org | P2 | 1 sprint |
| Target search and advanced filtering | P2 | 1 sprint |
| Mobile-optimized layouts | P3 | 1 sprint |

---

## 8. Environment Variables

| Variable | Required | Default | Purpose |
|----------|:--------:|---------|---------|
| `DATABASE_URL` | ✓ | — | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✓ | — | JWT signing secret (32+ chars) |
| `NEXTAUTH_URL` | ✓ | — | Production URL (e.g., https://amp-xxx.vercel.app) |
| `AI_ENABLED` | — | `false` | Master AI feature flag |
| `AI_PROVIDER` | — | `""` | LLM provider (Phase 2) |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | — | `false` | Analytics flag (always false in Phase 1) |
| `ANTHROPIC_API_KEY` | — | `""` | Claude API key (Phase 2 only) |

---

## 9. Deployment Checklist

- [x] Git repository initialized and pushed to GitHub
- [x] Vercel project created and linked to repo
- [x] DATABASE_URL set to Neon connection string (no `psql` prefix, no quotes)
- [x] NEXTAUTH_SECRET generated and set
- [x] NEXTAUTH_URL set to production domain
- [x] Build succeeds on Vercel (warnings acceptable, no errors)
- [x] Login works with all 3 demo accounts
- [x] Target CRUD operations functional
- [x] Gate scoring saves to Neon
- [x] Security headers present (check via browser DevTools → Network → Response Headers)
- [x] robots.txt returns Disallow: /
- [x] /api/ai/score-dimension returns 403
- [ ] Custom domain configured (optional)
- [ ] Neon branch-per-preview configured (optional)

---

## 10. File Inventory

**65 source files across 7 categories:**

| Category | Count | Key Files |
|----------|:-----:|-----------|
| Pages | 8 | login, dashboard, targets/[id], admin, persona, export/[targetId], root layout, root redirect |
| API Routes | 12 | targets, evaluations, scores, approve, evidence, persona, weights, criteria, tolerances, users, audit, auth |
| Components | 19 | TopNav, help-tip, + 17 shadcn/ui components |
| Library | 8 | auth, gates (29 dimensions), weights, permissions, schema (15 tables), seed, db connection, utils |
| Config | 8 | next.config, tailwind.config, drizzle.config, tsconfig, eslint, postcss, vercel.json, middleware |
| Migrations | 3 | 0000, 0001, 0002 |
| Documentation | 3 | User Guide, Code Index, Release Notes (this file) |

---

## 11. Scoring Methodology Reference

### Composite Score Formula
```
Gate Composite = (Σ dimension_score_i × effective_weight_i) / (Σ effective_weight_i) × 10
```
Normalized to 0–100 scale. Dimension scores are 0–10.

### Effective Weight Formula
```
effective = manual_override ?? clamp(base + persona_adjustment, 5, 50)
```

### Gate Passage Criteria
```
IF any_rejection → FAILED
IF approve_count >= required_approvals AND no_rejections → PASSED
IF composite >= minimum_score → eligible for approval
IF composite < decline_threshold → auto-decline recommended
```

### G7 Outcome Determination
```
composite >= 65 → PURSUE
composite >= 50 → CONDITIONAL
composite < 50 → PASS
```

---

*AMP v1.0 Release Notes · Alio Foundry · March 2026*
*Prepared by Henry Papiz, Managing Director*

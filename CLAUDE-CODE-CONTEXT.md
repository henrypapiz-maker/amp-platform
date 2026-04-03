# AMP v2 — Claude Code Context Document

> **Last Updated:** April 2, 2026
> **Project:** AMP (Acquisition Management Platform) by Alio Foundry
> **Owner:** Henry Papiz, Managing Director
> **Stack:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, NextAuth v5, Vercel

---

## 1. What Is AMP

AMP is an M&A evaluation platform that replaces Excel + PowerPoint + email with a structured 8-gate waterfall methodology. Acquisition targets progress through gates (G0–G7), each examining a distinct aspect — from universe qualification through IC decision. Every dimension within a gate is scored against rubric anchors, evaluated through multiple analytical lenses, and approved via dual authorization.

AMP v1 is deployed and functional. V2 transforms it from a single-methodology tool into a multi-persona, methodology-adaptive platform with AI assistance.

---

## 2. V1 Codebase Overview

**Deployed on:** Vercel + Neon PostgreSQL
**Auth:** NextAuth v5 with credentials provider
**ORM:** Drizzle with Neon HTTP driver
**UI:** Tailwind CSS + shadcn/ui components

### V1 Database (15 tables)
- `organizations`, `users`, `persona_config`
- `targets`, `gate_evaluations`, `dimension_scores`
- `gate_tolerances`, `gate_approvals`
- `evidence_links`, `ai_settings`
- `audit_log`, `sessions`, `accounts`, `verification_tokens`

### V1 File Structure
```
app/
├── api/
│   ├── targets/route.ts
│   ├── evaluations/route.ts
│   ├── evaluations/[id]/approve/route.ts
│   ├── evaluations/[id]/scores/route.ts
│   ├── persona/route.ts
│   └── export/route.ts
├── auth/signin/page.tsx
├── dashboard/
│   ├── page.tsx (pipeline view)
│   ├── targets/[id]/page.tsx (target detail)
│   └── admin/page.tsx
lib/
├── auth.ts
├── db/schema.ts, seed.ts, migrations/
├── gates.ts (static 8-gate definitions)
├── permissions.ts
components/
├── layout/ (Sidebar, Header)
├── pipeline/ (TargetCard, etc.)
└── ui/ (shadcn components)
```

### V1 Key Files to Know
- `lib/gates.ts` — Static gate definitions with dimensions, rubrics, weights. V2 replaces direct imports of this with the template engine, but it remains as the fallback layer.
- `lib/db/schema.ts` — V1 Drizzle schema. V2 adds `schema-v2.ts` alongside it (not replacing).
- `lib/permissions.ts` — RBAC: `hasPermission(role, action)`. V2 uses this unchanged.

---

## 3. V2 Architecture Decisions

### Multi-Template Methodology
Six acquirer archetypes, each with a complete methodology template:
1. **PE Platform Build** (fully authored)
2. **PE Bolt-On / Roll-Up** (not yet authored)
3. **Corporate Strategic** (not yet authored)
4. **Family Office / HoldCo** (not yet authored)
5. **Search Fund** (fully authored — validates multi-template architecture)
6. **Growth Equity** (not yet authored)

### Multi-Lens Evaluation
Each dimension has multiple analytical lenses (frameworks). Convergence = confidence. Divergence = investigate. 22 lenses authored across all gates for PE Platform Build.

### Per-Gate Crystallization
When a gate passes dual authorization, its methodology config freezes. Break-crystal requires admin + justification + deletes approvals requiring fresh dual auth.

### Evaluation Modules
G4 has 3 selectable analytical frameworks: Standard Financial, High-Growth SaaS, Distressed. Analyst chooses at gate start. Choice crystallizes with the gate.

### AI Consent Chain (4 gates)
1. Platform flag (AI_ENABLED env var)
2. Org DPA (signed + not expired)
3. Evaluation consent (per-eval or blanket)
4. Document opt-in (per-doc or blanket)

### Template Engine — 4-Layer Resolution
```
Deal Override → Org Custom → Template → Static Fallback (gates.ts)
```

### State Management: TanStack Query v5
- Mutation-heavy app requires `useMutation` with cache invalidation
- 5-minute staleTime for methodology data (doesn't change mid-session)
- refetchOnWindowFocus for multi-user sync
- Pre-built mutation hooks: `useSaveScore`, `useSaveLensNote`, `useSubmitApproval`, `useBreakCrystal`

### Real-Time Sync: Polling (30s)
- TanStack Query refetchInterval on evaluation data
- No WebSocket/SSE infrastructure needed at current scale
- "Last updated" indicator on evaluation pages

### Toast System: Sonner
- shadcn/ui integration, added to root layout
- `useAmpMutation` wrapper auto-triggers toast on success/error

### Free Tier: POC Model
- 1 user, 1 active target, 90-day trial
- Full methodology read access (Knowledge Base is the Trojan horse)
- Upgrade triggers: second target, team access, AI assist

---

## 4. V2 File Inventory (30 files / 8,046 lines)

### Database & Migration
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `schema-v2.ts` | `lib/db/schema-v2.ts` | 246 | 13 new Drizzle tables |
| `0003_methodology_v2.sql` | `lib/db/migrations/0003_methodology_v2.sql` | 310 | Migration DDL + FKs + indexes + ALTER |
| `seed-v2.ts` | `lib/db/seed-v2.ts` | 264 | Seeds template, modules, lenses, KB articles |

### Template Engine & Business Logic
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `template-engine.ts` | `lib/template-engine.ts` | 557 | 4-layer resolution, crystallizeGate(), breakCrystal() |
| `consent-chain.ts` | `lib/ai/consent-chain.ts` | 383 | 4-gate AI authorization middleware |
| `prompt-templates.ts` | `lib/ai/prompt-templates.ts` | 376 | AI system instructions, context injection, output schemas |
| `subscription.ts` | `lib/subscription.ts` | 262 | Tier limits, withTargetLimit(), withFeature() |

### Methodology Content
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `pe-platform-lenses.ts` | `lib/lenses/pe-platform-lenses.ts` | 523 | 14 lenses: G1, G4, G5, G6 |
| `pe-platform-lenses-extended.ts` | `lib/lenses/pe-platform-lenses-extended.ts` | 348 | 8 lenses: G2, G3, G7 |
| `g4-modules.ts` | `lib/modules/g4-modules.ts` | 350 | 3 G4 modules: Standard, SaaS, Distressed |
| `search-fund-template.ts` | `lib/templates/search-fund-template.ts` | 431 | Complete Search Fund (5 redesigned gates) |

### API Routes
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `evaluations/route.ts` | `app/api/evaluations/route.ts` | 219 | POST with module selection, GET modules |
| `approve/route.ts` | `app/api/evaluations/[id]/approve/route.ts` | 292 | POST approval + crystallization, DELETE break-crystal |
| `scores/route.ts` | `app/api/evaluations/[id]/scores/route.ts` | 331 | GET enriched scores + lenses, PATCH score, POST lens note |
| `knowledge-base/route.ts` | `app/api/knowledge-base/route.ts` | 90 | GET articles with search/filter |
| `subscription/route.ts` | `app/api/subscription/route.ts` | 20 | GET org subscription state |

### Frontend — Feature Components
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `onboarding/page.tsx` | `app/onboarding/page.tsx` | 419 | 3-step wizard: archetype → persona → first target |
| `knowledge-base/page.tsx` | `app/knowledge-base/page.tsx` | 355 | KB browse with search, category filters, article detail |
| `ModuleSelection.tsx` | `components/evaluation/ModuleSelection.tsx` | 256 | Module picker at gate start |
| `LensEvaluationPanel.tsx` | `components/evaluation/LensEvaluationPanel.tsx` | 352 | Lens cards, convergence badges, per-lens notes |
| `CrystallizationUI.tsx` | `components/evaluation/CrystallizationUI.tsx` | 321 | Status badge, break-crystal dialog, gate status bar |
| `UpgradePrompt.tsx` | `components/UpgradePrompt.tsx` | 140 | Inline/modal/banner upgrade prompts |

### Frontend — UX Foundation Layer
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `QueryProvider.tsx` | `providers/QueryProvider.tsx` | 75 | TanStack Query setup + query key factory |
| `mutations.ts` | `lib/hooks/mutations.ts` | 167 | useAmpMutation + pre-built mutation hooks |
| `EvalBreadcrumb.tsx` | `components/EvalBreadcrumb.tsx` | 102 | Context-aware breadcrumb navigation |
| `EmptyState.tsx` | `components/EmptyState.tsx` | 142 | Shared pattern + 6 pre-configured variants |
| `skeletons.tsx` | `components/skeletons.tsx` | 199 | 10 skeleton loading variants per component shape |
| `ErrorBoundary.tsx` | `components/ErrorBoundary.tsx` | 93 | Error boundary + InlineError for section failures |
| `layout-v2.tsx` | `app/layout-v2.tsx` | 91 | Root layout: QueryProvider + Sonner + ErrorBoundary |

### Documentation
| File | Path | Lines | Purpose |
|------|------|-------|---------|
| `INTEGRATION-GUIDE.ts` | `docs/INTEGRATION-GUIDE.ts` | 332 | 9-step wiring guide with code snippets |

---

## 5. New Database Tables (V2)

```
methodology_templates    — Platform-level template definitions (versioned)
evaluation_modules       — Selectable analytical frameworks per gate
org_methodology          — Org's selected template + customizations
evaluation_lenses        — Multi-lens analytical frameworks per dimension
lens_notes               — Per-evaluation, per-lens analyst observations
crystal_break_log        — Audit trail for crystallization breaks
sector_overlays          — Industry-specific dimension adjustments
deal_overrides           — Per-target methodology overrides
ai_consent_log           — 4-gate consent chain audit trail
ai_document_context      — Per-document AI opt-in tracking
ai_prompt_templates      — Customizable AI prompt configurations
narrative_drafts         — AI-generated IC memo drafts
subscriptions            — Org tier, limits, feature flags
knowledge_base_articles  — Methodology reference content
```

### Schema Changes to Existing V1 Tables
- `gate_evaluations` — Added: `moduleId`, `moduleName`, `templateVersionSnapshot`, `isCrystallized`, `crystallizedAt`, `crystallizedConfig`, `aiEnabled`
- `ai_settings` — Added: `blanketEvaluationConsent`, `blanketDocumentConsent`, `dpaRenewalDate`
- `dimension_scores` — Added: `aiRequestId`
- `targets` — Added: `dealOverrideId`

---

## 6. Query Key Patterns

```typescript
import { queryKeys } from "@/providers/QueryProvider";

// Targets
queryKeys.targets.all                          // ["targets"]
queryKeys.targets.detail(id)                   // ["targets", id]

// Evaluations
queryKeys.evaluations.scores(evalId)           // ["evaluations", evalId, "scores"]
queryKeys.evaluations.approvals(evalId)        // ["evaluations", evalId, "approvals"]
queryKeys.evaluations.modules(gateCode)        // ["evaluations", "modules", gateCode]

// Methodology
queryKeys.methodology.template(orgId)          // ["methodology", "template", orgId]
queryKeys.methodology.lenses(gateCode, dim)    // ["methodology", "lenses", gateCode, dim]

// Knowledge Base
queryKeys.knowledgeBase.articles(filters)      // ["knowledge-base", "articles", filters]
```

---

## 7. Mutation Patterns

```typescript
import { useSaveScore, useSaveLensNote, useSubmitApproval } from "@/lib/hooks/mutations";

// In a component:
const saveScore = useSaveScore(evaluationId);
saveScore.mutate({ dimensionName: "Revenue Quality", score: 7, rationale: "..." });
// → Auto-shows Sonner toast: "Score saved"
// → Auto-invalidates evaluation scores cache

const saveLensNote = useSaveLensNote(evaluationId);
saveLensNote.mutate({ lensId: "...", content: "DCF suggests $45M..." });

const approve = useSubmitApproval(evaluationId);
approve.mutate({ decision: "approve", rationale: "..." });
// → If dual auth met, toast: "Gate approved and crystallized"
```

---

## 8. Key API Contracts

### POST /api/evaluations
```json
// Request
{ "targetId": "...", "gateCode": "G4", "moduleId": "..." }
// Response (201)
{ "id": "...", "moduleId": "...", "moduleName": "Standard Financial", "templateVersion": "1.0.0", "dimensionCount": 5 }
```

### PATCH /api/evaluations/[id]/scores
```json
// Request
{ "dimensionName": "Revenue Quality", "score": 7, "rationale": "..." }
// Response
{ "id": "...", "score": "7", "compositeScore": 72.3 }
```

### POST /api/evaluations/[id]/scores (lens note)
```json
// Request
{ "lensId": "...", "content": "DCF suggests $45M, comps suggest $32M" }
```

### POST /api/evaluations/[id]/approve
```json
// Request
{ "decision": "approve", "rationale": "..." }
// Response
{ "approval": {...}, "gateStatus": "passed", "crystallized": true }
```

### DELETE /api/evaluations/[id]/approve (break crystal)
```json
// Request
{ "justification": "Material new information re: revenue recognition..." }
// Response
{ "success": true, "message": "Crystal broken. Fresh dual auth required." }
```

### GET /api/knowledge-base?category=methodology&gate=G4&q=crystallization
Returns array of `{ id, title, slug, category, summary, content, relatedGates, authorName, publishedAt }`.

---

## 9. Integration Sequence

Run these in order when starting v2 development:

```bash
# 1. Install new dependencies
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm dlx shadcn@latest add sonner skeleton breadcrumb

# 2. Run migration
# Apply lib/db/migrations/0003_methodology_v2.sql to Neon

# 3. Run v2 seed
npx tsx lib/db/seed-v2.ts

# 4. Add v2 files to project
# Copy all files from the v2 output following the paths in Section 4

# 5. Wire root layout
# Merge layout-v2.tsx additions into existing app/layout.tsx:
#   - QueryProvider wrapping children
#   - <Toaster /> at body level
#   - ErrorBoundary wrapping main content

# 6. Follow INTEGRATION-GUIDE.ts for component wiring:
#   Step 1: Auth flow → onboarding redirect
#   Step 2: Sidebar → KB link
#   Step 3: Target detail → ModuleSelection
#   Step 4: Gate header → GateStatusBar
#   Step 5: Dimension card → LensEvaluationPanel
#   Step 6: Scores route → template engine
#   Step 7: Approve route → crystallization
#   Step 8: Targets route → withTargetLimit
#   Step 9: AI routes → withAIConsent
```

---

## 10. Sprint Roadmap

| Sprint | Weeks | Focus | Status |
|--------|-------|-------|--------|
| S1 | 1–2 | Free POC + Template Foundation | **Code complete** — needs integration + testing |
| S2 | 3–4 | Multi-Lens Scoring | **Code complete** — needs integration + testing |
| S3 | 5–6 | Methodology Knowledge Base | **Partial** — page + API done, needs live methodology rendering |
| S4 | 7–8 | Template Library (remaining 4 templates) | Not started |
| S5 | 9–10 | AI Infrastructure | **Partial** — consent chain + prompts done, needs provider integration |
| S6 | 11–13 | Document Intelligence | Not started |
| S7 | 14–16 | AI Scoring + Narrative | Not started |
| S8 | 17–18 | Evolution + Analytics | Not started |

---

## 11. Remaining Gap Register (Post-Eval)

### P1 — Should land in S1-S2
- Keyboard shortcuts for scoring flow (Tab, Cmd+S, Space, Enter)
- Onboarding tooltips for new v2 concepts (modules, lenses, convergence)
- 'Review Methodology' step in onboarding wizard
- Global error boundary retry logic on network failures
- Activity feed UI (per-target timeline)

### P2 — Correctly sequenced in later sprints
- Mobile/tablet responsive breakpoints (S2)
- User preferences/settings page (S3)
- Multi-deal portfolio dashboard (S8)
- Cross-deal analytics dashboard (S8)
- Template customization admin UI with fork/merge (S4)
- Export: DOCX IC memo, JSON API, webhooks (S7)
- Bulk actions for pipeline management (S8)
- Remaining 4 archetype templates (S4)

### P3 — Nice to have
- Row-level security at DB level (S5)
- Structural convergence algorithm replacing keyword heuristic (S2)
- Confirmation dialogs for template fork, weight override, eval deletion (S4)

---

## 12. Documents Generated

| Document | File | Purpose |
|----------|------|---------|
| Phase 2 PRD | `AMP-Phase2-PRD.docx` | Full product requirements: archetypes, AI, security, UX, data model, roadmap |
| v2 Development Plan | `AMP-v2-Development-Plan.docx` | Multi-lens architecture, open methodology, commercialization, template lifecycle |
| Build Evaluation | `AMP-v2-Build-Evaluation.docx` | Framework compliance review, enterprise SaaS UX audit, gap register |

---

## 13. Key Design Principles

1. **AI Suggests, Humans Decide** — Every AI output is a suggestion. Analyst's name on every score.
2. **Transparent Provenance** — Every suggestion shows evidence, rubric anchor, confidence, and gaps.
3. **Zero Trust by Default** — 4-gate consent chain. No data to AI without all gates passing.
4. **Open Methodology** — Every rubric, weight, lens, prompt is versioned, inspectable, editable.
5. **Progressive Disclosure** — New users see clean defaults. Power users discover depth as needed.
6. **Crystallization = Immutability** — Passed gates freeze. Template changes don't retroactively affect scored evaluations.
7. **Vocabulary Adoption as Moat** — When teams say "What's the G1 score?" they're locked in.

---

## 14. Tech Stack Dependencies (V2 Additions)

```json
{
  "@tanstack/react-query": "^5",
  "@tanstack/react-query-devtools": "^5",
  "sonner": "^1"
}
```

shadcn components to add:
```bash
pnpm dlx shadcn@latest add sonner skeleton breadcrumb
```

No other new dependencies. Everything else (Drizzle, NextAuth, shadcn core) is already in v1.

---

## 15. Build Evaluation Framework

Every sprint deliverable is evaluated through three expert personas before advancing. These evals are integrated into planning, development, and final output phases.

### 15.1 Evaluator Personas

**Persona A — PE Deal Professional:** VP-to-Principal-level PE professional with 50+ deals. Evaluates methodology fidelity, workflow realism, and domain accuracy. Primary concern: does this feel like a tool built by someone who has run a deal process?

**Persona B — Senior Engineer:** Staff-level full-stack engineer with 10+ years shipping SaaS. Evaluates code quality, architecture, scalability, security. Primary concern: is this built to survive real production traffic and real iteration cycles?

**Persona C — Serial Acquirer:** PE operating partner or corp dev head with 20+ acquisitions. Evaluates as a power user managing 10+ concurrent deals. Primary concern: will my deal team adopt this and keep using it after the novelty wears off?

### 15.2 Sprint Advancement Criteria

- **Planning Phase:** All three personas score ≥7/10 on every checkpoint. Any score <5 blocks sprint start.
- **Development Phase:** All critical-path checkpoints pass. Non-critical failures documented with resolution timeline.
- **Final Output Phase:** All three personas sign off. Composite score ≥7.5/10. No unresolved persona divergence.

### 15.3 Divergence Resolution Protocol

When personas disagree: (1) document the divergence, (2) classify root cause, (3) weighted resolution — methodology issues resolved in Persona A's favor, technical issues in Persona B's favor, usability issues in Persona C's favor, (4) document and advance with conditions.

---

## 16. Planning Eval Results — Session Output

### Persona A: PE Deal Professional (Composite: 8.1/10 — PASS)

| ID | Checkpoint | Score | Assessment |
|----|-----------|-------|------------|
| P-A-01 | Gate & Dimension Spec | 9/10 | All 8 gates map to real diligence phases. Rubric anchors use practitioner language (EBITDA margins, NRR, LTV/CAC, DSCR). G4 modules (Standard/SaaS/Distressed) represent real analytical frameworks. Search Fund template includes SBA eligibility and founder transition. |
| P-A-02 | Lens Framework Validation | 9/10 | 22 lenses mapped to named frameworks: DCF, Porter's Five Forces, Pricing Power Test, Cohort Analysis, Departure Impact Modeling. Blind spots are precise and actionable. |
| P-A-03 | Rubric Anchor Calibration | 8/10 | Anchors calibrated with quantitative thresholds (e.g., Revenue Quality: '>85% recurring; <5% concentration' for 10). Gap: some anchors could benefit from deal-outcome calibration data. |
| P-A-04 | Persona & Template Alignment | 8/10 | PE Platform Build comprehensive. Search Fund radically different (Operator-Market Fit, Conviction Level, Downside Survivability). Gap: 4 of 6 templates not yet authored. |
| P-A-05 | Onboarding & POC Flow | 8/10 | 3-step wizard with archetype-specific persona questions. Gap: no 'Review Methodology' preview step. |
| P-A-06 | IC Narrative Spec | 7/10 | Prompt templates define all sections + output schema. Gap: actual generation not yet implemented. |
| P-A-07 | Evidence & Document Taxonomy | 7/10 | Evidence artifacts defined per gate and module. Gap: document parsing pipeline not yet implemented. |

### Persona B: Senior Engineer (Composite: 7.4/10 — PASS with items)

| ID | Checkpoint | Score | Assessment |
|----|-----------|-------|------------|
| P-B-01 | Data Model Review | 8/10 | 13 tables with clean FKs. 4-layer resolution hierarchy. Crystal break log preserves full prior state. Gap: indexes in migration SQL but not schema-v2.ts. |
| P-B-02 | API Contract Spec | 7/10 | 5 routes with consistent patterns. Gap: no OpenAPI spec. |
| P-B-03 | State Management | 6/10 | **RESOLVED** — TanStack Query v5 chosen. QueryProvider, query key factory, and useAmpMutation helper built. |
| P-B-04 | Security Architecture | 8/10 | 4-gate consent chain with middleware wrapper. Zone 2 isolation. Blanket opt-in with audit trail. |
| P-B-05 | Performance & Scalability | 6/10 | **RESOLVED** — TanStack Query client cache with 5-min staleTime. Performance targets set. |
| P-B-06 | Multi-Tenancy & RBAC | 7/10 | v1 RBAC extended. Org-scoped methodology. Gap: no RLS at DB level. |
| P-B-07 | Migration & Versioning | 8/10 | Full migration SQL. Template version snapshotted at eval creation. Crystallization produces immutable snapshot. |

### Persona C: Serial Acquirer (Composite: 7.3/10 — PASS with items)

| ID | Checkpoint | Score | Assessment |
|----|-----------|-------|------------|
| P-C-01 | Multi-Deal Workflow | 6/10 | No portfolio dashboard built yet. Maps to S8. |
| P-C-02 | Team Collaboration | 7/10 | Dual auth with crystallization. Gap: no gate-level assignment or concurrent scoring conflict resolution. |
| P-C-03 | Lens Utility | 8/10 | 22 lenses with convergence indicators. Per-lens notes distinct from overall score. Blind spots explicit. |
| P-C-04 | Excel Migration Friction | 7/10 | Rubric scoring + composite + multi-lens replaces core Excel function. Gap: no import from existing Excel. |
| P-C-05 | Cross-Deal Analytics | 5/10 | Not yet implemented. Maps to S8. |
| P-C-06 | Template Customization | 8/10 | Template engine supports 4-layer resolution + fork model. Gap: no admin UI for customization. |
| P-C-07 | Export & Integration | 5/10 | v1 has IC Scorecard PDF. Gap: no DOCX IC export, JSON API, or webhooks. Maps to S7. |

---

## 17. Sprint Final Output Eval Results

### Sprint 1: Free POC + Template Foundation (Composite: 7.7/10 — PASS)

| Persona | Question | Score | Assessment |
|---------|----------|-------|------------|
| PE Prof | New user → archetype → target → first score in <10 min? | 8/10 | Onboarding wizard + module selection + scoring routes built. Rubric language correct. |
| Engineer | Template engine from DB not hardcoded? Auth + free tier enforced? | 8/10 | Template engine resolves from DB with 4-layer fallback. Subscription middleware built. |
| Acquirer | After first-score, does acquirer understand value? Upgrade visible? | 7/10 | UpgradePrompt with inline/modal/banner. Gap: not wired into 402 response handling. |

### Sprint 2: Multi-Lens Scoring (Composite: 8.0/10 — PASS)

| Persona | Question | Score | Assessment |
|---------|----------|-------|------------|
| PE Prof | Valuation Attractiveness through 3 lenses — do anchors diverge? | 8/10 | DCF/Comps/LBO with distinct calibration anchors and blind spots. |
| Engineer | Lens data model correct? Notes persist? Library queryable? | 8/10 | evaluation_lenses + lens_notes tables. KB route supports gate/category filtering. |
| Acquirer | Multi-lens adds value or friction? | 8/10 | LensEvaluationPanel with expand/collapse, convergence badges, per-lens notes. |

### Sprint 3: Knowledge Base (Composite: 7.3/10 — PASS with items)

| Persona | Question | Score | Assessment |
|---------|----------|-------|------------|
| PE Prof | Non-paying user learns methodology from KB? | 7/10 | 6 articles covering core concepts. Gap: needs articles for every gate and lens. |
| Engineer | KB renders from data model, not static? Updates reflect? | 7/10 | KB API queries table. Gap: articles are seeded static, not generated from template. |
| Acquirer | Would you send KB link to colleague evaluating adoption? | 8/10 | Educational, not promotional. Reads like a practitioner handbook. |

---

## 18. Development Phase Eval Checkpoints (For Implementation)

These are hands-on pass/fail checks to run against working code during each sprint.

### Persona A — PE Professional (Development Phase)

| ID | Checkpoint | Pass/Fail Criteria |
|----|-----------|-------------------|
| D-A-01 | Methodology Representation Fidelity | Walk app gate-by-gate. Zero terminology errors. All rubric anchors contextually correct. |
| D-A-02 | Scoring Workflow Realism | Complete a full dimension score: guidance → evidence → score → rationale. Flow must feel natural. |
| D-A-03 | Convergence Indicator Accuracy | Score a dimension through multiple lenses with deliberate divergence. Indicator must flag the right tension. |
| D-A-04 | AI Suggestion Quality (S5+) | >60% of AI suggestions within 1 point of expert baseline. Confidence correlates with evidence quality. |
| D-A-05 | IC Narrative Quality (S7) | Generated narrative requires <30% editing to be IC-presentable. No fabricated claims. |
| D-A-06 | Evidence Linking Integrity | Any IC reviewer traces any score to supporting evidence in <3 clicks. |

### Persona B — Senior Engineer (Development Phase)

| ID | Checkpoint | Pass/Fail Criteria |
|----|-----------|-------------------|
| D-B-01 | Data Model Fidelity | Schema matches spec. Indexes cover query patterns. Versioning produces immutable snapshots. |
| D-B-02 | API Contract Compliance | 100% routes return specced shapes. 401/403 on unauthorized. Input validation rejects malformed payloads. |
| D-B-03 | State Management Integrity | Two browser tabs, different users, same dimension. No silent data loss. Last-write-wins with notification. |
| D-B-04 | AI Zone Boundary Enforcement | All AI routes return 403 without valid consent chain. Zero bypass paths. |
| D-B-05 | Performance Benchmarks | Page load <2s. Score save <300ms. AI suggestion <5s. Export <10s. |
| D-B-06 | Test Coverage | >80% on critical paths (scoring, versioning, consent chain, RBAC). TypeScript strict. No `any` at API boundaries. |
| D-B-07 | Error Handling & Edge Cases | Network failure mid-save, AI timeout, malformed upload, concurrent template edit, expired session — all graceful. |

### Persona C — Serial Acquirer (Development Phase)

| ID | Checkpoint | Pass/Fail Criteria |
|----|-----------|-------------------|
| D-C-01 | Multi-Deal Navigation | 5+ targets at various stages. Find the stalled deal in <5 seconds. Filter and sort work. |
| D-C-02 | Scoring Speed Test | Score 10 dimensions across 2 gates. AMP must be ≥20% faster than Excel equivalent. |
| D-C-03 | Lens Value-Add Test | At least 1 lens surfaces a non-obvious angle or tension. Blind spots are accurate. |
| D-C-04 | Team Handoff Workflow | User A scores G0–G2. User B sees all scores, rationale, evidence. Approval workflow is clear. |
| D-C-05 | Template Customization Usability | Fork template, change 3 weights, edit 2 anchors, add a lens. <15 minutes. Versioned. Original unaffected. |
| D-C-06 | Export Utility | PDF formatted and complete. IC memo requires <30 min editing. |

---

## 19. Enterprise SaaS UX Audit Results

Evaluated against patterns from Notion, Linear, Figma, Datadog, DealCloud.

| # | Dimension | Status | Finding |
|---|-----------|--------|---------|
| 1 | Empty States | **RESOLVED** | EmptyState component built with 6 pre-configured variants (EmptyPipeline, EmptyGateScores, EmptyEvidence, EmptyKBSearch, EmptyAnalytics, EmptyTeam). |
| 2 | Loading / Skeleton States | **RESOLVED** | 10 skeleton variants built matching every component shape (DimensionCard, LensPanel, ModuleSelection, GateHeader, KBArticleList, TargetPipeline, OnboardingArchetype). |
| 3 | Error Handling & Recovery | **RESOLVED** | ErrorBoundary with retry. InlineError for section-level failures. useAmpMutation auto-catches errors with toast. |
| 4 | Keyboard Navigation & A11y | **GAP** | No keyboard shortcuts. Need: Tab between dimensions, Cmd+S save, Space expand/collapse, arrow key gate navigation. Target: S2. |
| 5 | Responsive / Mobile | **PARTIAL** | Onboarding responsive. Other components need mobile breakpoints. Target: S2. |
| 6 | Confirmation Dialogs | **PASS** | Break-crystal has full confirmation. Need similar for template fork, weight override, eval deletion. |
| 7 | Toast / Notification System | **RESOLVED** | Sonner integrated via layout. useAmpMutation auto-toasts on success/error. |
| 8 | Breadcrumb Navigation | **RESOLVED** | EvalBreadcrumb reads route context: Pipeline → Target → Gate → Dimension. |
| 9 | Bulk Actions | **GAP** | No bulk operations. Target: S8. |
| 10 | Activity Feed / Audit UI | **PARTIAL** | Audit log backend comprehensive. No browse UI. Target: S3. |
| 11 | Onboarding Tooltips | **GAP** | Need contextual tooltips for modules, lenses, convergence, crystallization. Target: S2. |
| 12 | Settings & Preferences | **GAP** | No user preferences page. Target: S3. |

### Decisions Made Post-Eval

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | TanStack Query v5 | Mutation-heavy app; DevTools; useMutation with cache invalidation |
| Toast system | Sonner via shadcn | Already in ecosystem; zero config; enterprise standard |
| Breadcrumb | shadcn Breadcrumb + shared EvalBreadcrumb wrapper | Deep nesting requires wayfinding |
| Empty states | Custom EmptyState + 6 pre-configured variants | Per-page content, shared layout pattern |
| Skeleton loading | shadcn Skeleton + 10 AMP-specific variants | Perceived performance; TanStack Query isLoading integration |
| Performance caching | TanStack Query client cache (5-min staleTime) | No infrastructure needed; sufficient for current scale |
| Real-time sync | Polling at 30s intervals via refetchInterval | Zero infrastructure; adequate for M&A workflows where analysts work different gates |
| KB content strategy | Hybrid: live methodology rendering + authored articles | Accuracy from data model; depth from authored content |

---

## 20. Eval Cadence Per Sprint

| Sprint | Planning Eval | Dev Eval(s) | Final Output Eval |
|--------|--------------|-------------|-------------------|
| S1 (Wk 1–2) | Day 1–2 | Day 5, Day 8 | Day 10 |
| S2 (Wk 3–4) | Day 1–2 | Day 5, Day 8 | Day 10 |
| S3 (Wk 5–6) | Day 1–2 | Day 5, Day 8 | Day 10 |
| S4 (Wk 7–8) | Day 1–2 | Day 5, Day 8 | Day 10 |
| S5 (Wk 9–10) | Day 1–2 | Day 5, Day 8 | Day 10 |
| S6 (Wk 11–13) | Day 1–2 | Day 6, Day 10, Day 13 | Day 15 |
| S7 (Wk 14–16) | Day 1–2 | Day 6, Day 10, Day 13 | Day 15 |
| S8 (Wk 17–18) | Day 1–2 | Day 5, Day 8 | Day 10 |

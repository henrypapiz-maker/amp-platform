# AMP V2 Development Session Summary

**Date:** April 3-4, 2026
**Branch:** `v2-methodology-engine`
**Deployment:** https://amp-v2-beta.vercel.app
**Repository:** github.com/henrypapiz-maker/amp-platform

---

## Session Overview

Transformed AMP from a single-methodology evaluation tool into a multi-persona, methodology-adaptive platform with 6 acquirer archetypes, AI consent infrastructure, subscription tiers, and a comprehensive knowledge base. All work on a separate branch and DB — v1 production untouched.

---

## Infrastructure Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Branching | Feature branch from main | V1 preserved for posterity; v2 is isolated |
| Database | Separate Neon project | Total isolation from production data |
| State Management | TanStack Query v5 | Mutation-heavy app; cache invalidation; 5-min staleTime |
| Toast System | Sonner via shadcn | Enterprise standard; auto-integration with mutations |
| File Storage | Vercel Blob | Managed, CDN-backed, ~$0.02/GB |
| Deployment | Separate Vercel project (amp-v2-beta) | Independent from v1 ampplatform deployment |

---

## What Was Built (by Sprint)

### S1-S2: Foundation + Multi-Lens Scoring (Pre-session — Code Complete)
- Template engine with 4-layer resolution
- Multi-lens evaluation (22 lenses across all gates)
- G4 evaluation modules (Standard, SaaS, Distressed)
- Per-gate crystallization with break-crystal audit trail
- AI consent chain (4-gate authorization)
- Subscription tiers with free POC model
- Onboarding wizard, TanStack Query, Sonner toasts
- All integrated into v1 codebase on the v2 branch

### S1-S2 Fixes (From Apex Environmental Deal Testing)
- **FIX-1 (Critical):** Auto-redirect to G7 after every action — root cause was stale closure in fetchTarget(). Fixed with useRef to preserve active gate across data refreshes.
- **FIX-2:** Live composite score preview — client-side computation from weights + scores as analyst moves slider. Shows scored/total dimension count.
- **FIX-3:** Minimum 50-character rationale enforcement with character counter and disabled save button.
- **FIX-4:** Score version history — prior score/rationale/user/timestamp snapshotted into scoreHistory jsonb before every overwrite.
- **FIX-5:** Deal-level persona overrides — personaOverrides jsonb on targets table for per-deal thesis customization.
- **FIX-6:** User-defined custom dimensions per deal — customDimensions jsonb on targets table. Weighted (factors into composite with re-normalization) or supplementary (scored separately). Full UI with add dialog, mode selection, and standard DimensionCard rendering.

### S3: Knowledge Base — Live Methodology Rendering
- **API:** GET /api/knowledge-base/methodology — returns full gate/module/lens tree from resolveMethodology()
- **KB Page:** Three-tab structure:
  - **Articles** — authored methodology content (4 seeded articles)
  - **Methodology Reference** — live rendering from template engine with expandable gate accordions, module tabs, dimension cards (weight, rubric, guidance), lens cards (framework, questions, blind spots)
  - **Reference Library** — 17 evidence reference items across all 8 gates with section outlines, quality criteria, and gate filter

### S4: Template Library — 6 Complete Archetypes
All templates fully authored with 8 gates, dimension rubrics (5-point anchors), test guidance, acceptance parameters, evidence artifacts, persona schemas, and weight propagation rules.

| Template | Archetype | Key Differentiator | G1 Min | G5 Min | G6 Min |
|---|---|---|---|---|---|
| PE Platform Build | pe_platform | Baseline PE methodology | 60 | 60 | 55 |
| Search Fund | search_fund | Single operator, SBA eligibility | 55 | 60 | 55 |
| PE Bolt-On / Roll-Up | pe_bolt_on | Synergy/accretion, platform integration | 60 | 70 | 55 |
| Corporate Strategic | corporate | Board strategy alignment, regulatory | 70 | 70 | 60 |
| Family Office / HoldCo | family_office | Perpetual hold, cash yield, no exit | 60 | 60 | 65 |
| Growth Equity | growth_equity | TAM, founder quality, NOT SaaS-specific | 60 | 50 | 55 |

**32 custom lenses** across the 4 new templates (8 per template).

### File Upload Infrastructure
- **Evidence Tab:** Drag-and-drop file upload to Vercel Blob (25MB, PDF/DOCX/XLSX/PPTX/CSV/PNG/JPG). File Upload is default attachment type. Uploaded files display as clickable download links.
- **Persona Strategic Documents:** Full CRUD — upload, list, download, delete. Replaces placeholder "coming soon" screen.

### Evidence Reference Library
- New `evidence_templates` DB table — taxonomy/inventory for sample artifacts
- 17 reference items seeded across all 8 gates with descriptions, recommended sections, quality criteria, and tags
- Browsable via KB "Reference Library" tab with gate filter pills
- Infrastructure ready for downloadable template files (templateBlobUrl field)

---

## Database State (v2 Neon)

| Category | Count |
|---|---|
| Tables | 30 (15 v1 + 15 v2) |
| Methodology Templates | 5 (+ Search Fund = 6 total) |
| Evaluation Modules | 42 |
| Evaluation Lenses | 47 |
| Evidence Reference Items | 17 |
| KB Articles | 4 |
| Users | 4 |
| Targets | 4 (3 seed + 1 renamed test deal) |

---

## Commits on v2-methodology-engine

1. `02cb652` — feat: AMP v2 — methodology engine, multi-lens evaluation, crystallization (46 files, +9,103 lines)
2. `33a90e6` — fix: S1-S2 critical fixes — auto-redirect, composite preview, rationale, score history
3. `581f2e5` — feat: S3 KB methodology rendering + FIX-5/6 custom dimensions & persona overrides
4. `7fa7fc9` — feat: S3 KB methodology rendering + S4 complete template library (6 archetypes)
5. `52b8dca` — fix: make seed idempotent + seed 4 new templates to DB
6. `4a1bb72` — feat: direct file upload to Evidence tab (drag-and-drop + Vercel Blob)
7. `8b929a7` — feat: file uploads — Evidence tab + Persona strategic documents
8. `cf676d6` — feat: Evidence Reference Library — sample templates & guides by gate

---

## Eval Results

### Development Phase Eval (Post S1-S2 Fixes)
| Persona | Score | Verdict |
|---|---|---|
| PE Deal Professional | 8.0/10 | PASS |
| Senior Engineer | 8.3/10 | PASS |
| Serial Acquirer | 7.8/10 | PASS |
| **Overall** | **8.0/10** | **PASS** |

### S3+S4 Eval
| Sprint | Score | Verdict |
|---|---|---|
| S3 (KB Methodology) | 8.0/10 | PASS |
| S4 (Template Library) | 9.0/10 (post-gap-fix) | PASS |

---

## Remaining Roadmap

| Sprint | Focus | Status |
|---|---|---|
| S5 (Wk 9-10) | AI Infrastructure — provider integration | Consent chain ready; needs API connection |
| S6 (Wk 11-13) | Document Intelligence | Not started |
| S7 (Wk 14-16) | AI Scoring + IC Narrative Generation | Not started |
| S8 (Wk 17-18) | Evolution + Analytics + Bulk Operations | Not started |

### Backlog (from Apex testing)
- Bulk approval workflow (S8)
- Approval delegation (S8)
- Cross-gate heatmap / portfolio view (S8)
- CRM integration — HubSpot/Salesforce (S8)
- VDR connector — Intralinks/Firmex (S6)
- Gate transition notifications (S5)
- Peer benchmarking across 5+ deals (S8)
- KB sidebar navigation + breadcrumbs (in progress)

---

## Environment Reference

| Resource | Value |
|---|---|
| V2 Beta URL | https://amp-v2-beta.vercel.app |
| V1 Production URL | https://ampplatform.vercel.app |
| GitHub Branch | v2-methodology-engine |
| V2 Neon DB | ep-muddy-hall-amwfuk8x-pooler.c-5.us-east-1.aws.neon.tech |
| V1 Neon DB | ep-solitary-voice-anjc85d1-pooler.c-6.us-east-1.aws.neon.tech |
| Vercel Project | amp-v2-beta (hanksdevteam) |
| Blob Store | amp-v2-evidence |
| Login (Admin) | henry@aliofoundry.com / admin123 |
| Login (Analyst) | angus@aliofoundry.com / analyst123 |

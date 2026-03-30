# AMP — Code Index & Architecture Summary v1.0

## Platform Vitals

| Metric | Value |
|--------|-------|
| **Framework** | Next.js 14.2.35 (App Router) |
| **Language** | TypeScript 5.x |
| **Database** | Neon PostgreSQL (serverless) |
| **ORM** | Drizzle ORM 0.45 |
| **Auth** | NextAuth v5 (beta 30) — JWT strategy, credentials provider |
| **UI** | Tailwind CSS 3.4 + shadcn/ui components |
| **State** | Zustand 5.x (available, primarily using fetch/useState) |
| **Hosting** | Vercel (serverless, IAD1 region) |
| **Total Files** | 65 source files |
| **Total Lines** | ~7,300 lines of code |
| **DB Tables** | 15 tables |
| **DB Migrations** | 3 migration files |
| **API Routes** | 12 endpoint files (GET/POST/PATCH/DELETE) |
| **Pages** | 7 pages + 1 root redirect |

---

## Directory Structure

```
amp-platform/
├── app/
│   ├── layout.tsx                           # Root layout: Inter font, SessionProvider, TooltipProvider
│   ├── page.tsx                             # Root redirect → /dashboard or /login
│   ├── globals.css                          # Tailwind base + shadcn CSS variables (dark theme)
│   ├── (auth)/
│   │   ├── layout.tsx                       # Auth layout wrapper
│   │   └── login/page.tsx                   # Login page: credentials form, demo accounts, dark theme
│   ├── dashboard/
│   │   ├── layout.tsx                       # Dashboard layout: TopNav + max-w-7xl container
│   │   ├── page.tsx                         # Pipeline dashboard: status tabs, target cards, create dialog
│   │   ├── persona/page.tsx                 # Persona config: 8 attributes, influence map, docs placeholder
│   │   ├── admin/page.tsx                   # Admin panel: users, permissions, audit, criteria, AI settings
│   │   ├── targets/
│   │   │   └── [id]/page.tsx                # Target detail: gate nav, dimensions, evidence, weights, approval
│   │   └── export/
│   │       └── [targetId]/page.tsx          # IC Scorecard: print-optimized export with full gate breakdown
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts      # NextAuth handler
│   │   ├── targets/route.ts                 # GET (list), POST (create) targets
│   │   ├── targets/[id]/route.ts            # GET, PATCH, DELETE individual target
│   │   ├── evaluations/route.ts             # POST: start gate evaluation, create dimension placeholders
│   │   ├── evaluations/[id]/scores/route.ts # GET, PATCH: dimension scores + composite recalculation
│   │   ├── evaluations/[id]/approve/route.ts# GET (approval status), POST (submit approval/rejection)
│   │   ├── evidence/route.ts                # GET, POST, DELETE: evidence links
│   │   ├── persona/route.ts                 # GET, PATCH: acquirer persona configuration
│   │   ├── weights/route.ts                 # GET (merged weights), PATCH (manual overrides)
│   │   ├── criteria/route.ts                # GET (merged criteria), PATCH (admin overrides)
│   │   ├── tolerances/route.ts              # GET (merged tolerances), PATCH (admin overrides)
│   │   ├── admin/users/route.ts             # GET (user list), PATCH (role/lock changes)
│   │   └── audit/route.ts                   # GET: audit trail with user join
│   └── robots.txt/route.ts                  # Disallow all crawlers
├── components/
│   ├── layout/
│   │   └── TopNav.tsx                       # Sticky nav: branding, nav links, user dropdown, mobile menu
│   └── ui/
│       ├── help-tip.tsx                     # HelpTip (inline popup), PageHelp (banner), TabHelp (compact)
│       ├── button.tsx                       # shadcn button
│       ├── card.tsx                         # shadcn card (v3 compatible forwardRef pattern)
│       ├── badge.tsx                        # shadcn badge
│       ├── dialog.tsx                       # shadcn dialog
│       ├── dropdown-menu.tsx                # shadcn dropdown menu
│       ├── tabs.tsx                         # shadcn tabs
│       ├── input.tsx                        # shadcn input
│       ├── label.tsx                        # shadcn label
│       ├── textarea.tsx                     # shadcn textarea
│       ├── select.tsx                       # shadcn select
│       ├── table.tsx                        # shadcn table
│       ├── sheet.tsx                        # shadcn sheet (slide-out panel)
│       ├── separator.tsx                    # shadcn separator
│       ├── avatar.tsx                       # shadcn avatar
│       ├── tooltip.tsx                      # shadcn tooltip
│       ├── progress.tsx                     # shadcn progress bar
│       ├── popover.tsx                      # shadcn popover
│       ├── command.tsx                      # shadcn command palette
│       └── input-group.tsx                  # shadcn input group
├── lib/
│   ├── auth.ts                              # NextAuth config: credentials provider, JWT callbacks
│   ├── auth-types.ts                        # Session/User type augmentations
│   ├── gates.ts                             # 8-gate waterfall: 29 dimensions, rubrics, guidance, params
│   ├── weights.ts                           # Persona → weight adjustment engine
│   ├── permissions.ts                       # RBAC permission checks (hasPermission, requireRole)
│   ├── utils.ts                             # cn() utility (clsx + tailwind-merge)
│   └── db/
│       ├── index.ts                         # Neon serverless connection + Drizzle instance
│       ├── schema.ts                        # 15 Drizzle table definitions
│       ├── seed.ts                          # Demo data: org, 4 users, persona, 5 targets, AI settings
│       └── migrations/
│           ├── 0000_slim_black_cat.sql      # Initial schema (12 core tables)
│           ├── 0001_burly_sabretooth.sql    # Gate approvals + tolerances + dimension criteria
│           └── 0002_rainy_cerise.sql        # Schema refinements
├── middleware.ts                             # Auth protection + AI route blocking
├── drizzle.config.ts                        # Drizzle Kit config (PostgreSQL, Neon)
├── next.config.mjs                          # Security headers, API no-cache
├── tailwind.config.ts                       # Dark theme, stone/amber palette, shadcn color system
├── vercel.json                              # Vercel deployment config
├── .eslintrc.json                           # ESLint: no-explicit-any off, no-unused-vars warn
├── .gitignore                               # node_modules, .next, .env.local excluded
├── package.json                             # 32 dependencies, 10 devDependencies
└── tsconfig.json                            # TypeScript config with @/* path alias
```

---

## Database Schema (15 Tables)

### Core Entities
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `organizations` | Tenant container | id, name |
| `users` | Platform users | orgId, email, passwordHash, role (admin/analyst/viewer), locked |
| `persona_config` | Acquirer identity | orgId (unique), acquisitionThesis, horizonBias, riskTolerance, irrHurdle, integrationPhilosophy, processMaturity, strategicClarity, primarySectors |
| `targets` | Acquisition candidates | orgId, name, sector, revenue, status (new/inflight/closed), currentGate (0-7), compositeScore, outcome (pursue/conditional/pass) |

### Evaluation System
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `gate_evaluations` | Gate-level evaluation | targetId, gateCode (G0-G7), gateStatus (pending/in_progress/passed/failed), compositeScore |
| `dimension_scores` | Per-dimension scores | evaluationId, dimensionName, score (0-10), rationale, aiSuggestedScore (Phase 2), aiConfidence, aiEvidenceQuotes, aiGaps |
| `evidence_links` | Evidence attachments | evaluationId, evidenceArtifactId, linkType (file/url/db/flatfile), label, ref |
| `gate_approvals` | Dual authorization | evaluationId, userId, decision (approve/reject/conditional), rationale |

### Configuration
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `weight_overrides` | Manual weight adjustments | orgId, gateCode, dimensionName, baseWeight, personaAdj, manualOverride, locked |
| `gate_tolerances` | Configurable thresholds | orgId, gateCode, minimumScore, declineThreshold, requiredApprovals, approverRoles[] |
| `dimension_criteria` | Prescriptive guidance overrides | orgId, gateCode, dimensionName, testGuidance, acceptanceParams (JSON) |

### Support
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `persona_documents` | Strategic document uploads | orgId, filename, blobUrl, status, extractedAttrs[] |
| `audit_log` | Activity tracking | orgId, userId, action, targetName, details (JSON) |
| `ai_settings` | AI feature flags | orgId (unique), aiEnabled (default false), aiProvider, documentOptIn, dataResidency, dpaSigned |
| `ai_audit_log` | AI compliance trail | orgId, evaluationId, provider, inputTokenCount, outputTokenCount, inputHash |

### Indexes
- `org_gate_dim_idx` on weight_overrides(orgId, gateCode, dimensionName)
- `org_gate_tol_idx` on gate_tolerances(orgId, gateCode)
- `dim_criteria_idx` on dimension_criteria(orgId, gateCode, dimensionName)

---

## API Route Reference

| Route | Methods | Auth | Permission | Purpose |
|-------|---------|:----:|------------|---------|
| `/api/auth/[...nextauth]` | GET, POST | — | — | NextAuth authentication handler |
| `/api/targets` | GET, POST | ✓ | create_target | List/create targets (org-scoped) |
| `/api/targets/[id]` | GET, PATCH, DELETE | ✓ | edit_target, delete_target | Target CRUD with audit logging |
| `/api/evaluations` | POST | ✓ | score_dimension | Start gate evaluation, create dimension placeholders |
| `/api/evaluations/[id]/scores` | GET, PATCH | ✓ | score_dimension | Read/update dimension scores, auto-recalculate composite |
| `/api/evaluations/[id]/approve` | GET, POST | ✓ | approve_gate | Dual authorization: fetch status, submit approval/rejection |
| `/api/evidence` | GET, POST, DELETE | ✓ | upload_evidence, delete_evidence | Manage evidence links per evaluation |
| `/api/persona` | GET, PATCH | ✓ | edit_persona | Read/update acquirer persona configuration |
| `/api/weights` | GET, PATCH | ✓ | edit_weights | Merged weights (base + persona + override), manual overrides |
| `/api/criteria` | GET, PATCH | ✓ | edit_weights | Merged dimension criteria (defaults + org overrides) |
| `/api/tolerances` | GET, PATCH | ✓ | edit_weights | Merged gate tolerances (defaults + org overrides) |
| `/api/admin/users` | GET, PATCH | ✓ | manage_users | User management: role changes, lock/unlock |
| `/api/audit` | GET | ✓ | view_audit | Audit trail with user join (100 most recent) |
| `/api/ai/*` | — | ✓ | — | Returns 403 (AI disabled in Phase 1) |

---

## Key Business Logic Locations

| Logic | File | Function/Pattern |
|-------|------|------------------|
| Gate definitions (29 dimensions) | `lib/gates.ts` | `GATES` array, `getGate()` |
| Persona → weight adjustments | `lib/weights.ts` | `getPersonaAdjustments()` |
| Effective weight calculation | `lib/weights.ts` | `calculateEffectiveWeight()` — clamp(base + adj, 5, 50) |
| Composite score calculation | `api/evaluations/[id]/scores` | PATCH handler — weighted average → normalize to 100 |
| Gate approval logic | `api/evaluations/[id]/approve` | POST handler — rejection overrides, threshold check |
| Target status machine | `api/evaluations/route.ts` | POST handler — new→inflight on G0, inflight→closed on G7 |
| G7 outcome determination | `api/evaluations/[id]/approve` | On G7 pass: ≥65=pursue, ≥50=conditional, <50=pass |
| RBAC permission checks | `lib/permissions.ts` | `hasPermission(role, action)` |
| Route protection | `middleware.ts` | Auth middleware + AI route blocking |
| Criteria merging | `api/criteria/route.ts` | Defaults from gates.ts + overrides from dimensionCriteria table |

---

## Security Configuration

| Control | Implementation |
|---------|---------------|
| Authentication | NextAuth v5, JWT strategy, bcryptjs password hashing |
| Authorization | RBAC with 3 roles, permission checks on all API routes |
| Route Protection | Middleware redirects unauthenticated requests to /login |
| AI Isolation | AI_ENABLED env var + middleware blocks /api/ai/* routes |
| No Indexing | robots.txt Disallow: /, X-Robots-Tag: noindex on all responses |
| No Framing | X-Frame-Options: DENY |
| No Referrer Leaks | Referrer-Policy: no-referrer |
| API Caching | Cache-Control: no-store on all API routes |
| Audit Trail | All mutations logged with user, action, target, timestamp, details |

---

## Dependencies (32 production, 10 dev)

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.35 | Framework |
| react / react-dom | ^18 | UI library |
| next-auth | ^5.0.0-beta.30 | Authentication |
| drizzle-orm | ^0.45.1 | Database ORM |
| @neondatabase/serverless | ^1.0.2 | Neon PostgreSQL driver |
| bcryptjs | ^3.0.3 | Password hashing |
| zustand | ^5.0.12 | Client state management |
| lucide-react | ^1.0.1 | Icon library |
| tailwind-merge | ^3.5.0 | CSS class merging |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Conditional classnames |
| jspdf | ^4.2.1 | PDF generation |
| html2canvas | ^1.4.1 | HTML-to-canvas for export |
| shadcn | ^4.1.0 | Component library CLI |
| @radix-ui/* | various | Headless UI primitives (11 packages) |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-kit | ^0.31.10 | Migration generation |
| tsx | ^4.21.0 | TypeScript execution (seeds) |
| typescript | ^5 | Type checking |
| tailwindcss | ^3.4.1 | CSS framework |
| eslint + eslint-config-next | ^8 | Linting |

---

*Code Index v1.0 · Generated March 2026 · Alio Foundry*

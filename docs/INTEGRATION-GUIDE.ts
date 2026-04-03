// ═══════════════════════════════════════════════════════════════
// AMP v2 Integration Guide
//
// This file documents every touch point where v2 components
// plug into the existing v1 codebase. Each section shows:
//   1. Which v1 file to modify
//   2. What to import
//   3. Where to insert the new component
//   4. Any prop wiring needed
//
// Execute in order. Run migration + seed before starting.
// ═══════════════════════════════════════════════════════════════

/*
═══════════════════════════════════════════════════════════════
  STEP 0: DATABASE
═══════════════════════════════════════════════════════════════

  1. Run migration:
     npx drizzle-kit push  (or apply 0003_methodology_v2.sql manually)

  2. Run v2 seed:
     npx tsx lib/db/seed-v2.ts

  3. Verify: Check that methodology_templates, evaluation_modules,
     and evaluation_lenses tables have records.

═══════════════════════════════════════════════════════════════
  STEP 1: AUTH FLOW → ONBOARDING
═══════════════════════════════════════════════════════════════

  File: app/auth/signin/page.tsx (or wherever your post-login redirect lives)

  After successful authentication, check if the org has a methodology template:

  ```tsx
  // In your post-auth redirect logic:
  import { redirect } from "next/navigation";

  // After session is established:
  const hasTemplate = await db.select()
    .from(orgMethodology)
    .where(eq(orgMethodology.orgId, session.user.orgId))
    .limit(1);

  if (hasTemplate.length === 0) {
    redirect("/onboarding");  // New v2 onboarding wizard
  } else {
    redirect("/dashboard");   // Existing v1 dashboard
  }
  ```

  The onboarding page is: app/onboarding/page.tsx (already created)

═══════════════════════════════════════════════════════════════
  STEP 2: DASHBOARD SIDEBAR → KNOWLEDGE BASE LINK
═══════════════════════════════════════════════════════════════

  File: components/layout/Sidebar.tsx (or your nav component)

  Add to navigation items array:

  ```tsx
  import { BookOpen } from "lucide-react";

  // In your nav items array, add:
  {
    href: "/knowledge-base",
    label: "Knowledge Base",
    icon: BookOpen,
  }
  ```

  The KB page is: app/knowledge-base/page.tsx (already created)
  The KB API is: app/api/knowledge-base/route.ts (already created)

═══════════════════════════════════════════════════════════════
  STEP 3: TARGET DETAIL → MODULE SELECTION AT GATE START
═══════════════════════════════════════════════════════════════

  File: app/dashboard/targets/[id]/page.tsx (your target detail page)

  When the user clicks "Start Evaluation" on a gate, show the
  ModuleSelection component instead of immediately creating the
  evaluation:

  ```tsx
  import ModuleSelection from "@/components/evaluation/ModuleSelection";
  import { GateStatusBar } from "@/components/evaluation/CrystallizationUI";

  // State:
  const [showModuleSelect, setShowModuleSelect] = useState<string | null>(null);

  // When user clicks "Start Evaluation" on a gate:
  function handleStartGate(gateCode: string) {
    setShowModuleSelect(gateCode);
  }

  // In JSX, when showModuleSelect is set:
  {showModuleSelect && (
    <ModuleSelection
      gateCode={showModuleSelect}
      gateName={gates.find(g => g.code === showModuleSelect)?.name || ""}
      onSelect={async (moduleId, moduleName) => {
        // Create evaluation with module selection
        const res = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetId: target.id,
            gateCode: showModuleSelect,
            moduleId,
          }),
        });
        const evaluation = await res.json();
        setShowModuleSelect(null);
        // Navigate to or expand the gate evaluation UI
        router.push(`/dashboard/targets/${target.id}/gate/${showModuleSelect}`);
      }}
      onCancel={() => setShowModuleSelect(null)}
    />
  )}
  ```

═══════════════════════════════════════════════════════════════
  STEP 4: GATE HEADER → CRYSTALLIZATION STATUS BAR
═══════════════════════════════════════════════════════════════

  File: Wherever you render gate headers (e.g., GateCard component
  or the gate evaluation page)

  ```tsx
  import { GateStatusBar } from "@/components/evaluation/CrystallizationUI";

  // In the gate header area:
  <GateStatusBar
    gateCode={evaluation.gateCode}
    gateStatus={evaluation.gateStatus}
    isCrystallized={evaluation.isCrystallized || false}
    crystallizedAt={evaluation.crystallizedAt}
    moduleName={evaluation.moduleName}
    templateVersion={evaluation.templateVersionSnapshot}
    canBreakCrystal={session.user.role === "admin"}
    evaluationId={evaluation.id}
    onCrystalBroken={() => {
      // Refresh the evaluation data
      fetchEvaluation();
    }}
  />
  ```

═══════════════════════════════════════════════════════════════
  STEP 5: DIMENSION SCORING → LENS EVALUATION PANEL
═══════════════════════════════════════════════════════════════

  File: Your DimensionCard or dimension scoring component

  The LensEvaluationPanel sits BELOW the score input and rationale
  textarea, inside each dimension's expanded view:

  ```tsx
  import LensEvaluationPanel from "@/components/evaluation/LensEvaluationPanel";

  // Props come from the GET /api/evaluations/[id]/scores response:
  // - scores.lensesByDimension[dimensionName] → lens array
  // - scores.notesByLens → lens note records

  // Inside each dimension card's expanded view:
  <LensEvaluationPanel
    dimensionName={dimension.name}
    gateCode={evaluation.gateCode}
    evaluationId={evaluation.id}
    lenses={lensesByDimension[dimension.name] || []}
    currentScore={dimension.score}
    notes={Object.values(notesByLens).filter(
      n => lensesByDimension[dimension.name]?.some(l => l.id === n.lensId)
    )}
    onNoteSave={async (lensId, content) => {
      await fetch(`/api/evaluations/${evaluation.id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lensId, content }),
      });
      // Refresh notes
      fetchScores();
    }}
    isCrystallized={evaluation.isCrystallized || false}
  />
  ```

═══════════════════════════════════════════════════════════════
  STEP 6: SCORES API → TEMPLATE ENGINE WIRING
═══════════════════════════════════════════════════════════════

  Replace the existing scores route with the v2 version:

  Old: app/api/evaluations/[id]/scores/route.ts (v1 — uses static GATES)
  New: Use the v2 scores-route.ts which calls resolveGateMethodology()

  The v2 route is backward-compatible: if template engine resolution
  fails, it falls back to the static GATES import from gates.ts.

═══════════════════════════════════════════════════════════════
  STEP 7: APPROVAL API → CRYSTALLIZATION WIRING
═══════════════════════════════════════════════════════════════

  Replace the existing approve route with the v2 version:

  Old: app/api/evaluations/[id]/approve/route.ts (v1)
  New: Use the v2 approve-route.ts which calls crystallizeGate()
       on dual auth passage and supports DELETE for break-crystal.

  Same backward-compatibility: if crystallization fails, the gate
  still passes — it just isn't frozen.

═══════════════════════════════════════════════════════════════
  STEP 8: SUBSCRIPTION MIDDLEWARE → FREE TIER ENFORCEMENT
═══════════════════════════════════════════════════════════════

  File: app/api/targets/route.ts (the POST endpoint for creating targets)

  Wrap the existing handler:

  ```tsx
  import { withTargetLimit } from "@/lib/subscription";

  // Change:
  export async function POST(req) { ... }
  // To:
  export const POST = withTargetLimit(async (req) => { ... });
  ```

  For feature-gated routes (e.g., cross-deal analytics):

  ```tsx
  import { withFeature } from "@/lib/subscription";

  export const GET = withFeature("crossDealAnalytics")(async (req) => { ... });
  ```

═══════════════════════════════════════════════════════════════
  STEP 9: AI ROUTES → CONSENT CHAIN ENFORCEMENT
═══════════════════════════════════════════════════════════════

  For any future /api/ai/* routes, wrap with consent middleware:

  ```tsx
  import { withAIConsent } from "@/lib/ai/consent-chain";

  export const POST = withAIConsent(async (req, consent) => {
    // consent.context.documentOptIns contains opted-in doc IDs
    // ... call AI provider with only those documents
  });
  ```

═══════════════════════════════════════════════════════════════
  FILE PLACEMENT SUMMARY
═══════════════════════════════════════════════════════════════

  New files to add to the project:

  lib/
  ├── ai/
  │   ├── consent-chain.ts          ← AI security middleware
  │   └── prompt-templates.ts       ← AI prompt architecture
  ├── db/
  │   ├── schema-v2.ts              ← 13 new Drizzle tables
  │   ├── migrations/
  │   │   └── 0003_methodology_v2.sql  ← Migration DDL
  │   └── seed-v2.ts                ← Seeds template + modules + lenses
  ├── lenses/
  │   ├── pe-platform-lenses.ts     ← G1, G4, G5, G6 lenses
  │   └── pe-platform-lenses-extended.ts  ← G2, G3, G7 lenses
  ├── modules/
  │   └── g4-modules.ts             ← 3 G4 evaluation modules
  ├── templates/
  │   └── search-fund-template.ts   ← Search Fund template content
  ├── template-engine.ts            ← 4-layer methodology resolution
  └── subscription.ts               ← Tier limits + middleware

  app/
  ├── onboarding/
  │   └── page.tsx                  ← 3-step onboarding wizard
  ├── knowledge-base/
  │   └── page.tsx                  ← Methodology browser
  └── api/
      ├── evaluations/
      │   ├── route.ts              ← Updated: module selection
      │   └── [id]/
      │       ├── approve/route.ts  ← Updated: crystallization
      │       └── scores/route.ts   ← Updated: template engine + lens notes
      └── knowledge-base/
          └── route.ts              ← KB article API

  components/
  └── evaluation/
      ├── ModuleSelection.tsx       ← Module picker at gate start
      ├── LensEvaluationPanel.tsx   ← Lens cards + convergence
      └── CrystallizationUI.tsx     ← Status badge + break-crystal dialog

═══════════════════════════════════════════════════════════════
  VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════

  After integration, verify each flow:

  □ New user signup → lands on /onboarding → selects archetype →
    configures persona → enters first target → redirected to
    target detail page

  □ Start gate evaluation → ModuleSelection appears if gate has
    multiple modules → select module → evaluation created with
    moduleId → dimensions from selected module appear

  □ Score a dimension → lens panel visible below score input →
    expand a lens → see guidance, key questions, calibration →
    write a per-lens note → convergence badge updates

  □ Approve a gate → second approval triggers crystallization →
    gate header shows crystallized badge → scores are read-only →
    break crystal button visible for admin → requires justification

  □ Knowledge Base accessible from sidebar → articles load →
    search works → category filter works → article detail renders

  □ Free tier: second target creation returns 402 with upgrade prompt

  □ AI consent: hitting /api/ai/* without DPA returns 403 with
    clear error message identifying which gate failed
*/

export {};

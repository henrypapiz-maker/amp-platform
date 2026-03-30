# AMP — User Guide v1.0

## Acquisition Management Platform · Alio Foundry · March 2026

---

## 1. Getting Started

### 1.1 Accessing AMP

Navigate to your AMP deployment URL. You will see the login screen with the AMP branding and credential form.

**Demo Accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | henry@aliofoundry.com | admin123 |
| Analyst | angus@aliofoundry.com | analyst123 |
| Analyst | andrew@aliofoundry.com | analyst123 |
| Viewer | client@example.com | viewer123 |

Click any demo account button to auto-fill credentials, then click **Sign In**.

### 1.2 Role Permissions

| Capability | Admin | Analyst | Viewer |
|------------|:-----:|:-------:|:------:|
| View pipeline & targets | ✓ | ✓ | ✓ |
| Create & edit targets | ✓ | ✓ | — |
| Score dimensions | ✓ | ✓ | — |
| Upload evidence | ✓ | ✓ | — |
| Approve/reject gates | ✓ | ✓ | — |
| Edit gate weights | ✓ | — | — |
| Edit persona configuration | ✓ | — | — |
| Manage users & roles | ✓ | — | — |
| View audit trail | ✓ | — | — |
| Configure criteria & tolerances | ✓ | — | — |
| Close/archive deals | ✓ | — | — |
| Export IC Scorecards | ✓ | ✓ | ✓ |

---

## 2. Pipeline Dashboard

After login, you land on the **Pipeline** page. This is your deal management hub.

### 2.1 Status Tabs

Targets are organized into three status categories:

- **New** — Targets that have been entered but not yet evaluated through G0
- **In Flight** — Targets that have passed G0 and are actively moving through the gate waterfall
- **Closed** — Targets that have reached a final decision (PURSUE, CONDITIONAL, or PASS)

Click any tab to filter. Each tab shows a count badge.

### 2.2 Target Cards

Each target card displays:
- **Name** — Company/target name
- **Sector** — Industry classification
- **Revenue** — Estimated annual revenue
- **Gate Badge** — Current gate position (G0–G7)
- **Composite Score** — Overall evaluation score (0–100) with progress bar
- **Outcome Badge** — Final decision (only for closed targets)
- **Notes** — First two lines of analyst notes

Click any card to enter the target evaluation view.

### 2.3 Creating a New Target

1. Click the **Enter Target** button (top right, visible to Admin and Analyst roles)
2. Fill in the required fields:
   - **Target Name** (required) — e.g., "Precision Dynamics LLC"
   - **Sector** — e.g., "Aerospace & Defense"
   - **Revenue** — e.g., "$24M"
   - **Notes** — Initial observations about the target
3. Click **Create Target**
4. The target appears in the "New" tab

---

## 3. Target Evaluation — The 8-Gate Waterfall

### 3.1 Gate Navigation

When you open a target, the left sidebar shows all 8 gates with status indicators:

| Icon | Status |
|------|--------|
| ○ (gray circle) | Pending — not yet started |
| ◷ (amber clock) | In Progress — evaluation underway |
| ✓ (green check) | Passed — gate approved |
| ✗ (red X) | Failed — gate rejected |

**You can click any gate at any time** to view or edit its data, regardless of the target's current gate position. Gate progression is advisory, not enforced — analysts often work gates out of order as information arrives.

### 3.2 Starting an Evaluation

1. Click a gate in the left sidebar
2. Click **Start Evaluation** (appears for pending gates)
3. The system creates dimension score placeholders for all dimensions in that gate

### 3.3 The Gate Detail View

Each gate has five tabs:

#### Overview Tab
- Gate purpose and description
- Gate rule (minimum score, decline threshold)
- Current composite score with pass/fail indicator
- Dimensions scored count

#### Dimensions Tab
Each dimension displays as an expandable card showing:

1. **Test Guidance** — Prescriptive instructions explaining what to evaluate and how
2. **Acceptance Parameters** — Configurable thresholds (e.g., approved geographies, revenue bands)
3. **Rubric Anchors** — The 0/3/5/7/10 scoring scale with specific criteria at each level
4. **Score Input** — Slider (0–10 for scored gates) or Pass/Fail buttons (G0 binary gates)
5. **Rationale** — Free-text field to document reasoning
6. **Save Score** button

**Scoring workflow:**
1. Expand a dimension
2. Read the test guidance and acceptance parameters
3. Review the rubric anchors to calibrate your score
4. Set the score using the slider or buttons
5. Write a brief rationale
6. Click **Save Score**
7. The composite score recalculates automatically

#### Evidence Tab
Shows required evidence artifacts for the gate with attachment status:
- Green "X attached" badge — evidence linked
- Gray "Not attached" badge — evidence needed

To attach evidence:
1. Click **Attach Evidence** on any artifact
2. Select the link type (File, URL, Database Reference, Flat File)
3. Fill in the label, reference, and optional note
4. Click **Attach**

#### Weights Tab
Shows the weight calculation for each dimension:
- **Base Weight** — default from AMP methodology
- **Persona Adjustment** — automatic adjustment from acquirer persona (with reason)
- **Effective Weight** — final weight used in scoring (base + persona, clamped 5–50%)
- **Manual Override** — admin can set a custom weight
- **Lock** — prevents persona adjustments from modifying this weight

#### Approval Tab
Shows the dual authorization workflow:
- Required approvals count (default: 2)
- Current approval/rejection decisions
- **Approve** or **Reject** buttons (with rationale field)
- Status: who has approved, who is pending

### 3.4 Gate Scoring Rules

| Gate | Type | Minimum Score | Decline Threshold | Special Rules |
|------|------|:------------:|:-----------------:|---------------|
| G0 | Binary | N/A | N/A | All 4 dimensions must pass |
| G1 | Scored | 60 | 40 | Below 40 = auto decline |
| G2 | Scored | 55 | 40 | Below 40 = decline (unless H3 target) |
| G3 | Scored | 60 | N/A | Any 0-score dimension requires senior sign-off |
| G4 | Scored | 60 | N/A | Returns must exceed IRR hurdle |
| G5 | Scored | 55 | N/A | Integration cost < 60% of synergy NPV |
| G6 | Scored | 55 | N/A | No fatal legal/regulatory flags |
| G7 | Decision | 65 | 50 | ≥65 = PURSUE, 50–64 = CONDITIONAL, <50 = PASS |

All thresholds are configurable by admin in the Admin Panel → Criteria tab.

### 3.5 Dual Authorization (Gate Approval)

To advance a target past any gate:

1. At least **2 authorized users** must approve (default configuration)
2. Both approvers must have Admin or Analyst role
3. Each approver clicks **Approve** or **Reject** with a rationale
4. If **any reviewer rejects** → gate status = FAILED
5. If **required approvals met** with no rejections → gate status = PASSED
6. The same user cannot approve twice on the same gate

When a gate passes:
- Target's current gate advances
- On G0 passage: target status changes from "new" → "inflight"
- On G7 passage: target status changes to "closed" with outcome set by composite score

---

## 4. Persona Configuration

Navigate to **Persona** via the top navigation bar.

### 4.1 Profile Tab — 8 Attributes

| Attribute | Options | Effect on Weights |
|-----------|---------|-------------------|
| Acquisition Thesis | Capability Buy, Market Extension, Revenue Synergy, Cost Synergy, Platform Build, Talent Acquisition | Adjusts G1/G2/G3 dimension weights |
| Horizon Bias | H1 Defend & Extend, H2 Build Emerging, H3 Create Options | Adjusts G2/G4 dimension weights |
| Integration Philosophy | Full Integration (100-Day), Partial Integration, Standalone / Bolt-On | Adjusts G5 Systems Compatibility weight |
| Risk Tolerance | Conservative, Moderate, Aggressive | Adjusts G6 risk dimension weights |
| IRR Hurdle | 1–5 scale | ≥4 boosts G4 Valuation Attractiveness weight |
| Process Maturity | 1–5 scale | Informational (Phase 2 influence) |
| Strategic Clarity | 1–5 scale | Informational (Phase 2 influence) |
| Primary Sectors | Comma-separated list | Used in G0 Sector Fit assessment |

### 4.2 How Persona Affects Weights

Each persona attribute triggers specific weight adjustments:

- **Capability Buy** → G1 "Capability Gap Fill" +10%
- **Market Extension** → G2 "Market Growth Rate" +10%
- **Revenue Synergy** → G3 "Customer Segment Fit" +10%
- **Cost Synergy** → G3 "Cost Structure Compatibility" +10%
- **H1 (core)** → G4 "Valuation Attractiveness" +15%
- **H3 (options)** → G2 "Disruption/Obsolescence" +10%
- **Full Integration** → G5 "Systems Compatibility" +15%
- **Standalone** → G5 "Systems Compatibility" -10%
- **Conservative risk** → G6 "Legal & Regulatory" +10%, "Customer Concentration" +10%, "Key Person Risk" +5%
- **Aggressive risk** → G6 "Legal & Regulatory" -5%
- **IRR Hurdle ≥4** → G4 "Valuation Attractiveness" +10%

### 4.3 Influence Map Tab

Shows all currently active weight adjustments in a table format with gate, dimension, adjustment percentage, and reason.

### 4.4 Documents Tab

Placeholder for Phase 2 — upload strategic memos, investment theses, and board materials that inform the persona configuration.

---

## 5. Administration

Navigate to **Admin** via the top nav or user dropdown. Available to Admin and Analyst roles (Analyst has limited access).

### 5.1 Users Tab

- View all platform users with name, email, role, and status
- **Change Role** — Admin can change any user between Admin/Analyst/Viewer
- **Lock/Unlock** — Admin can lock a user account (prevents login)

### 5.2 Permissions Tab

Displays the full RBAC permission matrix showing which actions each role can perform.

### 5.3 Audit Trail Tab (Admin only)

Chronological log of all platform actions:
- Target created/updated/deleted
- Dimension scores saved
- Gate approvals/rejections
- Evidence attached/removed
- Persona configuration changes
- Weight overrides
- User role changes
- Criteria and tolerance updates

Each entry shows: action type, target name, user name, and timestamp.

### 5.4 Criteria Tab (Admin only)

Configure prescriptive guidance and acceptance parameters for each dimension:

1. Select a gate from the dropdown
2. View all dimensions with their current guidance and parameters
3. Click **Edit** on any dimension to modify:
   - **Test Guidance** — Instructions for how to evaluate this dimension
   - **Acceptance Parameters** — Configurable thresholds (e.g., approved geographies, revenue ranges)
4. Changes take effect immediately for all users
5. **Reset to Defaults** restores AMP methodology defaults

### 5.5 AI Integration Tab

Shows AI-assisted scoring capabilities (currently disabled):
- Requires Data Processing Agreement on file
- Operates at per-document granularity
- AI suggestions are advisory only — analyst confirms every score
- Every AI call logged to separate compliance audit trail

Contact Alio Foundry to enable AI features for your organization.

---

## 6. IC Scorecard Export

Generate a printable Investment Committee scorecard for any target:

1. Navigate to the target detail page
2. Click **Export IC Scorecard** button
3. The export page opens with a white-background, print-optimized layout showing:
   - Executive summary (target name, sector, revenue, status)
   - IC Recommendation banner (PURSUE / CONDITIONAL / PASS)
   - Composite score
   - Acquirer persona context
   - Gate-by-gate breakdown with dimension scores and rationale
   - Evidence count per gate
4. Use **Ctrl+P** (or Cmd+P on Mac) to print or save as PDF
5. The page uses print-optimized CSS that hides navigation and screen-only elements

---

## 7. Scoring Methodology — How Weights Work

### 7.1 Composite Score Calculation

Each gate's composite score is calculated as:

```
Composite = Σ (dimension_score × effective_weight) / Σ effective_weight × 10
```

Where:
- **dimension_score** is the analyst's 0–10 score
- **effective_weight** is the final weight after persona adjustments
- Result is normalized to a 0–100 scale

### 7.2 Weight Determination

For each dimension, the effective weight is determined by:

1. **Base Weight** — Defined by AMP methodology (e.g., G1 "Capability Gap Fill" = 30%)
2. **Persona Adjustment** — Automatic adjustment from acquirer persona (e.g., +10% for Capability Buy thesis)
3. **Manual Override** — Admin can set a custom weight that bypasses both base and persona
4. **Clamping** — Effective weight is always between 5% and 50% (prevents extreme skewing)
5. **Lock** — Admin can lock a dimension's weight, preventing persona changes from affecting it

Formula: `effective = manual_override ?? clamp(base + persona_adj, 5, 50)`

### 7.3 Configurable Tolerances

Admins can adjust per-gate thresholds in the Admin Panel:

- **Minimum Score** — Composite score required to pass the gate
- **Decline Threshold** — Score below which the target is automatically declined
- **Required Approvals** — Number of authorized users who must approve gate passage (default: 2)
- **Approver Roles** — Which roles can approve (default: Admin + Analyst)

---

## 8. Data Isolation & Security

### 8.1 What AMP Does NOT Do

- ❌ No data is sent to any external AI/LLM service (AI is disabled by default)
- ❌ No search engine indexing (robots.txt blocks all crawlers)
- ❌ No external analytics or tracking scripts
- ❌ No CDN-hosted assets that could leak referrer data
- ❌ No public URLs for evidence files

### 8.2 Security Headers

All responses include:
- `X-Robots-Tag: noindex, nofollow, noarchive`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- API routes: `Cache-Control: no-store`

### 8.3 Three-Zone Architecture

- **Zone 1 (Core Platform)** — Always active. No external API calls. All evaluation, scoring, evidence, and export functions operate entirely within the platform boundary.
- **Zone 2 (AI Isolation Layer)** — Feature-flagged OFF by default. Requires admin activation, DPA on file, and per-document analyst consent.
- **Zone 3 (Enterprise Isolation)** — Phase 3. Self-hosted LLM option for GDPR/DORA compliance.

---

*AMP User Guide v1.0 · Alio Foundry · March 2026*

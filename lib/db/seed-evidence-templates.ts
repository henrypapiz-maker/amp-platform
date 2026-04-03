// ═══════════════════════════════════════════════════════════════
// Evidence Reference Library Seed
// Populates the evidence_templates table with artifact definitions,
// section outlines, and quality criteria for all 8 gates.
// Run: npx tsx lib/db/seed-evidence-templates.ts
// ═══════════════════════════════════════════════════════════════

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import * as v2 from "./schema-v2";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { ...schema, ...v2 } });

const EVIDENCE_CATALOG = [
  // ── G0: Universe Qualification ──────────────────────────────
  {
    gateCode: "G0", artifactId: "g0-scorecard", name: "Universe Qualification Scorecard",
    category: "template",
    description: "A structured pass/fail scorecard documenting whether the target meets all hard-filter criteria: sector fit, size parameters, geography, and ownership availability.",
    sections: [
      { heading: "Target Overview", guidance: "Company name, sector, HQ location, revenue, EBITDA, headcount" },
      { heading: "Sector Fit Assessment", guidance: "Map target NAICS code against approved acquisition sectors. Document alignment or exclusion rationale." },
      { heading: "Size Parameters", guidance: "Revenue and EBITDA vs. acquisition band. Employee count. If outside range, document exception rationale." },
      { heading: "Geography Check", guidance: "HQ and operational locations. Revenue by geography. Sanctions/embargo screening results." },
      { heading: "Ownership & Availability", guidance: "Ownership structure. Seller motivation. Any structural impediments to acquisition (regulatory, contractual)." },
      { heading: "Pass/Fail Summary", guidance: "Binary outcome per dimension. Overall gate result. Any conditional passes with rationale." },
    ],
    qualityCriteria: "Complete scorecard with no blank dimensions. Each pass/fail is supported by at least one data point. Sources cited for all factual claims. Completed within 48 hours of deal sourcing.",
    tags: ["qualification", "screening", "binary"],
  },
  {
    gateCode: "G0", artifactId: "g0-source-log", name: "Deal Source Log",
    category: "checklist",
    description: "Origin tracking document recording how the target was sourced, who introduced it, NDA status, and initial contact timeline.",
    sections: [
      { heading: "Source Channel", guidance: "Inbound, intermediary (name firm), proprietary outreach, auction, management referral" },
      { heading: "Key Contacts", guidance: "Seller name/role, intermediary contact, internal sponsor" },
      { heading: "Timeline", guidance: "First contact date, NDA signed, CIM received, site visit scheduled" },
      { heading: "Competitive Dynamics", guidance: "Is this proprietary? Auction? How many other parties are involved?" },
      { heading: "Initial Impressions", guidance: "1-2 paragraph initial thesis for why this target is worth evaluating" },
    ],
    qualityCriteria: "All fields populated. NDA status current. Competitive dynamics documented within 72 hours of engagement.",
    tags: ["sourcing", "pipeline", "tracking"],
  },

  // ── G1: Strategic Alignment ─────────────────────────────────
  {
    gateCode: "G1", artifactId: "g1-fit-memo", name: "Strategic Fit Memo",
    category: "template",
    description: "1-2 page memo mapping the target against the acquirer's strategic objectives. Documents which strategic pillars the acquisition advances and how directly.",
    sections: [
      { heading: "Executive Summary", guidance: "2-3 sentence thesis: why this target fits the strategy" },
      { heading: "Strategic Objective Mapping", guidance: "Table: Strategic pillar → Target capability → Strength of linkage (direct/indirect/tangential)" },
      { heading: "Capability Gap Analysis", guidance: "Which documented capability gaps does this target fill? Reference the capability matrix." },
      { heading: "Build vs. Buy Assessment", guidance: "Could we build this capability organically? At what cost and timeline? Why is acquisition preferred?" },
      { heading: "Competitive Context", guidance: "Which competitors would benefit from acquiring this target? What happens if we don't act?" },
      { heading: "Recommendation", guidance: "Proceed / Conditional / Pass with specific rationale" },
    ],
    qualityCriteria: "References specific strategic plan sections. Build vs. buy analysis is quantified (not just narrative). Competitive context includes at least 2 named competitors. Written within 1 week of G0 passage.",
    tags: ["strategy", "fit", "memo", "G1"],
  },
  {
    gateCode: "G1", artifactId: "g1-gap-matrix", name: "Capability Gap Matrix",
    category: "framework",
    description: "Visual matrix mapping the acquirer's current capabilities against target capabilities. Identifies gaps, overlaps, and extensions.",
    sections: [
      { heading: "Capability Categories", guidance: "List 8-12 capability categories relevant to the acquirer (technology, market access, talent, IP, infrastructure, etc.)" },
      { heading: "Current State (Acquirer)", guidance: "Rate each capability 1-5 for the acquirer. Document evidence." },
      { heading: "Target Contribution", guidance: "Rate each capability 1-5 for the target. Identify which cells the target fills." },
      { heading: "Gap Analysis", guidance: "Highlight cells where acquirer is weak (1-2) and target is strong (4-5). These are the high-value gaps." },
      { heading: "Overlap Assessment", guidance: "Identify capabilities where both are strong — these create redundancy risk or integration complexity." },
    ],
    qualityCriteria: "At least 8 capability categories. Ratings supported by evidence. Gap cells clearly highlighted. Overlap risks identified.",
    tags: ["capability", "gap", "matrix", "framework"],
  },
  {
    gateCode: "G1", artifactId: "g1-comp-brief", name: "Competitive Context Brief",
    category: "guide",
    description: "1-page brief assessing the competitive implications of the acquisition. Who else would want this target? What happens if a competitor acquires it instead?",
    sections: [
      { heading: "Competitive Landscape", guidance: "Top 5 competitors in the target's market with market share estimates" },
      { heading: "Competitor Interest Assessment", guidance: "Which competitors would likely bid? Have any approached the target?" },
      { heading: "Denial Value", guidance: "What is the strategic cost if a top competitor acquires this target instead?" },
      { heading: "Market Impact", guidance: "How does the combined entity's market position change post-acquisition?" },
    ],
    qualityCriteria: "Names at least 3 specific competitors. Denial value is articulated (even if not fully quantified). Market share impact estimated.",
    tags: ["competitive", "strategy", "denial"],
  },

  // ── G2: Market & Competitive Position ───────────────────────
  {
    gateCode: "G2", artifactId: "g2-market-brief", name: "Market Assessment Brief",
    category: "template",
    description: "2-3 page analysis of the target's market: size, growth rate, drivers, and structural characteristics.",
    sections: [
      { heading: "Market Definition", guidance: "Define the served addressable market. Distinguish SAM from TAM. Use industry standard classification." },
      { heading: "Market Size & Growth", guidance: "Current market size ($). Historical CAGR (5yr). Projected CAGR (5yr). Source all figures." },
      { heading: "Growth Drivers", guidance: "3-5 structural growth drivers (regulation, demographics, technology adoption, etc.)" },
      { heading: "Market Structure", guidance: "Fragmented vs. consolidated? Number of competitors. Barriers to entry. Switching costs." },
      { heading: "Disruption Risk", guidance: "Technology disruption vectors. Timeline to material impact. Regulatory change risks." },
    ],
    qualityCriteria: "Market size sourced from independent research (not management estimates). Growth drivers are structural, not cyclical. Disruption assessment covers 7+ year horizon.",
    tags: ["market", "TAM", "growth", "analysis"],
  },
  {
    gateCode: "G2", artifactId: "g2-comp-map", name: "Competitive Landscape Map",
    category: "framework",
    description: "Visual mapping of competitors by market position, size, and strategic focus. Identifies competitive lanes and white space.",
    sections: [
      { heading: "Competitor Inventory", guidance: "List top 10-15 competitors with: name, revenue estimate, market share, geographic focus, key differentiator" },
      { heading: "Positioning Map", guidance: "2x2 or bubble chart plotting competitors on relevant axes (e.g., specialization vs. scale, price vs. quality)" },
      { heading: "Competitive Dynamics", guidance: "Who is gaining share? Losing? Any recent M&A activity among competitors?" },
      { heading: "Target Positioning", guidance: "Where does the target sit? What is its competitive lane? How defensible is it?" },
    ],
    qualityCriteria: "At least 10 competitors mapped. Revenue/share estimates sourced. Positioning map includes the target and acquirer.",
    tags: ["competitive", "landscape", "positioning", "map"],
  },

  // ── G3: Business Model Compatibility ────────────────────────
  {
    gateCode: "G3", artifactId: "g3-bmc", name: "Business Model Comparison",
    category: "template",
    description: "Side-by-side comparison of acquirer and target business models across revenue model, cost structure, customer segments, and go-to-market motion.",
    sections: [
      { heading: "Revenue Model Comparison", guidance: "Contract vs. spot, subscription vs. project, recurring vs. one-time. Pricing structures. Billing cycles." },
      { heading: "Customer Segment Overlap", guidance: "Compare buyer personas, procurement processes, account sizes, industry verticals served." },
      { heading: "GTM Motion", guidance: "Sales model (enterprise, mid-market, SMB), channel strategy (direct, partner, hybrid), marketing approach" },
      { heading: "Cost Structure", guidance: "Gross margin comparison. Key cost drivers. Compensation structures. Technology spend." },
      { heading: "Conflict Register", guidance: "List specific conflicts: channel conflicts, pricing conflicts, customer confusion risks" },
    ],
    qualityCriteria: "All 5 sections completed. Conflicts are specific (not generic). Revenue model differences are quantified where possible.",
    tags: ["business-model", "comparison", "compatibility"],
  },
  {
    gateCode: "G3", artifactId: "g3-customer", name: "Customer Overlap Analysis",
    category: "model",
    description: "Data-driven analysis of customer overlap between acquirer and target. Maps shared accounts and sizes the cross-sell opportunity.",
    sections: [
      { heading: "Customer List Comparison", guidance: "Map target's top 50 customers against acquirer CRM. Identify named overlapping accounts." },
      { heading: "Overlap Metrics", guidance: "% of target revenue from overlapping accounts. % of acquirer accounts that also use target's services." },
      { heading: "Cross-Sell Sizing", guidance: "For each overlapping account: current spend with target, estimated additional wallet share, probability of conversion" },
      { heading: "Revenue At Risk", guidance: "Accounts where acquisition could create confusion or competitive conflict. Retention risk assessment." },
    ],
    qualityCriteria: "Based on actual customer lists (not estimates). Cross-sell is sized at the account level. Revenue at risk is identified.",
    tags: ["customer", "overlap", "cross-sell", "revenue"],
  },

  // ── G4: Financial Profile & Valuation ───────────────────────
  {
    gateCode: "G4", artifactId: "g4-financial", name: "Preliminary Financial Summary",
    category: "template",
    description: "Standardized financial profile summarizing 3-5 years of historical financials plus management projections. The foundation for all financial analysis.",
    sections: [
      { heading: "Income Statement Summary", guidance: "Revenue, COGS, Gross Profit, OpEx breakdown, EBITDA, Net Income — 3-5 years historical + 2 years projected" },
      { heading: "Revenue Decomposition", guidance: "By customer, by product/service line, by contract type (recurring vs. spot), by geography" },
      { heading: "Margin Analysis", guidance: "Gross margin, EBITDA margin, net margin trends. Owner compensation normalization. One-time adjustments." },
      { heading: "Balance Sheet Highlights", guidance: "Working capital, debt, cash, major assets, off-balance-sheet items" },
      { heading: "Cash Flow Summary", guidance: "Operating cash flow, capex (maintenance vs. growth), free cash flow. Working capital dynamics." },
      { heading: "Quality of Earnings Flags", guidance: "Revenue recognition issues, customer concentration, related-party transactions, accounting policy changes" },
    ],
    qualityCriteria: "3+ years of historical data. EBITDA is normalized with clear adjustments table. Revenue decomposition at customer level. QoE flags documented.",
    tags: ["financial", "income-statement", "QoE", "analysis"],
  },
  {
    gateCode: "G4", artifactId: "g4-valuation", name: "Valuation Range Analysis",
    category: "model",
    description: "Multi-method valuation establishing a defensible range. Typically includes comparable transactions, comparable companies, and DCF.",
    sections: [
      { heading: "Comparable Transactions", guidance: "5-10 precedent transactions with multiples (EV/Revenue, EV/EBITDA). Source, date, buyer type. Median and mean." },
      { heading: "Comparable Companies", guidance: "5-8 public comparables with current trading multiples. Apply appropriate discount for private/size/liquidity." },
      { heading: "DCF Analysis", guidance: "5-year projection, terminal value, WACC derivation. Sensitivity table on growth rate and discount rate." },
      { heading: "Valuation Summary", guidance: "Football field chart showing range from each method. Proposed offer range with rationale." },
      { heading: "Synergy Credit", guidance: "PV of identified synergies. Synergy-adjusted effective multiple. How much of synergy value is shared with seller?" },
    ],
    qualityCriteria: "At least 3 valuation methods. Comps are relevant (same sector, similar size, recent). DCF assumptions are conservative. Sensitivity analysis included.",
    tags: ["valuation", "DCF", "comps", "multiples"],
  },
  {
    gateCode: "G4", artifactId: "g4-synergy", name: "Synergy Model",
    category: "model",
    description: "Bottom-up synergy model quantifying revenue synergies and cost synergies with realization timelines and confidence levels.",
    sections: [
      { heading: "Revenue Synergies", guidance: "Line items: cross-sell, pricing optimization, market access, product bundling. Each with: $ amount, timeline, confidence (high/medium/low)" },
      { heading: "Cost Synergies", guidance: "Line items: headcount reduction, facility consolidation, procurement leverage, technology rationalization. Same detail." },
      { heading: "Integration Costs", guidance: "One-time costs to achieve synergies: severance, systems migration, rebranding, advisor fees" },
      { heading: "Net Synergy Timeline", guidance: "Quarter-by-quarter net synergy realization schedule for 24 months" },
      { heading: "Risk-Adjusted View", guidance: "Apply 50% haircut to revenue synergies, 75% to cost synergies. Show risk-adjusted total." },
    ],
    qualityCriteria: "Every synergy line has a named owner, $ amount, and timeline. Risk-adjusted view included. Integration costs are realistic (not understated).",
    tags: ["synergy", "revenue", "cost", "integration"],
  },
  {
    gateCode: "G4", artifactId: "g4-returns", name: "Returns Analysis",
    category: "model",
    description: "Investment returns model showing IRR and MOIC under base, upside, and downside scenarios.",
    sections: [
      { heading: "Base Case", guidance: "Management projections with conservative adjustments. Entry multiple, hold period, exit assumptions." },
      { heading: "Upside Case", guidance: "Full synergy realization + organic outperformance. What drives the upside?" },
      { heading: "Downside Case", guidance: "Revenue decline, margin compression, delayed synergies. What is the floor?" },
      { heading: "Returns Summary", guidance: "IRR and MOIC for each scenario. Sensitivity table: entry multiple vs. exit multiple vs. growth rate." },
      { heading: "Sources & Uses", guidance: "Debt/equity split. Financing terms. Transaction fees." },
    ],
    qualityCriteria: "Three scenarios with distinct assumptions. IRR and MOIC for each. Sensitivity table covers key variables. Sources & uses balance.",
    tags: ["returns", "IRR", "MOIC", "LBO"],
  },

  // ── G5: Operational & Integration ───────────────────────────
  {
    gateCode: "G5", artifactId: "g5-integration", name: "Integration Complexity Scorecard",
    category: "template",
    description: "Structured assessment of integration complexity across systems, operations, people, and culture dimensions.",
    sections: [
      { heading: "Systems Assessment", guidance: "ERP, CRM, HRIS, financial reporting — compatibility, migration complexity, timeline" },
      { heading: "Operational Assessment", guidance: "Quality standards, safety protocols, regulatory compliance, process maturity" },
      { heading: "People Assessment", guidance: "Key person retention, role redundancies, compensation harmonization, cultural alignment" },
      { heading: "Complexity Score", guidance: "Rate each dimension 1-5 (1=simple, 5=complex). Overall integration complexity rating." },
      { heading: "100-Day Plan Outline", guidance: "High-level integration milestones for first 100 days post-close" },
    ],
    qualityCriteria: "All 4 dimensions scored. Systems assessment includes specific platform names. People assessment names key individuals. 100-day plan has dated milestones.",
    tags: ["integration", "complexity", "100-day", "operations"],
  },

  // ── G6: Risk Assessment ─────────────────────────────────────
  {
    gateCode: "G6", artifactId: "g6-risk-register", name: "Risk Register",
    category: "template",
    description: "Comprehensive risk register documenting all identified risks with probability, impact, and mitigation plans.",
    sections: [
      { heading: "Risk Inventory", guidance: "List all identified risks. Categories: financial, operational, legal, regulatory, key-person, market, integration." },
      { heading: "Risk Assessment", guidance: "For each risk: probability (1-5), impact (1-5), risk score (P×I), mitigation strategy" },
      { heading: "Top 5 Risks", guidance: "Detailed analysis of the 5 highest-scoring risks with specific mitigation actions and owners" },
      { heading: "Deal-Breaker Risks", guidance: "Any risks that could prevent the deal from proceeding? What would need to be true for these to be resolved?" },
      { heading: "Residual Risk Summary", guidance: "After mitigation, what risks remain? Are they acceptable given the returns profile?" },
    ],
    qualityCriteria: "At least 15 risks identified across all categories. Top 5 risks have named mitigation owners. Deal-breaker risks are explicitly addressed.",
    tags: ["risk", "register", "mitigation", "diligence"],
  },

  // ── G7: IC Decision ─────────────────────────────────────────
  {
    gateCode: "G7", artifactId: "g7-ic-memo", name: "IC Memo",
    category: "template",
    description: "The definitive investment committee document synthesizing all gate outputs into a unified recommendation with clear decision rationale.",
    sections: [
      { heading: "Executive Summary", guidance: "1-page summary: target, thesis, price, returns, recommendation. Must stand alone." },
      { heading: "Strategic Rationale (G1-G3)", guidance: "Why this target, why now, why us. Synthesize strategic alignment, market position, business model fit." },
      { heading: "Financial Profile (G4)", guidance: "Key financials, valuation, returns under 3 scenarios. Synergy summary." },
      { heading: "Integration Plan (G5)", guidance: "High-level integration approach, timeline, key risks, cost estimate." },
      { heading: "Risk Assessment (G6)", guidance: "Top 5 risks with mitigants. Deal-breaker analysis. Residual risk acceptance." },
      { heading: "Recommendation", guidance: "PURSUE / CONDITIONAL / PASS. If conditional, specify exact conditions before LOI execution." },
      { heading: "Appendices", guidance: "Composite scorecard (G0-G7), sensitivity analysis, org chart, timeline to close" },
    ],
    qualityCriteria: "Executive summary is self-contained (reader gets full picture without appendices). Recommendation is clear and actionable. Conditions (if any) are specific and measurable. All gate scores referenced.",
    tags: ["IC", "memo", "recommendation", "decision"],
  },
  {
    gateCode: "G7", artifactId: "g7-scorecard", name: "Composite Scorecard (G0-G7)",
    category: "template",
    description: "One-page visual scorecard showing all 8 gate scores, composite score, and pass/fail status. The IC's at-a-glance view.",
    sections: [
      { heading: "Gate Summary Table", guidance: "8 rows (G0-G7): gate name, composite score, status (pass/conditional/fail), key finding" },
      { heading: "Score Visualization", guidance: "Heatmap or bar chart showing gate scores. Green ≥ minimum, amber = review, red < decline." },
      { heading: "Overall Composite", guidance: "Weighted composite across all scored gates. PURSUE/CONDITIONAL/PASS determination." },
      { heading: "Key Findings", guidance: "3-5 bullet points: strongest gates, weakest gates, critical conditions" },
    ],
    qualityCriteria: "All 8 gates represented. Scores match the evaluation record exactly. Visual is clean enough for IC presentation.",
    tags: ["scorecard", "composite", "IC", "summary"],
  },
];

async function seedEvidenceTemplates() {
  console.log("\n🌱 Seeding Evidence Reference Library...\n");

  for (const item of EVIDENCE_CATALOG) {
    // Check if already exists
    const [existing] = await db.select().from(v2.evidenceTemplates)
      .where(eq(v2.evidenceTemplates.artifactId, item.artifactId)).limit(1);

    if (existing) {
      console.log(`  ⏭️  ${item.name} already exists — skipping`);
      continue;
    }

    await db.insert(v2.evidenceTemplates).values({
      gateCode: item.gateCode,
      artifactId: item.artifactId,
      name: item.name,
      category: item.category,
      description: item.description,
      sections: item.sections,
      qualityCriteria: item.qualityCriteria,
      tags: item.tags,
      isPublished: true,
      authorName: "Alio Foundry",
    });
    console.log(`  ✅ ${item.gateCode} / ${item.name}`);
  }

  console.log(`\n✅ Evidence Reference Library seeded (${EVIDENCE_CATALOG.length} items)`);
}

seedEvidenceTemplates().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

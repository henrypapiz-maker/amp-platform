export interface RubricAnchor {
  score: number;
  label: string;
}

export interface AcceptanceParam {
  label: string;
  defaultValue: string;
  type: "text" | "list" | "range" | "boolean";
}

export interface Dimension {
  name: string;
  weight: number; // percentage, e.g., 25 = 25%
  rubric: RubricAnchor[];
  testGuidance: string;
  acceptanceParams: AcceptanceParam[];
}

export interface EvidenceArtifact {
  id: string;
  label: string;
}

export interface GateDefinition {
  code: string;
  name: string;
  purpose: string;
  type: "binary" | "scored" | "decision";
  minimumScore: number | null;
  declineThreshold: number | null;
  rule: string;
  dimensions: Dimension[];
  evidenceArtifacts: EvidenceArtifact[];
}

export const GATES: GateDefinition[] = [
  {
    code: "G0",
    name: "Universe Qualification",
    purpose: "Hard filter — targets that fail do not proceed.",
    type: "binary",
    minimumScore: null,
    declineThreshold: null,
    rule: "ALL dimensions must pass. Any fail = remove.",
    dimensions: [
      {
        name: "Sector Fit", weight: 25,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Verify the target operates in a sector aligned with the acquirer's primary sectors. Cross-reference against the persona configuration and any sector exclusion lists.",
        acceptanceParams: [
          { label: "Primary Sectors", defaultValue: "Per persona configuration", type: "text" },
          { label: "Excluded Sectors", defaultValue: "None", type: "list" },
        ],
      },
      {
        name: "Size Parameters", weight: 25,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Confirm target revenue falls within the acquirer's defined acquisition band. Check reported revenue, EBITDA if available, and employee headcount as size proxies.",
        acceptanceParams: [
          { label: "Revenue Minimum", defaultValue: "$8M", type: "text" },
          { label: "Revenue Maximum", defaultValue: "$60M", type: "text" },
          { label: "Employee Range", defaultValue: "50–500", type: "range" },
        ],
      },
      {
        name: "Geography", weight: 20,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Verify the target's HQ location, primary operations, and revenue concentration by geography. Check for sanctions, embargo exposure, or regulatory barriers in target jurisdictions.",
        acceptanceParams: [
          { label: "Approved Geographies", defaultValue: "United States, Canada, United Kingdom, Australia", type: "list" },
          { label: "Excluded Geographies", defaultValue: "None", type: "list" },
          { label: "Max Non-Approved Revenue %", defaultValue: "25%", type: "text" },
        ],
      },
      {
        name: "Ownership / Availability", weight: 30,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Confirm the target is theoretically acquirable — not a subsidiary locked in a conglomerate, not in distressed proceedings with competing claims, and not subject to government ownership or regulatory prohibition on transfer.",
        acceptanceParams: [
          { label: "Excluded Structures", defaultValue: "Government-owned, Bankruptcy (Ch.7), Sanctioned entity", type: "list" },
          { label: "Founder Willingness Required", defaultValue: "Yes", type: "boolean" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g0-scorecard", label: "Universe Qualification Scorecard" },
      { id: "g0-source-log", label: "Deal Source Log" },
    ],
  },
  {
    code: "G1",
    name: "Strategic Alignment",
    purpose: "Map target against acquirer's decomposed strategic model.",
    type: "scored",
    minimumScore: 60,
    declineThreshold: 40,
    rule: "Minimum composite 60/100. Below 40 = Decline.",
    dimensions: [
      {
        name: "Objective Traceability", weight: 30,
        rubric: [
          { score: 10, label: "Direct 1:1 mapping to board-approved strategic objective" },
          { score: 7, label: "Clear linkage to stated strategic priority" },
          { score: 5, label: "Indirect alignment through adjacent capability" },
          { score: 3, label: "Tenuous connection; requires interpretation" },
          { score: 0, label: "No identifiable strategic linkage" },
        ],
        testGuidance: "Map the target against the acquirer's board-approved strategic objectives. Identify which specific objective this acquisition would advance and assess the directness of the linkage.",
        acceptanceParams: [
          { label: "Strategic Plan Reference", defaultValue: "Current board-approved strategic plan", type: "text" },
          { label: "Min Objective Linkages", defaultValue: "1 direct linkage", type: "text" },
        ],
      },
      {
        name: "Capability Gap Fill", weight: 30,
        rubric: [
          { score: 10, label: "Fills critical capability gap with no internal alternative" },
          { score: 7, label: "Accelerates capability build by 12+ months" },
          { score: 5, label: "Provides capability that exists internally but is under-resourced" },
          { score: 3, label: "Marginal capability improvement" },
          { score: 0, label: "No identifiable capability gap addressed" },
        ],
        testGuidance: "Assess whether the target fills a documented capability gap on the acquirer's roadmap. Consider: Could this capability be built internally? How long would organic development take vs. acquisition?",
        acceptanceParams: [
          { label: "Capability Roadmap Reference", defaultValue: "Internal capability gap matrix", type: "text" },
          { label: "Build vs. Buy Threshold", defaultValue: "Acquisition must accelerate by 12+ months", type: "text" },
        ],
      },
      {
        name: "Horizon Appropriateness", weight: 20,
        rubric: [
          { score: 10, label: "Perfect horizon match with acquirer's stated time bias" },
          { score: 7, label: "Compatible horizon; minor timing mismatch" },
          { score: 5, label: "Moderate horizon tension; manageable with adjusted expectations" },
          { score: 3, label: "Significant horizon mismatch; requires strategic re-framing" },
          { score: 0, label: "Wrong horizon entirely" },
        ],
        testGuidance: "Classify the target's return horizon (H1: 1-3yr core defense, H2: 3-5yr emerging, H3: 5yr+ option). Compare against the acquirer's stated horizon bias from the persona configuration.",
        acceptanceParams: [
          { label: "Horizon Bias", defaultValue: "Per persona configuration", type: "text" },
          { label: "Acceptable Mismatch", defaultValue: "1 horizon level", type: "text" },
        ],
      },
      {
        name: "Competitive Optionality", weight: 20,
        rubric: [
          { score: 10, label: "Creates durable competitive moat; denies capability to competitors" },
          { score: 7, label: "Strengthens competitive position meaningfully" },
          { score: 5, label: "Neutral competitive impact" },
          { score: 3, label: "Minimal competitive relevance" },
          { score: 0, label: "Acquisition could strengthen a competitor or create exposure" },
        ],
        testGuidance: "Evaluate whether this acquisition creates or strengthens a competitive moat. Would a competitor acquiring this target instead create material disadvantage? Does it deny critical capability to the market?",
        acceptanceParams: [
          { label: "Named Competitors", defaultValue: "Identify top 3 competitors who could acquire", type: "text" },
          { label: "Defensive Value", defaultValue: "Assess deny-to-competitor value", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g1-fit-memo", label: "Strategic Fit Memo" },
      { id: "g1-gap-matrix", label: "Capability Gap Matrix" },
      { id: "g1-comp-brief", label: "Competitive Context Brief" },
    ],
  },
  {
    code: "G2",
    name: "Market & Competitive Position",
    purpose: "Assess structural attractiveness of market and target's position.",
    type: "scored",
    minimumScore: 55,
    declineThreshold: 40,
    rule: "Minimum composite 55/100. Below 40 = Decline unless H3 option play.",
    dimensions: [
      {
        name: "Market Growth Rate", weight: 25,
        rubric: [
          { score: 10, label: "High growth (>8% CAGR); secular tailwinds" },
          { score: 7, label: "Above-average growth (5–8% CAGR)" },
          { score: 5, label: "GDP-level growth (2–5% CAGR)" },
          { score: 3, label: "Flat to low growth (<2% CAGR)" },
          { score: 0, label: "Declining market; structural headwinds" },
        ],
        testGuidance: "Assess the target's addressable market growth rate using independent sources (industry reports, analyst estimates). Distinguish between total market and the segment the target operates in.",
        acceptanceParams: [
          { label: "Growth Data Sources", defaultValue: "IBISWorld, Gartner, or equivalent industry report", type: "text" },
          { label: "Minimum Acceptable CAGR", defaultValue: "2% (GDP-level)", type: "text" },
        ],
      },
      {
        name: "Target Market Position", weight: 30,
        rubric: [
          { score: 10, label: "Market leader (#1–#2) with pricing power" },
          { score: 7, label: "Strong niche player with defensible position" },
          { score: 5, label: "Mid-tier participant; some differentiation" },
          { score: 3, label: "Undifferentiated participant; commodity dynamics" },
          { score: 0, label: "Weak/declining position; losing share" },
        ],
        testGuidance: "Determine the target's competitive ranking in its primary market. Assess pricing power, customer switching costs, and brand differentiation. Use market share data where available.",
        acceptanceParams: [
          { label: "Market Share Source", defaultValue: "Industry report or management estimate", type: "text" },
          { label: "Preferred Position", defaultValue: "Top 5 in primary market segment", type: "text" },
        ],
      },
      {
        name: "Competitive Intensity", weight: 25,
        rubric: [
          { score: 10, label: "Moderate competition; healthy industry structure" },
          { score: 7, label: "Manageable competition; clear differentiation paths" },
          { score: 5, label: "Competitive but stable; margins under some pressure" },
          { score: 3, label: "Highly competitive; margin compression trend" },
          { score: 0, label: "Hyper-competitive; race to bottom" },
        ],
        testGuidance: "Map the competitive landscape using Porter's Five Forces framework. Assess number of competitors, degree of differentiation, price competition dynamics, and barriers to entry.",
        acceptanceParams: [
          { label: "Framework", defaultValue: "Porter's Five Forces analysis", type: "text" },
          { label: "Concentration Threshold", defaultValue: "Top 3 players < 80% market share", type: "text" },
        ],
      },
      {
        name: "Disruption / Obsolescence", weight: 20,
        rubric: [
          { score: 10, label: "Target IS the disruptor or well-positioned for transition" },
          { score: 7, label: "Low disruption risk within investment horizon" },
          { score: 5, label: "Moderate disruption risk; manageable with investment" },
          { score: 3, label: "Material disruption risk within 3–5 years" },
          { score: 0, label: "High disruption/obsolescence risk; technology shift underway" },
        ],
        testGuidance: "Evaluate technology, regulatory, or business model disruption risk within the investment horizon. Is the target's core offering at risk of obsolescence? Is it positioned on the right side of secular trends?",
        acceptanceParams: [
          { label: "Disruption Horizon", defaultValue: "5-year assessment window", type: "text" },
          { label: "Technology Risk Factors", defaultValue: "AI automation, regulatory change, platform shift", type: "list" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g2-market-brief", label: "Market Assessment Brief" },
      { id: "g2-comp-map", label: "Competitive Landscape Map" },
      { id: "g2-position-card", label: "Target Positioning Scorecard" },
    ],
  },
  {
    code: "G3",
    name: "Business Model Compatibility",
    purpose: "Surface reinforcements, extensions, and conflicts between business models.",
    type: "scored",
    minimumScore: 60,
    declineThreshold: null,
    rule: "Minimum composite 60/100. Any 0-score dimension requires senior sign-off.",
    dimensions: [
      {
        name: "Revenue Model Compatibility", weight: 25,
        rubric: [
          { score: 10, label: "Identical revenue model; immediate synergy" },
          { score: 7, label: "Compatible models; minor adaptation needed" },
          { score: 5, label: "Different but non-conflicting models" },
          { score: 3, label: "Significant model differences requiring resolution" },
          { score: 0, label: "Fundamentally incompatible revenue models" },
        ],
        testGuidance: "Compare the revenue models of acquirer and target. Are they both subscription, project-based, or hybrid? Identify conflicts where combining models would create pricing confusion or channel conflict.",
        acceptanceParams: [
          { label: "Acquirer Revenue Model", defaultValue: "Define in persona docs", type: "text" },
          { label: "Acceptable Models", defaultValue: "Subscription, recurring contract, hybrid", type: "list" },
        ],
      },
      {
        name: "Customer Segment Fit", weight: 30,
        rubric: [
          { score: 10, label: "Perfect complement — extends TAM without cannibalization" },
          { score: 7, label: "Strong overlap with clear cross-sell path" },
          { score: 5, label: "Moderate overlap; some cross-sell potential" },
          { score: 3, label: "Minimal overlap; separate customer universes" },
          { score: 0, label: "Customer conflict; competing for same wallet share" },
        ],
        testGuidance: "Analyze customer segment overlap and extension opportunity. Map acquirer and target customer bases by industry, size, and buying behavior. Identify cross-sell and up-sell potential.",
        acceptanceParams: [
          { label: "Overlap Analysis Method", defaultValue: "Customer segment mapping matrix", type: "text" },
          { label: "Min Cross-Sell Potential", defaultValue: "Identifiable path to 10%+ revenue uplift", type: "text" },
        ],
      },
      {
        name: "GTM Motion Alignment", weight: 25,
        rubric: [
          { score: 10, label: "Same GTM motion; shared sales infrastructure" },
          { score: 7, label: "Compatible GTM; can share channels" },
          { score: 5, label: "Different GTM but non-conflicting" },
          { score: 3, label: "Materially different GTM requiring parallel operations" },
          { score: 0, label: "Conflicting GTM motions; channel conflict likely" },
        ],
        testGuidance: "Compare go-to-market motions: direct sales vs. channel, enterprise vs. SMB, inbound vs. outbound. Assess whether sales teams, channels, and marketing can be shared or must run in parallel.",
        acceptanceParams: [
          { label: "Acquirer GTM Motion", defaultValue: "Define primary sales motion", type: "text" },
          { label: "Channel Conflict Risk", defaultValue: "Assess overlap in channel partners", type: "text" },
        ],
      },
      {
        name: "Cost Structure Compatibility", weight: 20,
        rubric: [
          { score: 10, label: "Clear cost synergies; shared infrastructure path" },
          { score: 7, label: "Compatible cost structures; modest synergy" },
          { score: 5, label: "Different cost profiles but manageable" },
          { score: 3, label: "Significant cost structure differences" },
          { score: 0, label: "Incompatible cost structures; integration would destroy value" },
        ],
        testGuidance: "Compare cost structures: gross margin profiles, fixed vs. variable cost mix, and overhead allocation. Identify cost synergy opportunities and structural conflicts that would survive integration.",
        acceptanceParams: [
          { label: "Target Gross Margin", defaultValue: "Benchmark against acquirer margin", type: "text" },
          { label: "Synergy Categories", defaultValue: "Shared services, procurement, facility consolidation", type: "list" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g3-bmc", label: "BMC Comparison" },
      { id: "g3-customer", label: "Customer Overlap Analysis" },
      { id: "g3-gtm", label: "GTM Assessment" },
      { id: "g3-conflicts", label: "Model Conflict Register" },
    ],
  },
  {
    code: "G4",
    name: "Financial Profile & Valuation",
    purpose: "Assess financial health, develop preliminary valuation and synergy-adjusted returns.",
    type: "scored",
    minimumScore: 60,
    declineThreshold: null,
    rule: "Returns must exceed hurdle (IRR >20% or MOIC >2.5x). Composite minimum 60/100.",
    dimensions: [
      {
        name: "Revenue Quality", weight: 20,
        rubric: [
          { score: 10, label: ">85% recurring; <5% customer concentration; 3yr CAGR >20%" },
          { score: 7, label: ">70% recurring; top customer <15%; CAGR 10–20%" },
          { score: 5, label: "50–70% recurring; moderate concentration; CAGR 5–10%" },
          { score: 3, label: "<50% recurring or high concentration (>25% one customer)" },
          { score: 0, label: "Declining revenue, project-based, or no visibility" },
        ],
        testGuidance: "Assess recurring vs. non-recurring revenue mix, customer concentration risk, and revenue growth trajectory. High-quality revenue is predictable, diversified, and growing.",
        acceptanceParams: [
          { label: "Min Recurring %", defaultValue: "50%", type: "text" },
          { label: "Max Customer Concentration", defaultValue: "Top customer < 25% of revenue", type: "text" },
          { label: "Min Revenue CAGR (3yr)", defaultValue: "5%", type: "text" },
        ],
      },
      {
        name: "Growth Profile", weight: 25,
        rubric: [
          { score: 10, label: ">20% organic growth; multiple growth vectors" },
          { score: 7, label: "10–20% growth; clear expansion path" },
          { score: 5, label: "5–10% growth; stable but not accelerating" },
          { score: 3, label: "<5% growth; limited organic expansion" },
          { score: 0, label: "Flat or declining; no growth catalyst visible" },
        ],
        testGuidance: "Evaluate organic growth rate, growth vectors (new products, geographies, customers), and sustainability of growth drivers. Separate organic growth from acquisition-driven growth.",
        acceptanceParams: [
          { label: "Min Organic Growth", defaultValue: "5% annual", type: "text" },
          { label: "Growth Vector Count", defaultValue: "At least 2 identifiable vectors", type: "text" },
        ],
      },
      {
        name: "Margin Profile", weight: 20,
        rubric: [
          { score: 10, label: "EBITDA >25%; expanding margins; clear operating leverage" },
          { score: 7, label: "EBITDA 18–25%; stable margins" },
          { score: 5, label: "EBITDA 12–18%; industry-average" },
          { score: 3, label: "EBITDA 5–12%; below-average with path to improvement" },
          { score: 0, label: "EBITDA <5% or negative; margin deterioration" },
        ],
        testGuidance: "Analyze EBITDA margin, margin trend (expanding/contracting), and operating leverage. Benchmark against industry peers and the acquirer's own margin profile.",
        acceptanceParams: [
          { label: "Min EBITDA Margin", defaultValue: "12%", type: "text" },
          { label: "Margin Trend", defaultValue: "Stable or expanding preferred", type: "text" },
        ],
      },
      {
        name: "Valuation Attractiveness", weight: 20,
        rubric: [
          { score: 10, label: "Below sector median multiples; clear value arbitrage" },
          { score: 7, label: "At or slightly below median; fair value" },
          { score: 5, label: "At median; requires synergy for returns" },
          { score: 3, label: "Above median; premium pricing" },
          { score: 0, label: "Significantly above median; cannot achieve hurdle returns" },
        ],
        testGuidance: "Develop preliminary valuation using comparable transactions and DCF. Compare implied multiples (EV/EBITDA, EV/Revenue) against sector medians. Assess whether returns exceed the hurdle rate.",
        acceptanceParams: [
          { label: "IRR Hurdle", defaultValue: "Per persona configuration (irrHurdle)", type: "text" },
          { label: "Max EV/EBITDA Multiple", defaultValue: "Sector median + 2x", type: "text" },
          { label: "MOIC Minimum", defaultValue: "2.5x", type: "text" },
        ],
      },
      {
        name: "Synergy Potential", weight: 15,
        rubric: [
          { score: 10, label: ">$5M identified synergies; high confidence; multiple sources" },
          { score: 7, label: "$2–5M synergies; moderate confidence" },
          { score: 5, label: "$1–2M synergies; some uncertainty in execution" },
          { score: 3, label: "<$1M identifiable synergies" },
          { score: 0, label: "No identifiable synergies; standalone only" },
        ],
        testGuidance: "Identify and quantify revenue and cost synergies. Revenue synergies: cross-sell, pricing power, market access. Cost synergies: headcount, facilities, procurement, technology.",
        acceptanceParams: [
          { label: "Min Identifiable Synergies", defaultValue: "$1M annual run-rate", type: "text" },
          { label: "Synergy Confidence Level", defaultValue: "Management-estimated with clear drivers", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g4-financial", label: "Preliminary Financial Summary" },
      { id: "g4-valuation", label: "Valuation Range" },
      { id: "g4-synergy", label: "Synergy Model" },
      { id: "g4-returns", label: "Returns Analysis" },
    ],
  },
  {
    code: "G5",
    name: "Operational & Integration",
    purpose: "Assess integration complexity and cost.",
    type: "scored",
    minimumScore: 55,
    declineThreshold: null,
    rule: "Integration cost < 60% of synergy NPV. Composite minimum 55/100.",
    dimensions: [
      {
        name: "Systems Compatibility", weight: 25,
        rubric: [
          { score: 10, label: "Shared or compatible ERP/CRM; minimal migration" },
          { score: 7, label: "Different but standard systems; proven migration path" },
          { score: 5, label: "Moderate complexity; 6–12 month integration timeline" },
          { score: 3, label: "Complex migration; custom systems; 12+ months" },
          { score: 0, label: "Incompatible systems; full rebuild required" },
        ],
        testGuidance: "Assess ERP, CRM, and core technology stack compatibility. Determine migration complexity, timeline, and cost. Consider data migration risks and integration dependencies.",
        acceptanceParams: [
          { label: "Acquirer ERP/CRM", defaultValue: "Document current systems", type: "text" },
          { label: "Max Migration Timeline", defaultValue: "12 months", type: "text" },
        ],
      },
      {
        name: "Organizational Complexity", weight: 25,
        rubric: [
          { score: 10, label: "Clean org structure; minimal redundancy; cultural alignment" },
          { score: 7, label: "Manageable overlap; clear retention targets" },
          { score: 5, label: "Moderate complexity; some key-person dependencies" },
          { score: 3, label: "High complexity; significant restructuring needed" },
          { score: 0, label: "Extreme org complexity; union issues; cultural incompatibility" },
        ],
        testGuidance: "Evaluate organizational structure overlap, key retention targets, cultural alignment, and union/works council considerations. Map reporting lines and identify redundancy zones.",
        acceptanceParams: [
          { label: "Key Retention Targets", defaultValue: "Identify top 5-10 critical employees", type: "text" },
          { label: "Redundancy Budget", defaultValue: "Estimate severance and restructuring costs", type: "text" },
        ],
      },
      {
        name: "Process Maturity Delta", weight: 25,
        rubric: [
          { score: 10, label: "Target at or above acquirer's maturity; best practices transfer" },
          { score: 7, label: "Minor maturity gap; standard onboarding" },
          { score: 5, label: "Moderate gap; 6-month capability building program" },
          { score: 3, label: "Significant maturity gap; heavy investment needed" },
          { score: 0, label: "Target has no formal processes; complete build-out required" },
        ],
        testGuidance: "Compare operational process maturity between acquirer and target. Assess quality systems, compliance frameworks, and operational procedures. Large gaps increase integration cost and timeline.",
        acceptanceParams: [
          { label: "Maturity Assessment Framework", defaultValue: "CMMI or equivalent maturity model", type: "text" },
          { label: "Acceptable Gap", defaultValue: "1-2 maturity levels", type: "text" },
        ],
      },
      {
        name: "Integration Cost vs. Synergy", weight: 25,
        rubric: [
          { score: 10, label: "Integration cost <20% of synergy NPV" },
          { score: 7, label: "Integration cost 20–40% of synergy NPV" },
          { score: 5, label: "Integration cost 40–60% of synergy NPV" },
          { score: 3, label: "Integration cost 60–80% of synergy NPV" },
          { score: 0, label: "Integration cost >80% of synergy NPV" },
        ],
        testGuidance: "Calculate total integration cost (systems, people, process, facilities) and compare against NPV of identified synergies. Integration should create net value, not destroy it.",
        acceptanceParams: [
          { label: "Max Cost/Synergy Ratio", defaultValue: "60% (integration cost < 60% of synergy NPV)", type: "text" },
          { label: "Integration Budget Cap", defaultValue: "Define maximum integration spend", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g5-complexity", label: "Integration Complexity Scorecard" },
      { id: "g5-systems", label: "Systems Architecture Comparison" },
      { id: "g5-org", label: "Org Structure Assessment" },
      { id: "g5-cost", label: "Integration Cost Estimate" },
      { id: "g5-day1", label: "Day 1 Readiness Checklist" },
    ],
  },
  {
    code: "G6",
    name: "Risk Assessment",
    purpose: "Systematically identify, classify, and quantify material acquisition risks.",
    type: "scored",
    minimumScore: 55,
    declineThreshold: null,
    rule: "No fatal legal/regulatory flags. Risk-adjusted IRR must exceed hurdle. Composite minimum 55/100.",
    dimensions: [
      {
        name: "Legal & Regulatory", weight: 30,
        rubric: [
          { score: 10, label: "No legal issues; regulatory approval straightforward" },
          { score: 7, label: "Minor legal items; standard regulatory path" },
          { score: 5, label: "Moderate legal complexity; manageable with counsel" },
          { score: 3, label: "Material legal issues; regulatory uncertainty" },
          { score: 0, label: "Fatal legal flags; litigation exposure; regulatory block" },
        ],
        testGuidance: "Conduct legal diligence: pending/threatened litigation, regulatory compliance status, IP ownership, contract assignability, and regulatory approval requirements for the transaction.",
        acceptanceParams: [
          { label: "Fatal Flag Triggers", defaultValue: "Active litigation > $5M, regulatory block, IP dispute", type: "list" },
          { label: "Regulatory Approvals Needed", defaultValue: "List required approvals (HSR, CFIUS, sector-specific)", type: "text" },
        ],
      },
      {
        name: "Customer Concentration", weight: 25,
        rubric: [
          { score: 10, label: "Highly diversified; no customer >5% of revenue" },
          { score: 7, label: "Top customer <15%; healthy diversification" },
          { score: 5, label: "Top customer 15–25%; manageable with retention plan" },
          { score: 3, label: "Top customer 25–40%; material retention risk" },
          { score: 0, label: "Top customer >40%; single-customer dependency" },
        ],
        testGuidance: "Analyze revenue concentration by customer. High concentration increases post-acquisition retention risk. Assess contract terms, renewal timeline, and relationship dependency.",
        acceptanceParams: [
          { label: "Max Single Customer %", defaultValue: "25% of revenue", type: "text" },
          { label: "Top 5 Customer %", defaultValue: "< 60% of revenue preferred", type: "text" },
          { label: "Contract Visibility", defaultValue: "12+ months of contracted revenue", type: "text" },
        ],
      },
      {
        name: "Key Person Risk", weight: 20,
        rubric: [
          { score: 10, label: "Deep bench; no single-point-of-failure individuals" },
          { score: 7, label: "Key people identified; retention plans feasible" },
          { score: 5, label: "2–3 key people critical; earnout structures needed" },
          { score: 3, label: "Founder-dependent; business knowledge concentrated" },
          { score: 0, label: "Single key person; departure = business failure" },
        ],
        testGuidance: "Identify individuals whose departure would materially impact business continuity. Assess depth of management bench, knowledge concentration, and feasibility of retention mechanisms.",
        acceptanceParams: [
          { label: "Key Person Threshold", defaultValue: "No single person responsible for >30% of revenue or IP", type: "text" },
          { label: "Retention Mechanisms", defaultValue: "Earnout, employment agreement, equity rollover", type: "list" },
        ],
      },
      {
        name: "Cultural Compatibility", weight: 15,
        rubric: [
          { score: 10, label: "Aligned values and operating philosophy" },
          { score: 7, label: "Compatible cultures; minor adjustment needed" },
          { score: 5, label: "Different but manageable; integration plan addresses gaps" },
          { score: 3, label: "Material cultural differences; integration friction expected" },
          { score: 0, label: "Fundamentally incompatible cultures" },
        ],
        testGuidance: "Assess cultural alignment: decision-making style (centralized vs. distributed), risk appetite, innovation vs. process orientation, and employee engagement levels.",
        acceptanceParams: [
          { label: "Assessment Method", defaultValue: "Management interviews + employee survey", type: "text" },
          { label: "Red Flag Indicators", defaultValue: "High turnover, Glassdoor < 3.0, recent leadership changes", type: "list" },
        ],
      },
      {
        name: "Market & Macro Risk", weight: 10,
        rubric: [
          { score: 10, label: "Counter-cyclical or recession-resistant" },
          { score: 7, label: "Low macro sensitivity" },
          { score: 5, label: "Moderate cyclicality; manageable" },
          { score: 3, label: "Highly cyclical; timing-sensitive" },
          { score: 0, label: "Extreme macro exposure; commodity-dependent" },
        ],
        testGuidance: "Evaluate exposure to macroeconomic cycles, commodity prices, interest rates, and geopolitical risk. Assess whether the target's business is counter-cyclical, cyclical, or secular.",
        acceptanceParams: [
          { label: "Cycle Sensitivity", defaultValue: "Classify: counter-cyclical, defensive, cyclical, hyper-cyclical", type: "text" },
          { label: "Commodity Exposure", defaultValue: "Identify material commodity dependencies", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g6-risk-register", label: "Risk Register" },
      { id: "g6-legal", label: "Legal Flag Summary" },
      { id: "g6-retention", label: "Customer Retention Analysis" },
      { id: "g6-cultural", label: "Cultural Assessment" },
      { id: "g6-adj-returns", label: "Risk-Adjusted Returns" },
    ],
  },
  {
    code: "G7",
    name: "Investment Committee Decision",
    purpose: "Synthesize all prior gate outputs into unified IC recommendation.",
    type: "decision",
    minimumScore: 65,
    declineThreshold: 50,
    rule: "Composite ≥65 = PURSUE. 50–64 = CONDITIONAL. <50 = PASS.",
    dimensions: [
      {
        name: "Composite Strategic (G1–G3)", weight: 30,
        rubric: [
          { score: 10, label: "Exceptional strategic fit across all dimensions" },
          { score: 7, label: "Strong strategic alignment; minor gaps" },
          { score: 5, label: "Adequate strategic fit; some concerns" },
          { score: 3, label: "Weak strategic case; significant gaps" },
          { score: 0, label: "No strategic rationale" },
        ],
        testGuidance: "Synthesize strategic alignment, market position, and business model compatibility scores from G1-G3. Weight by relative gate importance. Flag any gate that scored below its minimum threshold.",
        acceptanceParams: [
          { label: "Min G1 Score", defaultValue: "60/100", type: "text" },
          { label: "Min G2 Score", defaultValue: "55/100", type: "text" },
          { label: "Min G3 Score", defaultValue: "60/100", type: "text" },
        ],
      },
      {
        name: "Financial Attractiveness (G4)", weight: 30,
        rubric: [
          { score: 10, label: "Exceeds all financial hurdles; compelling returns" },
          { score: 7, label: "Meets hurdle rates; attractive returns profile" },
          { score: 5, label: "Borderline returns; requires synergy realization" },
          { score: 3, label: "Below hurdle; requires significant assumptions" },
          { score: 0, label: "Does not meet financial criteria" },
        ],
        testGuidance: "Review G4 financial profile scores. Confirm returns analysis meets hurdle rate. Assess sensitivity of returns to key assumptions (growth, margins, multiple, synergy realization).",
        acceptanceParams: [
          { label: "IRR Must Exceed", defaultValue: "Hurdle rate from persona", type: "text" },
          { label: "MOIC Must Exceed", defaultValue: "2.5x", type: "text" },
        ],
      },
      {
        name: "Operational Feasibility (G5)", weight: 20,
        rubric: [
          { score: 10, label: "Low complexity; clear integration path; strong synergy" },
          { score: 7, label: "Manageable integration; standard playbook" },
          { score: 5, label: "Moderate complexity; requires dedicated resources" },
          { score: 3, label: "High complexity; material integration risk" },
          { score: 0, label: "Integration infeasible or value-destructive" },
        ],
        testGuidance: "Review G5 integration assessment. Confirm integration cost remains within synergy value bounds. Assess Day 1 readiness and 100-day plan feasibility.",
        acceptanceParams: [
          { label: "Integration Cost Cap", defaultValue: "< 60% of synergy NPV", type: "text" },
          { label: "Day 1 Readiness", defaultValue: "Checklist completed", type: "text" },
        ],
      },
      {
        name: "Risk-Adjusted Score (G6)", weight: 20,
        rubric: [
          { score: 10, label: "Low risk across all dimensions" },
          { score: 7, label: "Manageable risks; clear mitigation plans" },
          { score: 5, label: "Moderate risk; requires active management" },
          { score: 3, label: "High risk; multiple red flags" },
          { score: 0, label: "Unacceptable risk profile" },
        ],
        testGuidance: "Review G6 risk register. Confirm no fatal flags remain unresolved. Verify risk-adjusted returns still exceed hurdle. Document residual risks and proposed mitigations.",
        acceptanceParams: [
          { label: "Fatal Flag Status", defaultValue: "All fatal flags must be resolved or mitigated", type: "text" },
          { label: "Risk-Adjusted IRR", defaultValue: "Must exceed hurdle rate", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g7-ic-memo", label: "IC Memo" },
      { id: "g7-scorecard", label: "Composite Scorecard" },
      { id: "g7-sensitivity", label: "Sensitivity Analysis" },
      { id: "g7-decision", label: "Decision Register" },
    ],
  },
];

export function getGate(code: string): GateDefinition | undefined {
  return GATES.find((g) => g.code === code);
}

export function getGateIndex(code: string): number {
  return GATES.findIndex((g) => g.code === code);
}

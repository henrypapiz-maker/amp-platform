// ═══════════════════════════════════════════════════════════════
// AMP v2 — G4 Financial Profile: Evaluation Modules
//
// Three selectable analytical frameworks for G4.
// The analyst picks one when starting the gate evaluation.
// That choice crystallizes with the gate.
//
// Module A: Standard Financial (mature businesses, stable CF)
// Module B: High-Growth SaaS (recurring revenue, unit economics)
// Module C: Distressed / Special Situations (asset recovery focus)
// ═══════════════════════════════════════════════════════════════

export interface ModuleSeed {
  gateCode: string;
  name: string;
  slug: string;
  description: string;
  whenToUse: string;
  whenNotToUse: string;
  isDefault: boolean;
  minimumScore: number | null;
  declineThreshold: number | null;
  dimensions: Array<{
    name: string;
    weight: number;
    rubric: Array<{ score: number; label: string }>;
    testGuidance: string;
    acceptanceParams: Array<{ label: string; defaultValue: string; type: string }>;
  }>;
  evidenceArtifacts: Array<{ id: string; label: string }>;
}

export const G4_MODULES: ModuleSeed[] = [
  // ═══════════════════════════════════════════════════════════
  // MODULE A: Standard Financial Analysis
  // For: Mature businesses with established cash flows
  // ═══════════════════════════════════════════════════════════
  {
    gateCode: "G4",
    name: "Standard Financial Analysis",
    slug: "standard-financial",
    description: "Complete financial evaluation for established businesses with stable, demonstrable cash flows. Covers revenue quality, growth, margins, valuation, and synergy potential.",
    whenToUse: "Use for targets with 3+ years of audited financials, positive EBITDA, and established revenue streams. This is the default module for most lower-middle-market acquisitions.",
    whenNotToUse: "Not suitable for pre-revenue companies, high-growth SaaS with negative EBITDA, or distressed assets where going-concern value is in question.",
    isDefault: true,
    minimumScore: 60,
    declineThreshold: null,
    dimensions: [
      {
        name: "Revenue Quality",
        weight: 20,
        rubric: [
          { score: 10, label: ">85% recurring; <5% customer concentration; 3yr CAGR >20%" },
          { score: 7, label: ">70% recurring; top customer <15%; CAGR 10\u201320%" },
          { score: 5, label: "50\u201370% recurring; moderate concentration; CAGR 5\u201310%" },
          { score: 3, label: "<50% recurring or high concentration (>25% one customer)" },
          { score: 0, label: "Declining revenue, project-based, or no visibility" },
        ],
        testGuidance: "Decompose revenue into durability tiers: contractually recurring, habitually recurring, and one-time. Assess net revenue retention, customer concentration, and growth trajectory. High-quality revenue is predictable, diversified, and growing.",
        acceptanceParams: [
          { label: "Min Recurring %", defaultValue: "50%", type: "text" },
          { label: "Max Customer Concentration", defaultValue: "Top customer < 25% of revenue", type: "text" },
          { label: "Min Revenue CAGR (3yr)", defaultValue: "5%", type: "text" },
        ],
      },
      {
        name: "Growth Profile",
        weight: 25,
        rubric: [
          { score: 10, label: ">20% organic growth; multiple growth vectors" },
          { score: 7, label: "10\u201320% growth; clear expansion path" },
          { score: 5, label: "5\u201310% growth; stable but not accelerating" },
          { score: 3, label: "<5% growth; limited organic expansion" },
          { score: 0, label: "Flat or declining; no growth catalyst visible" },
        ],
        testGuidance: "Evaluate organic growth rate separate from acquisition-driven growth. Identify growth vectors: new products, geographies, customers, pricing. Assess sustainability of each vector and whether the growth rate is accelerating or decelerating.",
        acceptanceParams: [
          { label: "Min Organic Growth", defaultValue: "5% annual", type: "text" },
          { label: "Growth Vectors", defaultValue: "At least 2 identifiable", type: "text" },
        ],
      },
      {
        name: "Margin Profile",
        weight: 20,
        rubric: [
          { score: 10, label: "EBITDA >25%; expanding margins; clear operating leverage" },
          { score: 7, label: "EBITDA 18\u201325%; stable margins" },
          { score: 5, label: "EBITDA 12\u201318%; industry-average" },
          { score: 3, label: "EBITDA 5\u201312%; below-average with path to improvement" },
          { score: 0, label: "EBITDA <5% or negative; margin deterioration" },
        ],
        testGuidance: "Analyze EBITDA margin, margin trend, and operating leverage. Benchmark against industry peers. Identify one-time items that distort margins. Assess whether margins are sustainable or driven by temporary factors.",
        acceptanceParams: [
          { label: "Min EBITDA Margin", defaultValue: "12%", type: "text" },
          { label: "Margin Trend", defaultValue: "Stable or expanding", type: "text" },
        ],
      },
      {
        name: "Valuation Attractiveness",
        weight: 20,
        rubric: [
          { score: 10, label: "Below sector median multiples; clear value arbitrage" },
          { score: 7, label: "At or slightly below median; fair value" },
          { score: 5, label: "At median; requires synergy for returns" },
          { score: 3, label: "Above median; premium pricing" },
          { score: 0, label: "Significantly above median; cannot achieve hurdle returns" },
        ],
        testGuidance: "Develop preliminary valuation using DCF, comparable transactions, and (for PE) LBO returns analysis. Compare implied multiples against sector medians. Assess whether returns exceed the hurdle rate under base, upside, and downside scenarios.",
        acceptanceParams: [
          { label: "IRR Hurdle", defaultValue: "Per persona config", type: "text" },
          { label: "Max EV/EBITDA", defaultValue: "Sector median + 2x", type: "text" },
          { label: "MOIC Minimum", defaultValue: "2.5x", type: "text" },
        ],
      },
      {
        name: "Synergy Potential",
        weight: 15,
        rubric: [
          { score: 10, label: ">$5M identified synergies; high confidence; multiple sources" },
          { score: 7, label: "$2\u20135M synergies; moderate confidence" },
          { score: 5, label: "$1\u20132M synergies; some execution uncertainty" },
          { score: 3, label: "<$1M identifiable synergies" },
          { score: 0, label: "No identifiable synergies; standalone only" },
        ],
        testGuidance: "Identify and quantify revenue synergies (cross-sell, pricing, market access) and cost synergies (headcount, facilities, procurement, tech). Assign confidence levels to each synergy line. Synergies should be net of integration costs.",
        acceptanceParams: [
          { label: "Min Synergies", defaultValue: "$1M annual run-rate", type: "text" },
          { label: "Confidence Level", defaultValue: "Management-estimated with clear drivers", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g4a-financial", label: "Preliminary Financial Summary" },
      { id: "g4a-valuation", label: "Valuation Range Analysis" },
      { id: "g4a-synergy", label: "Synergy Model" },
      { id: "g4a-returns", label: "Returns Analysis (IRR/MOIC)" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE B: High-Growth SaaS / Recurring Revenue
  // For: Software, tech-enabled services with subscription models
  // ═══════════════════════════════════════════════════════════
  {
    gateCode: "G4",
    name: "High-Growth SaaS Analysis",
    slug: "high-growth-saas",
    description: "Financial evaluation optimized for high-growth software and recurring revenue businesses where traditional EBITDA metrics don\u2019t tell the full story. Focuses on unit economics, retention, and capital efficiency.",
    whenToUse: "Use for SaaS, subscription, or usage-based revenue model targets growing >20% with negative or thin EBITDA. Also appropriate for tech-enabled services with high gross margins and land-and-expand dynamics.",
    whenNotToUse: "Not suitable for traditional businesses with project-based revenue, mature industrial companies, or targets where EBITDA is the primary value driver.",
    isDefault: false,
    minimumScore: 55,
    declineThreshold: null,
    dimensions: [
      {
        name: "Unit Economics",
        weight: 25,
        rubric: [
          { score: 10, label: "LTV/CAC >5x; CAC payback <12 months; fully loaded" },
          { score: 7, label: "LTV/CAC 3\u20135x; payback 12\u201318 months" },
          { score: 5, label: "LTV/CAC 2\u20133x; payback 18\u201324 months" },
          { score: 3, label: "LTV/CAC 1\u20132x; payback >24 months; path to improvement unclear" },
          { score: 0, label: "LTV/CAC <1x or unmeasurable; unit economics don\u2019t work" },
        ],
        testGuidance: "Calculate LTV and CAC using fully-loaded costs (include sales salaries, marketing, onboarding). Segment by customer cohort and acquisition channel. Unit economics should be improving over time as the business scales. A deteriorating LTV/CAC ratio is a major red flag even if topline growth is strong.",
        acceptanceParams: [
          { label: "Min LTV/CAC", defaultValue: "3x fully loaded", type: "text" },
          { label: "Max Payback", defaultValue: "18 months", type: "text" },
          { label: "Cohort Trend", defaultValue: "Improving or stable", type: "text" },
        ],
      },
      {
        name: "Net Revenue Retention",
        weight: 25,
        rubric: [
          { score: 10, label: "NRR >130%; strong expansion revenue; minimal churn" },
          { score: 7, label: "NRR 110\u2013130%; healthy expansion; low churn" },
          { score: 5, label: "NRR 100\u2013110%; stable but limited expansion" },
          { score: 3, label: "NRR 85\u2013100%; net contraction; churn problem" },
          { score: 0, label: "NRR <85%; severe churn; customers leaving rapidly" },
        ],
        testGuidance: "Calculate NRR by cohort: (starting ARR + expansion - contraction - churn) / starting ARR. Separate logo churn from revenue churn. Identify whether expansion is driven by pricing increases, upsell, or genuine usage growth. NRR is the single most important SaaS metric \u2014 it tells you whether the product creates compounding value.",
        acceptanceParams: [
          { label: "Min NRR", defaultValue: "100%", type: "text" },
          { label: "Logo Churn Max", defaultValue: "<10% annual", type: "text" },
        ],
      },
      {
        name: "ARR Growth & Quality",
        weight: 20,
        rubric: [
          { score: 10, label: ">50% ARR growth; >70% from new logos; diversified pipeline" },
          { score: 7, label: "30\u201350% growth; healthy mix of new + expansion" },
          { score: 5, label: "20\u201330% growth; expansion-driven; new logo velocity slowing" },
          { score: 3, label: "10\u201320% growth; predominantly expansion; new logo stall" },
          { score: 0, label: "<10% growth or declining ARR" },
        ],
        testGuidance: "Decompose ARR growth into new logo ARR, expansion ARR, and churned ARR. Assess the quality of new logo acquisition \u2014 is it repeatable and efficient, or dependent on a few large deals? Track bookings pipeline and conversion rates. A business growing 40% but with 90% of new ARR from 2 enterprise deals has fragile growth.",
        acceptanceParams: [
          { label: "Min ARR Growth", defaultValue: "20%", type: "text" },
          { label: "New Logo %", defaultValue: ">30% of new ARR", type: "text" },
        ],
      },
      {
        name: "Gross Margin & Capital Efficiency",
        weight: 15,
        rubric: [
          { score: 10, label: "Gross margin >80%; Rule of 40 score >60; burn multiple <1.5x" },
          { score: 7, label: "GM 70\u201380%; Rule of 40 score 40\u201360; capital efficient" },
          { score: 5, label: "GM 60\u201370%; Rule of 40 score 20\u201340; acceptable efficiency" },
          { score: 3, label: "GM 50\u201360%; Rule of 40 <20; burning too much capital" },
          { score: 0, label: "GM <50% or Rule of 40 negative; unsustainable model" },
        ],
        testGuidance: "Calculate gross margin excluding hosting/infrastructure costs that scale with revenue. Compute Rule of 40 (growth rate + EBITDA margin) and burn multiple (net burn / net new ARR). These metrics separate efficient growth from growth-at-any-cost. High gross margins create the operating leverage that makes SaaS valuations work.",
        acceptanceParams: [
          { label: "Min Gross Margin", defaultValue: "65%", type: "text" },
          { label: "Rule of 40", defaultValue: ">20", type: "text" },
        ],
      },
      {
        name: "TAM Penetration & Runway",
        weight: 15,
        rubric: [
          { score: 10, label: "<5% TAM penetration; massive runway; market expanding" },
          { score: 7, label: "5\u201315% penetration; strong runway; adjacent markets accessible" },
          { score: 5, label: "15\u201330% penetration; growth requires new segments or products" },
          { score: 3, label: "30\u201350% penetration; approaching saturation in core market" },
          { score: 0, label: ">50% penetration; limited organic growth runway" },
        ],
        testGuidance: "Size the TAM bottom-up from identifiable customer segments, not top-down from analyst reports. Assess current penetration rate and whether the TAM is expanding (new use cases, new geographies) or static. A large TAM with low penetration justifies growth investments; a small TAM with high penetration means growth must come from adjacencies.",
        acceptanceParams: [
          { label: "TAM Source", defaultValue: "Bottom-up from customer segments", type: "text" },
          { label: "Max Penetration", defaultValue: "<30% in core market", type: "text" },
        ],
      },
      {
        name: "Valuation (SaaS Multiples)",
        weight: 0, // Scored but not weighted into composite — used for returns analysis
        rubric: [
          { score: 10, label: "EV/ARR <5x for >30% growth; below public SaaS median" },
          { score: 7, label: "EV/ARR 5\u201310x; in line with private round comps" },
          { score: 5, label: "EV/ARR 10\u201315x; requires sustained high growth to justify" },
          { score: 3, label: "EV/ARR 15\u201320x; stretched valuation" },
          { score: 0, label: "EV/ARR >20x; peak-market pricing; significant downside risk" },
        ],
        testGuidance: "For high-growth SaaS, EV/ARR is more informative than EV/EBITDA (which may be negative). Benchmark against Bessemer Cloud Index, recent private rounds, and M&A transactions. The key ratio is growth-adjusted multiple: EV/ARR divided by ARR growth rate. A ratio under 0.5x is attractive; above 1.0x is expensive.",
        acceptanceParams: [
          { label: "Valuation Benchmark", defaultValue: "Bessemer Cloud Index + private comps", type: "text" },
          { label: "Growth-Adjusted Ratio", defaultValue: "<0.7x (EV/ARR \u00F7 growth rate)", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g4b-metrics", label: "SaaS Metrics Dashboard (ARR, NRR, LTV/CAC)" },
      { id: "g4b-cohort", label: "Customer Cohort Analysis" },
      { id: "g4b-unit-econ", label: "Unit Economics Model" },
      { id: "g4b-tam", label: "TAM Analysis (Bottom-Up)" },
      { id: "g4b-valuation", label: "SaaS Valuation Comps" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE C: Distressed / Special Situations
  // For: Turnaround, restructuring, or asset-focused acquisitions
  // ═══════════════════════════════════════════════════════════
  {
    gateCode: "G4",
    name: "Distressed / Special Situations",
    slug: "distressed-special-sit",
    description: "Financial evaluation for targets in distress, turnaround, or where asset value exceeds going-concern value. Focuses on downside protection, asset recovery, and restructuring feasibility rather than growth or synergy.",
    whenToUse: "Use when the target is in financial distress, has filed or is approaching bankruptcy, is undergoing operational turnaround, or when the investment thesis is asset-focused rather than earnings-focused. Also suitable for broken auction situations.",
    whenNotToUse: "Not suitable for healthy, growing businesses where the thesis is earnings growth or strategic synergy. If EBITDA margins are positive and stable, use the Standard Financial module.",
    isDefault: false,
    minimumScore: 50,
    declineThreshold: 30,
    dimensions: [
      {
        name: "Asset Recovery Value",
        weight: 30,
        rubric: [
          { score: 10, label: "Hard asset value > purchase price; significant margin of safety" },
          { score: 7, label: "Asset value at 80\u2013100% of purchase price; reasonable downside protection" },
          { score: 5, label: "Asset value at 50\u201380% of purchase price; moderate downside risk" },
          { score: 3, label: "Asset value at 30\u201350% of purchase price; limited hard asset protection" },
          { score: 0, label: "Asset value <30% of purchase price; asset-light or impaired" },
        ],
        testGuidance: "Value hard assets independently from the business: real estate (appraisal), equipment (orderly liquidation value), inventory (net realizable value), receivables (collectibility analysis). The question is: if the turnaround fails completely, what do you recover from selling the assets? This is your floor value.",
        acceptanceParams: [
          { label: "Valuation Method", defaultValue: "Independent appraisal + orderly liquidation", type: "text" },
          { label: "Min Recovery %", defaultValue: "Asset value > 50% of purchase price", type: "text" },
        ],
      },
      {
        name: "Working Capital Position",
        weight: 25,
        rubric: [
          { score: 10, label: "Positive WC; cash self-sufficient; no immediate funding need" },
          { score: 7, label: "Slightly negative WC; manageable with revolving facility" },
          { score: 5, label: "Material WC deficit; requires injection but quantifiable" },
          { score: 3, label: "Severe WC distress; significant injection needed; uncertain timing" },
          { score: 0, label: "Cash crisis; unable to fund operations; immediate failure risk" },
        ],
        testGuidance: "Analyze the cash conversion cycle: days sales outstanding, days inventory outstanding, days payable outstanding. Identify the WC injection needed to stabilize operations. Map the 13-week cash flow forecast. The critical question is: how much cash does the business need to survive the turnaround period, and where does that cash come from?",
        acceptanceParams: [
          { label: "Cash Runway", defaultValue: "13-week cash flow forecast required", type: "text" },
          { label: "Max WC Injection", defaultValue: "Quantified and funded in deal structure", type: "text" },
        ],
      },
      {
        name: "Restructuring Feasibility",
        weight: 25,
        rubric: [
          { score: 10, label: "Clear restructuring path; costs identified; timeline <12 months; high probability of success" },
          { score: 7, label: "Feasible restructuring; some complexity; 12\u201318 month timeline" },
          { score: 5, label: "Restructuring possible but uncertain; 18\u201324 months; material execution risk" },
          { score: 3, label: "Complex restructuring; >24 months; significant unknowns" },
          { score: 0, label: "Restructuring infeasible; structural issues cannot be resolved" },
        ],
        testGuidance: "Define the turnaround thesis: what specific changes will restore profitability? Quantify each lever: cost reductions (headcount, facilities, procurement), revenue stabilization (customer retention, pricing), and operational improvements (process, technology). Build a month-by-month P&L bridge from current state to target state. Assign probability to each lever.",
        acceptanceParams: [
          { label: "Turnaround Timeline", defaultValue: "< 18 months to breakeven EBITDA", type: "text" },
          { label: "Lever Count", defaultValue: "3+ independent improvement levers", type: "text" },
        ],
      },
      {
        name: "Creditor & Stakeholder Complexity",
        weight: 20,
        rubric: [
          { score: 10, label: "Simple capital structure; cooperative creditors; clean transaction path" },
          { score: 7, label: "Moderate complexity; 2\u20133 creditor classes; negotiation needed but feasible" },
          { score: 5, label: "Complex structure; multiple lien holders; requires professional mediation" },
          { score: 3, label: "Adversarial creditors; litigation risk; contested claims" },
          { score: 0, label: "Intractable creditor disputes; no clear path to resolution" },
        ],
        testGuidance: "Map the capital structure: senior secured, junior secured, unsecured, trade creditors, tax liens, pension obligations. Identify who has blocking power and what their recovery expectations are. Assess whether a consensual deal is achievable or whether a court-supervised process (363 sale, Chapter 11 plan) is required. The complexity of the creditor landscape often determines whether a distressed deal is executable, not the business quality.",
        acceptanceParams: [
          { label: "Creditor Classes", defaultValue: "Map all with recovery expectations", type: "text" },
          { label: "Transaction Path", defaultValue: "Consensual preferred; 363 as backup", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "g4c-13week", label: "13-Week Cash Flow Forecast" },
      { id: "g4c-asset-val", label: "Asset Appraisal / Liquidation Analysis" },
      { id: "g4c-restructure", label: "Restructuring Plan & P&L Bridge" },
      { id: "g4c-cap-structure", label: "Capital Structure & Creditor Map" },
      { id: "g4c-legal", label: "Legal Status & Claims Register" },
    ],
  },
];

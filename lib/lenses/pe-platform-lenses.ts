// ═══════════════════════════════════════════════════════════════
// AMP v2 — PE Platform Build: Evaluation Lenses
//
// Multi-lens evaluation content for the PE Platform Build template.
// Each dimension has 2-3 lenses that provide different analytical
// frameworks. Convergence/divergence between lenses is signal.
//
// This file is used to seed the evaluation_lenses table.
// Structure matches the LensDefinition type from template-engine.ts
// ═══════════════════════════════════════════════════════════════

export interface LensSeed {
  gateCode: string;
  dimensionName: string;
  name: string;
  framework: string;
  guidance: string;
  keyQuestions: string[];
  evidenceNeeds: string[];
  calibrationAnchors: Array<{ score: number; label: string }>;
  blindSpots: string[];
  isDefault: boolean;
}

export const PE_PLATFORM_LENSES: LensSeed[] = [
  // ═══════════════════════════════════════════════════════════
  // G1 — STRATEGIC ALIGNMENT
  // ═══════════════════════════════════════════════════════════

  // G1: Objective Traceability → Fund Thesis Fit (PE variant)
  {
    gateCode: "G1",
    dimensionName: "Objective Traceability",
    name: "Fund thesis alignment",
    framework: "Investment Thesis Mapping",
    guidance: "Map the target against the fund's stated investment thesis from the PPM/LPA. Identify which specific thesis element this acquisition advances. Evaluate whether the target strengthens the fund's positioning with LPs — does it demonstrate thesis execution?",
    keyQuestions: [
      "Which specific element of the fund thesis does this target address?",
      "Can you articulate the thesis linkage in one sentence for the LP letter?",
      "Does this deal reinforce or dilute the fund's stated strategy?",
      "Would this acquisition be explainable to the LPAC in 60 seconds?",
    ],
    evidenceNeeds: [
      "Fund PPM/LPA with investment thesis section",
      "GP marketing materials describing target sectors/themes",
      "Prior LP communications referencing strategic priorities",
    ],
    calibrationAnchors: [
      { score: 10, label: "Direct 1:1 execution of a named thesis pillar from the PPM" },
      { score: 7, label: "Clear linkage to thesis; easy to explain to LPs" },
      { score: 5, label: "Tangential thesis connection; requires narrative construction" },
      { score: 3, label: "Thesis stretch; LPs might question strategic fit" },
      { score: 0, label: "No thesis linkage; opportunistic deal outside mandate" },
    ],
    blindSpots: [
      "Doesn't assess whether the thesis itself is sound — only whether the target fits it",
      "Ignores operational quality of the target in favor of strategic narrative",
      "May overweight deals that 'tell a good story' vs. deals that generate returns",
    ],
    isDefault: true,
  },
  {
    gateCode: "G1",
    dimensionName: "Objective Traceability",
    name: "Portfolio construction lens",
    framework: "Portfolio Gap Analysis",
    guidance: "Evaluate this target in the context of the current portfolio. Does it fill a gap in sector coverage, capability, geography, or customer segment? Does it create concentration risk? Consider the portfolio as a system — does this addition make the whole stronger?",
    keyQuestions: [
      "What does the portfolio look like with and without this asset?",
      "Does this create unacceptable concentration in any sector, geography, or customer?",
      "Does this target complement existing portfolio companies or compete with them?",
      "Would a portfolio company board member see strategic value in this addition?",
    ],
    evidenceNeeds: [
      "Current portfolio company list with sectors, stages, and performance",
      "Portfolio construction memo or asset allocation framework",
      "Sector/geography concentration analysis",
    ],
    calibrationAnchors: [
      { score: 10, label: "Fills a critical portfolio gap; creates new value across multiple portcos" },
      { score: 7, label: "Complements portfolio without concentration risk" },
      { score: 5, label: "Neutral portfolio impact; standalone investment case only" },
      { score: 3, label: "Creates mild concentration; minimal portfolio synergy" },
      { score: 0, label: "Conflicts with existing portco or creates dangerous concentration" },
    ],
    blindSpots: [
      "Backward-looking — assesses fit with current portfolio, not where the fund is heading",
      "Ignores standalone deal quality in favor of portfolio fit",
      "May reject excellent standalone deals that don't 'fit' the current collection",
    ],
    isDefault: false,
  },

  // G1: Capability Gap Fill
  {
    gateCode: "G1",
    dimensionName: "Capability Gap Fill",
    name: "Build vs. buy analysis",
    framework: "Build vs. Buy Decision Framework",
    guidance: "Quantify the cost, timeline, and risk of building this capability organically vs. acquiring it. Include: talent acquisition costs, development timeline, opportunity cost of delay, probability of organic success. The acquisition premium should be compared against the cost of organic development failure.",
    keyQuestions: [
      "What would it cost to build this capability from scratch? Include talent, infrastructure, and time.",
      "How long would organic development take? What is the cost of that delay in competitive terms?",
      "What is the probability of organic success? What's the expected value comparison?",
      "Are there intermediate options (partnerships, licensing) that should be evaluated first?",
    ],
    evidenceNeeds: [
      "Internal capability roadmap with build estimates",
      "Talent market data for relevant skill sets",
      "Competitive timeline analysis — what happens if we don't have this capability for 18 months?",
    ],
    calibrationAnchors: [
      { score: 10, label: "Build is infeasible or 3x+ more expensive than acquisition with >18 month delay" },
      { score: 7, label: "Acquisition accelerates by 12+ months at comparable or lower total cost" },
      { score: 5, label: "Build and buy are roughly equivalent in cost/timeline; acquisition has execution certainty" },
      { score: 3, label: "Organic build is feasible and cheaper; acquisition premium not justified" },
      { score: 0, label: "No capability gap exists; acquisition solves nothing not already available internally" },
    ],
    blindSpots: [
      "Tends to underestimate organic development costs (planning fallacy)",
      "Doesn't account for integration costs which can erode the buy advantage",
      "Ignores the organizational learning value of building internally",
    ],
    isDefault: true,
  },
  {
    gateCode: "G1",
    dimensionName: "Capability Gap Fill",
    name: "Competitive denial lens",
    framework: "Competitive Denial Valuation",
    guidance: "Evaluate the value of denying this capability to competitors. If a competitor acquired this target instead, what would be the impact on your competitive position? This is the 'strategic premium' that may justify paying above standalone value.",
    keyQuestions: [
      "Which competitors could realistically acquire this target?",
      "What would each competitor gain from this acquisition?",
      "What would you lose if a competitor acquires this capability?",
      "Is the denial value large enough to justify a price premium?",
    ],
    evidenceNeeds: [
      "Competitive landscape map with named potential acquirers",
      "Assessment of competitor capability gaps that this target would fill",
      "Market intelligence on competitor M&A activity and stated strategies",
    ],
    calibrationAnchors: [
      { score: 10, label: "Target acquisition by competitor would be an existential threat; denial is imperative" },
      { score: 7, label: "Competitor acquisition would create significant disadvantage; denial has clear value" },
      { score: 5, label: "Moderate competitive impact; denial is valuable but not critical" },
      { score: 3, label: "Minimal competitive impact from competitor acquisition" },
      { score: 0, label: "No competitive denial value; target is not on any competitor's radar" },
    ],
    blindSpots: [
      "Can justify overpaying based on fear rather than fundamentals",
      "Assumes competitors would actually bid — they may not be interested",
      "Doesn't assess whether the target's capability is durable or easily replicated",
    ],
    isDefault: false,
  },

  // ═══════════════════════════════════════════════════════════
  // G4 — FINANCIAL PROFILE & VALUATION
  // ═══════════════════════════════════════════════════════════

  // G4: Revenue Quality
  {
    gateCode: "G4",
    dimensionName: "Revenue Quality",
    name: "Recurring revenue decomposition",
    framework: "Revenue Durability Analysis",
    guidance: "Decompose revenue into durability tiers: Tier 1 (contractually recurring — multi-year contracts, subscription), Tier 2 (habitually recurring — repeat purchase without contract), Tier 3 (project/one-time). Assess the transition trend: is Tier 1 growing as a % of total? Calculate net revenue retention and gross retention separately.",
    keyQuestions: [
      "What % of revenue is contractually recurring with >12 month terms?",
      "What is the net revenue retention rate (NRR) for the last 3 years?",
      "Is the recurring mix improving or deteriorating?",
      "What's the average contract length and renewal rate?",
    ],
    evidenceNeeds: [
      "Revenue breakdown by contract type for trailing 3 years",
      "Customer contract schedule with terms and renewal dates",
      "Net and gross retention rates by cohort",
    ],
    calibrationAnchors: [
      { score: 10, label: ">85% Tier 1 recurring; NRR >110%; 3yr improving trend" },
      { score: 7, label: ">70% Tier 1+2 recurring; NRR >100%; stable trend" },
      { score: 5, label: "50-70% recurring; NRR 90-100%; mixed signals" },
      { score: 3, label: "<50% recurring or NRR <90%; deteriorating retention" },
      { score: 0, label: "Predominantly project-based; no revenue visibility beyond current backlog" },
    ],
    blindSpots: [
      "Contractual recurring doesn't mean the customer is happy — look at engagement, not just contracts",
      "NRR can be inflated by price increases rather than genuine expansion",
      "Doesn't capture revenue quality by customer segment — one great segment can mask a weak overall mix",
    ],
    isDefault: true,
  },
  {
    gateCode: "G4",
    dimensionName: "Revenue Quality",
    name: "Cohort analysis",
    framework: "Customer Cohort Retention Curves",
    guidance: "Analyze revenue by customer acquisition cohort. For each annual or quarterly cohort, track how revenue evolves over time. Healthy businesses show cohorts that expand after year 1. Unhealthy businesses show cohorts that shrink rapidly. The shape of the cohort curves tells you more about revenue durability than any aggregate metric.",
    keyQuestions: [
      "Do customer cohorts expand, stabilize, or shrink over time?",
      "Is there a 'cliff' at a specific point (e.g., year 2 post-contract) where churn accelerates?",
      "Are recent cohorts performing better or worse than older cohorts?",
      "What's the payback period on customer acquisition cost?",
    ],
    evidenceNeeds: [
      "Revenue by customer cohort for trailing 3-5 years",
      "Customer count by cohort over time",
      "CAC and payback period data if available",
    ],
    calibrationAnchors: [
      { score: 10, label: "All cohorts expand through year 3+; recent cohorts outperforming older" },
      { score: 7, label: "Cohorts stabilize after initial dip; no cliff patterns" },
      { score: 5, label: "Mixed — some cohorts expand, others shrink; overall stable" },
      { score: 3, label: "Cohorts consistently shrink; recent cohorts worse than historical" },
      { score: 0, label: "Severe cohort degradation; most customers churn within 18 months" },
    ],
    blindSpots: [
      "Requires clean cohort data which many lower-middle-market companies don't track",
      "Cohort analysis doesn't explain *why* customers expand or churn",
      "Can be distorted by a few very large customers in small cohorts",
    ],
    isDefault: true,
  },
  {
    gateCode: "G4",
    dimensionName: "Revenue Quality",
    name: "Concentration heat map",
    framework: "Revenue Concentration Risk Assessment",
    guidance: "Map revenue concentration across three axes: customer, product/service, and geography. Build a heat map showing where concentration risk is highest. A business that is diversified on one axis but concentrated on another has hidden fragility. Look for 'single point of failure' dependencies.",
    keyQuestions: [
      "What % of revenue comes from the top customer? Top 5? Top 10?",
      "What % of revenue comes from the #1 product/service line?",
      "Is revenue concentrated in a single geography or region?",
      "Are there cross-dependencies — e.g., the top customer only buys the top product?",
    ],
    evidenceNeeds: [
      "Revenue by customer (top 20 minimum)",
      "Revenue by product/service line",
      "Revenue by geography",
      "Customer-product cross-tabulation if available",
    ],
    calibrationAnchors: [
      { score: 10, label: "No customer >5%, no product >30%, no geo >50% of revenue" },
      { score: 7, label: "Top customer <15%; reasonable product and geo diversification" },
      { score: 5, label: "Moderate concentration on one axis; manageable with retention plan" },
      { score: 3, label: "High concentration on 2+ axes; material fragility" },
      { score: 0, label: "Single customer >40% or single product >70%; existential dependency" },
    ],
    blindSpots: [
      "Concentration metrics are backward-looking — don't capture the pipeline diversification",
      "A diversified revenue base can still have concentrated *margin* (e.g., one customer is all the profit)",
      "Ignores whether concentrated customers are under contract or at-will",
    ],
    isDefault: true,
  },

  // G4: Valuation Attractiveness
  {
    gateCode: "G4",
    dimensionName: "Valuation Attractiveness",
    name: "DCF / intrinsic value",
    framework: "Discounted Cash Flow Analysis",
    guidance: "Build a 5-year DCF model using the target's projected free cash flows. The discount rate should reflect the specific risks of this business (not a generic WACC). Sensitivity-test three variables: revenue growth, EBITDA margin, and terminal multiple. The output is a standalone intrinsic value independent of what the market is willing to pay.",
    keyQuestions: [
      "What are the base, upside, and downside projections for free cash flow?",
      "What discount rate reflects this business's specific risk profile?",
      "How sensitive is the value to the terminal growth/exit multiple assumption?",
      "What does the implied entry multiple look like under each scenario?",
    ],
    evidenceNeeds: [
      "3-year historical financials (P&L, balance sheet, cash flow)",
      "Management projections or analyst estimates",
      "Comparable company cost of capital / risk benchmarks",
    ],
    calibrationAnchors: [
      { score: 10, label: "DCF value > asking price by 20%+; implies significant margin of safety" },
      { score: 7, label: "DCF value at or slightly above asking price; fair value with modest upside" },
      { score: 5, label: "DCF value requires optimistic assumptions to exceed asking price" },
      { score: 3, label: "DCF value below asking price under base case; requires synergies to work" },
      { score: 0, label: "DCF cannot justify the asking price under any reasonable assumptions" },
    ],
    blindSpots: [
      "Terminal value typically drives 60-70% of the DCF output — the model is only as good as the terminal assumption",
      "Ignores market pricing reality — a business can be intrinsically worth $50M but the market clears at $35M",
      "Highly sensitive to discount rate — a 1% change swings value 10-15%",
      "Garbage in, garbage out: management projections are often optimistic",
    ],
    isDefault: true,
  },
  {
    gateCode: "G4",
    dimensionName: "Valuation Attractiveness",
    name: "Comparable transactions",
    framework: "Precedent Transaction Analysis",
    guidance: "Identify 8-15 comparable M&A transactions in the same sector and size range within the last 3 years. Calculate implied EV/EBITDA, EV/Revenue, and if available, price-to-earnings multiples. Position the target relative to the median and assess what premium or discount is warranted based on quality differences.",
    keyQuestions: [
      "What have similar businesses actually sold for in recent transactions?",
      "Is the target above or below the median comp multiple? By how much?",
      "What quality factors justify a premium or discount vs. comps?",
      "Are recent transactions at higher or lower multiples than historical? Why?",
    ],
    evidenceNeeds: [
      "8-15 comparable M&A transactions with disclosed terms",
      "Transaction data source: Capital IQ, PitchBook, or broker research",
      "Quality factor comparison (growth rate, margin, size, market position) vs. each comp",
    ],
    calibrationAnchors: [
      { score: 10, label: "Entry multiple is 2+ turns below comparable median with no quality discount" },
      { score: 7, label: "Entry multiple at or slightly below median; fair market value" },
      { score: 5, label: "Entry multiple at median; requires quality premium justification" },
      { score: 3, label: "Entry multiple 1-2 turns above median; paying a premium" },
      { score: 0, label: "Entry multiple significantly above all comparables; overpaying on any benchmark" },
    ],
    blindSpots: [
      "Backward-looking: comp transactions reflect past market conditions, not current",
      "Comparability is always imperfect — sector, size, growth, and margin differences distort",
      "Disclosed transaction terms often exclude earnouts and contingent payments",
      "Survivorship bias: only successful/disclosed deals show up in databases",
    ],
    isDefault: true,
  },
  {
    gateCode: "G4",
    dimensionName: "Valuation Attractiveness",
    name: "LBO returns analysis",
    framework: "Leveraged Buyout Returns Model",
    guidance: "Model the deal as an LBO: calculate IRR and MOIC under the proposed capital structure. Stress-test with varying leverage levels, growth assumptions, and exit multiples. The returns must exceed the fund's hurdle rate. This lens is specific to PE — it answers: 'At this price and structure, does the deal generate the returns our LPs expect?'",
    keyQuestions: [
      "What IRR and MOIC does the deal generate at the proposed structure?",
      "How sensitive are returns to exit multiple assumptions?",
      "What leverage level optimizes returns without creating distress risk?",
      "What is the minimum hold period to achieve target returns?",
    ],
    evidenceNeeds: [
      "Proposed capital structure (debt, equity split, terms)",
      "Revenue and EBITDA projections for hold period (typically 5 years)",
      "Debt service coverage analysis under base and downside cases",
      "Exit multiple assumptions with support from comparable transactions",
    ],
    calibrationAnchors: [
      { score: 10, label: "IRR >30% and MOIC >3.0x under base case; holds up under downside" },
      { score: 7, label: "IRR 20-30% and MOIC 2.5-3.0x; meets hurdle with margin" },
      { score: 5, label: "IRR 15-20% and MOIC 2.0-2.5x; meets minimum but tight" },
      { score: 3, label: "IRR <15% or MOIC <2.0x; below hurdle; requires synergies" },
      { score: 0, label: "Returns do not meet fund hurdle under any reasonable scenario" },
    ],
    blindSpots: [
      "Heavily dependent on exit multiple assumption — which is fundamentally unknowable",
      "Doesn't assess strategic or operational quality — purely a financial lens",
      "Leverage amplifies returns but also amplifies risk; this lens tends to favor more leverage",
      "Assumes an exit, which may not happen at the projected timeline or multiple",
    ],
    isDefault: true,
  },

  // ═══════════════════════════════════════════════════════════
  // G5 — OPERATIONAL & INTEGRATION
  // ═══════════════════════════════════════════════════════════

  // G5: Systems Compatibility
  {
    gateCode: "G5",
    dimensionName: "Systems Compatibility",
    name: "Architecture comparison",
    framework: "Technology Stack Mapping",
    guidance: "Create a side-by-side map of the acquirer's and target's technology stacks: ERP, CRM, HRIS, financial systems, communication tools, and any industry-specific platforms. Identify overlaps, conflicts, and gaps. For each system pair, classify as: shared (same platform), compatible (standard migration path), or incompatible (custom build required).",
    keyQuestions: [
      "What are the major system pairs and their compatibility status?",
      "Are there any systems that absolutely cannot be migrated (regulatory, legacy dependency)?",
      "What is the total system count that needs to be addressed?",
      "Are there technology debt items that integration would force you to resolve?",
    ],
    evidenceNeeds: [
      "Target IT infrastructure inventory",
      "Acquirer technology stack documentation",
      "System dependency map (which systems talk to which)",
    ],
    calibrationAnchors: [
      { score: 10, label: "Shared or compatible systems across all major categories; <3 month migration" },
      { score: 7, label: "1-2 incompatible systems but with known migration paths; 6 month timeline" },
      { score: 5, label: "Multiple system conflicts requiring parallel operations during 6-12 month migration" },
      { score: 3, label: "Core ERP/financial systems incompatible; custom integration required; 12+ months" },
      { score: 0, label: "Fundamental architecture conflict; complete system rebuild required" },
    ],
    blindSpots: [
      "Architecture comparison looks at systems in isolation — doesn't capture data quality or process differences",
      "Underestimates the human change management required even when systems are technically compatible",
      "Migration timelines are almost always longer than estimated",
    ],
    isDefault: true,
  },
  {
    gateCode: "G5",
    dimensionName: "Systems Compatibility",
    name: "Data quality audit",
    framework: "Data Migration Readiness Assessment",
    guidance: "Assess whether the target's data can actually be migrated cleanly into the acquirer's systems. Look beyond system compatibility to data quality: Is the data structured? Is it complete? Are there naming conventions that differ? Is historical data preserved or fragmented? Dirty data is the #1 cause of integration delays.",
    keyQuestions: [
      "Is the target's data structured and normalized, or scattered across spreadsheets and local files?",
      "What is the data completeness rate for critical fields (customer records, financial data, HR records)?",
      "Are there naming/coding conventions that conflict with the acquirer's standards?",
      "How much historical data needs to be migrated vs. archived?",
    ],
    evidenceNeeds: [
      "Sample data exports from the target's core systems",
      "Data dictionary or field mapping documentation (if it exists)",
      "IT team assessment of data quality issues",
    ],
    calibrationAnchors: [
      { score: 10, label: "Clean, structured data with documented schemas; direct migration path" },
      { score: 7, label: "Mostly clean with known quality issues that can be addressed pre-migration" },
      { score: 5, label: "Significant data cleanup required; 3-6 months of data remediation before migration" },
      { score: 3, label: "Fragmented data across multiple unconnected systems; major reconstruction needed" },
      { score: 0, label: "No usable digital data; manual data entry from paper/PDFs required" },
    ],
    blindSpots: [
      "Data quality is expensive to assess thoroughly — sample-based audits may miss systematic issues",
      "Doesn't assess whether the target's team knows where all their data actually lives",
      "Clean data in a bad system is still a migration project",
    ],
    isDefault: true,
  },

  // ═══════════════════════════════════════════════════════════
  // G6 — RISK ASSESSMENT
  // ═══════════════════════════════════════════════════════════

  // G6: Key Person Risk
  {
    gateCode: "G6",
    dimensionName: "Key Person Risk",
    name: "Departure impact modeling",
    framework: "Key Person Impact Quantification",
    guidance: "For each identified key person, quantify the impact of their departure: revenue at risk (customers who buy because of this person), capability at risk (knowledge that only this person holds), and operational continuity risk (processes that only this person can run). Express impact as a percentage of business value, not just a qualitative assessment.",
    keyQuestions: [
      "For each key person: what revenue is directly attributable to their relationships?",
      "What knowledge does each key person hold that is not documented or transferable?",
      "What operations would be disrupted and for how long if this person left on day 31?",
      "What is the total 'key person risk premium' as a % of enterprise value?",
    ],
    evidenceNeeds: [
      "Customer relationship map showing which customers are managed by which key person",
      "Org chart with reporting lines and scope of responsibility",
      "IP/knowledge dependency assessment for each key person",
    ],
    calibrationAnchors: [
      { score: 10, label: "No person responsible for >10% of revenue or any critical-path capability" },
      { score: 7, label: "1-2 key people with >15% revenue exposure; knowledge transfer feasible in 6 months" },
      { score: 5, label: "2-3 key people with >20% combined exposure; retention earnouts required" },
      { score: 3, label: "Founder-dependent: >30% of revenue/capability concentrated in 1 person" },
      { score: 0, label: "Single-person dependency where departure = existential threat to the business" },
    ],
    blindSpots: [
      "Impact modeling is inherently speculative — you don't know what happens until the person actually leaves",
      "Focuses on downside risk of departure, not upside value of retaining and empowering key people",
      "May overweight visible customer relationships and underweight invisible operational knowledge",
    ],
    isDefault: true,
  },
  {
    gateCode: "G6",
    dimensionName: "Key Person Risk",
    name: "Retention mechanism design",
    framework: "Retention Structure Engineering",
    guidance: "Design and evaluate the retention mechanisms available for each key person: earnout structures tied to performance, employment agreements with non-compete/non-solicit, equity rollover into the new entity, and compensation adjustments. Assess the cost of retention against the value at risk from departure.",
    keyQuestions: [
      "What retention structure would each key person accept? (Have they been asked?)",
      "What is the total cost of retention mechanisms as a % of deal value?",
      "Are the proposed structures legally enforceable in the relevant jurisdictions?",
      "Is the earnout aligned with behaviors you want, or does it create perverse incentives?",
    ],
    evidenceNeeds: [
      "Current compensation structures for key personnel",
      "Non-compete/non-solicit enforceability analysis for target jurisdiction",
      "Key person expectations regarding post-close role (from management meetings)",
    ],
    calibrationAnchors: [
      { score: 10, label: "Key people are enthusiastic about staying; retention structures are standard and affordable" },
      { score: 7, label: "Retention feasible with standard earnout/equity; total cost <5% of deal value" },
      { score: 5, label: "Retention possible but expensive (5-10% of deal value) or requiring complex structures" },
      { score: 3, label: "Key people ambivalent about staying; retention uncertain even with generous terms" },
      { score: 0, label: "Key people have expressed desire to exit; no retention mechanism will work" },
    ],
    blindSpots: [
      "Retention structures can't force someone to be engaged — they can only prevent them from leaving",
      "Earnouts often create conflict between the retained person and new management",
      "Doesn't assess whether the key person can actually operate in the acquirer's culture and processes",
    ],
    isDefault: true,
  },
  {
    gateCode: "G6",
    dimensionName: "Key Person Risk",
    name: "Bench depth assessment",
    framework: "Succession Readiness Evaluation",
    guidance: "For each key person, evaluate who steps in if they're unavailable for 6 months. This is the 'bus test' applied systematically. Assess the depth of the management bench: are there #2 people for every critical function? How much time would the #2 need to reach competence? This lens reveals organizational resilience.",
    keyQuestions: [
      "For each key function: who is the identified successor and how prepared are they?",
      "How much institutional knowledge is documented vs. in someone's head?",
      "What is the average tenure of the management team? (Short tenure = shallow bench)",
      "Has the organization ever survived the departure of a key person? How did it go?",
    ],
    evidenceNeeds: [
      "Org chart with identified successors for key roles",
      "Management team tenure and capability assessment",
      "Documentation/knowledge base audit — what's written down vs. tribal knowledge?",
    ],
    calibrationAnchors: [
      { score: 10, label: "Identified, trained successor for every key role; documented processes; prior successful transitions" },
      { score: 7, label: "Most key roles have a capable #2; 3-6 month ramp time for transition" },
      { score: 5, label: "Some bench depth but gaps in 1-2 critical areas; knowledge transfer needed post-close" },
      { score: 3, label: "Thin bench; most critical knowledge is undocumented and concentrated" },
      { score: 0, label: "No bench; zero succession planning; all knowledge is tribal" },
    ],
    blindSpots: [
      "An identified successor ≠ a tested successor; bench depth is theoretical until tested",
      "Doesn't assess whether the bench wants to stay post-acquisition",
      "Documentation exists ≠ documentation is useful or current",
    ],
    isDefault: false,
  },
];

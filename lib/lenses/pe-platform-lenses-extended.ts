// ═══════════════════════════════════════════════════════════════
// AMP v2 — PE Platform Build: G2, G3, G7 Evaluation Lenses
// Completes the full gate coverage for the PE Platform template.
// Import alongside pe-platform-lenses.ts in the seed script.
// ═══════════════════════════════════════════════════════════════

import type { LensSeed } from "./pe-platform-lenses";

export const PE_PLATFORM_LENSES_EXTENDED: LensSeed[] = [

  // ═══════════════════════════════════════════════════════════
  // G2 — MARKET & COMPETITIVE POSITION
  // ═══════════════════════════════════════════════════════════

  // G2: Market Growth Rate
  {
    gateCode: "G2",
    dimensionName: "Market Growth Rate",
    name: "TAM/SAM/SOM decomposition",
    framework: "Bottom-Up Market Sizing",
    guidance: "Size the market bottom-up from identifiable customer segments rather than relying on top-down analyst estimates. Start with the number of potential customers, multiply by average deal size, and adjust for adoption rates. This produces a more defensible and actionable market size than a Gartner number.",
    keyQuestions: [
      "How many potential customers exist in the target's addressable market? By segment?",
      "What is the average revenue per customer? Is it expanding or contracting?",
      "What adoption rate is realistic for each segment?",
      "How does the SAM compare to what industry reports claim for TAM?",
    ],
    evidenceNeeds: [
      "Customer count by segment with revenue per customer",
      "Industry report as cross-reference (not primary source)",
      "Management's view of addressable market with supporting logic",
    ],
    calibrationAnchors: [
      { score: 10, label: "Bottom-up SAM growing >10% with expanding customer count and deal size" },
      { score: 7, label: "SAM growing 5\u201310% with stable customer economics" },
      { score: 5, label: "SAM growing at GDP rates; market is mature but stable" },
      { score: 3, label: "SAM flat or growing <2%; limited expansion vectors" },
      { score: 0, label: "SAM contracting; customer base shrinking" },
    ],
    blindSpots: [
      "Bottom-up sizing can undercount adjacent markets the target could enter",
      "Doesn't capture timing \u2014 a growing market that's 5 years from inflection looks the same as one that's inflecting now",
      "Assumes current product-market fit; doesn't account for product evolution expanding the SAM",
    ],
    isDefault: true,
  },
  {
    gateCode: "G2",
    dimensionName: "Market Growth Rate",
    name: "Leading indicator analysis",
    framework: "Forward-Looking Growth Signals",
    guidance: "Look beyond historical growth rates to forward-looking indicators: hiring velocity in the sector, patent filings, regulatory tailwinds/headwinds, venture capital investment in adjacent companies, and customer pipeline data. Historical growth can be misleading \u2014 leading indicators tell you where the market is heading, not where it's been.",
    keyQuestions: [
      "Are companies in this sector hiring aggressively or contracting?",
      "Is venture capital flowing into this space? Increasing or decreasing?",
      "Are there regulatory changes that will expand or constrain the market?",
      "What does the target's own pipeline and proposal activity suggest about demand?",
    ],
    evidenceNeeds: [
      "Sector hiring data (LinkedIn, BLS)",
      "VC investment in adjacent companies (PitchBook/Crunchbase)",
      "Regulatory pipeline or legislative tracker",
      "Target's sales pipeline and proposal win rates",
    ],
    calibrationAnchors: [
      { score: 10, label: "Multiple leading indicators confirm acceleration; regulatory tailwinds imminent" },
      { score: 7, label: "Most indicators positive; no contradicting signals" },
      { score: 5, label: "Mixed signals \u2014 some indicators positive, some neutral" },
      { score: 3, label: "Leading indicators flat or declining despite historical growth" },
      { score: 0, label: "Leading indicators uniformly negative; historical growth is decelerating" },
    ],
    blindSpots: [
      "Leading indicators can generate false positives \u2014 VC hype doesn't always translate to sustained market growth",
      "Regulatory analysis is inherently speculative",
      "Hiring data lags actual business decisions by 3\u20136 months",
    ],
    isDefault: false,
  },

  // G2: Competitive Intensity
  {
    gateCode: "G2",
    dimensionName: "Competitive Intensity",
    name: "Porter's Five Forces",
    framework: "Structural Industry Analysis",
    guidance: "Apply Porter's Five Forces systematically: threat of new entrants (barriers to entry), bargaining power of suppliers, bargaining power of buyers, threat of substitutes, and competitive rivalry. Score each force and assess the overall structural attractiveness. An industry with high barriers, low buyer power, and limited substitutes is structurally attractive regardless of current competition levels.",
    keyQuestions: [
      "What are the barriers to entry? Are they increasing or eroding?",
      "Do buyers have alternatives? Can they credibly threaten to switch?",
      "Are there substitute products or services that could displace the target's offering?",
      "How concentrated is the competitive landscape? Is it consolidating or fragmenting?",
    ],
    evidenceNeeds: [
      "Competitive landscape map with market share estimates",
      "Barrier-to-entry analysis (capital requirements, regulation, switching costs)",
      "Customer switching cost and alternative assessment",
    ],
    calibrationAnchors: [
      { score: 10, label: "High barriers, low buyer power, few substitutes; structurally attractive" },
      { score: 7, label: "Most forces favorable; one area of moderate pressure" },
      { score: 5, label: "Mixed structural dynamics; manageable but requires positioning" },
      { score: 3, label: "Multiple unfavorable forces; margin pressure likely to persist" },
      { score: 0, label: "Structurally unattractive; commoditized with low barriers and high rivalry" },
    ],
    blindSpots: [
      "Five Forces is a point-in-time snapshot \u2014 industry structure evolves",
      "Doesn't capture the target's specific competitive advantages, only the industry structure",
      "Can underweight disruption from outside the traditional competitive set",
    ],
    isDefault: true,
  },
  {
    gateCode: "G2",
    dimensionName: "Competitive Intensity",
    name: "Pricing power test",
    framework: "Price Elasticity & Margin Defense",
    guidance: "The simplest test of competitive position: can the target raise prices 5% without losing customers? Examine historical price increases, customer reaction, competitive response, and contract terms. Pricing power is the most reliable indicator of competitive moat \u2014 if customers can't or won't leave when prices go up, the target has a real advantage.",
    keyQuestions: [
      "Has the target raised prices in the last 3 years? What happened to customer retention?",
      "What was the competitive response to the target's price increases?",
      "Are contracts fixed-price or do they include escalation clauses?",
      "What would a 5% price increase do to revenue and customer count?",
    ],
    evidenceNeeds: [
      "Historical pricing actions and customer retention data",
      "Contract terms showing escalation mechanisms",
      "Management view on pricing flexibility",
    ],
    calibrationAnchors: [
      { score: 10, label: "Regular above-inflation price increases with no customer loss; strong evidence of moat" },
      { score: 7, label: "Moderate pricing power; occasional increases absorbed by customers" },
      { score: 5, label: "Limited pricing power; increases must be justified with added value" },
      { score: 3, label: "Price-sensitive market; increases trigger customer review of alternatives" },
      { score: 0, label: "Zero pricing power; commodity dynamics; price is the primary buying criterion" },
    ],
    blindSpots: [
      "Past pricing power doesn't guarantee future pricing power \u2014 competitive dynamics change",
      "B2B contracts with multi-year terms can mask underlying price sensitivity",
      "Doesn't distinguish between pricing power from switching costs vs. from genuine product superiority",
    ],
    isDefault: true,
  },

  // ═══════════════════════════════════════════════════════════
  // G3 — BUSINESS MODEL COMPATIBILITY
  // ═══════════════════════════════════════════════════════════

  // G3: Customer Segment Fit
  {
    gateCode: "G3",
    dimensionName: "Customer Segment Fit",
    name: "Overlap and extension analysis",
    framework: "Customer Segment Mapping Matrix",
    guidance: "Build a 2x2 matrix: acquirer's customers vs. target's customers, segmented by industry, size, and buying behavior. Identify the overlap zone (shared customers), the extension zone (new customers the acquirer can reach through the target), and the conflict zone (customers who might see the combination negatively). The ideal acquisition extends TAM without cannibalizing existing revenue.",
    keyQuestions: [
      "What % of the target's customers are already acquirer customers?",
      "What new customer segments does the target provide access to?",
      "Are there customers who buy from both and might consolidate spend?",
      "Could any customers view the combination as a competitive threat and leave?",
    ],
    evidenceNeeds: [
      "Customer list comparison (anonymized if pre-LOI)",
      "Segment-level overlap analysis",
      "Cross-sell revenue sizing model",
    ],
    calibrationAnchors: [
      { score: 10, label: "<10% overlap; large extension zone; identifiable cross-sell TAM >$5M" },
      { score: 7, label: "10\u201325% overlap; meaningful extension; clear cross-sell path" },
      { score: 5, label: "25\u201340% overlap; moderate extension; some cross-sell potential" },
      { score: 3, label: ">40% overlap; limited extension; cannibalization risk" },
      { score: 0, label: "Near-complete overlap; acquisition adds no new customer access" },
    ],
    blindSpots: [
      "Overlap analysis is typically done at the account level \u2014 misses buying-center-level nuance",
      "Cross-sell sizing is inherently optimistic; discount by 50% for realistic planning",
      "Doesn't capture whether the combined sales team can actually execute the cross-sell motion",
    ],
    isDefault: true,
  },
  {
    gateCode: "G3",
    dimensionName: "Customer Segment Fit",
    name: "Churn risk analysis",
    framework: "Post-Acquisition Customer Retention Risk",
    guidance: "Assess the risk that existing customers \u2014 either the acquirer's or the target's \u2014 will churn as a result of the acquisition. Common triggers: perceived conflict of interest, fear of deprioritization, cultural mismatch in service delivery, price increase expectations, and competitor poaching during transition uncertainty. Map each risk and size the revenue exposure.",
    keyQuestions: [
      "Which customers have contracts expiring within 12 months of expected close?",
      "Are there customers who compete with the other party's customers?",
      "Has management identified any customers who would react negatively to the deal?",
      "What is the total revenue at risk from post-acquisition churn?",
    ],
    evidenceNeeds: [
      "Contract expiry schedule for top 20 customers (both sides)",
      "Customer conflict mapping",
      "Retention risk register with revenue exposure",
    ],
    calibrationAnchors: [
      { score: 10, label: "<5% revenue at risk from post-acquisition churn; long-term contracts protect base" },
      { score: 7, label: "5\u201310% revenue at risk; retention plans feasible for at-risk accounts" },
      { score: 5, label: "10\u201320% revenue at risk; requires active retention program" },
      { score: 3, label: "20\u201330% revenue at risk; significant customer uncertainty" },
      { score: 0, label: ">30% revenue at risk; acquisition could trigger customer exodus" },
    ],
    blindSpots: [
      "Churn risk is impossible to fully predict before announcement",
      "Doesn't account for competitor behavior \u2014 aggressive poaching during transition amplifies risk",
      "Underestimates 'silent churn' where customers don't leave immediately but shift spend over 12\u201324 months",
    ],
    isDefault: true,
  },

  // G3: Revenue Model Compatibility
  {
    gateCode: "G3",
    dimensionName: "Revenue Model Compatibility",
    name: "Revenue model comparison",
    framework: "Revenue Architecture Mapping",
    guidance: "Compare revenue architectures side by side: How does each business make money? Subscription vs. project vs. transaction. Annual vs. monthly vs. usage-based. Direct vs. channel. Map the full revenue model including pricing structure, billing frequency, contract terms, and payment patterns. Incompatible models create integration friction; compatible models create leverage.",
    keyQuestions: [
      "Are both businesses primarily subscription, project-based, or hybrid?",
      "Are pricing structures compatible? (e.g., per-seat vs. per-usage vs. fixed-fee)",
      "Would customers be confused by the combined pricing model?",
      "Can the combined billing and invoicing systems handle both models?",
    ],
    evidenceNeeds: [
      "Revenue model documentation for both businesses",
      "Pricing structure comparison",
      "Contract term and billing frequency comparison",
    ],
    calibrationAnchors: [
      { score: 10, label: "Identical revenue model; immediate operational synergy on billing and pricing" },
      { score: 7, label: "Compatible models; minor adaptation needed; no customer confusion" },
      { score: 5, label: "Different but non-conflicting models; parallel operations feasible" },
      { score: 3, label: "Significant differences; customers may be confused; parallel billing required" },
      { score: 0, label: "Fundamentally incompatible; one model undermines the other's pricing logic" },
    ],
    blindSpots: [
      "Focuses on current revenue models; doesn't assess whether either business is transitioning models",
      "Revenue model compatibility ≠ pricing power compatibility \u2014 two subscription businesses can have very different pricing dynamics",
      "Ignores channel conflict which can exist even when direct revenue models are compatible",
    ],
    isDefault: true,
  },

  // ═══════════════════════════════════════════════════════════
  // G7 — IC DECISION
  // ═══════════════════════════════════════════════════════════

  // G7: Composite Strategic (G1-G3)
  {
    gateCode: "G7",
    dimensionName: "Composite Strategic (G1-G3)",
    name: "Gate score synthesis",
    framework: "Strategic Gate Aggregation",
    guidance: "Review the composite scores from G1, G2, and G3. Weight them by their relative importance to the acquisition thesis. For a capability buy, G1 matters most. For a market extension, G2 dominates. Flag any gate that scored below its minimum threshold \u2014 a weak G2 score should be explicitly addressed regardless of strong G1 and G3 performance.",
    keyQuestions: [
      "Did all three strategic gates (G1\u2013G3) pass their minimum thresholds?",
      "Which gate is most relevant to the fund thesis, and how did it score?",
      "Where did evaluation lenses diverge most across the strategic gates?",
      "Are the strategic strengths durable, or are they dependent on assumptions?",
    ],
    evidenceNeeds: [
      "G1, G2, G3 composite scores and dimension breakdowns",
      "Lens convergence/divergence notes from each gate",
      "Any dimensions that scored below 5 with rationale",
    ],
    calibrationAnchors: [
      { score: 10, label: "All three gates scored >70; lens convergence across all strategic dimensions" },
      { score: 7, label: "Average >65 across gates; no gate below minimum; minor divergences resolved" },
      { score: 5, label: "Average >55; one gate near minimum threshold; some unresolved tensions" },
      { score: 3, label: "One or more gates below minimum; strategic case requires significant caveats" },
      { score: 0, label: "Multiple gates failed or scored below decline threshold; no strategic rationale" },
    ],
    blindSpots: [
      "Aggregation can smooth over a critical weakness in one gate that should be a dealbreaker",
      "Lens divergence at the synthesis level is harder to resolve than at the individual gate level",
      "Strategic attractiveness can be seductive enough to override financial or operational concerns",
    ],
    isDefault: true,
  },

  // G7: Financial Attractiveness (G4)
  {
    gateCode: "G7",
    dimensionName: "Financial Attractiveness (G4)",
    name: "Returns and sensitivity review",
    framework: "Investment Returns Stress Test",
    guidance: "Review the G4 module output (whichever module was selected). Focus not on the base case \u2014 focus on the downside. What happens to returns if growth slows by 20%? If margins compress 300bps? If the exit multiple contracts by 2 turns? The IC should understand the range of outcomes, not just the midpoint. A deal that returns 25% IRR in the base case but goes to 5% in the downside is a different proposition than one that returns 20% base and 12% downside.",
    keyQuestions: [
      "What is the IRR and MOIC under base, upside, and downside scenarios?",
      "Which assumption is the returns model most sensitive to?",
      "Does the deal still meet the hurdle rate under reasonable stress?",
      "Are synergies required for the deal to work, or is standalone value sufficient?",
    ],
    evidenceNeeds: [
      "G4 composite score and module-level dimension scores",
      "Returns sensitivity analysis (3-variable tornado chart)",
      "Synergy dependency analysis: standalone returns vs. synergy-adjusted returns",
    ],
    calibrationAnchors: [
      { score: 10, label: "Exceeds hurdle under downside; standalone value sufficient; multiple upside levers" },
      { score: 7, label: "Meets hurdle in base case with margin; downside stays above cost of capital" },
      { score: 5, label: "Meets hurdle in base case; downside approaches but doesn't breach cost of capital" },
      { score: 3, label: "Below hurdle without synergies; downside is value-destructive" },
      { score: 0, label: "Does not meet financial criteria under any reasonable scenario" },
    ],
    blindSpots: [
      "Sensitivity analysis only captures known variables \u2014 doesn't model unknown unknowns",
      "Synergy estimates are almost always optimistic; apply a 50% haircut for conservative case",
      "Exit multiple assumptions drive most PE returns models; if you're wrong on exit, nothing else matters",
    ],
    isDefault: true,
  },

  // G7: Operational Feasibility (G5)
  {
    gateCode: "G7",
    dimensionName: "Operational Feasibility (G5)",
    name: "Integration readiness assessment",
    framework: "Day-1 and 100-Day Plan Review",
    guidance: "Assess whether the integration plan is realistic and resourced. A strong G5 score means nothing if the 100-day plan is vague or under-resourced. Review: Is there a named integration lead? Are workstreams defined with owners? Are costs budgeted? Have key retention decisions been made? The IC should have confidence that the deal team has thought through what happens after signing, not just before.",
    keyQuestions: [
      "Is there a named integration lead with dedicated bandwidth?",
      "Is the integration cost estimate bottom-up or top-down?",
      "Have retention decisions been made for key personnel?",
      "What are the top 3 integration risks and what's the mitigation plan?",
    ],
    evidenceNeeds: [
      "G5 composite score and dimension breakdown",
      "100-day integration plan (if available)",
      "Integration cost estimate with line-item detail",
      "Key person retention status",
    ],
    calibrationAnchors: [
      { score: 10, label: "Detailed 100-day plan with named owners; integration cost <30% of synergy NPV; key retentions secured" },
      { score: 7, label: "Solid plan with some gaps; cost <50% of synergy NPV; key retentions in progress" },
      { score: 5, label: "High-level plan exists; cost 50\u201370% of synergy NPV; integration risks identified but not fully mitigated" },
      { score: 3, label: "Vague integration plan; cost uncertain; significant execution risk" },
      { score: 0, label: "No credible integration plan; integration would likely destroy value" },
    ],
    blindSpots: [
      "The existence of a plan is not the same as the ability to execute it",
      "Integration readiness at close is a snapshot \u2014 the real test is months 3\u201312",
      "Over-planning can create false confidence; flexibility matters more than perfection",
    ],
    isDefault: true,
  },
];

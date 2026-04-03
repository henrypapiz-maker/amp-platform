// ═══════════════════════════════════════════════════════════════
// AMP v2 — PE Bolt-On / Roll-Up Template
//
// For PE firms making 3-10 add-on acquisitions to build a
// platform company. Heavy focus on synergy capture, integration
// capacity, and portfolio-level value creation.
// ═══════════════════════════════════════════════════════════════

export const PE_BOLT_ON_TEMPLATE = {
  name: "PE Bolt-On / Roll-Up",
  slug: "pe-bolt-on",
  archetype: "pe_bolt_on",
  description: "Methodology for PE-backed platform companies evaluating bolt-on acquisitions. Emphasizes synergy sizing, integration capacity, and portfolio accretion over standalone deal economics.",
  version: "1.0.0",
  isPublished: true,
  isDefault: false,
  authoredBy: "Alio Foundry",
  changeLog: [{ version: "1.0.0", date: "2026-04-03", changes: ["Initial release"] }],

  personaSchema: {
    fields: [
      { key: "platformCompanyName", label: "Platform Company Name", required: true },
      { key: "synergyThesis", label: "Synergy Thesis", required: true },
      { key: "integrationPhilosophy", label: "Integration Philosophy", required: true },
      { key: "targetBoltOnCount", label: "Target # of Bolt-Ons (1-5)", required: true },
      { key: "maxMultiple", label: "Max Entry Multiple (e.g., 7x)", required: true },
    ],
  },

  weightPropagationRules: [
    { condition: "synergyThesis === 'Customer Consolidation'", gateCode: "G1", dimensionName: "Objective Traceability", adjustment: 15, reason: "Customer consolidation thesis prioritizes strategic overlap" },
    { condition: "synergyThesis === 'Service Layering'", gateCode: "G1", dimensionName: "Capability Gap Fill", adjustment: 10, reason: "Service layering thesis prioritizes capability acquisition" },
    { condition: "integrationPhilosophy === 'Full Integration'", gateCode: "G5", dimensionName: "Systems Integration", adjustment: 10, reason: "Full integration requires heavier systems diligence" },
    { condition: "targetBoltOnCount >= 4", gateCode: "G5", dimensionName: "Operational Absorption", adjustment: 10, reason: "High bolt-on count strains integration bandwidth" },
  ],

  gatesConfig: [
    // ── G0: Universe Qualification ─────────────────────────────
    {
      code: "G0",
      name: "Universe Qualification",
      purpose: "Hard filter for bolt-on candidates: must fit the platform's sector, size, and geography scope with demonstrable synergy potential.",
      type: "binary",
      minimumScore: null,
      declineThreshold: null,
      rule: "ALL dimensions must pass. Any fail = remove from pipeline.",
      dimensions: [
        {
          name: "Sector Fit",
          weight: 25,
          rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
          testGuidance: "Target must operate in the platform's core sector or an immediately adjacent vertical. Verify NAICS alignment, customer overlap potential, and service/product complementarity.",
          acceptanceParams: [{ label: "Sector Match", defaultValue: "Same or adjacent NAICS code", type: "text" }],
        },
        {
          name: "Size Parameters",
          weight: 25,
          rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
          testGuidance: "Revenue and EBITDA must fall within the platform's bolt-on acquisition band. Too small = integration overhead exceeds value. Too large = tail wags the dog.",
          acceptanceParams: [
            { label: "Revenue Range", defaultValue: "$5M–$50M", type: "text" },
            { label: "EBITDA Minimum", defaultValue: "$1M+", type: "text" },
          ],
        },
        {
          name: "Geographic Reach",
          weight: 20,
          rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
          testGuidance: "Bolt-on must operate in a geography that extends the platform's footprint or deepens an existing market. Remote geographies without clear commercial logic are excluded.",
          acceptanceParams: [{ label: "Geography", defaultValue: "Platform's target markets or contiguous regions", type: "text" }],
        },
        {
          name: "Platform Synergy Threshold",
          weight: 30,
          rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
          testGuidance: "Must demonstrate at least one quantifiable synergy vector: revenue cross-sell, cost elimination, or capability fill. Pure standalone deals that don't enhance the platform are excluded from bolt-on pipeline.",
          acceptanceParams: [
            { label: "Minimum Synergy", defaultValue: "$500K+ identifiable annual synergy", type: "text" },
            { label: "Synergy Type", defaultValue: "Revenue, cost, or capability", type: "text" },
          ],
        },
      ],
      evidenceArtifacts: [
        { id: "bolt-on-scorecard", label: "Bolt-On Qualification Scorecard" },
        { id: "synergy-screen", label: "Preliminary Synergy Screen" },
      ],
    },

    // ── G1: Platform Alignment ─────────────────────────────────
    {
      code: "G1",
      name: "Platform Alignment",
      purpose: "Assess how this bolt-on advances the platform thesis. Score strategic overlap, cross-sell opportunity, capability gaps filled, and geographic/product extension value.",
      type: "scored",
      minimumScore: 60,
      declineThreshold: 40,
      rule: "Weighted composite ≥60 to advance. Below 40 = auto-decline.",
      dimensions: [
        {
          name: "Objective Traceability",
          weight: 25,
          rubric: [
            { score: 10, label: "Directly executes a named strategic pillar from the platform's value creation plan" },
            { score: 7, label: "Strongly supports 1-2 strategic objectives with clear causal link" },
            { score: 5, label: "Moderate alignment — supports strategy but not a priority lever" },
            { score: 3, label: "Tangential alignment — requires creative interpretation to link to strategy" },
            { score: 0, label: "Opportunistic deal with no strategic connection to platform thesis" },
          ],
          testGuidance: "Map the bolt-on against the platform's documented value creation plan. Every named strategic pillar should be tested. If the bolt-on doesn't clearly advance at least one pillar, it's opportunistic.",
          acceptanceParams: [
            { label: "Platform VCP Reference", defaultValue: "Board-approved value creation plan", type: "text" },
          ],
        },
        {
          name: "Cross-Sell Opportunity",
          weight: 25,
          rubric: [
            { score: 10, label: ">$3M addressable cross-sell within 24 months with identified customer overlap" },
            { score: 7, label: "$1M–$3M cross-sell with strong overlap and clear go-to-market path" },
            { score: 5, label: "$500K–$1M cross-sell opportunity with moderate overlap" },
            { score: 3, label: "<$500K cross-sell or unvalidated market assumptions" },
            { score: 0, label: "No customer overlap; cross-sell requires new market development" },
          ],
          testGuidance: "Quantify the addressable cross-sell by mapping the bolt-on's capabilities against the platform's existing customer base. Identify specific accounts, size the wallet share opportunity, and assess GTM feasibility.",
          acceptanceParams: [
            { label: "Cross-Sell Target", defaultValue: ">$1M within 24 months", type: "text" },
            { label: "Customer Overlap", defaultValue: ">20% of platform's top 50 customers", type: "text" },
          ],
        },
        {
          name: "Capability Gap Fill",
          weight: 30,
          rubric: [
            { score: 10, label: "Fills a documented capability gap that is blocking platform growth or competitive positioning" },
            { score: 7, label: "Adds meaningful capability that accelerates platform roadmap by 12+ months" },
            { score: 5, label: "Adds complementary capability — nice to have but not blocking growth" },
            { score: 3, label: "Capability overlap with platform — limited incremental value" },
            { score: 0, label: "Duplicate capability or misaligned technology stack" },
          ],
          testGuidance: "Reference the platform's capability matrix. Identify which cells this bolt-on fills. Estimate the time and cost to build the capability organically vs. acquiring it. If build < buy, the bolt-on fails this dimension.",
          acceptanceParams: [
            { label: "Capability Matrix", defaultValue: "Platform capability gap analysis", type: "text" },
            { label: "Build vs Buy", defaultValue: "Acquisition must be faster/cheaper than organic build", type: "text" },
          ],
        },
        {
          name: "Geographic / Product Extension",
          weight: 20,
          rubric: [
            { score: 10, label: "Opens a new high-value geography or product line with proven demand from existing customers" },
            { score: 7, label: "Extends into adjacent geography/product with strong commercial rationale" },
            { score: 5, label: "Moderate extension — incremental geographic or product reach" },
            { score: 3, label: "Marginal extension with uncertain commercial value" },
            { score: 0, label: "No geographic or product extension — pure overlap" },
          ],
          testGuidance: "Assess whether this bolt-on gives the platform access to new markets or product lines. Map against the platform's expansion roadmap. Prioritize extensions where existing customers have expressed demand.",
          acceptanceParams: [
            { label: "New Markets", defaultValue: "Identify specific new geographies or product lines", type: "text" },
          ],
        },
      ],
      evidenceArtifacts: [
        { id: "synergy-summary", label: "Synergy Summary Memo" },
        { id: "capability-matrix", label: "Platform Capability Matrix" },
        { id: "cross-sell-model", label: "Cross-Sell Revenue Model" },
      ],
    },

    // ── G2: Market & Competitive Position ──────────────────────
    {
      code: "G2",
      name: "Market & Competitive Position",
      purpose: "Evaluate the bolt-on's market positioning and how it strengthens the platform's competitive moat.",
      type: "scored",
      minimumScore: 55,
      declineThreshold: 40,
      rule: "Weighted composite ≥55 to advance. Below 40 = auto-decline.",
      dimensions: [
        {
          name: "Market Growth Rate",
          weight: 25,
          rubric: [
            { score: 10, label: ">10% market CAGR with structural tailwinds (regulation, demographics, technology)" },
            { score: 7, label: "5–10% CAGR with clear growth drivers" },
            { score: 5, label: "GDP-level growth (2–5%) — stable but not accelerating" },
            { score: 3, label: "Flat to declining (<2%) with no visible catalysts" },
            { score: 0, label: "Secular decline with disruption risk" },
          ],
          testGuidance: "Source market growth from industry reports (IBIS, Frost & Sullivan, Gartner). Distinguish between total addressable market growth and the target's serviceable market. Structural tailwinds (regulatory mandate, technology shift) are more durable than cyclical growth.",
          acceptanceParams: [{ label: "Min Market CAGR", defaultValue: ">3% (GDP+)", type: "text" }],
        },
        {
          name: "Target Market Position",
          weight: 25,
          rubric: [
            { score: 10, label: "Top-3 player in defined market with defensible competitive advantage" },
            { score: 7, label: "Strong regional or niche position with loyal customer base" },
            { score: 5, label: "Mid-tier position — competitive but not differentiated" },
            { score: 3, label: "Commodity player with low switching costs" },
            { score: 0, label: "Declining market share with no path to differentiation" },
          ],
          testGuidance: "Assess market share, customer retention rates, pricing power, and brand recognition in the target's served market. Look for evidence of competitive advantage: proprietary technology, regulatory moats, customer lock-in, or scale economies.",
          acceptanceParams: [{ label: "Market Position", defaultValue: "Top-5 in served market", type: "text" }],
        },
        {
          name: "Platform Consolidation Fit",
          weight: 30,
          rubric: [
            { score: 10, label: "Acquisition creates category leadership or blocks key competitor from consolidating" },
            { score: 7, label: "Meaningfully improves platform's market position or competitive density" },
            { score: 5, label: "Incremental market share gain with moderate competitive impact" },
            { score: 3, label: "Minimal competitive impact — deal doesn't change market dynamics" },
            { score: 0, label: "Acquiring a competitor's distressed asset with no strategic benefit" },
          ],
          testGuidance: "How does this bolt-on change the competitive landscape? Does the combined entity reach critical mass in any market? Does it block a competitor from making the same acquisition? Score higher if the deal creates a competitive moat the platform didn't have before.",
          acceptanceParams: [{ label: "Combined Market Share", defaultValue: ">15% in served market post-acquisition", type: "text" }],
        },
        {
          name: "Competitive Intensity",
          weight: 20,
          rubric: [
            { score: 10, label: "Fragmented market with many small players — ideal for roll-up" },
            { score: 7, label: "Moderately fragmented with 2-3 large players and many small ones" },
            { score: 5, label: "Concentrated market with defined competitive lanes" },
            { score: 3, label: "Highly concentrated — limited room for new entrants" },
            { score: 0, label: "Oligopoly or monopoly — platform cannot meaningfully compete" },
          ],
          testGuidance: "Map the competitive landscape: how many players, what market share distribution, are competitors also consolidating? Fragmented markets are ideal for roll-up strategies. Concentrated markets make bolt-ons less impactful.",
          acceptanceParams: [{ label: "Fragmentation Level", defaultValue: "No single player >25% share", type: "text" }],
        },
      ],
      evidenceArtifacts: [
        { id: "market-assessment", label: "Market Assessment Brief" },
        { id: "competitive-landscape", label: "Competitive Landscape Map" },
      ],
    },

    // ── G3: Business Model Compatibility ───────────────────────
    {
      code: "G3",
      name: "Business Model Compatibility",
      purpose: "Assess how the bolt-on's business model integrates with the platform. Surface model conflicts, customer segment overlap, and integration sequencing risk.",
      type: "scored",
      minimumScore: 55,
      declineThreshold: 40,
      rule: "Weighted composite ≥55 to advance.",
      dimensions: [
        {
          name: "Revenue Model Compatibility",
          weight: 25,
          rubric: [
            { score: 10, label: "Identical revenue model — direct overlay with platform pricing and contracting" },
            { score: 7, label: "Compatible revenue model with minor differences in pricing/terms" },
            { score: 5, label: "Different but reconcilable models — 6-12 month harmonization" },
            { score: 3, label: "Conflicting revenue models requiring significant restructuring" },
            { score: 0, label: "Fundamentally incompatible — would cannibalize platform revenue" },
          ],
          testGuidance: "Compare revenue models side by side: contract vs. spot, subscription vs. project, recurring vs. one-time. Assess the effort to harmonize pricing across the combined entity. Watch for channel conflicts where both entities sell to the same customer through different models.",
          acceptanceParams: [{ label: "Revenue Model Overlap", defaultValue: ">60% model compatibility", type: "text" }],
        },
        {
          name: "Customer Segment Fit",
          weight: 25,
          rubric: [
            { score: 10, label: ">40% customer overlap — immediate cross-sell opportunity with shared accounts" },
            { score: 7, label: "20-40% overlap with similar buyer personas and procurement cycles" },
            { score: 5, label: "10-20% overlap — adjacent customer segments with some shared characteristics" },
            { score: 3, label: "<10% overlap — largely different customer bases" },
            { score: 0, label: "No overlap — completely different buyer profiles and procurement processes" },
          ],
          testGuidance: "Map customer lists. Identify named accounts that appear in both entities' top 50. Assess buyer personas: are the same decision-makers purchasing from both? Similar procurement cycles and contract structures reduce integration friction.",
          acceptanceParams: [{ label: "Customer Overlap", defaultValue: ">15% of top 50 accounts", type: "text" }],
        },
        {
          name: "Integration Sequencing",
          weight: 30,
          rubric: [
            { score: 10, label: "Bolt-on can be absorbed within current integration bandwidth with minimal disruption" },
            { score: 7, label: "Integration feasible but requires dedicated PM and 6-month runway" },
            { score: 5, label: "Complex integration requiring 12+ months — acceptable if synergies justify" },
            { score: 3, label: "Integration would strain current operations — risk of value destruction" },
            { score: 0, label: "Cannot integrate without disrupting active bolt-on integrations in progress" },
          ],
          testGuidance: "Assess the platform's current integration bandwidth. How many bolt-ons are in active integration? What is the PMO capacity? Scoring another bolt-on while 2-3 are in flight risks value destruction. Sequence matters: which bolt-on should be absorbed first?",
          acceptanceParams: [
            { label: "Active Integrations", defaultValue: "<3 bolt-ons in active integration", type: "text" },
            { label: "PMO Capacity", defaultValue: "Dedicated integration PM available", type: "text" },
          ],
        },
        {
          name: "Cost Structure Compatibility",
          weight: 20,
          rubric: [
            { score: 10, label: ">$2M identifiable cost synergies with clear elimination targets" },
            { score: 7, label: "$1-2M in cost synergies from shared services, procurement, or overhead" },
            { score: 5, label: "<$1M cost synergies — limited overlap in cost structure" },
            { score: 3, label: "No cost synergies — bolt-on operates with fundamentally different cost structure" },
            { score: 0, label: "Cost dissynergies — bolt-on would increase platform's cost base" },
          ],
          testGuidance: "Identify specific cost elimination opportunities: duplicate corporate overhead, shared procurement leverage, facility consolidation, technology platform rationalization. Be conservative — assume 50% realization rate on identified synergies.",
          acceptanceParams: [{ label: "Cost Synergy Target", defaultValue: ">$500K identified annual savings", type: "text" }],
        },
      ],
      evidenceArtifacts: [
        { id: "bmc-comparison", label: "Business Model Comparison" },
        { id: "integration-sequencing", label: "Integration Sequencing Assessment" },
        { id: "customer-overlap", label: "Customer Overlap Analysis" },
      ],
    },

    // ── G4: Financial Profile & Valuation ──────────────────────
    {
      code: "G4",
      name: "Financial Profile & Valuation",
      purpose: "Analyze the bolt-on's financial profile and assess valuation attractiveness including synergy-adjusted economics.",
      type: "scored",
      minimumScore: 55,
      declineThreshold: 35,
      rule: "Weighted composite ≥55 to advance. Below 35 = auto-decline.",
      dimensions: [
        {
          name: "Revenue Quality",
          weight: 20,
          rubric: [
            { score: 10, label: ">85% contracted/recurring revenue; <5% customer concentration; 3yr CAGR >10%" },
            { score: 7, label: "60-85% contracted; <15% concentration; stable or growing revenue" },
            { score: 5, label: "40-60% contracted; some concentration risk; flat revenue" },
            { score: 3, label: "<40% contracted; >25% customer concentration; declining trends" },
            { score: 0, label: "Mostly spot revenue; high customer concentration; revenue declining >10% YoY" },
          ],
          testGuidance: "Decompose revenue by contract type, customer, and tenure. Recurring/contracted revenue is more valuable. Customer concentration above 20% is a risk flag. Revenue trends over 3 years reveal the real trajectory.",
          acceptanceParams: [
            { label: "Min Contracted %", defaultValue: ">40% contracted or recurring", type: "text" },
            { label: "Max Customer Concentration", defaultValue: "<20% from any single customer", type: "text" },
          ],
        },
        {
          name: "Margin Profile",
          weight: 20,
          rubric: [
            { score: 10, label: ">25% EBITDA margin with margin expansion trend and clear operating leverage" },
            { score: 7, label: "18-25% EBITDA margin, stable, with identifiable improvement levers" },
            { score: 5, label: "12-18% EBITDA margin — acceptable for bolt-on if synergies improve it" },
            { score: 3, label: "8-12% EBITDA margin — below platform standard, heavy synergy dependency" },
            { score: 0, label: "<8% EBITDA margin or operating losses — distressed situation" },
          ],
          testGuidance: "Normalize EBITDA for owner compensation, one-time items, and above-market rents. Compare to platform margins — bolt-ons below platform margin should have a clear path to margin uplift through synergies or operational improvement.",
          acceptanceParams: [{ label: "Min EBITDA Margin", defaultValue: ">12% (normalized)", type: "text" }],
        },
        {
          name: "Valuation Attractiveness",
          weight: 25,
          rubric: [
            { score: 10, label: "<5x EBITDA — highly accretive to platform even without synergies" },
            { score: 7, label: "5-7x EBITDA — accretive with reasonable synergy assumptions" },
            { score: 5, label: "7-9x EBITDA — requires full synergy realization to be accretive" },
            { score: 3, label: "9-11x EBITDA — dilutive on standalone basis, requires premium synergies" },
            { score: 0, label: ">11x EBITDA — cannot be justified even with aggressive synergy assumptions" },
          ],
          testGuidance: "Compare the entry multiple to the platform's weighted average cost of acquisitions. Bolt-ons should be acquired at a multiple discount to the platform's aggregate valuation. Factor in synergy-adjusted effective multiple.",
          acceptanceParams: [
            { label: "Max Entry Multiple", defaultValue: "<8x trailing EBITDA", type: "text" },
            { label: "Platform Avg Multiple", defaultValue: "Reference platform's blended acquisition multiple", type: "text" },
          ],
        },
        {
          name: "Synergy-Adjusted Returns",
          weight: 25,
          rubric: [
            { score: 10, label: ">25% IRR and >3x MOIC on synergy case with conservative assumptions" },
            { score: 7, label: "20-25% IRR on synergy case; synergies represent <30% of total return" },
            { score: 5, label: "15-20% IRR on synergy case; synergies critical to meeting hurdle" },
            { score: 3, label: "12-15% IRR — below hurdle rate; requires optimistic synergy assumptions" },
            { score: 0, label: "<12% IRR even with full synergy realization" },
          ],
          testGuidance: "Build base case (standalone) and synergy case (with identified revenue and cost synergies). Returns should clear the fund's hurdle rate on the base case or be very close. Synergy case provides upside. Flag if >50% of returns depend on synergy realization.",
          acceptanceParams: [
            { label: "Base Case IRR", defaultValue: ">15%", type: "text" },
            { label: "Synergy Case IRR", defaultValue: ">20%", type: "text" },
          ],
        },
        {
          name: "Growth Profile",
          weight: 10,
          rubric: [
            { score: 10, label: ">15% revenue CAGR with organic growth drivers post-integration" },
            { score: 7, label: "8-15% revenue CAGR with platform-enabled growth acceleration" },
            { score: 5, label: "3-8% organic growth — stable but not accelerating" },
            { score: 3, label: "Flat revenue with growth dependent entirely on platform cross-sell" },
            { score: 0, label: "Declining revenue with no clear path to stabilization" },
          ],
          testGuidance: "Separate organic growth from platform-enabled growth. Organic growth indicates a healthy standalone business. Platform-enabled growth (cross-sell, geographic expansion) is a bonus. Flag if the bolt-on has no standalone growth and all upside depends on integration.",
          acceptanceParams: [{ label: "Min Revenue CAGR", defaultValue: ">3% organic", type: "text" }],
        },
      ],
      evidenceArtifacts: [
        { id: "financial-summary", label: "Preliminary Financial Summary" },
        { id: "synergy-model", label: "Synergy Model" },
        { id: "returns-analysis", label: "Returns Analysis (Base + Synergy Case)" },
        { id: "valuation-range", label: "Valuation Range Analysis" },
      ],
    },

    // ── G5: Integration & Synergy Capture ──────────────────────
    {
      code: "G5",
      name: "Integration & Synergy Capture",
      purpose: "Assess the platform's ability to integrate this bolt-on and capture identified synergies within the planned timeline.",
      type: "scored",
      minimumScore: 65,
      declineThreshold: 45,
      rule: "Weighted composite ≥65 to advance. Integration risk is the #1 value destroyer in bolt-on strategies.",
      dimensions: [
        {
          name: "Systems Integration",
          weight: 20,
          rubric: [
            { score: 10, label: "Target runs compatible systems; integration can be completed in <90 days with existing playbook" },
            { score: 7, label: "Systems are different but migration path is proven from prior bolt-ons" },
            { score: 5, label: "Systems migration required; 6-12 month timeline with dedicated IT resources" },
            { score: 3, label: "Significant systems incompatibility; 12+ month migration with material risk" },
            { score: 0, label: "Legacy systems with no migration path; parallel systems required indefinitely" },
          ],
          testGuidance: "Map the target's technology stack against the platform's. ERP, CRM, HR systems, industry-specific software. How many prior bolt-on system migrations has the platform completed? Proven playbooks reduce risk significantly.",
          acceptanceParams: [{ label: "ERP System", defaultValue: "Identify target ERP and platform ERP", type: "text" }],
        },
        {
          name: "Operational Absorption",
          weight: 25,
          rubric: [
            { score: 10, label: "Bolt-on can be absorbed into existing operational framework with minimal disruption" },
            { score: 7, label: "Operations largely compatible; requires process harmonization over 6 months" },
            { score: 5, label: "Significant operational differences requiring dedicated change management" },
            { score: 3, label: "Operations conflict with platform standards; requires major restructuring" },
            { score: 0, label: "Cannot absorb without fundamentally changing platform or bolt-on operations" },
          ],
          testGuidance: "Assess operational compatibility: quality standards, safety protocols, compliance frameworks, reporting cadence, customer service levels. Each operational dimension that differs is a cost center during integration.",
          acceptanceParams: [{ label: "Integration Timeline", defaultValue: "<12 months to full operational absorption", type: "text" }],
        },
        {
          name: "Synergy Capture Plan",
          weight: 30,
          rubric: [
            { score: 10, label: "Detailed 100-day plan with named owners, milestones, and synergy tracking for >80% of identified synergies" },
            { score: 7, label: "Clear plan for 60-80% of synergies with realistic timelines and accountable owners" },
            { score: 5, label: "High-level synergy roadmap; specific workstreams identified but not yet staffed" },
            { score: 3, label: "Synergies identified but no capture plan; execution risk is high" },
            { score: 0, label: "No synergy capture plan; identified synergies are aspirational only" },
          ],
          testGuidance: "Review the synergy capture plan in detail. Each synergy line item should have: a dollar value, a timeline, a responsible owner, and specific actions required. Plans without named owners are aspirational. Track record from prior bolt-on synergy capture is the best predictor.",
          acceptanceParams: [
            { label: "100-Day Plan", defaultValue: "Detailed integration plan with milestones", type: "text" },
            { label: "Synergy Tracking", defaultValue: "Monthly synergy realization reporting", type: "text" },
          ],
        },
        {
          name: "Founder Transition",
          weight: 25,
          rubric: [
            { score: 10, label: "Founder has accepted transition terms; successor identified and capable; knowledge transfer plan in place" },
            { score: 7, label: "Founder willing to stay 2-3 years; internal successor developing; earnout aligns incentives" },
            { score: 5, label: "Founder transition is 12-18 months; successor not yet identified but bench exists" },
            { score: 3, label: "Founder wants clean exit; no successor; significant institutional knowledge risk" },
            { score: 0, label: "Founder is hostile to integration; key relationships at risk of departure" },
          ],
          testGuidance: "Most bolt-on value destruction comes from founder exit too early. Assess: founder's motivation, willingness to stay, quality of #2/#3 leadership, customer relationships that are founder-dependent, and earnout structure alignment.",
          acceptanceParams: [
            { label: "Founder Commitment", defaultValue: "Minimum 2-year employment agreement", type: "text" },
            { label: "Earnout Structure", defaultValue: "Tied to synergy milestones, not just revenue", type: "text" },
          ],
        },
      ],
      evidenceArtifacts: [
        { id: "integration-plan", label: "100-Day Integration Plan" },
        { id: "synergy-tracker", label: "Synergy Tracking Framework" },
        { id: "systems-assessment", label: "Systems Architecture Comparison" },
        { id: "founder-transition", label: "Founder Transition & Retention Plan" },
      ],
    },

    // ── G6: Risk Assessment ────────────────────────────────────
    {
      code: "G6",
      name: "Risk Assessment",
      purpose: "Systematically identify and quantify material risks specific to bolt-on acquisitions.",
      type: "scored",
      minimumScore: 55,
      declineThreshold: 35,
      rule: "Weighted composite ≥55. Below 35 = auto-decline.",
      dimensions: [
        {
          name: "Key Person Risk",
          weight: 25,
          rubric: [
            { score: 10, label: "No single person critical; distributed knowledge; strong bench depth" },
            { score: 7, label: "Founder is important but #2/#3 can operate independently" },
            { score: 5, label: "Founder-dependent for key relationships but operations can continue" },
            { score: 3, label: "Founder critical for 30%+ of revenue relationships; high departure risk" },
            { score: 0, label: "Founder IS the business; departure would destroy >50% of value" },
          ],
          testGuidance: "Identify every individual whose departure would materially impact the business. For each, assess: revenue impact, relationship ownership, operational knowledge, and replacement difficulty. Score based on the highest-risk individual.",
          acceptanceParams: [{ label: "Key Person Dependency", defaultValue: "<25% revenue tied to any single person", type: "text" }],
        },
        {
          name: "Customer Concentration",
          weight: 25,
          rubric: [
            { score: 10, label: "Top customer <10% of revenue; diversified base with no concentration risk" },
            { score: 7, label: "Top customer 10-15%; manageable with contractual protections" },
            { score: 5, label: "Top customer 15-25%; requires COC consent and retention strategy" },
            { score: 3, label: "Top customer 25-40%; single customer loss would materially impair value" },
            { score: 0, label: "Top customer >40%; existential concentration risk" },
          ],
          testGuidance: "Map revenue by customer and assess change-of-control risk for top 10 accounts. Do contracts have COC clauses? Are relationships with the bolt-on or with specific people? What's the switching cost for each major customer?",
          acceptanceParams: [{ label: "Max Concentration", defaultValue: "No single customer >20%", type: "text" }],
        },
        {
          name: "Founder Transition Risk",
          weight: 25,
          rubric: [
            { score: 10, label: "Founder fully aligned on transition; earnout well-structured; knowledge documented" },
            { score: 7, label: "Founder cooperative; earnout covers transition period; key knowledge transferable" },
            { score: 5, label: "Founder has mixed motivation; some knowledge transfer risk" },
            { score: 3, label: "Founder eager to exit quickly; significant institutional knowledge at risk" },
            { score: 0, label: "Founder adversarial or checked-out; institutional knowledge will be lost" },
          ],
          testGuidance: "Distinct from G5 Founder Transition (which assesses the plan). This dimension assesses the risk that the transition fails despite the plan. Look at: founder's financial situation post-close, competing interests, personal health, relationship with acquirer's team.",
          acceptanceParams: [{ label: "Transition Risk Level", defaultValue: "Moderate or below", type: "text" }],
        },
        {
          name: "Legal & Regulatory",
          weight: 15,
          rubric: [
            { score: 10, label: "Clean legal profile; no material litigation; all permits transferable" },
            { score: 7, label: "Minor legal matters; permits transfer with standard process" },
            { score: 5, label: "Some legal complexity; permit transfer requires regulatory approval" },
            { score: 3, label: "Material litigation or regulatory issues; timeline risk to close" },
            { score: 0, label: "Fatal legal flag — unresolvable litigation or non-transferable permits" },
          ],
          testGuidance: "Review legal diligence: pending/threatened litigation, regulatory compliance history, environmental liabilities, permit transferability, IP ownership, employment disputes. Any fatal flag should be escalated immediately.",
          acceptanceParams: [{ label: "Legal Diligence", defaultValue: "No material unresolved litigation", type: "text" }],
        },
        {
          name: "Cultural Compatibility",
          weight: 10,
          rubric: [
            { score: 10, label: "Strong cultural alignment; employees enthusiastic about joining platform" },
            { score: 7, label: "Compatible cultures; normal integration friction expected" },
            { score: 5, label: "Cultural differences present but manageable with change management" },
            { score: 3, label: "Significant cultural friction; retention risk for key talent" },
            { score: 0, label: "Hostile or incompatible culture; high turnover risk post-close" },
          ],
          testGuidance: "Assess cultural fit through management meetings, site visits, and employee sentiment (if accessible). Key indicators: formality level, decision-making speed, risk tolerance, customer orientation, quality standards.",
          acceptanceParams: [{ label: "Culture Assessment", defaultValue: "Management site visit completed", type: "text" }],
        },
      ],
      evidenceArtifacts: [
        { id: "risk-register", label: "Risk Register" },
        { id: "legal-summary", label: "Legal Flag Summary" },
        { id: "retention-analysis", label: "Customer Retention Analysis" },
      ],
    },

    // ── G7: Portfolio Value Creation Decision ──────────────────
    {
      code: "G7",
      name: "Portfolio Value Creation Decision",
      purpose: "Synthesize all gate outputs into a portfolio-level recommendation. Assess accretion to the total platform, not just standalone deal economics.",
      type: "decision",
      minimumScore: null,
      declineThreshold: null,
      rule: "Composite ≥65 = ACQUIRE; 50–64 = CONDITIONAL (specify conditions); <50 = PASS. IC requires dual authorization.",
      dimensions: [
        {
          name: "Strategic Attractiveness",
          weight: 25,
          rubric: [
            { score: 10, label: "Must-have bolt-on that transforms the platform's competitive position" },
            { score: 7, label: "Strong strategic addition that clearly advances the platform thesis" },
            { score: 5, label: "Acceptable strategic fit — good but not transformative" },
            { score: 3, label: "Marginal strategic value — deal economics must compensate" },
            { score: 0, label: "No strategic value to the platform" },
          ],
          testGuidance: "Synthesize G1 (alignment), G2 (market position), and G3 (compatibility) into an overall strategic assessment. Would you do this deal if there were zero cost synergies?",
          acceptanceParams: [],
        },
        {
          name: "Financial Attractiveness",
          weight: 25,
          rubric: [
            { score: 10, label: "Highly accretive on all metrics: IRR >25%, multiple below platform average, immediate margin uplift" },
            { score: 7, label: "Accretive on synergy case with reasonable risk-adjusted returns" },
            { score: 5, label: "Breakeven to modestly accretive — acceptable if strategic value is high" },
            { score: 3, label: "Dilutive on standalone; requires aggressive synergy assumptions" },
            { score: 0, label: "Value destructive — negative ROI even with full synergy realization" },
          ],
          testGuidance: "Synthesize G4 financial analysis. What happens to the platform's aggregate multiple, EBITDA, and growth rate if this bolt-on is added? Is it accretive or dilutive to the portfolio?",
          acceptanceParams: [],
        },
        {
          name: "Integration Feasibility",
          weight: 25,
          rubric: [
            { score: 10, label: "Proven integration playbook applies; team has bandwidth; synergy capture is high-confidence" },
            { score: 7, label: "Integration plan is solid with manageable risks; team can absorb" },
            { score: 5, label: "Integration is doable but stretches current bandwidth" },
            { score: 3, label: "Integration risk is material; team is already stretched" },
            { score: 0, label: "Cannot integrate without derailing existing integrations" },
          ],
          testGuidance: "Synthesize G5 (integration) and current platform integration bandwidth. Does the team have capacity? Is the 100-day plan credible? What's the track record on prior bolt-on synergy capture?",
          acceptanceParams: [],
        },
        {
          name: "Portfolio Value Creation",
          weight: 25,
          rubric: [
            { score: 10, label: "Deal transforms the platform — creates category leadership, opens major new revenue streams" },
            { score: 7, label: "Clear portfolio value creation through synergies, market position, and capability addition" },
            { score: 5, label: "Modest portfolio value — additive but not transformative" },
            { score: 3, label: "Uncertain portfolio impact — deal economics rely on execution" },
            { score: 0, label: "Negative portfolio impact — distracts management, dilutes focus" },
          ],
          testGuidance: "Step back and assess: does this bolt-on make the platform more valuable to the next buyer? Does it strengthen the equity story? Would you present this acquisition to LPs as evidence of disciplined execution?",
          acceptanceParams: [],
        },
      ],
      evidenceArtifacts: [
        { id: "ic-memo", label: "IC Memo (Final)" },
        { id: "composite-scorecard", label: "Composite Scorecard (G0–G7)" },
        { id: "accretion-analysis", label: "Portfolio Accretion Analysis" },
        { id: "sensitivity", label: "Sensitivity Analysis (IRR/MOIC)" },
      ],
    },
  ],
};

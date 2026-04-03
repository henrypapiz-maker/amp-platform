// ═══════════════════════════════════════════════════════════════
// AMP v2 — Search Fund Template
//
// Complete methodology for independent searchers evaluating a
// single acquisition target with self-funded or SBA-backed
// financing. Radically different from PE Platform Build:
//
// - Single-deal evaluation (not portfolio construction)
// - Operator-market fit replaces strategic alignment
// - SBA eligibility gates added
// - Founder transition is the #1 integration dimension
// - No exit modeling — focus on cash flow and debt service
// - Personal investment decision framework at G7
// ═══════════════════════════════════════════════════════════════

export interface SearchFundGateConfig {
  code: string;
  name: string;
  purpose: string;
  type: "binary" | "scored" | "decision";
  minimumScore: number | null;
  declineThreshold: number | null;
  rule: string;
  dimensions: Array<{
    name: string;
    weight: number;
    rubric: Array<{ score: number; label: string }>;
    testGuidance: string;
    acceptanceParams: Array<{ label: string; defaultValue: string; type: string }>;
  }>;
  evidenceArtifacts: Array<{ id: string; label: string }>;
}

export const SEARCH_FUND_GATES: SearchFundGateConfig[] = [
  // ── G0: Universe Qualification (Search Fund) ────────────
  {
    code: "G0",
    name: "Search Qualification",
    purpose: "Hard filter for search fund criteria: SBA eligibility, owner willingness, and operator-accessible industry.",
    type: "binary",
    minimumScore: null,
    declineThreshold: null,
    rule: "ALL dimensions must pass. Any fail = remove from search pipeline.",
    dimensions: [
      {
        name: "Size & SBA Eligibility",
        weight: 25,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Verify the target meets SBA 7(a) acquisition loan criteria: business must be a for-profit operating business in the US, transaction size within SBA limits, and the business must demonstrate ability to service debt from cash flow. Check NAICS code eligibility and size standards.",
        acceptanceParams: [
          { label: "Revenue Range", defaultValue: "$1M\u2013$10M", type: "text" },
          { label: "EBITDA Range", defaultValue: "$500K\u2013$3M (SDE preferred)", type: "text" },
          { label: "SBA Size Standard", defaultValue: "Per NAICS code lookup", type: "text" },
          { label: "Max Loan Amount", defaultValue: "$5M (SBA 7a standard)", type: "text" },
        ],
      },
      {
        name: "Owner Willingness & Transition",
        weight: 30,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Confirm the owner is genuinely willing to sell and provide reasonable transition support. Assess motivation: retirement, health, lifestyle change, or partner dispute (some motivations create better transitions than others). Verify there is no expectation of continued ownership or control post-close.",
        acceptanceParams: [
          { label: "Seller Motivation", defaultValue: "Retirement, lifestyle, or succession gap preferred", type: "text" },
          { label: "Transition Period", defaultValue: "Minimum 6 months consulting agreement", type: "text" },
          { label: "Seller Financing", defaultValue: "10\u201320% seller note preferred", type: "text" },
        ],
      },
      {
        name: "Industry Accessibility",
        weight: 25,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Can a new operator credibly learn this industry within 6\u201312 months? Assess: regulatory barriers (licensing, certifications), technical complexity, customer relationship dependency, and industry-specific knowledge requirements. Disqualify industries where a new operator would take 2+ years to reach baseline competence.",
        acceptanceParams: [
          { label: "Licensing Required", defaultValue: "Document any required licenses/certifications", type: "text" },
          { label: "Ramp Time", defaultValue: "< 12 months to operational competence", type: "text" },
          { label: "Excluded Industries", defaultValue: "Highly regulated (healthcare, financial services) unless searcher has background", type: "list" },
        ],
      },
      {
        name: "Geography & Lifestyle Fit",
        weight: 20,
        rubric: [{ score: 1, label: "Pass" }, { score: 0, label: "Fail" }],
        testGuidance: "Search fund acquisitions are personal \u2014 you'll be running this business daily. Verify the location works for your life: commute distance, relocation requirements, travel demands. A great business in an impossible location is not a great deal for a searcher.",
        acceptanceParams: [
          { label: "Max Commute", defaultValue: "Define acceptable commute or relocation", type: "text" },
          { label: "Travel Requirements", defaultValue: "< 25% travel preferred", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "sf-g0-screen", label: "Search Qualification Scorecard" },
      { id: "sf-g0-sba", label: "SBA Eligibility Checklist" },
      { id: "sf-g0-seller", label: "Seller Conversation Notes" },
    ],
  },

  // ── G1: Operator-Market Fit (replaces Strategic Alignment) ──
  {
    code: "G1",
    name: "Operator-Market Fit",
    purpose: "Assess whether YOU can credibly operate this business. Not strategic alignment \u2014 personal alignment.",
    type: "scored",
    minimumScore: 60,
    declineThreshold: 40,
    rule: "Minimum composite 60/100. Below 40 = walk away. Be honest with yourself.",
    dimensions: [
      {
        name: "Skill-Business Match",
        weight: 30,
        rubric: [
          { score: 10, label: "Your core skills are the exact skills this business needs most" },
          { score: 7, label: "Strong overlap; your skills address the business's primary gaps" },
          { score: 5, label: "Moderate match; you can contribute but need to develop new competencies" },
          { score: 3, label: "Limited overlap; significant skill gaps in core operating areas" },
          { score: 0, label: "No relevant skills; you'd be learning everything from scratch" },
        ],
        testGuidance: "Map your professional skills against the business's operational needs. Where are the biggest leverage points \u2014 sales, operations, finance, technology? Do your strengths address those? Be brutally honest: MBA knowledge and consulting skills are not the same as industry operating experience.",
        acceptanceParams: [
          { label: "Top 3 Skills", defaultValue: "List your 3 strongest professional skills", type: "text" },
          { label: "Business Needs", defaultValue: "List the 3 most critical operator skills for this business", type: "text" },
        ],
      },
      {
        name: "Industry Affinity",
        weight: 25,
        rubric: [
          { score: 10, label: "Deep domain expertise or adjacent experience; genuine passion for the industry" },
          { score: 7, label: "Adjacent experience; strong curiosity and demonstrated ability to learn" },
          { score: 5, label: "No direct experience but transferable knowledge; willing to immerse" },
          { score: 3, label: "Limited interest or understanding; primarily a financial play" },
          { score: 0, label: "No affinity; would dread the day-to-day reality of this industry" },
        ],
        testGuidance: "Can you see yourself immersed in this industry for 10+ years? Search fund acquisitions are not 5-year holds \u2014 you're building a career. Assess whether the industry's daily reality (customers, problems, culture) energizes or drains you. Talk to 3\u20135 people who work in this industry and assess your reaction.",
        acceptanceParams: [
          { label: "Industry Conversations", defaultValue: "Talk to 3\u20135 industry insiders", type: "text" },
          { label: "Energy Test", defaultValue: "Does discussing this industry energize you?", type: "text" },
        ],
      },
      {
        name: "Value Creation Thesis",
        weight: 25,
        rubric: [
          { score: 10, label: "Clear, specific, actionable value creation plan with 3+ identified levers" },
          { score: 7, label: "Solid thesis with 2 specific levers you can personally execute" },
          { score: 5, label: "General thesis (e.g., 'professionalize operations') without specific levers" },
          { score: 3, label: "Vague thesis; relying on the business continuing as-is under new ownership" },
          { score: 0, label: "No value creation thesis; purely a cash-flow play" },
        ],
        testGuidance: "What specifically will you do differently than the current owner? Not generalities \u2014 specific actions. 'Implement a CRM' is specific. 'Professionalize the business' is not. Your value creation thesis should leverage your personal skills and be executable in the first 12 months.",
        acceptanceParams: [
          { label: "Lever Count", defaultValue: "At least 2 specific, measurable value creation levers", type: "text" },
          { label: "Year 1 Priority", defaultValue: "What's the #1 thing you do in months 1\u20136?", type: "text" },
        ],
      },
      {
        name: "Support Network",
        weight: 20,
        rubric: [
          { score: 10, label: "Active board/advisory group with relevant operating experience; committed mentors" },
          { score: 7, label: "2\u20133 advisors with industry or SMB operating experience" },
          { score: 5, label: "General business advisors; no industry-specific guidance" },
          { score: 3, label: "Limited advisory network; would be operating largely alone" },
          { score: 0, label: "No support network; no one to call when things go wrong" },
        ],
        testGuidance: "You will face problems you've never seen before. Who will you call? Assess your advisory board, search fund investor network, peer group, and industry contacts. The best search fund operators have 2\u20133 people they can call at 9pm on a Friday when something breaks.",
        acceptanceParams: [
          { label: "Board/Advisors", defaultValue: "Name your top 3 advisors and their relevant experience", type: "text" },
          { label: "Peer Network", defaultValue: "Search fund community, ETA peers, industry contacts", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "sf-g1-skills", label: "Skill-Business Match Assessment" },
      { id: "sf-g1-thesis", label: "Value Creation Thesis Document" },
      { id: "sf-g1-advisory", label: "Advisory Board / Mentor List" },
    ],
  },

  // ── G4: Financial Profile (Search Fund variant) ─────────
  {
    code: "G4",
    name: "Financial Profile & Debt Service",
    purpose: "Assess financial health with focus on cash flow durability and debt service coverage \u2014 not exit modeling.",
    type: "scored",
    minimumScore: 60,
    declineThreshold: 40,
    rule: "DSCR must exceed 1.25x under stress. Composite minimum 60/100. No exit assumptions \u2014 this is a perpetual hold underwriting.",
    dimensions: [
      {
        name: "Cash Flow Durability",
        weight: 30,
        rubric: [
          { score: 10, label: "Stable, predictable cash flows for 5+ years; low cyclicality; strong customer retention" },
          { score: 7, label: "Generally stable with some seasonal variation; 3+ years of consistent CF" },
          { score: 5, label: "Moderate cash flow variability; some project dependency; backlog provides visibility" },
          { score: 3, label: "Volatile cash flows; significant project or customer dependency" },
          { score: 0, label: "Unpredictable cash flows; high risk of inability to service debt" },
        ],
        testGuidance: "You're borrowing money to buy this business. The cash flow must service the debt reliably. Analyze monthly cash flow patterns for 3 years. Identify the lowest cash flow month \u2014 can you still make the debt payment? Factor in your salary draw. This is the most important dimension for a search fund deal.",
        acceptanceParams: [
          { label: "Min DSCR", defaultValue: "1.25x under stress scenario", type: "text" },
          { label: "Salary Draw", defaultValue: "Include $150K\u2013$250K owner comp in analysis", type: "text" },
          { label: "Cash Flow History", defaultValue: "3 years monthly cash flow required", type: "text" },
        ],
      },
      {
        name: "SDE / Adjusted Earnings",
        weight: 25,
        rubric: [
          { score: 10, label: "SDE >$1M; clean add-backs; minimal adjustments; audited or reviewed financials" },
          { score: 7, label: "SDE $500K\u2013$1M; reasonable add-backs with documentation" },
          { score: 5, label: "SDE $300K\u2013$500K; significant add-backs requiring judgment" },
          { score: 3, label: "SDE <$300K; or add-backs are aggressive / poorly documented" },
          { score: 0, label: "SDE unclear; financials unreliable; can't determine true earnings" },
        ],
        testGuidance: "SDE (Seller's Discretionary Earnings) is the key metric for search fund deals. Calculate: Net Income + Owner Compensation + Interest + Depreciation + Amortization + One-Time Items. Every add-back must be justified and documented. Aggressive add-backs are the #1 source of search fund deal failures.",
        acceptanceParams: [
          { label: "Min SDE", defaultValue: "$400K (after your salary draw)", type: "text" },
          { label: "Add-Back Documentation", defaultValue: "Every add-back must have supporting evidence", type: "text" },
        ],
      },
      {
        name: "Deal Structure & Financing",
        weight: 25,
        rubric: [
          { score: 10, label: "SBA pre-qualified; seller note 15\u201320%; total leverage <3.5x SDE; clear path to close" },
          { score: 7, label: "SBA likely; seller note negotiable; leverage 3.5\u20134x; manageable structure" },
          { score: 5, label: "Financing uncertain; may need creative structure; leverage 4\u20134.5x" },
          { score: 3, label: "SBA unlikely; requires significant equity raise or seller financing >30%" },
          { score: 0, label: "No viable financing path; deal structure doesn't work" },
        ],
        testGuidance: "Map the capital stack: SBA 7(a) loan, seller note, equity (your capital + investors). Total should equal the asking price plus working capital and closing costs. The key constraint is debt service \u2014 can the business generate enough cash to pay the SBA loan, the seller note, AND your salary?",
        acceptanceParams: [
          { label: "Max Leverage", defaultValue: "< 4x SDE total debt", type: "text" },
          { label: "SBA Loan Terms", defaultValue: "10-year term, ~10% rate, full amortization", type: "text" },
          { label: "Seller Note", defaultValue: "10\u201320% of purchase price; 2-year standby", type: "text" },
          { label: "Equity Required", defaultValue: "10\u201320% of total capital stack", type: "text" },
        ],
      },
      {
        name: "Valuation Reasonableness",
        weight: 20,
        rubric: [
          { score: 10, label: "Asking <3x SDE; below market comps; significant margin of safety" },
          { score: 7, label: "Asking 3\u20134x SDE; in line with market for this quality/size" },
          { score: 5, label: "Asking 4\u20135x SDE; requires negotiation or strong growth thesis to justify" },
          { score: 3, label: "Asking >5x SDE; overpriced for a search fund structure" },
          { score: 0, label: "Asking price is disconnected from financial reality; seller expectations unrealistic" },
        ],
        testGuidance: "Search fund deals typically trade at 3\u20135x SDE depending on size, quality, and industry. Higher multiples require higher-quality cash flows and stronger growth profiles. Compare the asking multiple to BizBuySell/DealStats transaction data for this size and sector. Remember: you're not modeling an exit \u2014 you need to earn a return from cash flow, not multiple expansion.",
        acceptanceParams: [
          { label: "Target Multiple", defaultValue: "3\u20134x SDE preferred", type: "text" },
          { label: "Comp Source", defaultValue: "BizBuySell, DealStats, or broker data", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "sf-g4-sde", label: "SDE Calculation & Add-Back Schedule" },
      { id: "sf-g4-cashflow", label: "Monthly Cash Flow Analysis (3 years)" },
      { id: "sf-g4-structure", label: "Deal Structure & Financing Term Sheet" },
      { id: "sf-g4-dscr", label: "Debt Service Coverage Analysis" },
    ],
  },

  // ── G5: Transition & Integration (Search Fund) ──────────
  {
    code: "G5",
    name: "Founder Transition & Operations",
    purpose: "Assess whether the business can survive the ownership transition. This is the highest-risk gate for search fund deals.",
    type: "scored",
    minimumScore: 55,
    declineThreshold: null,
    rule: "Founder transition plan must be documented and agreed. Composite minimum 55/100.",
    dimensions: [
      {
        name: "Founder Knowledge Transfer",
        weight: 35,
        rubric: [
          { score: 10, label: "Documented processes; trained #2 for all critical functions; founder expendable within 3 months" },
          { score: 7, label: "Key processes documented; founder available 6+ months; clear transfer plan" },
          { score: 5, label: "Some documentation; founder needed 12+ months; tribal knowledge exists but is transferable" },
          { score: 3, label: "Minimal documentation; founder is the business; transfer plan is vague" },
          { score: 0, label: "All knowledge in founder's head; no documentation; business cannot function without founder" },
        ],
        testGuidance: "This is make-or-break for search fund deals. Assess: What does the founder do every day? Which of those tasks require their specific relationships, knowledge, or skills? Can those be transferred to you or existing employees? Build a week-by-week transition plan for the first 6 months. If you can't articulate how you'll handle every critical function by month 6, the transition risk is too high.",
        acceptanceParams: [
          { label: "Transition Plan", defaultValue: "Week-by-week plan for months 1\u20136 required", type: "text" },
          { label: "Consulting Agreement", defaultValue: "Minimum 6 months; 12 preferred", type: "text" },
          { label: "Documentation Audit", defaultValue: "Score: % of critical processes documented", type: "text" },
        ],
      },
      {
        name: "Employee Retention Risk",
        weight: 25,
        rubric: [
          { score: 10, label: "Stable team; clear roles; team enthusiastic about growth under new ownership" },
          { score: 7, label: "Key employees identified and retainable; team aware of transition" },
          { score: 5, label: "Some retention risk; 1\u20132 key employees uncertain; team not yet informed" },
          { score: 3, label: "High retention risk; key employees loyal to founder personally" },
          { score: 0, label: "Team will likely leave; business is the founder's personal operation" },
        ],
        testGuidance: "Employees often follow the founder, not the company \u2014 especially in small businesses. Identify the 3\u20135 most critical employees. Would they stay if the founder left? Do they have non-competes? Are they compensated fairly? What would retention bonuses cost? Meet key employees before closing if possible.",
        acceptanceParams: [
          { label: "Key Employees", defaultValue: "Identify and assess retention for top 3\u20135", type: "text" },
          { label: "Retention Budget", defaultValue: "Budget for retention bonuses if needed", type: "text" },
        ],
      },
      {
        name: "Day-1 Operator Readiness",
        weight: 25,
        rubric: [
          { score: 10, label: "Comprehensive Day 1 plan; all systems access; customer/vendor introductions scheduled" },
          { score: 7, label: "Solid Day 1 plan; key handoffs identified; manageable gaps" },
          { score: 5, label: "Basic plan exists; some uncertainty about customer transitions" },
          { score: 3, label: "Minimal preparation; will be learning on the job from day 1" },
          { score: 0, label: "No Day 1 plan; would be walking in blind" },
        ],
        testGuidance: "On Day 1 after closing, you are the CEO. What does your first week look like? Can you: run payroll, pay vendors, respond to customer issues, make production decisions, access all bank accounts and systems? Build a literal hour-by-hour plan for your first 3 days. Gaps in this plan are gaps in your transition planning.",
        acceptanceParams: [
          { label: "Day 1 Checklist", defaultValue: "System access, vendor contacts, customer intros, payroll, banking", type: "text" },
          { label: "Week 1 Schedule", defaultValue: "Hour-by-hour plan for first 3 days minimum", type: "text" },
        ],
      },
      {
        name: "Customer Relationship Transferability",
        weight: 15,
        rubric: [
          { score: 10, label: "Customers buy the product/service; founder relationships are nice-to-have, not critical" },
          { score: 7, label: "Most customers are contract-based; founder does relationship management but isn't the sole reason they buy" },
          { score: 5, label: "Founder relationships matter for top 20% of customers; transition plan needed" },
          { score: 3, label: "Founder is the primary sales relationship for >50% of revenue" },
          { score: 0, label: "Customers buy from the founder personally; would not stay with a new owner" },
        ],
        testGuidance: "Ask the founder: 'If you introduced me to your top 10 customers and told them you were retiring, what % would stay?' If the honest answer is less than 80%, customer transition is a material risk. Plan for a joint introduction period where the founder brings you into key relationships before fully stepping back.",
        acceptanceParams: [
          { label: "Retention Estimate", defaultValue: ">80% of revenue retained through transition", type: "text" },
          { label: "Joint Introduction Period", defaultValue: "3\u20136 months of co-visits to top 20 customers", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "sf-g5-transition", label: "Founder Transition Plan (week-by-week)" },
      { id: "sf-g5-day1", label: "Day 1 Operator Readiness Checklist" },
      { id: "sf-g5-employees", label: "Key Employee Assessment & Retention Plan" },
      { id: "sf-g5-customers", label: "Customer Relationship Transfer Plan" },
    ],
  },

  // ── G7: Personal Investment Decision (Search Fund) ──────
  {
    code: "G7",
    name: "Personal Investment Decision",
    purpose: "This is YOUR money and YOUR career. Synthesize everything into a personal go/no-go decision.",
    type: "decision",
    minimumScore: 65,
    declineThreshold: 50,
    rule: "\u226565 = ACQUIRE. 50\u201364 = CONDITIONAL (resolve specific issues before proceeding). <50 = WALK AWAY.",
    dimensions: [
      {
        name: "Risk-Adjusted Personal Return",
        weight: 30,
        rubric: [
          { score: 10, label: "Cash-on-cash return >30% in year 3; debt paid down significantly; personal wealth building rapidly" },
          { score: 7, label: "Cash-on-cash 20\u201330%; debt service comfortable; building equity steadily" },
          { score: 5, label: "Cash-on-cash 10\u201320%; tight but workable; limited margin for error" },
          { score: 3, label: "Cash-on-cash <10%; debt service is stressful; one bad quarter is a crisis" },
          { score: 0, label: "Returns don't justify the personal risk; better opportunities exist" },
        ],
        testGuidance: "Unlike PE, your return is not IRR on a fund \u2014 it's your personal income, equity building, and career trajectory. Calculate: What's your total annual compensation (salary + distributions) in years 1, 3, and 5? How does that compare to your alternative (staying in your current career)? Factor in the risk premium: you're putting your savings at risk and giving up a salary for months during the search and transition.",
        acceptanceParams: [
          { label: "Opportunity Cost", defaultValue: "Compare to current career earnings trajectory", type: "text" },
          { label: "Personal Capital at Risk", defaultValue: "Max you can afford to lose without financial distress", type: "text" },
        ],
      },
      {
        name: "Lifestyle & Fulfillment Fit",
        weight: 25,
        rubric: [
          { score: 10, label: "You are genuinely excited to run this business every day for the next decade" },
          { score: 7, label: "Good fit overall; daily reality is appealing; some aspects you'd tolerate" },
          { score: 5, label: "Acceptable; you could do this but it's a means to an end, not a calling" },
          { score: 3, label: "Significant lifestyle concerns; daily reality would be a grind" },
          { score: 0, label: "You would dread Monday mornings running this business" },
        ],
        testGuidance: "Spend a full day at the business shadowing the owner. Not a meeting \u2014 an operating day. Talk to employees, customers, vendors. Drive the commute. Eat lunch where you'd eat lunch. Imagine doing this 250 days a year. If you can't feel genuine excitement (not just intellectual interest), this isn't your deal.",
        acceptanceParams: [
          { label: "Shadow Day", defaultValue: "Mandatory: spend full operating day at the business", type: "text" },
          { label: "Family Input", defaultValue: "Partner/family alignment required", type: "text" },
        ],
      },
      {
        name: "Downside Survivability",
        weight: 25,
        rubric: [
          { score: 10, label: "If everything goes wrong, you lose your investment but not your house or marriage" },
          { score: 7, label: "Downside is painful but recoverable within 2\u20133 years" },
          { score: 5, label: "Downside would be financially stressful for 3\u20135 years" },
          { score: 3, label: "Downside could threaten personal financial stability" },
          { score: 0, label: "Downside scenario is personally catastrophic" },
        ],
        testGuidance: "Model the worst case honestly: the business loses 30% of revenue in year 1, you can't service the debt, and you need to sell at a loss. What happens to you personally? Can you go back to your prior career? Can you service personal obligations? This isn't pessimism \u2014 it's responsible risk management for a leveraged personal investment.",
        acceptanceParams: [
          { label: "Personal Guarantee Exposure", defaultValue: "Quantify total PG amount", type: "text" },
          { label: "Fallback Plan", defaultValue: "Document career and financial fallback", type: "text" },
        ],
      },
      {
        name: "Conviction Level",
        weight: 20,
        rubric: [
          { score: 10, label: "Absolute conviction; you've done the work and this is the right deal at the right time" },
          { score: 7, label: "Strong conviction; remaining concerns are manageable and identified" },
          { score: 5, label: "Moderate conviction; proceed but with caution and contingencies" },
          { score: 3, label: "Ambivalent; proceeding out of deal fatigue or fear of restarting search" },
          { score: 0, label: "Gut says no; proceeding would be rationalizing, not deciding" },
        ],
        testGuidance: "This is the gut-check dimension. After all the analysis: do you WANT to do this deal? Not 'can you justify it' \u2014 do you WANT it? Search fatigue is real; deal fatigue makes mediocre deals look good. Ask yourself: if a better deal appeared tomorrow, would you drop this one? If yes, your conviction isn't strong enough.",
        acceptanceParams: [
          { label: "Decision Journal", defaultValue: "Write 1 page on why you want this specific deal", type: "text" },
          { label: "Red Team", defaultValue: "Have a trusted advisor argue against the deal", type: "text" },
        ],
      },
    ],
    evidenceArtifacts: [
      { id: "sf-g7-returns", label: "Personal Returns Model (5-Year Cash-on-Cash)" },
      { id: "sf-g7-downside", label: "Downside Scenario & Personal Impact Analysis" },
      { id: "sf-g7-decision", label: "Decision Journal Entry" },
      { id: "sf-g7-redteam", label: "Red Team Challenge Notes" },
    ],
  },
];

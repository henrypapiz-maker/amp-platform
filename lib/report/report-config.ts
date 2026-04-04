// ═══════════════════════════════════════════════════════════════
// AMP v2 — Report Configuration Types & Defaults
// ═══════════════════════════════════════════════════════════════

export interface ReportConfig {
  companyName: string;
  primaryColor: string;  // hex with #
  accentColor: string;
  logoUrl: string | null;
  fontFamily: string;
  includeTitle: boolean;
  includeExecSummary: boolean;
  includePersona: boolean;
  includeGateOverview: boolean;
  includeGateDetails: boolean;
  includeRiskSummary: boolean;
  includeEvidenceSummary: boolean;
  includeScoreHistory: boolean;
  gateDetailMode: "all" | "scored_only";
  footerText: string;
  disclaimerText: string | null;
}

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  companyName: "",
  primaryColor: "#D97706",
  accentColor: "#1C1917",
  logoUrl: null,
  fontFamily: "Calibri",
  includeTitle: true,
  includeExecSummary: true,
  includePersona: true,
  includeGateOverview: true,
  includeGateDetails: true,
  includeRiskSummary: true,
  includeEvidenceSummary: true,
  includeScoreHistory: false,
  gateDetailMode: "scored_only",
  footerText: "Confidential — For Investment Committee Use Only",
  disclaimerText: null,
};

// Strip # from hex for pptxgenjs
export function stripHash(hex: string): string {
  return hex.replace(/^#/, "");
}

export function mergeConfig(dbConfig: Partial<ReportConfig> | null): ReportConfig {
  if (!dbConfig) return DEFAULT_REPORT_CONFIG;
  return { ...DEFAULT_REPORT_CONFIG, ...dbConfig };
}

// Report data shape passed to the generator
export interface ReportData {
  target: {
    name: string;
    sector: string | null;
    revenue: string | null;
    status: string;
    currentGate: number;
    compositeScore: string | null;
    outcome: string | null;
    notes: string | null;
  };
  evaluations: Array<{
    gateCode: string;
    gateStatus: string;
    compositeScore: string | null;
    evaluatedAt: string | null;
    moduleName?: string | null;
    scores: Array<{
      dimensionName: string;
      score: string | null;
      rationale: string | null;
      scoreHistory?: any;
    }>;
    evidence: Array<{
      label: string;
      linkType: string;
      ref: string;
    }>;
  }>;
  persona: {
    acquisitionThesis: string | null;
    horizonBias: string | null;
    integrationPhilosophy: string | null;
    riskTolerance: string | null;
    irrHurdle: number | null;
    primarySectors: string | null;
  } | null;
  gates: Array<{
    code: string;
    name: string;
    type: string;
    minimumScore: number | null;
    declineThreshold: number | null;
    dimensions: Array<{ name: string; weight: number }>;
  }>;
  preparedBy: string;
  generatedAt: string;
}

export interface PersonaAttributes {
  acquisitionThesis: string | null;
  horizonBias: string | null;
  integrationPhilosophy: string | null;
  riskTolerance: string | null;
  irrHurdle: number | null;
  processMaturity: number | null;
  strategicClarity: number | null;
}

interface WeightAdjustment {
  gateCode: string;
  dimensionName: string;
  adjustment: number;
  reason: string;
}

// Persona → Weight Propagation Rules
export function getPersonaAdjustments(persona: PersonaAttributes): WeightAdjustment[] {
  const adjustments: WeightAdjustment[] = [];

  // Acquisition Thesis
  if (persona.acquisitionThesis === "Capability Buy") {
    adjustments.push({ gateCode: "G1", dimensionName: "Capability Gap Fill", adjustment: 10, reason: "Capability Buy thesis" });
  } else if (persona.acquisitionThesis === "Market Extension") {
    adjustments.push({ gateCode: "G2", dimensionName: "Market Growth Rate", adjustment: 10, reason: "Market Extension thesis" });
  } else if (persona.acquisitionThesis === "Revenue Synergy") {
    adjustments.push({ gateCode: "G3", dimensionName: "Customer Segment Fit", adjustment: 10, reason: "Revenue Synergy thesis" });
  } else if (persona.acquisitionThesis === "Cost Synergy") {
    adjustments.push({ gateCode: "G3", dimensionName: "Cost Structure Compatibility", adjustment: 10, reason: "Cost Synergy thesis" });
  }

  // Horizon Bias
  if (persona.horizonBias?.includes("H1")) {
    adjustments.push({ gateCode: "G4", dimensionName: "Valuation Attractiveness", adjustment: 15, reason: "H1 horizon bias" });
  } else if (persona.horizonBias?.includes("H3")) {
    adjustments.push({ gateCode: "G2", dimensionName: "Disruption / Obsolescence", adjustment: 10, reason: "H3 horizon bias" });
  }

  // Integration Philosophy
  if (persona.integrationPhilosophy?.includes("Full Integration")) {
    adjustments.push({ gateCode: "G5", dimensionName: "Systems Compatibility", adjustment: 15, reason: "Full Integration philosophy" });
  } else if (persona.integrationPhilosophy?.includes("Standalone")) {
    adjustments.push({ gateCode: "G5", dimensionName: "Systems Compatibility", adjustment: -10, reason: "Standalone philosophy" });
  }

  // Risk Tolerance
  if (persona.riskTolerance === "Conservative") {
    adjustments.push(
      { gateCode: "G6", dimensionName: "Legal & Regulatory", adjustment: 10, reason: "Conservative risk tolerance" },
      { gateCode: "G6", dimensionName: "Customer Concentration", adjustment: 10, reason: "Conservative risk tolerance" },
      { gateCode: "G6", dimensionName: "Key Person Risk", adjustment: 5, reason: "Conservative risk tolerance" },
    );
  } else if (persona.riskTolerance === "Aggressive") {
    adjustments.push(
      { gateCode: "G6", dimensionName: "Legal & Regulatory", adjustment: -5, reason: "Aggressive risk tolerance" },
    );
  }

  // IRR Hurdle (high = more weight on valuation)
  if (persona.irrHurdle && persona.irrHurdle >= 4) {
    adjustments.push({ gateCode: "G4", dimensionName: "Valuation Attractiveness", adjustment: 10, reason: "High IRR hurdle" });
  }

  return adjustments;
}

// Calculate effective weight for a dimension
export function calculateEffectiveWeight(
  baseWeight: number,
  personaAdj: number,
  manualOverride: number | null,
): number {
  if (manualOverride !== null && manualOverride !== undefined) {
    return manualOverride;
  }
  return Math.max(5, Math.min(50, baseWeight + personaAdj));
}

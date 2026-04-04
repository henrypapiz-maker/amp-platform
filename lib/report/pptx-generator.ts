// ═══════════════════════════════════════════════════════════════
// AMP v2 — PPTX Report Generator
// Orchestrates slide builders based on admin configuration.
// Returns a Buffer containing the generated .pptx file.
// ═══════════════════════════════════════════════════════════════

import PptxGenJS from "pptxgenjs";
import { stripHash, type ReportConfig, type ReportData } from "./report-config";
import {
  buildTitleSlide,
  buildExecSummarySlide,
  buildPersonaSlide,
  buildGateWaterfallSlide,
  buildGateDetailSlides,
  buildRiskSummarySlide,
  buildEvidenceSummarySlide,
  buildScoreHistorySlide,
} from "./slide-builders";

export async function generateICReport(
  data: ReportData,
  config: ReportConfig
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // ── Presentation metadata ───────────────────────────────
  pptx.author = data.preparedBy;
  pptx.company = config.companyName || "AMP";
  pptx.subject = `IC Scorecard — ${data.target.name}`;
  pptx.title = `${data.target.name} — Investment Committee Scorecard`;

  // ── Master slide (dark theme matching AMP) ──────────────
  pptx.defineSlideMaster({
    title: "AMP_MASTER",
    background: { color: stripHash(config.accentColor) },
  });
  pptx.layout = "LAYOUT_WIDE"; // 13.33" x 7.5"

  // ── Build slides conditionally ──────────────────────────
  if (config.includeTitle) {
    buildTitleSlide(pptx, data, config);
  }

  if (config.includeExecSummary) {
    buildExecSummarySlide(pptx, data, config);
  }

  if (config.includePersona && data.persona) {
    buildPersonaSlide(pptx, data, config);
  }

  if (config.includeGateOverview) {
    buildGateWaterfallSlide(pptx, data, config);
  }

  if (config.includeGateDetails) {
    buildGateDetailSlides(pptx, data, config);
  }

  if (config.includeRiskSummary) {
    buildRiskSummarySlide(pptx, data, config);
  }

  if (config.includeEvidenceSummary) {
    buildEvidenceSummarySlide(pptx, data, config);
  }

  if (config.includeScoreHistory) {
    buildScoreHistorySlide(pptx, data, config);
  }

  // ── Generate binary ─────────────────────────────────────
  const output = await pptx.write({ outputType: "nodebuffer" });
  return output as Buffer;
}

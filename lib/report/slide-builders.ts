// ═══════════════════════════════════════════════════════════════
// AMP v2 — PPTX Slide Builder Functions
// Each function adds one or more slides to the presentation.
// ═══════════════════════════════════════════════════════════════

import type PptxGenJS from "pptxgenjs";
import { stripHash, type ReportConfig, type ReportData } from "./report-config";

type Slide = PptxGenJS.Slide;

// ── Helpers ───────────────────────────────────────────────────

function scoreColor(score: number | null, min: number | null, decline: number | null): string {
  if (score === null) return "999999";
  if (min && score >= min) return "22C55E"; // green
  if (decline && score < decline) return "EF4444"; // red
  return "F59E0B"; // amber
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Not Started", in_progress: "In Progress",
    passed: "Passed", failed: "Failed",
  };
  return map[status] || status;
}

function recommendation(score: number | null, outcome: string | null): { label: string; color: string } {
  if (outcome) {
    const map: Record<string, { label: string; color: string }> = {
      pursue: { label: "PURSUE", color: "22C55E" },
      conditional: { label: "CONDITIONAL", color: "F59E0B" },
      pass: { label: "PASS", color: "EF4444" },
    };
    return map[outcome] || { label: outcome.toUpperCase(), color: "999999" };
  }
  if (score === null) return { label: "PENDING", color: "999999" };
  if (score >= 65) return { label: "PURSUE", color: "22C55E" };
  if (score >= 50) return { label: "CONDITIONAL", color: "F59E0B" };
  return { label: "PASS", color: "EF4444" };
}

function addFooter(slide: Slide, config: ReportConfig) {
  if (config.footerText) {
    slide.addText(config.footerText, {
      x: 0.5, y: 7.0, w: 9, h: 0.3,
      fontSize: 7, color: "999999", fontFace: config.fontFamily,
    });
  }
}

// ── 1. Title Slide ────────────────────────────────────────────

export function buildTitleSlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);

  // Company name
  if (config.companyName) {
    slide.addText(config.companyName, {
      x: 0.5, y: 0.5, w: 9, h: 0.4,
      fontSize: 12, color: "999999", fontFace: config.fontFamily,
    });
  }

  // Title
  slide.addText("Investment Committee\nScorecard", {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 36, color: pc, fontFace: config.fontFamily, bold: true,
  });

  // Target name
  slide.addText(data.target.name, {
    x: 0.5, y: 3.2, w: 9, h: 0.6,
    fontSize: 24, color: "FFFFFF", fontFace: config.fontFamily,
  });

  // Details
  const details = [
    data.target.sector, data.target.revenue,
    `Current Gate: G${data.target.currentGate}`,
  ].filter(Boolean).join("  |  ");

  slide.addText(details, {
    x: 0.5, y: 3.9, w: 9, h: 0.4,
    fontSize: 12, color: "A8A29E", fontFace: config.fontFamily,
  });

  // Prepared by + date
  slide.addText(`Prepared by ${data.preparedBy}  |  ${data.generatedAt}`, {
    x: 0.5, y: 5.0, w: 9, h: 0.3,
    fontSize: 10, color: "78716C", fontFace: config.fontFamily,
  });

  addFooter(slide, config);
}

// ── 2. Executive Summary ──────────────────────────────────────

export function buildExecSummarySlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);
  const overallScore = data.target.compositeScore ? Number(data.target.compositeScore) : null;
  const rec = recommendation(overallScore, data.target.outcome);

  slide.addText("Executive Summary", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, color: pc, fontFace: config.fontFamily, bold: true,
  });

  // Recommendation badge
  slide.addShape("rect" as any, {
    x: 0.5, y: 1.0, w: 2.5, h: 0.8,
    fill: { color: rec.color },
    rectRadius: 0.1,
  });
  slide.addText(rec.label, {
    x: 0.5, y: 1.0, w: 2.5, h: 0.8,
    fontSize: 24, color: "FFFFFF", fontFace: config.fontFamily, bold: true,
    align: "center", valign: "middle",
  });

  // Composite score
  if (overallScore !== null) {
    slide.addText(`Composite Score: ${overallScore.toFixed(1)}`, {
      x: 3.5, y: 1.1, w: 3, h: 0.6,
      fontSize: 18, color: "FFFFFF", fontFace: config.fontFamily,
    });
  }

  // Gate summary table
  const tableRows: any[][] = [
    [
      { text: "Gate", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Name", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Score", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Status", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
    ],
  ];

  for (const gate of data.gates) {
    const ev = data.evaluations.find(e => e.gateCode === gate.code);
    const score = ev?.compositeScore ? Number(ev.compositeScore) : null;
    const sc = scoreColor(score, gate.minimumScore, gate.declineThreshold);

    tableRows.push([
      { text: gate.code, options: { fontSize: 9, color: pc, bold: true } },
      { text: gate.name, options: { fontSize: 9, color: "D6D3D1" } },
      { text: score !== null ? score.toFixed(1) : "—", options: { fontSize: 9, color: sc, bold: true } },
      { text: ev ? statusLabel(ev.gateStatus) : "Not Started", options: { fontSize: 9, color: "A8A29E" } },
    ]);
  }

  slide.addTable(tableRows, {
    x: 0.5, y: 2.2, w: 9,
    border: { type: "solid", pt: 0.5, color: "44403C" },
    rowH: 0.35,
    colW: [0.8, 3.5, 1.2, 1.5],
  });

  // Notes
  if (data.target.notes) {
    slide.addText(data.target.notes, {
      x: 0.5, y: 5.8, w: 9, h: 0.8,
      fontSize: 9, color: "A8A29E", fontFace: config.fontFamily, italic: true,
    });
  }

  addFooter(slide, config);
}

// ── 3. Persona Slide ──────────────────────────────────────────

export function buildPersonaSlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  if (!data.persona) return;
  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);

  slide.addText("Acquirer Persona", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, color: pc, fontFace: config.fontFamily, bold: true,
  });

  const fields = [
    { label: "Acquisition Thesis", value: data.persona.acquisitionThesis },
    { label: "Investment Horizon", value: data.persona.horizonBias },
    { label: "Integration Philosophy", value: data.persona.integrationPhilosophy },
    { label: "Risk Tolerance", value: data.persona.riskTolerance },
    { label: "IRR Hurdle", value: data.persona.irrHurdle ? `Level ${data.persona.irrHurdle}` : null },
    { label: "Primary Sectors", value: data.persona.primarySectors },
  ].filter(f => f.value);

  const rows: any[][] = fields.map(f => [
    { text: f.label, options: { fontSize: 11, color: "A8A29E", bold: true } },
    { text: f.value || "", options: { fontSize: 11, color: "FFFFFF" } },
  ]);

  slide.addTable(rows, {
    x: 0.5, y: 1.2, w: 9,
    border: { type: "solid", pt: 0.5, color: "44403C" },
    rowH: 0.5,
    colW: [3, 6],
  });

  addFooter(slide, config);
}

// ── 4. Gate Waterfall Overview ────────────────────────────────

export function buildGateWaterfallSlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);

  slide.addText("8-Gate Waterfall Overview", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, color: pc, fontFace: config.fontFamily, bold: true,
  });

  // Gate boxes in a row
  const boxW = 1.05;
  const startX = 0.5;
  const boxY = 1.5;

  data.gates.forEach((gate, i) => {
    const ev = data.evaluations.find(e => e.gateCode === gate.code);
    const score = ev?.compositeScore ? Number(ev.compositeScore) : null;
    const sc = scoreColor(score, gate.minimumScore, gate.declineThreshold);
    const x = startX + (i * (boxW + 0.15));

    // Box
    slide.addShape("rect" as any, {
      x, y: boxY, w: boxW, h: 1.5,
      fill: { color: "292524" },
      line: { color: sc, pt: 2 },
      rectRadius: 0.05,
    });

    // Gate code
    slide.addText(gate.code, {
      x, y: boxY + 0.1, w: boxW, h: 0.3,
      fontSize: 14, color: pc, fontFace: config.fontFamily, bold: true, align: "center",
    });

    // Score
    slide.addText(score !== null ? score.toFixed(0) : "—", {
      x, y: boxY + 0.45, w: boxW, h: 0.4,
      fontSize: 20, color: sc, fontFace: config.fontFamily, bold: true, align: "center",
    });

    // Status
    slide.addText(ev ? statusLabel(ev.gateStatus) : "Pending", {
      x, y: boxY + 0.9, w: boxW, h: 0.25,
      fontSize: 7, color: "A8A29E", fontFace: config.fontFamily, align: "center",
    });

    // Gate name (below box)
    slide.addText(gate.name, {
      x, y: boxY + 1.6, w: boxW, h: 0.4,
      fontSize: 7, color: "78716C", fontFace: config.fontFamily, align: "center",
    });
  });

  // Legend
  slide.addText("Green = Passes minimum  |  Amber = Review  |  Red = Below decline threshold", {
    x: 0.5, y: 4.5, w: 9, h: 0.3,
    fontSize: 8, color: "78716C", fontFace: config.fontFamily,
  });

  addFooter(slide, config);
}

// ── 5. Gate Detail Slides ─────────────────────────────────────

export function buildGateDetailSlides(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  for (const gate of data.gates) {
    const ev = data.evaluations.find(e => e.gateCode === gate.code);

    // Skip gates based on config
    if (config.gateDetailMode === "scored_only" && !ev) continue;
    if (config.gateDetailMode === "scored_only" && ev?.gateStatus === "pending") continue;

    const slide = pptx.addSlide();
    const pc = stripHash(config.primaryColor);
    const gateScore = ev?.compositeScore ? Number(ev.compositeScore) : null;
    const sc = scoreColor(gateScore, gate.minimumScore, gate.declineThreshold);

    // Header
    slide.addText(`${gate.code} — ${gate.name}`, {
      x: 0.5, y: 0.3, w: 7, h: 0.5,
      fontSize: 20, color: pc, fontFace: config.fontFamily, bold: true,
    });

    // Gate score badge
    if (gateScore !== null) {
      slide.addText(gateScore.toFixed(1), {
        x: 8, y: 0.3, w: 1.5, h: 0.5,
        fontSize: 20, color: sc, fontFace: config.fontFamily, bold: true, align: "right",
      });
    }

    // Status + type
    slide.addText(`${gate.type.toUpperCase()}  |  ${ev ? statusLabel(ev.gateStatus) : "Not Started"}${gate.minimumScore ? `  |  Min: ${gate.minimumScore}` : ""}`, {
      x: 0.5, y: 0.85, w: 9, h: 0.3,
      fontSize: 9, color: "A8A29E", fontFace: config.fontFamily,
    });

    if (!ev || ev.scores.length === 0) {
      slide.addText("No scores recorded for this gate.", {
        x: 0.5, y: 2.0, w: 9, h: 0.5,
        fontSize: 12, color: "78716C", fontFace: config.fontFamily, italic: true,
      });
      addFooter(slide, config);
      continue;
    }

    // Dimension scores table
    const rows: any[][] = [
      [
        { text: "Dimension", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
        { text: "Weight", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
        { text: "Score", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
        { text: "Rationale", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
      ],
    ];

    for (const dimScore of ev.scores) {
      const gateDim = gate.dimensions.find(d => d.name === dimScore.dimensionName);
      const s = dimScore.score ? Number(dimScore.score) : null;
      const dimSc = s !== null ? (s >= 7 ? "22C55E" : s >= 5 ? "F59E0B" : s >= 3 ? "FB923C" : "EF4444") : "78716C";

      rows.push([
        { text: dimScore.dimensionName, options: { fontSize: 9, color: "D6D3D1" } },
        { text: gateDim ? `${gateDim.weight}%` : "—", options: { fontSize: 9, color: "A8A29E", align: "center" } },
        { text: s !== null ? s.toFixed(1) : "—", options: { fontSize: 11, color: dimSc, bold: true, align: "center" } },
        { text: dimScore.rationale || "", options: { fontSize: 8, color: "A8A29E" } },
      ]);
    }

    slide.addTable(rows, {
      x: 0.5, y: 1.4, w: 9,
      border: { type: "solid", pt: 0.5, color: "44403C" },
      rowH: 0.45,
      colW: [2.2, 0.8, 0.8, 5.2],
      autoPage: true,
    });

    addFooter(slide, config);
  }
}

// ── 6. Risk Summary ───────────────────────────────────────────

export function buildRiskSummarySlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  const g6Eval = data.evaluations.find(e => e.gateCode === "G6");
  if (!g6Eval || g6Eval.scores.length === 0) return;

  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);

  slide.addText("Risk Assessment Summary (G6)", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, color: pc, fontFace: config.fontFamily, bold: true,
  });

  // Sort by score ascending (worst risks first)
  const sorted = [...g6Eval.scores]
    .filter(s => s.score !== null)
    .sort((a, b) => Number(a.score) - Number(b.score));

  const rows: any[][] = [
    [
      { text: "Risk Dimension", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Score", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Assessment", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
    ],
  ];

  for (const risk of sorted) {
    const s = Number(risk.score);
    const color = s >= 7 ? "22C55E" : s >= 5 ? "F59E0B" : "EF4444";
    const level = s >= 7 ? "Low Risk" : s >= 5 ? "Moderate" : s >= 3 ? "Elevated" : "Critical";

    rows.push([
      { text: risk.dimensionName, options: { fontSize: 10, color: "D6D3D1" } },
      { text: `${s.toFixed(1)} — ${level}`, options: { fontSize: 10, color, bold: true } },
      { text: risk.rationale || "No assessment provided", options: { fontSize: 8, color: "A8A29E" } },
    ]);
  }

  slide.addTable(rows, {
    x: 0.5, y: 1.2, w: 9,
    border: { type: "solid", pt: 0.5, color: "44403C" },
    rowH: 0.55,
    colW: [2.5, 1.5, 5],
  });

  addFooter(slide, config);
}

// ── 7. Evidence Summary ───────────────────────────────────────

export function buildEvidenceSummarySlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);

  slide.addText("Evidence Inventory", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, color: pc, fontFace: config.fontFamily, bold: true,
  });

  const rows: any[][] = [
    [
      { text: "Gate", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Artifacts", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
      { text: "Evidence Items", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 10 } },
    ],
  ];

  for (const gate of data.gates) {
    const ev = data.evaluations.find(e => e.gateCode === gate.code);
    const evidenceCount = ev?.evidence?.length || 0;
    const labels = ev?.evidence?.map(e => e.label).join(", ") || "—";

    rows.push([
      { text: `${gate.code} — ${gate.name}`, options: { fontSize: 9, color: "D6D3D1" } },
      { text: String(evidenceCount), options: { fontSize: 9, color: evidenceCount > 0 ? "22C55E" : "78716C", bold: true, align: "center" } },
      { text: labels, options: { fontSize: 8, color: "A8A29E" } },
    ]);
  }

  slide.addTable(rows, {
    x: 0.5, y: 1.2, w: 9,
    border: { type: "solid", pt: 0.5, color: "44403C" },
    rowH: 0.4,
    colW: [2.5, 1, 5.5],
  });

  addFooter(slide, config);
}

// ── 8. Score History ──────────────────────────────────────────

export function buildScoreHistorySlide(pptx: PptxGenJS, data: ReportData, config: ReportConfig) {
  // Only include if any scores have history
  const allHistory: Array<{ gate: string; dim: string; history: any[] }> = [];

  for (const ev of data.evaluations) {
    for (const score of ev.scores) {
      if (score.scoreHistory && Array.isArray(score.scoreHistory) && score.scoreHistory.length > 0) {
        allHistory.push({
          gate: ev.gateCode,
          dim: score.dimensionName,
          history: score.scoreHistory,
        });
      }
    }
  }

  if (allHistory.length === 0) return;

  const slide = pptx.addSlide();
  const pc = stripHash(config.primaryColor);

  slide.addText("Score Revision History", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, color: pc, fontFace: config.fontFamily, bold: true,
  });

  const rows: any[][] = [
    [
      { text: "Gate", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
      { text: "Dimension", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
      { text: "Prior Score", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
      { text: "Date", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
      { text: "Prior Rationale", options: { bold: true, color: "FFFFFF", fill: { color: pc }, fontSize: 9 } },
    ],
  ];

  for (const item of allHistory.slice(0, 20)) { // Cap at 20 rows
    for (const h of item.history) {
      rows.push([
        { text: item.gate, options: { fontSize: 8, color: pc } },
        { text: item.dim, options: { fontSize: 8, color: "D6D3D1" } },
        { text: h.score?.toString() || "—", options: { fontSize: 8, color: "F59E0B", bold: true } },
        { text: h.scoredAt ? new Date(h.scoredAt).toLocaleDateString() : "—", options: { fontSize: 7, color: "78716C" } },
        { text: h.rationale || "", options: { fontSize: 7, color: "A8A29E" } },
      ]);
    }
  }

  slide.addTable(rows, {
    x: 0.5, y: 1.2, w: 9,
    border: { type: "solid", pt: 0.5, color: "44403C" },
    rowH: 0.35,
    colW: [0.7, 2, 0.8, 1, 4.5],
  });

  addFooter(slide, config);
}

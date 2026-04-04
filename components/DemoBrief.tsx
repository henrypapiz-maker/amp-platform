"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Layers, Clock, Shield, Target, BookOpen, Scale,
  ChevronRight, ChevronLeft, Sparkles, GitBranch,
  FileText, Users, BarChart, Zap, X, HelpCircle
} from "lucide-react";

// ── Demo Brief Content ────────────────────────────────────────

const SLIDES = [
  {
    id: "welcome",
    badge: "Welcome to AMP",
    title: "Acquisition Management Platform",
    subtitle: "by Alio Foundry",
    content: "AMP replaces Excel + PowerPoint + email with a structured 8-gate waterfall methodology. Acquisition targets progress through gates, each examining a distinct aspect \u2014 from universe qualification through IC decision.",
    highlights: [
      { icon: Target, label: "8-Gate Waterfall", desc: "Structured evaluation from screening to IC decision" },
      { icon: Scale, label: "Rubric-Anchored Scoring", desc: "Quantitative 0-10 scoring against calibrated benchmarks" },
      { icon: Shield, label: "Dual Authorization", desc: "Two independent approvals required per gate advancement" },
    ],
    accent: "amber",
  },
  {
    id: "archetypes",
    badge: "Multi-Persona",
    title: "6 Acquirer Archetypes",
    subtitle: "One platform, tailored methodology",
    content: "AMP adapts its entire evaluation framework to your acquirer type. Each archetype has customized gate definitions, scoring rubrics, weight propagation, and evidence requirements.",
    highlights: [
      { icon: Layers, label: "PE Platform Build", desc: "Mid-market PE acquiring platform companies" },
      { icon: GitBranch, label: "PE Bolt-On / Roll-Up", desc: "Synergy-focused add-on acquisitions" },
      { icon: Users, label: "Corporate Strategic", desc: "Board-aligned strategic acquisitions" },
    ],
    extra: ["Family Office / HoldCo \u2014 perpetual hold, cash yield focus", "Search Fund \u2014 single operator, SBA eligibility", "Growth Equity \u2014 TAM, founder quality, capital efficiency"],
    accent: "blue",
  },
  {
    id: "scoring",
    badge: "Evaluation Engine",
    title: "Multi-Lens Scoring",
    subtitle: "Convergence = confidence. Divergence = investigate.",
    content: "Every dimension can be evaluated through multiple analytical lenses \u2014 each with its own framework, key questions, and calibration anchors. When lenses agree, you have confidence. When they diverge, you've found something worth investigating.",
    highlights: [
      { icon: Scale, label: "Live Composite Preview", desc: "See how each score impacts the gate composite in real-time" },
      { icon: BookOpen, label: "22+ Evaluation Lenses", desc: "DCF, Porter's Five Forces, Cohort Analysis, and more" },
      { icon: Sparkles, label: "Custom Dimensions", desc: "Add deal-specific dimensions \u2014 weighted or supplementary" },
    ],
    accent: "green",
  },
  {
    id: "time-savings",
    badge: "Time Savings",
    title: "From Weeks to Hours",
    subtitle: "Measured against real deal workflows",
    content: "AMP was tested against a live 8-gate bolt-on evaluation (Apex Environmental Services). The structured methodology, embedded rubrics, and automated scoring eliminated hours of manual work per gate.",
    highlights: [
      { icon: Clock, label: "70% Faster Scoring", desc: "Rubrics inline, no spreadsheet lookup. Composite auto-calculated." },
      { icon: FileText, label: "Drag-and-Drop Evidence", desc: "Upload files directly \u2014 no SharePoint round-trips" },
      { icon: BarChart, label: "Instant IC Readiness", desc: "Gate scores, approvals, and methodology all in one view" },
    ],
    stats: [
      { value: "5\u21922", unit: "steps", label: "to attach evidence" },
      { value: "0", unit: "spreadsheets", label: "required for scoring" },
      { value: "100%", unit: "audit trail", label: "every score versioned" },
    ],
    accent: "purple",
  },
  {
    id: "knowledge",
    badge: "Knowledge Base",
    title: "Open Methodology",
    subtitle: "Every rubric, weight, and lens is inspectable",
    content: "AMP's Knowledge Base is the single source of truth for your evaluation methodology. Browse authored articles, explore the live methodology reference, and access the evidence reference library with sample templates for every gate.",
    highlights: [
      { icon: BookOpen, label: "Methodology Reference", desc: "Live gate-by-gate breakdown of dimensions, rubrics, and lenses" },
      { icon: Layers, label: "Reference Library", desc: "17 evidence templates with section outlines and quality criteria" },
      { icon: Shield, label: "Crystallization", desc: "Passed gates freeze \u2014 methodology changes don't retroactively affect scored evaluations" },
    ],
    accent: "teal",
  },
  {
    id: "get-started",
    badge: "Get Started",
    title: "Your First Evaluation",
    subtitle: "Three steps to your first scored gate",
    content: "AMP is designed for progressive disclosure \u2014 new users see clean defaults, power users discover depth as needed. Start with a target, score your first gate, and experience the waterfall.",
    highlights: [
      { icon: Zap, label: "1. Add a Target", desc: "Enter the company name, sector, and revenue from the Pipeline view" },
      { icon: Scale, label: "2. Start a Gate", desc: "Click Start Evaluation on G0 \u2014 score each dimension against rubric anchors" },
      { icon: Shield, label: "3. Get Approval", desc: "Submit for dual authorization \u2014 the gate crystallizes on passage" },
    ],
    accent: "amber",
  },
];

const accentColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  amber: { bg: "bg-amber-900/20", text: "text-amber-400", border: "border-amber-700/30", badge: "bg-amber-900/40 text-amber-300" },
  blue: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-700/30", badge: "bg-blue-900/40 text-blue-300" },
  green: { bg: "bg-green-900/20", text: "text-green-400", border: "border-green-700/30", badge: "bg-green-900/40 text-green-300" },
  purple: { bg: "bg-purple-900/20", text: "text-purple-400", border: "border-purple-700/30", badge: "bg-purple-900/40 text-purple-300" },
  teal: { bg: "bg-teal-900/20", text: "text-teal-400", border: "border-teal-700/30", badge: "bg-teal-900/40 text-teal-300" },
};

// ── Component ─────────────────────────────────────────────────

export default function DemoBrief() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Show on first visit (check localStorage)
  useEffect(() => {
    const seen = localStorage.getItem("amp-demo-brief-seen");
    if (!seen) {
      setOpen(true);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem("amp-demo-brief-seen", "true");
    setOpen(false);
    setDismissed(true);
  }

  function handleReopen() {
    setSlide(0);
    setOpen(true);
  }

  const current = SLIDES[slide];
  const colors = accentColors[current.accent] || accentColors.amber;
  const isLast = slide === SLIDES.length - 1;

  return (
    <>
      {/* Floating "Tour" button — always visible after dismiss */}
      {dismissed && !open && (
        <button
          onClick={handleReopen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 hover:text-white hover:border-stone-600 shadow-xl transition-all hover:scale-105"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">Platform Tour</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
        <DialogContent className="bg-stone-900 border-stone-700 text-white max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden">
          {/* Header */}
          <div className={`px-6 pt-6 pb-4 ${colors.bg} border-b ${colors.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                {current.badge}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-stone-500 text-xs">{slide + 1} / {SLIDES.length}</span>
                <button onClick={handleDismiss} className="text-stone-500 hover:text-white p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h2 className="text-2xl font-serif text-white">{current.title}</h2>
            {current.subtitle && (
              <p className={`text-sm mt-1 ${colors.text}`}>{current.subtitle}</p>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            <p className="text-stone-300 text-sm leading-relaxed">{current.content}</p>

            {/* Highlights */}
            <div className="space-y-3">
              {current.highlights.map((h, i) => {
                const Icon = h.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-stone-800/50 border border-stone-700/50">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div>
                      <span className="text-white text-sm font-medium">{h.label}</span>
                      <p className="text-stone-400 text-xs mt-0.5">{h.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extra items (archetype slide) */}
            {current.extra && (
              <div className="space-y-1.5 pl-1">
                {current.extra.map((item, i) => (
                  <p key={i} className="text-stone-400 text-xs flex items-center gap-2">
                    <span className={colors.text}>+</span> {item}
                  </p>
                ))}
              </div>
            )}

            {/* Stats (time savings slide) */}
            {current.stats && (
              <div className="grid grid-cols-3 gap-3">
                {current.stats.map((stat, i) => (
                  <div key={i} className={`text-center p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <div className={`text-2xl font-mono font-bold ${colors.text}`}>{stat.value}</div>
                    <div className="text-stone-500 text-[10px] uppercase tracking-wider mt-0.5">{stat.unit}</div>
                    <div className="text-stone-400 text-[10px] mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t border-stone-700/50 flex items-center justify-between bg-stone-900">
            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === slide ? `${colors.text} scale-125` : "bg-stone-700 hover:bg-stone-600"
                  }`}
                  style={i === slide ? { backgroundColor: "currentColor" } : {}}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {slide > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlide(slide - 1)}
                  className="text-stone-400 hover:text-white text-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              {isLast ? (
                <Button
                  size="sm"
                  onClick={handleDismiss}
                  className="bg-amber-600 hover:bg-amber-700 text-sm px-6"
                >
                  Start Evaluating
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setSlide(slide + 1)}
                  className="bg-amber-600 hover:bg-amber-700 text-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

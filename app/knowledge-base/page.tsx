"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Search, ChevronRight, ChevronDown, ArrowLeft, Layers,
  Target, Scale, Shield, Lightbulb, Eye, FileText,
  Clock, User, GitBranch, Beaker, AlertTriangle
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  relatedGates: string[];
  authorName: string;
  publishedAt: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  methodology: { label: "Methodology", icon: Layers, color: "amber" },
  scoring_playbook: { label: "Scoring Playbook", icon: Scale, color: "green" },
  gate_deep_dive: { label: "Gate Deep Dive", icon: Target, color: "blue" },
  lens_library: { label: "Lens Library", icon: Eye, color: "purple" },
  best_practices: { label: "Best Practices", icon: Lightbulb, color: "teal" },
  security: { label: "Security & Compliance", icon: Shield, color: "red" },
};

// ── Knowledge Base Page ────────────────────────────────────────

// ── Methodology types for live rendering ──────────────────────
interface MethodologyData {
  templateId: string | null;
  templateName: string | null;
  templateVersion: string | null;
  archetype: string | null;
  isCustomized: boolean;
  gates: any[];
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  // S3: Methodology Reference tab
  const [activeTab, setActiveTab] = useState<"articles" | "methodology" | "references">("articles");
  const [methodology, setMethodology] = useState<MethodologyData | null>(null);
  const [methodologyLoading, setMethodologyLoading] = useState(false);
  const [expandedGate, setExpandedGate] = useState<string | null>(null);
  const [selectedModuleByGate, setSelectedModuleByGate] = useState<Record<string, number>>({});
  // Reference Library
  const [refTemplates, setRefTemplates] = useState<any[]>([]);
  const [refLoading, setRefLoading] = useState(false);
  const [refGateFilter, setRefGateFilter] = useState<string | null>(null);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/knowledge-base");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch {
      // Fallback to static KB for POC demo
      setArticles(STATIC_ARTICLES);
    }
    setLoading(false);
  }

  async function fetchMethodology() {
    if (methodology) return; // Already loaded
    setMethodologyLoading(true);
    try {
      const res = await fetch("/api/knowledge-base/methodology");
      if (res.ok) {
        const data = await res.json();
        setMethodology(data);
      }
    } catch {
      // Methodology not available
    }
    setMethodologyLoading(false);
  }

  async function fetchRefTemplates() {
    if (refTemplates.length > 0) return;
    setRefLoading(true);
    try {
      const res = await fetch("/api/evidence/templates");
      if (res.ok) setRefTemplates(await res.json());
    } catch { /* ignore */ }
    setRefLoading(false);
  }

  function handleTabSwitch(tab: "articles" | "methodology" | "references") {
    setActiveTab(tab);
    if (tab === "methodology") fetchMethodology();
    if (tab === "references") fetchRefTemplates();
  }

  // Filter
  const filtered = articles.filter((a) => {
    const matchSearch = !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !activeCategory || a.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, KBArticle[]>>((acc, a) => {
    acc[a.category] = acc[a.category] || [];
    acc[a.category].push(a);
    return acc;
  }, {});

  // ── Article Detail View ──────────────────────────────────
  if (selectedArticle) {
    const cat = CATEGORY_CONFIG[selectedArticle.category];
    const CatIcon = cat?.icon || BookOpen;

    return (
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setSelectedArticle(null)}
          className="text-stone-400 hover:text-white mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Knowledge Base
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`bg-${cat?.color || "stone"}-900/30 text-${cat?.color || "stone"}-400 text-[10px] gap-1`}>
              <CatIcon className="w-3 h-3" />
              {cat?.label || selectedArticle.category}
            </Badge>
            {selectedArticle.relatedGates.map((g) => (
              <Badge key={g} variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-serif text-white">{selectedArticle.title}</h1>
          <p className="text-stone-400 text-sm mt-2">{selectedArticle.summary}</p>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {selectedArticle.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(selectedArticle.publishedAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Article content — render markdown-like content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {selectedArticle.content.split("\n").map((line, i) => {
            if (line.startsWith("# ")) {
              return <h1 key={i} className="text-xl font-serif text-white mt-8 mb-3">{line.slice(2)}</h1>;
            }
            if (line.startsWith("## ")) {
              return <h2 key={i} className="text-lg font-serif text-white mt-6 mb-2">{line.slice(3)}</h2>;
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return <p key={i} className="text-white font-medium mt-4 mb-1">{line.slice(2, -2)}</p>;
            }
            if (line.startsWith("| ")) {
              // Simple table row rendering
              const cells = line.split("|").filter((c) => c.trim()).map((c) => c.trim());
              return (
                <div key={i} className="grid grid-cols-3 gap-2 text-xs border-b border-stone-700/50 py-1.5">
                  {cells.map((cell, j) => (
                    <span key={j} className={j === 0 ? "text-stone-200 font-medium" : "text-stone-400"}>
                      {cell.replace(/---/g, "")}
                    </span>
                  ))}
                </div>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <p key={i} className="text-stone-300 text-sm ml-4 flex items-start gap-2 mt-1">
                  <span className="text-stone-600 mt-1">•</span>
                  {line.slice(2)}
                </p>
              );
            }
            if (line.trim() === "") return <div key={i} className="h-2" />;
            return <p key={i} className="text-stone-300 text-sm leading-relaxed mt-2">{line}</p>;
          })}
        </div>
      </div>
    );
  }

  // ── Browse View ──────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-serif text-white">Knowledge Base</h1>
          </div>
          <p className="text-stone-400 text-sm mt-1">
            Methodology reference, scoring playbooks, and evaluation guidance.
          </p>
        </div>
      </div>

      {/* Tab Switcher: Articles | Methodology Reference */}
      <div className="flex gap-1 mb-6 p-1 bg-stone-800 rounded-lg w-fit">
        <button
          onClick={() => handleTabSwitch("articles")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "articles"
              ? "bg-stone-700 text-white"
              : "text-stone-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Articles
        </button>
        <button
          onClick={() => handleTabSwitch("methodology")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "methodology"
              ? "bg-stone-700 text-white"
              : "text-stone-400 hover:text-white"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Methodology Reference
        </button>
        <button
          onClick={() => handleTabSwitch("references")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "references"
              ? "bg-stone-700 text-white"
              : "text-stone-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          Reference Library
        </button>
      </div>

      {/* ── Methodology Reference Tab ───────────────────────── */}
      {activeTab === "methodology" && (
        <div>
          {methodologyLoading ? (
            <div className="text-stone-500 text-center py-12">Loading methodology...</div>
          ) : !methodology ? (
            <div className="text-stone-500 text-center py-12">
              No methodology template configured. Complete onboarding to select an archetype.
            </div>
          ) : (
            <div>
              {/* Template Header */}
              <div className="p-4 rounded-lg border border-stone-700 bg-stone-800/50 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-serif text-white">{methodology.templateName}</h2>
                  <Badge variant="outline" className="border-amber-600/50 text-amber-400 text-[10px]">
                    {methodology.archetype?.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
                    v{methodology.templateVersion}
                  </Badge>
                  {methodology.isCustomized && (
                    <Badge className="bg-blue-900/30 text-blue-400 text-[10px]">Customized</Badge>
                  )}
                </div>
                <p className="text-stone-400 text-sm mt-1">
                  {methodology.gates.length}-gate waterfall methodology. Click any gate to explore dimensions, rubric anchors, modules, and evaluation lenses.
                </p>
              </div>

              {/* Gates Accordion */}
              <div className="space-y-2">
                {methodology.gates.map((gate: any) => {
                  const isExpanded = expandedGate === gate.code;
                  const modules = gate.modules || [];
                  const activeModuleIdx = selectedModuleByGate[gate.code] || 0;
                  const activeModule = modules[activeModuleIdx];
                  const dimensions = activeModule?.dimensions || gate.dimensions || [];

                  return (
                    <div key={gate.code} className="border border-stone-700 rounded-lg overflow-hidden">
                      {/* Gate Header */}
                      <button
                        onClick={() => setExpandedGate(isExpanded ? null : gate.code)}
                        className="w-full flex items-center justify-between p-4 bg-stone-800/50 hover:bg-stone-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-amber-400 text-sm font-bold w-7">{gate.code}</span>
                          <span className="text-white font-medium text-sm">{gate.name}</span>
                          <Badge variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
                            {gate.type}
                          </Badge>
                          {gate.minimumScore && (
                            <span className="text-stone-500 text-[10px]">
                              min: {gate.minimumScore}
                            </span>
                          )}
                          {modules.length > 1 && (
                            <Badge className="bg-purple-900/30 text-purple-400 text-[10px]">
                              {modules.length} modules
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-stone-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-500" />
                        )}
                      </button>

                      {/* Expanded Gate Content */}
                      {isExpanded && (
                        <div className="p-4 border-t border-stone-700/50 space-y-4">
                          {/* Purpose & Rule */}
                          <div className="space-y-2">
                            <p className="text-stone-300 text-sm">{gate.purpose}</p>
                            <div className="bg-stone-900/50 rounded p-2 text-xs text-stone-400 flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span><strong className="text-stone-300">Gate Rule:</strong> {gate.rule}</span>
                            </div>
                          </div>

                          {/* Module Tabs (if multiple) */}
                          {modules.length > 1 && (
                            <div className="flex gap-1 p-1 bg-stone-900 rounded-lg w-fit">
                              {modules.map((mod: any, idx: number) => (
                                <button
                                  key={mod.id || idx}
                                  onClick={() => setSelectedModuleByGate({ ...selectedModuleByGate, [gate.code]: idx })}
                                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                                    activeModuleIdx === idx
                                      ? "bg-stone-700 text-white"
                                      : "text-stone-500 hover:text-white"
                                  }`}
                                >
                                  <Beaker className="w-3 h-3 inline mr-1" />
                                  {mod.name}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Module description */}
                          {activeModule?.description && (
                            <p className="text-stone-400 text-xs italic">{activeModule.description}</p>
                          )}

                          {/* Dimensions */}
                          <div className="space-y-3">
                            <h4 className="text-stone-300 text-xs uppercase tracking-wider font-medium">
                              Dimensions ({dimensions.length})
                            </h4>
                            {dimensions.map((dim: any, dIdx: number) => (
                              <div key={dIdx} className="bg-stone-900 rounded-lg p-3 border border-stone-700/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white text-sm font-medium">{dim.name}</span>
                                  <Badge variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
                                    {dim.weight}%
                                  </Badge>
                                </div>

                                {/* Test Guidance */}
                                {dim.testGuidance && (
                                  <p className="text-stone-400 text-xs leading-relaxed mb-2">{dim.testGuidance}</p>
                                )}

                                {/* Rubric Anchors */}
                                {dim.rubric && dim.rubric.length > 0 && (
                                  <div className="space-y-1 mt-2">
                                    <span className="text-stone-500 text-[10px] uppercase tracking-wider">Rubric Anchors</span>
                                    {dim.rubric.map((anchor: any, aIdx: number) => (
                                      <div key={aIdx} className="flex items-start gap-2 text-xs">
                                        <span className="font-mono text-stone-500 w-5 shrink-0 font-bold">{anchor.score}</span>
                                        <span className="text-stone-400">{anchor.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Lenses for this dimension */}
                                {dim.lenses && dim.lenses.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-stone-700/30">
                                    <span className="text-stone-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      Evaluation Lenses ({dim.lenses.length})
                                    </span>
                                    <div className="mt-1.5 space-y-2">
                                      {dim.lenses.map((lens: any, lIdx: number) => (
                                        <div key={lIdx} className="bg-stone-800/50 rounded p-2 border border-stone-700/30">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-stone-200 text-xs font-medium">{lens.name}</span>
                                            {lens.framework && (
                                              <span className="text-stone-500 text-[10px]">({lens.framework})</span>
                                            )}
                                          </div>
                                          {lens.guidance && (
                                            <p className="text-stone-400 text-[11px] leading-relaxed">{lens.guidance}</p>
                                          )}
                                          {lens.keyQuestions && lens.keyQuestions.length > 0 && (
                                            <div className="mt-1.5">
                                              <span className="text-stone-500 text-[10px]">Key Questions:</span>
                                              <ul className="mt-0.5">
                                                {lens.keyQuestions.map((q: string, qIdx: number) => (
                                                  <li key={qIdx} className="text-stone-400 text-[10px] ml-3 flex items-start gap-1">
                                                    <span className="text-stone-600">•</span>{q}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {lens.blindSpots && lens.blindSpots.length > 0 && (
                                            <div className="mt-1.5">
                                              <span className="text-amber-500/70 text-[10px] flex items-center gap-1">
                                                <AlertTriangle className="w-2.5 h-2.5" /> Blind Spots
                                              </span>
                                              <ul className="mt-0.5">
                                                {lens.blindSpots.map((b: string, bIdx: number) => (
                                                  <li key={bIdx} className="text-stone-500 text-[10px] ml-3">• {b}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Evidence Artifacts */}
                          {gate.evidenceArtifacts && gate.evidenceArtifacts.length > 0 && (
                            <div>
                              <h4 className="text-stone-300 text-xs uppercase tracking-wider font-medium mb-2">
                                Evidence Artifacts
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {gate.evidenceArtifacts.map((artifact: any, eIdx: number) => (
                                  <Badge key={eIdx} variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
                                    <FileText className="w-3 h-3 mr-1" />
                                    {artifact.label || artifact.id || artifact}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reference Library Tab ─────────────────────────── */}
      {activeTab === "references" && (
        <div>
          <div className="p-4 rounded-lg border border-stone-700 bg-stone-800/50 mb-6">
            <h2 className="text-lg font-serif text-white">Evidence Reference Library</h2>
            <p className="text-stone-400 text-sm mt-1">
              Sample templates, frameworks, and guides for each gate. Browse, download, customize for your deal, then upload as evidence.
            </p>
          </div>

          {/* Gate filter pills */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            <button
              onClick={() => setRefGateFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                !refGateFilter ? "bg-amber-600 text-white" : "bg-stone-800 text-stone-400 hover:text-white"
              }`}
            >
              All Gates
            </button>
            {["G0","G1","G2","G3","G4","G5","G6","G7"].map((g) => (
              <button
                key={g}
                onClick={() => setRefGateFilter(refGateFilter === g ? null : g)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  refGateFilter === g ? "bg-amber-600 text-white" : "bg-stone-800 text-stone-400 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {refLoading ? (
            <div className="text-stone-500 text-center py-12">Loading reference library...</div>
          ) : refTemplates.length === 0 ? (
            <div className="text-stone-500 text-center py-12">No reference templates available.</div>
          ) : (
            <div className="space-y-2">
              {(refGateFilter ? refTemplates.filter((t: any) => t.gateCode === refGateFilter) : refTemplates)
                .map((tmpl: any) => {
                  const isExpanded = expandedRef === tmpl.id;
                  const categoryColors: Record<string, string> = {
                    template: "text-amber-400 border-amber-600/30",
                    framework: "text-blue-400 border-blue-600/30",
                    guide: "text-green-400 border-green-600/30",
                    checklist: "text-teal-400 border-teal-600/30",
                    model: "text-purple-400 border-purple-600/30",
                  };
                  const catStyle = categoryColors[tmpl.category] || "text-stone-400 border-stone-600";

                  return (
                    <div key={tmpl.id} className="border border-stone-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedRef(isExpanded ? null : tmpl.id)}
                        className="w-full flex items-center justify-between p-4 bg-stone-800/50 hover:bg-stone-800 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-amber-400 text-xs font-bold w-7">{tmpl.gateCode}</span>
                          <span className="text-white text-sm font-medium">{tmpl.name}</span>
                          <Badge variant="outline" className={`text-[10px] capitalize ${catStyle}`}>
                            {tmpl.category}
                          </Badge>
                          {tmpl.templateBlobUrl && (
                            <Badge className="bg-green-900/30 text-green-400 text-[10px]">
                              Download Available
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-stone-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-stone-700/50 space-y-4">
                          {/* Description */}
                          <p className="text-stone-300 text-sm leading-relaxed">{tmpl.description}</p>

                          {/* Sections / Outline */}
                          {tmpl.sections && tmpl.sections.length > 0 && (
                            <div>
                              <h4 className="text-stone-300 text-xs uppercase tracking-wider font-medium mb-2">
                                Recommended Sections
                              </h4>
                              <div className="space-y-2">
                                {tmpl.sections.map((sec: any, idx: number) => (
                                  <div key={idx} className="bg-stone-900 rounded p-3 border border-stone-700/50">
                                    <span className="text-white text-sm font-medium">{sec.heading}</span>
                                    <p className="text-stone-400 text-xs mt-1 leading-relaxed">{sec.guidance}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quality Criteria */}
                          {tmpl.qualityCriteria && (
                            <div className="bg-amber-900/10 border border-amber-800/20 rounded-lg p-3">
                              <span className="text-amber-400 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                                <Target className="w-3 h-3" />
                                Quality Criteria
                              </span>
                              <p className="text-stone-300 text-xs mt-1.5 leading-relaxed">{tmpl.qualityCriteria}</p>
                            </div>
                          )}

                          {/* Download link (when template file exists) */}
                          {tmpl.templateBlobUrl && (
                            <a
                              href={tmpl.templateBlobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Download Template
                              {tmpl.fileType && <span className="text-amber-200 text-[10px] uppercase">({tmpl.fileType})</span>}
                            </a>
                          )}

                          {/* Tags */}
                          {tmpl.tags && tmpl.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {tmpl.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-500">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Articles Tab ────────────────────────────────────── */}
      {activeTab === "articles" && <>
      {/* Search + Category Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="bg-stone-800 border-stone-700 text-white pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              !activeCategory
                ? "bg-amber-600 text-white"
                : "bg-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
                  activeCategory === key
                    ? "bg-amber-600 text-white"
                    : "bg-stone-800 text-stone-400 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles grouped by category */}
      {loading ? (
        <div className="text-stone-500 text-center py-12">Loading knowledge base...</div>
      ) : filtered.length === 0 ? (
        <div className="text-stone-500 text-center py-12">
          No articles match your search.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, articles]) => {
            const cat = CATEGORY_CONFIG[category];
            const CatIcon = cat?.icon || BookOpen;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className="w-4 h-4 text-stone-500" />
                  <h2 className="text-stone-300 text-sm font-medium uppercase tracking-wider">
                    {cat?.label || category}
                  </h2>
                  <Badge variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
                    {articles.length}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="text-left p-4 rounded-lg border border-stone-700 bg-stone-800/50 hover:bg-stone-800 hover:border-stone-600 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="text-white font-medium text-sm group-hover:text-amber-300 transition-colors">
                          {article.title}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-stone-400 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-stone-400 text-xs mt-1.5 leading-relaxed line-clamp-2">
                        {article.summary}
                      </p>
                      {article.relatedGates.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {article.relatedGates.map((g) => (
                            <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-500">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
}

// ── Static articles for POC demo ───────────────────────────────
// In production these come from the API / knowledge_base_articles table

const STATIC_ARTICLES: KBArticle[] = [
  {
    id: "kb-1",
    title: "Understanding the 8-Gate Waterfall",
    slug: "understanding-8-gate-waterfall",
    category: "methodology",
    summary: "An overview of AMP's structured evaluation methodology and how targets progress from universe qualification through IC decision.",
    content: "# The 8-Gate Waterfall\n\nAMP evaluates acquisition targets through an 8-gate waterfall methodology. Each gate examines a distinct aspect of the target, building a comprehensive picture that culminates in an Investment Committee recommendation.\n\n## Gate Sequence\n\n**G0 — Universe Qualification** is a binary pass/fail filter. Targets that fail any dimension are removed from the pipeline immediately.\n\n**G1 — Strategic Alignment** maps the target against the acquirer's strategic model. This is where thesis fit, capability gaps, and competitive optionality are assessed.\n\n**G2 — Market & Competitive Position** evaluates the structural attractiveness of the target's market and its competitive positioning within it.\n\n**G3 — Business Model Compatibility** surfaces reinforcements, extensions, and conflicts between the acquirer's and target's business models.\n\n**G4 — Financial Profile & Valuation** is where the numbers tell their story. Different analytical modules are available depending on the target type.\n\n**G5 — Operational & Integration** assesses the complexity and cost of integrating the target.\n\n**G6 — Risk Assessment** systematically identifies and quantifies material risks.\n\n**G7 — IC Decision** synthesizes all prior gate outputs into a unified recommendation: PURSUE, CONDITIONAL, or PASS.",
    relatedGates: ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"],
    authorName: "Alio Foundry",
    publishedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "kb-2",
    title: "How Evaluation Lenses Work",
    slug: "how-evaluation-lenses-work",
    category: "methodology",
    summary: "Evaluation lenses provide multiple analytical frameworks for each dimension. Where lenses converge, confidence is high. Where they diverge, investigate.",
    content: "# Multi-Lens Evaluation\n\nEach dimension in AMP can be evaluated through multiple lenses — structured analytical frameworks that examine the same question from different angles.\n\n## Why Multiple Lenses?\n\nA single analytical framework always has blind spots. A DCF valuation ignores what the market is willing to pay. Comparable transactions are backward-looking. An LBO model is leverage-dependent. By evaluating through multiple lenses and observing where they converge or diverge, you build a more robust assessment.\n\n## Convergence and Divergence\n\n**Strong convergence** means all lenses point to a similar score range. You can score with high confidence.\n\n**Partial convergence** means most lenses agree but one diverges. The divergent lens is highlighted — investigate why it sees something different.\n\n**Divergence** means lenses produce materially different assessments. This is valuable information, not a problem to solve. Document your reasoning for weighting one lens over another.\n\n## Per-Lens Notes\n\nYou can record observations for each lens without affecting the overall dimension score. These notes appear in the IC scorecard export and become part of the institutional evaluation record.",
    relatedGates: ["G1", "G4", "G6"],
    authorName: "Alio Foundry",
    publishedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "kb-3",
    title: "Scoring Consistency: Using Rubric Anchors",
    slug: "scoring-consistency-rubric-anchors",
    category: "scoring_playbook",
    summary: "How to use the 5-point rubric anchor system to ensure scoring consistency across analysts and deals.",
    content: "# Rubric-Anchored Scoring\n\nEvery dimension in AMP uses a 5-point rubric anchor system (0, 3, 5, 7, 10) to ensure scoring consistency.\n\n## The Anchor Scale\n\n| Score | Meaning | When to Use |\n| --- | --- | --- |\n| 10 | Exceptional | Target exceeds all criteria; best-in-class |\n| 7 | Strong | Clear strength with minor gaps |\n| 5 | Adequate | Meets threshold; satisfactory but not differentiating |\n| 3 | Weak | Material concerns requiring mitigation |\n| 0 | Fail | Fundamental issue; may block deal progression |\n\n## Half-Point Increments\n\nYou can score at 0.5 increments (e.g., 6.5) when the target falls between two anchors. Always reference the nearest anchor in your rationale.\n\n## Writing Good Rationale\n\nA strong rationale:\n- References the specific rubric anchor the score maps to\n- Cites evidence from uploaded documents\n- Notes which evaluation lenses informed the assessment\n- Acknowledges uncertainty where evidence is limited",
    relatedGates: [],
    authorName: "Alio Foundry",
    publishedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "kb-4",
    title: "Gate Crystallization: How Immutability Works",
    slug: "gate-crystallization",
    category: "methodology",
    summary: "When a gate passes dual authorization, its methodology and scores are crystallized. Here's how it works and how to break the crystal when needed.",
    content: "# Gate Crystallization\n\nWhen a gate evaluation passes dual authorization (two independent approvals with no rejections), it crystallizes. This means the entire evaluation — the module selection, dimensions, scores, lens notes, weights, and methodology version — is frozen.\n\n## Why Crystallize?\n\nA deal evaluation that takes 4 months should produce consistent results. If the methodology template is updated in month 3, gates scored in month 1 should not retroactively change. Crystallization ensures that each gate is evaluated against the methodology that was current when it was scored.\n\n## What Freezes\n\n- The selected evaluation module and its dimensions\n- All dimension scores and rationale\n- All lens notes and observations\n- The effective weights at time of scoring\n- The tolerance thresholds (minimum score, decline threshold)\n- The template version\n\n## Breaking the Crystal\n\nIn rare cases, material new information may require re-evaluating a crystallized gate. An admin can break the crystal, which:\n- Records the full prior state (scores, approvals, methodology) in a permanent audit log\n- Resets the gate to \"in progress\"\n- Deletes existing approvals — the gate needs fresh dual authorization\n- Creates an audit entry documenting who broke it and why\n\nBreaking crystal requires a written justification of at least 20 characters.",
    relatedGates: [],
    authorName: "Alio Foundry",
    publishedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "kb-5",
    title: "G4 Module Selection Guide",
    slug: "g4-module-selection-guide",
    category: "gate_deep_dive",
    summary: "How to choose between Standard Financial, High-Growth SaaS, and Distressed modules when evaluating a target's financial profile.",
    content: "# Choosing the Right G4 Module\n\nGate 4 offers three analytical modules, each designed for a different target profile. Choosing the right module is critical — it determines which dimensions, rubrics, and lenses are available.\n\n## Standard Financial Analysis\n\nUse for: Mature businesses with 3+ years of audited financials, positive EBITDA, and established revenue streams.\n\nDimensions: Revenue Quality, Growth Profile, Margin Profile, Valuation Attractiveness, Synergy Potential.\n\nThis is the default module and appropriate for most lower-middle-market acquisitions.\n\n## High-Growth SaaS Analysis\n\nUse for: SaaS, subscription, or usage-based revenue model targets growing >20% with negative or thin EBITDA.\n\nDimensions: Unit Economics, Net Revenue Retention, ARR Growth & Quality, Gross Margin & Capital Efficiency, TAM Penetration & Runway, Valuation (SaaS Multiples).\n\nTraditional EBITDA-based analysis misses the real story for these businesses. This module focuses on the metrics that actually matter: NRR, LTV/CAC, and capital efficiency.\n\n## Distressed / Special Situations\n\nUse for: Targets in financial distress, turnaround situations, or where the investment thesis is asset-focused rather than earnings-focused.\n\nDimensions: Asset Recovery Value, Working Capital Position, Restructuring Feasibility, Creditor & Stakeholder Complexity.\n\nThis module inverts the normal evaluation logic — the question isn't 'how much is this business worth as a going concern?' but 'what happens if the turnaround fails?'",
    relatedGates: ["G4"],
    authorName: "Alio Foundry",
    publishedAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "kb-6",
    title: "The Fund Thesis Alignment Lens",
    slug: "fund-thesis-alignment-lens",
    category: "lens_library",
    summary: "How to evaluate whether a target fits your fund's investment thesis using the Fund Thesis Alignment lens at G1.",
    content: "# Fund Thesis Alignment Lens\n\nThis is typically the first lens applied at G1 — Strategic Alignment. It asks a simple but foundational question: does this target advance the fund thesis, or is it a distraction?\n\n## When to Apply\n\nApply this lens to every target at G1. It's a default lens for the PE Platform Build template.\n\n## Key Questions\n\n- Does this target directly address the capability gap or market position identified in the fund thesis?\n- Would an LP looking at this deal immediately understand why it fits the portfolio?\n- Is this a Horizon 1 (core), Horizon 2 (emerging), or Horizon 3 (options) investment?\n- If the thesis changed, would this target still be attractive?\n\n## Calibration\n\n- Score 10: Target is a textbook fit for the fund thesis\n- Score 7: Strong fit with minor thesis stretching\n- Score 5: Fits broadly but requires narrative work\n- Score 3: Thesis fit is a stretch; primarily opportunistic\n- Score 0: No clear thesis connection\n\n## Blind Spots\n\nThis lens can create confirmation bias — you may score a target high on thesis fit simply because you want it to fit. Cross-reference with the Competitive Denial and Portfolio Construction lenses.",
    relatedGates: ["G1"],
    authorName: "Alio Foundry",
    publishedAt: "2025-01-15T00:00:00Z",
  },
];

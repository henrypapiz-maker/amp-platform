"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, CheckCircle, Circle, Clock, XCircle,
  ChevronRight, ChevronDown, FileText, Scale, BarChart3,
  Weight, Plus, Link2, Database, FileIcon, Trash2,
  AlertTriangle, ThumbsUp, ThumbsDown, Info,
  BookOpen, ShieldCheck, Users
} from "lucide-react";
import { GATES, type GateDefinition } from "@/lib/gates";
import { hasPermission } from "@/lib/permissions";
import { HelpTip, TabHelp } from "@/components/ui/help-tip";
import ModuleSelection from "@/components/evaluation/ModuleSelection";
import { GateStatusBar } from "@/components/evaluation/CrystallizationUI";

// ── Types ──────────────────────────────────────────────────────
type DimScore = {
  id: string;
  dimensionName: string;
  score: string | null;
  rationale: string | null;
};

type EvidenceItem = {
  id: string;
  evidenceArtifactId: string;
  label: string;
  linkType: string;
  ref: string;
  fileSize: string | null;
  note: string | null;
  extension: string | null;
};

type Evaluation = {
  id: string;
  gateCode: string;
  gateStatus: string;
  compositeScore: string | null;
  evaluatedAt: string | null;
  notes: string | null;
  scores: DimScore[];
  evidence: EvidenceItem[];
};

type TargetDetail = {
  id: string;
  name: string;
  sector: string | null;
  revenue: string | null;
  status: string;
  currentGate: number;
  compositeScore: string | null;
  outcome: string | null;
  notes: string | null;
  evaluations: Evaluation[];
};

type WeightInfo = {
  gateCode: string;
  dimensionName: string;
  baseWeight: number;
  personaAdj: number;
  personaReason: string | null;
  manualOverride: number | null;
  locked: boolean;
  effectiveWeight: number;
};

// ── Gate Status Helpers ────────────────────────────────────────
const gateStatusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  pending: { icon: <Circle className="w-4 h-4" />, label: "Not Started", color: "text-stone-500" },
  in_progress: { icon: <Clock className="w-4 h-4" />, label: "In Progress", color: "text-amber-400" },
  passed: { icon: <CheckCircle className="w-4 h-4" />, label: "Passed", color: "text-green-400" },
  failed: { icon: <XCircle className="w-4 h-4" />, label: "Failed", color: "text-red-400" },
};

// ── Main Page ──────────────────────────────────────────────────
export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [target, setTarget] = useState<TargetDetail | null>(null);
  const [activeGate, setActiveGate] = useState<string>("G0");
  const [weights, setWeights] = useState<WeightInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceArtifactId, setEvidenceArtifactId] = useState("");
  const [evidenceArtifactLabel, setEvidenceArtifactLabel] = useState("");
  // v2: module selection state
  const [showModuleSelect, setShowModuleSelect] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const canScore = hasPermission(role, "score_dimension");
  const canEditWeights = hasPermission(role, "edit_weights");
  const canUploadEvidence = hasPermission(role, "upload_evidence");

  const fetchTarget = useCallback(async () => {
    const res = await fetch(`/api/targets/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setTarget(data);
      if (!target && data.currentGate !== undefined) {
        setActiveGate(`G${data.currentGate}`);
      }
    }
    setLoading(false);
  }, [params.id]);

  const fetchWeights = useCallback(async () => {
    const res = await fetch("/api/weights");
    if (res.ok) setWeights(await res.json());
  }, []);

  useEffect(() => {
    fetchTarget();
    fetchWeights();
  }, [fetchTarget, fetchWeights]);

  async function startEvaluation(gateCode: string, moduleId?: string) {
    if (!moduleId) {
      // v2: show module selection UI first
      setShowModuleSelect(gateCode);
      return;
    }
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: params.id, gateCode, moduleId }),
    });
    if (res.ok) {
      setShowModuleSelect(null);
      fetchTarget();
    }
  }

  // v2: fallback for gates without modules — direct creation
  async function startEvaluationDirect(gateCode: string) {
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: params.id, gateCode }),
    });
    if (res.ok) fetchTarget();
  }

  async function saveScore(evaluationId: string, dimensionName: string, score: number, rationale: string) {
    setSaving(true);
    await fetch(`/api/evaluations/${evaluationId}/scores`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dimensionName, score, rationale }),
    });
    await fetchTarget();
    setSaving(false);
  }

  async function addEvidence(evaluationId: string, artifactId: string, data: {
    linkType: string; label: string; ref: string; note?: string;
  }) {
    await fetch("/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluationId, evidenceArtifactId: artifactId, ...data }),
    });
    await fetchTarget();
    setEvidenceDialogOpen(false);
  }

  async function deleteEvidence(evidenceId: string) {
    await fetch(`/api/evidence?id=${evidenceId}`, { method: "DELETE" });
    await fetchTarget();
  }

  async function updateGateStatus(evaluationId: string, status: string) {
    // Update the gate evaluation status and handle auto-progression
    await fetch(`/api/evaluations/${evaluationId}/scores`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _updateStatus: status }),
    });
    await fetchTarget();
  }

  if (loading) return <div className="text-stone-400 text-center py-12">Loading target...</div>;
  if (!target) return <div className="text-stone-400 text-center py-12">Target not found</div>;

  const currentGateDef = GATES.find((g) => g.code === activeGate);
  const currentEval = target.evaluations.find((e) => e.gateCode === activeGate);
  const gateWeights = weights.filter((w) => w.gateCode === activeGate);

  // Calculate how many gates have evaluations
  const evaluatedGates = GATES.map((g) => {
    const ev = target.evaluations.find((e) => e.gateCode === g.code);
    return { ...g, evaluation: ev };
  });

  return (
    <div>
      {/* ── Target Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-stone-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif text-white">{target.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {target.sector && <span className="text-stone-400 text-sm">{target.sector}</span>}
            {target.revenue && <span className="text-stone-400 text-sm">&middot; {target.revenue}</span>}
            <Badge variant="outline" className="border-amber-600/50 text-amber-400 text-xs">
              Current: G{target.currentGate}
            </Badge>
            <Badge variant="outline" className={`text-xs ${
              target.status === "inflight" ? "border-blue-500/50 text-blue-400" :
              target.status === "closed" ? "border-stone-500/50 text-stone-400" :
              "border-green-500/50 text-green-400"
            }`}>
              {target.status}
            </Badge>
            {target.compositeScore && (
              <span className="text-stone-300 text-sm font-mono">
                Composite: {Number(target.compositeScore).toFixed(0)}
              </span>
            )}
            {target.outcome && (
              <Badge className={`text-[10px] ${
                target.outcome === "pursue" ? "bg-green-900/50 text-green-400" :
                target.outcome === "conditional" ? "bg-yellow-900/50 text-yellow-400" :
                "bg-red-900/50 text-red-400"
              }`}>
                {target.outcome.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/export/${params.id}`)}
          className="border-stone-600 text-stone-300 hover:text-white hover:border-stone-500 shrink-0"
        >
          <FileText className="w-4 h-4 mr-1.5" />
          IC Scorecard
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Left: Gate Navigation ──────────────────────────── */}
        <div className="col-span-12 md:col-span-3">
          <Card className="bg-stone-800 border-stone-700 p-3">
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-xs text-stone-400 uppercase tracking-wider">8-Gate Waterfall</h3>
              <HelpTip title="Gate Navigation">
                <p>Click any gate to view its evaluation &mdash; you can navigate to previous or future gates regardless of the target&apos;s current position.</p>
                <p className="mt-1">Each gate can be independently started, scored, and reviewed. Gates don&apos;t need to be completed in order, but the IC Decision (G7) requires all prior gates to have a status.</p>
              </HelpTip>
            </div>
            <div className="space-y-0.5">
              {evaluatedGates.map((gate) => {
                const status = gate.evaluation?.gateStatus || "pending";
                const config = gateStatusConfig[status];
                const isActive = activeGate === gate.code;
                const hasScore = gate.evaluation?.compositeScore;
                return (
                  <button
                    key={gate.code}
                    onClick={() => setActiveGate(gate.code)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2.5 rounded-md text-left text-sm transition-all ${
                      isActive
                        ? "bg-stone-700 text-white ring-1 ring-amber-600/30"
                        : "text-stone-400 hover:text-white hover:bg-stone-700/50"
                    }`}
                  >
                    <span className={config.color}>{config.icon}</span>
                    <span className={`font-mono text-xs w-7 ${isActive ? "text-amber-400" : "text-stone-500"}`}>
                      {gate.code}
                    </span>
                    <span className="truncate flex-1 text-xs">{gate.name}</span>
                    {hasScore && (
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        Number(hasScore) >= 60 ? "bg-green-900/30 text-green-400" :
                        Number(hasScore) >= 40 ? "bg-amber-900/30 text-amber-400" :
                        "bg-red-900/30 text-red-400"
                      }`}>
                        {Number(hasScore).toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Gate Legend */}
            <div className="mt-4 pt-3 border-t border-stone-700 px-2 space-y-1">
              <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1.5">Legend</p>
              {Object.entries(gateStatusConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-[11px]">
                  <span className={val.color}>{val.icon}</span>
                  <span className="text-stone-500">{val.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: Gate Detail ──────────────────────────────── */}
        <div className="col-span-12 md:col-span-9">
          {currentGateDef && (
            <Card className="bg-stone-800 border-stone-700 p-6">
              {/* Gate Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif text-white">
                      {currentGateDef.code} — {currentGateDef.name}
                    </h2>
                    {currentEval && (
                      <Badge className={`text-[10px] ${
                        gateStatusConfig[currentEval.gateStatus]?.color || "text-stone-400"
                      } bg-transparent border border-current`}>
                        {gateStatusConfig[currentEval.gateStatus]?.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-stone-400 text-sm mt-1">{currentGateDef.purpose}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!currentEval && canScore && (
                    <Button
                      onClick={() => startEvaluation(currentGateDef.code)}
                      className="bg-amber-600 hover:bg-amber-700 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Start Evaluation
                    </Button>
                  )}
                </div>
              </div>

              {/* v2: Crystallization Status Bar */}
              {currentEval && (
                <GateStatusBar
                  gateCode={currentEval.gateCode}
                  gateStatus={currentEval.gateStatus}
                  isCrystallized={(currentEval as any).isCrystallized || false}
                  crystallizedAt={(currentEval as any).crystallizedAt}
                  moduleName={(currentEval as any).moduleName}
                  templateVersion={(currentEval as any).templateVersionSnapshot}
                  canBreakCrystal={role === "admin"}
                  evaluationId={currentEval.id}
                  onCrystalBroken={() => fetchTarget()}
                />
              )}

              {/* Gate Rule */}
              <div className="bg-stone-900/50 rounded-lg p-3 mb-4 text-sm text-stone-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-500 font-medium">Gate Rule: </span>
                  {currentGateDef.rule}
                </div>
              </div>

              {/* v2: Module Selection Dialog */}
              {showModuleSelect === currentGateDef.code && (
                <ModuleSelection
                  gateCode={currentGateDef.code}
                  gateName={currentGateDef.name}
                  onSelect={async (moduleId: string) => {
                    await startEvaluation(currentGateDef.code, moduleId);
                  }}
                  onCancel={() => setShowModuleSelect(null)}
                />
              )}

              {currentEval ? (
                <Tabs defaultValue="dimensions" className="mt-4">
                  <TabsList className="bg-stone-900 border border-stone-700">
                    <TabsTrigger value="dimensions" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
                      <Scale className="w-3.5 h-3.5 mr-1.5" />
                      Dimensions
                    </TabsTrigger>
                    <TabsTrigger value="evidence" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Evidence
                      <span className="ml-1 text-[10px] text-stone-500">
                        ({currentEval.evidence.length})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="weights" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
                      <Weight className="w-3.5 h-3.5 mr-1.5" />
                      Weights
                    </TabsTrigger>
                    <TabsTrigger value="approval" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                      Approval
                    </TabsTrigger>
                    <TabsTrigger value="methodology" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Methodology
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      Overview
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Dimensions Tab ────────────────────────── */}
                  <TabsContent value="dimensions" className="mt-4 space-y-3">
                    <TabHelp>
                      Score each dimension against the rubric anchors (0-10 scale). Click a dimension to expand
                      its rubric definition, enter your score, and provide a brief rationale. The gate composite
                      score updates automatically as you score each dimension.
                    </TabHelp>
                    {currentGateDef.dimensions.map((dim) => {
                      const dimScore = currentEval.scores.find((s) => s.dimensionName === dim.name);
                      const dimWeight = gateWeights.find((w) => w.dimensionName === dim.name);
                      return (
                        <DimensionCard
                          key={dim.name}
                          dimension={dim}
                          score={dimScore}
                          weight={dimWeight}
                          evaluationId={currentEval.id}
                          gateType={currentGateDef.type}
                          canScore={canScore}
                          onSave={saveScore}
                          saving={saving}
                        />
                      );
                    })}

                    {/* Composite Score + Gate Actions */}
                    <GateScorePanel
                      evaluation={currentEval}
                      gateDef={currentGateDef}
                      canScore={canScore}
                    />
                  </TabsContent>

                  {/* ── Evidence Tab ──────────────────────────── */}
                  <TabsContent value="evidence" className="mt-4">
                    <TabHelp>
                      Attach supporting documents and references for this gate. Each artifact type is
                      defined by the methodology. Click &quot;+ Attach&quot; to add a URL, database reference,
                      file path, or network share. All attachments are recorded in the audit trail.
                    </TabHelp>
                    <div className="space-y-3">
                      {currentGateDef.evidenceArtifacts.map((artifact) => {
                        const linked = currentEval.evidence.filter(
                          (e) => e.evidenceArtifactId === artifact.id
                        );
                        return (
                          <div key={artifact.id} className="bg-stone-900 rounded-lg border border-stone-700 overflow-hidden">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-stone-500" />
                                <span className="text-stone-200 text-sm font-medium">{artifact.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {linked.length > 0 ? (
                                  <Badge className="bg-green-900/30 text-green-400 border-green-800 text-xs">
                                    {linked.length} attached
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-stone-600 text-stone-500 text-xs">
                                    No attachments
                                  </Badge>
                                )}
                                {canUploadEvidence && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-amber-400 hover:text-amber-300 h-7 text-xs"
                                    onClick={() => {
                                      setEvidenceArtifactId(artifact.id);
                                      setEvidenceArtifactLabel(artifact.label);
                                      setEvidenceDialogOpen(true);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Attach
                                  </Button>
                                )}
                              </div>
                            </div>
                            {linked.length > 0 && (
                              <div className="border-t border-stone-700/50 divide-y divide-stone-700/30">
                                {linked.map((ev) => (
                                  <div key={ev.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-stone-800/50">
                                    <EvidenceTypeIcon type={ev.linkType} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-stone-300 truncate">{ev.label}</p>
                                      <p className="text-stone-500 text-xs truncate">{ev.ref}</p>
                                      {ev.note && <p className="text-stone-500 text-xs mt-0.5 italic">{ev.note}</p>}
                                    </div>
                                    {canUploadEvidence && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-stone-500 hover:text-red-400 h-7 w-7 p-0"
                                        onClick={() => deleteEvidence(ev.id)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* ── Weights Tab ───────────────────────────── */}
                  <TabsContent value="weights" className="mt-4">
                    <div className="space-y-3">
                      <p className="text-stone-400 text-xs mb-2">
                        Dimension weights are influenced by the acquirer persona configuration. Admin can manually override.
                      </p>
                      {currentGateDef.dimensions.map((dim) => {
                        const w = gateWeights.find((gw) => gw.dimensionName === dim.name);
                        if (!w) return null;
                        return (
                          <div key={dim.name} className="bg-stone-900 rounded-lg border border-stone-700 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-stone-200 text-sm font-medium">{dim.name}</span>
                              <span className="text-amber-400 font-mono text-sm font-bold">
                                {w.effectiveWeight.toFixed(0)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-stone-500">Base</span>
                                <p className="text-stone-300 font-mono">{w.baseWeight}%</p>
                              </div>
                              <div>
                                <span className="text-stone-500">Persona Adj.</span>
                                <p className={`font-mono ${w.personaAdj > 0 ? "text-green-400" : w.personaAdj < 0 ? "text-red-400" : "text-stone-400"}`}>
                                  {w.personaAdj > 0 ? "+" : ""}{w.personaAdj}%
                                </p>
                                {w.personaReason && (
                                  <p className="text-stone-500 text-[10px] italic mt-0.5">{w.personaReason}</p>
                                )}
                              </div>
                              <div>
                                <span className="text-stone-500">Override</span>
                                <p className="text-stone-300 font-mono">
                                  {w.manualOverride !== null ? `${w.manualOverride}%` : "—"}
                                </p>
                                {w.locked && (
                                  <span className="text-amber-500 text-[10px]">Locked</span>
                                )}
                              </div>
                            </div>
                            {/* Weight bar */}
                            <div className="mt-2 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500/70 rounded-full transition-all"
                                style={{ width: `${(w.effectiveWeight / 50) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* ── Approval Tab ────────────────────────── */}
                  <TabsContent value="approval" className="mt-4">
                    <GateApprovalPanel
                      evaluationId={currentEval.id}
                      gateCode={currentGateDef.code}
                      gateName={currentGateDef.name}
                      compositeScore={currentEval.compositeScore}
                      gateStatus={currentEval.gateStatus}
                      canApprove={hasPermission(role, "approve_gate") || hasPermission(role, "score_dimension")}
                      currentUserId={(session?.user as any)?.id}
                      onApprovalSubmitted={fetchTarget}
                    />
                  </TabsContent>

                  {/* ── Methodology Tab ───────────────────────── */}
                  <TabsContent value="methodology" className="mt-4">
                    <ScoringMethodology
                      gateDef={currentGateDef}
                      gateWeights={gateWeights}
                    />
                  </TabsContent>

                  {/* ── Overview Tab ──────────────────────────── */}
                  <TabsContent value="overview" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Status" value={currentEval.gateStatus.replace("_", " ")} />
                        <StatCard
                          label="Scored"
                          value={`${currentEval.scores.filter((s) => s.score !== null).length} / ${currentGateDef.dimensions.length}`}
                        />
                        <StatCard label="Evidence" value={`${currentEval.evidence.length} items`} />
                        <StatCard
                          label="Composite"
                          value={currentEval.compositeScore ? Number(currentEval.compositeScore).toFixed(1) : "—"}
                        />
                      </div>

                      {/* Per-dimension summary */}
                      <div className="bg-stone-900 rounded-lg border border-stone-700 overflow-hidden">
                        <div className="px-3 py-2 border-b border-stone-700">
                          <span className="text-stone-400 text-xs uppercase tracking-wider">Dimension Summary</span>
                        </div>
                        <div className="divide-y divide-stone-700/30">
                          {currentGateDef.dimensions.map((dim) => {
                            const s = currentEval.scores.find((sc) => sc.dimensionName === dim.name);
                            const w = gateWeights.find((gw) => gw.dimensionName === dim.name);
                            const scoreVal = s?.score ? Number(s.score) : null;
                            return (
                              <div key={dim.name} className="flex items-center gap-3 px-3 py-2">
                                <div className="flex-1">
                                  <span className="text-stone-300 text-sm">{dim.name}</span>
                                  {s?.rationale && (
                                    <p className="text-stone-500 text-xs truncate">{s.rationale}</p>
                                  )}
                                </div>
                                <span className="text-stone-500 text-xs font-mono">
                                  {w ? `${w.effectiveWeight.toFixed(0)}%` : `${dim.weight}%`}
                                </span>
                                <span className={`font-mono text-sm w-10 text-right ${
                                  scoreVal === null ? "text-stone-600" :
                                  scoreVal >= 7 ? "text-green-400" :
                                  scoreVal >= 5 ? "text-amber-400" :
                                  scoreVal >= 3 ? "text-orange-400" : "text-red-400"
                                }`}>
                                  {scoreVal !== null ? scoreVal.toFixed(1) : "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Gate notes */}
                      {target.notes && (
                        <div className="bg-stone-900 rounded-lg border border-stone-700 p-3">
                          <span className="text-stone-500 text-xs uppercase tracking-wider">Target Notes</span>
                          <p className="text-stone-300 text-sm mt-1">{target.notes}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <Circle className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400 mb-1">No evaluation started for {currentGateDef.code}</p>
                  <p className="text-stone-500 text-sm mb-4">
                    {currentGateDef.type === "binary"
                      ? "Run through pass/fail checks for each dimension."
                      : `Score ${currentGateDef.dimensions.length} dimensions against rubric anchors.`}
                  </p>
                  {canScore && (
                    <Button
                      onClick={() => startEvaluation(currentGateDef.code)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Start {currentGateDef.code} Evaluation
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Evidence Attachment Dialog ────────────────────────── */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="bg-stone-800 border-stone-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Attach Evidence</DialogTitle>
            <p className="text-stone-400 text-sm">{evidenceArtifactLabel}</p>
          </DialogHeader>
          <EvidenceForm
            evaluationId={currentEval?.id || ""}
            artifactId={evidenceArtifactId}
            artifactLabel={evidenceArtifactLabel}
            onSubmit={addEvidence}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-900 rounded-lg border border-stone-700 p-3">
      <span className="text-stone-500 text-xs">{label}</span>
      <p className="text-white font-medium capitalize mt-1">{value}</p>
    </div>
  );
}

// ── Evidence Type Icon ─────────────────────────────────────────
function EvidenceTypeIcon({ type }: { type: string }) {
  const iconClass = "w-4 h-4 shrink-0";
  switch (type) {
    case "url": return <Link2 className={`${iconClass} text-blue-400`} />;
    case "db": return <Database className={`${iconClass} text-purple-400`} />;
    case "file": return <FileIcon className={`${iconClass} text-green-400`} />;
    case "flatfile": return <FileText className={`${iconClass} text-orange-400`} />;
    default: return <FileText className={`${iconClass} text-stone-400`} />;
  }
}

// ── Evidence Attachment Form ───────────────────────────────────
function EvidenceForm({
  evaluationId, artifactId, artifactLabel, onSubmit,
}: {
  evaluationId: string;
  artifactId: string;
  artifactLabel: string;
  onSubmit: (evalId: string, artifactId: string, data: any) => void;
}) {
  const [linkType, setLinkType] = useState<string>("url");
  const [label, setLabel] = useState(artifactLabel);
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");

  const placeholders: Record<string, string> = {
    url: "https://docs.google.com/spreadsheets/d/...",
    db: "salesforce://opportunity/00123456",
    file: "evidence/precision-dynamics/cim-2025.pdf",
    flatfile: "\\\\server\\deals\\PD\\financials.xlsx",
  };

  return (
    <div className="space-y-3 mt-2">
      <div>
        <Label className="text-stone-300 text-xs">Attachment Type</Label>
        <Select value={linkType} onValueChange={setLinkType}>
          <SelectTrigger className="bg-stone-900 border-stone-600 text-white mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            <SelectItem value="url" className="text-white">URL / Link</SelectItem>
            <SelectItem value="db" className="text-white">Database Reference</SelectItem>
            <SelectItem value="file" className="text-white">File Upload</SelectItem>
            <SelectItem value="flatfile" className="text-white">Network File Path</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-stone-300 text-xs">Label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="bg-stone-900 border-stone-600 text-white mt-1"
        />
      </div>
      <div>
        <Label className="text-stone-300 text-xs">Reference</Label>
        <Input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={placeholders[linkType]}
          className="bg-stone-900 border-stone-600 text-white mt-1"
        />
      </div>
      <div>
        <Label className="text-stone-300 text-xs">Note (optional)</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional context about this evidence..."
          className="bg-stone-900 border-stone-600 text-white mt-1"
          rows={2}
        />
      </div>
      <Button
        className="w-full bg-amber-600 hover:bg-amber-700"
        disabled={!ref || !label}
        onClick={() => onSubmit(evaluationId, artifactId, { linkType, label, ref, note: note || undefined })}
      >
        Attach Evidence
      </Button>
    </div>
  );
}

// ── Gate Score Panel ───────────────────────────────────────────
function GateScorePanel({
  evaluation, gateDef, canScore,
}: {
  evaluation: Evaluation;
  gateDef: GateDefinition;
  canScore: boolean;
}) {
  if (!evaluation.compositeScore) return null;

  const score = Number(evaluation.compositeScore);
  const passed = gateDef.minimumScore ? score >= gateDef.minimumScore : true;
  const declined = gateDef.declineThreshold ? score < gateDef.declineThreshold : false;

  return (
    <div className="bg-stone-900 rounded-lg p-4 border border-stone-700 mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-stone-300 font-medium">Gate Composite Score</span>
        <span className={`text-2xl font-mono ${
          passed ? "text-green-400" : declined ? "text-red-400" : "text-amber-400"
        }`}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-stone-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${
            passed ? "bg-green-500" : declined ? "bg-red-500" : "bg-amber-500"
          }`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>
          {gateDef.minimumScore ? `Min: ${gateDef.minimumScore}` : "No minimum"} |
          {gateDef.declineThreshold ? ` Decline: <${gateDef.declineThreshold}` : " No auto-decline"}
        </span>
        <span className={`font-medium ${
          passed ? "text-green-400" : declined ? "text-red-400" : "text-amber-400"
        }`}>
          {passed ? "PASSES" : declined ? "DECLINE" : "REVIEW"}
        </span>
      </div>
    </div>
  );
}

// ── Dimension Scoring Card ────────────────────────────────────
function DimensionCard({
  dimension, score, weight, evaluationId, gateType, canScore, onSave, saving,
}: {
  dimension: GateDefinition["dimensions"][0];
  score: DimScore | undefined;
  weight: WeightInfo | undefined;
  evaluationId: string;
  gateType: string;
  canScore: boolean;
  onSave: (evalId: string, dimName: string, score: number, rationale: string) => void;
  saving: boolean;
}) {
  const [localScore, setLocalScore] = useState(score?.score ? Number(score.score) : 0);
  const [localRationale, setLocalRationale] = useState(score?.rationale || "");
  const [expanded, setExpanded] = useState(false);

  // Sync when parent data changes
  useEffect(() => {
    if (score?.score) setLocalScore(Number(score.score));
    if (score?.rationale) setLocalRationale(score.rationale);
  }, [score?.score, score?.rationale]);

  const isBinary = gateType === "binary";
  const hasBeenScored = score?.score !== null && score?.score !== undefined;
  const effectiveWeight = weight?.effectiveWeight || dimension.weight;

  return (
    <div className={`bg-stone-900 rounded-lg border overflow-hidden transition-colors ${
      hasBeenScored ? "border-stone-600" : "border-stone-700"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {hasBeenScored ? (
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-stone-600 shrink-0" />
          )}
          <span className="text-white font-medium text-sm">{dimension.name}</span>
          <Badge variant="outline" className="border-stone-600 text-stone-400 text-[10px]">
            {effectiveWeight.toFixed(0)}%
            {weight?.personaAdj ? (
              <span className={weight.personaAdj > 0 ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                ({weight.personaAdj > 0 ? "+" : ""}{weight.personaAdj})
              </span>
            ) : null}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {hasBeenScored && (
            <span className={`font-mono text-sm ${
              Number(score!.score) >= 7 ? "text-green-400" :
              Number(score!.score) >= 5 ? "text-amber-400" :
              Number(score!.score) >= 3 ? "text-orange-400" : "text-red-400"
            }`}>
              {isBinary ? (Number(score!.score) >= 1 ? "PASS" : "FAIL") : Number(score!.score).toFixed(1)}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-700/50 pt-3 space-y-3">
          {/* Test Guidance */}
          {dimension.testGuidance && (
            <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-3">
              <span className="text-blue-400 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Test Guidance
              </span>
              <p className="text-stone-300 text-xs mt-1.5 leading-relaxed">{dimension.testGuidance}</p>
            </div>
          )}

          {/* Acceptance Parameters */}
          {dimension.acceptanceParams && dimension.acceptanceParams.length > 0 && (
            <div className="bg-amber-900/10 border border-amber-800/20 rounded-lg p-3">
              <span className="text-amber-400 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Acceptance Parameters
              </span>
              <div className="mt-2 space-y-1.5">
                {dimension.acceptanceParams.map((param, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-stone-500 shrink-0 min-w-[120px]">{param.label}:</span>
                    <span className="text-stone-200 font-medium">{param.defaultValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rubric */}
          <div className="space-y-1.5">
            <span className="text-stone-500 text-xs uppercase tracking-wider">Rubric Anchors</span>
            {dimension.rubric.map((anchor) => (
              <div
                key={anchor.score}
                className={`flex items-start gap-2 text-xs rounded px-2 py-1 ${
                  hasBeenScored && Math.round(Number(score!.score)) === anchor.score
                    ? "bg-amber-900/20 border border-amber-700/30"
                    : ""
                }`}
              >
                <span className="font-mono text-stone-500 w-5 shrink-0 font-bold">{anchor.score}</span>
                <span className="text-stone-400">{anchor.label}</span>
              </div>
            ))}
          </div>

          {/* Score Input */}
          {canScore && (
            <div className="space-y-2 pt-2 border-t border-stone-700/30">
              {isBinary ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setLocalScore(1)}
                    className={`flex-1 ${localScore >= 1 ? "bg-green-700 hover:bg-green-800 text-white" : "bg-stone-700 text-stone-300 hover:bg-stone-600"}`}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1.5" />
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setLocalScore(0)}
                    className={`flex-1 ${localScore === 0 ? "bg-red-700 hover:bg-red-800 text-white" : "bg-stone-700 text-stone-300 hover:bg-stone-600"}`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1.5" />
                    Fail
                  </Button>
                </div>
              ) : (
                <div>
                  <Label className="text-stone-400 text-xs">Score (0–10)</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={localScore}
                      onChange={(e) => setLocalScore(Number(e.target.value))}
                      className="flex-1 accent-amber-500 h-2"
                    />
                    <span className="font-mono text-amber-400 text-lg w-10 text-right">{localScore}</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-stone-400 text-xs">Rationale</Label>
                <Textarea
                  value={localRationale}
                  onChange={(e) => setLocalRationale(e.target.value)}
                  placeholder="Brief rationale for this score..."
                  className="bg-stone-800 border-stone-600 text-white text-sm mt-1"
                  rows={2}
                />
              </div>

              <Button
                size="sm"
                disabled={saving}
                onClick={() => onSave(evaluationId, dimension.name, localScore, localRationale)}
                className="bg-amber-600 hover:bg-amber-700 text-sm"
              >
                {saving ? "Saving..." : hasBeenScored ? "Update Score" : "Save Score"}
              </Button>
            </div>
          )}

          {/* Show existing rationale for viewers */}
          {!canScore && score?.rationale && (
            <div className="pt-2 border-t border-stone-700/30">
              <span className="text-stone-500 text-xs">Rationale</span>
              <p className="text-stone-300 text-sm mt-1">{score.rationale}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Gate Approval Panel (Dual Authorization) ──────────────────
function GateApprovalPanel({
  evaluationId, gateCode, gateName, compositeScore, gateStatus,
  canApprove, currentUserId, onApprovalSubmitted,
}: {
  evaluationId: string;
  gateCode: string;
  gateName: string;
  compositeScore: string | null;
  gateStatus: string;
  canApprove: boolean;
  currentUserId: string;
  onApprovalSubmitted: () => void;
}) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rationale, setRationale] = useState("");

  const fetchApprovals = useCallback(async () => {
    const res = await fetch(`/api/evaluations/${evaluationId}/approve`);
    if (res.ok) {
      const data = await res.json();
      setApprovals(data.approvals);
      setConfig(data.config);
      setSummary(data.summary);
    }
    setLoading(false);
  }, [evaluationId]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  async function submitApproval(decision: string) {
    setSubmitting(true);
    const res = await fetch(`/api/evaluations/${evaluationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, rationale }),
    });
    if (res.ok) {
      setRationale("");
      await fetchApprovals();
      onApprovalSubmitted();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to submit approval");
    }
    setSubmitting(false);
  }

  const hasUserApproved = approvals.some((a) => a.userId === currentUserId);
  const isGatePassed = gateStatus === "passed";
  const isGateFailed = gateStatus === "failed";

  if (loading) return <div className="text-stone-500 text-sm py-4">Loading approvals...</div>;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={`rounded-lg p-4 border ${
        isGatePassed ? "bg-green-900/20 border-green-800" :
        isGateFailed ? "bg-red-900/20 border-red-800" :
        "bg-stone-900 border-stone-700"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${
              isGatePassed ? "text-green-400" : isGateFailed ? "text-red-400" : "text-amber-400"
            }`} />
            <div>
              <h3 className="text-white font-medium">
                {isGatePassed ? `${gateCode} Approved — Gate Passed` :
                 isGateFailed ? `${gateCode} Rejected — Gate Failed` :
                 `${gateCode} Dual Authorization Required`}
              </h3>
              <p className="text-stone-400 text-sm">
                {summary?.approveCount || 0} of {summary?.totalRequired || 2} approvals received
                {config?.approverRoles && (
                  <span className="text-stone-500"> · Authorized roles: {config.approverRoles.join(", ")}</span>
                )}
              </p>
            </div>
          </div>
          {compositeScore && (
            <div className="text-right">
              <span className="text-stone-500 text-xs">Composite</span>
              <p className={`font-mono text-lg ${
                Number(compositeScore) >= (config?.minimumScore || 60) ? "text-green-400" : "text-amber-400"
              }`}>
                {Number(compositeScore).toFixed(1)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tolerance Thresholds */}
      {config && (
        <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
          <h4 className="text-stone-300 text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Gate Passage Criteria
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-stone-800 rounded p-2">
              <span className="text-stone-500">Minimum Score</span>
              <p className="text-white font-mono mt-0.5">{config.minimumScore ?? "None"}</p>
            </div>
            <div className="bg-stone-800 rounded p-2">
              <span className="text-stone-500">Decline Threshold</span>
              <p className="text-white font-mono mt-0.5">&lt;{config.declineThreshold ?? "None"}</p>
            </div>
            <div className="bg-stone-800 rounded p-2">
              <span className="text-stone-500">Required Approvals</span>
              <p className="text-white font-mono mt-0.5">{config.requiredApprovals}</p>
            </div>
            <div className="bg-stone-800 rounded p-2">
              <span className="text-stone-500">Approver Roles</span>
              <p className="text-white mt-0.5 capitalize">{config.approverRoles?.join(", ")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Existing Approvals */}
      {approvals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-stone-400 text-xs uppercase tracking-wider">Approval Record</h4>
          {approvals.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 ${
              a.decision === "approve" ? "bg-green-900/10 border-green-800/30" :
              a.decision === "reject" ? "bg-red-900/10 border-red-800/30" :
              "bg-amber-900/10 border-amber-800/30"
            }`}>
              {a.decision === "approve" ? <ThumbsUp className="w-4 h-4 text-green-400 mt-0.5" /> :
               a.decision === "reject" ? <ThumbsDown className="w-4 h-4 text-red-400 mt-0.5" /> :
               <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${
                    a.decision === "approve" ? "bg-green-900/30 text-green-400" :
                    a.decision === "reject" ? "bg-red-900/30 text-red-400" :
                    "bg-amber-900/30 text-amber-400"
                  }`}>
                    {a.decision.toUpperCase()}
                  </Badge>
                  <span className="text-stone-500 text-xs">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                {a.rationale && <p className="text-stone-300 text-sm mt-1">{a.rationale}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Approval */}
      {canApprove && !hasUserApproved && !isGatePassed && !isGateFailed && (
        <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Submit Your Decision
          </h4>
          <div className="space-y-3">
            <div>
              <Label className="text-stone-400 text-xs">Rationale (recommended)</Label>
              <Textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Basis for your approval or rejection decision..."
                className="bg-stone-800 border-stone-600 text-white text-sm mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => submitApproval("approve")}
                disabled={submitting}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white"
              >
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                {submitting ? "Submitting..." : "Approve Gate Passage"}
              </Button>
              <Button
                onClick={() => submitApproval("reject")}
                disabled={submitting}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white"
              >
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
            </div>
            <p className="text-stone-500 text-xs">
              Gate advancement requires {summary?.totalRequired || 2} independent approvals.
              Any rejection blocks advancement. Your decision is recorded permanently in the audit trail.
            </p>
          </div>
        </div>
      )}

      {hasUserApproved && !isGatePassed && !isGateFailed && (
        <div className="bg-stone-900 rounded-lg border border-stone-600 p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-stone-300 text-sm">Your decision has been recorded.</p>
          <p className="text-stone-500 text-xs mt-1">
            Waiting for {(summary?.totalRequired || 2) - (summary?.approveCount || 0)} more approval(s).
          </p>
        </div>
      )}
    </div>
  );
}

// ── Scoring Methodology Panel ─────────────────────────────────
function ScoringMethodology({
  gateDef, gateWeights,
}: {
  gateDef: GateDefinition;
  gateWeights: WeightInfo[];
}) {
  return (
    <div className="space-y-4">
      {/* Composite Calculation */}
      <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          Composite Score Calculation
        </h3>
        <div className="text-stone-300 text-sm space-y-2">
          <p>
            The gate composite score is computed as a <strong className="text-white">weighted average</strong> of
            all dimension scores, normalized to a 0–100 scale:
          </p>
          <div className="bg-stone-800 rounded p-3 font-mono text-xs text-amber-400 border border-stone-700">
            Composite = Σ (dimension_score × effective_weight) / Σ effective_weight × 10
          </div>
          <p className="text-stone-400 text-xs">
            Dimension scores range 0–10 per rubric anchors. The composite is scaled to 0–100 for
            gate threshold comparison. Unscored dimensions are excluded from calculation until scored.
          </p>
        </div>
      </div>

      {/* Weight Methodology */}
      <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <Weight className="w-4 h-4 text-amber-400" />
          Weight Determination
        </h3>
        <div className="text-stone-300 text-sm space-y-2">
          <p>Each dimension&apos;s effective weight is determined by three layers:</p>
          <div className="space-y-1.5 ml-1">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0 w-4">1.</span>
              <div>
                <strong className="text-white">Base Weight</strong>
                <span className="text-stone-400"> — Default from gate definition methodology. Set by the AMP framework.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0 w-4">2.</span>
              <div>
                <strong className="text-white">Persona Adjustment</strong>
                <span className="text-stone-400"> — Automatic adjustment based on the acquirer persona. E.g., &quot;Capability Buy&quot; thesis adds +10% to G1 Capability Gap Fill.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0 w-4">3.</span>
              <div>
                <strong className="text-white">Manual Override</strong>
                <span className="text-stone-400"> — Admin can override any weight. Locked weights cannot be changed by persona adjustments.</span>
              </div>
            </div>
          </div>
          <div className="bg-stone-800 rounded p-3 font-mono text-xs text-amber-400 border border-stone-700">
            effective = manual_override ?? clamp(base + persona_adj, 5%, 50%)
          </div>
          <p className="text-stone-400 text-xs">
            Weights are clamped to a 5–50% range to prevent any single dimension from dominating
            or being effectively zeroed. The clamp is applied after persona adjustment but before manual override.
          </p>
        </div>
      </div>

      {/* Rubric Anchoring */}
      <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Rubric-Anchored Scoring
        </h3>
        <div className="text-stone-300 text-sm space-y-2">
          <p>
            Every dimension uses a <strong className="text-white">5-point rubric anchor</strong> system
            to ensure scoring consistency across analysts and deals:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-700">
                  <th className="text-left p-2 text-stone-400">Score</th>
                  <th className="text-left p-2 text-stone-400">Interpretation</th>
                  <th className="text-left p-2 text-stone-400">Use When</th>
                </tr>
              </thead>
              <tbody className="text-stone-400">
                <tr className="border-b border-stone-700/30">
                  <td className="p-2 font-mono text-green-400 font-bold">10</td>
                  <td className="p-2">Exceptional / Best-in-class</td>
                  <td className="p-2">Target exceeds all criteria for this dimension</td>
                </tr>
                <tr className="border-b border-stone-700/30">
                  <td className="p-2 font-mono text-green-400">7</td>
                  <td className="p-2">Strong / Above average</td>
                  <td className="p-2">Clear strength with minor gaps</td>
                </tr>
                <tr className="border-b border-stone-700/30">
                  <td className="p-2 font-mono text-amber-400">5</td>
                  <td className="p-2">Adequate / Meets threshold</td>
                  <td className="p-2">Satisfactory but not differentiating</td>
                </tr>
                <tr className="border-b border-stone-700/30">
                  <td className="p-2 font-mono text-orange-400">3</td>
                  <td className="p-2">Weak / Below standard</td>
                  <td className="p-2">Material concerns requiring mitigation</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono text-red-400">0</td>
                  <td className="p-2">Fail / Unacceptable</td>
                  <td className="p-2">Fundamental issue; may block deal progression</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-stone-400 text-xs">
            Analysts may score at half-point increments (e.g., 6.5) but should reference the nearest
            anchor as justification. The rubric text for each dimension is specific to the domain being evaluated.
          </p>
        </div>
      </div>

      {/* Gate Tolerance Rules */}
      <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Gate Passage Tolerances — {gateDef.code}
        </h3>
        <div className="text-stone-300 text-sm space-y-2">
          {gateDef.type === "binary" ? (
            <p>
              <strong className="text-white">Binary gate</strong> — all dimensions must pass. Any single failure
              removes the target from the pipeline. No composite score is calculated.
            </p>
          ) : gateDef.type === "decision" ? (
            <div className="space-y-1">
              <p><strong className="text-white">Decision gate</strong> — synthesizes all prior gate outputs.</p>
              <p>≥65 = <span className="text-green-400 font-medium">PURSUE</span> | 50–64 = <span className="text-amber-400 font-medium">CONDITIONAL</span> | &lt;50 = <span className="text-red-400 font-medium">PASS</span></p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-800 rounded p-3 border border-stone-700">
                  <span className="text-stone-500 text-xs">Minimum to Pass</span>
                  <p className="text-white font-mono text-lg mt-1">{gateDef.minimumScore ?? "—"}<span className="text-stone-500 text-sm">/100</span></p>
                  <p className="text-stone-500 text-xs mt-1">Below this → requires senior review</p>
                </div>
                <div className="bg-stone-800 rounded p-3 border border-stone-700">
                  <span className="text-stone-500 text-xs">Auto-Decline Below</span>
                  <p className="text-red-400 font-mono text-lg mt-1">{gateDef.declineThreshold ?? "—"}<span className="text-stone-500 text-sm">/100</span></p>
                  <p className="text-stone-500 text-xs mt-1">Below this → automatic decline recommendation</p>
                </div>
              </div>
              <p className="text-stone-400 text-xs">
                These thresholds can be configured per-organization by an admin. The defaults are set by
                the AMP methodology based on empirical M&amp;A evaluation patterns.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dual Authorization */}
      <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          Dual Authorization Protocol
        </h3>
        <div className="text-stone-300 text-sm space-y-2">
          <p>
            Advancing a target past any gate requires <strong className="text-white">independent approval
            from two authorized users</strong>. This ensures no single individual can advance a deal through
            the pipeline unilaterally.
          </p>
          <ul className="space-y-1 text-stone-400 text-xs ml-1">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Each approver submits independently — they cannot see other approvals until submitted</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>A single rejection by any approver blocks advancement and fails the gate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>All approval decisions are permanently recorded in the audit trail with rationale</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Required approval count and authorized roles are configurable per gate in Admin settings</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Current Gate Weight Summary */}
      {gateWeights.length > 0 && (
        <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            {gateDef.code} Effective Weight Distribution
          </h3>
          <div className="space-y-2">
            {gateWeights.map((w) => (
              <div key={w.dimensionName} className="flex items-center gap-3">
                <span className="text-stone-400 text-xs flex-1 truncate">{w.dimensionName}</span>
                <div className="w-32 h-2 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${w.personaAdj !== 0 ? "bg-amber-500" : "bg-stone-500"}`}
                    style={{ width: `${(w.effectiveWeight / 50) * 100}%` }}
                  />
                </div>
                <span className="text-stone-300 font-mono text-xs w-10 text-right">{w.effectiveWeight.toFixed(0)}%</span>
                {w.personaAdj !== 0 && (
                  <span className={`text-[10px] ${w.personaAdj > 0 ? "text-green-400" : "text-red-400"}`}>
                    ({w.personaAdj > 0 ? "+" : ""}{w.personaAdj})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

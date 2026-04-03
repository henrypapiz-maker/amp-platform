"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, User, FileText, GitBranch, Save,
  Target, Shield, TrendingUp, Layers, BarChart,
  Gauge, Crosshair, Upload, Trash2, AlertTriangle, FileIcon
} from "lucide-react";
import { toast } from "sonner";
import { hasPermission } from "@/lib/permissions";
import { getPersonaAdjustments, type PersonaAttributes } from "@/lib/weights";
import { PageHelp, TabHelp } from "@/components/ui/help-tip";

type PersonaConfig = PersonaAttributes & {
  id: string;
  orgId: string;
  primarySectors: string | null;
  updatedAt: string | null;
};

const thesisOptions = ["Capability Buy", "Market Extension", "Revenue Synergy", "Cost Synergy", "Platform Build", "Talent Acquisition"];
const horizonOptions = ["H1 — Defend & Extend Core", "H2 — Build Emerging Business", "H3 — Create Options on Future"];
const integrationOptions = ["Full Integration (100-Day)", "Partial Integration", "Standalone / Bolt-On"];
const riskOptions = ["Conservative", "Moderate", "Aggressive"];

export default function PersonaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Strategic documents
  const [docs, setDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const role = (session?.user as any)?.role;
  const canEdit = hasPermission(role, "edit_persona");

  const fetchPersona = useCallback(async () => {
    const res = await fetch("/api/persona");
    if (res.ok) {
      const data = await res.json();
      setPersona(data);
    }
    setLoading(false);
  }, []);

  const fetchDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch("/api/persona/documents");
      if (res.ok) setDocs(await res.json());
    } catch { /* ignore */ }
    setDocsLoading(false);
  }, []);

  useEffect(() => { fetchPersona(); fetchDocs(); }, [fetchPersona, fetchDocs]);

  async function handleDocUpload(file: File) {
    const ALLOWED = ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv", "png", "jpg", "jpeg", "txt"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED.includes(ext)) {
      toast.error(`File type .${ext} not allowed`);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large (max 25MB)");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/persona/documents", { method: "POST", body: formData });
    if (res.ok) {
      toast.success(`Uploaded — ${file.name}`);
      fetchDocs();
    } else {
      const err = await res.json();
      toast.error(err.error || "Upload failed");
    }
    setUploading(false);
  }

  async function deleteDoc(docId: string, filename: string) {
    const res = await fetch(`/api/persona/documents?id=${docId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Deleted — ${filename}`);
      fetchDocs();
    } else {
      toast.error("Delete failed");
    }
  }

  function updateField(field: string, value: any) {
    if (!persona) return;
    setPersona({ ...persona, [field]: value });
    setDirty(true);
  }

  async function savePersona() {
    if (!persona || !canEdit) return;
    setSaving(true);
    await fetch("/api/persona", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acquisitionThesis: persona.acquisitionThesis,
        horizonBias: persona.horizonBias,
        integrationPhilosophy: persona.integrationPhilosophy,
        riskTolerance: persona.riskTolerance,
        irrHurdle: persona.irrHurdle,
        processMaturity: persona.processMaturity,
        strategicClarity: persona.strategicClarity,
        primarySectors: persona.primarySectors,
      }),
    });
    setSaving(false);
    setDirty(false);
  }

  // Calculate live weight adjustments for the influence map
  const adjustments = persona ? getPersonaAdjustments(persona) : [];

  if (loading) return <div className="text-stone-400 text-center py-12">Loading persona...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-stone-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif text-white">Acquirer Persona</h1>
          <p className="text-stone-400 text-sm mt-1">
            Configure the acquisition identity that drives gate weight adjustments across all evaluations.
          </p>
        </div>
        {canEdit && dirty && (
          <Button onClick={savePersona} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <PageHelp>
        The acquirer persona defines your firm&apos;s strategic identity and directly influences how targets are evaluated.
        These attributes automatically adjust dimension weights across all gates &mdash; for example, a &quot;Capability Buy&quot;
        thesis increases weight on G1 Capability Gap Fill by +10%. Changes propagate immediately. View the
        <strong className="text-stone-300"> Influence Map</strong> tab to see active weight adjustments.
      </PageHelp>

      <Tabs defaultValue="profile">
        <TabsList className="bg-stone-800 border border-stone-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
            <User className="w-3.5 h-3.5 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="influence" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
            <GitBranch className="w-3.5 h-3.5 mr-1.5" />
            Influence Map
          </TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-stone-700 data-[state=active]:text-amber-400 text-stone-400">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ──────────────────────────────────── */}
        <TabsContent value="profile" className="mt-4">
          {persona ? (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Acquisition Thesis */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Acquisition Thesis</Label>
                </div>
                <Select value={persona.acquisitionThesis || ""} onValueChange={(v) => updateField("acquisitionThesis", v)} disabled={!canEdit}>
                  <SelectTrigger className="bg-stone-900 border-stone-600 text-white"><SelectValue placeholder="Select thesis..." /></SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    {thesisOptions.map((o) => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-stone-500 text-xs mt-2">Primary strategic rationale for acquisitions.</p>
              </Card>

              {/* Horizon Bias */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Horizon Bias</Label>
                </div>
                <Select value={persona.horizonBias || ""} onValueChange={(v) => updateField("horizonBias", v)} disabled={!canEdit}>
                  <SelectTrigger className="bg-stone-900 border-stone-600 text-white"><SelectValue placeholder="Select horizon..." /></SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    {horizonOptions.map((o) => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-stone-500 text-xs mt-2">Time horizon preference for investment returns.</p>
              </Card>

              {/* Integration Philosophy */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Integration Philosophy</Label>
                </div>
                <Select value={persona.integrationPhilosophy || ""} onValueChange={(v) => updateField("integrationPhilosophy", v)} disabled={!canEdit}>
                  <SelectTrigger className="bg-stone-900 border-stone-600 text-white"><SelectValue placeholder="Select approach..." /></SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    {integrationOptions.map((o) => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-stone-500 text-xs mt-2">How acquired businesses are integrated post-close.</p>
              </Card>

              {/* Risk Tolerance */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Risk Tolerance</Label>
                </div>
                <Select value={persona.riskTolerance || ""} onValueChange={(v) => updateField("riskTolerance", v)} disabled={!canEdit}>
                  <SelectTrigger className="bg-stone-900 border-stone-600 text-white"><SelectValue placeholder="Select tolerance..." /></SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    {riskOptions.map((o) => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-stone-500 text-xs mt-2">Appetite for deal risk across legal, customer, key-person dimensions.</p>
              </Card>

              {/* IRR Hurdle */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">IRR Hurdle (1–5)</Label>
                </div>
                <Input
                  type="number" min={1} max={5}
                  value={persona.irrHurdle || ""}
                  onChange={(e) => updateField("irrHurdle", parseInt(e.target.value) || null)}
                  className="bg-stone-900 border-stone-600 text-white"
                  disabled={!canEdit}
                />
                <p className="text-stone-500 text-xs mt-2">1=Low bar (~15% IRR), 5=Very demanding (~30%+ IRR).</p>
              </Card>

              {/* Process Maturity */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Process Maturity (1–5)</Label>
                </div>
                <Input
                  type="number" min={1} max={5}
                  value={persona.processMaturity || ""}
                  onChange={(e) => updateField("processMaturity", parseInt(e.target.value) || null)}
                  className="bg-stone-900 border-stone-600 text-white"
                  disabled={!canEdit}
                />
                <p className="text-stone-500 text-xs mt-2">Acquirer&apos;s M&amp;A process sophistication.</p>
              </Card>

              {/* Strategic Clarity */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crosshair className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Strategic Clarity (1–5)</Label>
                </div>
                <Input
                  type="number" min={1} max={5}
                  value={persona.strategicClarity || ""}
                  onChange={(e) => updateField("strategicClarity", parseInt(e.target.value) || null)}
                  className="bg-stone-900 border-stone-600 text-white"
                  disabled={!canEdit}
                />
                <p className="text-stone-500 text-xs mt-2">How clearly the strategic plan is defined and documented.</p>
              </Card>

              {/* Primary Sectors */}
              <Card className="bg-stone-800 border-stone-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-amber-400" />
                  <Label className="text-stone-200 font-medium">Primary Sectors</Label>
                </div>
                <Input
                  value={persona.primarySectors || ""}
                  onChange={(e) => updateField("primarySectors", e.target.value)}
                  placeholder="e.g., Industrial Mfg, Aerospace, Tech Services"
                  className="bg-stone-900 border-stone-600 text-white"
                  disabled={!canEdit}
                />
                <p className="text-stone-500 text-xs mt-2">Target sectors for acquisition screening.</p>
              </Card>
            </div>
          ) : (
            <div className="text-stone-500 text-center py-8">No persona configured.</div>
          )}
        </TabsContent>

        {/* ── Influence Map Tab ─────────────────────────────── */}
        <TabsContent value="influence" className="mt-4">
          <Card className="bg-stone-800 border-stone-700 p-4">
            <h3 className="text-white font-medium mb-1">Active Weight Adjustments</h3>
            <p className="text-stone-400 text-sm mb-4">
              These adjustments are automatically applied to gate dimension weights based on the current persona configuration.
            </p>
            {adjustments.length > 0 ? (
              <div className="space-y-2">
                {adjustments.map((adj, i) => (
                  <div key={i} className="flex items-center gap-3 bg-stone-900 rounded-lg border border-stone-700 p-3">
                    <Badge variant="outline" className="border-amber-600/50 text-amber-400 text-xs font-mono shrink-0">
                      {adj.gateCode}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-stone-200 text-sm">{adj.dimensionName}</p>
                      <p className="text-stone-500 text-xs">{adj.reason}</p>
                    </div>
                    <span className={`font-mono text-sm font-bold ${adj.adjustment > 0 ? "text-green-400" : "text-red-400"}`}>
                      {adj.adjustment > 0 ? "+" : ""}{adj.adjustment}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-stone-500 text-center py-6 text-sm">
                No active persona adjustments. Configure profile attributes to see weight influences.
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Documents Tab ─────────────────────────────────── */}
        <TabsContent value="docs" className="mt-4">
          <Card className="bg-stone-800 border-stone-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-medium">Strategic Documents</h3>
                <p className="text-stone-400 text-sm mt-0.5">
                  Upload strategic memos, acquisition playbooks, and reference documents that define the investment thesis.
                </p>
              </div>
              <Badge variant="outline" className="border-stone-600 text-stone-500 text-xs">
                {docs.length} document{docs.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Drop zone */}
            {canEdit && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleDocUpload(f); }}
                onClick={() => document.getElementById("persona-doc-input")?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4 ${
                  dragOver ? "border-amber-500 bg-amber-900/10" : "border-stone-600 hover:border-stone-500 bg-stone-900/50"
                }`}
              >
                <input
                  id="persona-doc-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.png,.jpg,.jpeg,.txt"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); e.target.value = ""; }}
                />
                {uploading ? (
                  <div className="space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-stone-400 text-sm">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                    <p className="text-stone-300 text-sm">Drop files here or click to browse</p>
                    <p className="text-stone-500 text-[10px] mt-1">PDF, DOCX, XLSX, PPTX, CSV, PNG, JPG &middot; Max 25MB</p>
                  </>
                )}
              </div>
            )}

            {/* Document list */}
            {docsLoading ? (
              <p className="text-stone-500 text-sm text-center py-4">Loading documents...</p>
            ) : docs.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-4">
                No documents uploaded yet. Drop files above to get started.
              </p>
            ) : (
              <div className="space-y-1.5">
                {docs.map((doc: any) => {
                  const ext = doc.fileType?.toUpperCase() || doc.filename?.split(".").pop()?.toUpperCase() || "";
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-stone-900/50 border border-stone-700/50 hover:border-stone-600 transition-colors group">
                      <FileIcon className="w-5 h-5 text-stone-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {doc.blobUrl ? (
                          <a href={doc.blobUrl} target="_blank" rel="noopener noreferrer" className="text-white text-sm hover:text-amber-300 truncate block">
                            {doc.filename}
                          </a>
                        ) : (
                          <p className="text-white text-sm truncate">{doc.filename}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="border-stone-600 text-stone-500 text-[10px] uppercase">{ext}</Badge>
                          <span className="text-stone-500 text-[10px]">
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                          onClick={() => deleteDoc(doc.id, doc.filename)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

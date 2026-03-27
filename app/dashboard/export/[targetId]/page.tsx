"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, FileText } from "lucide-react";
import { GATES } from "@/lib/gates";

type Evaluation = {
  id: string;
  gateCode: string;
  gateStatus: string;
  compositeScore: string | null;
  scores: Array<{
    dimensionName: string;
    score: string | null;
    rationale: string | null;
  }>;
  evidence: Array<{
    label: string;
    linkType: string;
    ref: string;
  }>;
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

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [target, setTarget] = useState<TargetDetail | null>(null);
  const [persona, setPersona] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const [targetRes, personaRes] = await Promise.all([
      fetch(`/api/targets/${params.targetId}`),
      fetch("/api/persona"),
    ]);
    if (targetRes.ok) setTarget(await targetRes.json());
    if (personaRes.ok) setPersona(await personaRes.json());
    setLoading(false);
  }, [params.targetId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handlePrint() {
    window.print();
  }

  if (loading) return <div className="text-stone-400 text-center py-12">Loading export data...</div>;
  if (!target) return <div className="text-stone-400 text-center py-12">Target not found</div>;

  // Calculate G7 recommendation
  const g7Eval = target.evaluations.find((e) => e.gateCode === "G7");
  const overallScore = target.compositeScore ? Number(target.compositeScore) : null;
  const recommendation = overallScore !== null
    ? overallScore >= 65 ? "PURSUE" : overallScore >= 50 ? "CONDITIONAL" : "PASS"
    : target.outcome?.toUpperCase() || "PENDING";

  const recColor = recommendation === "PURSUE" ? "text-green-600" :
    recommendation === "CONDITIONAL" ? "text-amber-600" : "text-red-600";

  return (
    <div>
      {/* Screen-only header */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-stone-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif text-white">IC Scorecard Export</h1>
          <p className="text-stone-400 text-sm">{target.name}</p>
        </div>
        <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-700">
          <Printer className="w-4 h-4 mr-1.5" />
          Print / Save PDF
        </Button>
      </div>

      {/* Printable IC Scorecard */}
      <div ref={printRef} className="bg-white text-stone-900 rounded-lg overflow-hidden print:rounded-none print:shadow-none" style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div className="bg-stone-900 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">AMP</h1>
              <p className="text-stone-400 text-xs tracking-widest uppercase mt-1">Acquisition Management Platform</p>
            </div>
            <div className="text-right">
              <p className="text-stone-400 text-xs">Investment Committee Scorecard</p>
              <p className="text-white text-xs mt-0.5">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>

        {/* Target Summary */}
        <div className="px-8 py-6 border-b border-stone-200">
          <h2 className="text-xl font-serif font-bold text-stone-900">{target.name}</h2>
          <div className="flex gap-6 mt-2 text-sm text-stone-600">
            {target.sector && <span><strong>Sector:</strong> {target.sector}</span>}
            {target.revenue && <span><strong>Revenue:</strong> {target.revenue}</span>}
            <span><strong>Status:</strong> {target.status}</span>
            <span><strong>Current Gate:</strong> G{target.currentGate}</span>
          </div>
          {target.notes && (
            <p className="text-sm text-stone-500 mt-2 italic">{target.notes}</p>
          )}
        </div>

        {/* Recommendation Banner */}
        <div className={`px-8 py-4 border-b-2 ${
          recommendation === "PURSUE" ? "bg-green-50 border-green-500" :
          recommendation === "CONDITIONAL" ? "bg-amber-50 border-amber-500" :
          recommendation === "PASS" ? "bg-red-50 border-red-500" :
          "bg-stone-50 border-stone-300"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider">IC Recommendation</p>
              <p className={`text-2xl font-bold font-serif ${recColor}`}>{recommendation}</p>
            </div>
            {overallScore !== null && (
              <div className="text-right">
                <p className="text-xs text-stone-500">Composite Score</p>
                <p className={`text-3xl font-mono font-bold ${recColor}`}>{overallScore.toFixed(1)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Persona Context */}
        {persona && (
          <div className="px-8 py-4 border-b border-stone-200 bg-stone-50">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Acquirer Persona</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {persona.acquisitionThesis && (
                <div><span className="text-stone-400">Thesis:</span> <span className="text-stone-700 font-medium">{persona.acquisitionThesis}</span></div>
              )}
              {persona.horizonBias && (
                <div><span className="text-stone-400">Horizon:</span> <span className="text-stone-700 font-medium">{persona.horizonBias}</span></div>
              )}
              {persona.riskTolerance && (
                <div><span className="text-stone-400">Risk:</span> <span className="text-stone-700 font-medium">{persona.riskTolerance}</span></div>
              )}
              {persona.integrationPhilosophy && (
                <div><span className="text-stone-400">Integration:</span> <span className="text-stone-700 font-medium">{persona.integrationPhilosophy}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Gate-by-Gate Summary */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">Gate Evaluation Summary</h3>
          <div className="space-y-4">
            {GATES.map((gate) => {
              const eval_ = target.evaluations.find((e) => e.gateCode === gate.code);
              if (!eval_) {
                return (
                  <div key={gate.code} className="flex items-center gap-3 text-sm text-stone-400 py-2 border-b border-stone-100">
                    <span className="font-mono font-bold w-8">{gate.code}</span>
                    <span className="flex-1">{gate.name}</span>
                    <span className="text-xs italic">Not evaluated</span>
                  </div>
                );
              }

              const score = eval_.compositeScore ? Number(eval_.compositeScore) : null;
              const scoreColor = score !== null
                ? score >= (gate.minimumScore || 60) ? "text-green-700" : score >= (gate.declineThreshold || 40) ? "text-amber-700" : "text-red-700"
                : "text-stone-400";

              return (
                <div key={gate.code} className="border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm w-8 text-stone-900">{gate.code}</span>
                    <span className="flex-1 text-sm font-medium text-stone-800">{gate.name}</span>
                    <span className={`font-mono text-sm font-bold ${scoreColor}`}>
                      {score !== null ? score.toFixed(1) : "—"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      eval_.gateStatus === "passed" ? "bg-green-100 text-green-700" :
                      eval_.gateStatus === "failed" ? "bg-red-100 text-red-700" :
                      eval_.gateStatus === "in_progress" ? "bg-amber-100 text-amber-700" :
                      "bg-stone-100 text-stone-500"
                    }`}>
                      {eval_.gateStatus.replace("_", " ")}
                    </span>
                  </div>

                  {/* Dimension scores */}
                  {eval_.scores.filter((s) => s.score !== null).length > 0 && (
                    <div className="ml-11 mt-2 space-y-1">
                      {gate.dimensions.map((dim) => {
                        const dimScore = eval_.scores.find((s) => s.dimensionName === dim.name);
                        if (!dimScore?.score) return null;
                        const sv = Number(dimScore.score);
                        return (
                          <div key={dim.name} className="flex items-center gap-2 text-xs">
                            <span className="text-stone-500 flex-1">{dim.name} ({dim.weight}%)</span>
                            <span className={`font-mono font-bold ${
                              sv >= 7 ? "text-green-700" : sv >= 5 ? "text-amber-700" : sv >= 3 ? "text-orange-700" : "text-red-700"
                            }`}>{sv.toFixed(1)}</span>
                            {dimScore.rationale && (
                              <span className="text-stone-400 truncate max-w-48">— {dimScore.rationale}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Evidence count */}
                  {eval_.evidence.length > 0 && (
                    <div className="ml-11 mt-1 text-xs text-stone-400">
                      {eval_.evidence.length} evidence item{eval_.evidence.length !== 1 ? "s" : ""} attached
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-stone-200 bg-stone-50 text-xs text-stone-400">
          <div className="flex items-center justify-between">
            <div>
              <p>Generated by AMP — Acquisition Management Platform</p>
              <p>Alio Foundry &middot; {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p>Confidential — For authorized recipients only</p>
              <p>Prepared by: {session?.user?.name || "Unknown"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; max-width: none !important; }
          .bg-stone-900:not([class*="px-8"]) { background: white !important; }
        }
      `}</style>
    </div>
  );
}

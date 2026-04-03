"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2, TrendingUp, Briefcase, Home, Search,
  BarChart, ArrowRight, ArrowLeft, CheckCircle, Rocket,
} from "lucide-react";

// ── Archetype definitions ─────────────────────────────────────
const ARCHETYPES = [
  {
    id: "pe_platform",
    name: "PE Platform Build",
    icon: Building2,
    description: "Mid-market PE fund acquiring a platform company. Returns-focused with LBO modeling and exit optionality.",
    features: ["LBO returns analysis", "Management assessment", "Exit scenario modeling", "Add-on pipeline evaluation"],
    color: "amber",
  },
  {
    id: "pe_bolt_on",
    name: "PE Bolt-On / Roll-Up",
    icon: TrendingUp,
    description: "Portfolio company executing add-on acquisitions. Compressed diligence focused on synergy and integration speed.",
    features: ["Platform synergy mapping", "Known-system integration", "De-risked valuation", "Compressed timeline"],
    color: "amber",
  },
  {
    id: "corporate",
    name: "Corporate Strategic",
    icon: Briefcase,
    description: "Corp dev team doing capability or market acquisitions aligned to board-approved strategic plans.",
    features: ["Strategic plan traceability", "Board alignment gates", "Cultural fit emphasis", "Build vs. buy framework"],
    color: "blue",
  },
  {
    id: "family_office",
    name: "Family Office / HoldCo",
    icon: Home,
    description: "Permanent capital vehicle. Buy-and-hold underwriting focused on cash flow durability and operator quality.",
    features: ["Perpetual hold underwriting", "Cash flow waterfall", "Operator succession", "No exit assumptions"],
    color: "green",
  },
  {
    id: "search_fund",
    name: "Search Fund",
    icon: Search,
    description: "Independent searcher evaluating a single acquisition. Operator-market fit, SBA eligibility, and founder transition.",
    features: ["Operator-market fit", "SBA eligibility gates", "Founder knowledge transfer", "Personal investment decision"],
    color: "purple",
  },
  {
    id: "growth_equity",
    name: "Growth Equity",
    icon: BarChart,
    description: "Minority investment with path-to-control optionality. Unit economics, governance rights, and growth trajectory.",
    features: ["Unit economics focus", "Governance rights matrix", "Follow-on rights", "Path-to-control valuation"],
    color: "teal",
  },
];

const PERSONA_QUESTIONS: Record<string, Array<{
  key: string;
  label: string;
  type: "select" | "number" | "text";
  options?: string[];
  placeholder?: string;
  help?: string;
}>> = {
  pe_platform: [
    { key: "acquisitionThesis", label: "Fund Thesis", type: "select", options: ["Capability Buy", "Market Extension", "Revenue Synergy", "Cost Synergy", "Platform Build"], help: "Primary strategic rationale for acquisitions" },
    { key: "horizonBias", label: "Investment Horizon", type: "select", options: ["H1 — Defend & Extend Core", "H2 — Build Emerging Business", "H3 — Create Options on Future"], help: "Target hold period and return timeline" },
    { key: "riskTolerance", label: "Risk Tolerance", type: "select", options: ["Conservative", "Moderate", "Aggressive"], help: "Appetite for deal risk" },
    { key: "irrHurdle", label: "IRR Hurdle (1-5)", type: "number", placeholder: "3", help: "1=Low (~15%), 5=Very demanding (~30%+)" },
  ],
  search_fund: [
    { key: "acquisitionThesis", label: "Search Focus", type: "select", options: ["Industry Specialist", "Generalist Searcher", "Geographic Focus"], help: "Your search approach" },
    { key: "riskTolerance", label: "Personal Risk Tolerance", type: "select", options: ["Conservative", "Moderate", "Aggressive"], help: "How much personal capital are you comfortable risking?" },
    { key: "primarySectors", label: "Target Industries", type: "text", placeholder: "e.g., B2B Services, Light Manufacturing", help: "Industries you're searching in" },
    { key: "irrHurdle", label: "Min Cash-on-Cash Target (%)", type: "number", placeholder: "25", help: "Target annual cash-on-cash return by year 3" },
  ],
  pe_bolt_on: [
    { key: "platformCompanyName", label: "Platform Company Name", type: "text", placeholder: "e.g., Apex Industrial Group", help: "The platform company making bolt-on acquisitions" },
    { key: "synergyThesis", label: "Synergy Thesis", type: "select", options: ["Sector Consolidation", "Customer Consolidation", "Service Layering"], help: "Primary synergy strategy for bolt-ons" },
    { key: "integrationPhilosophy", label: "Integration Philosophy", type: "select", options: ["Full Integration", "Standalone", "Phased"], help: "How bolt-ons are integrated into the platform" },
    { key: "targetBoltOnCount", label: "Target # of Bolt-Ons (1-5)", type: "number", placeholder: "3", help: "How many bolt-ons does the platform plan to make?" },
    { key: "maxMultiple", label: "Max Entry Multiple", type: "text", placeholder: "e.g., 7x EBITDA", help: "Maximum acquisition multiple for bolt-ons" },
  ],
  corporate: [
    { key: "strategicJustification", label: "Strategic Rationale", type: "select", options: ["Vertical Integration", "Horizontal Expansion", "Adjacent Market", "Competitive Threat Denial"], help: "Primary strategic driver for this acquisition" },
    { key: "coreBusinessRelevance", label: "Core Business Relevance (1-5)", type: "number", placeholder: "4", help: "1=Tangential, 5=Core to strategy" },
    { key: "integrationComplexity", label: "Expected Integration Complexity", type: "select", options: ["Simple", "Moderate", "Complex"], help: "Anticipated integration difficulty" },
    { key: "regulatoryEnvironment", label: "Regulatory Scrutiny Level", type: "select", options: ["Low", "Moderate", "High"], help: "Expected level of regulatory review" },
  ],
  family_office: [
    { key: "holdingPeriod", label: "Expected Hold Period", type: "select", options: ["10-20 years", "20+ years", "Perpetual"], help: "How long will the family hold this asset?" },
    { key: "riskTolerance", label: "Risk Tolerance", type: "select", options: ["Very Conservative", "Conservative", "Moderate"], help: "Family's appetite for investment risk" },
    { key: "dividendExpectation", label: "Dividend / Distribution Needs", type: "select", options: ["Minimal (reinvest)", "Moderate (20%+)", "High (30%+)"], help: "Required annual cash distribution from this investment" },
    { key: "managementExpectation", label: "Management Continuity", type: "select", options: ["Founder must stay", "Founder + rollover", "Successor acceptable"], help: "Expectation for post-acquisition management" },
    { key: "governanceStructure", label: "Governance Structure", type: "select", options: ["Family board", "Professional board", "Advisory only"], help: "How will the family govern this business?" },
  ],
  growth_equity: [
    { key: "investmentStage", label: "Target Company Stage", type: "select", options: ["Early Growth", "Scaling", "Late Growth / Pre-IPO"], help: "Stage of target companies you invest in" },
    { key: "targetRevenueRange", label: "Target Revenue Range at Entry", type: "select", options: ["$5-20M", "$20-50M", "$50M+"], help: "Revenue range of target investments" },
    { key: "growthHurdle", label: "Minimum Revenue Growth", type: "select", options: ["20%+", "30%+", "40%+"], help: "Minimum acceptable revenue growth rate" },
    { key: "tamRequirement", label: "Minimum TAM Size", type: "select", options: ["$500M", "$1B", "$5B+"], help: "Minimum total addressable market" },
  ],
  // Default questions for archetypes without specific configs
  default: [
    { key: "acquisitionThesis", label: "Acquisition Thesis", type: "select", options: ["Capability Buy", "Market Extension", "Revenue Synergy", "Cost Synergy", "Platform Build", "Talent Acquisition"], help: "Primary strategic rationale" },
    { key: "horizonBias", label: "Investment Horizon", type: "select", options: ["H1 — Defend & Extend Core", "H2 — Build Emerging Business", "H3 — Create Options on Future"], help: "Return timeline expectation" },
    { key: "riskTolerance", label: "Risk Tolerance", type: "select", options: ["Conservative", "Moderate", "Aggressive"], help: "Appetite for deal risk" },
    { key: "primarySectors", label: "Target Sectors", type: "text", placeholder: "e.g., Industrial Mfg, Tech Services", help: "Industries you're focused on" },
  ],
};

// ── Steps ─────────────────────────────────────────────────────
type Step = "archetype" | "persona" | "target" | "complete";

export default function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("archetype");
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [persona, setPersona] = useState<Record<string, any>>({});
  const [target, setTarget] = useState({ name: "", sector: "", revenue: "" });
  const [loading, setLoading] = useState(false);

  const archetype = ARCHETYPES.find((a) => a.id === selectedArchetype);
  const questions = PERSONA_QUESTIONS[selectedArchetype || ""] || PERSONA_QUESTIONS.default;

  // ── Step 1: Archetype Selection ────────────────────────
  function renderArchetypeStep() {
    return (
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-white">What kind of acquirer are you?</h2>
          <p className="text-stone-400 text-sm mt-2">
            Select the archetype that best matches your acquisition approach.
            This loads a methodology template tuned to your evaluation needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARCHETYPES.map((arch) => {
            const Icon = arch.icon;
            const isSelected = selectedArchetype === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => setSelectedArchetype(arch.id)}
                className={`text-left p-5 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-amber-500 bg-stone-800 ring-1 ring-amber-500/30"
                    : "border-stone-700 bg-stone-800/50 hover:border-stone-600 hover:bg-stone-800"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-amber-600/20" : "bg-stone-700"
                  }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-amber-400" : "text-stone-400"}`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${isSelected ? "text-white" : "text-stone-200"}`}>
                      {arch.name}
                    </h3>
                  </div>
                </div>
                <p className="text-stone-400 text-xs leading-relaxed mb-3">{arch.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {arch.features.map((f) => (
                    <span
                      key={f}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-amber-900/30 text-amber-400"
                          : "bg-stone-700 text-stone-500"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end mt-8">
          <Button
            onClick={() => setStep("persona")}
            disabled={!selectedArchetype}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-30"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 2: Quick Persona Config ───────────────────────
  function renderPersonaStep() {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-white">Configure your profile</h2>
          <p className="text-stone-400 text-sm mt-2">
            These attributes calibrate how targets are evaluated.
            You can adjust these anytime in Settings.
          </p>
        </div>

        <Card className="bg-stone-800 border-stone-700 p-6 space-y-5">
          {questions.map((q) => (
            <div key={q.key}>
              <Label className="text-stone-200 text-sm">{q.label}</Label>
              {q.help && <p className="text-stone-500 text-xs mt-0.5 mb-1.5">{q.help}</p>}

              {q.type === "select" ? (
                <Select
                  value={persona[q.key] || ""}
                  onValueChange={(v) => setPersona({ ...persona, [q.key]: v })}
                >
                  <SelectTrigger className="bg-stone-900 border-stone-600 text-white mt-1">
                    <SelectValue placeholder={`Select ${q.label.toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    {q.options?.map((o) => (
                      <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : q.type === "number" ? (
                <Input
                  type="number"
                  value={persona[q.key] || ""}
                  onChange={(e) => setPersona({ ...persona, [q.key]: parseInt(e.target.value) || null })}
                  placeholder={q.placeholder}
                  className="bg-stone-900 border-stone-600 text-white mt-1"
                />
              ) : (
                <Input
                  value={persona[q.key] || ""}
                  onChange={(e) => setPersona({ ...persona, [q.key]: e.target.value })}
                  placeholder={q.placeholder}
                  className="bg-stone-900 border-stone-600 text-white mt-1"
                />
              )}
            </div>
          ))}
        </Card>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep("archetype")} className="text-stone-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep("target")} className="text-stone-400 hover:text-white">
              Skip for now
            </Button>
            <Button onClick={() => setStep("target")} className="bg-amber-600 hover:bg-amber-700">
              Continue
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: First Target ───────────────────────────────
  function renderTargetStep() {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-white">Enter your first target</h2>
          <p className="text-stone-400 text-sm mt-2">
            Add an acquisition target to start evaluating.
            You can also skip and add targets later from the Pipeline.
          </p>
        </div>

        <Card className="bg-stone-800 border-stone-700 p-6 space-y-4">
          <div>
            <Label className="text-stone-200">Target Name *</Label>
            <Input
              value={target.name}
              onChange={(e) => setTarget({ ...target, name: e.target.value })}
              placeholder="e.g., Precision Dynamics LLC"
              className="bg-stone-900 border-stone-600 text-white mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-200">Sector</Label>
              <Input
                value={target.sector}
                onChange={(e) => setTarget({ ...target, sector: e.target.value })}
                placeholder="e.g., Industrial Mfg"
                className="bg-stone-900 border-stone-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-stone-200">Revenue</Label>
              <Input
                value={target.revenue}
                onChange={(e) => setTarget({ ...target, revenue: e.target.value })}
                placeholder="e.g., $24M"
                className="bg-stone-900 border-stone-600 text-white mt-1"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep("persona")} className="text-stone-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => handleComplete(false)} className="text-stone-400 hover:text-white">
              Skip — go to Pipeline
            </Button>
            <Button
              onClick={() => handleComplete(true)}
              disabled={!target.name}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-30"
            >
              <Rocket className="w-4 h-4 mr-1.5" />
              Start Evaluating
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Complete onboarding ────────────────────────────────
  async function handleComplete(createTarget: boolean) {
    setLoading(true);

    try {
      // 1. Save persona config
      if (Object.keys(persona).length > 0) {
        await fetch("/api/persona", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(persona),
        });
      }

      // 2. Create target if provided
      let targetId: string | null = null;
      if (createTarget && target.name) {
        const res = await fetch("/api/targets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: target.name,
            sector: target.sector || null,
            revenue: target.revenue || null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          targetId = data.id;
        }
      }

      // 3. Navigate
      if (targetId) {
        router.push(`/dashboard/targets/${targetId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      router.push("/dashboard");
    }
  }

  // ── Progress indicator ─────────────────────────────────
  const steps: Step[] = ["archetype", "persona", "target"];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-stone-900 px-4 py-12">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-serif text-white tracking-tight">AMP</h1>
        <p className="text-stone-500 text-xs tracking-widest uppercase mt-1">
          Acquisition Management Platform
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {["Select Archetype", "Configure Profile", "Enter Target"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
              i < currentIndex
                ? "bg-green-900/30 text-green-400"
                : i === currentIndex
                ? "bg-amber-900/30 text-amber-400 ring-1 ring-amber-600/30"
                : "bg-stone-800 text-stone-500"
            }`}>
              {i < currentIndex ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-stone-700 text-[10px] font-mono">
                  {i + 1}
                </span>
              )}
              {label}
            </div>
            {i < 2 && <div className="w-8 h-px bg-stone-700" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {step === "archetype" && renderArchetypeStep()}
        {step === "persona" && renderPersonaStep()}
        {step === "target" && renderTargetStep()}
      </div>
    </div>
  );
}

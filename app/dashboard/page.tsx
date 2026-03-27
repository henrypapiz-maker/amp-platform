"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, TrendingUp, ArrowRight } from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { PageHelp, HelpTip } from "@/components/ui/help-tip";

type Target = {
  id: string;
  name: string;
  sector: string | null;
  revenue: string | null;
  status: string;
  currentGate: number;
  compositeScore: string | null;
  outcome: string | null;
  notes: string | null;
  createdAt: string;
};

const STATUS_TABS = [
  { key: "new", label: "New" },
  { key: "inflight", label: "In Flight" },
  { key: "closed", label: "Closed" },
] as const;

const gateLabels: Record<number, string> = {
  0: "G0", 1: "G1", 2: "G2", 3: "G3",
  4: "G4", 5: "G5", 6: "G6", 7: "G7",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>([]);
  const [activeTab, setActiveTab] = useState<string>("inflight");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const role = (session?.user as any)?.role;
  const canCreate = hasPermission(role, "create_target");

  useEffect(() => {
    fetchTargets();
  }, []);

  async function fetchTargets() {
    const res = await fetch("/api/targets");
    if (res.ok) {
      setTargets(await res.json());
    }
    setLoading(false);
  }

  const filtered = targets.filter((t) => t.status === activeTab);

  const counts = {
    new: targets.filter((t) => t.status === "new").length,
    inflight: targets.filter((t) => t.status === "inflight").length,
    closed: targets.filter((t) => t.status === "closed").length,
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        sector: formData.get("sector"),
        revenue: formData.get("revenue"),
        notes: formData.get("notes"),
      }),
    });
    if (res.ok) {
      setDialogOpen(false);
      setActiveTab("new");
      fetchTargets();
    }
  }

  return (
    <div>
      <PageHelp>
        The pipeline shows all acquisition targets organized by evaluation status.
        <strong className="text-stone-300"> New</strong> targets enter at G0 Universe Qualification.
        <strong className="text-stone-300"> In Flight</strong> targets are actively progressing through gates.
        <strong className="text-stone-300"> Closed</strong> targets have reached an IC decision (Pursue, Conditional, or Pass).
        Click any target card to view its gate evaluations, score dimensions, and attach evidence.
      </PageHelp>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Pipeline</h1>
          <p className="text-stone-400 text-sm mt-1">
            {targets.length} target{targets.length !== 1 ? "s" : ""} in evaluation
          </p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-sm transition-colors">
              <Plus className="w-4 h-4 mr-1.5" />
              Enter Target
            </DialogTrigger>
            <DialogContent className="bg-stone-800 border-stone-700 text-white">
              <DialogHeader>
                <DialogTitle className="font-serif">New Acquisition Target</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <Label className="text-stone-300">Target Name *</Label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g., Precision Dynamics LLC"
                    className="bg-stone-900 border-stone-600 text-white mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-300">Sector</Label>
                    <Input
                      name="sector"
                      placeholder="e.g., Aerospace & Defense"
                      className="bg-stone-900 border-stone-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-stone-300">Revenue</Label>
                    <Input
                      name="revenue"
                      placeholder="e.g., $24M"
                      className="bg-stone-900 border-stone-600 text-white mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-stone-300">Notes</Label>
                  <Textarea
                    name="notes"
                    placeholder="Initial notes about this target..."
                    className="bg-stone-900 border-stone-600 text-white mt-1"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                  Create Target
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-800 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-stone-700 text-amber-400"
                : "text-stone-400 hover:text-white"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-stone-700/50">
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Target Cards */}
      {loading ? (
        <div className="text-stone-400 text-center py-12">Loading targets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-stone-500 text-center py-12">
          No {activeTab} targets
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((target) => (
            <Link key={target.id} href={`/dashboard/targets/${target.id}`}>
              <Card className="bg-stone-800 border-stone-700 hover:border-stone-600 transition-colors cursor-pointer p-5 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{target.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {target.sector && (
                        <span className="text-stone-400 text-xs flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {target.sector}
                        </span>
                      )}
                      {target.revenue && (
                        <span className="text-stone-400 text-xs flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {target.revenue}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-2 shrink-0 border-amber-600/50 text-amber-400 text-xs"
                  >
                    {gateLabels[target.currentGate] || `G${target.currentGate}`}
                  </Badge>
                </div>

                {target.compositeScore && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Number(target.compositeScore))}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-300 font-mono w-8 text-right">
                      {Number(target.compositeScore).toFixed(0)}
                    </span>
                  </div>
                )}

                {target.outcome && (
                  <Badge
                    className={`text-[10px] ${
                      target.outcome === "pursue"
                        ? "bg-green-900/50 text-green-400 border-green-800"
                        : target.outcome === "conditional"
                        ? "bg-yellow-900/50 text-yellow-400 border-yellow-800"
                        : "bg-red-900/50 text-red-400 border-red-800"
                    }`}
                  >
                    {target.outcome.toUpperCase()}
                  </Badge>
                )}

                {target.notes && (
                  <p className="text-stone-500 text-xs mt-2 line-clamp-2">{target.notes}</p>
                )}

                <div className="flex items-center justify-end mt-3 text-stone-500">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

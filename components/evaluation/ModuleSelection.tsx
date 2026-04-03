"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers, ChevronRight, CheckCircle, AlertTriangle,
  Scale, Info
} from "lucide-react";

type ModuleInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whenToUse: string | null;
  whenNotToUse: string | null;
  dimensionCount: number;
  dimensionNames: string[];
  isDefault: boolean;
  source: string;
  minimumScore: number | null;
  declineThreshold: number | null;
};

interface ModuleSelectionProps {
  gateCode: string;
  gateName: string;
  onSelect: (moduleId: string, moduleName: string) => void;
  onCancel: () => void;
}

export default function ModuleSelection({
  gateCode,
  gateName,
  onSelect,
  onCancel,
}: ModuleSelectionProps) {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [defaultModuleId, setDefaultModuleId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [gateCode]);

  async function fetchModules() {
    const res = await fetch(`/api/evaluations?gateCode=${gateCode}`);
    if (res.ok) {
      const data = await res.json();
      setModules(data.modules || []);
      setDefaultModuleId(data.defaultModuleId);
      // Auto-select default
      if (data.defaultModuleId) setSelectedId(data.defaultModuleId);
    }
    setLoading(false);
  }

  // If there's only one module, skip selection entirely
  useEffect(() => {
    if (!loading && modules.length === 1) {
      onSelect(modules[0].id, modules[0].name);
    }
  }, [loading, modules]);

  if (loading) {
    return (
      <div className="text-stone-500 text-center py-8">
        Loading evaluation modules...
      </div>
    );
  }

  // Single module — auto-select (shouldn't render but safety)
  if (modules.length <= 1) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Layers className="w-5 h-5 text-amber-400" />
        <div>
          <h3 className="text-white font-medium">
            Select evaluation module for {gateCode}
          </h3>
          <p className="text-stone-400 text-sm">
            Different target types require different analytical frameworks.
            Choose the module that best fits this target.
          </p>
        </div>
      </div>

      {/* Module cards */}
      <div className="space-y-3">
        {modules.map((mod) => {
          const isSelected = selectedId === mod.id;
          const isExpanded = expanded === mod.id;
          const isDefault = mod.id === defaultModuleId;

          return (
            <div
              key={mod.id}
              className={`rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? "border-amber-500 bg-stone-800 ring-1 ring-amber-500/20"
                  : "border-stone-700 bg-stone-800/50 hover:border-stone-600"
              }`}
            >
              {/* Module header — click to select */}
              <button
                onClick={() => setSelectedId(mod.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                      isSelected ? "border-amber-500 bg-amber-500" : "border-stone-600"
                    }`}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? "text-white" : "text-stone-200"}`}>
                          {mod.name}
                        </span>
                        {isDefault && (
                          <Badge className="bg-amber-900/30 text-amber-400 text-[10px]">
                            Recommended
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-stone-600 text-stone-400 text-[10px]">
                          {mod.dimensionCount} dimensions
                        </Badge>
                      </div>
                      {mod.description && (
                        <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(isExpanded ? null : mod.id);
                    }}
                    className="text-stone-500 hover:text-stone-300 p-1"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-700/50 pt-3 space-y-3">
                  {/* When to use */}
                  {mod.whenToUse && (
                    <div className="bg-green-900/10 border border-green-800/20 rounded-lg p-3">
                      <span className="text-green-400 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        When to use
                      </span>
                      <p className="text-stone-300 text-xs mt-1.5 leading-relaxed">{mod.whenToUse}</p>
                    </div>
                  )}

                  {/* When NOT to use */}
                  {mod.whenNotToUse && (
                    <div className="bg-red-900/10 border border-red-800/20 rounded-lg p-3">
                      <span className="text-red-400 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        When NOT to use
                      </span>
                      <p className="text-stone-300 text-xs mt-1.5 leading-relaxed">{mod.whenNotToUse}</p>
                    </div>
                  )}

                  {/* Dimensions list */}
                  <div>
                    <span className="text-stone-500 text-xs uppercase tracking-wider">
                      Dimensions in this module
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {mod.dimensionNames.map((name) => (
                        <span
                          key={name}
                          className="text-[11px] px-2 py-1 rounded bg-stone-700 text-stone-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tolerances */}
                  {(mod.minimumScore || mod.declineThreshold) && (
                    <div className="flex gap-4 text-xs text-stone-500">
                      {mod.minimumScore && (
                        <span className="flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          Min: {mod.minimumScore}/100
                        </span>
                      )}
                      {mod.declineThreshold && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Decline: &lt;{mod.declineThreshold}/100
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="bg-stone-900/50 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <p className="text-stone-500 text-xs leading-relaxed">
          The module you select determines which dimensions, rubric anchors, and evaluation
          lenses are available for this gate. This choice crystallizes when the gate passes
          dual authorization and cannot be changed without breaking the crystal.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onCancel} className="text-stone-400 hover:text-white">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (selectedId) {
              const mod = modules.find((m) => m.id === selectedId);
              onSelect(selectedId, mod?.name || "");
            }
          }}
          disabled={!selectedId}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-30"
        >
          Start Evaluation with {modules.find((m) => m.id === selectedId)?.name || "Selected Module"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

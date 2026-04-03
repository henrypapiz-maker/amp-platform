"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, ShieldOff, Lock, Unlock, AlertTriangle,
  Clock, User, FileText, X
} from "lucide-react";

// ── Crystallization State Badge ────────────────────────────────
// Shown in gate headers, evaluation cards, and approval panels.

interface CrystallizationBadgeProps {
  isCrystallized: boolean;
  crystallizedAt: string | null;
  moduleName: string | null;
  templateVersion: string | null;
  compact?: boolean;
}

export function CrystallizationBadge({
  isCrystallized,
  crystallizedAt,
  moduleName,
  templateVersion,
  compact = false,
}: CrystallizationBadgeProps) {
  if (!isCrystallized) return null;

  if (compact) {
    return (
      <Badge className="bg-blue-900/30 text-blue-400 border border-blue-800/30 text-[10px] gap-1">
        <Lock className="w-2.5 h-2.5" />
        Crystallized
      </Badge>
    );
  }

  return (
    <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-3 flex items-start gap-3">
      <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xs font-medium">Gate Crystallized</span>
          <Badge className="bg-blue-900/30 text-blue-300 text-[9px]">
            <Lock className="w-2.5 h-2.5 mr-0.5" />
            Immutable
          </Badge>
        </div>
        <p className="text-stone-400 text-xs mt-1 leading-relaxed">
          This gate passed dual authorization and its methodology is frozen.
          Scores, lens notes, weights, and the selected module cannot change
          unless an admin breaks the crystal.
        </p>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-stone-500">
          {crystallizedAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(crystallizedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
          {moduleName && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {moduleName}
            </span>
          )}
          {templateVersion && (
            <span className="flex items-center gap-1">
              v{templateVersion}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Break Crystal Dialog ───────────────────────────────────────
// Admin-only action to unfreeze a crystallized gate.

interface BreakCrystalDialogProps {
  evaluationId: string;
  gateCode: string;
  moduleName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BreakCrystalDialog({
  evaluationId,
  gateCode,
  moduleName,
  onConfirm,
  onCancel,
}: BreakCrystalDialogProps) {
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = justification.trim().length >= 20;

  async function handleBreak() {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/evaluations/${evaluationId}/approve`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justification: justification.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to break crystal");
        setLoading(false);
        return;
      }

      onConfirm();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="bg-stone-800 border-stone-700 w-full max-w-lg p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Break Crystal — {gateCode}</h3>
              <p className="text-stone-400 text-xs">
                {moduleName && `Module: ${moduleName}`}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-stone-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warnings */}
        <div className="bg-red-900/10 border border-red-800/20 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-medium">This action has significant consequences</span>
          </div>
          <ul className="text-stone-400 text-xs space-y-1 ml-6">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              All existing approvals for this gate will be deleted
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Gate status resets to &quot;in progress&quot; — requires fresh dual authorization
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              The prior crystallized state (scores, approvals, methodology) is preserved in the audit log
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              This action is permanent and cannot be undone
            </li>
          </ul>
        </div>

        {/* Justification */}
        <div className="mb-4">
          <label className="text-stone-200 text-sm font-medium">
            Justification <span className="text-red-400">*</span>
          </label>
          <p className="text-stone-500 text-xs mt-0.5 mb-2">
            Explain why this gate needs re-evaluation. This will be recorded in the audit log.
            Minimum 20 characters.
          </p>
          <Textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="e.g., Material new information received from management regarding revenue recognition practices that was not available during initial G4 evaluation..."
            className="bg-stone-900 border-stone-600 text-white text-sm min-h-[100px]"
          />
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] ${isValid ? "text-green-400" : "text-stone-600"}`}>
              {justification.trim().length}/20 characters minimum
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-2 mb-4">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} className="text-stone-400 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleBreak}
            disabled={!isValid || loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white"
          >
            <Unlock className="w-4 h-4 mr-1.5" />
            {loading ? "Breaking Crystal..." : "Break Crystal & Reset Gate"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── Gate Status Bar (used in gate header) ──────────────────────
// Combines gate status, crystallization badge, and break-crystal trigger.

interface GateStatusBarProps {
  gateCode: string;
  gateStatus: string;
  isCrystallized: boolean;
  crystallizedAt: string | null;
  moduleName: string | null;
  templateVersion: string | null;
  canBreakCrystal: boolean; // admin role check from parent
  evaluationId: string;
  onCrystalBroken: () => void;
}

export function GateStatusBar({
  gateCode,
  gateStatus,
  isCrystallized,
  crystallizedAt,
  moduleName,
  templateVersion,
  canBreakCrystal,
  evaluationId,
  onCrystalBroken,
}: GateStatusBarProps) {
  const [showBreakDialog, setShowBreakDialog] = useState(false);

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    in_progress: { bg: "bg-amber-900/30", text: "text-amber-400", label: "In Progress" },
    passed: { bg: "bg-green-900/30", text: "text-green-400", label: "Passed" },
    failed: { bg: "bg-red-900/30", text: "text-red-400", label: "Failed" },
    skipped: { bg: "bg-stone-700", text: "text-stone-400", label: "Skipped" },
  };

  const status = statusConfig[gateStatus] || statusConfig.in_progress;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${status.bg} ${status.text} text-xs`}>
            {status.label}
          </Badge>
          <CrystallizationBadge
            isCrystallized={isCrystallized}
            crystallizedAt={crystallizedAt}
            moduleName={moduleName}
            templateVersion={templateVersion}
            compact
          />
        </div>

        {isCrystallized && canBreakCrystal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBreakDialog(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs h-7"
          >
            <ShieldOff className="w-3.5 h-3.5 mr-1" />
            Break Crystal
          </Button>
        )}
      </div>

      {/* Full crystallization detail (shown below header) */}
      {isCrystallized && (
        <CrystallizationBadge
          isCrystallized={isCrystallized}
          crystallizedAt={crystallizedAt}
          moduleName={moduleName}
          templateVersion={templateVersion}
        />
      )}

      {/* Break crystal dialog */}
      {showBreakDialog && (
        <BreakCrystalDialog
          evaluationId={evaluationId}
          gateCode={gateCode}
          moduleName={moduleName}
          onConfirm={() => {
            setShowBreakDialog(false);
            onCrystalBroken();
          }}
          onCancel={() => setShowBreakDialog(false)}
        />
      )}
    </>
  );
}

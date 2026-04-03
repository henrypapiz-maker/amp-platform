"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye, EyeOff, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle, HelpCircle, Target, Lightbulb, FileText,
  Crosshair, Save
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

export interface Lens {
  id: string;
  name: string;
  framework: string;
  guidance: string;
  keyQuestions: string[];
  evidenceNeeds: string[];
  calibrationAnchors: Array<{ score: number; label: string }>;
  blindSpots: string[];
  isDefault: boolean;
}

export interface LensNote {
  lensId: string;
  content: string;
  savedAt: string | null;
}

interface LensEvaluationPanelProps {
  dimensionName: string;
  gateCode: string;
  evaluationId: string;
  lenses: Lens[];
  currentScore: number | null;
  notes: LensNote[];
  onNoteSave: (lensId: string, content: string) => Promise<void>;
  isCrystallized: boolean;
}

// ── Convergence Calculation ────────────────────────────────────

type ConvergenceLevel = "strong" | "partial" | "divergent" | "insufficient";

function calculateConvergence(
  lenses: Lens[],
  score: number | null,
  notes: LensNote[]
): { level: ConvergenceLevel; label: string; detail: string } {
  // Can't assess convergence without a score and at least 2 lenses with notes
  const notesWithContent = notes.filter((n) => n.content.trim().length > 0);

  if (!score || notesWithContent.length < 2) {
    return {
      level: "insufficient",
      label: "Needs more input",
      detail: `Evaluate through at least 2 lenses to see convergence. ${notesWithContent.length}/${lenses.length} assessed.`,
    };
  }

  // Simple heuristic: look for score mentions or sentiment in notes
  // In production this would use the AI scoring engine
  const allNotesText = notesWithContent.map((n) => n.content.toLowerCase()).join(" ");

  const strongSignals = ["confirms", "consistent", "aligns", "supports", "reinforces", "agrees"];
  const weakSignals = ["contradicts", "conflicts", "diverges", "questions", "challenges", "however", "but"];

  const strongCount = strongSignals.filter((s) => allNotesText.includes(s)).length;
  const weakCount = weakSignals.filter((s) => allNotesText.includes(s)).length;

  if (strongCount >= 2 && weakCount === 0) {
    return {
      level: "strong",
      label: "Strong convergence",
      detail: `${notesWithContent.length} lenses assessed — assessments are consistent. Score with high confidence.`,
    };
  }
  if (weakCount >= 2) {
    return {
      level: "divergent",
      label: "Lenses diverge",
      detail: `${notesWithContent.length} lenses assessed — assessments conflict. Investigate before scoring.`,
    };
  }
  return {
    level: "partial",
    label: "Partial convergence",
    detail: `${notesWithContent.length} lenses assessed — mostly aligned with some tension. Document reasoning.`,
  };
}

// ── Convergence Badge ──────────────────────────────────────────

function ConvergenceBadge({ convergence }: { convergence: ReturnType<typeof calculateConvergence> }) {
  const config: Record<ConvergenceLevel, { bg: string; text: string; icon: typeof CheckCircle }> = {
    strong: { bg: "bg-green-900/30 border-green-800/30", text: "text-green-400", icon: CheckCircle },
    partial: { bg: "bg-amber-900/30 border-amber-800/30", text: "text-amber-400", icon: HelpCircle },
    divergent: { bg: "bg-red-900/30 border-red-800/30", text: "text-red-400", icon: AlertTriangle },
    insufficient: { bg: "bg-stone-800 border-stone-700", text: "text-stone-500", icon: Crosshair },
  };
  const c = config[convergence.level];
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.bg}`}>
      <Icon className={`w-4 h-4 ${c.text}`} />
      <div>
        <span className={`text-xs font-medium ${c.text}`}>{convergence.label}</span>
        <p className="text-stone-500 text-[10px] leading-tight mt-0.5">{convergence.detail}</p>
      </div>
    </div>
  );
}

// ── Single Lens Card ───────────────────────────────────────────

function LensCard({
  lens,
  note,
  onNoteSave,
  isCrystallized,
}: {
  lens: Lens;
  note: LensNote | undefined;
  onNoteSave: (content: string) => Promise<void>;
  isCrystallized: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState(note?.content || "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showBlindSpots, setShowBlindSpots] = useState(false);

  const hasNote = noteText.trim().length > 0;

  async function handleSave() {
    setSaving(true);
    await onNoteSave(noteText);
    setSaving(false);
    setDirty(false);
  }

  return (
    <div className="border border-stone-700 rounded-lg overflow-hidden">
      {/* Lens header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-center gap-3 hover:bg-stone-800/50 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${hasNote ? "bg-green-500" : "bg-stone-600"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-200 font-medium truncate">{lens.name}</span>
            {lens.isDefault && (
              <Badge className="bg-stone-700 text-stone-400 text-[9px]">default</Badge>
            )}
          </div>
          <p className="text-stone-500 text-xs truncate">{lens.framework}</p>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-stone-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-500 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-stone-700/50 p-4 space-y-4">
          {/* Guidance */}
          <div>
            <span className="text-stone-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Guidance
            </span>
            <p className="text-stone-300 text-xs leading-relaxed mt-1">{lens.guidance}</p>
          </div>

          {/* Key Questions */}
          <div>
            <span className="text-stone-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3" />
              Key Questions
            </span>
            <ul className="mt-1.5 space-y-1">
              {lens.keyQuestions.map((q, i) => (
                <li key={i} className="text-stone-400 text-xs flex items-start gap-2">
                  <span className="text-stone-600 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence Needs */}
          <div>
            <span className="text-stone-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Evidence Needed
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lens.evidenceNeeds.map((e, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-stone-700 text-stone-400">
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Calibration Anchors */}
          <div>
            <span className="text-stone-500 text-[10px] uppercase tracking-wider">
              Score Calibration
            </span>
            <div className="mt-1.5 space-y-1">
              {lens.calibrationAnchors.map((a) => (
                <div key={a.score} className="flex items-start gap-2 text-xs">
                  <span className={`font-mono text-[10px] w-4 text-right shrink-0 mt-0.5 ${
                    a.score >= 7 ? "text-green-400" :
                    a.score >= 5 ? "text-amber-400" :
                    a.score >= 3 ? "text-orange-400" : "text-red-400"
                  }`}>
                    {a.score}
                  </span>
                  <span className="text-stone-400">{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blind Spots (collapsible warning) */}
          {lens.blindSpots.length > 0 && (
            <div>
              <button
                onClick={() => setShowBlindSpots(!showBlindSpots)}
                className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase tracking-wider hover:text-amber-400"
              >
                {showBlindSpots ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showBlindSpots ? "Hide" : "Show"} Blind Spots ({lens.blindSpots.length})
              </button>
              {showBlindSpots && (
                <div className="mt-1.5 bg-amber-900/10 border border-amber-800/20 rounded-lg p-2.5 space-y-1">
                  {lens.blindSpots.map((b, i) => (
                    <p key={i} className="text-amber-300/80 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      {b}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per-Lens Note */}
          <div className="pt-2 border-t border-stone-700/50">
            <span className="text-stone-500 text-[10px] uppercase tracking-wider">
              Your assessment through this lens
            </span>
            <Textarea
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); setDirty(true); }}
              placeholder={`What does the ${lens.name} lens reveal? Note observations, evidence gaps, and how this informs your score...`}
              className="bg-stone-900 border-stone-600 text-white text-xs mt-1.5 min-h-[80px] resize-none"
              disabled={isCrystallized}
            />
            {dirty && !isCrystallized && (
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-stone-700 hover:bg-stone-600 text-white text-xs h-7 px-3"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {saving ? "Saving..." : "Save Note"}
                </Button>
              </div>
            )}
            {isCrystallized && (
              <p className="text-stone-600 text-[10px] mt-1">
                Gate is crystallized — lens notes are frozen.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────

export default function LensEvaluationPanel({
  dimensionName,
  gateCode,
  evaluationId,
  lenses,
  currentScore,
  notes,
  onNoteSave,
  isCrystallized,
}: LensEvaluationPanelProps) {
  const convergence = useMemo(
    () => calculateConvergence(lenses, currentScore, notes),
    [lenses, currentScore, notes]
  );

  if (lenses.length === 0) {
    return (
      <div className="text-stone-600 text-xs py-2">
        No evaluation lenses configured for this dimension.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header with convergence indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-stone-500" />
          <span className="text-stone-400 text-xs uppercase tracking-wider">
            Evaluation Lenses
          </span>
          <Badge variant="outline" className="border-stone-600 text-stone-500 text-[10px]">
            {lenses.length}
          </Badge>
        </div>
      </div>

      {/* Convergence indicator */}
      <ConvergenceBadge convergence={convergence} />

      {/* Lens cards */}
      <div className="space-y-2">
        {lenses.map((lens) => (
          <LensCard
            key={lens.id}
            lens={lens}
            note={notes.find((n) => n.lensId === lens.id)}
            onNoteSave={(content) => onNoteSave(lens.id, content)}
            isCrystallized={isCrystallized}
          />
        ))}
      </div>
    </div>
  );
}

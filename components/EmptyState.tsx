"use client";

import { Button } from "@/components/ui/button";
import {
  Target, Layers, FileText, BookOpen, Search,
  BarChart, Users, Brain, type LucideIcon
} from "lucide-react";

// ── Pre-built empty states for AMP views ───────────────────────

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function EmptyState({
  icon: Icon = Target,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-stone-500" />
      </div>
      <h3 className="text-white font-medium text-sm">{title}</h3>
      <p className="text-stone-500 text-xs mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center gap-3 mt-5">
          {actionLabel && (
            actionHref ? (
              <a href={actionHref}>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8">
                  {actionLabel}
                </Button>
              </a>
            ) : (
              <Button
                size="sm"
                onClick={onAction}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
              >
                {actionLabel}
              </Button>
            )
          )}
          {secondaryLabel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSecondary}
              className="text-stone-400 hover:text-white text-xs h-8"
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pre-configured empty states ────────────────────────────────

export function EmptyPipeline({ onAddTarget }: { onAddTarget: () => void }) {
  return (
    <EmptyState
      icon={Target}
      title="No targets yet"
      description="Add your first acquisition target to start evaluating through the 8-gate waterfall methodology."
      actionLabel="Add Target"
      onAction={onAddTarget}
      secondaryLabel="Browse Methodology"
      onSecondary={() => window.location.href = "/knowledge-base"}
    />
  );
}

export function EmptyGateScores() {
  return (
    <EmptyState
      icon={Layers}
      title="No scores yet"
      description="Start scoring dimensions to build your gate evaluation. Each dimension has rubric anchors and evaluation lenses to guide your assessment."
    />
  );
}

export function EmptyEvidence() {
  return (
    <EmptyState
      icon={FileText}
      title="No evidence linked"
      description="Attach documents, URLs, or data references to support your dimension scores. Evidence creates the audit trail from score to source."
      actionLabel="Link Evidence"
    />
  );
}

export function EmptyKBSearch() {
  return (
    <EmptyState
      icon={Search}
      title="No articles match your search"
      description="Try different keywords or browse by category to find methodology reference content."
      secondaryLabel="Clear search"
    />
  );
}

export function EmptyAnalytics() {
  return (
    <EmptyState
      icon={BarChart}
      title="Not enough data yet"
      description="Cross-deal analytics become available after completing 3 or more target evaluations. Keep scoring to unlock portfolio-level insights."
    />
  );
}

export function EmptyTeam({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="You're the only user"
      description="Invite team members to collaborate on evaluations, review scores, and approve gates with dual authorization."
      actionLabel="Invite Team Member"
      onAction={onInvite}
    />
  );
}

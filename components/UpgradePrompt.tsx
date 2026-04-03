"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, Users, Brain, ArrowRight, Clock, Target, X
} from "lucide-react";

interface UpgradePromptProps {
  reason: string;
  feature?: string;
  currentTier?: string;
  onDismiss?: () => void;
  variant?: "inline" | "modal" | "banner";
}

const UPGRADE_FEATURES = {
  secondTarget: {
    icon: Target,
    title: "Add more targets",
    description: "The free tier supports 1 active target. Upgrade to evaluate your full pipeline.",
    cta: "Upgrade to Team",
  },
  teamAccess: {
    icon: Users,
    title: "Collaborate with your team",
    description: "Invite colleagues to score dimensions, review evidence, and approve gates with dual authorization.",
    cta: "Upgrade to Team",
  },
  aiAssist: {
    icon: Brain,
    title: "Unlock AI assistance",
    description: "Let AI pre-populate scores from your CIM, suggest dimension assessments, and draft IC memos.",
    cta: "Upgrade to Intelligence",
  },
  expired: {
    icon: Clock,
    title: "Your trial has ended",
    description: "Your 90-day POC period has expired. Upgrade to continue evaluating targets with the full AMP methodology.",
    cta: "Choose a plan",
  },
};

export default function UpgradePrompt({
  reason,
  feature,
  currentTier = "poc",
  onDismiss,
  variant = "inline",
}: UpgradePromptProps) {
  // Determine which upgrade message to show
  const upgradeKey = reason.includes("expired") ? "expired"
    : reason.includes("Target") || reason.includes("target") ? "secondTarget"
    : reason.includes("team") || reason.includes("Team") ? "teamAccess"
    : reason.includes("AI") || reason.includes("ai") ? "aiAssist"
    : "secondTarget";

  const upgrade = UPGRADE_FEATURES[upgradeKey];
  const Icon = upgrade.icon;

  if (variant === "banner") {
    return (
      <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-amber-200 text-sm">{reason}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7">
            {upgrade.cta}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          {onDismiss && (
            <button onClick={onDismiss} className="text-stone-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Card className="bg-stone-800 border-stone-700 w-full max-w-md p-6 shadow-2xl">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Icon className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-white text-lg font-medium">{upgrade.title}</h3>
            <p className="text-stone-400 text-sm mt-2 leading-relaxed">{upgrade.description}</p>

            <div className="mt-6 space-y-3">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {upgrade.cta}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              {onDismiss && (
                <Button variant="ghost" onClick={onDismiss} className="w-full text-stone-400 hover:text-white">
                  Maybe later
                </Button>
              )}
            </div>

            <p className="text-stone-600 text-[10px] mt-4">
              Currently on: <Badge className="bg-stone-700 text-stone-400 text-[9px]">{currentTier.toUpperCase()}</Badge>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Default: inline card
  return (
    <Card className="bg-stone-800/50 border-amber-800/20 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-900/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-white text-sm font-medium">{upgrade.title}</h4>
          <p className="text-stone-400 text-xs mt-1 leading-relaxed">{upgrade.description}</p>
          <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs h-7">
            {upgrade.cta}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-stone-600 hover:text-stone-400 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
}

"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

// ── Route-to-breadcrumb mapping ────────────────────────────────
// Reads URL segments and evaluation context to build the trail.

interface BreadcrumbSegment {
  label: string;
  href: string;
  current?: boolean;
}

interface EvalBreadcrumbProps {
  targetName?: string;
  gateName?: string;
  gateCode?: string;
  dimensionName?: string;
}

export default function EvalBreadcrumb({
  targetName,
  gateName,
  gateCode,
  dimensionName,
}: EvalBreadcrumbProps) {
  const pathname = usePathname();
  const params = useParams();

  const segments: BreadcrumbSegment[] = [];

  // Always start with Pipeline
  segments.push({ label: "Pipeline", href: "/dashboard" });

  // Target level
  if (params?.id && targetName) {
    segments.push({
      label: targetName,
      href: `/dashboard/targets/${params.id}`,
    });
  }

  // Gate level
  if (gateCode && gateName) {
    const gateLabel = `${gateCode}: ${gateName}`;
    segments.push({
      label: gateLabel,
      href: params?.id ? `/dashboard/targets/${params.id}#${gateCode}` : "#",
    });
  }

  // Dimension level
  if (dimensionName) {
    segments.push({
      label: dimensionName,
      href: "#",
      current: true,
    });
  }

  // Mark last segment as current if not already set
  if (segments.length > 0 && !segments.some((s) => s.current)) {
    segments[segments.length - 1].current = true;
  }

  // Knowledge Base routes
  if (pathname?.startsWith("/knowledge-base")) {
    return (
      <nav className="flex items-center gap-1.5 text-xs py-2 px-1 mb-4" aria-label="Breadcrumb">
        <Link href="/dashboard" className="text-stone-500 hover:text-white transition-colors flex items-center gap-1">
          <Home className="w-3 h-3" />
        </Link>
        <ChevronRight className="w-3 h-3 text-stone-700" />
        <span className="text-stone-300">Knowledge Base</span>
      </nav>
    );
  }

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs py-2 px-1 mb-4 overflow-x-auto" aria-label="Breadcrumb">
      {segments.map((segment, i) => (
        <span key={segment.href + segment.label} className="flex items-center gap-1.5 shrink-0">
          {i > 0 && <ChevronRight className="w-3 h-3 text-stone-700" />}
          {segment.current ? (
            <span className="text-stone-300 font-medium">{segment.label}</span>
          ) : (
            <Link
              href={segment.href}
              className="text-stone-500 hover:text-white transition-colors"
            >
              {segment.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

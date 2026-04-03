// ═══════════════════════════════════════════════════════════════
// AMP v2 — Skeleton Loading Primitives
//
// Shimmer placeholders that match the rendered shape of each
// component type. Used with TanStack Query's isLoading state.
//
// Usage:
//   const { data, isLoading } = useQuery(...)
//   if (isLoading) return <DimensionCardSkeleton />;
// ═══════════════════════════════════════════════════════════════

import { Skeleton } from "@/components/ui/skeleton";

// ── Generic primitives ─────────────────────────────────────────

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-stone-700 bg-stone-800/50 p-4 space-y-3">
      <Skeleton className="h-4 w-2/3 bg-stone-700" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 bg-stone-700 ${i === lines - 1 ? "w-1/2" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-stone-700/50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 bg-stone-700 ${i === 0 ? "w-32" : "flex-1"}`}
        />
      ))}
    </div>
  );
}

// ── AMP-specific skeletons ─────────────────────────────────────

export function DimensionCardSkeleton() {
  return (
    <div className="rounded-lg border border-stone-700 bg-stone-800/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40 bg-stone-700" />
        <Skeleton className="h-6 w-16 rounded-full bg-stone-700" />
      </div>
      <Skeleton className="h-3 w-full bg-stone-700" />
      <Skeleton className="h-3 w-3/4 bg-stone-700" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-8 w-20 bg-stone-700 rounded" />
        <Skeleton className="h-8 flex-1 bg-stone-700 rounded" />
      </div>
    </div>
  );
}

export function DimensionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <DimensionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LensCardSkeleton() {
  return (
    <div className="border border-stone-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton className="w-2 h-2 rounded-full bg-stone-700" />
        <Skeleton className="h-4 w-36 bg-stone-700" />
        <Skeleton className="h-4 w-12 rounded-full bg-stone-700" />
      </div>
      <Skeleton className="h-3 w-48 bg-stone-700" />
    </div>
  );
}

export function LensPanelSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 bg-stone-700 rounded" />
        <Skeleton className="h-3 w-28 bg-stone-700" />
      </div>
      <Skeleton className="h-12 w-full bg-stone-700 rounded-lg" />
      {Array.from({ length: count }).map((_, i) => (
        <LensCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ModuleSelectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5 bg-stone-700 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-52 bg-stone-700" />
          <Skeleton className="h-3 w-72 bg-stone-700" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-stone-700 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full bg-stone-700" />
            <Skeleton className="h-4 w-40 bg-stone-700" />
            <Skeleton className="h-4 w-16 rounded-full bg-stone-700" />
          </div>
          <Skeleton className="h-3 w-full bg-stone-700 ml-8" />
        </div>
      ))}
    </div>
  );
}

export function GateHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full bg-stone-700" />
          <Skeleton className="h-6 w-24 rounded-full bg-stone-700" />
        </div>
        <Skeleton className="h-7 w-28 bg-stone-700 rounded" />
      </div>
      <Skeleton className="h-16 w-full bg-stone-700 rounded-lg" />
    </div>
  );
}

export function KBArticleListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-stone-700 bg-stone-800/50 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-stone-700" />
          <Skeleton className="h-3 w-full bg-stone-700" />
          <Skeleton className="h-3 w-2/3 bg-stone-700" />
          <div className="flex gap-1 pt-1">
            <Skeleton className="h-4 w-8 rounded bg-stone-700" />
            <Skeleton className="h-4 w-8 rounded bg-stone-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TargetPipelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-stone-700 bg-stone-800/50">
          <Skeleton className="w-10 h-10 rounded-lg bg-stone-700" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40 bg-stone-700" />
            <Skeleton className="h-3 w-24 bg-stone-700" />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} className="w-6 h-6 rounded bg-stone-700" />
            ))}
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-stone-700" />
        </div>
      ))}
    </div>
  );
}

export function OnboardingArchetypeSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-5 rounded-lg border border-stone-700 bg-stone-800/50 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg bg-stone-700" />
            <Skeleton className="h-4 w-28 bg-stone-700" />
          </div>
          <Skeleton className="h-3 w-full bg-stone-700" />
          <Skeleton className="h-3 w-3/4 bg-stone-700" />
          <div className="flex gap-1.5">
            <Skeleton className="h-4 w-16 rounded-full bg-stone-700" />
            <Skeleton className="h-4 w-20 rounded-full bg-stone-700" />
            <Skeleton className="h-4 w-14 rounded-full bg-stone-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

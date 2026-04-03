"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// ── Query Key Factory ──────────────────────────────────────────
// Consistent key patterns for cache invalidation.
// Usage: queryKeys.evaluations.scores(evalId)
// Invalidation: queryClient.invalidateQueries({ queryKey: queryKeys.evaluations.all })

export const queryKeys = {
  targets: {
    all: ["targets"] as const,
    detail: (id: string) => ["targets", id] as const,
    list: (filters?: Record<string, unknown>) => ["targets", "list", filters] as const,
  },
  evaluations: {
    all: ["evaluations"] as const,
    detail: (id: string) => ["evaluations", id] as const,
    scores: (id: string) => ["evaluations", id, "scores"] as const,
    approvals: (id: string) => ["evaluations", id, "approvals"] as const,
    modules: (gateCode: string) => ["evaluations", "modules", gateCode] as const,
  },
  methodology: {
    all: ["methodology"] as const,
    template: (orgId?: string) => ["methodology", "template", orgId] as const,
    lenses: (gateCode: string, dimensionName?: string) =>
      ["methodology", "lenses", gateCode, dimensionName] as const,
  },
  knowledgeBase: {
    all: ["knowledge-base"] as const,
    articles: (filters?: Record<string, unknown>) => ["knowledge-base", "articles", filters] as const,
    article: (slug: string) => ["knowledge-base", "article", slug] as const,
  },
  subscription: {
    current: ["subscription"] as const,
  },
};

// ── Provider ───────────────────────────────────────────────────

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Methodology data doesn't change mid-session — cache 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests twice with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            // Refetch when window regains focus (catches teammate's changes)
            refetchOnWindowFocus: true,
          },
          mutations: {
            // Retry mutations once (network blip recovery)
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

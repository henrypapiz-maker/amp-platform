"use client";

// ═══════════════════════════════════════════════════════════════
// AMP v2 — Toast + Mutation Helpers
//
// Wraps TanStack Query mutations with Sonner toast feedback.
// Every mutation shows: loading → success/error automatically.
//
// Usage:
//   const saveScore = useAmpMutation({
//     mutationFn: (data) => fetch("/api/scores", { ... }),
//     successMessage: "Score saved",
//     invalidateKeys: [queryKeys.evaluations.scores(evalId)],
//   });
//   saveScore.mutate({ dimensionName: "Revenue Quality", score: 7 });
// ═══════════════════════════════════════════════════════════════

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

interface AmpMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "onSuccess" | "onError"> {
  successMessage?: string | ((data: TData) => string);
  errorMessage?: string | ((error: TError) => string);
  invalidateKeys?: readonly unknown[][];
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  showToast?: boolean;
}

export function useAmpMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: AmpMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const {
    successMessage = "Saved",
    errorMessage = "Something went wrong. Please try again.",
    invalidateKeys = [],
    showToast = true,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }

      // Toast
      if (showToast) {
        const msg = typeof successMessage === "function"
          ? successMessage(data)
          : successMessage;
        toast.success(msg);
      }

      // User callback
      userOnSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (showToast) {
        const msg = typeof errorMessage === "function"
          ? errorMessage(error)
          : errorMessage;
        toast.error(msg);
      }
      userOnError?.(error, variables, context);
    },
  });
}

// ── Pre-built mutations for common AMP operations ──────────────

export function useSaveScore(evaluationId: string) {
  return useAmpMutation({
    mutationFn: async (data: { dimensionName: string; score: number | null; rationale?: string }) => {
      const res = await fetch(`/api/evaluations/${evaluationId}/scores`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save score");
      }
      return res.json();
    },
    successMessage: "Score saved",
    invalidateKeys: [["evaluations", evaluationId, "scores"]],
  });
}

export function useSaveLensNote(evaluationId: string) {
  return useAmpMutation({
    mutationFn: async (data: { lensId: string; content: string }) => {
      const res = await fetch(`/api/evaluations/${evaluationId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save note");
      }
      return res.json();
    },
    successMessage: "Lens note saved",
    invalidateKeys: [["evaluations", evaluationId, "scores"]],
  });
}

export function useSubmitApproval(evaluationId: string) {
  return useAmpMutation({
    mutationFn: async (data: { decision: string; rationale?: string }) => {
      const res = await fetch(`/api/evaluations/${evaluationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit approval");
      }
      return res.json();
    },
    successMessage: (data: any) =>
      data.crystallized
        ? "Gate approved and crystallized"
        : `Decision recorded (${data.approveCount}/${data.requiredApprovals} approvals)`,
    invalidateKeys: [
      ["evaluations", evaluationId, "approvals"],
      ["evaluations", evaluationId, "scores"],
      ["evaluations", evaluationId],
    ],
  });
}

export function useBreakCrystal(evaluationId: string) {
  return useAmpMutation({
    mutationFn: async (data: { justification: string }) => {
      const res = await fetch(`/api/evaluations/${evaluationId}/approve`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to break crystal");
      }
      return res.json();
    },
    successMessage: "Crystal broken — gate reset to in progress",
    errorMessage: (err: Error) => err.message,
    invalidateKeys: [
      ["evaluations", evaluationId, "approvals"],
      ["evaluations", evaluationId, "scores"],
      ["evaluations", evaluationId],
    ],
  });
}

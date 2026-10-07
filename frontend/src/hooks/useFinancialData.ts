"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCalendarView,
  fetchTransactions,
  fetchTransactionDetail,
  fetchBudgets,
  createBudget,
  fetchGoals,
  createGoal,
  fetchBehaviourScore,
  fetchRecommendations,
  fetchAnomalies,
  triggerBankSync,
  uploadStatement,
} from "@/lib/api";
import { CalendarViewMode } from "@/types/calendar";
import { BudgetCreate } from "@/types/budget";
import { GoalCreate } from "@/types/goal";

// Keys for cache management
export const queryKeys = {
  calendar: (mode: CalendarViewMode, year?: number, month?: number) => ["calendar", mode, year, month] as const,
  transactions: (limit?: number, offset?: number) => ["transactions", limit, offset] as const,
  transactionDetail: (id: string) => ["transaction", id] as const,
  budgets: () => ["budgets"] as const,
  goals: () => ["goals"] as const,
  behaviourScore: () => ["analytics", "score"] as const,
  recommendations: () => ["analytics", "recommendations"] as const,
  anomalies: () => ["analytics", "anomalies"] as const,
};

// 1. Calendar Hook
export function useCalendarData(mode: CalendarViewMode = "month", year?: number, month?: number) {
  return useQuery({
    queryKey: queryKeys.calendar(mode, year, month),
    queryFn: () => fetchCalendarView(mode, year, month),
  });
}

// 2. Transactions List Hook
export function useTransactionsList(limit: number = 100, offset: number = 0) {
  return useQuery({
    queryKey: queryKeys.transactions(limit, offset),
    queryFn: () => fetchTransactions(limit, offset),
  });
}

// 3. Transaction Detail Hook
export function useTransactionDetailQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.transactionDetail(id || ""),
    queryFn: () => fetchTransactionDetail(id!),
    enabled: Boolean(id),
  });
}

// 4. Budgets Hook
export function useBudgetsData() {
  return useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: () => fetchBudgets(),
  });
}

export function useCreateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newBudget: BudgetCreate) => createBudget(newBudget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
  });
}

// 5. Goals Hook
export function useGoalsData() {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: () => fetchGoals(),
  });
}

export function useCreateGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: GoalCreate) => createGoal(newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
}

// 6. Analytics Hooks
export function useBehaviourScoreData() {
  return useQuery({
    queryKey: queryKeys.behaviourScore(),
    queryFn: () => fetchBehaviourScore(),
  });
}

export function useRecommendationsData() {
  return useQuery({
    queryKey: queryKeys.recommendations(),
    queryFn: () => fetchRecommendations(),
  });
}

export function useAnomaliesData() {
  return useQuery({
    queryKey: queryKeys.anomalies(),
    queryFn: () => fetchAnomalies(),
  });
}

// 7. Bank Sync Mutation
export function useBankSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, institutionId }: { accountId?: string; institutionId?: string }) =>
      triggerBankSync(accountId, institutionId),
    onSuccess: () => {
      // Invalidate all financial queries after sync
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// 8. Statement Upload Mutation
export function useStatementUploadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, file }: { accountId: string; file: File }) =>
      uploadStatement(accountId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

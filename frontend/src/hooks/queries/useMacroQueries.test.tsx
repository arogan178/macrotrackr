import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useAddMacroEntry, useUpdateMacroEntry, useDeleteMacroEntry } from "./useMacroQueries";
import { macrosApi } from "@/api/macros";
import { queryKeys } from "@/lib/queryKeys";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    getHistory: vi.fn(),
    getDailyTotals: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

describe("useMacroQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAddMacroEntry", () => {
    it("should perform an optimistic update and revert on error", async () => {
      const { wrapper, queryClient } = createWrapper();

      const entryDate = "2024-01-01";
      const newEntry = {
        foodName: "Test Food",
        protein: 10,
        carbs: 20,
        fats: 5,
        mealType: "lunch" as const,
        entryDate,
        entryTime: "12:00",
      };

      // Set initial state
      queryClient.setQueryData(queryKeys.macros.dailyTotals(entryDate), {
        protein: 0, carbs: 0, fats: 0, calories: 0
      });
      queryClient.setQueryData(queryKeys.macros.historyInfinite(20, undefined, undefined), {
        pages: [{ entries: [], hasMore: false, totalCount: 0 }],
        pageParams: [0]
      });

      let rejectPromise: (reason?: any) => void;
      const promise = new Promise((_resolve, reject) => {
        rejectPromise = reject;
      });
      (macrosApi.addEntry as any).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useAddMacroEntry(), { wrapper });

      act(() => {
        result.current.mutate(newEntry);
      });

      // Verify Optimistic Update applied synchronously to the cache
      await waitFor(() => {
        const totalsDuringMutation = queryClient.getQueryData<any>(queryKeys.macros.dailyTotals(entryDate));
        expect(totalsDuringMutation?.protein).toBe(10);
      });

      const historyDuringMutation = queryClient.getQueryData<any>(queryKeys.macros.historyInfinite(20, undefined, undefined));
      expect(historyDuringMutation.pages[0].entries[0].foodName).toBe("Test Food");
      expect(historyDuringMutation.pages[0].entries[0].optimistic).toBe(true);

      // Now reject the promise to trigger failure and rollback
      act(() => {
        rejectPromise!(new Error("API Error"));
      });

      // Wait for the mutation to fail and rollback
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify Rollback
      const totalsAfterError = queryClient.getQueryData<any>(queryKeys.macros.dailyTotals(entryDate));
      expect(totalsAfterError?.protein).toBe(0);

      const historyAfterError = queryClient.getQueryData<any>(queryKeys.macros.historyInfinite(20, undefined, undefined));
      expect(historyAfterError.pages[0].entries).toHaveLength(0);
    });
  });

  describe("useUpdateMacroEntry", () => {
    it("should perform an optimistic update and revert on error", async () => {
      const { wrapper, queryClient } = createWrapper();

      const entryDate = "2024-01-01";
      const existingEntry = {
        id: 1,
        foodName: "Test Food",
        protein: 10,
        carbs: 20,
        fats: 5,
        mealType: "lunch" as const,
        entryDate,
        entryTime: "12:00",
      };
      
      const updatedEntry = {
        protein: 15,
        carbs: 25,
      };

      // Set initial state
      queryClient.setQueryData(queryKeys.macros.dailyTotals(entryDate), {
        protein: 10, carbs: 20, fats: 5, calories: 165
      });
      queryClient.setQueryData(queryKeys.macros.historyInfinite(20, undefined, undefined), {
        pages: [{ entries: [existingEntry], hasMore: false, totalCount: 1 }],
        pageParams: [0]
      });

      let rejectPromise: (reason?: any) => void;
      const promise = new Promise((_resolve, reject) => {
        rejectPromise = reject;
      });
      (macrosApi.updateEntry as any).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useUpdateMacroEntry(), { wrapper });

      act(() => {
        result.current.mutate({ id: 1, entry: updatedEntry });
      });

      // Verify Optimistic Update applied synchronously to the cache
      await waitFor(() => {
        const totalsDuringMutation = queryClient.getQueryData<any>(queryKeys.macros.dailyTotals(entryDate));
        expect(totalsDuringMutation?.protein).toBe(15);
        expect(totalsDuringMutation?.carbs).toBe(25);
      });

      const historyDuringMutation = queryClient.getQueryData<any>(queryKeys.macros.historyInfinite(20, undefined, undefined));
      expect(historyDuringMutation.pages[0].entries[0].protein).toBe(15);

      // Now reject the promise to trigger failure and rollback
      act(() => {
        rejectPromise!(new Error("API Error"));
      });

      // Wait for the mutation to fail and rollback
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify Rollback
      const totalsAfterError = queryClient.getQueryData<any>(queryKeys.macros.dailyTotals(entryDate));
      expect(totalsAfterError?.protein).toBe(10);
      expect(totalsAfterError?.carbs).toBe(20);

      const historyAfterError = queryClient.getQueryData<any>(queryKeys.macros.historyInfinite(20, undefined, undefined));
      expect(historyAfterError.pages[0].entries[0].protein).toBe(10);
    });
  });

  describe("useDeleteMacroEntry", () => {
    it("should perform an optimistic update and revert on error", async () => {
      const { wrapper, queryClient } = createWrapper();

      const entryDate = "2024-01-01";
      const existingEntry = {
        id: 1,
        foodName: "Test Food",
        protein: 10,
        carbs: 20,
        fats: 5,
        mealType: "lunch" as const,
        entryDate,
        entryTime: "12:00",
      };

      // Set initial state
      queryClient.setQueryData(queryKeys.macros.dailyTotals(entryDate), {
        protein: 10, carbs: 20, fats: 5, calories: 165
      });
      queryClient.setQueryData(queryKeys.macros.historyInfinite(20, undefined, undefined), {
        pages: [{ entries: [existingEntry], hasMore: false, totalCount: 1 }],
        pageParams: [0]
      });

      let rejectPromise: (reason?: any) => void;
      const promise = new Promise((_resolve, reject) => {
        rejectPromise = reject;
      });
      (macrosApi.deleteEntry as any).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useDeleteMacroEntry(), { wrapper });

      act(() => {
        result.current.mutate(1);
      });

      // Verify Optimistic Update applied synchronously to the cache
      await waitFor(() => {
        const totalsDuringMutation = queryClient.getQueryData<any>(queryKeys.macros.dailyTotals(entryDate));
        expect(totalsDuringMutation?.protein).toBe(0);
      });

      const historyDuringMutation = queryClient.getQueryData<any>(queryKeys.macros.historyInfinite(20, undefined, undefined));
      expect(historyDuringMutation.pages[0].entries).toHaveLength(0);

      // Now reject the promise to trigger failure and rollback
      act(() => {
        rejectPromise!(new Error("API Error"));
      });

      // Wait for the mutation to fail and rollback
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify Rollback
      const totalsAfterError = queryClient.getQueryData<any>(queryKeys.macros.dailyTotals(entryDate));
      expect(totalsAfterError?.protein).toBe(10);

      const historyAfterError = queryClient.getQueryData<any>(queryKeys.macros.historyInfinite(20, undefined, undefined));
      expect(historyAfterError.pages[0].entries).toHaveLength(1);
    });
  });
});

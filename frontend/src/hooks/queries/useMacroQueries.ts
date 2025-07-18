import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { apiService } from "@/utils/apiServices";
import type { 
  MacroEntry, 
  MacroDailyTotals, 
  MacroTargetSettings,
  PaginatedMacroHistory 
} from "@/types/macro";
import type { MacroEntryCreatePayload, MacroEntryUpdatePayload } from "@/utils/apiServices";

// Query hook for paginated macro history
export function useMacroHistory(
  limit = 20,
  offset = 0,
  options?: { startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: queryKeys.macros.history(Math.floor(offset / limit) + 1),
    queryFn: async () => {
      const response = await apiService.macros.getHistory(limit, offset, options);
      return response as PaginatedMacroHistory;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Query hook for daily macro totals by date
export function useMacroDailyTotals(date?: string) {
  const today = new Date().toISOString().split('T')[0];
  const queryDate = date || today;
  
  return useQuery({
    queryKey: queryKeys.macros.dailyTotals(queryDate),
    queryFn: async () => {
      const response = await apiService.macros.getDailyTotals({
        startDate: queryDate,
        endDate: queryDate
      });
      return response as MacroDailyTotals;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Query hook for macro targets
export function useMacroTarget() {
  return useQuery({
    queryKey: queryKeys.macros.targets(),
    queryFn: async () => {
      const response = await apiService.macros.getMacroTarget();
      return response?.macroTarget;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
// Mutation hook for adding macro entry with optimistic updates
export function useAddMacroEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: MacroEntryCreatePayload) => {
      return await apiService.macros.addEntry(entry);
    },
    onMutate: async (newEntry) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });
      
      // Optimistically update daily totals
      const previousTotals = queryClient.getQueryData(
        queryKeys.macros.dailyTotals(newEntry.entryDate)
      );
      
      if (previousTotals) {
        const totalsData = previousTotals as MacroDailyTotals;
        const calories = (newEntry.protein * 4) + (newEntry.carbs * 4) + (newEntry.fats * 9);
        
        queryClient.setQueryData(queryKeys.macros.dailyTotals(newEntry.entryDate), {
          protein: totalsData.protein + newEntry.protein,
          carbs: totalsData.carbs + newEntry.carbs,
          fats: totalsData.fats + newEntry.fats,
          calories: totalsData.calories + calories,
        });
      }
      
      return { previousTotals };
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.history() });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.macros.dailyTotals(variables.entryDate) 
      });
    },
  });
}

// Mutation hook for updating macro entry with optimistic updates
export function useUpdateMacroEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, entry }: { id: number; entry: MacroEntryUpdatePayload }) => {
      return await apiService.macros.updateEntry(id, entry);
    },
    onMutate: async ({ id, entry }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });
      
      // Find the entry in history to get the date for daily totals
      const historyQueries = queryClient.getQueriesData({ queryKey: queryKeys.macros.history() });
      let entryDate = '';
      let previousEntry: MacroEntry | null = null;
      
      // Find the entry across all history pages
      for (const [, data] of historyQueries) {
        if (data) {
          const historyData = data as PaginatedMacroHistory;
          const foundEntry = historyData.entries.find(e => e.id === id);
          if (foundEntry) {
            previousEntry = foundEntry;
            entryDate = foundEntry.entryDate;
            break;
          }
        }
      }
      
      if (!previousEntry) return;
      
      // Optimistically update history
      historyQueries.forEach(([queryKey, data]) => {
        if (data) {
          const historyData = data as PaginatedMacroHistory;
          const updatedEntries = historyData.entries.map(e => 
            e.id === id ? { ...e, ...entry } : e
          );
          
          queryClient.setQueryData(queryKey, {
            ...historyData,
            entries: updatedEntries,
          });
        }
      });
      
      // Optimistically update daily totals
      const previousTotals = queryClient.getQueryData(
        queryKeys.macros.dailyTotals(entryDate)
      );
      
      if (previousTotals && previousEntry) {
        const totalsData = previousTotals as MacroDailyTotals;
        
        // Calculate the difference
        const proteinDiff = (entry.protein ?? previousEntry.protein) - previousEntry.protein;
        const carbsDiff = (entry.carbs ?? previousEntry.carbs) - previousEntry.carbs;
        const fatsDiff = (entry.fats ?? previousEntry.fats) - previousEntry.fats;
        const caloriesDiff = (proteinDiff * 4) + (carbsDiff * 4) + (fatsDiff * 9);
        
        queryClient.setQueryData(queryKeys.macros.dailyTotals(entryDate), {
          protein: totalsData.protein + proteinDiff,
          carbs: totalsData.carbs + carbsDiff,
          fats: totalsData.fats + fatsDiff,
          calories: totalsData.calories + caloriesDiff,
        });
      }
      
      return { previousEntry, entryDate };
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.history() });
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.dailyTotals() });
    },
  });
}

// Mutation hook for deleting macro entry with optimistic updates
export function useDeleteMacroEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiService.macros.deleteEntry(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.macros.all() });
      
      // Find the entry in history to get the date and data for rollback
      const historyQueries = queryClient.getQueriesData({ queryKey: queryKeys.macros.history() });
      let entryDate = '';
      let deletedEntry: MacroEntry | null = null;
      
      // Find the entry across all history pages
      for (const [, data] of historyQueries) {
        if (data) {
          const historyData = data as PaginatedMacroHistory;
          const foundEntry = historyData.entries.find(e => e.id === id);
          if (foundEntry) {
            deletedEntry = foundEntry;
            entryDate = foundEntry.entryDate;
            break;
          }
        }
      }
      
      if (!deletedEntry) return;
      
      // Optimistically update history
      historyQueries.forEach(([queryKey, data]) => {
        if (data) {
          const historyData = data as PaginatedMacroHistory;
          const updatedEntries = historyData.entries.filter(e => e.id !== id);
          
          queryClient.setQueryData(queryKey, {
            ...historyData,
            entries: updatedEntries,
            total: historyData.total - 1,
          });
        }
      });
      
      // Optimistically update daily totals
      const previousTotals = queryClient.getQueryData(
        queryKeys.macros.dailyTotals(entryDate)
      );
      
      if (previousTotals) {
        const totalsData = previousTotals as MacroDailyTotals;
        const calories = (deletedEntry.protein * 4) + (deletedEntry.carbs * 4) + (deletedEntry.fats * 9);
        
        queryClient.setQueryData(queryKeys.macros.dailyTotals(entryDate), {
          protein: totalsData.protein - deletedEntry.protein,
          carbs: totalsData.carbs - deletedEntry.carbs,
          fats: totalsData.fats - deletedEntry.fats,
          calories: totalsData.calories - calories,
        });
      }
      
      return { deletedEntry, entryDate };
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.history() });
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.dailyTotals() });
    },
  });
}

// Mutation hook for updating macro target with cache invalidation
export function useUpdateMacroTarget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: MacroTargetSettings) => {
      return await apiService.macros.saveMacroTargetPercentages({ macroTarget: settings });
    },
    onSuccess: () => {
      // Invalidate macro targets query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.targets() });
    },
  });
}
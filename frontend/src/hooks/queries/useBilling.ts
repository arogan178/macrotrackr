import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { BillingDetailsResponse } from "@/utils/apiServices";
import { apiService } from "@/utils/apiServices";

/**
 * Query hook for fetching billing details
 */
export function useBillingDetails() {
  return useQuery({
    queryKey: queryKeys.settings.billing(),
    queryFn: async (): Promise<BillingDetailsResponse> => {
      return await apiService.billing.getBillingDetails();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
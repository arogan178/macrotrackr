import { useQuery } from "@tanstack/react-query";

import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, BillingDetailsResponse } from "@/utils/apiServices";

/**
 * Query hook for fetching billing details
 */
export function useBillingDetails() {
  return useQuery({
    queryKey: queryKeys.settings.billing(),
    queryFn: async (): Promise<BillingDetailsResponse> => {
      return await apiService.billing.getBillingDetails();
    },
    ...queryConfigs.longLived, // 5 minutes stale time for billing settings
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

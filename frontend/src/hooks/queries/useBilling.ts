import { useQuery } from "@tanstack/react-query";

import { hasStatus, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, BillingDetailsResponse } from "@/utils/apiServices";

/**
 * Query hook for fetching billing details
 */
export function useBillingDetails() {
  return useQuery({
    queryKey: queryKeys.settings.billing(),
    queryFn: (): Promise<BillingDetailsResponse> =>
      apiService.billing.getBillingDetails(),
    ...queryConfigs.longLived,
    retry: (failureCount, error) => {
      if (error instanceof Error && hasStatus(error) && error.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

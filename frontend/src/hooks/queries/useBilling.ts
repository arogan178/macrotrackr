import { useQuery } from "@tanstack/react-query";

import { billingApi, type BillingDetailsResponse } from "@/api/billing";
import { isManagedBillingMode } from "@/config/runtime";
import { hasStatus, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Query hook for fetching billing details
 */
export function useBillingDetails() {
  return useQuery({
    queryKey: queryKeys.settings.billing(),
    queryFn: (): Promise<BillingDetailsResponse> =>
      billingApi.getBillingDetails(),
    enabled: isManagedBillingMode,
    ...queryConfigs.longLived,
    retry: (failureCount, error) => {
      if (error instanceof Error && hasStatus(error) && error.status === 401) {
        return false;
      }

      return failureCount < 3;
    },
  });
}

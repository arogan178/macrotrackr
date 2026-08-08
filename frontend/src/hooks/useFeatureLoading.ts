import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export type FeatureType = string;

export function useFeatureLoading(feature: string) {
  const isQueryLoading = useIsFetching({ queryKey: [feature] }) > 0;
  const isMutationLoading = useIsMutating({ mutationKey: [feature] }) > 0;
  return {
    isQueryLoading,
    isMutationLoading,
    isLoading: isQueryLoading || isMutationLoading,
  };
}

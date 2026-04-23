import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/api/auth";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

export function useAppAuthState(): AppAuthState {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: authApi.getSession,
    ...queryConfigs.auth,
    retry: false,
  });

  return {
    isLoaded: !isLoading,
    isSignedIn: Boolean(data?.authenticated),
  };
}

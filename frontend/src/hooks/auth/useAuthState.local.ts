import { useIsRestoring, useQuery } from "@tanstack/react-query";

import { authApi } from "@/api/auth";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

export function useAppAuthState(): AppAuthState {
  const isRestoring = useIsRestoring();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: authApi.getSession,
    ...queryConfigs.auth,
    retry: false,
  });

  return {
    // Until the saved session is read back, "no session" is not an answer yet.
    isLoaded: !isLoading && !isRestoring,
    isSignedIn: Boolean(data?.authenticated),
  };
}

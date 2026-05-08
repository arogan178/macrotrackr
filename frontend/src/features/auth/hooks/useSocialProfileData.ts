import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

interface SocialProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

export function useSocialProfileData() {
  const [socialData, setSocialData] = useState<SocialProfileData | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  
  const routerState = useRouterState();
  const locationState = routerState.location.state as { socialProfileData?: SocialProfileData } | undefined;

  useEffect(() => {
    if (locationState?.socialProfileData) {
      setSocialData(locationState.socialProfileData);
      if (locationState.socialProfileData.dateOfBirth) {
        setDateOfBirth(locationState.socialProfileData.dateOfBirth);
      }
    }
  }, [locationState?.socialProfileData]);

  return { socialData, dateOfBirth, setDateOfBirth };
}

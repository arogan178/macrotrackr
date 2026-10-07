import { useEffect, useState } from "react";

interface SocialProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

function readSocialProfileData(): SocialProfileData | null {
  const storedData = sessionStorage.getItem("socialProfileData");
  if (!storedData) return null;

  try {
    return JSON.parse(storedData) as SocialProfileData;
  } catch {
    // Invalid JSON, ignore
    return null;
  }
}

export function useSocialProfileData() {
  const [socialData] = useState(readSocialProfileData);
  const [dateOfBirth, setDateOfBirth] = useState(socialData?.dateOfBirth ?? "");

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("socialProfileData");
    };
  }, []);

  return { socialData, dateOfBirth, setDateOfBirth };
}

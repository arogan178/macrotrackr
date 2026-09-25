import { useEffect, useState } from "react";

interface SocialProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

export function useSocialProfileData() {
  const [socialData, setSocialData] = useState<SocialProfileData | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");

  useEffect(() => {
    const storedData = sessionStorage.getItem("socialProfileData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as SocialProfileData;
        setSocialData(parsed);
        const socialDateOfBirth = parsed.dateOfBirth;
        if (socialDateOfBirth) {
          // A pre-fill: a date restored from the onboarding draft wins.
          setDateOfBirth((current) => current || socialDateOfBirth);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("socialProfileData");
    };
  }, []);

  return { socialData, dateOfBirth, setDateOfBirth };
}

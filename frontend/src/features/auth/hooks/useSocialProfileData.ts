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
        if (parsed.dateOfBirth) {
          setDateOfBirth(parsed.dateOfBirth);
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

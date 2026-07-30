import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Fingerprint, ScanFace } from "lucide-react";

import { authApi } from "@/api/auth";
import Button from "@/components/ui/Button";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { queryKeys } from "@/lib/queryKeys";
import {
  authenticateWithBiometrics,
  type BiometricAvailability,
  checkBiometricAvailability,
} from "@/services/biometrics";
import { useStore } from "@/store/store";

interface BiometricSignInButtonProps {
  redirectTo?: string;
}

export function BiometricSignInButton({
  redirectTo,
}: BiometricSignInButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useStore();

  const [availability, setAvailability] = useState<BiometricAvailability | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkAvailability() {
      const res = await checkBiometricAvailability();
      setAvailability(res);
    }

    void checkAvailability();
  }, []);

  if (!availability?.isAvailable) {
    return null;
  }

  const isFaceId = availability.biometryType === "Face ID";
  const label = `Sign in with ${availability.biometryType}`;

  const handleBiometricAuth = async () => {
    if (!availability.hasStoredCredentials) {
      showNotification(
        "Please sign in with your email & password once to save your biometric login for future use.",
        "info",
      );

      return;
    }

    setIsLoading(true);

    try {
      const credentials = await authenticateWithBiometrics();

      if (!credentials) {
        setIsLoading(false);

        return;
      }

      // If password/token is saved in KeyStore/Keychain, authenticate session
      if (credentials.username && credentials.password) {
        await authApi.login({
          email: credentials.username,
          password: credentials.password,
        });

        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.session(),
        });

        showNotification("Authenticated with Biometrics!", "success");

        const destination = normalizeAuthRedirect(redirectTo);
        if (destination === "/home") {
          navigate({
            to: "/home",
            search: { limit: 20, offset: 0 },
            replace: true,
          });
        } else {
          navigate({
            to: destination as any,
            replace: true,
          });
        }
      } else {
        showNotification(
          "Biometric credentials not found. Please sign in with email/password once to enable biometrics.",
          "info",
        );
      }
    } catch (err) {
      showNotification("Biometric sign-in failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={handleBiometricAuth}
        isLoading={isLoading}
        loadingText="Authenticating..."
      >
        <span className="flex items-center justify-center gap-2">
          {isFaceId ? (
            <ScanFace className="h-5 w-5 text-primary" />
          ) : (
            <Fingerprint className="h-5 w-5 text-primary" />
          )}
          <span>{label}</span>
        </span>
      </Button>
    </div>
  );
}

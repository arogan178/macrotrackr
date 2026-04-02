import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { userApi } from "@/api/user";
import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import InfoCard from "@/components/form/InfoCard";
import NumberField from "@/components/form/NumberField";
import Button from "@/components/ui/Button";
import { CheckIcon, InfoIcon } from "@/components/ui/Icons";
import { useSocialProfileData } from "@/features/auth/hooks/useSocialProfileData";
import {
  getFirstErrorMessage,
  validateStep1 as checkStep1,
  validateStep2 as checkStep2,
} from "@/features/auth/utils/profileValidation";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { logger } from "@/lib/logger";
import { hasStatus, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";
import { Gender } from "@/types/user";
import {
  USER_MAXIMUM_HEIGHT,
  USER_MAXIMUM_WEIGHT,
  USER_MINIMUM_AGE,
  USER_MINIMUM_HEIGHT,
  USER_MINIMUM_WEIGHT,
} from "@/utils/constants";
import { ACTIVITY_LEVELS, GENDER_OPTIONS } from "@/utils/userConstants";

export function ProfileCreationForm() {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: _isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { showNotification } = useStore();
  const postSetupRedirect = normalizeAuthRedirect(
    sessionStorage.getItem("postAuthRedirect") ?? undefined,
  );

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Use extracted hook for social profile data
  const { socialData, dateOfBirth, setDateOfBirth } = useSocialProfileData();

  // Profile data
  const [gender, setGender] = useState<Gender | "">("");
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<number | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): Record<string, string> => {
    const newErrors = checkStep1(dateOfBirth, gender, height, weight);
    setErrors(newErrors);

    return newErrors;
  };

  const validateStep2 = (): Record<string, string> => {
    const newErrors = checkStep2(activityLevel);
    setErrors(newErrors);

    return newErrors;
  };

  const handleNext = () => {
    if (step === 1) {
      const stepErrors = validateStep1();
      const firstError = getFirstErrorMessage(stepErrors);
      if (firstError) {
        showNotification(firstError, "error");

        return;
      }
    }

    if (step === 2) {
      const stepErrors = validateStep2();
      const firstError = getFirstErrorMessage(stepErrors);
      if (firstError) {
        showNotification(firstError, "error");

        return;
      }
    }

    setErrors({});
    setStep((previousStep) => previousStep + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((previousStep) => previousStep - 1);
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep2();
    const firstError = getFirstErrorMessage(stepErrors);
    if (firstError) {
      showNotification(firstError, "error");

      return;
    }

    // Wait for Clerk to be fully loaded
    if (!isAuthLoaded) {
      showNotification(
        "Authentication is still loading. Please wait...",
        "info",
      );

      return;
    }

    // Ensure user is authenticated
    if (!isSignedIn) {
      logger.error("Profile creation attempted without authentication:", {
        isSignedIn,
        hasGetToken: !!getToken,
      });
      showNotification(
        "Authentication required. Please sign in again.",
        "error",
      );
      navigate({ to: "/login", search: { returnTo: undefined } });

      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Sync the Clerk user to our backend
      // This creates the user record in our database
      // Note: User may already be synced from AuthReadyPage, so we handle conflicts gracefully
      try {
        await authApi.syncUser();
      } catch (syncError: unknown) {
        // If user already exists (409), that's fine - continue with profile completion
        if (
          syncError instanceof Error &&
          hasStatus(syncError) &&
          syncError.status === 409 &&
          "code" in syncError &&
          (syncError as { code?: string }).code !== "RESOURCE_CONFLICT"
        ) {
          // User already exists, safe to continue profile completion.
        } else {
          throw syncError;
        }
      }

      // Step 2: Complete the user profile with the provided data
      await userApi.completeProfile({
        dateOfBirth,
        height: height ?? undefined,
        weight: weight ?? undefined,
        gender,
        activityLevel: activityLevel ?? undefined,
      });

      // Clear social data on success
      sessionStorage.removeItem("socialProfileData");
      sessionStorage.removeItem("postAuthRedirect");

      // Refresh cached user state before navigation so guards see profile as complete.
      await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.auth.user(),
          queryFn: () => userApi.getUserDetails(),
          staleTime: 0,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.user(),
        }),
      ]);

      showNotification("Profile created successfully!", "success");

      // Redirect to home with replace for a clean onboarding transition.
      if (postSetupRedirect === "/home") {
        navigate({
          to: "/home",
          search: { limit: 20, offset: 0 },
          replace: true,
        });
      } else {
        globalThis.location.assign(postSetupRedirect);
      }
    } catch (error) {
      logger.error("Profile creation error:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to create profile",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get display name from social data or clerk user
  const displayName = socialData?.firstName ?? clerkUser?.firstName ?? "there";

  // Step 1: Basic Info
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Create Your Profile
          </h2>
          <p className="mt-2 text-muted">
            Welcome, {displayName}! Let's set up your profile
          </p>
          {socialData && (
            <p className="mt-1 text-sm text-success">
              We've pre-filled some information from your social account
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <DateField
              label="Date of Birth"
              value={dateOfBirth}
              onChange={(value: string) => {
                setDateOfBirth(value);
                if (errors.dateOfBirth) {
                  setErrors((previous) => ({ ...previous, dateOfBirth: "" }));
                }
              }}
              required
              helperText={`Must be at least ${USER_MINIMUM_AGE} years old`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-error">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <Dropdown
              label="Gender"
              value={gender}
              onChange={(value: string | number) => {
                setGender(String(value) as Gender);
                if (errors.gender) {
                  setErrors((previous) => ({ ...previous, gender: "" }));
                }
              }}
              options={GENDER_OPTIONS}
              required
            />
            {errors.gender && (
              <p className="mt-1 text-sm text-error">{errors.gender}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <NumberField
                label={`Height (${USER_MINIMUM_HEIGHT}-${USER_MAXIMUM_HEIGHT} cm)`}
                value={height ?? undefined}
                onChange={(value: number | undefined) => {
                  setHeight(value ?? null);
                  if (errors.height) {
                    setErrors((previous) => ({ ...previous, height: "" }));
                  }
                }}
                min={USER_MINIMUM_HEIGHT}
                max={USER_MAXIMUM_HEIGHT}
                step={1}
                unit="cm"
                required
              />
              {errors.height && (
                <p className="mt-1 text-sm text-error">{errors.height}</p>
              )}
            </div>

            <div>
              <NumberField
                label={`Weight (${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`}
                value={weight ?? undefined}
                onChange={(value: number | undefined) => {
                  setWeight(value ?? null);
                  if (errors.weight) {
                    setErrors((previous) => ({ ...previous, weight: "" }));
                  }
                }}
                min={USER_MINIMUM_WEIGHT}
                max={USER_MAXIMUM_WEIGHT}
                step={0.1}
                unit="kg"
                required
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-error">{errors.weight}</p>
              )}
            </div>
          </div>
        </div>

        <Button onClick={handleNext} fullWidth>
          Continue
        </Button>
      </div>
    );
  }

  // Step 2: Activity Level
  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Activity Level</h2>
          <p className="mt-2 text-muted">
            This helps us calculate your daily energy requirements
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Dropdown
              label="How active are you on a typical week?"
              value={activityLevel?.toString() ?? ""}
              onChange={(value: string | number) => {
                const normalizedValue = String(value);
                setActivityLevel(
                  normalizedValue ? Number(normalizedValue) : null,
                );
                if (errors.activityLevel) {
                  setErrors((previous) => ({ ...previous, activityLevel: "" }));
                }
              }}
              options={[
                { value: "", label: "Select activity level" },
                ...Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => ({
                  value: key,
                  label,
                })),
              ]}
              required
            />
            {errors.activityLevel && (
              <p className="mt-1 text-sm text-error">{errors.activityLevel}</p>
            )}
          </div>

          <InfoCard
            title="Why This Matters"
            description="Your activity level helps us calculate your daily energy requirements more accurately. We consider both structured exercise and everyday activities."
            color="indigo"
            icon={<InfoIcon />}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleBack} className="w-1/3">
            Back
          </Button>
          <Button onClick={handleNext} fullWidth className="w-2/3">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Review & Submit
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Review Your Profile
        </h2>
        <p className="mt-2 text-muted">
          Confirm your information before creating your profile
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
        <div className="flex justify-between">
          <span className="text-muted">Date of Birth</span>
          <span className="font-medium">{dateOfBirth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Gender</span>
          <span className="font-medium capitalize">{gender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Height</span>
          <span className="font-medium">{height} cm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Weight</span>
          <span className="font-medium">{weight} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Activity Level</span>
          <span className="text-right font-medium">
            {activityLevel ? ACTIVITY_LEVELS[activityLevel].label : "-"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleBack} className="w-1/3">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          fullWidth
          isLoading={isLoading}
          loadingText="Creating profile..."
          leftIcon={<CheckIcon />}
          className="w-2/3"
        >
          Create Profile
        </Button>
      </div>
    </div>
  );
}

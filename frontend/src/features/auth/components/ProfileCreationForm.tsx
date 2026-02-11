import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DateField, Dropdown, InfoCard, NumberField } from "@/components/form";
import Button from "@/components/ui/Button";
import { CheckIcon, InfoIcon } from "@/components/ui/Icons";
import { AUTH_ERROR_MESSAGES } from "@/features/auth/constants";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";
import { Gender } from "@/types/user";
import { apiService, setAuthToken } from "@/utils/apiServices";
import {
  USER_MAXIMUM_HEIGHT,
  USER_MAXIMUM_WEIGHT,
  USER_MINIMUM_AGE,
  USER_MINIMUM_HEIGHT,
  USER_MINIMUM_WEIGHT,
} from "@/utils/constants";
import { isOldEnough } from "@/utils/validation";
import { ACTIVITY_LEVELS, GENDER_OPTIONS } from "@/utils/userConstants";

interface SocialProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

export function ProfileCreationForm() {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { showNotification } = useStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [socialData, setSocialData] = useState<SocialProfileData | null>(null);

  // Profile data
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<number | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load social data from session storage on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("socialProfileData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as SocialProfileData;
        setSocialData(parsed);
        
        // Pre-populate date of birth if available from social login
        if (parsed.dateOfBirth) {
          setDateOfBirth(parsed.dateOfBirth);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Clear social data from session storage after loading
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("socialProfileData");
    };
  }, []);

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Date of Birth validation
    if (!dateOfBirth) {
      newErrors.dateOfBirth = AUTH_ERROR_MESSAGES.dateOfBirthRequired;
    } else if (!isOldEnough(dateOfBirth)) {
      newErrors.dateOfBirth = `You must be at least ${USER_MINIMUM_AGE} years old`;
    }

    // Gender validation
    if (!gender) {
      newErrors.gender = "Gender is required";
    }

    // Height validation
    if (!height) {
      newErrors.height = AUTH_ERROR_MESSAGES.heightRequired;
    } else if (
      height < USER_MINIMUM_HEIGHT ||
      height > USER_MAXIMUM_HEIGHT
    ) {
      newErrors.height = `Please enter a valid height (${USER_MINIMUM_HEIGHT}-${USER_MAXIMUM_HEIGHT} cm)`;
    }

    // Weight validation
    if (!weight) {
      newErrors.weight = AUTH_ERROR_MESSAGES.weightRequired;
    } else if (
      weight < USER_MINIMUM_WEIGHT ||
      weight > USER_MAXIMUM_WEIGHT
    ) {
      newErrors.weight = `Please enter a valid weight (${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Activity level validation
    if (!activityLevel) {
      newErrors.activityLevel = AUTH_ERROR_MESSAGES.activityLevelRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) {
        // Show first error as notification
        const firstError = Object.values(errors)[0];
        if (firstError) {
          showNotification(firstError, "error");
        }
        return;
      }
    }
    if (step === 2) {
      if (!validateStep2()) {
        const firstError = Object.values(errors)[0];
        if (firstError) {
          showNotification(firstError, "error");
        }
        return;
      }
    }
    setErrors({});
    setStep(step + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log("[ProfileCreationForm] handleSubmit called", { isAuthLoaded, isSignedIn, hasGetToken: !!getToken });
    
    if (!validateStep2()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showNotification(firstError, "error");
      }
      return;
    }

    // Wait for Clerk to be fully loaded
    if (!isAuthLoaded) {
      showNotification("Authentication is still loading. Please wait...", "info");
      return;
    }

    // Ensure user is authenticated
    if (!isSignedIn || !getToken) {
      console.error("[ProfileCreationForm] Not authenticated:", { isSignedIn, hasGetToken: !!getToken });
      showNotification("Authentication required. Please sign in again.", "error");
      navigate({ to: "/login" });
      return;
    }

    setIsLoading(true);

    try {
      // Get a fresh token before making API calls
      // Retry a few times if token is not immediately available
      let token: string | null = null;
      let retries = 3;
      
      while (retries > 0 && !token) {
        token = await getToken();
        if (!token && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries--;
        }
      }
      
      if (!token) {
        showNotification("Authentication failed. Please sign in again.", "error");
        navigate({ to: "/login" });
        return;
      }
      
      // Set the token for API calls
      setAuthToken(token);
      console.log("[ProfileCreationForm] Token set successfully");

      // Step 1: Sync the Clerk user to our backend
      // This creates the user record in our database
      // Note: User may already be synced from AuthReadyPage, so we handle conflicts gracefully
      console.log("[ProfileCreationForm] Syncing user with backend...");
      try {
        await apiService.auth.syncUser(token);
        console.log("[ProfileCreationForm] User synced successfully");
      } catch (syncError: any) {
        // If user already exists (409), that's fine - continue with profile completion
        if (syncError?.status === 409) {
          console.log("[ProfileCreationForm] User already exists, continuing...");
        } else {
          throw syncError;
        }
      }

      // Step 2: Complete the user profile with the provided data
      console.log("[ProfileCreationForm] Completing profile...");
      await apiService.user.completeProfile({
        dateOfBirth,
        height: height || undefined,
        weight: weight || undefined,
        gender: gender || undefined,
        activityLevel,
      });
      console.log("[ProfileCreationForm] Profile completed successfully");

      // Clear social data on success
      sessionStorage.removeItem("socialProfileData");

      // Refresh cached user state before navigation so guards see profile as complete.
      await queryClient.fetchQuery({
        queryKey: queryKeys.auth.user(),
        queryFn: () => apiService.user.getUserDetails(),
        staleTime: 0,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });

      showNotification("Profile created successfully!", "success");

      // Redirect to home with replace for a clean onboarding transition.
      navigate({ to: "/home", search: { limit: 20, offset: 0 }, replace: true });
    } catch (error) {
      console.error("[ProfileCreationForm] Profile creation error:", error);
      // Log additional context for debugging
      if (error && typeof error === 'object' && 'status' in error) {
        console.error(`[ProfileCreationForm] Error status: ${(error as any).status}`);
      }
      showNotification(
        error instanceof Error ? error.message : "Failed to create profile",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get display name from social data or clerk user
  const displayName = socialData?.firstName || clerkUser?.firstName || "there";

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
              onChange={(value) => {
                setDateOfBirth(value);
                if (errors.dateOfBirth) {
                  setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
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
              onChange={(value) => {
                setGender(value as Gender);
                if (errors.gender) {
                  setErrors((prev) => ({ ...prev, gender: "" }));
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
                value={height}
                onChange={(value) => {
                  setHeight(value);
                  if (errors.height) {
                    setErrors((prev) => ({ ...prev, height: "" }));
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
                value={weight}
                onChange={(value) => {
                  setWeight(value);
                  if (errors.weight) {
                    setErrors((prev) => ({ ...prev, weight: "" }));
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

        <Button onClick={handleNext} fullWidth iconPosition="right">
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
              value={activityLevel?.toString() || ""}
              onChange={(value) => {
                setActivityLevel(value ? Number(value) : null);
                if (errors.activityLevel) {
                  setErrors((prev) => ({ ...prev, activityLevel: "" }));
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

      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
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
          <span className="font-medium text-right">
            {activityLevel ? ACTIVITY_LEVELS[activityLevel]?.label : "-"}
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
          icon={<CheckIcon />}
          className="w-2/3"
        >
          Create Profile
        </Button>
      </div>
    </div>
  );
}

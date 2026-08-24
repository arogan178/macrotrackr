import { useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  isSwitchingSource,
  SWITCHING_SOURCE_OPTIONS,
  type SwitchingSource,
} from "@shared/product-analytics";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { goalsApi } from "@/api/goals";
import { userApi } from "@/api/user";
import Reveal from "@/components/animation/Reveal";
import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import InfoCard from "@/components/form/InfoCard";
import NumberField from "@/components/form/NumberField";
import Button from "@/components/ui/Button";
import { TYPE_SCALE } from "@/components/ui/Heading";
import { CheckIcon, InfoIcon } from "@/components/ui/Icons";
import Panel, { RULE_HAIRLINE } from "@/components/ui/Panel";
import Value from "@/components/ui/Value";
import { useSocialProfileData } from "@/features/auth/hooks/useSocialProfileData";
import {
  getFirstErrorMessage,
  validateGoalStep as checkGoalStep,
  validateStep1 as checkStep1,
  validateStep2 as checkStep2,
} from "@/features/auth/utils/profileValidation";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { cn } from "@/lib/classnameUtilities";
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
import { todayISO } from "@/utils/dateUtilities";
import { generateWeightGoalCalculations } from "@/utils/nutritionCalculations";
import {
  ACTIVITY_LEVELS,
  createNutritionProfile,
  GENDER_OPTIONS,
} from "@/utils/userConstants";

const TOTAL_STEPS = 3;

type WeightGoalChoice = "lose" | "maintain" | "gain";

const GOAL_CHOICES: { value: WeightGoalChoice; label: string }[] = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain weight" },
];

// The summary reads as a label/value ledger. Rows are divided, not boxed: a
// hairline says "same group", which is what these three figures are.
const SUMMARY_ROW = cn(
  "flex items-baseline justify-between gap-3 border-b py-3",
  "first:pt-0 last:border-b-0 last:pb-0",
  RULE_HAIRLINE,
);

const SUMMARY_LABEL = cn(TYPE_SCALE.small, "text-muted");

function StepIndicator({ step }: { step: number }) {
  return (
    <p className="text-xs font-medium tracking-wide text-muted uppercase">
      Step {step} of {TOTAL_STEPS}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="mt-1 text-sm text-error">
      {message}
    </p>
  );
}

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

  // Goal data
  const [weightGoal, setWeightGoal] = useState<WeightGoalChoice | "">("");
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [switchingSource, setSwitchingSource] = useState<
    Exclude<SwitchingSource, "unknown"> | ""
  >("");

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

  const validateGoalStep = (): Record<string, string> => {
    const newErrors = {
      ...checkGoalStep(weightGoal, targetWeight, weight),
      ...(switchingSource
        ? {}
        : { switchingSource: "Choose the option that fits best" }),
    };
    setErrors(newErrors);

    return newErrors;
  };

  // Maintenance calories, derived from the details collected in steps 1 and 2.
  const tdee =
    gender === "male" || gender === "female"
      ? createNutritionProfile({
          id: 0,
          weight: weight ?? undefined,
          height: height ?? undefined,
          dateOfBirth,
          gender,
          activityLevel: activityLevel ?? undefined,
        }).tdee
      : 0;

  // The preview has to agree with the button the user pressed. Deriving the
  // direction from the two weights alone meant a target left over from "Lose
  // weight" kept printing deficit numbers after the user switched to "Gain",
  // and the whole card sat frozen until submit finally rejected it.
  const liveGoalErrors = checkGoalStep(weightGoal, targetWeight, weight);

  // "Required" is not feedback while the field is still untouched, so the live
  // check only speaks once there is a number to disagree with.
  const targetWeightError =
    targetWeight == null ? errors.targetWeight : liveGoalErrors.targetWeight;

  const goalCalculations =
    tdee && weight && weightGoal && !getFirstErrorMessage(liveGoalErrors)
      ? generateWeightGoalCalculations(
          tdee,
          weight,
          weightGoal === "maintain" ? weight : (targetWeight ?? weight),
        )
      : undefined;

  const handleGoalChange = (choice: WeightGoalChoice) => {
    setWeightGoal(choice);
    setErrors((previous) => ({
      ...previous,
      weightGoal: "",
      targetWeight: "",
    }));
    setTargetWeight((previous) => {
      if (choice === "maintain") return null;
      if (previous == null || weight == null) return previous;

      // A target that pointed the other way is not a target for this goal.
      const pointsTheRightWay =
        choice === "lose" ? previous < weight : previous > weight;

      return pointsTheRightWay ? previous : null;
    });
  };

  const handleNext = () => {
    if (step === 1 && getFirstErrorMessage(validateStep1())) return;
    if (step === 2 && getFirstErrorMessage(validateStep2())) return;

    setErrors({});
    setStep((previousStep) => previousStep + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((previousStep) => previousStep - 1);
  };

  const handleSubmit = async () => {
    if (getFirstErrorMessage(validateGoalStep())) return;

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
        switchingSource: switchingSource || undefined,
      });

      // Step 3: Record the weight goal so the dashboard opens with a real
      // calorie target instead of falling back to bare TDEE. A failure here
      // must not strand the user mid-onboarding. The goal is editable later.
      if (goalCalculations) {
        try {
          await goalsApi.createWeightGoal({
            tdee,
            goals: { ...goalCalculations, startDate: todayISO() },
          });
        } catch (goalError) {
          logger.error("Failed to create initial weight goal", goalError);
        }
      }

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
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.all(),
        }),
      ]);

      // Redirect to home with replace for a clean onboarding transition.
      if (postSetupRedirect === "/home") {
        navigate({
          to: "/home",
          search: { limit: 20, offset: 0 },
          replace: true,
        });
      } else {
        navigate({
          to: postSetupRedirect as any,
          replace: true,
        });
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
        <StepIndicator step={1} />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">About you</h2>
          <p className="mt-2 text-muted">
            Hi {displayName} — these details set your calorie baseline.
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
            <FieldError message={errors.dateOfBirth} />
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
            <FieldError message={errors.gender} />
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
              <FieldError message={errors.height} />
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
              <FieldError message={errors.weight} />
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
        <StepIndicator step={2} />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Activity level</h2>
          <p className="mt-2 text-muted">
            This adjusts your daily calorie baseline.
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
            <FieldError message={errors.activityLevel} />
          </div>

          <InfoCard
            title="What counts as activity"
            description="Include both structured exercise and everyday movement — a job on your feet counts."
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

  // Step 3: Goal
  return (
    <div className="space-y-6">
      <StepIndicator step={3} />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          What are you working toward?
        </h2>
        <p className="mt-2 text-muted">
          {tdee
            ? `You burn about ${tdee} kcal a day. Your goal sets the target around it.`
            : "Your goal sets the daily calorie target on your dashboard."}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Dropdown
            label="What are you switching from?"
            value={switchingSource}
            onChange={(value: string | number) => {
              const source = String(value);
              setSwitchingSource(
                isSwitchingSource(source) && source !== "unknown" ? source : "",
              );
              if (errors.switchingSource) {
                setErrors((previous) => ({
                  ...previous,
                  switchingSource: "",
                }));
              }
            }}
            options={[
              { value: "", label: "Choose one" },
              ...SWITCHING_SOURCE_OPTIONS,
            ]}
            required
          />
          <FieldError message={errors.switchingSource} />
        </div>

        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Weight goal"
        >
          {GOAL_CHOICES.map((choice) => {
            const isSelected = weightGoal === choice.value;

            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleGoalChange(choice.value)}
                className={cn(
                  "cursor-pointer rounded-control border p-3 text-center transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none",
                  isSelected
                    ? "border-primary bg-primary/10 font-semibold text-foreground"
                    : "border-border bg-surface-2 text-muted hover:border-primary/40",
                )}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.weightGoal} />

        {/* Keyed on the goal so switching pills fades the panel below them in.
            The key never changes while typing, so the field keeps focus. */}
        <Reveal key={weightGoal || "unset"} className="space-y-4">
          {weightGoal !== "" && weightGoal !== "maintain" && (
            <div>
              <NumberField
                label={`Target Weight (${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`}
                value={targetWeight ?? undefined}
                onChange={(value: number | undefined) => {
                  setTargetWeight(value ?? null);
                  if (errors.targetWeight) {
                    setErrors((previous) => ({
                      ...previous,
                      targetWeight: "",
                    }));
                  }
                }}
                min={USER_MINIMUM_WEIGHT}
                max={USER_MAXIMUM_WEIGHT}
                step={0.1}
                unit="kg"
                required
              />
              <FieldError message={targetWeightError} />
            </div>
          )}

          {goalCalculations && (
            <Reveal step={1}>
              <Panel raised padding="compact">
                <dl>
                  <div className={SUMMARY_ROW}>
                    <dt className={SUMMARY_LABEL}>Daily calorie target</dt>
                    <dd>
                      <Value
                        value={goalCalculations.calorieTarget}
                        unit="kcal"
                        size="stat"
                      />
                    </dd>
                  </div>
                  {weightGoal !== "maintain" && (
                    <>
                      <div className={SUMMARY_ROW}>
                        <dt className={SUMMARY_LABEL}>Expected change</dt>
                        <dd>
                          <Value
                            value={Math.abs(goalCalculations.weeklyChange)}
                            unit="kg"
                            suffix="per week"
                          />
                        </dd>
                      </div>
                      <div className={SUMMARY_ROW}>
                        <dt className={SUMMARY_LABEL}>Time to target</dt>
                        <dd>
                          <Value
                            value={goalCalculations.calculatedWeeks}
                            suffix={
                              goalCalculations.calculatedWeeks === 1
                                ? "week"
                                : "weeks"
                            }
                          />
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
                <p className={cn(SUMMARY_LABEL, "mt-4")}>
                  You can change any of this later under Goals.
                </p>
              </Panel>
            </Reveal>
          )}
        </Reveal>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleBack} className="w-1/3">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          fullWidth
          isLoading={isLoading}
          loadingText="Setting up..."
          leftIcon={<CheckIcon />}
          className="w-2/3"
        >
          Finish setup
        </Button>
      </div>
    </div>
  );
}

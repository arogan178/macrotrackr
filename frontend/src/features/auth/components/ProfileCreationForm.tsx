import { useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  isSwitchingSource,
  SWITCHING_SOURCE_OPTIONS,
  type SwitchingSource,
} from "@shared/product-analytics";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { goalsApi } from "@/api/goals";
import { userApi } from "@/api/user";
import Reveal from "@/components/animation/Reveal";
import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import HeightField from "@/components/form/HeightField";
import InfoCard from "@/components/form/InfoCard";
import WeightField from "@/components/form/WeightField";
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
import { formatGrouped } from "@/lib/formatNumber";
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
  formatHeightRange,
  formatWeightRange,
  fromKg,
  type UnitSystem,
  weightUnit,
} from "@/utils/unitConversion";
import {
  ACTIVITY_LEVELS,
  createNutritionProfile,
  GENDER_OPTIONS,
  UNIT_SYSTEM_OPTIONS,
} from "@/utils/userConstants";

const TOTAL_STEPS = 3;

type WeightGoalChoice = "lose" | "maintain" | "gain";

interface ProfileValues {
  dateOfBirth: string;
  gender: Gender;
  unitSystem: UnitSystem;
  height: number | null;
  weight: number | null;
  activityLevel: number | null;
  weightGoal: WeightGoalChoice | "";
  // A target belongs to a direction, so it is stored per direction rather than
  // in one slot. Clearing the slot on a direction switch stopped the preview
  // contradicting itself, but it also meant looking at Gain to see what it did
  // cost you the number you had already typed for Lose.
  targetWeightByGoal: Partial<Record<"lose" | "gain", number>>;
  switchingSource: Exclude<SwitchingSource, "unknown"> | "";
}

function targetWeightFor({ weightGoal, targetWeightByGoal }: ProfileValues) {
  return weightGoal === "lose" || weightGoal === "gain"
    ? (targetWeightByGoal[weightGoal] ?? null)
    : null;
}

function stepErrors(step: number, values: ProfileValues) {
  if (step === 1) {
    return checkStep1(
      values.dateOfBirth,
      values.gender,
      values.height,
      values.weight,
      values.unitSystem,
    );
  }
  if (step === 2) return checkStep2(values.activityLevel);

  return {
    ...checkGoalStep(
      values.weightGoal,
      targetWeightFor(values),
      values.weight,
      values.unitSystem,
    ),
    ...(values.switchingSource
      ? {}
      : { switchingSource: "Choose the option that fits best" }),
  };
}

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

  // Use extracted hook for social profile data
  const { socialData, dateOfBirth: socialDateOfBirth } = useSocialProfileData();

  const defaultValues: ProfileValues = {
    // Arrives after mount; the form takes it while still untouched.
    dateOfBirth: socialDateOfBirth,
    gender: "",
    unitSystem: "metric",
    height: null,
    weight: null,
    activityLevel: null,
    weightGoal: "",
    targetWeightByGoal: {},
    switchingSource: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async () => {
      if (step < TOTAL_STEPS) {
        setStep(step + 1);

        return;
      }

      await finishSetup();
    },
  });
  const values = useFormStore(form.store, (state) => state.values);
  const isSubmitting = useFormStore(form.store, (state) => state.isSubmitting);
  const {
    dateOfBirth,
    gender,
    height,
    weight,
    activityLevel,
    unitSystem,
    weightGoal,
    switchingSource,
  } = values;

  // Each field of the current step reports its own entry on submit. Only the
  // mounted step's fields run, so submit validates exactly this step.
  const errors = stepErrors(step, values);

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

  const targetWeight = targetWeightFor(values);

  // The preview has to agree with the button the user pressed. Deriving the
  // direction from the two weights alone meant a target left over from "Lose
  // weight" kept printing deficit numbers after the user switched to "Gain",
  // and the whole card sat frozen until submit finally rejected it.
  const liveGoalErrors = checkGoalStep(
    weightGoal,
    targetWeight,
    weight,
    unitSystem,
  );

  const goalCalculations =
    tdee && weight && weightGoal && !getFirstErrorMessage(liveGoalErrors)
      ? generateWeightGoalCalculations(
          tdee,
          weight,
          weightGoal === "maintain" ? weight : (targetWeight ?? weight),
        )
      : undefined;

  // Validates the current step, then moves on or finishes.
  const handleNext = () => void form.handleSubmit();

  // Leaving a step unmounts its fields, which clears their errors.
  const handleBack = () => {
    setStep((previousStep) => previousStep - 1);
  };

  const finishSetup = async () => {
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
        unitSystem,
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
          <form.Field
            name="dateOfBirth"
            validators={{ onSubmit: () => errors.dateOfBirth }}
          >
            {(field) => (
              <div>
                <DateField
                  label="Date of Birth"
                  value={field.state.value}
                  onChange={field.handleChange}
                  required
                  helperText={`Must be at least ${USER_MINIMUM_AGE} years old`}
                />
                <FieldError message={field.state.meta.errors[0]} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="gender"
            validators={{ onSubmit: () => errors.gender }}
          >
            {(field) => (
              <div>
                <Dropdown
                  label="Gender"
                  value={field.state.value}
                  onChange={(value: string | number) =>
                    field.handleChange(String(value) as Gender)
                  }
                  options={GENDER_OPTIONS}
                  required
                />
                <FieldError message={field.state.meta.errors[0]} />
              </div>
            )}
          </form.Field>

          <form.Field name="unitSystem">
            {(field) => (
              <Dropdown
                label="Units"
                value={field.state.value}
                onChange={(value: string | number) =>
                  field.handleChange(value === "imperial" ? "imperial" : "metric")
                }
                options={UNIT_SYSTEM_OPTIONS}
              />
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Feet and inches are two inputs, too narrow to share a row. */}
            <form.Field
            name="height"
            validators={{ onSubmit: () => errors.height }}
          >
              {(field) => (
                <div
                  className={unitSystem === "imperial" ? "col-span-2" : undefined}
                >
                  <HeightField
                    label={`Height (${formatHeightRange(USER_MINIMUM_HEIGHT, USER_MAXIMUM_HEIGHT, unitSystem)})`}
                    value={field.state.value ?? undefined}
                    onChange={(value: number | undefined) =>
                      field.handleChange(value ?? null)
                    }
                    unitSystem={unitSystem}
                    min={USER_MINIMUM_HEIGHT}
                    max={USER_MAXIMUM_HEIGHT}
                    required
                  />
                  <FieldError message={field.state.meta.errors[0]} />
                </div>
              )}
            </form.Field>

            <form.Field
            name="weight"
            validators={{ onSubmit: () => errors.weight }}
          >
              {(field) => (
                <div>
                  <WeightField
                    label={`Weight (${formatWeightRange(USER_MINIMUM_WEIGHT, USER_MAXIMUM_WEIGHT, unitSystem)})`}
                    value={field.state.value ?? undefined}
                    onChange={(value: number | undefined) =>
                      field.handleChange(value ?? null)
                    }
                    unitSystem={unitSystem}
                    minKg={USER_MINIMUM_WEIGHT}
                    maxKg={USER_MAXIMUM_WEIGHT}
                    required
                  />
                  <FieldError message={field.state.meta.errors[0]} />
                </div>
              )}
            </form.Field>
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
          <form.Field
            name="activityLevel"
            validators={{ onSubmit: () => errors.activityLevel }}
          >
            {(field) => (
              <div>
                <Dropdown
                  label="How active are you on a typical week?"
                  value={activityLevel?.toString() ?? ""}
                  onChange={(value: string | number) => {
                    const normalizedValue = String(value);
                    field.handleChange(
                      normalizedValue ? Number(normalizedValue) : null,
                    );
                  }}
                  options={[
                    { value: "", label: "Select activity level" },
                    ...Object.entries(ACTIVITY_LEVELS).map(
                      ([key, { label }]) => ({
                        value: key,
                        label,
                      }),
                    ),
                  ]}
                  required
                />
                <FieldError message={field.state.meta.errors[0]} />
              </div>
            )}
          </form.Field>

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
            ? `You burn about ${formatGrouped(tdee)} kcal a day. Your goal sets the target around it.`
            : "Your goal sets the daily calorie target on your dashboard."}
        </p>
      </div>

      <div className="space-y-4">
        <form.Field
            name="switchingSource"
            validators={{ onSubmit: () => errors.switchingSource }}
          >
          {(field) => (
            <div>
              <Dropdown
                label="What are you switching from?"
                value={switchingSource}
                onChange={(value: string | number) => {
                  const source = String(value);
                  field.handleChange(
                    isSwitchingSource(source) && source !== "unknown"
                      ? source
                      : "",
                  );
                }}
                options={[
                  { value: "", label: "Choose one" },
                  ...SWITCHING_SOURCE_OPTIONS,
                ]}
                required
              />
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        {/* No clearing needed: each direction reads its own stored target, so
            Gain cannot show Lose's number and going back to Lose finds it. */}
        <form.Field
            name="weightGoal"
            validators={{ onSubmit: () => errors.weightGoal }}
          >
          {(field) => (
            <>
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
                      onClick={() => field.handleChange(choice.value)}
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
              <FieldError message={field.state.meta.errors[0]} />
            </>
          )}
        </form.Field>

        {/* Keyed on the goal so switching pills fades the panel below them in.
            The key never changes while typing, so the field keeps focus. It
            also remounts the target field, so each direction reads its own. */}
        <Reveal key={weightGoal || "unset"} className="space-y-4">
          {(weightGoal === "lose" || weightGoal === "gain") && (
            <form.Field
              name={`targetWeightByGoal.${weightGoal}`}
              validators={{ onSubmit: () => errors.targetWeight }}
            >
              {(field) => (
                <div>
                  <WeightField
                    label={`Target Weight (${formatWeightRange(USER_MINIMUM_WEIGHT, USER_MAXIMUM_WEIGHT, unitSystem)})`}
                    value={field.state.value}
                    onChange={field.handleChange}
                    unitSystem={unitSystem}
                    minKg={USER_MINIMUM_WEIGHT}
                    maxKg={USER_MAXIMUM_WEIGHT}
                    required
                  />
                  {/* "Required" is not feedback while the field is still
                      untouched, so the live check waits for a number. */}
                  <FieldError
                    message={
                      targetWeight == null
                        ? field.state.meta.errors[0]
                        : liveGoalErrors.targetWeight
                    }
                  />
                </div>
              )}
            </form.Field>
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
                            value={fromKg(
                              Math.abs(goalCalculations.weeklyChange),
                              unitSystem,
                            )}
                            unit={weightUnit(unitSystem)}
                            suffix="per week"
                          />
                        </dd>
                      </div>
                      <div className={SUMMARY_ROW}>
                        <dt className={SUMMARY_LABEL}>Time to target</dt>
                        <dd>
                          {/* The one animated figure on this card, and the
                              only one that moves: the calorie target and the
                              weekly rate are fixed per direction, while this
                              tracks every keystroke in the target weight. */}
                          <Value
                            value={goalCalculations.calculatedWeeks}
                            animate
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
          onClick={handleNext}
          fullWidth
          isLoading={isSubmitting}
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

import React, { useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormButton,
  Dropdown,
  NumberField,
  InfoCard,
  DateField,
} from "@/components/form/index";
import {
  ForwardIcon,
  BackIcon,
  CheckIcon,
  InfoIcon,
  CheckMarkIcon,
} from "@/components/Icons";
import { ACTIVITY_LEVELS, GENDER_OPTIONS } from "@/features/settings/constants";

import { USER_MINIMUM_AGE } from "@/utils/constants";
import { useStore } from "@/store/store";

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  steps: { title: string; icon?: string }[];
}

export const StepIndicator = memo(function StepIndicator({
  currentStep,
  steps,
}: StepIndicatorProps) {
  // Calculate progress percentage with 0% at step 1, 50% at step 2, and 100% at step 3
  // When there are 3 steps, we want the 0%, 50%, 100% to perfectly align with each step
  const progressPercentage =
    currentStep === 1 ? 0 : ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full mb-6">
      <div className="relative flex items-center justify-between">
        {/* Background track - position it from step 1 center to last step center */}
        <div
          className="absolute top-4 h-0.5 bg-gray-700 transform -translate-y-1/2"
          style={{
            left: `calc(${100 / (steps.length * 2)}% - 1px)`,
            right: `calc(${100 / (steps.length * 2)}% - 1px)`,
          }}
        ></div>

        {/* Progress line - dynamically sized based on current step */}
        <div
          className="absolute top-4 h-0.5 bg-indigo-500 transform -translate-y-1/2 transition-all duration-500 ease-in-out"
          style={{
            left: `calc(${100 / (steps.length * 2)}% - 1px)`,
            width: `calc(${progressPercentage}% * ${
              (steps.length - 1) / steps.length
            })`,
          }}
        ></div>

        {/* Step circles */}
        <div className="relative z-10 flex w-full justify-between">
          {steps.map((info, idx) => {
            const isComplete = idx + 1 < currentStep;
            const isCurrent = idx + 1 === currentStep;

            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                style={{
                  width: `${100 / steps.length}%`,
                }}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 transition-all duration-300 ${
                    isCurrent
                      ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white ring-2 ring-white/20 scale-110 shadow-md"
                      : isComplete
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <CheckMarkIcon className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1 transition-colors duration-300 ${
                    isCurrent
                      ? "text-white font-medium"
                      : isComplete
                      ? "text-gray-300"
                      : "text-gray-400"
                  }`}
                >
                  {info.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Base form wrapper for consistent sizing
const StepFormWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col justify-between h-full">
    <div className="flex-1">{children}</div>
  </div>
);

// Step One Component - Account Information
export function StepOne() {
  const {
    auth: { register, isLoading },
    setRegisterField,
    validateRegisterStep,
    setRegisterStep,
  } = useStore();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isValid = await validateRegisterStep(1);
      if (isValid) {
        setRegisterStep(2);
      }
    },
    [validateRegisterStep, setRegisterStep]
  );

  return (
    <StepFormWrapper>
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col h-full">
        <div className="space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="First Name"
              value={register.firstName}
              onChange={(value) => setRegisterField("firstName", value)}
              required={true}
              placeholder="John"
              textOnly={true}
            />
            <TextField
              label="Last Name"
              value={register.lastName}
              onChange={(value) => setRegisterField("lastName", value)}
              required={true}
              placeholder="Doe"
              textOnly={true}
            />
          </div>
          <TextField
            label="Email"
            value={register.email}
            onChange={(value) => setRegisterField("email", value)}
            type="email"
            required={true}
            placeholder="your@email.com"
            maxLength={30}
          />
          <TextField
            label="Password"
            value={register.password}
            onChange={(value) => setRegisterField("password", value)}
            type="password"
            required={true}
            placeholder="••••••••"
          />

          {/* Spacer for consistent form height */}
          <div className="flex-grow min-h-[40px]"></div>
        </div>

        <div className="pt-4">
          <FormButton
            type="submit"
            isLoading={isLoading}
            text="Continue"
            icon={<ForwardIcon />}
            className="w-full"
          />
        </div>
      </form>
    </StepFormWrapper>
  );
}

// Step Two Component - Profile Information
export function StepTwo() {
  const {
    auth: { register, isLoading },
    setRegisterField,
    validateRegisterStep,
    setRegisterStep,
  } = useStore();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isValid = await validateRegisterStep(2);
      if (isValid) {
        setRegisterStep(3);
      }
    },
    [validateRegisterStep, setRegisterStep]
  );

  return (
    <StepFormWrapper>
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col h-full">
        <div className="space-y-5 flex-1">
          <DateField
            label="Date of Birth"
            value={register.dateOfBirth}
            onChange={(value) => setRegisterField("dateOfBirth", value)}
            required={true}
            helperText={`Must be at least ${USER_MINIMUM_AGE} years old`}
          />

          <Dropdown
            label="Gender"
            value={register.gender}
            onChange={(value) =>
              setRegisterField("gender", value as "male" | "female")
            }
            options={GENDER_OPTIONS}
            required={true}
          />

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Height (cm)"
              value={register.height}
              onChange={(value) => setRegisterField("height", value)}
              min={150}
              max={250}
              step={1}
              unit="cm"
              required={true}
            />

            <NumberField
              label="Weight (kg)"
              value={register.weight}
              onChange={(value) => setRegisterField("weight", value)}
              min={30}
              max={300}
              step={0.1}
              unit="kg"
              required={true}
            />
          </div>

          {/* Spacer for consistent form height */}
          <div className="flex-grow min-h-[10px]"></div>
        </div>

        <div className="pt-4">
          <div className="flex gap-3">
            <FormButton
              variant="secondary"
              onClick={() => setRegisterStep(1)}
              isLoading={isLoading}
              text="Back"
              icon={<BackIcon />}
              className="w-1/3"
            />
            <FormButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              text="Continue"
              icon={<ForwardIcon />}
              className="w-2/3"
            />
          </div>
        </div>
      </form>
    </StepFormWrapper>
  );
}

// Step Three Component - Activity Level
export function StepThree() {
  const navigate = useNavigate();
  const {
    auth: { register, isLoading },
    setRegisterField,
    setRegisterStep,
    validateRegisterStep,
    submitRegistration,
  } = useStore();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isValid = await validateRegisterStep(3);
      if (isValid) {
        await submitRegistration();
        navigate("/home", { replace: true });
      }
    },
    [validateRegisterStep, submitRegistration, navigate]
  );

  return (
    <StepFormWrapper>
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col h-full">
        <div className="space-y-5 flex-1">
          <Dropdown
            label="How active are you on a typical week?"
            value={register.activityLevel}
            onChange={(value) =>
              setRegisterField("activityLevel", Number(value))
            }
            options={Object.entries(ACTIVITY_LEVELS).map(
              ([key, { label }]) => ({
                value: Number(key),
                label,
              })
            )}
            required={true}
          />

          <InfoCard
            title="Why This Matters"
            description="Your activity level helps us calculate your daily energy requirements more accurately. We consider both structured exercise and everyday activities."
            color="indigo"
            icon={<InfoIcon />}
          />

          {/* Spacer for consistent form height */}
          <div className="flex-grow min-h-[60px]"></div>
        </div>

        <div className="pt-4">
          <div className="flex gap-3">
            <FormButton
              variant="secondary"
              onClick={() => setRegisterStep(2)}
              isLoading={isLoading}
              text="Back"
              icon={<BackIcon />}
              className="w-1/3"
            />
            <FormButton
              type="submit"
              isLoading={isLoading}
              loadingText="Creating Account..."
              text="Finish"
              icon={<CheckIcon />}
              className="w-2/3"
            />
          </div>
        </div>
      </form>
    </StepFormWrapper>
  );
}

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  DateField,
  Dropdown,
  FormButton,
  InfoCard,
  NumberField,
  TextField,
} from "@/components/form";
import { BackIcon, CheckIcon, ForwardIcon, InfoIcon } from "@/components/ui";
import {
  ACTIVITY_LEVELS,
  GENDER_OPTIONS,
} from "@/features/settings/utils/constants";
import { useStore } from "@/store/store";
import { Gender } from "@/types/user";
import { USER_MINIMUM_AGE } from "@/utils/constants";

import { handleStepBack, handleStepSubmit } from "../utils";

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
    async (event: React.FormEvent) => {
      await handleStepSubmit(event, 1, {
        currentStep: 1,
        validateRegisterStep,
        setRegisterStep,
      });
    },
    [validateRegisterStep, setRegisterStep],
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
            fullWidth={true}
            iconPosition="right"
            icon={<ForwardIcon />}
          >
            Continue
          </FormButton>
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
    async (event: React.FormEvent) => {
      await handleStepSubmit(event, 2, {
        currentStep: 2,
        validateRegisterStep,
        setRegisterStep,
      });
    },
    [validateRegisterStep, setRegisterStep],
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
            onChange={(value) => setRegisterField("gender", value as Gender)}
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
              onClick={() => handleStepBack(2, setRegisterStep)}
              isLoading={isLoading}
              iconPosition="left"
              icon={<BackIcon />}
              className="w-1/3"
            >
              Back
            </FormButton>
            <FormButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              iconPosition="right"
              icon={<ForwardIcon />}
              className="w-2/3"
            >
              Continue
            </FormButton>
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
    async (event: React.FormEvent) => {
      await handleStepSubmit(event, 3, {
        currentStep: 3,
        validateRegisterStep,
        setRegisterStep,
        submitRegistration,
        navigate,
      });
    },
    [validateRegisterStep, setRegisterStep, submitRegistration, navigate],
  );

  return (
    <StepFormWrapper>
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col h-full">
        <div className="space-y-5 flex-1">
          <Dropdown
            label="How active are you on a typical week?"
            value={register.activityLevel}
            onChange={(value) =>
              setRegisterField(
                "activityLevel",
                value ? (Number(value) as never) : "",
              )
            }
            options={[
              { value: "", label: "Select activity level" },
              ...Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => ({
                value: Number(key),
                label,
              })),
            ]}
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
              onClick={() => handleStepBack(3, setRegisterStep)}
              isLoading={isLoading}
              iconPosition="left"
              icon={<BackIcon />}
              className="w-1/3"
            >
              Back
            </FormButton>
            <FormButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              loadingText="Creating Account..."
              iconPosition="right"
              icon={<CheckIcon />}
              className="w-2/3"
            >
              Finish
            </FormButton>
          </div>
        </div>
      </form>
    </StepFormWrapper>
  );
}

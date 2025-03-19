import { useCallback, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CardContainer,
  TextField,
  NumberField,
  SelectField,
  InfoCard,
} from "../FormComponents";
import { getActivityLevelOptions } from "../../utils/activityLevels";
import { useAppState } from "../../store/app-state";
import FloatingNotification from "../FloatingNotification";
import { ForwardIcon, BackIcon, CheckIcon, InfoIcon } from "../Icons";

// Common loading spinner component
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// Common form button component
interface FormButtonProps {
  isLoading: boolean;
  loadingText?: string;
  text: string | React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
  className?: string;
}

const FormButton = memo(function FormButton({
  isLoading,
  loadingText = "Processing...",
  text,
  onClick,
  type = "button",
  variant = "primary",
  icon,
  className = "",
}: FormButtonProps) {
  const baseClasses =
    "py-3 rounded-lg font-medium flex items-center justify-center";
  const primaryClasses = `${baseClasses} text-white bg-gradient-to-r from-indigo-600 to-blue-500 
                          hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/30`;
  const secondaryClasses = `${baseClasses} border border-gray-600/50 text-gray-300 hover:bg-gray-700/50`;

  const buttonClasses =
    variant === "primary" ? primaryClasses : secondaryClasses;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`${buttonClasses} disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner />
          {loadingText}
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {icon}
          {text}
        </span>
      )}
    </button>
  );
});

// Step One Component - Account Information
function StepOne() {
  const {
    auth: { register, isLoading },
    setRegisterField,
    validateRegisterStep,
    setRegisterStep,
  } = useAppState();

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
    <form onSubmit={handleSubmit} className="space-y-5">
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
      <FormButton
        type="submit"
        isLoading={isLoading}
        text="Continue"
        icon={<ForwardIcon />}
        className="w-full"
      />
    </form>
  );
}

// Step Two Component - Profile Information
function StepTwo() {
  const {
    auth: { register, isLoading },
    setRegisterField,
    validateRegisterStep,
    setRegisterStep,
  } = useAppState();

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextField
        label="Date of Birth"
        type="date"
        value={register.dateOfBirth}
        onChange={(value) => setRegisterField("dateOfBirth", value)}
        required={true}
        helperText="Must be at least 16 years old"
      />

      <SelectField
        label="Gender"
        value={register.gender}
        onChange={(value) =>
          setRegisterField("gender", value as "male" | "female")
        }
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
        ]}
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

      <div className="flex gap-3 pt-2">
        <FormButton
          variant="secondary"
          onClick={() => setRegisterStep(1)}
          text="Back"
          icon={<BackIcon />}
          className="w-1/3"
        />
        <FormButton
          type="submit"
          isLoading={isLoading}
          text="Continue"
          icon={<ForwardIcon />}
          className="w-2/3"
        />
      </div>
    </form>
  );
}

// Step Three Component - Activity Level
function StepThree() {
  const navigate = useNavigate();
  const {
    auth: { register, isLoading },
    setRegisterField,
    setRegisterStep,
    validateRegisterStep,
    submitRegistration,
  } = useAppState();

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-200 mb-1">
          Almost there!
        </h3>
        <p className="text-sm text-gray-400">
          Please select your activity level to help us calculate your daily
          calorie needs.
        </p>
      </div>

      <SelectField
        label="Activity Level"
        value={register.activityLevel}
        onChange={(value) => setRegisterField("activityLevel", value)}
        options={getActivityLevelOptions()}
        required={true}
      />

      <InfoCard
        title="Why This Matters"
        description="Your activity level helps us calculate your daily energy requirements more accurately."
        color="indigo"
        icon={<InfoIcon />}
      />

      <div className="flex gap-3 pt-3">
        <FormButton
          variant="secondary"
          onClick={() => setRegisterStep(2)}
          text="Back"
          icon={<BackIcon />}
          className="w-1/3"
        />
        <FormButton
          type="submit"
          isLoading={isLoading}
          loadingText="Creating Account..."
          text="Complete Registration"
          icon={<CheckIcon />}
          className="w-2/3"
        />
      </div>
    </form>
  );
}

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  steps: { title: string; icon: string }[];
}

const StepIndicator = memo(function StepIndicator({
  currentStep,
  steps,
}: StepIndicatorProps) {
  return (
    <div className="flex-1 flex space-x-2">
      {steps.map((info, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center">
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full mb-1
                ${
                  idx + 1 === currentStep
                    ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white border-2 border-white/20"
                    : idx + 1 < currentStep
                    ? "bg-indigo-500/50 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
          >
            {idx + 1 < currentStep ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            ) : (
              idx + 1
            )}
          </div>
          <span
            className={`text-xs ${
              idx + 1 === currentStep ? "text-white" : "text-gray-400"
            }`}
          >
            {info.title}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 w-full mt-4 ${
                idx + 1 < currentStep ? "bg-indigo-500" : "bg-gray-700"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
});

// Main RegisterForm Component
function RegisterForm() {
  const {
    auth: { register, error },
    resetRegistration,
    clearAuthError,
  } = useAppState();

  // Reset registration data when component unmounts
  useEffect(() => {
    return () => {
      resetRegistration();
    };
  }, [resetRegistration]);

  // Step indicators with titles for better visual feedback
  const stepInfo = [
    { title: "Account Info", icon: "👤" },
    { title: "Your Profile", icon: "📊" },
    { title: "Activity Level", icon: "🏃" },
  ];

  // Step titles and descriptions
  const stepTitles = {
    1: "Create Your Account",
    2: "Tell Us About Yourself",
    3: "Almost Done!",
  };

  const stepDescriptions = {
    1: "Enter your basic details to get started",
    2: "This helps us customize your experience",
    3: "Just one more step to complete your profile",
  };

  // Render current step content
  const renderCurrentStep = () => {
    switch (register.step) {
      case 1:
        return <StepOne />;
      case 2:
        return <StepTwo />;
      case 3:
        return <StepThree />;
      default:
        return <StepOne />;
    }
  };

  return (
    <CardContainer className="p-8">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <StepIndicator currentStep={register.step} steps={stepInfo} />
        </div>

        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          {stepTitles[register.step as keyof typeof stepTitles]}
        </h2>
        <p className="mt-1 text-gray-400 text-sm">
          {stepDescriptions[register.step as keyof typeof stepDescriptions]}
        </p>
      </div>

      {error && (
        <FloatingNotification
          message={error}
          type="error"
          onClose={clearAuthError}
          duration={5000}
        />
      )}

      {renderCurrentStep()}
    </CardContainer>
  );
}

export default RegisterForm;

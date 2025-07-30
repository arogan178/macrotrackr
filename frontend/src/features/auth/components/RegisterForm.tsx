import { useEffect, useState } from "react";

import { CardContainer } from "@/components/form";
import {
  StepOne,
  StepThree,
  StepTwo,
} from "@/features/auth/components/RegisterFormSteps";
import { StepIndicator } from "@/features/auth/components/StepIndicator";
import { REGISTRATION_STEPS } from "@/features/auth/utils";
import FloatingNotification from "@/features/notifications/components/FloatingNotification";
import { useFeatureLoading, useMutationErrorHandler } from "@/hooks";
import { useStore } from "@/store/store";

// Main RegisterForm Component
function RegisterForm() {
  const { register, resetRegistration } = useStore();
  const [error, setError] = useState<string | undefined>();

  // Use new loading state hooks
  const { isLoading: isAuthLoading } = useFeatureLoading("auth");
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => setError(message),
      onSuccess: (message) =>
        console.log("Registration step succeeded:", message),
    });

  // Reset registration data when component unmounts
  useEffect(() => {
    return () => {
      resetRegistration();
    };
  }, [resetRegistration]);

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
      case 1: {
        return <StepOne />;
      }
      case 2: {
        return <StepTwo />;
      }
      case 3: {
        return <StepThree />;
      }
      default: {
        return <StepOne />;
      }
    }
  };

  return (
    <CardContainer className="p-8">
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <StepIndicator
            currentStep={register.step}
            steps={REGISTRATION_STEPS}
          />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          {stepTitles[register.step as keyof typeof stepTitles]}
        </h2>
        <p className="mt-1 text-foreground text-sm">
          {stepDescriptions[register.step as keyof typeof stepDescriptions]}
        </p>
      </div>

      {error && (
        <FloatingNotification
          message={error}
          type="error"
          onClose={() => setError(undefined)}
          duration={5000}
        />
      )}

      {/* Form content container with fixed height to prevent layout shifts */}
      <div className="relative min-h-[420px] flex flex-col">
        <div className="flex-1">{renderCurrentStep()}</div>
      </div>
    </CardContainer>
  );
}

export default RegisterForm;

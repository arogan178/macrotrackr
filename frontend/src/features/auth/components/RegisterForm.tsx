import { useEffect } from "react";
import { CardContainer } from "@/components/form/index";
import { useStore } from "@/store/store";
import FloatingNotification from "@/features/notifications/components/FloatingNotification";
import {
  StepOne,
  StepTwo,
  StepThree,
  StepIndicator,
} from "@/features/auth/components/RegisterFormSteps";

// Main RegisterForm Component
function RegisterForm() {
  const {
    auth: { register, error },
    resetRegistration,
    clearAuthError,
  } = useStore();

  // Reset registration data when component unmounts
  useEffect(() => {
    return () => {
      resetRegistration();
    };
  }, [resetRegistration]);

  // Step indicators with titles for better visual feedback
  const stepInfo = [
    { title: "Account Info" },
    { title: "Your Profile" },
    { title: "Activity Level" },
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
      <div className="mb-6">
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

      {/* Form content container with fixed height to prevent layout shifts */}
      <div className="relative min-h-[420px] flex flex-col">
        <div className="flex-1">{renderCurrentStep()}</div>
      </div>
    </CardContainer>
  );
}

export default RegisterForm;

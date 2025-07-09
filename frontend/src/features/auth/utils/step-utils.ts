// Registration step utilities and configurations

export interface StepInfo {
  title: string;
  icon?: string;
}

export const REGISTRATION_STEPS: StepInfo[] = [
  { title: "Account" },
  { title: "Profile" },
  { title: "Activity" },
];

export const STEP_COUNT = REGISTRATION_STEPS.length;

/**
 * Calculate progress percentage for step indicator
 * Step 1: 0%, Step 2: 50%, Step 3: 100%
 */
export function calculateProgressPercentage(currentStep: number): number {
  if (currentStep === 1) return 0;
  return ((currentStep - 1) / (STEP_COUNT - 1)) * 100;
}

/**
 * Calculate step indicator styling positions
 */
export function getStepIndicatorStyles(stepCount: number) {
  const leftRightPosition = `calc(${100 / (stepCount * 2)}% - 1px)`;

  return {
    trackStyle: {
      left: leftRightPosition,
      right: leftRightPosition,
    },
    progressLineLeftPosition: leftRightPosition,
  };
}

/**
 * Get step circle styling classes
 */
export function getStepCircleClasses(
  stepIndex: number,
  currentStep: number,
): {
  circleClasses: string;
  labelClasses: string;
  isComplete: boolean;
  isCurrent: boolean;
} {
  const isComplete = stepIndex + 1 < currentStep;
  const isCurrent = stepIndex + 1 === currentStep;

  const circleClasses = isCurrent
    ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white ring-2 ring-white/20 scale-110 shadow-md"
    : isComplete
      ? "bg-indigo-500 text-white"
      : "bg-gray-700 text-gray-400";

  const labelClasses = isCurrent
    ? "text-white font-medium"
    : isComplete
      ? "text-gray-300"
      : "text-gray-400";

  return {
    circleClasses,
    labelClasses,
    isComplete,
    isCurrent,
  };
}

/**
 * Form step validation and navigation logic
 */
export interface StepNavigationProps {
  currentStep: number;
  validateRegisterStep: (step: number) => Promise<boolean>;
  setRegisterStep: (step: number) => void;
  submitRegistration?: () => Promise<void>;
  navigate?: (path: string, options?: { replace?: boolean }) => void;
}

export async function handleStepSubmit(
  e: React.FormEvent,
  stepNumber: number,
  navigation: StepNavigationProps,
): Promise<void> {
  e.preventDefault();

  const {
    validateRegisterStep,
    setRegisterStep,
    submitRegistration,
    navigate,
  } = navigation;
  const isValid = await validateRegisterStep(stepNumber);

  if (!isValid) return;

  // Handle final step submission
  if (stepNumber === STEP_COUNT && submitRegistration && navigate) {
    await submitRegistration();
    navigate("/home", { replace: true });
    return;
  }

  // Navigate to next step
  if (stepNumber < STEP_COUNT) {
    setRegisterStep(stepNumber + 1);
  }
}

export function handleStepBack(
  stepNumber: number,
  setRegisterStep: (step: number) => void,
): void {
  if (stepNumber > 1) {
    setRegisterStep(stepNumber - 1);
  }
}

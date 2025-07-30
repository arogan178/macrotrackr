// Registration step utilities and configurations

import { useNavigate } from "@tanstack/react-router";

const navigate = useNavigate;
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
    ? "bg-gradient-to-r from-primary to-primary text-foreground ring-2 ring-white/20 scale-110 shadow-surface"
    : isComplete
      ? "bg-primary text-foreground"
      : "bg-surface text-foreground";

  const labelClasses = isCurrent
    ? "text-foreground font-medium"
    : isComplete
      ? "text-foreground"
      : "text-foreground";

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
  event: React.FormEvent,
  stepNumber: number,
  navigation: StepNavigationProps,
): Promise<void> {
  event.preventDefault();

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
    navigate({ to: "/home", replace: true });
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

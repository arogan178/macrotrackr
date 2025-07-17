import { useMutation } from "@tanstack/react-query";

import { AUTH_ERROR_MESSAGES } from "@/features/auth/constants";
import { RegistrationStep2, RegistrationStep3 } from "@/features/auth/types";
import { RegisterData, validateEmailAvailability } from "@/features/auth/utils/authUtilities";
import {
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistrationStep3,
} from "@/features/auth/utils/validation";
import { useRegister } from "@/hooks/auth/useAuthQueries";

/**
 * Hook for email validation
 */
export function useEmailValidation() {
  return useMutation({
    mutationFn: async (email: string): Promise<boolean> => {
      return await validateEmailAvailability(email);
    },
    onError: (error) => {
      console.error("Email validation failed:", error);
    },
  });
}

/**
 * Hook for registration step validation
 */
export function useRegistrationValidation() {
  const emailValidation = useEmailValidation();

  const validateStep = async (step: number, registerData: RegisterData): Promise<{ isValid: boolean; error?: string }> => {
    let errors = {};

    switch (step) {
      case 1: {
        errors = validateRegistrationStep1(registerData);
        if (Object.keys(errors).length === 0) {
          try {
            const isEmailValid = await emailValidation.mutateAsync(registerData.email);
            return { isValid: isEmailValid };
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : AUTH_ERROR_MESSAGES.emailValidationFailed;
            return { isValid: false, error: errorMessage };
          }
        }
        break;
      }
      case 2: {
        errors = validateRegistrationStep2(registerData as RegistrationStep2);
        break;
      }
      case 3: {
        errors = validateRegistrationStep3(registerData as RegistrationStep3);
        break;
      }
      default: {
        return { isValid: false, error: AUTH_ERROR_MESSAGES.invalidStep };
      }
    }

    if (Object.keys(errors).length > 0) {
      const errorMessage =
        (Object.values(errors)[0] as string) ||
        AUTH_ERROR_MESSAGES.fillAllFields;
      return { isValid: false, error: errorMessage };
    }

    return { isValid: true };
  };

  return {
    validateStep,
    isValidating: emailValidation.isPending,
  };
}

/**
 * Hook for complete registration process
 */
export function useRegistrationProcess() {
  const registerMutation = useRegister();
  const validation = useRegistrationValidation();

  return {
    submitRegistration: registerMutation.mutateAsync,
    validateStep: validation.validateStep,
    isSubmitting: registerMutation.isPending,
    isValidating: validation.isValidating,
  };
}
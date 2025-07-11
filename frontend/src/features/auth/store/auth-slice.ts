// Define the state type for use in set callbacks
import { StateCreator } from "zustand";

import { apiService } from "@/utils/apiServices";

import { AUTH_ERROR_MESSAGES } from "../constants";
import { RegistrationStep2, RegistrationStep3 } from "../types";
import {
  AuthStateData,
  createInitialAuthState,
  forgotPassword,
  performLogin,
  performLogout,
  RegisterData,
  resetPassword,
  resetRegisterData,
  submitUserRegistration,
  updateRegisterField,
  updateRegisterStep,
  validateEmailAvailability,
} from "../utils/authUtilities";
import {
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistrationStep3,
} from "../utils/validation";

type AuthSliceState = {
  auth: AuthStateData;
  user?: unknown;
};

export interface AuthSlice {
  auth: AuthStateData;

  // Authentication methods
  setAuthEmail: (email: string) => void;
  setAuthPassword: (password: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;

  // Registration methods
  setRegisterField: <K extends keyof Omit<RegisterData, "step">>(
    field: K,
    value: RegisterData[K],
  ) => void;
  setRegisterStep: (step: number) => void;
  validateEmail: () => Promise<boolean>;
  validateRegisterStep: (step: number) => Promise<boolean>;
  submitRegistration: () => Promise<void>;
  resetRegistration: () => void;

  // Password Reset
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  rehydrateAuth: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  clearChangePasswordMessages: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (
  set,
  get,
) => ({
  setAuthState: (partial: Partial<AuthStateData>) => {
    set((state: AuthSliceState) => ({
      auth: {
        ...state.auth,
        ...partial,
      },
    }));
  },
  // Nested authentication state
  auth: createInitialAuthState(),

  // Authentication methods
  setAuthEmail: (email: string) =>
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, email },
    })),

  setAuthPassword: (password: string) =>
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, password },
    })),

  login: async (email: string, password: string) => {
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, isLoading: true, error: undefined },
    }));

    try {
      await performLogin(email, password);

      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false, isAuthenticated: true },
      }));

      // fetchUserDetails is not defined in AuthSlice, so skip this call
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : AUTH_ERROR_MESSAGES.serverError;

      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false, error: errorMessage },
      }));

      throw error;
    }
  },

  logout: () => {
    performLogout();

    set(() => ({
      auth: createInitialAuthState(),
      user: undefined,
    }));
  },

  clearAuthError: () =>
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, error: undefined },
    })),

  // Registration methods
  setRegisterField: <K extends keyof Omit<RegisterData, "step">>(
    field: K,
    value: RegisterData[K],
  ) => {
    set((state: AuthSliceState) => {
      const updatedRegister = updateRegisterField(
        state.auth.register,
        field,
        value,
      );

      return {
        auth: {
          ...state.auth,
          register: updatedRegister,
        },
      };
    });
  },

  setRegisterStep: (step: number) => {
    set((state: AuthSliceState) => {
      const updatedRegister = updateRegisterStep(state.auth.register, step);

      return {
        auth: {
          ...state.auth,
          register: updatedRegister,
        },
      };
    });
  },

  validateEmail: async () => {
    const { auth } = get();
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, isLoading: true, error: undefined },
    }));

    try {
      const valid = await validateEmailAvailability(auth.register.email);
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false },
      }));

      return valid;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : AUTH_ERROR_MESSAGES.emailValidationFailed;
      set((state: AuthSliceState) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: errorMessage,
        },
      }));
      return false;
    }
  },

  validateRegisterStep: async (step: number) => {
    const { auth } = get();
    let errors = {};

    switch (step) {
      case 1: {
        errors = validateRegistrationStep1(auth.register);
        if (Object.keys(errors).length === 0) {
          return await get().validateEmail();
        }
        break;
      }
      case 2: {
        // Cast to RegistrationStep2 to satisfy type
        errors = validateRegistrationStep2(auth.register as RegistrationStep2);
        break;
      }
      case 3: {
        // Cast to RegistrationStep3 to satisfy type
        errors = validateRegistrationStep3(auth.register as RegistrationStep3);
        break;
      }
      default: {
        set((state: AuthSliceState) => ({
          auth: { ...state.auth, error: AUTH_ERROR_MESSAGES.invalidStep },
        }));
        return false;
      }
    }

    if (Object.keys(errors).length > 0) {
      const errorMessage =
        (Object.values(errors)[0] as string) ||
        AUTH_ERROR_MESSAGES.fillAllFields;
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, error: errorMessage },
      }));
      return false;
    }

    return true;
  },

  submitRegistration: async () => {
    const { auth } = get();
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, isLoading: true, error: undefined },
    }));

    try {
      await submitUserRegistration(auth.register);

      set((state: AuthSliceState) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          isAuthenticated: true,
          register: resetRegisterData(),
        },
      }));

      // fetchUserDetails is not defined in AuthSlice, so skip this call
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : AUTH_ERROR_MESSAGES.serverError;

      set((state: AuthSliceState) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: errorMessage,
        },
      }));

      throw error;
    }
  },

  resetRegistration: () =>
    set((state: AuthSliceState) => ({
      auth: {
        ...state.auth,
        register: resetRegisterData(),
      },
    })),

  // Password Reset
  forgotPassword: async (email: string) => {
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, isLoading: true, error: undefined },
    }));
    try {
      await forgotPassword(email);
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send password reset email.";
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false, error: errorMessage },
      }));
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set((state: AuthSliceState) => ({
      auth: { ...state.auth, isLoading: true, error: undefined },
    }));
    try {
      await resetPassword(token, newPassword);
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password.";
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false, error: errorMessage },
      }));
      throw error;
    }
  },

  rehydrateAuth: async () => {
    set((state: AuthSliceState) => ({
      auth: {
        ...state.auth,
        isLoading: true,
        isAuthenticated: true,
        error: undefined,
      },
    }));
    try {
      // fetchUserDetails is not defined in AuthSlice, so skip this call
      set((state: AuthSliceState) => ({
        auth: { ...state.auth, isLoading: false },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : AUTH_ERROR_MESSAGES.serverError;
      set((state: AuthSliceState) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          isAuthenticated: false,
          error: errorMessage,
        },
      }));
      get().logout();
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set((state: AuthSliceState) => ({
      auth: {
        ...state.auth,
        isChangingPassword: true,
        changePasswordError: undefined,
        changePasswordSuccess: undefined,
      },
    }));
    try {
      // Call backend API to change password
      await apiService.auth.changePassword(currentPassword, newPassword);
      set((state: AuthSliceState) => ({
        auth: {
          ...state.auth,
          isChangingPassword: false,
          changePasswordSuccess: "Password changed successfully.",
        },
      }));
    } catch (error) {
      set((state: AuthSliceState) => ({
        auth: {
          ...state.auth,
          isChangingPassword: false,
          changePasswordError:
            error instanceof Error
              ? error.message
              : "Failed to change password.",
        },
      }));
    }
  },

  clearChangePasswordMessages: () => {
    set((state: AuthSliceState) => ({
      auth: {
        ...state.auth,
        changePasswordError: undefined,
        changePasswordSuccess: undefined,
      },
    }));
  },
});

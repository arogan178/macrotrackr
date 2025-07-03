import { StateCreator } from "zustand";
import {
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistrationStep3,
} from "../utils/validation";
import {
  RegisterData,
  AuthStateData,
  createInitialAuthState,
  performLogin,
  performLogout,
  validateEmailAvailability,
  submitUserRegistration,
  updateRegisterField,
  updateRegisterStep,
  resetRegisterData,
} from "../utils/auth-utils";
import { AUTH_ERROR_MESSAGES } from "../constants";

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
    value: RegisterData[K]
  ) => void;
  setRegisterStep: (step: number) => void;
  validateEmail: () => Promise<boolean>;
  validateRegisterStep: (step: number) => Promise<boolean>;
  submitRegistration: () => Promise<void>;
  resetRegistration: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice & any> = (set, get) => ({
  setAuthState: (partial: Partial<AuthStateData>) => {
    set((state: any) => ({
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
    set((state: any) => ({
      auth: { ...state.auth, email },
    })),

  setAuthPassword: (password: string) =>
    set((state: any) => ({
      auth: { ...state.auth, password },
    })),

  login: async (email: string, password: string) => {
    set((state: any) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));

    try {
      const token = await performLogin(email, password);

      set((state: any) => ({
        auth: { ...state.auth, isLoading: false, isAuthenticated: true },
      }));

      await get().fetchUserDetails?.();

      return token;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : AUTH_ERROR_MESSAGES.serverError;

      set((state: any) => ({
        auth: { ...state.auth, isLoading: false, error: errorMessage },
      }));

      throw err;
    }
  },

  logout: () => {
    performLogout();

    set(() => ({
      auth: createInitialAuthState(),
      user: null,
    }));
  },

  clearAuthError: () =>
    set((state: any) => ({
      auth: { ...state.auth, error: null },
    })),

  // Registration methods
  setRegisterField: <K extends keyof Omit<RegisterData, "step">>(
    field: K,
    value: RegisterData[K]
  ) => {
    set((state: any) => {
      const updatedRegister = updateRegisterField(
        state.auth.register,
        field,
        value
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
    set((state: any) => {
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
    set((state: any) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));

    try {
      const valid = await validateEmailAvailability(auth.register.email);
      set((state: any) => ({
        auth: { ...state.auth, isLoading: false },
      }));

      return valid;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : AUTH_ERROR_MESSAGES.emailValidationFailed;
      set((state: any) => ({
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
      case 1:
        errors = validateRegistrationStep1(auth.register);
        if (Object.keys(errors).length === 0) {
          return await get().validateEmail();
        }
        break;
      case 2:
        errors = validateRegistrationStep2(auth.register);
        break;
      case 3:
        errors = validateRegistrationStep3(auth.register);
        break;
      default:
        set((state: any) => ({
          auth: { ...state.auth, error: AUTH_ERROR_MESSAGES.invalidStep },
        }));
        return false;
    }

    if (Object.keys(errors).length > 0) {
      const errorMessage =
        Object.values(errors)[0] || AUTH_ERROR_MESSAGES.fillAllFields;
      set((state: any) => ({
        auth: { ...state.auth, error: errorMessage },
      }));
      return false;
    }

    return true;
  },

  submitRegistration: async () => {
    const { auth } = get();
    set((state: any) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));

    try {
      await submitUserRegistration(auth.register);

      set((state: any) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          isAuthenticated: true,
          register: resetRegisterData(),
        },
      }));

      await get().fetchUserDetails?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : AUTH_ERROR_MESSAGES.serverError;

      set((state: any) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: errorMessage,
        },
      }));

      throw err;
    }
  },

  resetRegistration: () =>
    set((state: any) => ({
      auth: {
        ...state.auth,
        register: resetRegisterData(),
      },
    })),
});

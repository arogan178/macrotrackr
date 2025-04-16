import { StateCreator } from "zustand";
import { ActivityLevel } from "@/features/settings/types";
import {
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistrationStep3,
} from "../utils/validation";
import { apiService } from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";
import { securelyStoreToken, removeToken } from "@/utils/token-storage";

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  height: number | undefined;
  weight: number | undefined;
  gender: "male" | "female" | "";
  activityLevel: ActivityLevel | "";
  step: number;
}

interface AuthState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: RegisterData;
}

export interface AuthSlice {
  auth: AuthState;

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

const initialRegisterData: RegisterData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  dateOfBirth: "",
  height: undefined,
  weight: undefined,
  gender: "",
  activityLevel: "",
  step: 1,
};

const initialAuthState: AuthState = {
  email: "",
  password: "",
  isLoading: false,
  error: null,
  isAuthenticated: false,
  register: { ...initialRegisterData },
};

export const createAuthSlice: StateCreator<AuthSlice & any> = (set, get) => ({
  // Nested authentication state
  auth: { ...initialAuthState },

  // Authentication methods
  setAuthEmail: (email) =>
    set((state) => ({
      auth: { ...state.auth, email },
    })),

  setAuthPassword: (password) =>
    set((state) => ({
      auth: { ...state.auth, password },
    })),

  login: async (email, password) => {
    set((state) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));

    try {
      const response = await apiService.auth.login(email, password);

      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      securelyStoreToken(response.token);

      set((state) => ({
        auth: { ...state.auth, isLoading: false, isAuthenticated: true },
      }));

      await get().fetchUserDetails?.();

      return response.token;
    } catch (err) {
      let errorMessage = getErrorMessage(err);

      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorMessage.includes("network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      set((state) => ({
        auth: { ...state.auth, isLoading: false, error: errorMessage },
      }));

      throw err;
    }
  },

  logout: () => {
    removeToken();

    set((state) => ({
      auth: { ...initialAuthState },
      user: null,
    }));
  },

  clearAuthError: () =>
    set((state) => ({
      auth: { ...state.auth, error: null },
    })),

  // Registration methods
  setRegisterField: (field, value) => {
    set((state) => {
      const updatedRegister = JSON.parse(JSON.stringify(state.auth.register));
      updatedRegister[field] = value;

      return {
        auth: {
          ...state.auth,
          register: updatedRegister,
        },
      };
    });
  },

  setRegisterStep: (step) => {
    set((state) => {
      const updatedRegister = JSON.parse(JSON.stringify(state.auth.register));
      updatedRegister.step = step;

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
    set((state) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));

    try {
      const { valid } = await apiService.auth.validateEmail(
        auth.register.email
      );
      set((state) => ({
        auth: { ...state.auth, isLoading: false },
      }));

      if (!valid) {
        set((state) => ({
          auth: { ...state.auth, error: "This email is already in use" },
        }));
      }

      return valid;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: `Email validation failed: ${errorMessage}`,
        },
      }));
      return false;
    }
  },

  validateRegisterStep: async (step) => {
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
        set((state) => ({
          auth: { ...state.auth, error: "Invalid step" },
        }));
        return false;
    }

    if (Object.keys(errors).length > 0) {
      const errorMessage =
        Object.values(errors)[0] || "Please fill all required fields correctly";
      set((state) => ({
        auth: { ...state.auth, error: errorMessage },
      }));
      return false;
    }

    return true;
  },

  submitRegistration: async () => {
    const { auth } = get();
    set((state) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));

    try {
      const userData = {
        firstName: auth.register.firstName,
        lastName: auth.register.lastName,
        email: auth.register.email,
        password: auth.register.password,
        dateOfBirth: auth.register.dateOfBirth,
        height: auth.register.height,
        weight: auth.register.weight,
        gender: auth.register.gender,
        activityLevel: auth.register.activityLevel,
      };

      const response = await apiService.auth.register(userData);

      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      securelyStoreToken(response.token);

      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          isAuthenticated: true,
          register: JSON.parse(JSON.stringify(initialRegisterData)),
        },
      }));

      await get().fetchUserDetails?.();
    } catch (err) {
      let errorMessage = getErrorMessage(err);

      if (
        errorMessage.includes("email") ||
        errorMessage.includes("already exists")
      ) {
        errorMessage =
          "This email is already registered. Please use a different email.";
      } else if (errorMessage.includes("password")) {
        errorMessage =
          "Password doesn't meet requirements. Please use a stronger password.";
      }

      set((state) => ({
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
    set((state) => ({
      auth: {
        ...state.auth,
        register: JSON.parse(JSON.stringify(initialRegisterData)),
      },
    })),
});

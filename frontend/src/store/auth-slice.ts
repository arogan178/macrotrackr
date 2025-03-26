import { StateCreator } from "zustand";
import type { ActivityLevel } from "../utils/activityLevels";
import {
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistrationStep3,
} from "../utils/validation";
import { apiService } from "../utils/api-service";
import { getErrorMessage } from "../utils/error-handling";
import { securelyStoreToken, removeToken } from "../utils/token-storage";

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

export interface AuthSlice {
  // Authentication state - flattened from nested auth object
  email: string;
  password: string;
  isAuthLoading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  register: RegisterData;

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

export const createAuthSlice: StateCreator<AuthSlice & any> = (set, get) => ({
  // Flattened authentication state
  email: "",
  password: "",
  isAuthLoading: false,
  authError: null,
  isAuthenticated: false,
  register: { ...initialRegisterData },

  // Authentication methods
  setAuthEmail: (email) => set({ email }),

  setAuthPassword: (password) => set({ password }),

  login: async (email, password) => {
    set({ isAuthLoading: true, authError: null });

    try {
      const response = await apiService.auth.login(email, password);

      // Validate response
      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      // Store token securely
      securelyStoreToken(response.token);

      set({
        isAuthLoading: false,
        isAuthenticated: true,
      });

      // Fetch user data after successful login
      await get().fetchUserDetails?.();

      return response.token;
    } catch (err) {
      // Handle specific error types
      let errorMessage = getErrorMessage(err);

      // Enhance error message based on error type or response
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorMessage.includes("network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      set({
        isAuthLoading: false,
        authError: errorMessage,
      });

      throw err;
    }
  },

  logout: () => {
    // Remove token securely
    removeToken();

    set({
      isAuthenticated: false,
      email: "",
      password: "",
      user: null,
    });
  },

  clearAuthError: () => set({ authError: null }),

  // Registration methods
  setRegisterField: (field, value) => {
    set((state) => {
      // Create a deep copy of register data to avoid mutation
      const updatedRegister = JSON.parse(JSON.stringify(state.register));
      updatedRegister[field] = value;

      return { register: updatedRegister };
    });
  },

  setRegisterStep: (step) => {
    set((state) => {
      // Create a deep copy of register data
      const updatedRegister = JSON.parse(JSON.stringify(state.register));
      updatedRegister.step = step;

      return { register: updatedRegister };
    });
  },

  validateEmail: async () => {
    const { register } = get();
    set({ isAuthLoading: true, authError: null });

    try {
      const { valid } = await apiService.auth.validateEmail(register.email);
      set({ isAuthLoading: false });

      if (!valid) {
        set({ authError: "This email is already in use" });
      }

      return valid;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      set({
        isAuthLoading: false,
        authError: `Email validation failed: ${errorMessage}`,
      });
      return false;
    }
  },

  validateRegisterStep: async (step) => {
    const { register } = get();
    let errors = {};

    // Step validation using utility functions
    switch (step) {
      case 1:
        errors = validateRegistrationStep1(register);
        if (Object.keys(errors).length === 0) {
          return await get().validateEmail();
        }
        break;
      case 2:
        errors = validateRegistrationStep2(register);
        break;
      case 3:
        errors = validateRegistrationStep3(register);
        break;
      default:
        set({ authError: "Invalid step" });
        return false;
    }

    if (Object.keys(errors).length > 0) {
      const errorMessage =
        Object.values(errors)[0] || "Please fill all required fields correctly";
      set({ authError: errorMessage });
      return false;
    }

    return true;
  },

  submitRegistration: async () => {
    const { register } = get();
    set({ isAuthLoading: true, authError: null });

    try {
      // Create a cleaned-up userData object from register data
      const userData = {
        firstName: register.firstName,
        lastName: register.lastName,
        email: register.email,
        password: register.password,
        dateOfBirth: register.dateOfBirth,
        height: register.height,
        weight: register.weight,
        gender: register.gender,
        activityLevel: register.activityLevel,
      };

      const response = await apiService.auth.register(userData);

      // Validate response
      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      // Store token securely
      securelyStoreToken(response.token);

      // Reset registration data and set authenticated
      set({
        isAuthLoading: false,
        isAuthenticated: true,
        register: JSON.parse(JSON.stringify(initialRegisterData)),
      });

      // Fetch user data after successful registration
      await get().fetchUserDetails?.();
    } catch (err) {
      // Handle specific error types for registration
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

      set({
        isAuthLoading: false,
        authError: errorMessage,
      });

      throw err;
    }
  },

  resetRegistration: () =>
    set({ register: JSON.parse(JSON.stringify(initialRegisterData)) }),
});

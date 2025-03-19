import { StateCreator } from "zustand";
import type { ActivityLevel } from "../../utils/activityLevels";
import {
  validateRegistrationStep1,
  validateRegistrationStep2,
  validateRegistrationStep3,
} from "../../utils/validation";
import { apiService } from "../../utils/api-service";
import { getErrorMessage } from "../../utils/error-handling";

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
  auth: {
    email: string;
    password: string;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    register: RegisterData;
  };
  isLoading: boolean;
  error: string;

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
  auth: {
    email: "",
    password: "",
    isLoading: false,
    error: null,
    isAuthenticated: false,
    register: { ...initialRegisterData },
  },
  isLoading: false,
  error: "",

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
    set((state) => ({ auth: { ...state.auth, isLoading: true, error: null } }));
    try {
      const { token } = await apiService.auth.login(email, password);
      localStorage.setItem("token", token);

      set((state) => ({
        auth: { ...state.auth, isLoading: false, isAuthenticated: true },
      }));

      // Fetch user data after successful login
      await get().fetchUserDetails?.();

      return token;
    } catch (err) {
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: getErrorMessage(err),
        },
      }));
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set((state) => ({
      auth: {
        ...state.auth,
        isAuthenticated: false,
        email: "",
        password: "",
      },
      user: null,
    }));
  },

  clearAuthError: () =>
    set((state) => ({
      auth: { ...state.auth, error: null },
    })),

  // Registration methods
  setRegisterField: (field, value) =>
    set((state) => ({
      auth: {
        ...state.auth,
        register: {
          ...state.auth.register,
          [field]: value,
        },
      },
    })),

  setRegisterStep: (step) =>
    set((state) => ({
      auth: {
        ...state.auth,
        register: {
          ...state.auth.register,
          step,
        },
      },
    })),

  validateEmail: async () => {
    const { auth } = get();
    set((state) => ({ auth: { ...state.auth, isLoading: true, error: null } }));

    try {
      const { valid } = await apiService.auth.validateEmail(
        auth.register.email
      );

      set((state) => ({ auth: { ...state.auth, isLoading: false } }));

      if (!valid) {
        set((state) => ({
          auth: {
            ...state.auth,
            error: "This email is already in use",
          },
        }));
      }

      return valid;
    } catch (err) {
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: getErrorMessage(err),
        },
      }));
      return false;
    }
  },

  validateRegisterStep: async (step) => {
    const { auth } = get();
    const { register } = auth;

    // Step 1 validation
    if (step === 1) {
      const errors = validateRegistrationStep1(register);

      if (Object.keys(errors).length > 0) {
        set((state) => ({
          auth: {
            ...state.auth,
            error:
              Object.values(errors)[0] || "Please fill in all required fields",
          },
        }));
        return false;
      }

      return await get().validateEmail();
    }

    // Step 2 validation
    if (step === 2) {
      const errors = validateRegistrationStep2(register);

      if (Object.keys(errors).length > 0) {
        set((state) => ({
          auth: {
            ...state.auth,
            error:
              Object.values(errors)[0] || "Please fill in all required fields",
          },
        }));
        return false;
      }

      return true;
    }

    // Step 3 validation
    if (step === 3) {
      const errors = validateRegistrationStep3(register);

      if (Object.keys(errors).length > 0) {
        set((state) => ({
          auth: {
            ...state.auth,
            error:
              Object.values(errors)[0] || "Please select an activity level",
          },
        }));
        return false;
      }

      return true;
    }

    return false;
  },

  submitRegistration: async () => {
    const { auth } = get();
    set((state) => ({ auth: { ...state.auth, isLoading: true, error: null } }));

    try {
      const { register } = auth;
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

      const { token } = await apiService.auth.register(userData);
      localStorage.setItem("token", token);

      // Reset registration data and set authenticated
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          isAuthenticated: true,
          register: { ...initialRegisterData },
        },
      }));

      // Fetch user data after successful registration
      await get().fetchUserDetails?.();
    } catch (err) {
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: getErrorMessage(err),
        },
      }));
      throw err;
    }
  },

  resetRegistration: () =>
    set((state) => ({
      auth: {
        ...state.auth,
        register: { ...initialRegisterData },
      },
    })),
});

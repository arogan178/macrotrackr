import { StateCreator } from "zustand";
import type { ActivityLevel } from "../../utils/activityLevels";
import { isOldEnough } from "../../utils/validation";

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: "male" | "female" | "";
  activityLevel: ActivityLevel | "";
};

export interface AuthSlice {
  // State
  auth: {
    email: string;
    password: string;
    isLoading: boolean;
    error: string;
  };
  registrationData: RegistrationData;
  isLoading: boolean;
  error: string;

  // Actions
  setAuthEmail: (email: string) => void;
  setAuthPassword: (password: string) => void;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;

  // Registration actions
  setRegistrationData: (
    updater: (prev: RegistrationData) => RegistrationData
  ) => void;
  clearRegistrationData: () => void;
  setError: (error: string) => void;
  register: (data: any) => Promise<void>;
  validateEmail: (email: string) => Promise<{ valid: boolean }>;

  // Helper functions
  isOldEnough: (dateOfBirth: string) => boolean;
}

const initialRegistrationData: RegistrationData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  dateOfBirth: "",
  height: 0,
  weight: 0,
  gender: "",
  activityLevel: "",
};

export const createAuthSlice: StateCreator<AuthSlice & any> = (set, get) => ({
  // State
  auth: {
    email: "",
    password: "",
    isLoading: false,
    error: "",
  },
  registrationData: JSON.parse(
    localStorage.getItem("registration_data") ||
      JSON.stringify(initialRegistrationData)
  ),
  isLoading: false,
  error: "",

  // Use imported function instead of redefining
  isOldEnough,

  // Actions
  setAuthEmail: (email) =>
    set((state) => ({
      auth: { ...state.auth, email },
    })),

  setAuthPassword: (password) =>
    set((state) => ({
      auth: { ...state.auth, password },
    })),

  clearAuthError: () =>
    set((state) => ({
      auth: { ...state.auth, error: "" },
    })),

  login: async (email, password) => {
    set((state) => ({ auth: { ...state.auth, isLoading: true, error: "" } }));

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const { token } = await response.json();
      localStorage.setItem("token", token);

      set((state) => ({ auth: { ...state.auth, isLoading: false } }));

      // Fetch user data after successful login
      await get().fetchUserDetails?.();

      return token;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      set((state) => ({
        auth: { ...state.auth, error: errorMessage, isLoading: false },
      }));
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set((state) => ({
      auth: { ...state.auth, email: "", password: "" },
      user: null,
      // Reset other user-specific states as needed
    }));
  },

  // Registration actions
  setRegistrationData: (updater) => {
    set((state) => {
      const newData = updater(state.registrationData);
      localStorage.setItem("registration_data", JSON.stringify(newData));
      return { registrationData: newData };
    });
  },

  clearRegistrationData: () => {
    localStorage.removeItem("registration_data");
    localStorage.removeItem("registration_step");
    set({ registrationData: initialRegistrationData });
  },

  setError: (error) => set({ error }),

  register: async (data) => {
    set({ isLoading: true, error: "" });

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/register-complete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            dateOfBirth: data.dateOfBirth,
            height: parseFloat(data.height.toString()),
            weight: parseFloat(data.weight.toString()),
            gender: data.gender || "male", // Default to male if not provided
            activityLevel: data.activityLevel,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const { token } = await response.json();
      localStorage.setItem("token", token);

      // Clear registration data after successful registration
      get().clearRegistrationData();

      // Refresh user data after successful registration
      await get().fetchUserDetails?.();

      set({ isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  // Email validation
  validateEmail: async (email) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/validate-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        return { valid: false };
      }

      return { valid: true };
    } catch (err) {
      set({ error: "Email validation failed" });
      return { valid: false };
    }
  },
});

import { StateCreator } from "zustand";

import {
  RegisterData,
  resetRegisterData,
  updateRegisterField,
  updateRegisterStep,
} from "../utils/authUtilities";

// UI-only auth state for form management
export interface AuthUISlice {
  // Login form state
  loginEmail: string;
  loginPassword: string;
  setLoginEmail: (email: string) => void;
  setLoginPassword: (password: string) => void;
  clearLoginForm: () => void;

  // Registration form state
  register: RegisterData;
  setRegisterField: <K extends keyof Omit<RegisterData, "step">>(
    field: K,
    value: RegisterData[K],
  ) => void;
  setRegisterStep: (step: number) => void;
  resetRegistration: () => void;
}

export const createAuthUISlice: StateCreator<
  AuthUISlice,
  [],
  [],
  AuthUISlice
> = (set) => ({
  // Login form state
  loginEmail: "",
  loginPassword: "",
  setLoginEmail: (email: string) => set({ loginEmail: email }),
  setLoginPassword: (password: string) => set({ loginPassword: password }),
  clearLoginForm: () => set({ loginEmail: "", loginPassword: "" }),

  // Registration form state
  register: resetRegisterData(),
  setRegisterField: <K extends keyof Omit<RegisterData, "step">>(
    field: K,
    value: RegisterData[K],
  ) => {
    set((state) => ({
      register: updateRegisterField(state.register, field, value),
    }));
  },
  setRegisterStep: (step: number) => {
    set((state) => ({
      register: updateRegisterStep(state.register, step),
    }));
  },
  resetRegistration: () => set({ register: resetRegisterData() }),
});

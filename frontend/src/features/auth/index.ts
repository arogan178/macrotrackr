/**
 * Auth feature public API.
 * Expose stable entry points for external consumers.
 */

export { default as AuthPageShell } from "./components/AuthPageShell";
export { ClerkSignInForm } from "./components/ClerkSignInForm";
export { ClerkSignUpForm } from "./components/ClerkSignUpForm";
export { ProfileCreationForm } from "./components/ProfileCreationForm";
export { AUTH_ERROR_MESSAGES } from "./constants";
export { useAuthReady } from "./hooks/useAuthReady";
export { useSocialProfileData } from "./hooks/useSocialProfileData";
export { default as AuthReadyPage } from "./pages/AuthReadyPage";
export { default as ProfileSetupPage } from "./pages/ProfileSetupPage";
export { default as SignInPage } from "./pages/SignInPage";
export { default as SignUpPage } from "./pages/SignUpPage";
export { default as SSOCallbackPage } from "./pages/SsoCallbackPage";
export * from "./utils/authHelpers";
export * from "./utils/handleAuthCollision";
export * from "./utils/linkIntent";
export * from "./utils/profileValidation";
export * from "./utils/redirect";
export * from "./utils/socialAuth";

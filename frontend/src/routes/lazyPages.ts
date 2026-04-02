import React from "react";

// Auth pages
export const SignInPage = React.lazy(() => import("@/features/auth/pages/SignInPage"));
export const SignUpPage = React.lazy(() => import("@/features/auth/pages/SignUpPage"));
export const ProfileSetupPage = React.lazy(() => import("@/features/auth/pages/ProfileSetupPage"));
export const AuthReadyPage = React.lazy(() => import("@/features/auth/pages/AuthReadyPage"));
export const SSOCallbackPage = React.lazy(() => import("@/features/auth/pages/SsoCallbackPage"));
export const ResetPasswordPage = React.lazy(() => import("@/features/auth/pages/ResetPasswordPage"));

// Feature pages
export const LandingPage = React.lazy(() => import("@/features/landing/pages/LandingPage"));
export const HomePage = React.lazy(() => import("@/features/macroTracking/pages/HomePage"));
export const SettingsPage = React.lazy(() => import("@/features/settings/pages/SettingsPage"));
export const GoalsPage = React.lazy(() => import("@/features/goals/pages/GoalsPage"));
export const ReportingPage = React.lazy(() => import("@/features/reporting/pages/ReportingPage"));
export const PricingPage = React.lazy(() => import("@/features/billing/pages/PricingPage"));

// Legal pages
export const TermsAndConditionsPage = React.lazy(() => import("@/features/landing/pages/TermsAndConditionsPage"));
export const PrivacyPolicyPage = React.lazy(() => import("@/features/landing/pages/PrivacyPolicyPage"));

// UI pages
export const NotFoundPage = React.lazy(() => import("@/routes/NotFoundPage"));

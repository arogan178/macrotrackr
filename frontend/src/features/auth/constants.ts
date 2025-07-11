// Registration step configuration
export const REGISTRATION_STEPS = [
  { title: "Account", icon: "user" },
  { title: "Profile", icon: "profile" },
  { title: "Activity", icon: "activity" },
] as const;

export const TOTAL_REGISTRATION_STEPS = 3;

// Form validation constants
export const PASSWORD_VALIDATION = {
  minLength: 6,
  maxLength: 128,
} as const;

export const HEIGHT_VALIDATION = {
  min: 100, // cm
  max: 250, // cm
} as const;

export const WEIGHT_VALIDATION = {
  min: 30, // kg
  max: 300, // kg
} as const;

// Error messages for authentication
export const AUTH_ERROR_MESSAGES = {
  // Login errors
  invalidCredentials: "Invalid email or password. Please try again.",
  networkError: "Network error. Please check your connection and try again.",
  serverError: "Invalid response from server",

  // Registration errors
  emailInUse: "This email is already in use",
  emailExists:
    "This email is already registered. Please use a different email.",
  passwordWeak:
    "Password doesn't meet requirements. Please use a stronger password.",
  invalidStep: "Invalid step",
  fillAllFields: "Please fill all required fields correctly",

  // Email validation
  emailValidationFailed: "Email validation failed",

  // Field-specific errors
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  passwordRequired: "Password is required",
  passwordTooShort: "Password must be at least 6 characters",
  dateOfBirthRequired: "Date of birth is required",
  heightRequired: "Height is required",
  heightInvalid: "Please enter a valid height (100-250 cm)",
  weightRequired: "Weight is required",
  weightInvalid: "Please enter a valid weight (30-300 kg)",
  activityLevelRequired: "Activity level is required",
} as const;

// Success messages
export const AUTH_SUCCESS_MESSAGES = {
  loginSuccess: "Successfully logged in!",
  registrationSuccess: "Account created successfully!",
  emailValidated: "Email is available",
} as const;

// Loading states
export const LOADING_STATES = {
  loggingIn: "Logging in...",
  registering: "Creating account...",
  validatingEmail: "Checking email availability...",
  fetchingUser: "Loading user data...",
} as const;

// UI constants
export const FORM_UI = {
  progressAnimationDuration: 500, // ms
  stepIndicatorScale: 1.1,
  buttonLoadingText: "Please wait...",
} as const;

// Step-specific UI text
export const STEP_CONTENT = {
  step1: {
    title: "Create Your Account",
    subtitle: "Enter your basic information to get started",
    buttonText: "Continue",
  },
  step2: {
    title: "Personal Profile",
    subtitle: "Help us personalize your experience",
    buttonText: "Continue",
  },
  step3: {
    title: "Activity Level",
    subtitle: "Tell us about your lifestyle",
    buttonText: "Create Account",
  },
} as const;

// API-related constants
export const API_TIMEOUTS = {
  login: 10_000, // 10 seconds
  register: 15_000, // 15 seconds
  emailValidation: 5000, // 5 seconds
} as const;

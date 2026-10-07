import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClerkSignInForm } from "@/features/auth/components/ClerkSignInForm";

// Hoisted so the vi.mock factories below can reference them; vi.mock is
// lifted above module-level consts.
const {
  signInCreate,
  prepareSecondFactor,
  attemptSecondFactor,
  attemptFirstFactor,
  setActive,
  navigate,
  showNotification,
  saveBiometricCredentials,
} = vi.hoisted(() => ({
  signInCreate: vi.fn(),
  prepareSecondFactor: vi.fn(),
  attemptSecondFactor: vi.fn(),
  attemptFirstFactor: vi.fn(),
  setActive: vi.fn(),
  navigate: vi.fn(),
  showNotification: vi.fn(),
  saveBiometricCredentials: vi.fn(),
}));

// AnimatePresence mode="wait" defers mounting the next child until the exit
// animation resolves, which never happens under jsdom. Render children
// directly so the flow can be driven synchronously.
vi.mock("motion/react", () => {
  // Cache per tag: returning a fresh component from the proxy on every access
  // would give React a new element type each render, remounting the subtree
  // and wiping input state.
  const components = new Map<string, React.FC<Record<string, unknown>>>();

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({} as Record<string, React.FC>, {
      get: (_target, tag: string) => {
        const cached = components.get(tag);
        if (cached) {
          return cached;
        }

        const Component = ({
          children,
          ...properties
        }: React.PropsWithChildren<Record<string, unknown>>) => {
          const {
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            ...domProps
          } = properties;

          return <div {...domProps}>{children}</div>;
        };
        Component.displayName = `motion.${tag}`;
        components.set(tag, Component);

        return Component;
      },
    }),
  };
});

vi.mock("@clerk/react", () => ({
  useClerk: () => ({}),
}));

vi.mock("@clerk/react/legacy", () => ({
  useSignIn: () => ({
    isLoaded: true,
    setActive,
    signIn: {
      create: signInCreate,
      prepareSecondFactor,
      attemptSecondFactor,
      attemptFirstFactor,
    },
  }),
  useSignUp: () => ({ isLoaded: true, signUp: {} }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/store/store", () => ({
  useStore: () => ({ showNotification }),
}));

vi.mock("@/services/biometrics", () => ({
  saveBiometricCredentials,
}));

vi.mock("@/services/native/googleAuth", () => ({
  exchangeNativeGoogleTokenWithClerk: vi.fn(),
  nativeGoogleSignIn: vi.fn(),
}));

vi.mock("@/services/native/platform", () => ({
  isNativePlatform: () => false,
}));

vi.mock("@/features/auth/components/BiometricSignInButton", () => ({
  BiometricSignInButton: () => null,
}));

vi.mock("@/features/auth/components/SocialAuthOptions", () => ({
  SocialAuthOptions: ({
    onContinueWithEmail,
  }: {
    onContinueWithEmail: () => void;
  }) => (
    <button type="button" onClick={onContinueWithEmail}>
      Continue with email
    </button>
  ),
}));

vi.mock("@/features/auth/utils/linkIntent", () => ({
  getAuthLinkIntent: () => null,
}));

async function requestResetCode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /continue with email/i }));
  await user.type(screen.getByLabelText(/email/i), "user@example.com");
  await user.click(screen.getByRole("button", { name: /forgot password/i }));

  expect(screen.getByLabelText(/email/i)).toHaveValue("user@example.com");
  await user.click(screen.getByRole("button", { name: /send reset code/i }));

  await screen.findByLabelText(/reset code/i);
}

async function submitReset(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/reset code/i), "424242");
  await user.type(screen.getByLabelText(/new password/i), "a-new-long-password");
  await user.click(screen.getByRole("button", { name: /^reset password$/i }));
}

function renderForm() {
  render(<ClerkSignInForm onSwitchToSignUp={vi.fn()} redirectTo="/home" />);
}

describe("ClerkSignInForm password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInCreate.mockResolvedValue({ status: "needs_first_factor" });
    prepareSecondFactor.mockResolvedValue({});
  });

  it("sends a reset code, sets the new password and signs in", async () => {
    const user = userEvent.setup();
    attemptFirstFactor.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_reset",
    });

    renderForm();
    await requestResetCode(user);

    expect(signInCreate).toHaveBeenCalledWith({
      strategy: "reset_password_email_code",
      identifier: "user@example.com",
    });
    expect(
      screen.getByRole("button", { name: /resend code in 30s/i }),
    ).toBeDisabled();

    await submitReset(user);

    expect(attemptFirstFactor).toHaveBeenCalledWith({
      strategy: "reset_password_email_code",
      code: "424242",
      password: "a-new-long-password",
    });
    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: "sess_reset" });
    });
    expect(navigate).toHaveBeenCalledWith({
      to: "/auth-ready",
      search: { redirectTo: "/home" },
    });
  });

  it.each([
    ["form_code_incorrect", "Incorrect code"],
    [
      "form_password_pwned",
      "Password has been found in an online data breach. For account safety, please use a different password.",
    ],
  ])("shows Clerk's message for %s and stays on the form", async (code, longMessage) => {
    const user = userEvent.setup();
    attemptFirstFactor.mockRejectedValue({
      errors: [{ code, message: "short", longMessage }],
    });

    renderForm();
    await requestResetCode(user);
    await submitReset(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(longMessage);
    expect(screen.getByLabelText(/reset code/i)).toBeInTheDocument();
    expect(setActive).not.toHaveBeenCalled();
  });

  it("hands over to the second-factor challenge when 2FA is on", async () => {
    const user = userEvent.setup();
    attemptFirstFactor.mockResolvedValue({
      status: "needs_second_factor",
      supportedSecondFactors: [{ strategy: "totp" }],
    });
    attemptSecondFactor.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_2fa",
    });

    renderForm();
    await requestResetCode(user);
    await submitReset(user);

    await screen.findByText("Two-factor authentication");
    await user.type(screen.getByLabelText(/code/i), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: "sess_2fa" });
    });
  });
});


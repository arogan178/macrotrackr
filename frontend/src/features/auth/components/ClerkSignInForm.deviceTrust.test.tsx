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
  setActive,
  navigate,
  showNotification,
  saveBiometricCredentials,
} = vi.hoisted(() => ({
  signInCreate: vi.fn(),
  prepareSecondFactor: vi.fn(),
  attemptSecondFactor: vi.fn(),
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

async function signInWithPassword(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /continue with email/i }));
  await user.type(screen.getByLabelText(/email/i), "user@example.com");
  await user.type(screen.getByLabelText(/password/i), "correct-horse");
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

function renderForm() {
  render(
    <ClerkSignInForm
      onSwitchToSignUp={vi.fn()}
      onForgotPassword={vi.fn()}
      redirectTo="/home"
    />,
  );
}

describe("ClerkSignInForm device trust", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepareSecondFactor.mockResolvedValue({});
  });

  it("challenges for an email code when Clerk reports needs_client_trust", async () => {
    const user = userEvent.setup();
    signInCreate.mockResolvedValue({
      status: "needs_client_trust",
      supportedSecondFactors: [
        {
          strategy: "email_code",
          emailAddressId: "idn_1",
          safeIdentifier: "u****@example.com",
        },
      ],
    });

    renderForm();
    await signInWithPassword(user);

    await waitFor(() => {
      expect(prepareSecondFactor).toHaveBeenCalledWith({
        strategy: "email_code",
        emailAddressId: "idn_1",
      });
    });

    expect(await screen.findByText("Verify this device")).toBeInTheDocument();
    expect(screen.getByText(/u\*{4}@example\.com/)).toBeInTheDocument();
  });

  it("completes the sign-in once the code verifies", async () => {
    const user = userEvent.setup();
    signInCreate.mockResolvedValue({
      status: "needs_client_trust",
      supportedSecondFactors: [{ strategy: "email_code" }],
    });
    attemptSecondFactor.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_abc",
    });

    renderForm();
    await signInWithPassword(user);

    await screen.findByText("Verify this device");
    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => {
      expect(attemptSecondFactor).toHaveBeenCalledWith({
        strategy: "email_code",
        code: "123456",
      });
    });

    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: "sess_abc" });
    });
    expect(navigate).toHaveBeenCalledWith({
      to: "/auth-ready",
      search: { redirectTo: "/home" },
    });
  });

  it("keeps the user on the challenge and explains a rejected code", async () => {
    const user = userEvent.setup();
    signInCreate.mockResolvedValue({
      status: "needs_client_trust",
      supportedSecondFactors: [{ strategy: "email_code" }],
    });
    attemptSecondFactor.mockRejectedValue({
      errors: [{ code: "verification_expired", message: "expired" }],
    });

    renderForm();
    await signInWithPassword(user);

    await screen.findByText("Verify this device");
    await user.type(screen.getByLabelText(/verification code/i), "000000");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That code has expired. Request a new one.",
    );
    expect(setActive).not.toHaveBeenCalled();
  });

  it("uses the same challenge for MFA, preferring the authenticator app", async () => {
    const user = userEvent.setup();
    signInCreate.mockResolvedValue({
      status: "needs_second_factor",
      supportedSecondFactors: [
        { strategy: "email_code" },
        { strategy: "totp" },
      ],
    });

    renderForm();
    await signInWithPassword(user);

    expect(
      await screen.findByText("Two-factor authentication"),
    ).toBeInTheDocument();
    // TOTP needs no delivery, so nothing should have been sent.
    expect(prepareSecondFactor).not.toHaveBeenCalled();
  });

  it("still completes normally when no second factor is required", async () => {
    const user = userEvent.setup();
    signInCreate.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_direct",
    });

    renderForm();
    await signInWithPassword(user);

    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: "sess_direct" });
    });
    expect(prepareSecondFactor).not.toHaveBeenCalled();
  });
});

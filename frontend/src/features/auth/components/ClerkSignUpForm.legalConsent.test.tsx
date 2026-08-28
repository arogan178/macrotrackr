import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClerkSignUpForm } from "@/features/auth/components/ClerkSignUpForm";

// Hoisted so the vi.mock factories below can reference them; vi.mock is
// lifted above module-level consts.
const {
  signUpCreate,
  signUpUpdate,
  prepareEmailAddressVerification,
  attemptEmailAddressVerification,
  setActive,
  navigate,
  showNotification,
  signUpState,
} = vi.hoisted(() => ({
  signUpCreate: vi.fn(),
  signUpUpdate: vi.fn(),
  prepareEmailAddressVerification: vi.fn(),
  attemptEmailAddressVerification: vi.fn(),
  setActive: vi.fn(),
  navigate: vi.fn(),
  showNotification: vi.fn(),
  signUpState: {
    status: null as string | null,
    emailAddress: null as string | null,
    unverifiedFields: [] as string[],
    missingFields: [] as string[],
    abandonAt: null as number | null,
    createdSessionId: null as string | null,
  },
}));

// AnimatePresence mode="wait" defers mounting the next child until the exit
// animation resolves, which never happens under jsdom. Render children
// directly so the flow can be driven synchronously.
vi.mock("motion/react", () => {
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
  useSignUp: () => ({
    isLoaded: true,
    setActive,
    signUp: {
      get status() {
        return signUpState.status;
      },
      get emailAddress() {
        return signUpState.emailAddress;
      },
      get unverifiedFields() {
        return signUpState.unverifiedFields;
      },
      get missingFields() {
        return signUpState.missingFields;
      },
      get abandonAt() {
        return signUpState.abandonAt;
      },
      get createdSessionId() {
        return signUpState.createdSessionId;
      },
      create: signUpCreate,
      update: signUpUpdate,
      prepareEmailAddressVerification,
      attemptEmailAddressVerification,
    },
  }),
  useSignIn: () => ({ isLoaded: true, setActive, signIn: { create: vi.fn() } }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/store/store", () => ({
  useStore: () => ({ showNotification }),
}));

vi.mock("@/lib/productAnalytics", () => ({
  useProductAnalytics: () => ({ capture: vi.fn() }),
}));

vi.mock("@/services/native/googleAuth", () => ({
  exchangeNativeGoogleTokenWithClerk: vi.fn(),
  nativeGoogleSignIn: vi.fn(),
}));

vi.mock("@/services/native/platform", () => ({
  isNativePlatform: () => false,
}));

function renderForm() {
  render(<ClerkSignUpForm onSwitchToSignIn={vi.fn()} redirectTo="/home" />);
}

async function fillSignUpForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /continue with email/i }),
  );
  await user.type(screen.getByLabelText(/first name/i), "Ada");
  await user.type(screen.getByLabelText(/last name/i), "Lovelace");
  await user.type(screen.getByLabelText(/^email$/i), "ada@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "correct-horse");
}

async function acceptTerms(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("checkbox", { name: /i agree to the/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  signUpState.status = null;
  signUpState.emailAddress = null;
  signUpState.unverifiedFields = [];
  signUpState.missingFields = [];
  signUpState.abandonAt = null;
  signUpState.createdSessionId = null;
});

describe("ClerkSignUpForm legal consent", () => {
  it("sends legalAccepted so the attempt is not left short a required field", async () => {
    const user = userEvent.setup();
    signUpCreate.mockResolvedValue({ status: "missing_requirements" });
    prepareEmailAddressVerification.mockResolvedValue({});

    renderForm();
    await fillSignUpForm(user);
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(signUpCreate).toHaveBeenCalledTimes(1));
    expect(signUpCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: "ada@example.com",
        legalAccepted: true,
      }),
    );
  });

  it("holds the submit until the terms are accepted", async () => {
    const user = userEvent.setup();

    renderForm();
    await fillSignUpForm(user);

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeDisabled();
  });

  it("does not blame the code when a correct one leaves another field missing", async () => {
    const user = userEvent.setup();
    signUpCreate.mockResolvedValue({ status: "missing_requirements" });
    prepareEmailAddressVerification.mockResolvedValue({});
    // Clerk accepted the code: a wrong one throws. The attempt is still short
    // of legal consent, which is what stranded the user on this screen.
    attemptEmailAddressVerification.mockResolvedValue({
      status: "missing_requirements",
      missingFields: ["legal_accepted"],
      unverifiedFields: [],
      update: signUpUpdate,
    });
    signUpUpdate.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_1",
      missingFields: [],
      unverifiedFields: [],
    });

    renderForm();
    await fillSignUpForm(user);
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByRole("heading", { name: /verify your email/i });
    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() =>
      expect(signUpUpdate).toHaveBeenCalledWith({ legalAccepted: true }),
    );
    expect(showNotification).not.toHaveBeenCalledWith(
      expect.stringMatching(/invalid verification code/i),
      "error",
    );
    await waitFor(() =>
      expect(setActive).toHaveBeenCalledWith({ session: "sess_1" }),
    );
  });

  it("keeps the digits when a pasted code brings whitespace with it", async () => {
    const user = userEvent.setup();
    signUpCreate.mockResolvedValue({ status: "missing_requirements" });
    prepareEmailAddressVerification.mockResolvedValue({});
    attemptEmailAddressVerification.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_2",
      missingFields: [],
      unverifiedFields: [],
    });

    renderForm();
    await fillSignUpForm(user);
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByRole("heading", { name: /verify your email/i });
    await user.type(screen.getByLabelText(/verification code/i), " 123 456 ");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() =>
      expect(attemptEmailAddressVerification).toHaveBeenCalledWith({
        code: "123456",
      }),
    );
  });

  it("carries on when the code already landed on an earlier submit", async () => {
    const user = userEvent.setup();
    signUpCreate.mockResolvedValue({ status: "missing_requirements" });
    prepareEmailAddressVerification.mockResolvedValue({});
    attemptEmailAddressVerification.mockRejectedValue({
      errors: [{ code: "verification_already_verified" }],
    });
    signUpState.status = "complete";

    renderForm();
    await fillSignUpForm(user);
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByRole("heading", { name: /verify your email/i });
    signUpState.createdSessionId = "sess_3";
    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() =>
      expect(setActive).toHaveBeenCalledWith({ session: "sess_3" }),
    );
  });

  it("names an expired code instead of calling it wrong", async () => {
    const user = userEvent.setup();
    signUpCreate.mockResolvedValue({ status: "missing_requirements" });
    prepareEmailAddressVerification.mockResolvedValue({});
    attemptEmailAddressVerification.mockRejectedValue({
      errors: [{ code: "verification_expired" }],
    });

    renderForm();
    await fillSignUpForm(user);
    await acceptTerms(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByRole("heading", { name: /verify your email/i });
    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.stringMatching(/expired/i),
        "error",
      ),
    );
  });
});

describe("ClerkSignUpForm pending verification", () => {
  it("reopens the verify screen for an attempt left unverified", async () => {
    signUpState.status = "missing_requirements";
    signUpState.emailAddress = "ada@example.com";
    signUpState.unverifiedFields = ["email_address"];

    renderForm();

    await screen.findByRole("heading", { name: /verify your email/i });
    expect(screen.getByText(/ada@example\.com/)).toBeInTheDocument();
  });

  it("leaves an abandoned attempt alone", async () => {
    signUpState.status = "missing_requirements";
    signUpState.emailAddress = "ada@example.com";
    signUpState.unverifiedFields = ["email_address"];
    signUpState.abandonAt = Date.now() - 1000;

    renderForm();

    expect(
      screen.queryByRole("heading", { name: /verify your email/i }),
    ).not.toBeInTheDocument();
  });

  it("asks for consent an older attempt never captured", async () => {
    const user = userEvent.setup();
    signUpState.status = "missing_requirements";
    signUpState.emailAddress = "ada@example.com";
    signUpState.unverifiedFields = ["email_address"];
    signUpState.missingFields = ["legal_accepted"];

    renderForm();

    await screen.findByRole("heading", { name: /verify your email/i });
    expect(
      screen.getByRole("button", { name: /verify email/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /i agree to the/i }));

    expect(
      screen.getByRole("button", { name: /verify email/i }),
    ).not.toBeDisabled();
    // The box stays put once ticked; removing it would move the layout under
    // the pointer and leave no record of what was agreed to.
    expect(
      screen.getByRole("checkbox", { name: /i agree to the/i }),
    ).toBeChecked();
  });

  it("offers a fresh code, because the old one expires", async () => {
    const user = userEvent.setup();
    signUpState.status = "missing_requirements";
    signUpState.emailAddress = "ada@example.com";
    signUpState.unverifiedFields = ["email_address"];
    prepareEmailAddressVerification.mockResolvedValue({});

    renderForm();

    await user.click(
      await screen.findByRole("button", { name: /resend code/i }),
    );

    await waitFor(() =>
      expect(prepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: "email_code",
      }),
    );
  });
});

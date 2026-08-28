import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SSOCallbackPage from "@/features/auth/pages/SsoCallbackPage";

const {
  handleRedirectCallback,
  signOut,
  navigate,
  setActive,
  signUpUpdate,
  clientState,
} = vi.hoisted(() => ({
  handleRedirectCallback: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
  setActive: vi.fn(),
  signUpUpdate: vi.fn(),
  clientState: {
    signUp: undefined as Record<string, unknown> | undefined,
  },
}));

vi.mock("@clerk/react", () => ({
  useClerk: () => ({
    client: clientState,
    handleRedirectCallback,
    setActive,
    signOut,
  }),
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
  useUser: () => ({ user: null, isLoaded: true }),
}));

vi.mock("@tanstack/react-router", () => ({
  Navigate: () => null,
  useNavigate: () => navigate,
  useSearch: () => ({ redirectTo: "/home", flow: "signin" }),
}));

vi.mock("@/config/runtime", () => ({ isClerkAuthMode: true }));

vi.mock("@/components/layout/PageBackground", () => ({ default: () => null }));
vi.mock("@/components/ui/LoadingSpinner", () => ({ default: () => null }));

describe("SSOCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    clientState.signUp = undefined;
    handleRedirectCallback.mockResolvedValue(undefined);
  });

  /**
   * Regression guard. This page routes the user itself in a second effect, so
   * Clerk must be told to stay put while the callback is processed.
   *
   * The fallback variants are NOT equivalent: they only apply when there is no
   * redirect_url in the path, and otherwise fall through to their "/" default,
   * dumping the user on the landing page mid-sign-in. The Core 3 codemod
   * rewrote afterSignInUrl/afterSignUpUrl (which were force redirects) into the
   * fallback variants, which broke Google sign-in.
   */
  it("pins Clerk to the current page with force redirects, not fallbacks", async () => {
    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(handleRedirectCallback).toHaveBeenCalledOnce();
    });

    const params = handleRedirectCallback.mock.calls[0]?.[0] ?? {};

    expect(params).toHaveProperty("signInForceRedirectUrl");
    expect(params).toHaveProperty("signUpForceRedirectUrl");
    expect(params.signInForceRedirectUrl).toBe(globalThis.location.href);
    expect(params.signUpForceRedirectUrl).toBe(globalThis.location.href);

    // Fallbacks would defeat the purpose by defaulting to "/".
    expect(params).not.toHaveProperty("signInFallbackRedirectUrl");
    expect(params).not.toHaveProperty("signUpFallbackRedirectUrl");
  });

  it("only processes the callback once", async () => {
    const { rerender } = render(<SSOCallbackPage />);
    rerender(<SSOCallbackPage />);

    await waitFor(() => {
      expect(handleRedirectCallback).toHaveBeenCalledOnce();
    });
  });

  /**
   * Legal consent is a required sign-up field and an OAuth redirect cannot
   * carry it, so Clerk hands the attempt back at missing_requirements: no
   * session, no error, and this page spun until the user gave up.
   */
  it("finishes a sign-up that came back short of legal consent", async () => {
    sessionStorage.setItem("macrotrackr.signup.legalAccepted", "true");
    clientState.signUp = {
      status: "missing_requirements",
      missingFields: ["legal_accepted"],
      verifications: { externalAccount: { status: "verified" } },
      update: signUpUpdate,
    };
    signUpUpdate.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_1",
      missingFields: [],
    });

    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(signUpUpdate).toHaveBeenCalledWith({ legalAccepted: true });
    });
    await waitFor(() => {
      expect(setActive).toHaveBeenCalledWith({ session: "sess_1" });
    });
  });

  it("says so rather than spinning when consent was never given", async () => {
    clientState.signUp = {
      status: "missing_requirements",
      missingFields: ["legal_accepted"],
      verifications: { externalAccount: { status: "verified" } },
      update: signUpUpdate,
    };

    render(<SSOCallbackPage />);

    expect(
      await screen.findByText(/accept the terms and privacy policy/i),
    ).toBeInTheDocument();
    expect(signUpUpdate).not.toHaveBeenCalled();
  });

  /**
   * The client hangs on to the last sign-up attempt, so an abandoned one from
   * earlier in the session is indistinguishable from the one this callback is
   * for. Completing it would activate a session the user never asked for.
   */
  it("leaves an attempt alone when it did not come from this callback", async () => {
    sessionStorage.setItem("macrotrackr.signup.legalAccepted", "true");
    clientState.signUp = {
      status: "missing_requirements",
      missingFields: ["legal_accepted"],
      verifications: { externalAccount: { status: null } },
      update: signUpUpdate,
    };

    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(handleRedirectCallback).toHaveBeenCalledOnce();
    });
    expect(signUpUpdate).not.toHaveBeenCalled();
    expect(setActive).not.toHaveBeenCalled();
  });

  it("keeps Clerk off its hosted continue page", async () => {
    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(handleRedirectCallback).toHaveBeenCalledOnce();
    });

    expect(handleRedirectCallback.mock.calls[0]?.[0].continueSignUpUrl).toBe(
      globalThis.location.href,
    );
  });
});

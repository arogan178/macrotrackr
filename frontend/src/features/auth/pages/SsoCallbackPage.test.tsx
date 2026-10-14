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
  clerkState,
  searchState,
} = vi.hoisted(() => ({
  handleRedirectCallback: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
  setActive: vi.fn(),
  signUpUpdate: vi.fn(),
  clientState: {
    signUp: undefined as Record<string, unknown> | undefined,
  },
  clerkState: { isLoaded: true },
  searchState: {} as Record<string, string>,
}));

vi.mock("@clerk/react", () => ({
  // Mirrors IsomorphicClerk: no client until clerk-js has loaded.
  useClerk: () => ({
    client: clerkState.isLoaded ? clientState : undefined,
    handleRedirectCallback,
    setActive,
    signOut,
  }),
  useAuth: () => ({ isLoaded: clerkState.isLoaded, isSignedIn: false }),
  useUser: () => ({ user: null, isLoaded: true }),
}));

vi.mock("@tanstack/react-router", () => ({
  Navigate: () => null,
  useNavigate: () => navigate,
  useSearch: () => ({ redirectTo: "/home", flow: "signin", ...searchState }),
}));

vi.mock("@/config/runtime", () => ({ isClerkAuthMode: true }));

vi.mock("@/components/layout/PageBackground", () => ({ default: () => null }));
vi.mock("@/components/ui/LoadingSpinner", () => ({ default: () => null }));

describe("SSOCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    clientState.signUp = undefined;
    clerkState.isLoaded = true;
    for (const key of Object.keys(searchState)) delete searchState[key];
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

  /**
   * After the Google redirect the page mounts before clerk-js has loaded. Run
   * then, the repair saw no client and the sign-up stayed short of consent.
   */
  it("waits for Clerk to load before finishing the sign-up", async () => {
    sessionStorage.setItem("macrotrackr.signup.legalAccepted", "true");
    clerkState.isLoaded = false;
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

    const { rerender } = render(<SSOCallbackPage />);
    expect(handleRedirectCallback).not.toHaveBeenCalled();

    clerkState.isLoaded = true;
    rerender(<SSOCallbackPage />);

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

  /**
   * Clerk signals a failed callback by navigating to its sign-in or sign-up
   * URL, not by rejecting. Left at the defaults, that dropped the user on the
   * hosted Account Portal with no explanation.
   */
  it("brings a failed callback back to this page", async () => {
    render(<SSOCallbackPage />);

    await waitFor(() => {
      expect(handleRedirectCallback).toHaveBeenCalledOnce();
    });

    const params = handleRedirectCallback.mock.calls[0]?.[0] ?? {};
    const failedUrl = new URL(globalThis.location.href);
    failedUrl.searchParams.set("failed", "1");

    expect(params.signInUrl).toBe(failedUrl.href);
    expect(params.signUpUrl).toBe(failedUrl.href);
  });

  it("explains the provider error once Clerk sends the user back", async () => {
    searchState.failed = "1";
    searchState.flow = "signup";
    clientState.signUp = {
      status: "missing_requirements",
      verifications: {
        externalAccount: {
          status: "failed",
          error: { code: "external_account_exists", message: "Unable to link" },
        },
      },
    };

    render(<SSOCallbackPage />);

    expect(
      await screen.findByText(/couldn't finish signing you up with that provider/i),
    ).toBeInTheDocument();
  });

  it("shows why the callback failed when nobody is signed in", async () => {
    handleRedirectCallback.mockRejectedValue(new Error("Provider refused"));

    render(<SSOCallbackPage />);

    expect(
      await screen.findByRole("heading", { name: "Sign-in Failed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Provider refused")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});

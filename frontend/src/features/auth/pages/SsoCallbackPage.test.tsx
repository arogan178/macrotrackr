import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SSOCallbackPage from "@/features/auth/pages/SsoCallbackPage";

const { handleRedirectCallback, signOut, navigate } = vi.hoisted(() => ({
  handleRedirectCallback: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useClerk: () => ({ handleRedirectCallback, signOut }),
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
});

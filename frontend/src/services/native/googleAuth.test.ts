import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/core";

import { signInWithNativeGoogle } from "./googleAuth";

const plugin = vi.hoisted(() => ({
  initialize: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
}));
const exchangeGoogleIdToken = vi.hoisted(() => vi.fn());

vi.mock("@codetrix-studio/capacitor-google-auth", () => ({ GoogleAuth: plugin }));
vi.mock("@/api/auth", () => ({ authApi: { exchangeGoogleIdToken } }));
vi.mock("./platform", () => ({ isNativePlatform: () => true }));

const setActive = vi.fn();
const signIn = { create: vi.fn() };
const run = () => signInWithNativeGoogle({ signIn, setActive });

beforeEach(() => {
  vi.clearAllMocks();
  plugin.signOut.mockResolvedValue(undefined);
  plugin.signIn.mockResolvedValue({ authentication: { idToken: "google-id-token" } });
});

describe("signInWithNativeGoogle", () => {
  it("signs in with the ticket the backend issues", async () => {
    exchangeGoogleIdToken.mockResolvedValue({ ticket: "ticket_1" });
    signIn.create.mockResolvedValue({ status: "complete", createdSessionId: "sess_1" });

    expect(await run()).toBe("signed_in");
    expect(signIn.create).toHaveBeenCalledWith({ strategy: "ticket", ticket: "ticket_1" });
    expect(setActive).toHaveBeenCalledWith({ session: "sess_1" });
  });

  it("forgets the last account so the picker always shows", async () => {
    exchangeGoogleIdToken.mockResolvedValue({ ticket: null });
    await run();
    expect(plugin.signOut.mock.invocationCallOrder[0]).toBeLessThan(
      plugin.signIn.mock.invocationCallOrder[0]!,
    );
  });

  it("stops when the picker is cancelled", async () => {
    plugin.signIn.mockRejectedValue(new Error("12501: The user canceled the sign-in flow."));

    expect(await run()).toBe("cancelled");
    expect(exchangeGoogleIdToken).not.toHaveBeenCalled();
  });

  it.each([
    ["the picker fails", () => plugin.signIn.mockRejectedValue(new Error("Something went wrong"))],
    ["no account has this Google login", () => exchangeGoogleIdToken.mockResolvedValue({ ticket: null })],
    [
      "the backend has native sign-in switched off",
      () => exchangeGoogleIdToken.mockRejectedValue(new ApiError("Not found", 404, "NOT_FOUND")),
    ],
    [
      "the account needs a second factor",
      () => {
        exchangeGoogleIdToken.mockResolvedValue({ ticket: "ticket_1" });
        signIn.create.mockResolvedValue({ status: "needs_second_factor", createdSessionId: null });
      },
    ],
  ])("falls back to the web flow when %s", async (_label, arrange) => {
    arrange();
    expect(await run()).toBe("use_web");
    expect(setActive).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the token is refused",
      () => exchangeGoogleIdToken.mockRejectedValue(new ApiError("Unverified", 401, "AUTHENTICATION_ERROR")),
    ],
    [
      "Clerk refuses the ticket",
      () => {
        exchangeGoogleIdToken.mockResolvedValue({ ticket: "ticket_1" });
        signIn.create.mockRejectedValue(new Error("ticket expired"));
      },
    ],
  ])("fails when %s", async (_label, arrange) => {
    arrange();
    expect(await run()).toBe("failed");
    expect(setActive).not.toHaveBeenCalled();
  });
});

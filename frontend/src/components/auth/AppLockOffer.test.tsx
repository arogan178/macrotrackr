import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppLockOffer } from "./AppLockOffer";

const { biometrics, showNotification } = vi.hoisted(() => ({
  biometrics: {
    checkBiometricAvailability: vi.fn(),
    isAppLockEnabled: vi.fn(),
    wasAppLockOffered: vi.fn(),
    markAppLockOffered: vi.fn(),
    setAppLockEnabled: vi.fn(),
    verifyBiometricIdentity: vi.fn(),
  },
  showNotification: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));
vi.mock("@/services/biometrics", () => biometrics);
vi.mock("@/store/store", () => ({ useStore: () => ({ showNotification }) }));

describe("AppLockOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!document.querySelector("#modal-root")) {
      const modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.append(modalRoot);
    }
    biometrics.checkBiometricAvailability.mockResolvedValue({
      isAvailable: true,
      biometryType: "Fingerprint",
    });
    biometrics.isAppLockEnabled.mockResolvedValue(false);
    biometrics.wasAppLockOffered.mockResolvedValue(false);
  });

  it("offers biometric sign-in once, then remembers it asked", async () => {
    render(<AppLockOffer />);

    expect(
      await screen.findByText("Sign in with fingerprint?"),
    ).toBeInTheDocument();
    expect(biometrics.markAppLockOffered).toHaveBeenCalled();
  });

  it("turns it on only after a passed biometric check", async () => {
    biometrics.verifyBiometricIdentity.mockResolvedValue(true);
    render(<AppLockOffer />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Turn on" }),
    );

    await waitFor(() =>
      expect(biometrics.setAppLockEnabled).toHaveBeenCalledWith(true),
    );
  });

  it("leaves it off when the check is cancelled", async () => {
    biometrics.verifyBiometricIdentity.mockResolvedValue(false);
    render(<AppLockOffer />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Turn on" }),
    );

    await waitFor(() =>
      expect(biometrics.verifyBiometricIdentity).toHaveBeenCalled(),
    );
    expect(biometrics.setAppLockEnabled).not.toHaveBeenCalled();
  });

  it.each([
    ["already offered", { wasOffered: true, isEnabled: false }],
    ["already on", { wasOffered: false, isEnabled: true }],
  ])("stays hidden when %s", async (_case, { wasOffered, isEnabled }) => {
    biometrics.wasAppLockOffered.mockResolvedValue(wasOffered);
    biometrics.isAppLockEnabled.mockResolvedValue(isEnabled);
    render(<AppLockOffer />);

    await waitFor(() =>
      expect(biometrics.wasAppLockOffered).toHaveBeenCalled(),
    );
    expect(
      screen.queryByText("Sign in with fingerprint?"),
    ).not.toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppLockForm from "./AppLockForm";

const { native, biometrics, showNotification } = vi.hoisted(() => ({
  native: { value: true },
  biometrics: {
    checkBiometricAvailability: vi.fn(),
    isAppLockEnabled: vi.fn(),
    setAppLockEnabled: vi.fn(),
    verifyBiometricIdentity: vi.fn(),
  },
  showNotification: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => native.value },
}));
vi.mock("@/services/biometrics", () => biometrics);
vi.mock("@/store/store", () => ({ useStore: () => ({ showNotification }) }));

describe("AppLockForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    native.value = true;
    biometrics.checkBiometricAvailability.mockResolvedValue({
      isAvailable: true,
      biometryType: "Fingerprint",
    });
    biometrics.isAppLockEnabled.mockResolvedValue(false);
  });

  it("turns the lock on only after a biometric check passes", async () => {
    biometrics.verifyBiometricIdentity.mockResolvedValue(true);
    render(<AppLockForm />);

    await userEvent.click(
      await screen.findByLabelText("Require unlock to open the app"),
    );

    await waitFor(() =>
      expect(biometrics.setAppLockEnabled).toHaveBeenCalledWith(true),
    );
    expect(biometrics.verifyBiometricIdentity).toHaveBeenCalledTimes(1);
    expect(
      screen.getByLabelText("Require unlock to open the app"),
    ).toBeChecked();
  });

  it("leaves the lock off when the check is cancelled", async () => {
    biometrics.verifyBiometricIdentity.mockResolvedValue(false);
    render(<AppLockForm />);

    const toggle = await screen.findByLabelText(
      "Require unlock to open the app",
    );
    await userEvent.click(toggle);

    await waitFor(() => expect(toggle).toBeEnabled());
    expect(biometrics.setAppLockEnabled).not.toHaveBeenCalled();
    expect(toggle).not.toBeChecked();
  });

  it("is hidden on a device with no biometric enrolled", async () => {
    biometrics.checkBiometricAvailability.mockResolvedValue({
      isAvailable: false,
      biometryType: "None",
    });
    render(<AppLockForm />);

    await waitFor(() =>
      expect(biometrics.checkBiometricAvailability).toHaveBeenCalled(),
    );
    expect(
      screen.queryByLabelText("Require unlock to open the app"),
    ).not.toBeInTheDocument();
  });
});

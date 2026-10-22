import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCK_AFTER_BACKGROUND_MS, useAppLock } from "./useAppLock";

const { native, biometrics, appState } = vi.hoisted(() => ({
  native: { value: true },
  biometrics: {
    isAppLockEnabled: vi.fn(),
    verifyBiometricIdentity: vi.fn(),
    removeLegacyBiometricCredentials: vi.fn(),
  },
  appState: {
    listener: undefined as ((s: { isActive: boolean }) => void) | undefined,
  },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => native.value },
}));
vi.mock("@/services/biometrics", () => biometrics);
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn(async (_event, listener) => {
      appState.listener = listener;

      return { remove: vi.fn() };
    }),
  },
}));

async function goToBackgroundFor(ms: number) {
  await waitFor(() => expect(appState.listener).toBeDefined());
  act(() => appState.listener!({ isActive: false }));
  vi.setSystemTime(Date.now() + ms);
  act(() => appState.listener!({ isActive: true }));
}

describe("useAppLock", () => {
  beforeEach(() => {
    native.value = true;
    appState.listener = undefined;
    biometrics.isAppLockEnabled.mockResolvedValue(true);
    biometrics.verifyBiometricIdentity.mockResolvedValue(false);
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("starts locked and asks for a biometric straight away", async () => {
    const { result } = renderHook(() => useAppLock(true));

    expect(result.current.isLocked).toBe(true);
    await waitFor(() =>
      expect(biometrics.verifyBiometricIdentity).toHaveBeenCalledTimes(1),
    );
    expect(result.current.isLocked).toBe(true);
  });

  it("unlocks once the biometric check passes", async () => {
    biometrics.verifyBiometricIdentity.mockResolvedValue(true);
    const { result } = renderHook(() => useAppLock(true));

    await waitFor(() => expect(result.current.isLocked).toBe(false));
  });

  it("stays unlocked when the lock is off", async () => {
    biometrics.isAppLockEnabled.mockResolvedValue(false);
    const { result } = renderHook(() => useAppLock(true));

    await waitFor(() => expect(result.current.isLocked).toBe(false));
    expect(biometrics.verifyBiometricIdentity).not.toHaveBeenCalled();
  });

  it("never locks on the web", () => {
    native.value = false;
    const { result } = renderHook(() => useAppLock(true));

    expect(result.current.isLocked).toBe(false);
  });

  it("locks again only after five minutes in the background", async () => {
    biometrics.verifyBiometricIdentity.mockResolvedValue(true);
    const { result } = renderHook(() => useAppLock(true));
    await waitFor(() => expect(result.current.isLocked).toBe(false));

    biometrics.verifyBiometricIdentity.mockResolvedValue(false);
    await goToBackgroundFor(LOCK_AFTER_BACKGROUND_MS - 1000);
    await act(async () => {});
    expect(result.current.isLocked).toBe(false);

    await goToBackgroundFor(LOCK_AFTER_BACKGROUND_MS);
    await waitFor(() => expect(result.current.isLocked).toBe(true));
  });

  it("reads the setting afresh after signing out and back in", async () => {
    const { result, rerender } = renderHook(
      ({ signedIn }) => useAppLock(signedIn),
      { initialProps: { signedIn: true } },
    );
    await waitFor(() =>
      expect(biometrics.verifyBiometricIdentity).toHaveBeenCalled(),
    );

    // Sign-out turns the lock off.
    biometrics.isAppLockEnabled.mockResolvedValue(false);
    rerender({ signedIn: false });
    expect(result.current.isLocked).toBe(false);

    rerender({ signedIn: true });
    await waitFor(() => expect(result.current.isLocked).toBe(false));
  });

  it("deletes a password saved by an earlier build", async () => {
    renderHook(() => useAppLock(false));

    await waitFor(() =>
      expect(biometrics.removeLegacyBiometricCredentials).toHaveBeenCalled(),
    );
  });
});

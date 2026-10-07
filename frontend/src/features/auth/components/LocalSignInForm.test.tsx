import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/api/auth";
import { saveBiometricCredentials } from "@/services/biometrics";

import { LocalSignInForm } from "./LocalSignInForm";

const { navigate, showNotification } = vi.hoisted(() => ({
  navigate: vi.fn(),
  showNotification: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/store/store", () => ({ useStore: () => ({ showNotification }) }));
vi.mock("@/api/auth", () => ({
  authApi: { login: vi.fn() },
}));
// Native so the biometric opt-in renders; no stored credentials, so the
// biometric sign-in button stays hidden.
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));
vi.mock("@/services/biometrics", () => ({
  saveBiometricCredentials: vi.fn(),
  checkBiometricAvailability: async () => ({ isAvailable: false }),
  authenticateWithBiometrics: vi.fn(),
}));

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LocalSignInForm onSwitchToSignUp={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("LocalSignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs in with the lowercased email and saves biometrics when opted in", async () => {
    const user = userEvent.setup();
    let finishLogin = () => {};
    vi.mocked(authApi.login).mockReturnValue(
      new Promise((resolve) => {
        finishLogin = () => resolve({} as never);
      }),
    );
    renderForm();

    await user.type(screen.getByLabelText("Email"), "Sam@Example.COM");
    await user.type(screen.getByLabelText("Password"), "hunter22");
    await user.click(screen.getByLabelText("Enable biometric sign-in"));
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    finishLogin();

    expect(
      await screen.findByRole("button", { name: "Sign In" }),
    ).toBeEnabled();
    expect(authApi.login).toHaveBeenCalledWith({
      email: "sam@example.com",
      password: "hunter22",
    });
    expect(saveBiometricCredentials).toHaveBeenCalledWith(
      "sam@example.com",
      "hunter22",
    );
    expect(showNotification).toHaveBeenCalledWith(
      "Signed in successfully!",
      "success",
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/home",
      search: { limit: 20, offset: 0 },
      replace: true,
    });
  });

  it("does not save the password without the opt-in", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({} as never);
    renderForm();

    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(authApi.login).toHaveBeenCalledWith({
      email: "sam@example.com",
      password: "hunter22",
    });
    expect(saveBiometricCredentials).not.toHaveBeenCalled();
  });

  it("shows the server's message and stays on the form when sign in fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(
      new Error("Invalid email or password."),
    );
    renderForm();

    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(showNotification).toHaveBeenCalledWith(
      "Invalid email or password.",
      "error",
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  it("sends Forgot password to the reset help page without calling the API", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Forgot password?" }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/reset-password",
      search: { returnTo: undefined },
    });
    expect(authApi.login).not.toHaveBeenCalled();
  });
});

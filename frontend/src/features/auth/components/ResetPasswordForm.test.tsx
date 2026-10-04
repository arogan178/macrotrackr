import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResetPasswordForm from "./ResetPasswordForm";

const { search, mutateAsync, showNotification } = vi.hoisted(() => ({
  search: { token: "reset-token" as string | undefined },
  mutateAsync: vi.fn(),
  showNotification: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useSearch: () => search }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useResetPassword: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@/store/store", () => ({ useStore: () => ({ showNotification }) }));

const resetButton = () =>
  screen.getByRole("button", { name: "Reset Password" });

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.token = "reset-token";
  });

  it("keeps reset disabled until both passwords match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    expect(resetButton()).toBeDisabled();
    await user.type(screen.getByLabelText("New Password"), "secret12");
    expect(resetButton()).toBeDisabled();
    expect(screen.queryByText("Passwords do not match")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Confirm New Password"), "secret1");
    expect(
      screen.getByLabelText("Confirm New Password"),
    ).toHaveAccessibleDescription("Passwords do not match");
    expect(resetButton()).toBeDisabled();

    await user.type(screen.getByLabelText("Confirm New Password"), "2");
    expect(screen.queryByText("Passwords do not match")).not.toBeInTheDocument();
    expect(resetButton()).toBeEnabled();
  });

  it("resets the password with the link's token", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(undefined);
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New Password"), "secret12");
    await user.type(screen.getByLabelText("Confirm New Password"), "secret12");
    await user.click(resetButton());

    expect(mutateAsync).toHaveBeenCalledWith({
      token: "reset-token",
      newPassword: "secret12",
    });
    expect(showNotification).toHaveBeenCalledWith(
      "Password has been reset successfully.",
      "success",
    );
  });

  it("shows the server's message when the reset fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(new Error("Reset link has expired"));
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New Password"), "secret12");
    await user.type(screen.getByLabelText("Confirm New Password"), "secret12");
    await user.click(resetButton());

    expect(showNotification).toHaveBeenCalledWith(
      "Reset link has expired",
      "error",
    );
  });

  it("cannot reset without a token in the link", async () => {
    const user = userEvent.setup();
    search.token = undefined;
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New Password"), "secret12");
    await user.type(screen.getByLabelText("Confirm New Password"), "secret12");

    expect(resetButton()).toBeDisabled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStore } from "@/store/store";

import ChangePasswordForm from "./ChangePasswordForm";

const mutateAsync = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useChangePassword: () => ({ mutateAsync, isPending: false }),
}));

const showNotification = vi.fn();
const notifications = () =>
  showNotification.mock.calls.map(([message, type]) => ({ message, type }));

async function fillForm(current: string, next: string, confirm: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Current password"), current);
  await user.type(screen.getByLabelText("New password"), next);
  await user.type(screen.getByLabelText("Confirm new password"), confirm);

  return user;
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    showNotification.mockReset();
    useStore.setState({ showNotification });
  });

  it("keeps the button disabled until the new password is strong enough", async () => {
    render(<ChangePasswordForm />);
    const button = screen.getByRole("button", { name: "Change password" });

    await fillForm("old-pass", "weak", "weak");
    expect(screen.getByText("Weak")).toBeInTheDocument();
    expect(button).toBeDisabled();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("New password"), "Pass1");
    await user.type(screen.getByLabelText("Confirm new password"), "Pass1");
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("changes the password, confirms it and clears the fields", async () => {
    mutateAsync.mockResolvedValue(undefined);
    render(<ChangePasswordForm />);

    const user = await fillForm("old-pass", "NewPass1", "NewPass1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      currentPassword: "old-pass",
      newPassword: "NewPass1",
    });
    expect(notifications()).toEqual([
      { message: "Password changed successfully.", type: "success" },
    ]);
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });

  it("flags mismatched passwords on the confirm field without submitting", async () => {
    render(<ChangePasswordForm />);

    const user = await fillForm("old-pass", "NewPass1", "NewPass2");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByLabelText("Confirm new password"),
    ).toHaveAccessibleDescription("New passwords do not match.");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits once a mismatch is fixed from the new password field", async () => {
    mutateAsync.mockResolvedValue(undefined);
    render(<ChangePasswordForm />);

    const user = await fillForm("old-pass", "NewPass1", "NewPass2");
    const button = screen.getByRole("button", { name: "Change password" });
    await user.click(button);
    expect(
      await screen.findByText("New passwords do not match."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("New password"));
    await user.type(screen.getByLabelText("New password"), "NewPass2");
    await user.click(button);

    expect(mutateAsync).toHaveBeenCalledWith({
      currentPassword: "old-pass",
      newPassword: "NewPass2",
    });
    expect(screen.queryByText("New passwords do not match.")).toBeNull();
  });

  it("shows the server's error and keeps what was typed", async () => {
    mutateAsync.mockRejectedValue(new Error("Current password is incorrect"));
    render(<ChangePasswordForm />);

    const user = await fillForm("wrong-pass", "NewPass1", "NewPass1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText("Current password is incorrect"),
    ).toBeInTheDocument();
    expect(notifications()).toEqual([
      { message: "Current password is incorrect", type: "error" },
    ]);
    expect(screen.getByLabelText("Current password")).toHaveValue(
      "wrong-pass",
    );
  });
});

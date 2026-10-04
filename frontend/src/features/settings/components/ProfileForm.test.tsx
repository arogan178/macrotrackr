import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDetailsResponse } from "@/api/user";
import { useStore } from "@/store/store";

import ProfileForm from "./ProfileForm";

const mutateAsync = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/queries/useSettings", () => ({
  useSaveSettings: () => ({ mutateAsync, isPending: false }),
}));

const baseSettings: UserDetailsResponse = {
  id: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  dateOfBirth: "1990-01-01",
  height: 175,
  weight: 70,
  activityLevel: 3,
  gender: "male",
  unitSystem: "metric",
  analyticsTrafficType: "external",
  isProfileComplete: true,
  subscription: { status: "free" },
};

const savedPayload = {
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  dateOfBirth: "1990-01-01",
  gender: "male",
  unitSystem: "metric",
  height: 175,
  weight: 70,
  activityLevel: 3,
};

const showNotification = vi.fn();
const notifications = () =>
  showNotification.mock.calls.map(([message, type]) => ({ message, type }));

function renderForm(settings: UserDetailsResponse = baseSettings) {
  const onHasChangesChange = vi.fn();
  render(
    <ProfileForm settings={settings} onHasChangesChange={onHasChangesChange} />,
  );

  return { user: userEvent.setup(), onHasChangesChange };
}

const saveButton = () => screen.getByRole("button", { name: "Save changes" });

describe("ProfileForm", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    showNotification.mockReset();
    useStore.setState({ showNotification });
  });

  it("switches the unit preference", async () => {
    const { user } = renderForm();

    await user.selectOptions(screen.getByLabelText("Units"), "imperial");

    expect(screen.getByLabelText("Weight")).toHaveValue(154.3);
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("shows metric values in lb and ft/in and saves edits as metric", async () => {
    mutateAsync.mockResolvedValue({ success: true, message: "" });
    const { user } = renderForm({
      ...baseSettings,
      height: 180,
      weight: 80,
      unitSystem: "imperial",
    });

    expect(screen.getByLabelText("Height")).toHaveValue(5);
    expect(screen.getByLabelText("Inches")).toHaveValue(11);
    expect(screen.getByLabelText("Weight")).toHaveValue(176.4);

    await user.clear(screen.getByLabelText("Weight"));
    await user.type(screen.getByLabelText("Weight"), "165.5");
    await user.clear(screen.getByLabelText("Inches"));
    await user.type(screen.getByLabelText("Inches"), "10");
    await user.click(saveButton());

    expect(mutateAsync).toHaveBeenCalledWith({
      ...savedPayload,
      unitSystem: "imperial",
      height: 178,
      weight: 75.07,
    });
  });

  it("shows a weight saved in lb on the kg input's 0.1 step", () => {
    renderForm({ ...baseSettings, weight: 75.07, unitSystem: "metric" });

    expect(screen.getByLabelText("Weight")).toHaveValue(75.1);
  });

  it("validates the name as it is typed and blocks saving", async () => {
    const { user } = renderForm();
    const firstName = screen.getByLabelText("First Name");

    await user.clear(firstName);
    expect(firstName).toHaveAccessibleDescription("First name required");
    expect(saveButton()).toBeDisabled();

    await user.type(firstName, "A");
    expect(firstName).toHaveAccessibleDescription(
      "First name must be at least 2 characters",
    );
    expect(saveButton()).toBeDisabled();

    await user.type(firstName, "l");
    expect(firstName).not.toHaveAccessibleDescription();
    expect(saveButton()).toBeEnabled();
  });

  it("words a weight range error in the unit currently picked", async () => {
    const { user } = renderForm();
    const weight = screen.getByLabelText("Weight");

    await user.clear(weight);
    await user.type(weight, "400");
    expect(
      screen.getByText("Please enter a valid weight (50-300 kg)"),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Units"), "imperial");
    expect(
      screen.getByText("Please enter a valid weight (111-661 lb)"),
    ).toBeInTheDocument();
  });

  it("saves once an error is fixed after another field was edited", async () => {
    mutateAsync.mockResolvedValue({ success: true, message: "" });
    const { user } = renderForm();
    const firstName = screen.getByLabelText("First Name");
    const weight = screen.getByLabelText("Weight");

    await user.clear(firstName);
    await user.clear(weight);
    await user.type(weight, "400");
    expect(firstName).toHaveAccessibleDescription("First name required");

    await user.selectOptions(screen.getByLabelText("Units"), "imperial");
    await user.type(firstName, "Al");
    await user.clear(weight);
    await user.type(weight, "165.5");
    expect(firstName).not.toHaveAccessibleDescription();
    expect(screen.queryByText(/Please enter a valid weight/)).toBeNull();

    await user.click(saveButton());

    expect(mutateAsync).toHaveBeenCalledWith({
      ...savedPayload,
      firstName: "Al",
      unitSystem: "imperial",
      weight: 75.07,
    });
  });

  it("saves the profile and marks it saved", async () => {
    mutateAsync.mockResolvedValue({ success: true, message: "" });
    const { user, onHasChangesChange } = renderForm();

    await user.type(screen.getByLabelText("Last Name"), "s");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(onHasChangesChange).toHaveBeenLastCalledWith(true);

    await user.click(saveButton());

    expect(mutateAsync).toHaveBeenCalledWith({
      ...savedPayload,
      lastName: "Users",
    });
    expect(notifications()).toEqual([
      { message: "Settings saved", type: "success" },
    ]);
    expect(screen.getByText("All changes saved")).toBeInTheDocument();
    expect(onHasChangesChange).toHaveBeenLastCalledWith(false);
    expect(saveButton()).toBeDisabled();
  });

  it("keeps the edits when the save fails", async () => {
    mutateAsync.mockRejectedValue(new Error("Network down"));
    const { user } = renderForm();

    await user.type(screen.getByLabelText("Last Name"), "s");
    await user.click(saveButton());

    expect(notifications()).toEqual([
      { message: "Failed to save settings: Network down", type: "error" },
    ]);
    expect(screen.getByLabelText("Last Name")).toHaveValue("Users");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("reads as saved again when an edit is undone", async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText("Last Name"), "s");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Last Name"), "{Backspace}");
    expect(screen.getByText("All changes saved")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });
});

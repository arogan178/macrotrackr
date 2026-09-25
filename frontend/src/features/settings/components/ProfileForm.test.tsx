import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { UserSettings } from "@/types/user";

import ProfileForm from "./ProfileForm";

const baseSettings: UserSettings = {
  id: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  dateOfBirth: "1990-01-01",
  height: 175,
  weight: 70,
  activityLevel: 3,
  gender: "male",
  subscription: { status: "free" },
};

function renderForm(settings: UserSettings, updateSetting = vi.fn()) {
  return render(
    <ProfileForm
      settings={settings}
      updateSetting={updateSetting}
      formErrors={{}}
      onSubmit={async () => {}}
      isSaving={false}
      hasChanges={false}
    />,
  );
}

describe("ProfileForm", () => {
  it("renders without crashing", () => {
    const { container } = renderForm(baseSettings);
    expect(container).toBeDefined();
  });

  it("switches the unit preference", async () => {
    const updateSetting = vi.fn();
    renderForm(baseSettings, updateSetting);

    await userEvent.selectOptions(screen.getByLabelText("Units"), "imperial");

    expect(updateSetting).toHaveBeenCalledWith("unitSystem", "imperial");
  });

  it("shows metric values in lb and ft/in and saves edits as metric", () => {
    const updateSetting = vi.fn();
    renderForm(
      { ...baseSettings, height: 180, weight: 80, unitSystem: "imperial" },
      updateSetting,
    );

    expect(screen.getByLabelText("Height")).toHaveValue(5);
    expect(screen.getByLabelText("Inches")).toHaveValue(11);
    expect(screen.getByLabelText("Weight")).toHaveValue(176.4);

    fireEvent.change(screen.getByLabelText("Weight"), {
      target: { value: "165.5" },
    });
    expect(updateSetting).toHaveBeenLastCalledWith("weight", 75.07);

    fireEvent.change(screen.getByLabelText("Inches"), {
      target: { value: "10" },
    });
    expect(updateSetting).toHaveBeenLastCalledWith("height", 178);
  });

  it("shows a weight saved in lb on the kg input's 0.1 step", () => {
    renderForm({ ...baseSettings, weight: 75.07, unitSystem: "metric" });

    expect(screen.getByLabelText("Weight")).toHaveValue(75.1);
  });
});

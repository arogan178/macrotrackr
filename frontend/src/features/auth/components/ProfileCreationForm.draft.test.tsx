import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { userApi } from "@/api/user";
import { ProfileCreationForm } from "@/features/auth/components/ProfileCreationForm";

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  useUser: () => ({ user: { firstName: "Sam" }, isLoaded: true }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/store/store", () => ({
  useStore: () => ({ showNotification: vi.fn() }),
}));

vi.mock("@/api/auth", () => ({ authApi: { syncUser: vi.fn() } }));
vi.mock("@/api/goals", () => ({ goalsApi: { createWeightGoal: vi.fn() } }));
vi.mock("@/api/user", () => ({
  userApi: { completeProfile: vi.fn(), getUserDetails: vi.fn() },
}));

async function fillStepOne(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
  await user.selectOptions(screen.getByLabelText(/^gender$/i), "male");
  await user.type(screen.getByLabelText(/height/i), "180");
  await user.type(screen.getByLabelText(/^weight/i), "90");
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

describe("ProfileCreationForm draft", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("restores the answers and the current step after a remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ProfileCreationForm />);
    await fillStepOne(user);
    await user.selectOptions(screen.getByLabelText(/how active are you/i), "3");
    unmount();

    render(<ProfileCreationForm />);

    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/how active are you/i)).toHaveValue("3");

    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1990-01-01");
    expect(screen.getByLabelText(/^gender$/i)).toHaveValue("male");
    expect(screen.getByLabelText(/height/i)).toHaveValue(180);
    expect(screen.getByLabelText(/^weight/i)).toHaveValue(90);
  });

  it("keeps a restored date of birth over the social pre-fill", async () => {
    const user = userEvent.setup();
    const socialProfileData = JSON.stringify({
      firstName: "Sam",
      lastName: "",
      dateOfBirth: "1985-05-05",
    });
    sessionStorage.setItem("socialProfileData", socialProfileData);
    const { unmount } = render(<ProfileCreationForm />);
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1985-05-05");
    await user.clear(screen.getByLabelText(/date of birth/i));
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
    unmount();

    // A real refresh never runs the unmount cleanup that drops the pre-fill.
    sessionStorage.setItem("socialProfileData", socialProfileData);
    render(<ProfileCreationForm />);

    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1990-01-01");
  });

  it("starts on step 1 when there is no draft", () => {
    render(<ProfileCreationForm />);

    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it("clears the draft once setup completes", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ProfileCreationForm />);
    await fillStepOne(user);
    await user.selectOptions(screen.getByLabelText(/how active are you/i), "3");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.selectOptions(
      screen.getByLabelText(/what are you switching from/i),
      "myfitnesspal",
    );
    await user.click(screen.getByRole("radio", { name: /maintain/i }));

    await user.click(screen.getByRole("button", { name: /finish setup/i }));

    expect(userApi.completeProfile).toHaveBeenCalled();
    expect(sessionStorage.getItem("onboardingDraft")).toBeNull();

    unmount();
    render(<ProfileCreationForm />);
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });
});

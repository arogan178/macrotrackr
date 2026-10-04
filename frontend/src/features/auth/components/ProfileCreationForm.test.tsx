import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { goalsApi } from "@/api/goals";
import { userApi } from "@/api/user";
import { ProfileCreationForm } from "@/features/auth/components/ProfileCreationForm";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  useUser: () => ({ user: { firstName: "Sam" }, isLoaded: true }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/store/store", () => ({
  useStore: () => ({ showNotification: vi.fn() }),
}));
vi.mock("@/api/auth", () => ({ authApi: { syncUser: vi.fn() } }));
vi.mock("@/api/goals", () => ({ goalsApi: { createWeightGoal: vi.fn() } }));
vi.mock("@/api/user", () => ({
  userApi: { completeProfile: vi.fn(), getUserDetails: vi.fn() },
}));
vi.mock("@/utils/dateUtilities", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  todayISO: () => "2026-10-04",
}));

const alerts = () =>
  screen.queryAllByRole("alert").map((alert) => alert.textContent);

async function fillAboutYou(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
  await user.selectOptions(screen.getByLabelText(/^gender$/i), "male");
  await user.type(screen.getByLabelText(/height/i), "180");
  await user.type(screen.getByLabelText(/^weight/i), "90");
}

describe("ProfileCreationForm steps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("holds step 1 until every detail is valid, clearing each error as it is fixed", async () => {
    const user = userEvent.setup();
    render(<ProfileCreationForm />);
    const next = screen.getByRole("button", { name: "Continue" });

    await user.click(next);
    expect(alerts()).toEqual([
      "Date of birth is required",
      "Gender is required",
      "Height is required",
      "Weight is required",
    ]);

    await user.selectOptions(screen.getByLabelText(/^gender$/i), "male");
    expect(alerts()).toEqual([
      "Date of birth is required",
      "Height is required",
      "Weight is required",
    ]);

    await user.type(screen.getByLabelText(/date of birth/i), "2020-01-01");
    await user.type(screen.getByLabelText(/height/i), "100");
    await user.type(screen.getByLabelText(/^weight/i), "90");
    await user.click(next);
    expect(alerts()).toEqual([
      "You must be at least 18 years old",
      "Please enter a valid height (120-250 cm)",
    ]);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("pre-fills the date of birth from a social sign-up", async () => {
    sessionStorage.setItem(
      "socialProfileData",
      JSON.stringify({ firstName: "Ana", lastName: "Ruiz", dateOfBirth: "1985-05-05" }),
    );
    render(<ProfileCreationForm />);

    expect(await screen.findByText(/Hi Ana/)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1985-05-05");
  });

  it("requires an activity level and keeps step 1 answers on the way back", async () => {
    const user = userEvent.setup();
    render(<ProfileCreationForm />);
    await fillAboutYou(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(alerts()).toEqual(["Activity level is required"]);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(alerts()).toEqual([]);
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1990-01-01");
    expect(screen.getByLabelText(/^weight/i)).toHaveValue(90);
  });

  it("asks for a source, a goal and a target before finishing", async () => {
    const user = userEvent.setup();
    render(<ProfileCreationForm />);
    await fillAboutYou(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.selectOptions(screen.getByLabelText(/how active are you/i), "3");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const finish = screen.getByRole("button", { name: "Finish setup" });

    await user.click(finish);
    expect(alerts()).toEqual([
      "Choose the option that fits best",
      "Pick a goal to continue",
    ]);

    await user.click(screen.getByRole("radio", { name: "Lose weight" }));
    await user.click(finish);
    expect(alerts()).toEqual([
      "Choose the option that fits best",
      "Target weight is required",
    ]);
    expect(userApi.completeProfile).not.toHaveBeenCalled();
  });

  it("completes the profile and records the goal", async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.getUserDetails).mockResolvedValue({} as never);
    render(<ProfileCreationForm />);
    await fillAboutYou(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.selectOptions(screen.getByLabelText(/how active are you/i), "3");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.selectOptions(
      screen.getByLabelText(/what are you switching from/i),
      "cronometer",
    );
    await user.click(screen.getByRole("radio", { name: "Lose weight" }));
    await user.type(screen.getByLabelText(/target weight/i), "80");
    await user.click(screen.getByRole("button", { name: "Finish setup" }));

    expect(userApi.completeProfile).toHaveBeenCalledWith({
      dateOfBirth: "1990-01-01",
      height: 180,
      weight: 90,
      gender: "male",
      activityLevel: 3,
      switchingSource: "cronometer",
      unitSystem: "metric",
    });
    expect(goalsApi.createWeightGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        goals: expect.objectContaining({
          startingWeight: 90,
          targetWeight: 80,
          startDate: "2026-10-04",
        }),
      }),
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/home",
      search: { limit: 20, offset: 0 },
      replace: true,
    });
  });
});

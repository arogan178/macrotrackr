import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfileCreationForm } from "@/features/auth/components/ProfileCreationForm";

// Reveal is opacity-only; under jsdom the animation never settles, so render
// the element directly and keep the flow synchronous.
vi.mock("motion/react", () => {
  const components = new Map<string, React.FC<Record<string, unknown>>>();

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => true,
    m: new Proxy({} as Record<string, React.FC>, {
      get: (_target, tag: string) => {
        const cached = components.get(tag);
        if (cached) return cached;

        const Component = ({
          children,
          ...properties
        }: React.PropsWithChildren<Record<string, unknown>>) => {
          const {
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            ...domProps
          } = properties;

          return <div {...domProps}>{children}</div>;
        };
        Component.displayName = `m.${tag}`;
        components.set(tag, Component);

        return Component;
      },
    }),
  };
});

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
vi.mock("@/api/user", () => ({ userApi: { completeProfile: vi.fn() } }));

/** Walks steps 1 and 2 with a 90 kg profile so step 3 has a real TDEE. */
async function reachGoalStep(user: ReturnType<typeof userEvent.setup>) {
  render(<ProfileCreationForm />);

  await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
  await user.selectOptions(screen.getByLabelText(/^gender$/i), "male");
  await user.type(screen.getByLabelText(/height/i), "180");
  await user.type(screen.getByLabelText(/^weight/i), "90");
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.selectOptions(screen.getByLabelText(/how active are you/i), "3");
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

/** The figure printed opposite a summary row's label. */
const summaryValue = (label: RegExp) =>
  screen.getByText(label).nextElementSibling!.textContent!;

describe("ProfileCreationForm goal step", () => {
  it("moves the calorie target when the goal changes", async () => {
    const user = userEvent.setup();
    await reachGoalStep(user);

    await user.click(screen.getByRole("radio", { name: /lose weight/i }));
    await user.type(screen.getByLabelText(/target weight/i), "80");
    const losing = summaryValue(/daily calorie target/i);

    await user.click(screen.getByRole("radio", { name: /gain weight/i }));
    await user.type(screen.getByLabelText(/target weight/i), "95");
    const gaining = summaryValue(/daily calorie target/i);

    expect(losing).not.toEqual(gaining);
  });

  it("drops a target weight that contradicts the newly picked goal", async () => {
    const user = userEvent.setup();
    await reachGoalStep(user);

    await user.click(screen.getByRole("radio", { name: /lose weight/i }));
    await user.type(screen.getByLabelText(/target weight/i), "80");

    await user.click(screen.getByRole("radio", { name: /gain weight/i }));

    expect(screen.getByLabelText(/target weight/i)).toHaveValue(null);
    expect(screen.queryByText(/daily calorie target/i)).not.toBeInTheDocument();
  });

  it("flags a target pointing the wrong way while the user types", async () => {
    const user = userEvent.setup();
    await reachGoalStep(user);

    await user.click(screen.getByRole("radio", { name: /gain weight/i }));
    await user.type(screen.getByLabelText(/target weight/i), "85");

    expect(screen.getByRole("alert")).toHaveTextContent(
      /target must be over 90 kg/i,
    );
    expect(screen.queryByText(/daily calorie target/i)).not.toBeInTheDocument();
  });

  it("shortens the time to target as the target weight moves closer", async () => {
    const user = userEvent.setup();
    await reachGoalStep(user);

    await user.click(screen.getByRole("radio", { name: /lose weight/i }));
    const field = screen.getByLabelText(/target weight/i);

    await user.type(field, "75");
    const far = summaryValue(/time to target/i);

    await user.clear(field);
    await user.type(field, "88");
    const near = summaryValue(/time to target/i);

    expect(Number.parseInt(far, 10)).toBeGreaterThan(Number.parseInt(near, 10));
  });

  it("shows maintenance calories with no weekly change", async () => {
    const user = userEvent.setup();
    await reachGoalStep(user);

    await user.click(screen.getByRole("radio", { name: /maintain/i }));

    expect(screen.getByText(/daily calorie target/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/target weight/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/expected change/i)).not.toBeInTheDocument();
  });
});

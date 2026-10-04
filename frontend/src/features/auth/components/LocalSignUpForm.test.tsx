import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/api/auth";

import { LocalSignUpForm } from "./LocalSignUpForm";

const { navigate, showNotification } = vi.hoisted(() => ({
  navigate: vi.fn(),
  showNotification: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/store/store", () => ({ useStore: () => ({ showNotification }) }));
vi.mock("@/api/auth", () => ({ authApi: { register: vi.fn() } }));

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  confirmPassword: string,
) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LocalSignUpForm onSwitchToSignIn={vi.fn()} />
    </QueryClientProvider>,
  );
  await user.type(screen.getByLabelText("First Name"), " Sam ");
  await user.type(screen.getByLabelText("Last Name"), "Lee");
  await user.type(screen.getByLabelText("Email"), "Sam@Example.com");
  await user.type(screen.getByLabelText("Password"), "hunter22");
  await user.type(screen.getByLabelText("Confirm Password"), confirmPassword);
}

describe("LocalSignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the account with trimmed details and goes home", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValue({} as never);
    await fillForm(user, "hunter22");

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(authApi.register).toHaveBeenCalledWith({
      email: "sam@example.com",
      password: "hunter22",
      firstName: "Sam",
      lastName: "Lee",
    });
    expect(showNotification).toHaveBeenCalledWith(
      "Account created successfully!",
      "success",
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/home",
      search: { limit: 20, offset: 0 },
      replace: true,
    });
  });

  it("flags mismatched passwords under the confirm field until they match", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValue({} as never);
    await fillForm(user, "hunter2");
    const create = screen.getByRole("button", { name: "Create Account" });

    await user.click(create);

    expect(authApi.register).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Confirm Password")).toHaveAccessibleDescription(
      "Passwords do not match.",
    );

    await user.type(screen.getByLabelText("Confirm Password"), "2");
    expect(screen.queryByText("Passwords do not match.")).not.toBeInTheDocument();

    await user.click(create);
    expect(authApi.register).toHaveBeenCalledTimes(1);
  });

  it("accepts a mismatch fixed from the password field", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValue({} as never);
    await fillForm(user, "hunter2");
    const create = screen.getByRole("button", { name: "Create Account" });

    await user.click(create);
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(create);

    expect(authApi.register).toHaveBeenCalledWith({
      email: "sam@example.com",
      password: "hunter2",
      firstName: "Sam",
      lastName: "Lee",
    });
  });

  it("shows the server's message and re-enables the button when sign up fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockRejectedValue(
      new Error("Email already registered"),
    );
    await fillForm(user, "hunter22");

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(showNotification).toHaveBeenCalledWith(
      "Email already registered",
      "error",
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Create Account" }),
    ).toBeEnabled();
  });
});

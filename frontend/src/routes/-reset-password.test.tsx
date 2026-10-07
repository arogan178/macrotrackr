import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "@/routes/reset-password";

let authMode: "clerk" | "local" = "local";

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return authMode === "local";
  },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({
    ...options,
    useSearch: () => ({ returnTo: undefined }),
  }),
  Link: ({ children }: { children: ReactNode }) => <a href="/login">{children}</a>,
}));

vi.mock("@/features/auth/components/AuthPageShell", () => ({
  default: ({ description, children }: { description: string; children: ReactNode }) => (
    <main>
      <p>{description}</p>
      {children}
    </main>
  ),
}));

vi.mock("@/utils/appConstants", () => ({
  SUPPORT_EMAIL: "support@macrotrackr.com",
  SUPPORT_EMAIL_MAILTO: "mailto:support@macrotrackr.com",
}));

const ResetPasswordPage = (Route as unknown as { component: () => ReactNode }).component;

describe("/reset-password", () => {
  beforeEach(() => {
    authMode = "local";
  });

  it("shows self-hosters the command their server admin runs", () => {
    render(<ResetPasswordPage />);

    expect(screen.getByText("Whoever runs this server can reset it for you.")).toBeInTheDocument();
    expect(
      screen.getByText("docker exec <backend-container> bun run reset-password you@example.com"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toBeInTheDocument();
  });

  it("points hosted users at support instead", () => {
    authMode = "clerk";

    render(<ResetPasswordPage />);

    expect(screen.getByRole("link", { name: "support@macrotrackr.com" })).toHaveAttribute(
      "href",
      "mailto:support@macrotrackr.com",
    );
    expect(screen.queryByText(/reset-password/)).not.toBeInTheDocument();
  });
});

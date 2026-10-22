import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppLockScreen } from "./AppLockScreen";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useLogout: () => ({ mutate }),
}));
vi.mock("@/features/auth/components/AuthPageShell", () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

function renderScreen(onUnlock = vi.fn()) {
  return render(
    <AppLockScreen
      isChecking={false}
      biometricLabel="fingerprint"
      onUnlock={onUnlock}
    />,
  );
}

describe("AppLockScreen", () => {
  it("makes everything behind it inert, and restores it on unlock", () => {
    const modalRoot = document.createElement("div");
    document.body.append(modalRoot);

    const { unmount } = renderScreen();

    expect(modalRoot.inert).toBe(true);
    expect(
      screen.getByRole("button", { name: "Sign in with fingerprint" }),
    ).toBeVisible();

    unmount();
    expect(modalRoot.inert).toBe(false);
    modalRoot.remove();
  });

  it("asks for the biometric from the sign-in button", () => {
    const onUnlock = vi.fn();
    renderScreen(onUnlock);

    screen.getByRole("button", { name: "Sign in with fingerprint" }).click();

    expect(onUnlock).toHaveBeenCalled();
  });

  it("signs out straight to the sign-in page for another way in", () => {
    renderScreen();

    screen.getByRole("button", { name: "Sign in another way" }).click();

    expect(mutate).toHaveBeenCalledWith({ toSignIn: true });
  });
});

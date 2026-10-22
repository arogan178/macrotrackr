import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppLockScreen } from "./AppLockScreen";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useLogout: () => ({ mutate }),
}));

describe("AppLockScreen", () => {
  it("makes everything behind it inert, and restores it on unlock", () => {
    const modalRoot = document.createElement("div");
    document.body.append(modalRoot);

    const { unmount } = render(
      <AppLockScreen isChecking={false} onUnlock={vi.fn()} />,
    );

    expect(modalRoot.inert).toBe(true);
    expect(screen.getByRole("button", { name: "Unlock" })).toBeVisible();

    unmount();
    expect(modalRoot.inert).toBe(false);
    modalRoot.remove();
  });

  it("offers sign-out as a way out", () => {
    render(<AppLockScreen isChecking={false} onUnlock={vi.fn()} />);

    screen.getByRole("button", { name: "Sign out" }).click();

    expect(mutate).toHaveBeenCalled();
  });
});

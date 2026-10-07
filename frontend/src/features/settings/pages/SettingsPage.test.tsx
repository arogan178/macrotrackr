import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./SettingsPage";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  unsent: 0,
}));

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => ({}),
}));
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useLogout: () => ({ mutate: mocks.logout, isPending: false }),
}));
vi.mock("@/hooks/queries/macro/entryStore", () => ({
  countUnsentEntries: () => Promise.resolve(mocks.unsent),
}));
vi.mock("@/hooks/queries/useSettings", () => ({
  useSettings: () => ({ data: undefined, isLoading: true, error: null }),
}));
vi.mock("@/hooks/usePageDataSync", () => ({ usePageDataSync: () => {} }));
vi.mock("@/features/settings/components", () => ({
  SettingsLoadingSkeleton: () => null,
}));
vi.mock("@/features/settings/components/DeleteAccountForm", () => ({
  default: () => null,
}));

describe("SettingsPage sign-out", () => {
  beforeEach(() => {
    mocks.logout.mockClear();
    const modalRoot = document.createElement("div");
    modalRoot.setAttribute("id", "modal-root");
    document.body.append(modalRoot);
  });

  it("signs out straight away when every entry has synced", async () => {
    mocks.unsent = 0;
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(mocks.logout).toHaveBeenCalledTimes(1));
  });

  it("warns before signing out would delete entries that never synced", async () => {
    mocks.unsent = 2;
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(
      await screen.findByText(
        "2 entries haven't reached the server yet. Signing out now deletes them from this device. Reconnect first to keep them.",
      ),
    ).toBeInTheDocument();
    expect(mocks.logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sign out anyway" }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });
});

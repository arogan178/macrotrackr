import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/core";
import { goalsApi } from "@/api/goals";
import { habitsApi } from "@/api/habits";
import { macrosApi } from "@/api/macros";
import { userApi } from "@/api/user";
import {
  downloadCsv,
  downloadHistoryCsv,
} from "@/features/macroTracking/utils/historyExport";
import type { MacroEntry } from "@/types/macro";

import DeleteAccountForm from "./DeleteAccountForm";

const logout = vi.hoisted(() => vi.fn());
const clearSignedOutAccount = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/queries/macro/entryStore", () => ({ clearSignedOutAccount }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useLogout: () => ({ mutate: logout, isPending: false }),
}));
vi.mock("@/api/user", () => ({ userApi: { deleteAccount: vi.fn() } }));
vi.mock("@/api/macros", () => ({ macrosApi: { getAllHistory: vi.fn() } }));
vi.mock("@/api/goals", () => ({ goalsApi: { getWeightLog: vi.fn() } }));
vi.mock("@/api/habits", () => ({ habitsApi: { getHabits: vi.fn() } }));
vi.mock(
  "@/features/macroTracking/utils/historyExport",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    downloadCsv: vi.fn(),
    downloadHistoryCsv: vi.fn(),
  }),
);

describe("DeleteAccountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads the full meal history, weight log and habits", async () => {
    const entries = [{ id: 1 }] as unknown as MacroEntry[];
    vi.mocked(macrosApi.getAllHistory).mockResolvedValue({ entries });
    vi.mocked(goalsApi.getWeightLog).mockResolvedValue([
      { id: "a", timestamp: "2026-09-20T08:00:00", weight: 80 },
    ]);
    vi.mocked(habitsApi.getHabits).mockResolvedValue([]);
    render(<DeleteAccountForm />);

    await act(async () => {
      fireEvent.click(screen.getByText("Download a copy first."));
    });

    expect(macrosApi.getAllHistory).toHaveBeenCalledWith({ fullExport: true });
    expect(downloadHistoryCsv).toHaveBeenCalledWith(entries);
    expect(downloadCsv).toHaveBeenCalledWith(
      "Date,Weight (kg)\n2026-09-20,80",
      "weight",
    );
    expect(downloadCsv).toHaveBeenCalledWith(
      "Name,Current,Target,Complete,Created At,Completed At",
      "habits",
    );
  });

  it("shows an error and downloads nothing when the export fails", async () => {
    vi.mocked(macrosApi.getAllHistory).mockRejectedValue(new Error("down"));
    vi.mocked(goalsApi.getWeightLog).mockResolvedValue([]);
    vi.mocked(habitsApi.getHabits).mockResolvedValue([]);
    render(<DeleteAccountForm />);

    await act(async () => {
      fireEvent.click(screen.getByText("Download a copy first."));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not export your data. Try again before deleting.",
    );
    expect(downloadHistoryCsv).not.toHaveBeenCalled();
    expect(downloadCsv).not.toHaveBeenCalled();
  });

  it("keeps delete disabled until DELETE is typed exactly", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountForm />);
    const field = screen.getByLabelText(
      "Type DELETE to confirm account deletion",
    );
    const button = screen.getByRole("button", {
      name: "Permanently delete my account",
    });

    expect(button).toBeDisabled();
    await user.type(field, "delete");
    expect(button).toBeDisabled();
    await user.clear(field);
    await user.type(field, " DELETE ");
    expect(button).toBeEnabled();
  });

  it("deletes the account, clears it from the device and signs out", async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.deleteAccount).mockResolvedValue({ success: true, message: "" });
    render(<DeleteAccountForm />);

    await user.type(
      screen.getByLabelText("Type DELETE to confirm account deletion"),
      "DELETE",
    );
    const button = screen.getByRole("button", {
      name: "Permanently delete my account",
    });
    await user.click(button);

    expect(userApi.deleteAccount).toHaveBeenCalledTimes(1);
    expect(clearSignedOutAccount).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Deleting…");
  });

  it("shows the server's message and stays signed in when deletion is refused", async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.deleteAccount).mockRejectedValue(
      new ApiError(
        "Cancel your subscription in Billing first.",
        409,
        "CONFLICT",
      ),
    );
    render(<DeleteAccountForm />);

    await user.type(
      screen.getByLabelText("Type DELETE to confirm account deletion"),
      "DELETE",
    );
    const button = screen.getByRole("button", {
      name: "Permanently delete my account",
    });
    await user.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cancel your subscription in Billing first.",
    );
    expect(logout).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Delete my account");
  });
});

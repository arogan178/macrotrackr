import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { goalsApi } from "@/api/goals";
import { habitsApi } from "@/api/habits";
import { macrosApi } from "@/api/macros";
import {
  downloadCsv,
  downloadHistoryCsv,
} from "@/features/macroTracking/utils/historyExport";
import type { MacroEntry } from "@/types/macro";

import DeleteAccountForm from "./DeleteAccountForm";

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useLogout: () => ({ mutate: vi.fn() }),
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
});

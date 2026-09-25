import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { goalsApi } from "@/api/goals";
import { habitsApi } from "@/api/habits";
import { macrosApi } from "@/api/macros";
import {
  downloadCsv,
  downloadHistoryCsv,
} from "@/features/macroTracking/utils/historyExport";
import { useStore } from "@/store/store";

import DataExporter from "./DataExporter";

const entitlements = vi.hoisted(() => ({ hasProAccess: true }));

vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => entitlements,
}));
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

function errorMessages() {
  return useStore
    .getState()
    .notifications.filter((notification) => notification.type === "error")
    .map((notification) => notification.message);
}

describe("DataExporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entitlements.hasProAccess = true;
    useStore.setState({ notifications: [] });
  });

  it("downloads the meal history", async () => {
    vi.mocked(macrosApi.getAllHistory).mockResolvedValue({ entries: [] });
    render(<DataExporter />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Export meal history as CSV"));
    });

    expect(downloadHistoryCsv).toHaveBeenCalledWith([]);
  });

  it("downloads the weight log and habits as CSV", async () => {
    vi.mocked(goalsApi.getWeightLog).mockResolvedValue([
      { id: "a", timestamp: "2026-09-20T08:00:00", weight: 80 },
    ]);
    vi.mocked(habitsApi.getHabits).mockResolvedValue([]);
    render(<DataExporter />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Export weight log as CSV"));
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Export habits as CSV"));
    });

    expect(downloadCsv).toHaveBeenCalledWith(
      "Date,Weight (kg)\n2026-09-20,80",
      "weight",
    );
    expect(downloadCsv).toHaveBeenCalledWith(
      "Name,Current,Target,Complete,Created At,Completed At",
      "habits",
    );
  });

  it("shows a loading state while the export runs", async () => {
    let resolve!: (value: []) => void;
    vi.mocked(goalsApi.getWeightLog).mockReturnValue(
      new Promise((resolver) => {
        resolve = resolver;
      }),
    );
    render(<DataExporter />);
    const button = screen.getByLabelText("Export weight log as CSV");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
    await act(async () => resolve([]));
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("shows an error when an export fails", async () => {
    vi.mocked(habitsApi.getHabits).mockRejectedValue(
      new Error("Habits unavailable"),
    );
    render(<DataExporter />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Export habits as CSV"));
    });

    expect(errorMessages()).toEqual(["Habits unavailable"]);
    expect(downloadCsv).not.toHaveBeenCalled();
  });

  it("keeps only the meal history export behind Pro, like Home", () => {
    entitlements.hasProAccess = false;
    render(<DataExporter />);

    expect(screen.getAllByLabelText("Pro feature")).toHaveLength(1);
    expect(screen.getByLabelText("Export weight log as CSV")).toBeEnabled();
    expect(screen.getByLabelText("Export habits as CSV")).toBeEnabled();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as canvasUtils from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { useStore } from "@/store/store";

import MacroSnapshotModal from "./MacroSnapshotModal";

const mockSnapshotData: canvasUtils.MacroSnapshotData = {
  title: "Today's Macros",
  dateLabel: "Oct 24, 2026",
  calories: 2150,
  calorieTarget: 2400,
  protein: 165,
  proteinTarget: 180,
  carbs: 220,
  carbsTarget: 230,
  fats: 60,
  fatsTarget: 70,
  streakDays: 7,
  complianceScore: 92,
};

describe("MacroSnapshotModal", () => {
  const showNotificationMock = vi.fn();

  beforeEach(() => {
    let modalRoot = document.querySelector("#modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }

    useStore.setState({
      showNotification: showNotificationMock,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders scorecard with title, date, calories, and macronutrients", () => {
    render(
      <MacroSnapshotModal
        isOpen
        onClose={vi.fn()}
        data={mockSnapshotData}
      />,
    );

    expect(screen.getByText("Share snapshot")).toBeInTheDocument();
    expect(screen.getByText("Today's Macros")).toBeInTheDocument();
    expect(screen.getByText("Oct 24, 2026")).toBeInTheDocument();
    expect(screen.getByText("Calories")).toBeInTheDocument();
    expect(screen.getByText("2,150")).toBeInTheDocument();
    expect(screen.getByText("165")).toBeInTheDocument();
    expect(screen.getByText("220")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("displays streak badge when streakDays is provided", () => {
    render(
      <MacroSnapshotModal
        isOpen
        onClose={vi.fn()}
        data={mockSnapshotData}
      />,
    );

    const badge = screen.getByTestId("snapshot-badge");
    expect(badge).toHaveTextContent("7-day streak");
    // Emoji are not part of the UI vocabulary.
    expect(badge.textContent).not.toMatch(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    );
  });

  it("displays compliance badge when custom badgeLabel is provided", () => {
    render(
      <MacroSnapshotModal
        isOpen
        onClose={vi.fn()}
        data={{
          ...mockSnapshotData,
          streakDays: undefined,
          badgeLabel: "95% weekly compliance",
        }}
      />,
    );

    const badge = screen.getByTestId("snapshot-badge");
    expect(badge).toHaveTextContent("95% weekly compliance");
  });

  it("calls downloadSnapshotImage when Download PNG button is clicked", async () => {
    const downloadSpy = vi
      .spyOn(canvasUtils, "downloadSnapshotImage")
      .mockResolvedValue(undefined);

    render(
      <MacroSnapshotModal
        isOpen
        onClose={vi.fn()}
        data={mockSnapshotData}
      />,
    );

    const downloadButton = screen.getByRole("button", {
      name: /download image snapshot/i,
    });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(mockSnapshotData);
      expect(showNotificationMock).toHaveBeenCalledWith(
        "Image saved.",
        "success",
      );
    });
  });

  it("calls copySnapshotToClipboard and shows notification when Copy Image is clicked", async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const copySpy = vi
      .spyOn(canvasUtils, "copySnapshotToClipboard")
      .mockResolvedValue(true);

    render(
      <MacroSnapshotModal
        isOpen
        onClose={vi.fn()}
        data={mockSnapshotData}
      />,
    );

    const copyButton = screen.getByRole("button", {
      name: /copy image to clipboard/i,
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copySpy).toHaveBeenCalledWith(mockSnapshotData);
      expect(showNotificationMock).toHaveBeenCalledWith(
        "Image copied.",
        "success",
      );
    });
  });

  it("calls shareSnapshot when Share button is clicked", async () => {
    // Mock navigator.share
    Object.assign(navigator, {
      share: vi.fn().mockResolvedValue(undefined),
      canShare: vi.fn().mockReturnValue(true),
    });

    const shareSpy = vi
      .spyOn(canvasUtils, "shareSnapshot")
      .mockResolvedValue(true);

    render(
      <MacroSnapshotModal
        isOpen
        onClose={vi.fn()}
        data={mockSnapshotData}
      />,
    );

    const shareButton = screen.getByRole("button", {
      name: /share snapshot/i,
    });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith(mockSnapshotData);
    });
  });

  it("calls onClose when Done button is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <MacroSnapshotModal
        isOpen
        onClose={onCloseMock}
        data={mockSnapshotData}
      />,
    );

    const doneButton = screen.getByRole("button", {
      name: /^done$/i,
    });
    fireEvent.click(doneButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

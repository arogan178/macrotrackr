import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canvasToBlob,
  copySnapshotToClipboard,
  downloadSnapshotImage,
  MacroSnapshotData,
  renderSnapshotToCanvas,
  shareSnapshot,
} from "./macroSnapshotCanvas";

const mockSnapshotData: MacroSnapshotData = {
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

const createMock2DContext = () =>
  ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    clip: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    roundRect: vi.fn(),
  }) as unknown as CanvasRenderingContext2D;

describe("macroSnapshotCanvas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => createMock2DContext(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("renderSnapshotToCanvas", () => {
    it("creates a canvas with correct dimensions (1080x1350)", () => {
      const canvas = renderSnapshotToCanvas(mockSnapshotData);
      expect(canvas.width).toBe(1080);
      expect(canvas.height).toBe(1350);
    });

    it("handles zero total calories and missing targets gracefully", () => {
      const emptyData: MacroSnapshotData = {
        calories: 0,
        calorieTarget: 0,
        protein: 0,
        proteinTarget: 0,
        carbs: 0,
        carbsTarget: 0,
        fats: 0,
        fatsTarget: 0,
      };
      const canvas = renderSnapshotToCanvas(emptyData);
      expect(canvas.width).toBe(1080);
      expect(canvas.height).toBe(1350);
    });
  });

  describe("canvasToBlob", () => {
    it("converts canvas to blob using toBlob when available", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      const mockCanvas = {
        toBlob: vi.fn((callback: (blob: Blob | null) => void) => callback(mockBlob)),
      } as unknown as HTMLCanvasElement;

      const blob = await canvasToBlob(mockCanvas);
      expect(blob).toBe(mockBlob);
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
    });

    it("falls back to toDataURL when toBlob is not available", async () => {
      const mockCanvas = {
        toBlob: undefined,
        toDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
      } as unknown as HTMLCanvasElement;

      const blob = await canvasToBlob(mockCanvas);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("image/png");
    });
  });

  describe("downloadSnapshotImage", () => {
    it("creates and triggers a download link", async () => {
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      // Mock canvas toBlob
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
        callback(new Blob(["mock-png"], { type: "image/png" }));
      });

      await downloadSnapshotImage(mockSnapshotData, "test-snapshot.png");

      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe("copySnapshotToClipboard", () => {
    it("writes image blob to clipboard when supported", async () => {
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      class MockClipboardItem {
        data: Record<string, Blob>;
        constructor(data: Record<string, Blob>) {
          this.data = data;
        }
      }
      Object.assign(globalThis, {
        ClipboardItem: MockClipboardItem,
      });
      Object.assign(navigator, {
        clipboard: {
          write: writeSpy,
        },
      });

      // Mock canvas toBlob
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
        callback(new Blob(["mock-png"], { type: "image/png" }));
      });

      const success = await copySnapshotToClipboard(mockSnapshotData);
      expect(success).toBe(true);
      expect(writeSpy).toHaveBeenCalled();
    });

    it("throws error when clipboard.write is not available", async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      await expect(copySnapshotToClipboard(mockSnapshotData)).rejects.toThrow(
        "Clipboard image write not supported",
      );
    });
  });

  describe("shareSnapshot", () => {
    it("shares file using navigator.share when files are supported", async () => {
      const shareSpy = vi.fn().mockResolvedValue(undefined);
      const canShareSpy = vi.fn().mockReturnValue(true);

      Object.assign(navigator, {
        share: shareSpy,
        canShare: canShareSpy,
      });

      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
        callback(new Blob(["mock-png"], { type: "image/png" }));
      });

      const success = await shareSnapshot(mockSnapshotData);
      expect(success).toBe(true);
      expect(canShareSpy).toHaveBeenCalled();
      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Today's Macros",
          files: expect.any(Array),
        }),
      );
    });

    it("falls back to text sharing when files sharing is not supported", async () => {
      const shareSpy = vi.fn().mockResolvedValue(undefined);
      const canShareSpy = vi.fn().mockReturnValue(false);

      Object.assign(navigator, {
        share: shareSpy,
        canShare: canShareSpy,
      });

      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
        callback(new Blob(["mock-png"], { type: "image/png" }));
      });

      const success = await shareSnapshot(mockSnapshotData);
      expect(success).toBe(true);
      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Today's Macros",
          text: expect.stringContaining("Calories: 2150 / 2400 kcal"),
        }),
      );
    });
  });
});

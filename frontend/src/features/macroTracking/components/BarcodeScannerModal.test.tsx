import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";

import BarcodeScannerModal from "./BarcodeScannerModal";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    getByBarcode: vi.fn(),
  },
}));

// The scanner reaches zxing through a dynamic import, so the double has to be
// installed at the module boundary. `readerInit` also lets one test simulate the
// import succeeding but the decoder refusing to construct.
const { zxingDecode, readerInit } = vi.hoisted(() => ({
  zxingDecode: vi.fn(),
  readerInit: vi.fn(),
}));

vi.mock("@zxing/library", () => ({
  BrowserMultiFormatReader: class {
    decode = zxingDecode;

    constructor(...args: unknown[]) {
      readerInit(...args);
    }
  },
  BarcodeFormat: {
    EAN_13: 0,
    EAN_8: 1,
    UPC_A: 2,
    UPC_E: 3,
    CODE_128: 4,
    CODE_39: 5,
    QR_CODE: 6,
  },
  DecodeHintType: { POSSIBLE_FORMATS: 2 },
}));

const GREEK_YOGURT = {
  name: "Greek Yogurt",
  protein: 15,
  carbs: 6,
  fats: 0,
  energyKcal: 90,
  categories: "Dairy",
  servingQuantity: 170,
  servingUnit: "g",
};

const mockGetByBarcode = macrosApi.getByBarcode as unknown as ReturnType<typeof vi.fn>;

/** A camera that hands back one stoppable track. */
const stubCamera = () => {
  const track = { stop: vi.fn() };
  const getUserMedia = vi.fn().mockResolvedValue({
    getTracks: vi.fn().mockReturnValue([track]),
  });
  vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia } });

  return { getUserMedia, track };
};

describe("BarcodeScannerModal", () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    let modalRoot = document.querySelector("#modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }

    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    // jsdom leaves readyState at 0, and the scan loop skips any frame below 2.
    // Without this the decode path is unreachable and a test asserting on it
    // would pass against a scanner that never decodes anything.
    Object.defineProperty(window.HTMLMediaElement.prototype, "readyState", {
      configurable: true,
      get: () => 4,
    });
  });

  afterEach(() => {
    playSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    Reflect.deleteProperty(window.HTMLMediaElement.prototype, "readyState");
  });

  it("renders modal when isOpen is true and allows manual lookup", async () => {
    mockGetByBarcode.mockResolvedValue(GREEK_YOGURT);

    const onProductFound = vi.fn();
    const onClose = vi.fn();

    render(
      <BarcodeScannerModal
        isOpen
        onClose={onClose}
        onProductFound={onProductFound}
      />
    );

    expect(screen.getByText("Barcode Scanner")).toBeInTheDocument();

    const manualButton = screen.getByRole("button", { name: "Enter Barcode Manually" });
    fireEvent.click(manualButton);

    const input = screen.getByLabelText(/barcode number/i);
    fireEvent.change(input, { target: { value: "123456789" } });

    const lookupButton = screen.getByRole("button", { name: "Look up product barcode" });
    fireEvent.click(lookupButton);

    await waitFor(() => {
      expect(macrosApi.getByBarcode).toHaveBeenCalledWith("123456789");
      expect(onProductFound).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Greek Yogurt",
          protein: 15,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("decodes camera frames through zxing when native BarcodeDetector is absent (Safari/iOS)", async () => {
    expect(window.BarcodeDetector).toBeUndefined();
    zxingDecode.mockReturnValue({ getText: () => "5449000000996" });
    mockGetByBarcode.mockResolvedValue(GREEK_YOGURT);
    const { getUserMedia } = stubCamera();
    const onProductFound = vi.fn();

    render(
      <BarcodeScannerModal isOpen onClose={vi.fn()} onProductFound={onProductFound} />
    );

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: { ideal: "environment" } }),
        })
      );
    });

    // The barcode zxing read has to reach the lookup, otherwise iOS still cannot scan.
    await waitFor(() => {
      expect(zxingDecode).toHaveBeenCalled();
      expect(macrosApi.getByBarcode).toHaveBeenCalledWith("5449000000996");
      expect(onProductFound).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Greek Yogurt" })
      );
    });

    // Only the seven formats a food barcode can be, not zxing's whole catalogue.
    expect(readerInit).toHaveBeenCalledWith(
      new Map([[2, [0, 1, 2, 3, 4, 5, 6]]]),
      300
    );
  });

  it("uses native BarcodeDetector when available, without loading zxing (Chromium/Android)", async () => {
    const detect = vi.fn().mockResolvedValue([{ rawValue: "737628064502" }]);
    vi.stubGlobal(
      "BarcodeDetector",
      class {
        detect = detect;
      }
    );
    mockGetByBarcode.mockResolvedValue(GREEK_YOGURT);
    const { getUserMedia } = stubCamera();
    const onProductFound = vi.fn();

    render(
      <BarcodeScannerModal isOpen onClose={vi.fn()} onProductFound={onProductFound} />
    );

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(detect).toHaveBeenCalled();
      expect(macrosApi.getByBarcode).toHaveBeenCalledWith("737628064502");
      expect(onProductFound).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Greek Yogurt" })
      );
    });

    // The whole point of the native branch: no decoder is downloaded.
    expect(readerInit).not.toHaveBeenCalled();
    expect(zxingDecode).not.toHaveBeenCalled();
  });

  it("falls back to manual entry when no detector can be built at all", async () => {
    readerInit.mockImplementation(() => {
      throw new Error("decoder unavailable");
    });
    stubCamera();

    render(
      <BarcodeScannerModal isOpen onClose={vi.fn()} onProductFound={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/cannot scan barcodes/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/barcode number/i)).toBeInTheDocument();
  });

  it("falls back to manual entry when camera access is denied", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error("Permission denied"));
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia } });

    render(
      <BarcodeScannerModal isOpen onClose={vi.fn()} onProductFound={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/camera access was not granted/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/barcode number/i)).toBeInTheDocument();
  });

  it("shows error status when barcode is not found", async () => {
    mockGetByBarcode.mockResolvedValue(null);

    const onProductFound = vi.fn();
    const onClose = vi.fn();

    render(
      <BarcodeScannerModal
        isOpen
        onClose={onClose}
        onProductFound={onProductFound}
      />
    );

    const manualButton = screen.getByRole("button", { name: "Enter Barcode Manually" });
    fireEvent.click(manualButton);

    const input = screen.getByLabelText(/barcode number/i);
    fireEvent.change(input, { target: { value: "00000000" } });

    const lookupButton = screen.getByRole("button", { name: "Look up product barcode" });
    fireEvent.click(lookupButton);

    await waitFor(() => {
      expect(
        screen.getByText(/no food product found for barcode/i)
      ).toBeInTheDocument();
    });
    expect(onProductFound).not.toHaveBeenCalled();
  });
});

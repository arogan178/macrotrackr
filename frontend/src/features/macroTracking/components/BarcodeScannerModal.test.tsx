import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";

import BarcodeScannerModal from "./BarcodeScannerModal";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    getByBarcode: vi.fn(),
  },
}));

describe("BarcodeScannerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let modalRoot = document.querySelector("#modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
  });

  it("renders modal when isOpen is true and allows manual lookup", async () => {
    (macrosApi.getByBarcode as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Greek Yogurt",
      protein: 15,
      carbs: 6,
      fats: 0,
      energyKcal: 90,
      categories: "Dairy",
      servingQuantity: 170,
      servingUnit: "g",
    });

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

  it("falls back to manual entry when the browser has no BarcodeDetector", async () => {
    // Safari/iOS: getUserMedia exists but there is nothing to decode frames with.
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia },
    });

    render(
      <BarcodeScannerModal isOpen onClose={vi.fn()} onProductFound={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/cannot scan barcodes/i)).toBeInTheDocument();
    });
    // The camera is never opened, so no preview streams that could not scan.
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/barcode number/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows error status when barcode is not found", async () => {
    (macrosApi.getByBarcode as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

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

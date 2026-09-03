import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { BarcodeFormat, HTMLVisualMediaElement } from "@zxing/library";

import { type FoodSearchResult, macrosApi } from "@/api/macros";
import { formStyles } from "@/components/form/FormStyles";
import {
  BarcodeIcon,
  Button,
  CameraIcon,
  LoadingSpinner,
  Modal,
  StatusIndicator,
} from "@/components/ui";
import { cn } from "@/lib/classnameUtilities";

interface BarcodeDetectorLike {
  detect(
    source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement
  ): Promise<Array<{ rawValue: string }>>;
}

type BarcodeDetectorConstructor = new (options?: { formats: string[] }) => BarcodeDetectorLike;

/**
 * The interval between decode attempts, and the interval zxing is told to pace
 * itself at. One cadence, so the two cannot drift apart.
 */
const SCAN_INTERVAL_MS = 300;

/** What a food barcode is ever going to be. Native names; zxing gets the map below. */
const SCANNED_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "qr_code",
] as const;

/**
 * Chromium and Android WebView have a native BarcodeDetector. WebKit does not,
 * and on iOS every browser is WebKit, so the scanner used to be dead there: the
 * camera opened and silently never decoded. zxing fills that gap, loaded only
 * once the native check has failed, so the browsers that do not need a decoder
 * never download one.
 */
const createBarcodeDetector = async (): Promise<BarcodeDetectorLike | null> => {
  if (typeof window === "undefined") return null;

  const { BarcodeDetector } = window as unknown as {
    BarcodeDetector?: BarcodeDetectorConstructor;
  };

  if (BarcodeDetector) {
    try {
      return new BarcodeDetector({ formats: [...SCANNED_FORMATS] });
    } catch {
      // Constructed but unsupported formats: fall through to zxing.
    }
  }

  try {
    const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import(
      "@zxing/library"
    );

    const zxingFormats: Record<(typeof SCANNED_FORMATS)[number], BarcodeFormat> = {
      ean_13: BarcodeFormat.EAN_13,
      ean_8: BarcodeFormat.EAN_8,
      upc_a: BarcodeFormat.UPC_A,
      upc_e: BarcodeFormat.UPC_E,
      code_128: BarcodeFormat.CODE_128,
      code_39: BarcodeFormat.CODE_39,
      qr_code: BarcodeFormat.QR_CODE,
    };

    const hints = new Map([
      [DecodeHintType.POSSIBLE_FORMATS, SCANNED_FORMATS.map((format) => zxingFormats[format])],
    ]);
    const reader = new BrowserMultiFormatReader(hints, SCAN_INTERVAL_MS);

    return {
      detect(source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement) {
        try {
          const text = reader.decode(source as HTMLVisualMediaElement).getText();

          return Promise.resolve(text ? [{ rawValue: text }] : []);
        } catch {
          // zxing throws NotFoundException for every frame without a barcode,
          // which is almost all of them. Not an error worth surfacing.
          return Promise.resolve([]);
        }
      },
    };
  } catch {
    return null;
  }
};

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: FoodSearchResult) => void;
}

const BarcodeScannerModal = memo(function BarcodeScannerModal({
  isOpen,
  onClose,
  onProductFound,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("camera");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isLookupInProgressRef = useRef(false);
  // Bumped by every stop, so an in-flight startCamera can tell that it was
  // superseded and bail instead of installing a second stream. A boolean could
  // not: the newer start set it back to true before the older one resumed.
  const startGenerationRef = useRef(0);

  const stopCamera = useCallback(() => {
    startGenerationRef.current += 1;
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleLookup = useCallback(
    async (code: string) => {
      const cleanCode = code.trim();
      if (!cleanCode || isLookupInProgressRef.current) return;

      isLookupInProgressRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const product = await macrosApi.getByBarcode(cleanCode);
        if (product) {
          stopCamera();
          onProductFound(product);
          onClose();
        } else {
          setErrorMessage(
            `No food product found for barcode "${cleanCode}". You can search by name or enter macros directly.`
          );
        }
      } catch {
        setErrorMessage("Failed to look up barcode. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
        isLookupInProgressRef.current = false;
      }
    },
    [onClose, onProductFound, stopCamera]
  );

  const startCamera = useCallback(async () => {
    stopCamera();
    const generation = startGenerationRef.current;
    setErrorMessage(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      setHasCamera(false);
      setMode("manual");

      return;
    }

    const barcodeDetector = await createBarcodeDetector();

    if (generation !== startGenerationRef.current) return;

    if (!barcodeDetector) {
      setHasCamera(false);
      setMode("manual");
      setErrorMessage(
        "This browser cannot scan barcodes. Enter the barcode numbers below instead."
      );

      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (generation !== startGenerationRef.current) {
        for (const track of stream.getTracks()) {
          track.stop();
        }

        return;
      }

      streamRef.current = stream;
      setHasCamera(true);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || isLookupInProgressRef.current) {
          return;
        }
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
            const detected = barcodes[0].rawValue;
            handleLookup(detected);
          }
        } catch {
          // Ignore detection errors in animation loop
        }
      }, SCAN_INTERVAL_MS);
    } catch {
      if (generation !== startGenerationRef.current) return;
      setHasCamera(false);
      setMode("manual");
      setErrorMessage("Camera access was not granted. Please enter the barcode numbers manually.");
    }
  }, [handleLookup, stopCamera]);

  useEffect(() => {
    if (isOpen && mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, startCamera, stopCamera]);

  const handleManualSubmit = (event_: React.FormEvent) => {
    event_.preventDefault();
    if (manualCode.trim()) {
      handleLookup(manualCode.trim());
    }
  };

  return (
    <Modal
      variant="form"
      hideDefaultButtons
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Barcode Scanner"
      size="md"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <p className="text-xs text-muted">
            Scan packaged food barcodes to log nutrition instantly.
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant={mode === "camera" ? "primary" : "secondary"}
              buttonSize="sm"
              onClick={() => setMode("camera")}
              ariaLabel="Use Camera Scanner"
              className="text-xs"
              leftIcon={<CameraIcon className="h-3.5 w-3.5" />}
            >
              Camera
            </Button>
            <Button
              type="button"
              variant={mode === "manual" ? "primary" : "secondary"}
              buttonSize="sm"
              onClick={() => setMode("manual")}
              ariaLabel="Enter Barcode Manually"
              className="text-xs"
              leftIcon={<BarcodeIcon className="h-3.5 w-3.5" />}
            >
              Manual
            </Button>
          </div>
        </div>

        {mode === "camera" && hasCamera !== false ? (
          <div className="relative flex aspect-4/3 w-full flex-col items-center justify-center overflow-hidden rounded-control border border-border bg-surface-2">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              aria-label="Live Camera Feed"
            />
            {/* Viewfinder Target Frame */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="relative h-36 w-64 rounded-control border-2 border-dashed border-primary/80 bg-background/40">
                <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-primary/60 animate-pulse" />
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 p-4">
                <LoadingSpinner />
                <span className="text-xs font-medium text-foreground">Looking up product nutrition...</span>
              </div>
            )}

            {!isScanning && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-xs text-muted">Ready to scan barcode</p>
                <Button
                  type="button"
                  variant="secondary"
                  buttonSize="sm"
                  onClick={startCamera}
                  ariaLabel="Start Camera"
                >
                  Start Camera
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {mode === "manual" || hasCamera === false ? (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <label htmlFor="manual-barcode-input" className={formStyles.label}>
              Barcode Number (EAN / UPC)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="manual-barcode-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualCode}
                onChange={(event_) => setManualCode(event_.target.value)}
                placeholder="e.g. 737628064502"
                maxLength={30}
                className={cn(formStyles.input.base, formStyles.input.normal, "h-11 flex-1")}
              />
              <Button
                type="submit"
                variant="primary"
                buttonSize="md"
                isLoading={isLoading}
                disabled={isLoading || !manualCode.trim()}
                ariaLabel="Look up product barcode"
                className="h-11 shrink-0 px-4 font-semibold"
              >
                Lookup
              </Button>
            </div>
          </form>
        ) : null}

        {errorMessage && (
          <div className="mt-1">
            <StatusIndicator status="error" message={errorMessage} />
          </div>
        )}
      </div>
    </Modal>
  );
});

export default BarcodeScannerModal;

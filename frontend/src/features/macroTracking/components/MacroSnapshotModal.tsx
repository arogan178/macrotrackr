import { memo, useMemo, useState } from "react";

import BrandMark from "@/components/layout/BrandMark";
import Button from "@/components/ui/Button";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import { CheckIcon, CopyIcon, ExportIcon, ShareIcon } from "@/components/ui/Icons";
import Modal from "@/components/ui/Modal";
import Panel, { RULE_SECTION } from "@/components/ui/Panel";
import ProgressBar from "@/components/ui/ProgressBar";
import Value from "@/components/ui/Value";
import {
  buildSnapshotModel,
  type MacroKey,
  type MacroSnapshotData,
} from "@/features/macroTracking/utils/macroSnapshot";
import {
  copySnapshotToClipboard,
  downloadSnapshotImage,
  shareSnapshot,
} from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { cn } from "@/lib/classnameUtilities";
import { useStore } from "@/store/store";

export interface MacroSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MacroSnapshotData;
}

const MACRO_TEXT: Record<MacroKey, string> = {
  protein: "text-protein",
  carbs: "text-carbs",
  fats: "text-fats",
};

const MACRO_DOT: Record<MacroKey, string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fats: "bg-fats",
};

function MacroSnapshotModalInner({
  isOpen,
  onClose,
  data,
}: MacroSnapshotModalProps) {
  const { showNotification } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // The preview draws exactly what the PNG draws.
  const model = useMemo(() => buildSnapshotModel(data), [data]);

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const canCopy =
    typeof navigator !== "undefined" && Boolean(navigator.clipboard?.write);

  const run = async (
    action: () => Promise<unknown>,
    failure: string,
    success?: string,
  ) => {
    try {
      setIsExporting(true);
      await action();
      if (success) showNotification(success, "success");
    } catch (error) {
      // Dismissing the share sheet is a choice, not a failure.
      if (error instanceof Error && error.name === "AbortError") return;
      showNotification(failure, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () =>
    run(
      () => downloadSnapshotImage(data),
      "Could not save the image.",
      "Image saved.",
    );

  const handleCopy = () =>
    run(async () => {
      await copySnapshotToClipboard(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }, "Could not copy the image in this browser.", "Image copied.");

  const handleShare = () =>
    run(() => shareSnapshot(data), "Sharing failed.");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share snapshot"
      variant="form"
      hideDefaultButtons
      size="lg"
    >
      <div className="space-y-4">
        <Panel data-testid="snapshot-scorecard" padding="none">
          {/* Header: the mark carries the colour, the word is foreground. */}
          <div
            className={cn(
              "flex items-center justify-between gap-3 border-b-2 p-4 sm:p-6",
              RULE_SECTION,
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary">
                <BrandMark className="h-5 w-5 fill-current text-background" />
              </span>
              <Heading level="panel" as="span">
                MacroTrackr
              </Heading>
            </div>

            <span
              data-testid="snapshot-badge"
              className={cn(
                TYPE_SCALE.micro,
                "rounded-full border border-border-2 bg-surface-2 px-3 py-1 text-primary",
              )}
            >
              {model.badge}
            </span>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            <div>
              <p className={cn(TYPE_SCALE.micro, "text-muted")}>{model.title}</p>
              <Heading level="panel" className="mt-0.5 text-lg">
                {model.dateLabel}
              </Heading>
            </div>

            {/* Calories */}
            <Panel raised padding="compact">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn(TYPE_SCALE.micro, "text-muted")}>Calories</p>
                <p className="text-xs text-muted">
                  Target {model.calorieTarget.toLocaleString()} kcal
                </p>
              </div>

              <div className="mt-1.5">
                <Value
                  size="hero"
                  unit="kcal"
                  value={model.calories}
                  suffix={`of ${model.calorieTarget.toLocaleString()}`}
                />
              </div>

              <ProgressBar
                progress={model.calorieBarPercent}
                color="accent"
                height="md"
                className="mt-3"
              />

              <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-foreground">
                  {model.caloriePercent}% of target
                </span>
                <span className="text-muted">{model.calorieRemainder}</span>
              </div>
            </Panel>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-2.5">
              {model.macros.map((row) => (
                <Panel key={row.key} raised padding="none" className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        MACRO_DOT[row.key],
                      )}
                    />
                    <span
                      className={cn(TYPE_SCALE.micro, MACRO_TEXT[row.key])}
                    >
                      {row.label}
                    </span>
                  </div>

                  <div className="mt-2">
                    <Value size="stat" unit="g" value={row.grams} />
                    {/* The real figure, not a figure clamped to look on target:
                        the preview used to print 100% where the export printed
                        113%. */}
                    <p className="mt-0.5 text-xs text-muted">
                      of {row.targetGrams} g · {row.percentOfTarget}%
                    </p>
                  </div>

                  <ProgressBar
                    progress={row.barPercent}
                    color={row.key}
                    height="sm"
                    className="mt-2.5"
                  />

                  <div className="mt-2 flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-foreground tabular-nums">
                      {row.calories.toLocaleString()} kcal
                    </span>
                    <span className="text-muted tabular-nums">
                      {row.energyShare}%
                    </span>
                  </div>
                </Panel>
              ))}
            </div>

            {/* Energy split */}
            <Panel raised padding="none" className="p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn(TYPE_SCALE.micro, "text-muted")}>
                  Energy split
                </p>
                <p className="text-xs text-muted">
                  {model.totalMacroCalories.toLocaleString()} kcal from macros
                </p>
              </div>

              <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                {model.macros.map((row) => (
                  <span
                    key={row.key}
                    className={MACRO_DOT[row.key]}
                    style={{ width: `${row.energyShare}%` }}
                  />
                ))}
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                {model.macros.map((row) => (
                  <span
                    key={row.key}
                    className="flex items-center gap-1.5 text-foreground"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        MACRO_DOT[row.key],
                      )}
                    />
                    {row.label} {row.energyShare}%
                  </span>
                ))}
              </div>
            </Panel>
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-3 border-t-2 bg-surface-2 px-4 py-3 text-xs sm:px-6",
              RULE_SECTION,
            )}
          >
            <span className="text-muted">Logged with MacroTrackr</span>
            <span className="font-semibold text-primary">macrotrackr.com</span>
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {canShare && (
            <Button
              variant="primary"
              onClick={handleShare}
              disabled={isExporting}
              isLoading={isExporting}
              leftIcon={<ShareIcon size="sm" />}
              ariaLabel="Share snapshot"
            >
              Share
            </Button>
          )}

          {canCopy && (
            <Button
              variant="secondary"
              onClick={handleCopy}
              disabled={isExporting}
              leftIcon={copied ? <CheckIcon size="sm" /> : <CopyIcon size="sm" />}
              ariaLabel="Copy image to clipboard"
            >
              {copied ? "Copied" : "Copy image"}
            </Button>
          )}

          <Button
            variant={canShare ? "secondary" : "primary"}
            onClick={handleDownload}
            disabled={isExporting}
            leftIcon={<ExportIcon size="sm" />}
            ariaLabel="Download image snapshot"
          >
            Save PNG
          </Button>

          <Button variant="ghost" onClick={onClose} ariaLabel="Done">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const MacroSnapshotModal = memo(MacroSnapshotModalInner);
export default MacroSnapshotModal;

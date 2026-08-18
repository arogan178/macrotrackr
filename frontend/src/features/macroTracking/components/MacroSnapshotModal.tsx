import { memo, useMemo, useState } from "react";

import BrandMark from "@/components/layout/BrandMark";
import Button from "@/components/ui/Button";
import {
  CheckIcon,
  CopyIcon,
  ExportIcon,
  ShareIcon,
  SparklesIcon,
} from "@/components/ui/Icons";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import Value from "@/components/ui/Value";
import {
  copySnapshotToClipboard,
  downloadSnapshotImage,
  MacroSnapshotData,
  shareSnapshot,
} from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { useStore } from "@/store/store";

export interface MacroSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MacroSnapshotData;
}

function MacroSnapshotModalInner({
  isOpen,
  onClose,
  data,
}: MacroSnapshotModalProps) {
  const { showNotification } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const cal = Math.round(data.calories);
  const targetCal = Math.round(data.calorieTarget) || 2000;
  const calPercent = Math.min(100, Math.round((cal / targetCal) * 100));

  const proteinG = Math.round(data.protein);
  const proteinTargetG = Math.round(data.proteinTarget) || 150;
  const proteinPercent = Math.min(
    100,
    Math.round((proteinG / proteinTargetG) * 100),
  );

  const carbsG = Math.round(data.carbs);
  const carbsTargetG = Math.round(data.carbsTarget) || 200;
  const carbsPercent = Math.min(100, Math.round((carbsG / carbsTargetG) * 100));

  const fatsG = Math.round(data.fats);
  const fatsTargetG = Math.round(data.fatsTarget) || 65;
  const fatsPercent = Math.min(100, Math.round((fatsG / fatsTargetG) * 100));

  const macroCalories = useMemo(() => {
    const pCals = proteinG * 4;
    const cCals = carbsG * 4;
    const fCals = fatsG * 9;
    const total = pCals + cCals + fCals;
    if (total === 0) {
      return { pCals: 0, cCals: 0, fCals: 0, pRatio: 30, cRatio: 45, fRatio: 25 };
    }
    const pRatio = Math.round((pCals / total) * 100);
    const cRatio = Math.round((cCals / total) * 100);
    const fRatio = Math.max(0, 100 - pRatio - cRatio);
    return { pCals, cCals, fCals, pRatio, cRatio, fRatio };
  }, [proteinG, carbsG, fatsG]);

  const badgeText = useMemo(() => {
    if (data.badgeLabel) return data.badgeLabel;
    if (data.streakDays && data.streakDays > 0) {
      return `🔥 ${data.streakDays}-Day Streak`;
    }
    if (data.complianceScore) {
      return `🎯 ${data.complianceScore}% Compliance`;
    }
    return `${calPercent}% of Goal`;
  }, [data.badgeLabel, data.streakDays, data.complianceScore, calPercent]);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const canCopy = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.write);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await downloadSnapshotImage(data);
      showNotification("Scorecard downloaded successfully!", "success");
    } catch {
      showNotification("Failed to download image scorecard.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      setIsExporting(true);
      await copySnapshotToClipboard(data);
      setCopied(true);
      showNotification("Scorecard copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showNotification("Could not copy image to clipboard in this browser.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsExporting(true);
      await shareSnapshot(data);
    } catch (error) {
      // User cancelling share is not an error
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      showNotification("Sharing failed or was cancelled.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Macro Snapshot"
      variant="form"
      hideDefaultButtons
      size="lg"
    >
      <div className="space-y-4">
        {/* Visual Scorecard Preview Card */}
        <div
          data-testid="snapshot-scorecard"
          className="relative overflow-hidden rounded-card border border-border bg-surface p-4 sm:p-5"
        >
          {/* Top Brand Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-background">
                <BrandMark className="h-5 w-5 fill-current text-background" />
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-foreground">
                  MacroTrackr
                </span>
                <span className="block text-[10px] font-bold tracking-wider text-primary uppercase">
                  Precision Nutrition
                </span>
              </div>
            </div>

            <div
              data-testid="snapshot-badge"
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-primary"
            >
              <span>{badgeText}</span>
            </div>
          </div>

          {/* Title & Date */}
          <div className="mt-3.5 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
                {data.title ?? "Daily Nutrition Scorecard"}
              </p>
              <h4 className="text-lg font-bold text-foreground">
                {data.dateLabel ?? "Today's Macro Summary"}
              </h4>
            </div>
          </div>

          {/* Calorie Hero Card */}
          <div className="mt-3.5 rounded-card border border-border bg-surface-2 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">
                Calories Consumed
              </span>
              <span className="text-xs font-medium text-muted">
                Target: {targetCal.toLocaleString()} kcal
              </span>
            </div>

            <div className="mt-1.5 flex items-baseline gap-2">
              <Value
                size="hero"
                unit="kcal"
                value={cal}
                suffix={`/ ${targetCal.toLocaleString()} goal`}
              />
            </div>

            <ProgressBar
              progress={calPercent}
              color="accent"
              height="md"
              className="mt-3"
            />

            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">
                ● {calPercent}% of Daily Target
              </span>
              <span className="text-muted">
                {targetCal - cal >= 0
                  ? `${(targetCal - cal).toLocaleString()} kcal remaining`
                  : `${Math.abs(targetCal - cal).toLocaleString()} kcal over target`}
              </span>
            </div>
          </div>

          {/* Macronutrient Breakdown: 3 Columns */}
          <div className="mt-3.5 grid grid-cols-3 gap-2.5">
            {/* Protein */}
            <div className="rounded-card border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-protein" />
                <span className="text-[11px] font-bold tracking-wider text-protein uppercase">
                  Protein
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {proteinG}
                </span>
                <span className="ml-0.5 text-xs font-semibold text-muted">g</span>
                <span className="block text-[11px] text-muted">
                  of {proteinTargetG}g ({proteinPercent}%)
                </span>
              </div>
              <ProgressBar
                progress={proteinPercent}
                color="protein"
                height="sm"
                className="mt-2.5"
              />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-bold text-foreground">{macroCalories.pCals} kcal</span>
                <span className="text-muted">{macroCalories.pRatio}%</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="rounded-card border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-carbs" />
                <span className="text-[11px] font-bold tracking-wider text-carbs uppercase">
                  Carbs
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {carbsG}
                </span>
                <span className="ml-0.5 text-xs font-semibold text-muted">g</span>
                <span className="block text-[11px] text-muted">
                  of {carbsTargetG}g ({carbsPercent}%)
                </span>
              </div>
              <ProgressBar
                progress={carbsPercent}
                color="carbs"
                height="sm"
                className="mt-2.5"
              />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-bold text-foreground">{macroCalories.cCals} kcal</span>
                <span className="text-muted">{macroCalories.cRatio}%</span>
              </div>
            </div>

            {/* Fats */}
            <div className="rounded-card border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-fats" />
                <span className="text-[11px] font-bold tracking-wider text-fats uppercase">
                  Fats
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {fatsG}
                </span>
                <span className="ml-0.5 text-xs font-semibold text-muted">g</span>
                <span className="block text-[11px] text-muted">
                  of {fatsTargetG}g ({fatsPercent}%)
                </span>
              </div>
              <ProgressBar
                progress={fatsPercent}
                color="fats"
                height="sm"
                className="mt-2.5"
              />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-bold text-foreground">{macroCalories.fCals} kcal</span>
                <span className="text-muted">{macroCalories.fRatio}%</span>
              </div>
            </div>
          </div>

          {/* Calorie Macro Distribution Strip */}
          <div className="mt-3.5 rounded-card border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-bold tracking-wider uppercase">
                Macronutrient Distribution
              </span>
              <span className="text-[11px] font-medium text-muted">
                {(macroCalories.pCals + macroCalories.cCals + macroCalories.fCals).toLocaleString()} macro kcal
              </span>
            </div>

            <div className="relative mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="absolute top-0 left-0 h-full bg-protein"
                style={{ width: `${macroCalories.pRatio}%` }}
              />
              <div
                className="absolute top-0 h-full bg-carbs"
                style={{
                  width: `${macroCalories.cRatio}%`,
                  left: `${macroCalories.pRatio}%`,
                }}
              />
              <div
                className="absolute top-0 h-full bg-fats"
                style={{
                  width: `${macroCalories.fRatio}%`,
                  left: `${macroCalories.pRatio + macroCalories.cRatio}%`,
                }}
              />
            </div>

            <div className="mt-2.5 flex items-center gap-4 text-xs font-semibold">
              <span className="text-protein">● Protein {macroCalories.pRatio}%</span>
              <span className="text-carbs">● Carbs {macroCalories.cRatio}%</span>
              <span className="text-fats">● Fats {macroCalories.fRatio}%</span>
            </div>
          </div>

          {/* Scorecard Footer */}
          <div className="mt-3.5 flex items-center justify-between rounded-card border border-border bg-surface-2 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <SparklesIcon size="sm" className="text-primary" />
              Verified MacroTrackr Log
            </span>
            <span className="font-semibold text-primary">macrotrackr.com</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {canShare && (
            <Button
              variant="primary"
              onClick={handleShare}
              disabled={isExporting}
              isLoading={isExporting}
              leftIcon={<ShareIcon size="sm" />}
              ariaLabel="Share Snapshot"
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
              ariaLabel="Copy Image to Clipboard"
            >
              {copied ? "Copied!" : "Copy Image"}
            </Button>
          )}

          <Button
            variant={canShare ? "secondary" : "primary"}
            onClick={handleDownload}
            disabled={isExporting}
            leftIcon={<ExportIcon size="sm" />}
            ariaLabel="Download Image Snapshot"
          >
            Download PNG
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            ariaLabel="Done"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const MacroSnapshotModal = memo(MacroSnapshotModalInner);
export default MacroSnapshotModal;

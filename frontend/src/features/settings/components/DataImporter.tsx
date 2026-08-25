import { useCallback, useRef, useState } from "react";
import {
  detectImportFormat,
  type ImportFormat,
  type ImportResult,
  isImportFormat,
  parseImportFile,
} from "@shared/importer";

import Dropdown from "@/components/form/Dropdown";
import {
  Button,
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
  UploadIcon,
  WarningIcon,
} from "@/components/ui";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import { useImportMacros } from "@/hooks/queries/useMacroQueries";
import { formatGrouped } from "@/lib/formatNumber";
import { useProductAnalytics } from "@/lib/productAnalytics";
import { useStore } from "@/store/store";

const FORMAT_OPTIONS = [
  { value: "auto", label: "Auto-Detect Format" },
  { value: "myfitnesspal", label: "MyFitnessPal (CSV)" },
  { value: "cronometer", label: "Cronometer (CSV)" },
  { value: "macrofactor", label: "MacroFactor (CSV / JSON)" },
  { value: "loseit", label: "Lose It! (CSV)" },
  { value: "macrotrackr", label: "MacroTrackr Native (JSON / CSV)" },
];

const PLATFORM_NAMES: Record<ImportFormat, string> = {
  auto: "Auto-Detect",
  myfitnesspal: "MyFitnessPal",
  cronometer: "Cronometer",
  macrofactor: "MacroFactor",
  loseit: "Lose It!",
  macrotrackr: "MacroTrackr",
  unknown: "Custom / Unknown",
};

export default function DataImporter() {
  const productAnalytics = useProductAnalytics();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>("auto");
  const [parsedData, setParsedData] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccessResult, setImportSuccessResult] = useState<{
    macros: number;
    weightLogs: number;
    dateRange: { start: string; end: string } | null;
  } | null>(null);

  const importMutation = useImportMacros();
  const { showNotification } = useStore();

  const handleFileProcess = useCallback(
    (file: File, content: string, formatOverride?: ImportFormat) => {
      try {
        setParseError(null);
        setImportSuccessResult(null);

        const formatToUse = formatOverride ?? selectedFormat;
        const result = parseImportFile(content, formatToUse, file.name);

        if (result.entries.length === 0 && result.weightLogs.length === 0) {
          setParseError(
            result.errors?.[0] ||
              "No valid meal or weight records could be extracted from this file.",
          );
          setParsedData(null);

          return;
        }

        setParsedData(result);
        productAnalytics.capture({
          event: "import_previewed",
          properties: {
            importSource: result.format,
            mealCount: result.entries.length,
            weightLogCount: result.weightLogs.length,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to parse file.";
        setParseError(message);
        setParsedData(null);
      }
    },
    [productAnalytics, selectedFormat],
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
        // Auto-detect format initially
        const detected = detectImportFormat(content, file.name);
        setSelectedFormat(detected);
        handleFileProcess(file, content, detected);
      };
      reader.onerror = () => {
        setParseError("Failed to read file.");
      };
      reader.readAsText(file);
    },
    [handleFileProcess],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const files = event.dataTransfer.files;
      if (files.length > 0 && files[0]) {
        handleFileSelected(files[0]);
      }
    },
    [handleFileSelected],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelected(files[0]);
    }
  };

  const handleFormatChange = (newFormat: string | number) => {
    const value = String(newFormat);
    const format = isImportFormat(value) ? value : "auto";
    setSelectedFormat(format);
    if (selectedFile && fileContent) {
      handleFileProcess(selectedFile, fileContent, format);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileContent("");
    setParsedData(null);
    setParseError(null);
    setImportSuccessResult(null);
    setSelectedFormat("auto");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData) return;

    try {
      const response = await importMutation.mutateAsync({
        source: parsedData.format,
        entries: parsedData.entries,
        weightLogs: parsedData.weightLogs,
      });

      setImportSuccessResult({
        macros: response.importedCount.macros,
        weightLogs: response.importedCount.weightLogs,
        dateRange: response.dateRange,
      });

      showNotification(response.message, "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import data.";
      showNotification(`Import failed: ${message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <Panel padding="none">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-1">
            <Heading level="panel">1-Click Data Importer</Heading>
            <p className="text-sm text-muted">
              Import historical meals and weights seamlessly from MyFitnessPal,
              Cronometer, MacroFactor, Lose It!, or native backups.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "MyFitnessPal",
              "Cronometer",
              "MacroFactor",
              "Lose It!",
              "MacroTrackr",
            ].map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-control border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4">
          {importSuccessResult ? (
            <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface-2 p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-primary">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <Heading level="panel" className="text-foreground">
                Import Successful!
              </Heading>
              <p className="mt-2 max-w-md text-sm text-muted">
                Successfully imported{" "}
                <span className="font-semibold text-foreground">
                  {importSuccessResult.macros}
                </span>{" "}
                meal entries
                {importSuccessResult.weightLogs > 0 && (
                  <>
                    {" "}
                    and{" "}
                    <span className="font-semibold text-foreground">
                      {importSuccessResult.weightLogs}
                    </span>{" "}
                    weight logs
                  </>
                )}
                {importSuccessResult.dateRange && (
                  <>
                    {" "}
                    spanning {importSuccessResult.dateRange.start} to{" "}
                    {importSuccessResult.dateRange.end}
                  </>
                )}
                . All daily totals and history charts have been updated.
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="primary"
                  buttonSize="md"
                  onClick={handleReset}
                  leftIcon={<UploadIcon className="h-4 w-4" />}
                  text="Import Another File"
                />
              </div>
            </div>
          ) : !parsedData ? (
            <div>
              <button
                type="button"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-surface-2"
                    : "border-border hover:border-border-2 hover:bg-surface-2"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
                  <UploadIcon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Click to browse or drag and drop your export file
                </span>
                <span className="mt-1 text-xs text-muted">
                  Supports CSV and JSON exports up to 25 MB
                </span>
              </button>

              {parseError && (
                <div className="mt-4 flex items-start gap-2 rounded-card border border-border bg-surface-2 p-3 text-xs text-error">
                  <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-card border border-border bg-surface-2 p-4 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {selectedFile?.name}
                    </span>
                    <span className="rounded-control bg-surface px-2 py-0.5 text-xs text-primary">
                      {PLATFORM_NAMES[parsedData.format] || parsedData.format}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {parsedData.summary.totalMeals} meals
                    {parsedData.summary.totalWeightLogs > 0
                      ? `, ${parsedData.summary.totalWeightLogs} weight records`
                      : ""}
                    {parsedData.summary.dateRange
                      ? ` • ${parsedData.summary.dateRange.start} to ${parsedData.summary.dateRange.end}`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-48">
                    <Dropdown
                      value={selectedFormat}
                      onChange={handleFormatChange}
                      options={FORMAT_OPTIONS}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    buttonSize="sm"
                    onClick={handleReset}
                    leftIcon={<CloseIcon className="h-4 w-4" />}
                    text="Clear"
                  />
                </div>
              </div>

              {/* Import Preview Metric Cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-card border border-border bg-surface-2 p-3">
                  <span className="text-xs text-muted">Total Meals</span>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {parsedData.summary.totalMeals}
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface-2 p-3">
                  <span className="text-xs text-muted">Days Tracked</span>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {parsedData.summary.macroSummary.uniqueDays}
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface-2 p-3">
                  <span className="text-xs text-muted">Avg Daily Calories</span>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {parsedData.summary.macroSummary.avgDailyCalories}{" "}
                    <span className="text-xs font-normal text-muted">kcal</span>
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface-2 p-3">
                  <span className="text-xs text-muted">
                    Daily Macros (P/C/F)
                  </span>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    <span className="text-protein">
                      {parsedData.summary.macroSummary.avgDailyProtein}p
                    </span>{" "}
                    /{" "}
                    <span className="text-carbs">
                      {parsedData.summary.macroSummary.avgDailyCarbs}c
                    </span>{" "}
                    /{" "}
                    <span className="text-fats">
                      {parsedData.summary.macroSummary.avgDailyFats}f
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Entries Table */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">
                    Preview (First {Math.min(5, parsedData.entries.length)}{" "}
                    entries)
                  </span>
                  <span className="text-xs text-muted">
                    Total calories:{" "}
                    {formatGrouped(
                      parsedData.summary.macroSummary.totalCalories,
                    )}{" "}
                    kcal
                  </span>
                </div>
                <div className="overflow-x-auto rounded-card border border-border bg-surface-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface text-muted">
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Meal</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2 text-right">Protein</th>
                        <th className="px-3 py-2 text-right">Carbs</th>
                        <th className="px-3 py-2 text-right">Fat</th>
                        <th className="px-3 py-2 text-right">Calories</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedData.entries.slice(0, 5).map((entry, index) => {
                        const calories = Math.round(
                          entry.protein * 4 + entry.carbs * 4 + entry.fats * 9,
                        );

                        return (
                          <tr key={index} className="hover:bg-surface">
                            <td className="px-3 py-2 text-muted">
                              {entry.entryDate}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-block rounded-control bg-surface px-1.5 py-0.5 text-xs capitalize text-foreground">
                                {entry.mealType}
                              </span>
                            </td>
                            <td className="max-w-[150px] truncate px-3 py-2 font-medium text-foreground">
                              {entry.mealName || "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-protein">
                              {entry.protein}g
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-carbs">
                              {entry.carbs}g
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-fats">
                              {entry.fats}g
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-foreground">
                              {calories}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                <Button
                  variant="ghost"
                  buttonSize="md"
                  onClick={handleReset}
                  text="Cancel"
                />
                <Button
                  variant="primary"
                  buttonSize="md"
                  onClick={handleExecuteImport}
                  isLoading={importMutation.isPending}
                  leftIcon={<UploadIcon className="h-4 w-4" />}
                  text={`Import ${parsedData.summary.totalMeals} Entries`}
                />
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Panel padding="regular">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-surface-2 p-2 text-muted">
            <InfoIcon className="h-5 w-5" />
          </div>
          <div>
            <Heading level="body" as="h4" className="font-medium">
              Exporting from another app
            </Heading>
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              <li>
                <strong className="text-foreground">MyFitnessPal:</strong> Go to
                Settings → Export Information → Export Data (generates CSV
                files).
              </li>
              <li>
                <strong className="text-foreground">Cronometer:</strong> Go to
                Settings → Account → Export Data → Export Servings / Daily
                Summary (CSV).
              </li>
              <li>
                <strong className="text-foreground">MacroFactor:</strong> Go to
                Settings → Data Management → Export Data (CSV or JSON).
              </li>
              <li>
                <strong className="text-foreground">Lose It!:</strong> Account
                Settings → Data Export → Export to Spreadsheet (CSV).
              </li>
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

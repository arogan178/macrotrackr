import { useState } from "react";

import { goalsApi } from "@/api/goals";
import { habitsApi } from "@/api/habits";
import { macrosApi } from "@/api/macros";
import { ProFeature } from "@/components/billing/ProFeature";
import { Button, ExportIcon } from "@/components/ui";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import {
  downloadCsv,
  downloadHistoryCsv,
} from "@/features/macroTracking/utils/historyExport";
import {
  buildHabitsCsv,
  buildWeightLogCsv,
} from "@/features/settings/utils/dataExport";
import { useMutationErrorHandler } from "@/hooks";
import { useStore } from "@/store/store";
import { todayISO } from "@/utils/dateUtilities";

type ExportKind = "history" | "weight" | "habits";

const EXPORTS: {
  kind: ExportKind;
  label: string;
  description: string;
  run: () => Promise<void>;
}[] = [
  {
    kind: "history",
    label: "Meal history",
    description: "Every logged entry with macros and ingredients.",
    run: async () => {
      const response = await macrosApi.getAllHistory();
      downloadHistoryCsv(response.entries);
    },
  },
  {
    kind: "weight",
    label: "Weight log",
    description: "Every weigh-in, in kilograms.",
    run: async () => {
      downloadCsv(buildWeightLogCsv(await goalsApi.getWeightLog()), "weight");
    },
  },
  {
    kind: "habits",
    label: "Habits",
    description: "Each habit with its target and current progress.",
    run: async () => {
      downloadCsv(buildHabitsCsv(await habitsApi.getHabits(todayISO())), "habits");
    },
  },
];

export default function DataExporter() {
  const [exporting, setExporting] = useState<ExportKind | undefined>();
  const { showNotification } = useStore();
  const { handleMutationError } = useMutationErrorHandler({
    onError: (message) => showNotification(message, "error"),
  });

  const handleExport = async (item: (typeof EXPORTS)[number]) => {
    setExporting(item.kind);
    try {
      await item.run();
    } catch (error) {
      handleMutationError(error, `exporting ${item.kind}`);
    } finally {
      setExporting(undefined);
    }
  };

  return (
    <Panel title="Export your data" description="Download your data as CSV.">
      <ul className="divide-y divide-border">
        {EXPORTS.map((item) => {
          const button = (
            <Button
              variant="secondary"
              buttonSize="sm"
              onClick={() => handleExport(item)}
              isLoading={exporting === item.kind}
              leftIcon={<ExportIcon className="h-4 w-4" />}
              text="Export CSV"
              ariaLabel={`Export ${item.label.toLowerCase()} as CSV`}
            />
          );

          return (
            <li
              key={item.kind}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <Heading level="body" as="h3" className="font-medium">
                  {item.label}
                </Heading>
                <p className="text-xs text-muted">{item.description}</p>
              </div>
              {/* Same gate as the Entry History export on Home. */}
              {item.kind === "history" ? (
                <ProFeature>{button}</ProFeature>
              ) : (
                button
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

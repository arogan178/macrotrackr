import type { ReactNode } from "react";
import type { ExpenditureResult } from "@shared/expenditure";

import { ChevronDownIcon } from "@/components/ui";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import Skeleton from "@/components/ui/Skeleton";
import Value from "@/components/ui/Value";
import { formatGrouped } from "@/lib/formatNumber";
import { fromKg, type UnitSystem, weightUnit } from "@/utils/unitConversion";
import { maintenanceLabel } from "@/utils/userConstants";

interface ExpenditureCardProps {
  expenditure: ExpenditureResult | undefined;
  tdee: number;
  tdeeIsOverride: boolean;
  unitSystem: UnitSystem;
  footer?: ReactNode;
}

const roundToTen = (value: number) => Math.round(value / 10) * 10;

const plural = (count: number, word: string) =>
  `${count} more ${word}${count === 1 ? "" : "s"}`;

function measuredWorking(
  result: Extract<ExpenditureResult, { status: "measured" }>,
  unitSystem: UnitSystem,
): string[] {
  const intake = roundToTen(result.avgIntake);
  const total = roundToTen(result.estimate);
  // Derived from the two shown figures so the sum on screen always adds up.
  const fromBody = total - intake;
  const change = `${formatGrouped(
    fromKg(Math.abs(result.trendEndKg - result.trendStartKg), unitSystem),
    1,
  )} ${weightUnit(unitSystem)}`;
  const span = `${result.spanDays} days`;

  const averaged = `You averaged ${formatGrouped(intake)} kcal on ${result.usableDays} fully logged days.`;
  if (fromBody > 0) {
    return [
      averaged,
      `Your trend fell ${change} in ${span}, about ${formatGrouped(fromBody)} kcal a day. ${formatGrouped(intake)} + ${formatGrouped(fromBody)} = ${formatGrouped(total)}.`,
    ];
  }
  if (fromBody < 0) {
    return [
      averaged,
      `Your trend rose ${change} in ${span}, about ${formatGrouped(-fromBody)} kcal a day stored. ${formatGrouped(intake)} - ${formatGrouped(-fromBody)} = ${formatGrouped(total)}.`,
    ];
  }

  return [averaged, `Your trend held steady over ${span}, so you burn about what you eat.`];
}

function missingSentence(
  needs: Extract<ExpenditureResult, { status: "insufficient" }>["needs"],
): string {
  const parts = [
    needs.loggedDays > 0 ? plural(needs.loggedDays, "fully logged day") : "",
    needs.weighIns > 0 ? plural(needs.weighIns, "weigh-in") : "",
  ].filter(Boolean);

  if (parts.length === 0) {
    return "Measured expenditure needs weigh-ins spread over at least 2 of the last 3 weeks.";
  }

  return `Measured expenditure needs ${parts.join(" and ")} in the last 3 weeks.`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <Heading level="small" as="p" className="text-muted">
        {label}
      </Heading>
      <Value value={value} unit="kcal" size="stat" />
    </div>
  );
}

export default function ExpenditureCard({
  expenditure,
  tdee,
  tdeeIsOverride,
  unitSystem,
  footer,
}: ExpenditureCardProps) {
  const hasTdee = Number.isFinite(tdee) && tdee > 0;
  const measured = expenditure?.status === "measured" ? expenditure : undefined;

  return (
    <Panel
      title="Maintenance calories"
      description="What you burn in a day, from your own log and weight trend."
      footer={footer}
      flatOnPhone
    >
      <div className="grid grid-cols-2 gap-4">
        {measured && (
          <Stat label="Measured expenditure" value={roundToTen(measured.estimate)} />
        )}
        {hasTdee && (
          <Stat
            label={maintenanceLabel(tdeeIsOverride)}
            value={tdeeIsOverride ? tdee : roundToTen(tdee)}
          />
        )}
      </div>

      {/* The working is detail: the figures above are the answer. */}
      <details className="group mt-4 text-sm text-muted">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-xs text-muted transition-colors hover:text-foreground">
          How this is worked out
          <ChevronDownIcon className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="space-y-1">
        {expenditure === undefined ? (
          <Skeleton lines={2} />
        ) : expenditure.status === "measured" ? (
          measuredWorking(expenditure, unitSystem).map((line) => <p key={line}>{line}</p>)
        ) : (
          <p>{missingSentence(expenditure.needs)}</p>
        )}
        <p className="text-xs">
          Days marked as partly logged are left out. Your targets do not change on their own.
        </p>
        </div>
      </details>
    </Panel>
  );
}

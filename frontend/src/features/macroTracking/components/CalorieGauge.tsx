import { FILL_IN } from "./TargetRow";

interface CalorieGaugeProps {
  protein: number;
  carbs: number;
  fats: number;
  target: number;
}

/**
 * The day as one bar: what has been eaten, split by where it came from, against
 * a notch at the target. Past the notch the bar turns orange, so "over" reads
 * without a word.
 */
export default function CalorieGauge({ protein, carbs, fats, target }: CalorieGaugeProps) {
  const total = protein + carbs + fats;
  const scale = Math.max(target, total) || 1;
  const share = (value: number) => `${(value / scale) * 100}%`;
  const notch = target > 0 ? (target / scale) * 100 : undefined;
  const isOver = notch !== undefined && total > target;

  return (
    <div className="relative mt-5 h-3" aria-hidden>
      <div className="absolute inset-0 overflow-hidden rounded-full bg-foreground/8">
        <div className={`flex h-full ${FILL_IN}`}>
          <div className="h-full bg-protein" style={{ width: share(protein) }} />
          <div className="h-full bg-carbs" style={{ width: share(carbs) }} />
          <div className="h-full bg-fats" style={{ width: share(fats) }} />
        </div>
        {isOver && (
          <div
            className="absolute inset-y-0 right-0 bg-warning"
            style={{ left: `${notch}%` }}
          />
        )}
      </div>
      {notch !== undefined && (
        <div
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${Math.min(notch, 99.5)}%` }}
        />
      )}
    </div>
  );
}

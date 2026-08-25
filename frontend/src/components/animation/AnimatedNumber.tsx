import { useCallback, useEffect, useRef } from "react";
import { animate } from "motion/react";

// The leaf module, not the `@/hooks` barrel: that barrel re-exports
// `useSubscriptionStatus`, which reaches `useAuthQueries` and `@/config/runtime`,
// and pulling it in here dragged auth into every screen that prints a number.
import { DURATIONS } from "@/components/utils/UiConstants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatGrouped } from "@/lib/formatNumber";

/**
 * A counting number, and the one animation the global reduced-motion reset in
 * `styles/global.css` cannot reach. That block zeroes CSS animation and
 * transition durations; this drives `textContent` from a JS timer, which is
 * neither. So it has to ask for itself — a figure ticking from zero is exactly
 * the motion someone setting that preference is trying to switch off.
 */
interface AnimatedNumberProps {
  value: number;
  toFixedValue?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  toFixedValue = 0,
  duration = DURATIONS.value,
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  // Grouped, via the same `toLocaleString` call `Value` uses. This used to be
  // `toFixed`, which meant one primitive printed a daily target two ways
  // depending on a single prop: `<Value value={2000} unit="kcal" />` gave
  // "2,000 kcal" and the same call with `animate` gave "2000 kcal".
  const safeFormat = useCallback(
    (inputValue: unknown) => {
      const numericValue =
        typeof inputValue === "number" && !Number.isNaN(inputValue)
          ? inputValue
          : 0;

      return `${prefix}${formatGrouped(numericValue, toFixedValue)}${suffix}`;
    },
    [prefix, suffix, toFixedValue],
  );

  const prefersReducedMotion = usePrefersReducedMotion();
  const nodeReference = useRef<HTMLSpanElement>(null);
  // Always store a valid number in the ref
  const previousValueReference = useRef<number>(
    typeof value === "number" && !Number.isNaN(value) ? value : 0,
  );

  useEffect(() => {
    const node = nodeReference.current;
    if (!node) return;

    const fromValue = previousValueReference.current;
    const toValue =
      typeof value === "number" && !Number.isNaN(value) ? value : 0;

    if (fromValue === toValue || duration === 0 || prefersReducedMotion) {
      node.textContent = safeFormat(toValue);
      previousValueReference.current = toValue;

      return;
    }

    const controls = animate(fromValue, toValue, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        node.textContent = safeFormat(latest);
      },
      onComplete: () => {
        node.textContent = safeFormat(toValue);
      },
    });

    previousValueReference.current = toValue;

    return () => controls.stop();
  }, [
    value,
    toFixedValue,
    duration,
    prefix,
    suffix,
    safeFormat,
    prefersReducedMotion,
  ]);

  return (
    <span ref={nodeReference} className={className}>
      {safeFormat(value)}
    </span>
  );
}

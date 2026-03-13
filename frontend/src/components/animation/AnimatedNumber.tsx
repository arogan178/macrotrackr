import { useCallback, useEffect, useRef } from "react";
import { animate } from "motion/react";

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
  duration = 0.6,
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  // Helper to safely format numbers
  const safeFormat = useCallback(
    (inputValue: unknown) => {
      const numericValue =
        typeof inputValue === "number" && !Number.isNaN(inputValue)
          ? inputValue
          : 0;
      return `${prefix}${numericValue.toFixed(toFixedValue)}${suffix}`;
    },
    [prefix, suffix, toFixedValue],
  );

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

    if (fromValue === toValue || duration === 0) {
      node.textContent = safeFormat(toValue);
      previousValueReference.current = toValue;
      return;
    }

    const controls = animate(fromValue, toValue, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (node) {
          node.textContent = safeFormat(latest);
        }
      },
      onComplete: () => {
        if (node) {
          node.textContent = safeFormat(toValue);
        }
      },
    });

    previousValueReference.current = toValue;
    return () => controls.stop();
  }, [value, toFixedValue, duration, prefix, suffix, safeFormat]);

  return (
    <span ref={nodeReference} className={className}>
      {safeFormat(value)}
    </span>
  );
}

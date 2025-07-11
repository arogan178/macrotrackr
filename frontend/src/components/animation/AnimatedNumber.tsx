import { animate } from "motion/react";
import { useEffect, useRef } from "react";

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
  const nodeReference = useRef<HTMLSpanElement>(undefined);
  const previousValueReference = useRef<number>(value);

  useEffect(() => {
    const node = nodeReference.current;
    if (!node) return;

    const fromValue = previousValueReference.current;
    const toValue = value;

    if (fromValue === toValue || duration === 0) {
      node.textContent = `${prefix}${toValue.toFixed(toFixedValue)}${suffix}`;
      previousValueReference.current = toValue;
      return;
    }

    const controls = animate(fromValue, toValue, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (node) {
          node.textContent = `${prefix}${latest.toFixed(
            toFixedValue,
          )}${suffix}`;
        }
      },
      onComplete: () => {
        if (node) {
          node.textContent = `${prefix}${toValue.toFixed(
            toFixedValue,
          )}${suffix}`;
        }
      },
    });

    previousValueReference.current = toValue;
    return () => controls.stop();
  }, [value, toFixedValue, duration, prefix, suffix]);

  return (
    <span ref={nodeReference} className={className}>
      {`${prefix}${value.toFixed(toFixedValue)}${suffix}`}
    </span>
  );
}

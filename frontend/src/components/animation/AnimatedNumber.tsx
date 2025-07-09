import { useEffect, useRef } from "react";
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
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const fromValue = prevValueRef.current;
    const toValue = value;

    if (fromValue === toValue || duration === 0) {
      node.textContent = `${prefix}${toValue.toFixed(toFixedValue)}${suffix}`;
      prevValueRef.current = toValue;
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

    prevValueRef.current = toValue;
    return () => controls.stop();
  }, [value, toFixedValue, duration, prefix, suffix]);

  return (
    <span ref={nodeRef} className={className}>
      {`${prefix}${value.toFixed(toFixedValue)}${suffix}`}
    </span>
  );
}

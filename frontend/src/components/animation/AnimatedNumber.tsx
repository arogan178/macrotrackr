// filepath: d:/Users/Andrea Bugeja/Documents/GitHub/app/macro_tracker/frontend/src/components/animation/AnimatedNumber.tsx
import React, { useEffect, useRef } from "react";
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
  duration = 0.4, // Adjusted default duration for a slightly quicker scroll
  className,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  // Initialize prevValueRef with the initial value to ensure the first animation (if any) is correct
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const fromValue = prevValueRef.current;
    const toValue = value;

    // If the value hasn't actually changed or duration is 0, set text directly
    // This also handles the initial render correctly if fromValue starts equal to toValue.
    if (fromValue === toValue || duration === 0) {
      node.textContent = `${prefix}${toValue.toFixed(toFixedValue)}${suffix}`;
      prevValueRef.current = toValue; // Keep prevValueRef updated
      return;
    }

    const controls = animate(fromValue, toValue, {
      duration,
      ease: "ease-out",
      onUpdate: (latest) => {
        if (node) {
          node.textContent = `${prefix}${latest.toFixed(
            toFixedValue
          )}${suffix}`;
        }
      },
      onComplete: () => {
        // Ensure the final value is accurately set
        if (node) {
          node.textContent = `${prefix}${toValue.toFixed(
            toFixedValue
          )}${suffix}`;
        }
      },
    });

    // Update prevValueRef to the new target value for the next animation
    prevValueRef.current = toValue;

    return () => {
      controls.stop();
    };
  }, [value, toFixedValue, duration, prefix, suffix]);

  // Render initial value for SSR/non-JS and first paint. useEffect handles animation.
  return (
    <span ref={nodeRef} className={className}>
      {`${prefix}${value.toFixed(toFixedValue)}${suffix}`}
    </span>
  );
}

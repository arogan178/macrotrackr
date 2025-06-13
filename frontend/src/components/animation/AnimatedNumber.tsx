// filepath: d:/Users/Andrea Bugeja/Documents/GitHub/app/macro_tracker/frontend/src/components/animation/AnimatedNumber.tsx
import React, { useEffect, useRef, useState } from "react";
import { animate, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  toFixedValue?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  flipChart?: boolean; // New prop to enable flip chart animation
}

interface DigitProps {
  digit: string;
  previousDigit: string;
  isAnimating: boolean;
  duration: number;
}

// Individual digit component with flip animation
function FlipDigit({
  digit,
  previousDigit,
  isAnimating,
  duration,
}: DigitProps) {
  return (
    <div className="relative inline-block overflow-hidden">
      <motion.div
        key={`${previousDigit}-${digit}`}
        initial={isAnimating ? { y: "-100%" } : { y: "0%" }}
        animate={{ y: "0%" }}
        transition={{
          duration: duration,
          ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth flip
        }}
        className="relative"
      >
        {/* Current digit */}
        <span className="block">{digit}</span>

        {/* Previous digit (exits upward) */}
        {isAnimating && previousDigit !== digit && (
          <motion.span
            initial={{ y: "0%" }}
            animate={{ y: "100%" }}
            transition={{
              duration: duration,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="absolute inset-0 block"
          >
            {previousDigit}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}

export default function AnimatedNumber({
  value,
  toFixedValue = 0,
  duration = 0.6,
  className = "",
  prefix = "",
  suffix = "",
  flipChart = false,
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [previousDisplayValue, setPreviousDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!flipChart) {
      // Use original smooth animation for non-flip-chart mode
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
              toFixedValue
            )}${suffix}`;
          }
        },
        onComplete: () => {
          if (node) {
            node.textContent = `${prefix}${toValue.toFixed(
              toFixedValue
            )}${suffix}`;
          }
        },
      });

      prevValueRef.current = toValue;
      return () => controls.stop();
    } else {
      // Flip chart animation logic
      if (prevValueRef.current !== value) {
        setPreviousDisplayValue(displayValue);
        setIsAnimating(true);
        setDisplayValue(value);

        // Reset animation state after duration
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, duration * 1000);

        prevValueRef.current = value;
        return () => clearTimeout(timer);
      }
    }
  }, [value, toFixedValue, duration, prefix, suffix, flipChart, displayValue]);

  if (!flipChart) {
    // Original smooth animation
    return (
      <span ref={nodeRef} className={className}>
        {`${prefix}${value.toFixed(toFixedValue)}${suffix}`}
      </span>
    );
  }

  // Flip chart animation
  const currentText = displayValue.toFixed(toFixedValue);
  const previousText = previousDisplayValue.toFixed(toFixedValue);

  // Pad both strings to the same length for consistent animation
  const maxLength = Math.max(currentText.length, previousText.length);
  const paddedCurrent = currentText.padStart(maxLength, " ");
  const paddedPrevious = previousText.padStart(maxLength, " ");

  return (
    <span className={`inline-flex ${className}`}>
      {prefix}
      {paddedCurrent.split("").map((digit, index) => (
        <FlipDigit
          key={index}
          digit={digit}
          previousDigit={paddedPrevious[index] || " "}
          isAnimating={isAnimating}
          duration={duration}
        />
      ))}
      {suffix}
    </span>
  );
}

// src/components/ui/RangeSlider.tsx
// Reusable range slider with consistent styling across the app

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  trackColorClass?: string; // Tailwind class for filled track color
  showFillTrack?: boolean;
}

export default function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = "",
  trackColorClass = "bg-surface-2",
  showFillTrack = false,
}: RangeSliderProps) {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsed = Number.parseFloat(event.target.value);
    const newValue = Number.isFinite(parsed) ? parsed : value;
    onChange(newValue);
  }

  return (
    <div className={`relative flex h-4 items-center ${className}`}>
      {/* Background Track */}
      <div className="absolute z-0 h-2 w-full rounded-lg bg-surface-2" />
      
      {/* Filled Track (optional) */}
      {showFillTrack && (
        <div
          className={`absolute z-0 h-2 rounded-lg ${trackColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      )}
      
      {/* Actual Slider Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={[
          "relative z-10 h-4 w-full appearance-none bg-transparent focus:outline-none",
          disabled ? "" : "cursor-pointer",
          // Thumb base [Firefox]
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-transparent [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:shadow-black/20",
          "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:bg-transparent",
          // Thumb base [WebKit]
          "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-runnable-track]:bg-transparent",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-transparent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:shadow-black/20",
          // Hover/focus only when interactive
          disabled
            ? ""
            : "hover:[&::-moz-range-thumb]:scale-105 focus:[&::-moz-range-thumb]:ring-2 focus:[&::-moz-range-thumb]:ring-offset-2 hover:[&::-webkit-slider-thumb]:scale-105 focus:[&::-webkit-slider-thumb]:ring-2 focus:[&::-webkit-slider-thumb]:ring-offset-2",
        ].join(" ")}
      />
    </div>
  );
}

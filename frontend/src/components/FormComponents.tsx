import React from "react";

/* Text Input Field Component */
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "password" | "date";
}

export function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text"
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                transition-all duration-200 shadow-sm"
        required={required}
      />
    </div>
  );
}

/* Number Input Field Component */
interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  unit?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  required = false,
  unit
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
              onChange(val ? Number(val) : undefined);
            }
          }}
          min={min}
          max={max}
          step={step}
          className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                  transition-all duration-200 shadow-sm pl-4 pr-4
                  [&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                  [-moz-appearance:textfield]"
          required={required}
        />
        {unit && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

/* Select Field Component */
interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-3.5 bg-gray-700/70 border-2 border-gray-600/70 rounded-lg text-gray-100 
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                transition-all duration-200 shadow-sm appearance-none
                bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* Info Card Component */
interface InfoCardProps {
  title: string;
  description?: string;
  color?: "green" | "blue" | "red" | "indigo" | "purple";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function InfoCard({ 
  title, 
  description, 
  color = "indigo",
  icon,
  children 
}: InfoCardProps) {
  const colorMap = {
    green: {
      bg: "from-green-900/30 to-gray-800/10",
      border: "border-green-500/20",
      text: "text-green-400",
      dot: "bg-green-500"
    },
    blue: {
      bg: "from-blue-900/30 to-gray-800/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      dot: "bg-blue-500"
    },
    red: {
      bg: "from-red-900/30 to-gray-800/10",
      border: "border-red-500/20",
      text: "text-red-400",
      dot: "bg-red-500"
    },
    indigo: {
      bg: "from-indigo-900/30 to-gray-800/10",
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      dot: "bg-indigo-500"
    },
    purple: {
      bg: "from-purple-900/30 to-gray-800/10",
      border: "border-purple-500/20",
      text: "text-purple-400",
      dot: "bg-purple-500"
    },
  };

  const { bg, border, text, dot } = colorMap[color];

  return (
    <div className={`bg-gradient-to-br ${bg} p-4 rounded-xl border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        {!icon && <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
        {icon && <div className={text}>{icon}</div>}
        <h4 className={`${text} font-medium`}>{title}</h4>
      </div>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {children}
    </div>
  );
}

/* Tab Button Component */
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`py-3 px-6 font-medium text-sm focus:outline-none ${
        active 
          ? "text-indigo-400 border-b-2 border-indigo-500" 
          : "text-gray-400 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

/* Card Container Component */
interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContainer({ children, className = "" }: CardContainerProps) {
  return (
    <div className={`bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
import React, { useState } from "react";
import { TextFieldProps } from "./types";
import { formStyles } from "./styles";
import { EyeIcon, EyeSlashIcon } from "../Icons";

export function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  error,
  helperText,
  placeholder = "",
  minLength,
  maxLength,
  textOnly = false,
  icon,
  onKeyDown,
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (textOnly && newValue !== "") {
      const textOnlyValue = newValue.replace(/[^a-zA-Z\s]/g, "");
      onChange(textOnlyValue);
    } else {
      onChange(newValue);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShow) => !prevShow);
  };

  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${type === "password" ? formStyles.input.withPassword : ""} ${
    icon ? formStyles.input.withIcon : ""
  }`;

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label}>{label}</label>
      <div className="relative">
        {icon && <div className={formStyles.iconContainer}>{icon}</div>}
        <input
          type={inputType}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          className={inputClasses}
          required={required}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none ${
              !value ? "opacity-0" : ""
            }`}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={!value}
          >
            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {maxLength && value && value.length === maxLength && !error && (
        <p className={formStyles.maxLength}>
          {`Maximum ${maxLength} characters reached`}
        </p>
      )}
      {helperText && !error && (
        <p className={formStyles.helper}>{helperText}</p>
      )}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

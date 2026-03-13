import { memo, useId, useState } from "react";

import { formStyles } from "@/components/form/Styles";
import type { TextFieldProps } from "@/components/form/Types";
import { EyeIcon, EyeSlashIcon, IconButton } from "@/components/ui";

import { cn } from "../../lib/classnameUtilities";

function TextField({
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
  onFocus,
  onBlur,
  id,
  ariaLabel,
  name,
  autoComplete,
}: TextFieldProps & { id?: string; ariaLabel?: string }) {
  const autoId = useId();
  const inputId = id || `textfield-${autoId}`;
  const describedByIds = [];
  if (error) describedByIds.push(`${inputId}-error`);
  if (helperText && !error) describedByIds.push(`${inputId}-helper`);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    if (textOnly && newValue !== "") {
      // Use regex replace compatible with broader TS lib targets
      const textOnlyValue = newValue.replaceAll(/[^\sA-Za-z]/g, "");
      onChange(textOnlyValue);
    } else {
      onChange(newValue);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((previousShow) => !previousShow);
  };

  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  const inputClasses = cn(
    formStyles.input.base,
    error ? formStyles.input.error : formStyles.input.normal,
    type === "password" && formStyles.input.withPassword,
    icon && formStyles.input.withIcon,
    "placeholder:text-muted"
  );

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        {icon && <div className={formStyles.iconContainer}>{icon}</div>}
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          className={inputClasses}
          required={required}
          name={name}
          autoComplete={autoComplete}
          aria-describedby={
            describedByIds.length > 0 ? describedByIds.join(" ") : undefined
          }
          aria-label={ariaLabel}
        />
        {type === "password" && value && (
          <IconButton
            variant="custom"
            onClick={togglePasswordVisibility}
            ariaLabel={showPassword ? "Hide password" : "Show password"}
            buttonSize="sm"
            icon={showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            className="absolute top-1/2 right-3 -translate-y-1/2 pr-2 text-foreground hover:text-foreground focus:outline-none"
          />
        )}
      </div>
      {maxLength && value?.length === maxLength && !error && (
        <p className={formStyles.maxLength}>
          {`Maximum ${maxLength} characters reached`}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className={formStyles.helper}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className={formStyles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export default memo(TextField);

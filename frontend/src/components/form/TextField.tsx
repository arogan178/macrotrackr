/**
 * TextField – Standardized, accessible input for text, email, or password fields.
 *
 * Handles error, helper text, icons, password visibility, and accessibility.
 *
 * Accessibility:
 * - Uses label, aria-describedby, and aria-label for screen readers.
 * - Error and helper text are properly linked.
 *
 * Props:
 * @prop {string} label - Field label
 * @prop {string} value - Input value
 * @prop {function} onChange - Change handler (string)
 * @prop {boolean} [required] - Mark as required
 * @prop {"text"|"email"|"password"} [type] - Input type
 * @prop {string} [error] - Error message
 * @prop {string} [helperText] - Helper text
 * @prop {string} [placeholder] - Placeholder text
 * @prop {number} [minLength] - Minimum length
 * @prop {number} [maxLength] - Maximum length
 * @prop {boolean} [textOnly] - Restrict to letters/spaces
 * @prop {React.ReactNode} [icon] - Optional icon (left)
 * @prop {function} [onKeyDown] - Keydown handler
 * @prop {string} [id] - Custom id
 * @prop {string} [ariaLabel] - Accessibility label
 *
 * @example
 * // Basic usage
 * <TextField label="Name" value={name} onChange={setName} />
 *
 * @example
 * // Password field with visibility toggle
 * <TextField label="Password" type="password" value={pw} onChange={setPw} />
 *
 * @example
 * // With icon and helper text
 * <TextField label="Email" value={email} onChange={setEmail} icon={<MailIcon />} helperText="We'll never share your email." />
 */
import { memo, useId, useState } from "react";

import { formStyles } from "@/components/form/Styles";
import type { TextFieldProps } from "@/components/form/Types";
import { EyeIcon, EyeSlashIcon, IconButton } from "@/components/ui";

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

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${type === "password" ? formStyles.input.withPassword : ""} ${
    icon ? formStyles.input.withIcon : ""
  } placeholder:text-muted`;

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
      {maxLength && value && value.length === maxLength && !error && (
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

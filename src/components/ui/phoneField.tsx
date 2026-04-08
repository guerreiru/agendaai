import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";
import PhoneInput, { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";

type PhoneFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | FieldError;
  value?: Value;
  onChange: (value: Value) => void;
};

export function PhoneField({
  value,
  onChange,
  label,
  error,
  id,
  className,
  ...props
}: PhoneFieldProps) {
  const baseClass = `w-full p-4 text-sm border focus:border-orange-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 ${
    error ? "border-red-400" : "border-gray-300"
  } ${className ?? ""}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700" htmlFor={id}>
          {label}
        </label>
      )}

      <PhoneInput
        international
        defaultCountry="BR"
        value={value}
        onChange={onChange}
        className={baseClass}
        id={id}
        {...props}
      />

      {error && (
        <p className="text-red-600 text-sm mt-1">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}

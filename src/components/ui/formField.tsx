import type React from "react";
import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";
import { IMaskInput } from "react-imask";

type FormFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value"> & {
  label?: string;
  error?: string | FieldError;
  mask?: string;
  ref?: React.Ref<HTMLInputElement>;
  value?: string;
};

export function FormField({
  label,
  error,
  className,
  mask,
  ref,
  onChange,
  ...inputProps
}: FormFieldProps) {
  const baseClass = `w-full p-4 text-sm border focus:border-orange-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 ${
    error ? "border-red-400" : "border-gray-300"
  } ${className ?? ""}`;

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium text-gray-700 mb-2"
          htmlFor={inputProps.id}
        >
          {label}
        </label>
      )}

      {mask ? (
        <IMaskInput
          className={baseClass}
          mask={mask}
          inputRef={ref}
          onAccept={(value) => {
            onChange?.({
              target: { value, name: inputProps.name ?? "" },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
          {...inputProps}
        />
      ) : (
        <input
          className={baseClass}
          ref={ref}
          onChange={onChange}
          {...inputProps}
        />
      )}

      {error && (
        <p className="text-red-600 text-sm mt-1">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}

import { type InputHTMLAttributes } from "react";
import { type FieldError } from "react-hook-form";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: FieldError;
};

export function FormField({
  label,
  error,
  className,
  ...inputProps
}: FormFieldProps) {
  return (
    <div>
      {label && (
        <label
          className="block text-sm font-medium text-gray-900 mb-2"
          htmlFor={inputProps.id}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 ${
          error ? "border-red-400" : "border-gray-300"
        } ${className ?? ""}`}
        {...inputProps}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
}

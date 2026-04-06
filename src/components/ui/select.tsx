import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

type SelectProps = InputHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: FieldError;
  options?: {
    value: string;
    label: string;
  }[];
};

export function Select({ label, error, options = [], ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label
          className="block text-sm font-medium text-gray-900 mb-2"
          htmlFor={props.id}
        >
          {label}
        </label>
      )}
      <select
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        id={props.id}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
}

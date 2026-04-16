import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { FormField } from "./formField";

type PhoneFieldProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"value" | "onChange" | "type"
> & {
	label?: string;
	error?: string | FieldError;
	defaultValue?: string;
	value?: string;
	onChange?: (value: string | undefined) => void;
};

export function PhoneField({
	label,
	error,
	disabled,
	placeholder = "Enter phone number",
	defaultValue,
	value,
	onChange,
	...props
}: PhoneFieldProps) {
	const handleChange = (val: string | undefined) => {
		onChange?.(val);
	};

	return (
		<div className="w-full space-y-2">
			{label && (
				<label
					className="block text-sm font-medium text-gray-700"
					htmlFor={props.id}
				>
					{label}
					{props.required && <span className="text-red-500 ml-1">*</span>}
				</label>
			)}
			<PhoneInput
				id={props.id}
				international
				countryCallingCodeEditable={false}
				defaultValue={defaultValue}
				value={value}
				onChange={handleChange}
				disabled={disabled}
				placeholder={placeholder}
				defaultCountry="BR"
				autoComplete="tel"
				inputComponent={(inputProps) => <FormField {...inputProps} />}
			/>
			{error && (
				<p className="text-red-600 text-sm">
					{typeof error === "string" ? error : error.message}
				</p>
			)}
		</div>
	);
}

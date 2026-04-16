import { type ButtonHTMLAttributes, forwardRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
	base: "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed",
	variants: {
		variant: {
			default: "font-semibold bg-lime-300 text-gray-800 hover:bg-lime-200",
			secondary: "font-semibold bg-gray-200 text-gray-900 hover:bg-gray-300",
			outline:
				"font-semibold border border-gray-300 text-gray-900 hover:bg-gray-100",
			ghost: "font-semibold text-gray-900 hover:bg-gray-100",
			destructive: "font-semibold bg-red-600 text-white hover:bg-red-700",
			success: "font-semibold bg-emerald-500 text-white hover:bg-emerald-400",
			warning: "font-semibold bg-orange-500 text-white hover:bg-orange-400",
		},
		size: {
			sm: "h-8 px-3 text-sm",
			md: "h-10 px-4 text-sm",
			lg: "h-12 px-6 text-base",
		},
		fullWidth: {
			true: "w-full",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "md",
	},
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, fullWidth, ...props }, ref) => {
		return (
			<button
				ref={ref}
				className={button({ variant, size, fullWidth, className })}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";

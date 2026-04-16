type AlertVariant = "error" | "success" | "warning" | "info";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

const RETRY_BUTTON_CLASSES: Record<AlertVariant, string> = {
  error: "border-red-300 text-red-700 hover:bg-red-100",
  success: "border-green-300 text-green-700 hover:bg-green-100",
  warning: "border-amber-300 text-amber-700 hover:bg-amber-100",
  info: "border-slate-300 text-slate-700 hover:bg-slate-100",
};

type AlertBannerProps = {
  variant?: AlertVariant;
  message: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function AlertBanner({
  variant = "error",
  message,
  action,
  className = "",
}: AlertBannerProps) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {message}
      {action && (
        <button
          type="button"
          className={`mt-3 block w-full rounded-lg border px-4 py-2 ${RETRY_BUTTON_CLASSES[variant]}`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

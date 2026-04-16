import { Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import type { AppointmentStatus } from "../../types/booking";
import { formatCurrency } from "../../utils/currency";
import { AppointmentStatusBadge } from "../ui/AppointmentStatusBadge";

type AppointmentRowFrameProps = {
	startTime: string;
	durationMinutes: number;
	price: number;
	status: AppointmentStatus;
	middleLeft: ReactNode;
	middleRight: ReactNode;
	actions?: ReactNode;
	statusContainerClassName?: string;
};

export function AppointmentRowFrame({
	actions,
	durationMinutes,
	middleLeft,
	middleRight,
	price,
	startTime,
	status,
	statusContainerClassName = "relative flex items-center gap-2 md:flex-col md:items-end",
}: AppointmentRowFrameProps) {
	return (
		<div className="grid gap-4 md:grid-cols-[120px_1.4fr_1.4fr_auto_1fr] md:items-center">
			<div>
				<div className="flex items-center gap-2 text-slate-800">
					<Clock3 className="size-4 text-orange-500" />
					<p className="text-2xl font-bold leading-none">{startTime}</p>
				</div>
				<p className="mt-1 text-xs text-slate-500">{durationMinutes} min</p>
			</div>

			{middleLeft}
			{middleRight}

			<div>
				<p className="text-[11px] uppercase tracking-wide text-slate-400">
					Valor
				</p>
				<p className="text-xl font-bold text-orange-600">
					{formatCurrency(price)}
				</p>
			</div>

			<div className={statusContainerClassName}>
				<AppointmentStatusBadge status={status} />
				{actions}
			</div>
		</div>
	);
}

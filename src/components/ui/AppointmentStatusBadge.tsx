import type { AppointmentStatus } from "../../types/booking";
import {
	getAppointmentStatusBadgeClass,
	getAppointmentStatusLabelSafe,
} from "../../utils/appointmentStatus";

type AppointmentStatusBadgeProps = {
	status: AppointmentStatus | string | null | undefined;
	className?: string;
};

export function AppointmentStatusBadge({
	status,
	className = "",
}: AppointmentStatusBadgeProps) {
	const badgeClass = getAppointmentStatusBadgeClass(
		status as AppointmentStatus,
	);
	const label = getAppointmentStatusLabelSafe(status);

	return (
		<div
			className={`flex items-center justify-center px-2.5 py-1 rounded-full ${badgeClass} ${className} w-fit text-xs`}
		>
			{label}
		</div>
	);
}

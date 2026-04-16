import type { Appointment, AppointmentStatus } from "../../../types/booking";
import type { UserRole } from "../../../types/user";

export type PeriodFilter = "ALL" | "TODAY" | "NEXT_7_DAYS" | "THIS_MONTH";
export type StatusFilter = "ALL" | AppointmentStatus;

export type AppointmentCardProps = {
	appointment: Appointment;
	currentUserRole?: UserRole | null;
	serviceName: string;
	onRefresh: () => void;
};

export type AppointmentStatusTransitionMap = Partial<
	Record<AppointmentStatus, string>
>;

export type AppointmentActionButtonVariant =
	| "default"
	| "secondary"
	| "outline"
	| "ghost"
	| "destructive"
	| "success"
	| "warning";

export type AppointmentTransitionVariantMap = Partial<
	Record<AppointmentStatus, AppointmentActionButtonVariant>
>;

export type TerminalAppointmentStatus = AppointmentStatus[];

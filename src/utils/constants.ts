import type { BadgeVariant } from "../types/badgeVariant";
import type { AppointmentStatus } from "../types/booking";
import { APPOINTMENT_STATUS_META } from "./appointmentStatus";

export const COMMON_TIMEZONES = [
	{ label: "São Paulo", value: "America/Sao_Paulo" },
	{ label: "Manaus", value: "America/Manaus" },
	{ label: "Recife", value: "America/Recife" },
	{ label: "Fortaleza", value: "America/Fortaleza" },
	{ label: "Cuiaba", value: "America/Cuiaba" },
	{ label: "Araguaina", value: "America/Araguaina" },
	{ label: "Buenos Aires", value: "America/Buenos_Aires" },
	{ label: "Bogota", value: "America/Bogota" },
	{ label: "Caracas", value: "America/Caracas" },
	{ label: "Guayaquil", value: "America/Guayaquil" },
	{ label: "Lima", value: "America/Lima" },
];

export const STATUS_LABEL: Record<AppointmentStatus, string> =
	Object.fromEntries(
		Object.entries(APPOINTMENT_STATUS_META).map(([status, meta]) => [
			status,
			meta.label,
		]),
	) as Record<AppointmentStatus, string>;

export const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> =
	Object.fromEntries(
		Object.entries(APPOINTMENT_STATUS_META).map(([status, meta]) => [
			status,
			meta.color,
		]),
	) as Record<AppointmentStatus, BadgeVariant>;

export const VARIANT_CLASS: Record<BadgeVariant, string> = {
	yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
	green: "bg-green-100 text-green-800 border-green-300",
	red: "bg-red-100 text-red-800 border-red-300",
	gray: "bg-gray-100 text-gray-700 border-gray-300",
};

export const ACTIVE_STATUSES: AppointmentStatus[] = [
	"PENDING_CLIENT_CONFIRMATION",
	"PENDING_PROFESSIONAL_CONFIRMATION",
	"CONFIRMED",
	"SCHEDULED",
];

export const HISTORY_STATUSES: AppointmentStatus[] = [
	"COMPLETED",
	"CANCELLED",
	"REJECTED",
	"NO_SHOW",
];

export const weekdays = [
	{ value: 1, label: "Segunda" },
	{ value: 2, label: "Terça" },
	{ value: 3, label: "Quarta" },
	{ value: 4, label: "Quinta" },
	{ value: 5, label: "Sexta" },
	{ value: 6, label: "Sábado" },
	{ value: 0, label: "Domingo" },
];

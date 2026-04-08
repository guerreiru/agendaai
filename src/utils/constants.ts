import type { BadgeVariant } from "../types/badgeVariant";
import type { AppointmentStatus } from "../types/booking";

export const COMMON_TIMEZONES = [
	{ label: "America/Sao_Paulo", value: "São Paulo" },
	{ label: "America/Manaus", value: "Manaus" },
	{ label: "America/Recife", value: "Recife" },
	{ label: "America/Fortaleza", value: "Fortaleza" },
	{ label: "America/Cuiaba", value: "Cuiaba" },
	{ label: "America/Araguaina", value: "Araguaina" },
	{ label: "America/Buenos_Aires", value: "Buenos Aires" },
	{ label: "America/Bogota", value: "Bogota" },
	{ label: "America/Caracas", value: "Caracas" },
	{ label: "America/Guayaquil", value: "Guayaquil" },
	{ label: "America/Lima", value: "Lima" },
];

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
	PENDING_CLIENT_CONFIRMATION: "Aguardando sua confirmação",
	PENDING_PROFESSIONAL_CONFIRMATION: "Aguardando confirmação do profissional",
	CONFIRMED: "Confirmado",
	SCHEDULED: "Agendado",
	CANCELLED: "Cancelado",
	COMPLETED: "Concluído",
	REJECTED: "Rejeitado",
	NO_SHOW: "Não compareceu",
};

export const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
	PENDING_CLIENT_CONFIRMATION: "yellow",
	PENDING_PROFESSIONAL_CONFIRMATION: "yellow",
	CONFIRMED: "green",
	SCHEDULED: "green",
	CANCELLED: "gray",
	COMPLETED: "gray",
	REJECTED: "red",
	NO_SHOW: "gray",
};

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

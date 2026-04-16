import type { BadgeVariant } from "../types/badgeVariant";
import type { AppointmentStatus } from "../types/booking";

export type AppointmentStatusMeta = {
	label: string;
	color: BadgeVariant;
	badgeClass: string;
	panelClass: string;
	message: string;
};

const UNKNOWN_STATUS_META: AppointmentStatusMeta = {
	label: "Em processamento",
	color: "gray",
	badgeClass: "font-medium bg-gray-100 text-gray-700 border border-gray-300",
	panelClass: "bg-gray-50 border-gray-200 text-gray-700",
	message: "Seu agendamento está em processamento.",
};

export const APPOINTMENT_STATUS_META: Record<
	AppointmentStatus,
	AppointmentStatusMeta
> = {
	PENDING_CLIENT_CONFIRMATION: {
		label: "Aguardando confirmação do cliente",
		color: "yellow",
		badgeClass: "font-medium bg-yellow-100 text-amber-800 border border-yellow-300",
		panelClass: "bg-yellow-50 border-yellow-200 text-yellow-700",
		message: "Agendamento criado. Você receberá uma confirmação em breve.",
	},
	PENDING_PROFESSIONAL_CONFIRMATION: {
		label: "Aguardando confirmação do profissional",
		color: "yellow",
		badgeClass: "font-medium bg-yellow-100 text-amber-800 border border-yellow-300",
		panelClass: "bg-yellow-50 border-yellow-200 text-yellow-700",
		message:
			"Agendamento criado com sucesso. Aguardando confirmação do profissional.",
	},
	CONFIRMED: {
		label: "Confirmado",
		color: "green",
		badgeClass: "font-medium bg-emerald-100 text-emerald-800 border border-emerald-300",
		panelClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
		message: "Seu agendamento foi confirmado automaticamente!",
	},
	SCHEDULED: {
		label: "Agendado",
		color: "green",
		badgeClass: "font-medium bg-emerald-100 text-emerald-800 border border-emerald-300",
		panelClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
		message: "Agendamento agendado com sucesso!",
	},
	CANCELLED: {
		label: "Cancelado",
		color: "gray",
		badgeClass: "font-medium bg-gray-100 text-gray-700 border border-gray-300",
		panelClass: "bg-gray-50 border-gray-200 text-gray-700",
		message: "Agendamento foi cancelado.",
	},
	COMPLETED: {
		label: "Concluído",
		color: "gray",
		badgeClass: "font-medium bg-gray-100 text-gray-700 border border-gray-300",
		panelClass: "bg-gray-50 border-gray-200 text-gray-700",
		message: "Agendamento foi concluído.",
	},
	REJECTED: {
		label: "Rejeitado",
		color: "red",
		badgeClass: "font-medium bg-red-100 text-red-800 border border-red-300",
		panelClass: "bg-red-50 border-red-200 text-red-700",
		message: "Agendamento foi rejeitado.",
	},
	NO_SHOW: {
		label: "Não compareceu",
		color: "gray",
		badgeClass: "font-medium bg-gray-100 text-gray-700 border border-gray-300",
		panelClass: "bg-gray-50 border-gray-200 text-gray-700",
		message: "Cliente não compareceu.",
	},
};

const APPOINTMENT_STATUS_VALUES = new Set<AppointmentStatus>([
	"PENDING_CLIENT_CONFIRMATION",
	"PENDING_PROFESSIONAL_CONFIRMATION",
	"CONFIRMED",
	"SCHEDULED",
	"CANCELLED",
	"COMPLETED",
	"REJECTED",
	"NO_SHOW",
]);

function isAppointmentStatus(value: string): value is AppointmentStatus {
	return APPOINTMENT_STATUS_VALUES.has(value as AppointmentStatus);
}

export function getAppointmentStatusMeta(
	status: AppointmentStatus,
): AppointmentStatusMeta {
	return APPOINTMENT_STATUS_META[status];
}

export function getAppointmentStatusMetaSafe(
	status?: string | null,
): AppointmentStatusMeta {
	if (!status || !isAppointmentStatus(status)) {
		return UNKNOWN_STATUS_META;
	}
	return APPOINTMENT_STATUS_META[status];
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
	return APPOINTMENT_STATUS_META[status].label;
}

export function getAppointmentStatusLabelSafe(status?: string | null): string {
	return getAppointmentStatusMetaSafe(status).label;
}

export function getAppointmentStatusBadgeClass(
	status: AppointmentStatus,
): string {
	return APPOINTMENT_STATUS_META[status].badgeClass;
}

export function getAppointmentStatusPanelClass(status: AppointmentStatus): string {
	return APPOINTMENT_STATUS_META[status].panelClass;
}

export function getAppointmentStatusMessage(status: AppointmentStatus): string {
	return APPOINTMENT_STATUS_META[status].message;
}

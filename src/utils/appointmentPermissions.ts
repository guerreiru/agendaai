import type { Appointment } from "../types/booking";
import type { UserRole } from "../types/user";

function isPendingApprovalForRole(
	role: UserRole | null | undefined,
	appointment: Appointment,
) {
	if (role === "ADMIN" || role === "SUPER_ADMIN") {
		return (
			appointment.status === "PENDING_CLIENT_CONFIRMATION" ||
			appointment.status === "PENDING_PROFESSIONAL_CONFIRMATION"
		);
	}

	if (role === "CLIENT") {
		return (
			appointment.status === "PENDING_CLIENT_CONFIRMATION" &&
			appointment.pendingApprovalFrom === "CLIENT"
		);
	}

	if (role === "PROFESSIONAL") {
		return (
			appointment.status === "PENDING_PROFESSIONAL_CONFIRMATION" &&
			appointment.pendingApprovalFrom === "PROFESSIONAL"
		);
	}

	return false;
}

export function canConfirmAppointment(
	role: UserRole | null | undefined,
	appointment: Appointment,
) {
	return isPendingApprovalForRole(role, appointment);
}

export function canRejectAppointment(
	role: UserRole | null | undefined,
	appointment: Appointment,
) {
	return isPendingApprovalForRole(role, appointment);
}

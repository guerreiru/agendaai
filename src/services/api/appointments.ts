import type { Appointment, AppointmentStatus } from "../../types/booking";
import { api } from "./client";

export async function listMyAppointments(
	startDate?: string,
	endDate?: string,
): Promise<Appointment[]> {
	const params = new URLSearchParams();
	if (startDate) params.append("startDate", startDate);
	if (endDate) params.append("endDate", endDate);
	const query = params.toString() ? `?${params.toString()}` : "";
	const response = await api.get<Appointment[]>(`/appointments${query}`);
	return Array.isArray(response.data) ? response.data : [];
}

export async function confirmAppointment(id: string): Promise<Appointment> {
	const response = await api.post<Appointment>(`/appointments/${id}/confirm`);
	return response.data;
}

export async function rejectAppointment(
	id: string,
	rejectionReason?: string,
): Promise<Appointment> {
	const response = await api.post<Appointment>(`/appointments/${id}/reject`, {
		rejectionReason: rejectionReason || undefined,
	});
	return response.data;
}

export async function cancelAppointment(
	id: string,
	cancelReason?: string,
): Promise<Appointment> {
	const response = await api.post<Appointment>(`/appointments/${id}/cancel`, {
		cancelReason: cancelReason || undefined,
	});
	return response.data;
}

export async function updateAppointmentStatus(
	id: string,
	status: AppointmentStatus,
): Promise<Appointment> {
	const response = await api.patch<Appointment>(`/appointments/${id}`, {
		status,
	});
	return response.data;
}

export async function getAppointmentById(id: string): Promise<Appointment> {
	const response = await api.get<Appointment>(`/appointments/${id}`);
	return response.data;
}

export async function listCompanyAppointments(): Promise<Appointment[]> {
	const response = await api.get<Appointment[]>("/appointments");
	return Array.isArray(response.data) ? response.data : [];
}

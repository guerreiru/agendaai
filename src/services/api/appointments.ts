import { api } from "./client";
import type { Appointment, AppointmentStatus } from "../../types/booking";

export async function listMyAppointments(): Promise<Appointment[]> {
  const response = await api.get<Appointment[]>("/appointments");
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

export async function cancelAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
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

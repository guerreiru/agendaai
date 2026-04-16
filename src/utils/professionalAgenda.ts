import type { Appointment, AppointmentStatus } from "../types/booking";
import {
	getAppointmentStatusBadgeClass,
	getAppointmentStatusLabel,
} from "./appointmentStatus";
import { appointmentDateTime, formatDateLong } from "./formatDate";

export function appointmentStart(appointment: Appointment): Date {
	return appointmentDateTime(appointment.date, appointment.startTime);
}

export function appointmentEnd(appointment: Appointment): Date {
	return appointmentDateTime(appointment.date, appointment.endTime);
}

export function durationMinutes(startTime: string, endTime: string): number {
	const [startHour, startMinute] = startTime.split(":").map(Number);
	const [endHour, endMinute] = endTime.split(":").map(Number);
	return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export function toAgendaStatusClasses(status: AppointmentStatus): string {
	return getAppointmentStatusBadgeClass(status);
}

export function toStatusLabel(status: AppointmentStatus): string {
	return getAppointmentStatusLabel(status);
}

export function formatAgendaDayLabel(date: string): string {
	return formatDateLong(date);
}

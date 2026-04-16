import type { Appointment } from "../types/booking";
import { appointmentDateTime } from "./formatDate";

/**
 * Groups a list of appointments by calendar day (yyyy-mm-dd),
 * sorted ascending by appointment date/time.
 * Returns an array of [dayKey, items] tuples.
 */
export function groupAppointmentsByDay(
  items: Appointment[],
): [string, Appointment[]][] {
  const sorted = [...items].sort(
    (a, b) =>
      appointmentDateTime(a.date, a.startTime).getTime() -
      appointmentDateTime(b.date, b.startTime).getTime(),
  );

  const groups = new Map<string, Appointment[]>();
  for (const appointment of sorted) {
    const dayKey = appointment.date.slice(0, 10);
    const dayGroup = groups.get(dayKey);
    if (dayGroup) {
      dayGroup.push(appointment);
    } else {
      groups.set(dayKey, [appointment]);
    }
  }

  return Array.from(groups.entries());
}

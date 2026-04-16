import type { DashboardAppointment } from "../../types/dashboard";
import { formatCurrency } from "../../utils/currency";
import { formatDateTimeRange } from "../../utils/formatDate";
import { AppointmentStatusBadge } from "../ui/AppointmentStatusBadge";
import { Button } from "../ui/button";

type NextAppointmentsListProps = {
  appointments: DashboardAppointment[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function NextAppointmentsList({
  appointments,
  isLoading = false,
  error = null,
  onRetry,
}: NextAppointmentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <div
            className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            key={key}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="text-sm">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} type="button">
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700">
        <p className="text-sm">Nenhum agendamento próximo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul>
        {appointments.map((appointment, index) => (
          <li
            className={`px-4 py-3 ${index !== appointments.length - 1 ? "border-b border-slate-100" : ""}`}
            key={appointment.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-800">
                  {appointment.client.name}
                </p>
                <p className="text-sm text-slate-500">
                  {appointment.service.name}
                </p>
                <p className="text-xs text-slate-500">
                  com{" "}
                  {appointment.professional.displayName ||
                    appointment.professional.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-500">
                  {formatDateTimeRange({
                    date: appointment.date,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {formatCurrency(appointment.price)}
                </p>
              </div>
            </div>
            <AppointmentStatusBadge
              status={appointment.status}
              className="mt-2"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

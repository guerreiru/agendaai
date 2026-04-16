import { Clock3 } from "lucide-react";
import { AppointmentStatusBadge } from "../../../components/ui/AppointmentStatusBadge";
import { Button } from "../../../components/ui/button";
import type { Appointment } from "../../../types/booking";
import { formatCurrency } from "../../../utils/currency";
import { durationMinutes } from "../../../utils/professionalAgenda";

type AgendaRowProps = Appointment & {
  isMutating: boolean;
  serviceName: string;
  onConfirm: () => Promise<void>;
  onReject: () => Promise<void>;
  onComplete: () => Promise<void>;
  onNoShow: () => Promise<void>;
};

export function AgendaRow({
  isMutating,
  onComplete,
  onConfirm,
  onNoShow,
  onReject,
  serviceName,
  ...appointment
}: AgendaRowProps) {
  const minutes = durationMinutes(appointment.startTime, appointment.endTime);
  const canConfirm =
    appointment.status === "PENDING_PROFESSIONAL_CONFIRMATION" &&
    appointment.pendingApprovalFrom === "PROFESSIONAL";
  const canComplete = appointment.status === "CONFIRMED";

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:grid-cols-[120px_1.4fr_1.4fr_auto_1fr] md:items-center">
      <div>
        <div className="flex items-center gap-2 text-slate-800">
          <Clock3 className="size-4 text-orange-500" />
          <p className="text-2xl font-bold leading-none">
            {appointment.startTime}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-500">{minutes} min</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Cliente
        </p>
        <p className="text-sm font-semibold text-slate-800">
          {appointment.client?.name ?? "Cliente"}
        </p>
        <p className="text-xs text-slate-500">
          {appointment.client?.email ?? ""}
        </p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Serviço
        </p>
        <p className="text-sm font-semibold text-slate-800">{serviceName}</p>
        <p className="text-xs text-slate-500">
          com {appointment.professional?.name ?? "Profissional"}
        </p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Valor
        </p>
        <p className="text-2xl font-bold text-orange-600">
          {formatCurrency(appointment.price)}
        </p>
      </div>

      <div className="relative flex items-center gap-2 md:flex-col md:items-end">
        <AppointmentStatusBadge status={appointment.status} />
        {canConfirm ? (
          <div className="flex items-center gap-2 md:flex-col md:items-end">
            <Button
              disabled={isMutating}
              onClick={() => void onConfirm()}
              type="button"
            >
              Confirmar
            </Button>
            <Button
              variant="destructive"
              disabled={isMutating}
              onClick={() => void onReject()}
              type="button"
            >
              Rejeitar
            </Button>
          </div>
        ) : canComplete ? (
          <div className="flex items-center gap-2 md:flex-col md:items-end">
            <Button
              variant="success"
              disabled={isMutating}
              onClick={() => void onComplete()}
              type="button"
            >
              Concluir
            </Button>
            <Button
              variant="warning"
              disabled={isMutating}
              onClick={() => void onNoShow()}
              type="button"
            >
              Não compareceu
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

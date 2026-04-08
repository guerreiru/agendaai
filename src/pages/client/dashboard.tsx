import { useCallback, useEffect, useState } from "react";
import {
  cancelAppointment,
  confirmAppointment,
  listMyAppointments,
  rejectAppointment,
} from "../../services/api/appointments";
import type { Appointment } from "../../types/booking";
import {
  ACTIVE_STATUSES,
  HISTORY_STATUSES,
  STATUS_LABEL,
  STATUS_VARIANT,
  VARIANT_CLASS,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/formatDate";
import { sanitizeUserInput } from "../../utils/sanitize";

interface AppointmentCardProps {
  appointment: Appointment;
  onAction: () => void;
}

function AppointmentCard({ appointment, onAction }: AppointmentCardProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const variant = STATUS_VARIANT[appointment.status];

  console.log(appointment);

  const canConfirmReject =
    appointment.status === "PENDING_CLIENT_CONFIRMATION" &&
    appointment.pendingApprovalFrom === "CLIENT";

  const canCancel =
    appointment.status !== "COMPLETED" && appointment.status !== "NO_SHOW";

  const isHistory = HISTORY_STATUSES.includes(appointment.status);

  async function handleConfirm() {
    setIsActing(true);
    setActionError(null);
    try {
      await confirmAppointment(appointment.id);
      onAction();
    } catch {
      setActionError("Erro ao confirmar. Tente novamente.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setIsActing(true);
    setActionError(null);
    try {
      await rejectAppointment(appointment.id, rejectReason || undefined);
      onAction();
    } catch {
      setActionError("Erro ao rejeitar. Tente novamente.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    if (!showCancelInput) {
      setShowCancelInput(true);
      return;
    }
    setIsActing(true);
    setActionError(null);
    try {
      await cancelAppointment(appointment.id, cancelReason || undefined);
      onAction();
    } catch {
      setActionError("Erro ao cancelar. Tente novamente.");
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div
      className={`rounded-lg border bg-white p-5 space-y-4 ${
        canConfirmReject ? "border-yellow-400 shadow-md" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          Profissional: {sanitizeUserInput(appointment.professional.name)}
        </p>
        <span
          className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-semibold ${VARIANT_CLASS[variant]}`}
        >
          {STATUS_LABEL[appointment.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <p className="text-gray-500">Data</p>
          <p className="font-medium text-gray-900">
            {formatDate(appointment.date)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Horário</p>
          <p className="font-medium text-gray-900">
            {appointment.startTime} — {appointment.endTime}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Valor</p>
          <p className="font-medium text-green-700">
            {formatCurrency(appointment.price)}
          </p>
        </div>
      </div>

      {appointment.status === "REJECTED" && appointment.rejectionReason && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Motivo: </span>
          {appointment.rejectionReason}
        </div>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {canConfirmReject && (
        <div className="space-y-2">
          {showRejectInput && (
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              placeholder="Motivo da rejeição (opcional)"
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isActing}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isActing ? "..." : "✓ Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={isActing}
              className="flex-1 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isActing
                ? "..."
                : showRejectInput
                  ? "Confirmar rejeição"
                  : "✕ Rejeitar"}
            </button>
          </div>
        </div>
      )}

      {!isHistory && !canConfirmReject && canCancel && (
        <div className="space-y-2">
          {showCancelInput && (
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              placeholder="Motivo do cancelamento (opcional)"
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={isActing}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {isActing
                ? "Cancelando..."
                : showCancelInput
                  ? "Confirmar cancelamento"
                  : "Cancelar agendamento"}
            </button>
            {showCancelInput && (
              <button
                type="button"
                onClick={() => {
                  setShowCancelInput(false);
                  setCancelReason("");
                }}
                disabled={isActing}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── dashboard ───────────────────────────────────────────────────────────────

export function ClientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listMyAppointments();
      setAppointments(data);
    } catch {
      setError("Não foi possível carregar seus agendamentos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const history = appointments.filter((a) =>
    HISTORY_STATUSES.includes(a.status),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Meus Agendamentos</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Próximos e pendentes
        </h2>
        {active.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            Nenhum agendamento ativo no momento.
          </p>
        ) : (
          active.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onAction={load} />
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Histórico
        </h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">Nenhum histórico ainda.</p>
        ) : (
          history.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onAction={load} />
          ))
        )}
      </section>
    </div>
  );
}

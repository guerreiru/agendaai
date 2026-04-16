import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listMyAppointments } from "../../services/api/appointments";
import type { Appointment } from "../../types/booking";
import { ACTIVE_STATUSES, HISTORY_STATUSES } from "../../utils/constants";
import { appointmentDateTime } from "../../utils/formatDate";
import { formatAgendaDayLabel } from "../../utils/professionalAgenda";
import { AppointmentCard } from "./components/AppointmentCard";

function groupAppointmentsByDay(items: Appointment[]) {
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
      continue;
    }

    groups.set(dayKey, [appointment]);
  }

  return Array.from(groups.entries());
}

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

  const activeByDay = useMemo(() => groupAppointmentsByDay(active), [active]);
  const historyByDay = useMemo(
    () => groupAppointmentsByDay(history),
    [history],
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
        {activeByDay.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            Nenhum agendamento ativo no momento.
          </p>
        ) : (
          activeByDay.map(([day, items]) => (
            <div key={day} className="space-y-3">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    {formatAgendaDayLabel(day)}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {items.length}{" "}
                    {items.length === 1 ? "agendamento" : "agendamentos"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onAction={load} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Histórico
        </h2>
        {historyByDay.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">Nenhum histórico ainda.</p>
        ) : (
          historyByDay.map(([day, items]) => (
            <div key={day} className="space-y-3">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {formatAgendaDayLabel(day)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {items.length}{" "}
                    {items.length === 1 ? "agendamento" : "agendamentos"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onAction={load} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

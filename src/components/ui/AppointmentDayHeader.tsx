import { CalendarDays } from "lucide-react";

type AppointmentDayHeaderProps = {
  dayLabel: string;
  count: number;
};

export function AppointmentDayHeader({
  dayLabel,
  count,
}: AppointmentDayHeaderProps) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white">
        <CalendarDays className="size-5" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{dayLabel}</h2>
        <p className="text-xs text-slate-500">
          {count} {count === 1 ? "agendamento" : "agendamentos"}
        </p>
      </div>
    </div>
  );
}

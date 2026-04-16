import { Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppointmentStatusBadge } from "../../../components/ui/AppointmentStatusBadge";
import { Button } from "../../../components/ui/button";
import { useApiError } from "../../../hooks/useApiError";
import {
	cancelAppointment,
	rejectAppointment,
	updateAppointmentStatus,
} from "../../../services/api/appointments";
import type { AppointmentStatus } from "../../../types/booking";
import { formatCurrency } from "../../../utils/currency";
import { sanitizeUserInput } from "../../../utils/sanitize";
import {
	getSafeTransitions,
	TERMINAL_STATUSES,
	TRANSITION_CLASS,
	TRANSITION_LABEL,
} from "../appointments/constants";
import type { AppointmentCardProps } from "../appointments/types";

export function AppointmentCard({
	appointment,
	serviceName,
	onRefresh,
}: AppointmentCardProps) {
	const handleApiError = useApiError();
	const [isActing, setIsActing] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);

	const isTerminal = TERMINAL_STATUSES.includes(appointment.status);
	const canCancel = !isTerminal;
	const transitions = getSafeTransitions(appointment.status);

	const durationInMinutes = useMemo(() => {
		const [startHour, startMinute] = appointment.startTime
			.split(":")
			.map(Number);
		const [endHour, endMinute] = appointment.endTime.split(":").map(Number);

		const startTotal = startHour * 60 + startMinute;
		const endTotal = endHour * 60 + endMinute;

		return Math.max(0, endTotal - startTotal);
	}, [appointment.endTime, appointment.startTime]);

	async function handleTransition(status: AppointmentStatus) {
		setIsActing(true);
		setActionError(null);
		try {
			if (status === "REJECTED") {
				const rejectionReason = window.prompt(
					"Informe o motivo da rejeição (opcional):",
				);

				await rejectAppointment(
					appointment.id,
					rejectionReason?.trim() || undefined,
				);
			} else {
				await updateAppointmentStatus(appointment.id, status);
			}
			onRefresh();
		} catch (e) {
			const result = handleApiError(e);
			if (!result) return;
			setActionError(result.message);
		} finally {
			setIsActing(false);
		}
	}

	async function handleCancel() {
		setIsActing(true);
		setActionError(null);
		try {
			await cancelAppointment(appointment.id);
			onRefresh();
		} catch (e) {
			const result = handleApiError(e);
			if (!result) return;
			setActionError(result.message);
		} finally {
			setIsActing(false);
			setShowCancelConfirm(false);
		}
	}

	const isPending = appointment.status.startsWith("PENDING");

	return (
		<div
			className={`grid gap-4 rounded-2xl border bg-white px-4 py-4 shadow-sm md:grid-cols-[120px_1.4fr_1.4fr_auto_1fr] md:items-center ${
				isPending ? "border-yellow-400 shadow-md" : "border-gray-200"
			}`}
		>
			<div>
				<div className="flex items-center gap-2 text-slate-800">
					<Clock3 className="size-4 text-orange-500" />
					<p className="text-2xl font-bold leading-none">
						{appointment.startTime}
					</p>
				</div>
				<p className="mt-1 text-xs text-slate-500">{durationInMinutes} min</p>
			</div>

			<div>
				<p className="text-[11px] uppercase tracking-wide text-slate-400">
					Cliente
				</p>
				<p className="text-sm font-semibold text-slate-800">
					{sanitizeUserInput(appointment.client?.name ?? "—")}
				</p>
				<p className="text-xs text-slate-500">
					{sanitizeUserInput(appointment.client?.email ?? "—")}
				</p>
			</div>

			<div>
				<p className="text-[11px] uppercase tracking-wide text-slate-400">
					Serviço
				</p>
				<p className="text-sm font-semibold text-slate-800">
					{sanitizeUserInput(serviceName)}
				</p>
				<p className="text-xs text-slate-500">
					com {sanitizeUserInput(appointment.professional?.name ?? "—")}
				</p>
			</div>

			<div>
				<p className="text-[11px] uppercase tracking-wide text-slate-400">
					Valor
				</p>
				<p className="text-xl font-bold text-orange-600">
					{formatCurrency(appointment.price)}
				</p>
			</div>

			<div className="relative flex items-center gap-2 md:flex-col md:items-end">
				<AppointmentStatusBadge
					status={appointment.status}
					className="shrink-0"
				/>
			</div>

			{(transitions.length > 0 || canCancel) && (
				<div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3 md:col-span-full">
					{transitions.map((t) => (
						<Button
							type="button"
							key={t}
							disabled={isActing}
							onClick={() => void handleTransition(t)}
							variant={TRANSITION_CLASS[t] ?? "default"}
						>
							{isActing ? "..." : (TRANSITION_LABEL[t] ?? t)}
						</Button>
					))}

					{canCancel &&
						(showCancelConfirm ? (
							<>
								<span className="text-sm text-gray-600">
									Confirmar cancelamento?
								</span>
								<Button
									type="button"
									disabled={isActing}
									onClick={() => void handleCancel()}
									variant="destructive"
								>
									{isActing ? "..." : "Sim, cancelar"}
								</Button>
								<Button
									type="button"
									disabled={isActing}
									onClick={() => setShowCancelConfirm(false)}
									variant="secondary"
								>
									Voltar
								</Button>
							</>
						) : (
							<Button
								type="button"
								disabled={isActing}
								onClick={() => setShowCancelConfirm(true)}
								variant="destructive"
							>
								Cancelar agendamento
							</Button>
						))}
				</div>
			)}

			{appointment.status === "REJECTED" && appointment.rejectionReason && (
				<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-full">
					<span className="font-semibold">Motivo: </span>
					{appointment.rejectionReason}
				</div>
			)}

			{actionError && (
				<p className="text-sm text-red-600 md:col-span-full">{actionError}</p>
			)}
		</div>
	);
}

import { useState } from "react";
import { AppointmentRowFrame } from "../../../components/appointments/AppointmentRowFrame";
import { Button } from "../../../components/ui/button";
import {
	cancelAppointment,
	confirmAppointment,
	rejectAppointment,
} from "../../../services/api/appointments";
import type { Appointment } from "../../../types/booking";
import {
	canConfirmAppointment,
	canRejectAppointment,
} from "../../../utils/appointmentPermissions";
import { HISTORY_STATUSES } from "../../../utils/constants";
import { formatDate } from "../../../utils/formatDate";
import { durationMinutes } from "../../../utils/professionalAgenda";
import { sanitizeUserInput } from "../../../utils/sanitize";

type AppointmentCardProps = {
	appointment: Appointment;
	onAction: () => void;
};

export function AppointmentCard({
	appointment,
	onAction,
}: AppointmentCardProps) {
	const minutes = durationMinutes(appointment.startTime, appointment.endTime);
	const [rejectReason, setRejectReason] = useState("");
	const [showRejectInput, setShowRejectInput] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [showCancelInput, setShowCancelInput] = useState(false);
	const [isActing, setIsActing] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const canConfirm = canConfirmAppointment("CLIENT", appointment);
	const canReject = canRejectAppointment("CLIENT", appointment);
	const canConfirmReject = canConfirm || canReject;

	const canCancel =
		appointment.status !== "COMPLETED" && appointment.status !== "NO_SHOW";

	const isHistory = HISTORY_STATUSES.includes(appointment.status);

	async function handleConfirm() {
		if (!canConfirm) {
			setActionError("Você não tem permissão para confirmar este agendamento.");
			return;
		}

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
		if (!canReject) {
			setActionError("Você não tem permissão para rejeitar este agendamento.");
			return;
		}

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
		<div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
			<AppointmentRowFrame
				actions={
					<>
						{canConfirmReject && (
							<div className="flex items-center gap-2 md:flex-col md:items-end">
								<Button
									disabled={isActing}
									onClick={() => void handleConfirm()}
									type="button"
								>
									{isActing ? "..." : "Confirmar"}
								</Button>
								<Button
									variant="destructive"
									disabled={isActing}
									onClick={() => void handleReject()}
									type="button"
								>
									{isActing
										? "..."
										: showRejectInput
											? "Confirmar rejeição"
											: "Rejeitar"}
								</Button>
							</div>
						)}

						{!isHistory && !canConfirmReject && canCancel && (
							<div className="flex items-center gap-2 md:flex-col md:items-end">
								<Button
									variant="outline"
									disabled={isActing}
									onClick={() => void handleCancel()}
									type="button"
								>
									{isActing
										? "Cancelando..."
										: showCancelInput
											? "Confirmar cancelamento"
											: "Cancelar"}
								</Button>
								{showCancelInput && (
									<Button
										variant="ghost"
										disabled={isActing}
										onClick={() => {
											setShowCancelInput(false);
											setCancelReason("");
										}}
										type="button"
									>
										Fechar
									</Button>
								)}
							</div>
						)}
					</>
				}
				durationMinutes={minutes}
				middleLeft={
					<div>
						<p className="text-[11px] uppercase tracking-wide text-slate-400">
							Profissional
						</p>
						<p className="text-sm font-semibold text-slate-800">
							{sanitizeUserInput(appointment.professional.name)}
						</p>
						<p className="text-xs text-slate-500">
							{appointment.professional.email}
						</p>
					</div>
				}
				middleRight={
					<div>
						<p className="text-[11px] uppercase tracking-wide text-slate-400">
							Agendamento
						</p>
						<p className="text-sm font-semibold text-slate-800">
							{formatDate(appointment.date)}
						</p>
						<p className="text-xs text-slate-500">
							{appointment.startTime} - {appointment.endTime}
						</p>
					</div>
				}
				price={appointment.price}
				startTime={appointment.startTime}
				status={appointment.status}
				statusContainerClassName="relative flex gap-2 flex-col md:flex-row lg:flex-col items-start md:items-center lg:items-end"
			/>

			{appointment.status === "REJECTED" && appointment.rejectionReason && (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					<span className="font-semibold">Motivo: </span>
					{appointment.rejectionReason}
				</div>
			)}

			{actionError && <p className="text-sm text-red-600">{actionError}</p>}

			{canConfirmReject && showRejectInput && (
				<textarea
					className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
					placeholder="Motivo da rejeição (opcional)"
					rows={2}
					value={rejectReason}
					onChange={(e) => setRejectReason(e.target.value)}
				/>
			)}

			{!isHistory && !canConfirmReject && canCancel && showCancelInput && (
				<textarea
					className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
					placeholder="Motivo do cancelamento (opcional)"
					rows={2}
					value={cancelReason}
					onChange={(e) => setCancelReason(e.target.value)}
				/>
			)}
		</div>
	);
}

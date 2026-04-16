import { AppointmentRowFrame } from "../../../components/appointments/AppointmentRowFrame";
import { Button } from "../../../components/ui/button";
import type { Appointment } from "../../../types/booking";
import {
	canConfirmAppointment,
	canRejectAppointment,
} from "../../../utils/appointmentPermissions";
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
	const canConfirm = canConfirmAppointment("PROFESSIONAL", appointment);
	const canReject = canRejectAppointment("PROFESSIONAL", appointment);
	const canConfirmReject = canConfirm || canReject;
	const canComplete = appointment.status === "CONFIRMED";

	return (
		<AppointmentRowFrame
			actions={
				canConfirmReject ? (
					<div className="flex items-center gap-2 md:flex-col md:items-end">
						{canConfirm && (
							<Button
								disabled={isMutating}
								onClick={() => void onConfirm()}
								type="button"
							>
								Confirmar
							</Button>
						)}
						{canReject && (
							<Button
								variant="destructive"
								disabled={isMutating}
								onClick={() => void onReject()}
								type="button"
							>
								Rejeitar
							</Button>
						)}
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
				) : null
			}
			durationMinutes={minutes}
			middleLeft={
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
			}
			middleRight={
				<div>
					<p className="text-[11px] uppercase tracking-wide text-slate-400">
						Serviço
					</p>
					<p className="text-sm font-semibold text-slate-800">{serviceName}</p>
					<p className="text-xs text-slate-500">
						com {appointment.professional?.name ?? "Profissional"}
					</p>
				</div>
			}
			price={appointment.price}
			startTime={appointment.startTime}
			status={appointment.status}
		/>
	);
}

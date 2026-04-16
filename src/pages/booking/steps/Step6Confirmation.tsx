import { Link } from "react-router-dom";
import type {
  Appointment,
  BookingProfessional,
  BookingService,
} from "../../../types/booking";
import {
  getAppointmentStatusLabel,
  getAppointmentStatusMessage,
  getAppointmentStatusMeta,
  getAppointmentStatusPanelClass,
} from "../../../utils/appointmentStatus";
import { formatDateLong } from "../../../utils/formatDate";

type Step6Props = {
  selectedService: BookingService;
  selectedProfessional: BookingProfessional;
  selectedDate: string;
  selectedTime: { startTime: string; endTime: string };
  selectedPrice: number;
  userName: string;
  isLoading: boolean;
  error: string | null;
  appointment: Appointment | null;
  onConfirm: () => void;
  onBack: () => void;
};

export function Step6Confirmation({
  selectedService,
  selectedProfessional,
  selectedDate,
  selectedTime,
  selectedPrice,
  userName,
  isLoading,
  error,
  appointment,
  onConfirm,
  onBack,
}: Step6Props) {
  const statusMeta = appointment
    ? getAppointmentStatusMeta(appointment.status)
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirmando seu agendamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-semibold mb-2">Erro na confirmação</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>

        <div className="flex justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (appointment) {
    return (
      <div className="space-y-8">
        {/* Success Message */}
        <div
          className={`border-2 rounded-lg p-6 text-center ${getAppointmentStatusPanelClass(appointment.status)}`}
        >
          <div className="text-4xl mb-3">
            {statusMeta?.color === "green"
              ? "✓"
              : statusMeta?.color === "yellow"
                ? "⏳"
                : "!"}
          </div>
          <p className="font-semibold mb-2">
            {getAppointmentStatusMessage(appointment.status)}
          </p>
          <p className="text-sm opacity-75">
            Número de agendamento:{" "}
            <span className="font-mono">{appointment.id}</span>
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Detalhes do Agendamento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Serviço</p>
              <p className="font-semibold text-gray-900">
                {selectedService.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Profissional</p>
              <p className="font-semibold text-gray-900">
                {selectedProfessional.displayName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Data</p>
              <p className="font-semibold text-gray-900">
                {formatDateLong(selectedDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Horário</p>
              <p className="font-semibold text-gray-900">
                {selectedTime.startTime} - {selectedTime.endTime}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Duração</p>
              <p className="font-semibold text-gray-900">
                {selectedService.duration} minutos
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Valor</p>
              <p className="font-semibold text-green-600">
                R$ {selectedPrice.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-semibold text-gray-900">{userName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">
                {getAppointmentStatusLabel(appointment.status)}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Próximas etapas</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {appointment.status === "PENDING_PROFESSIONAL_CONFIRMATION" && (
              <>
                <li>✓ Seu agendamento foi enviado para o profissional</li>
                <li>{getAppointmentStatusLabel(appointment.status)}</li>
              </>
            )}
            {appointment.status === "CONFIRMED" && (
              <>
                <li>✓ Agendamento confirmado automaticamente</li>
                <li>📧 Você receberá um email de confirmação em breve</li>
                <li>🔔 Lembrete será enviado 24 horas antes</li>
              </>
            )}
            {appointment.status === "CANCELLED" && (
              <>
                <li>❌ Este agendamento foi cancelado</li>
                <li>📞 Entre em contato conosco para mais detalhes</li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            to="/client/dashboard"
            className="px-6 py-3 rounded-lg font-semibold text-center bg-blue-600 text-white hover:bg-blue-700 transition-all"
          >
            Voltar para Home
          </Link>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  // Review before confirmation
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Confirme seus dados
        </h2>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Serviço</p>
              <p className="font-semibold text-gray-900">
                {selectedService.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Profissional</p>
              <p className="font-semibold text-gray-900">
                {selectedProfessional.displayName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Data</p>
              <p className="font-semibold text-gray-900">
                {formatDateLong(selectedDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Horário</p>
              <p className="font-semibold text-gray-900">
                {selectedTime.startTime} - {selectedTime.endTime}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Duração</p>
              <p className="font-semibold text-gray-900">
                {selectedService.duration} minutos
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Valor</p>
              <p className="font-semibold text-green-600">
                R$ {selectedPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-semibold text-gray-900">{userName}</p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-6 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700"
        >
          Confirmar Agendamento
        </button>
      </div>
    </div>
  );
}

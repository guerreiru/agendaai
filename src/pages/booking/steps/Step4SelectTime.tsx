import type {
  TimeSlot,
  BookingService,
  BookingProfessional,
} from "../../../types/booking";

interface Step4Props {
  selectedService: BookingService;
  selectedProfessional: BookingProfessional;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading: boolean;
  error: string | null;
  slots: TimeSlot[];
  onBack: () => void;
  onNext: () => void;
}

export function Step4SelectTime({
  selectedService,
  selectedProfessional,
  selectedDate,
  selectedSlot,
  onSelectSlot,
  isLoading,
  error,
  slots,
  onBack,
  onNext,
}: Step4Props) {
  const formatDateForDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando horários disponíveis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
        <div className="flex justify-between gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <div>
          <p className="text-sm text-gray-600">Serviço:</p>
          <p className="font-semibold text-gray-900">{selectedService.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Profissional:</p>
          <p className="font-semibold text-gray-900">
            {selectedProfessional.displayName}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Data:</p>
          <p className="font-semibold text-gray-900">
            {formatDateForDisplay(selectedDate)}
          </p>
        </div>
      </div>

      {/* Select Time */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Escolha um Horário
        </h2>

        {slots.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-700 font-semibold mb-4">
              Nenhum horário disponível nesta data.
            </p>
            <p className="text-yellow-600 text-sm">
              Tente outra data ou profissional.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <button
                key={`${slot.startTime}-${slot.endTime}`}
                onClick={() => onSelectSlot(slot)}
                className={`p-4 rounded-lg border-2 font-semibold transition-all text-center ${
                  selectedSlot?.startTime === slot.startTime &&
                  selectedSlot?.endTime === slot.endTime
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-900 hover:border-blue-400"
                }`}
              >
                <span>{slot.startTime}</span>
                <span className="text-xs opacity-75 block">
                  {slot.startTime} - {slot.endTime}
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600">Horário selecionado:</p>
            <p className="font-semibold text-gray-900">
              {selectedSlot.startTime} - {selectedSlot.endTime}
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!selectedSlot || slots.length === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            !selectedSlot || slots.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Próximo
        </button>
      </div>
    </div>
  );
}

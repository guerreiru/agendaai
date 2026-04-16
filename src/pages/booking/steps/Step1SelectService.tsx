import { Link } from "react-router-dom";
import type { BookingService, CompanyPublicData } from "../../../types/booking";
import { sanitizeUserInput } from "../../../utils/sanitize";

type Step1Props = {
  company: CompanyPublicData | null;
  isLoading: boolean;
  error: string | null;
  selectedService: BookingService | null;
  onSelectService: (service: BookingService) => void;
  onNext: () => void;
};

export function Step1SelectService({
  company,
  isLoading,
  error,
  selectedService,
  onSelectService,
  onNext,
}: Step1Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Empresa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {sanitizeUserInput(company.name)}
        </h1>
        <p className="text-gray-600">
          Bem-vindo! Selecione um serviço para continuar com seu agendamento.
        </p>
      </div>

      {/* Select Service */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Nossos serviços
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.services.map((service) => (
            <button
              type="button"
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedService?.id === service.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {sanitizeUserInput(service.name)}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {sanitizeUserInput(service.description)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    ⏱️ {service.duration} minutos
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <Link
          to="/client/booking"
          className="px-6 py-3 rounded-lg font-semibold bg-lime-300 text-slate-900 hover:bg-lime-200"
        >
          Voltar
        </Link>
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedService}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            !selectedService
              ? "bg-gray-300 text-slate-900 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Próximo
        </button>
      </div>
    </div>
  );
}

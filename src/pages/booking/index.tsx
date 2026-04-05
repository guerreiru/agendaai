import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { logError, logDebug } from "../../utils/logger";
import { useAuth } from "../../hooks/useAuth";
import { sanitizeUserInput } from "../../utils/sanitize";
import {
  createAppointment,
  getAvailableSlots,
  getCompanyBySlug,
  getProfessionalServicesForService,
} from "../../services/api/booking";
import type {
  Appointment,
  BookingProfessional,
  BookingService,
  BookingWizardState,
  ProfessionalServiceLink,
  TimeSlot,
} from "../../types/booking";
import { Step1SelectService } from "./steps/Step1SelectService";
import { Step2SelectProfessional } from "./steps/Step2SelectProfessional";
import { Step5Authentication } from "./steps/Step5Authentication";
import { Step6Confirmation } from "./steps/Step6Confirmation";

// Step 3 + 4 unified: Date and Time selection
interface Step3And4Props {
  selectedService: BookingService;
  selectedProfessional: BookingProfessional;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  availableSlots: TimeSlot[];
  isLoadingSlots: boolean;
  slotsError: string | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
  onBack: () => void;
  onNext: () => void;
}

function Step3And4DateAndTime({
  selectedService,
  selectedProfessional,
  selectedDate,
  selectedSlot,
  availableSlots,
  isLoadingSlots,
  slotsError,
  onSelectDate,
  onSelectSlot,
  onBack,
  onNext,
}: Step3And4Props) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateForAPI = (day: number): string => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return date.toISOString().split("T")[0];
  };

  const formatDateForDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const days = Array.from({ length: getDaysInMonth(month) }, (_, i) => i + 1);
  const emptyDays = Array.from(
    { length: getFirstDayOfMonth(month) },
    (_, i) => i,
  );

  const monthName = month.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const previousMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

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
      </div>

      {/* Calendar */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Escolha uma Data
        </h2>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded"
              aria-label="Mês anterior"
            >
              ←
            </button>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {monthName}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded"
              aria-label="Próximo mês"
            >
              →
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = formatDateForAPI(day);
              const isDisabled = isDateDisabled(day);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => !isDisabled && onSelectDate(dateStr)}
                  disabled={isDisabled}
                  className={`p-3 rounded-lg font-semibold transition-all text-center ${
                    isDisabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-blue-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600">Data selecionada:</p>
            <p className="font-semibold text-gray-900">
              {formatDateForDisplay(selectedDate)}
            </p>
          </div>
        )}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Horários Disponíveis
          </h3>

          {isLoadingSlots && (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Carregando horários...</p>
              </div>
            </div>
          )}

          {!isLoadingSlots && slotsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-700 font-semibold">{slotsError}</p>
            </div>
          )}

          {!isLoadingSlots && !slotsError && availableSlots.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {availableSlots.map((slot) => (
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

              {selectedSlot && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600">Horário selecionado:</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between gap-4 pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedSlot || isLoadingSlots}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            !selectedDate || !selectedSlot || isLoadingSlots
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

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser, accessToken, isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<BookingWizardState>({
    company: null,
    selectedService: null,
    selectedServicePrice: null,
    selectedProfessional: null,
    selectedDate: null,
    selectedSlot: null,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [professionalServices, setProfessionalServices] = useState<
    ProfessionalServiceLink[]
  >([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  // Load company data on mount
  useEffect(() => {
    if (!slug) {
      setError("Empresa não encontrada");
      return;
    }

    const loadCompany = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const company = await getCompanyBySlug(slug);
        setState((prev) => ({ ...prev, company }));
      } catch (err) {
        setError(
          "Não foi possível carregar os dados da empresa. Tente novamente.",
        );
        logError("Error loading company", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, [slug]);

  // Initialize user from auth if authenticated
  useEffect(() => {
    if (isAuthenticated && authUser) {
      setState((prev) => ({
        ...prev,
        user: {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          accessToken: accessToken ?? "",
        },
      }));
    }
  }, [isAuthenticated, authUser, accessToken]);

  // Load professional services when service is selected
  useEffect(() => {
    if (!state.company || !state.selectedService) {
      return;
    }

    const loadServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const services = await getProfessionalServicesForService(
          state.company!.id,
          state.selectedService!.id,
        );
        setProfessionalServices(services);
      } catch (err) {
        if ((err as AxiosError).response?.status === 404) {
          setError("Profissionais não encontrados");
        } else {
          setError("Erro ao carregar profissionais disponíveis");
        }
        logError("Error loading professional services", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [state.company, state.selectedService]);

  // Load available slots when date is selected
  useEffect(() => {
    if (
      !state.selectedProfessional ||
      !state.selectedService ||
      !state.selectedDate
    ) {
      return;
    }

    const loadSlots = async () => {
      setIsLoading(true);
      setError(null);
      setAvailableSlots([]);

      try {
        const slots = await getAvailableSlots(
          state.selectedProfessional!.id,
          state.selectedService!.id,
          state.selectedDate!,
        );

        if (slots.length === 0) {
          setError("Nenhum horário disponível nesta data");
        }

        logDebug("Available slots loaded", { count: slots.length });

        setAvailableSlots(slots);
      } catch (err) {
        if ((err as AxiosError).response?.status === 404) {
          setError("Horários não encontrados");
        } else {
          setError("Erro ao carregar horários disponíveis");
        }
        logError("Error loading slots", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();
  }, [state.selectedProfessional, state.selectedService, state.selectedDate]);

  const handleSelectService = (service: BookingService) => {
    setState((prev) => ({
      ...prev,
      selectedService: service,
      selectedProfessional: null,
      selectedServicePrice: null,
    }));
  };

  const handleSelectProfessional = (
    professional: BookingProfessional,
    price: number,
  ) => {
    setState((prev) => ({
      ...prev,
      selectedProfessional: professional,
      selectedServicePrice: price,
    }));
  };

  const handleSelectDate = (date: string) => {
    setState((prev) => ({
      ...prev,
      selectedDate: date,
      selectedSlot: null,
    }));
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setState((prev) => ({
      ...prev,
      selectedSlot: slot,
    }));
  };

  const handleAuthSuccess = (
    accessToken: string,
    userId: string,
    name: string,
  ) => {
    setState((prev) => ({
      ...prev,
      user: {
        id: userId,
        name: name,
        email: "", // Not stored in state, only needed for booking
        accessToken,
      },
    }));
  };

  const handleConfirmBooking = async () => {
    if (
      !state.company ||
      !state.selectedService ||
      !state.selectedProfessional ||
      !state.selectedDate ||
      !state.selectedSlot ||
      !state.user
    ) {
      setError("Dados incompletos para confirmar o agendamento");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isoDate = new Date(state.selectedDate).toISOString();

      const appointmentData = await createAppointment(
        {
          companyId: state.company.id,
          clientId: state.user.id,
          professionalId: state.selectedProfessional.id,
          serviceId: state.selectedService.id,
          date: isoDate,
          startTime: state.selectedSlot.startTime,
          endTime: state.selectedSlot.endTime,
        },
        state.user.accessToken || accessToken || undefined,
      );

      setAppointment(appointmentData);
      setCurrentStep(6); // Move to confirmation view
    } catch (err) {
      logError("Error creating appointment", err);
      if (
        (err as AxiosError).response?.status === 409 ||
        (err as AxiosError).response?.status === 401
      ) {
        setError("Horário indisponível ou sessão expirada. Tente novamente.");
      } else {
        setError("Erro ao confirmar agendamento. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipAuth = () => {
    // Try to continue without authentication
    // Will redirect to login on confirmation if not auth
    setCurrentStep(6);
  };

  if (!state.company && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {[1, 2, 3, 5, 6].map((step) => {
              const displayStep = step === 5 ? 4 : step === 6 ? 5 : step;
              const isActive =
                step === currentStep ||
                (step === 5 && currentStep > 3 && currentStep < 6);
              const isDone =
                step < currentStep || (step === 5 && currentStep > 4);

              return (
                <div key={step} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isDone
                        ? "bg-green-600 text-white"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {isDone ? "✓" : displayStep}
                  </div>
                  {step < 6 && (
                    <div
                      className={`w-8 h-1 ${
                        isDone ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {currentStep === 1
                ? "Selecione um Serviço"
                : currentStep === 2
                  ? "Escolha um Profissional"
                  : currentStep === 3
                    ? "Escolha uma Data e Horário"
                    : currentStep === 5
                      ? "Autenticação"
                      : "Confirmação"}
            </h1>
            <p className="text-gray-600 mt-1">
              Etapa{" "}
              {currentStep === 1
                ? 1
                : currentStep === 2
                  ? 2
                  : currentStep === 3
                    ? 3
                    : currentStep === 5
                      ? 4
                      : 5}{" "}
              de 5
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <Step1SelectService
              company={state.company}
              isLoading={isLoading}
              error={error}
              selectedService={state.selectedService}
              onSelectService={handleSelectService}
              onNext={() => {
                setError(null);
                handleNext();
              }}
            />
          )}

          {currentStep === 2 && state.company && state.selectedService && (
            <Step2SelectProfessional
              company={state.company}
              selectedService={state.selectedService}
              selectedProfessional={state.selectedProfessional}
              professionalServices={professionalServices}
              isLoading={isLoading}
              error={error}
              onSelectProfessional={(prof, price) => {
                handleSelectProfessional(prof, price);
              }}
              onBack={handleBack}
              onNext={() => {
                setError(null);
                handleNext();
              }}
            />
          )}

          {currentStep === 3 &&
            state.selectedService &&
            state.selectedProfessional && (
              <Step3And4DateAndTime
                selectedService={state.selectedService}
                selectedProfessional={state.selectedProfessional}
                selectedDate={state.selectedDate}
                selectedSlot={state.selectedSlot}
                availableSlots={availableSlots}
                isLoadingSlots={isLoading}
                slotsError={error && availableSlots.length === 0 ? error : null}
                onSelectDate={handleSelectDate}
                onSelectSlot={handleSelectSlot}
                onBack={handleBack}
                onNext={() => {
                  setError(null);
                  if (isAuthenticated) {
                    setCurrentStep(6);
                  } else {
                    setCurrentStep(5);
                  }
                }}
              />
            )}

          {currentStep === 5 && state.selectedService && (
            <Step5Authentication
              selectedService={state.selectedService}
              selectedProfessional={state.selectedProfessional!}
              selectedDate={state.selectedDate!}
              isAuthenticated={isAuthenticated}
              onAuthSuccess={(accessToken, userId, name) => {
                handleAuthSuccess(accessToken, userId, name);
                setCurrentStep(6);
              }}
              onBack={() => setCurrentStep(3)}
              onSkip={handleSkipAuth}
            />
          )}

          {currentStep === 6 && (
            <>
              {!appointment ? (
                <Step6Confirmation
                  selectedService={state.selectedService!}
                  selectedProfessional={state.selectedProfessional!}
                  selectedDate={state.selectedDate!}
                  selectedTime={state.selectedSlot!}
                  selectedPrice={state.selectedServicePrice || 0}
                  userName={sanitizeUserInput(state.user?.name ?? "Cliente")}
                  isLoading={isLoading}
                  error={error}
                  appointment={null}
                  onConfirm={() => {
                    if (!isAuthenticated && !state.user) {
                      setError(
                        "Você precisa estar autenticado para confirmar o agendamento",
                      );
                      setCurrentStep(5);
                      return;
                    }

                    handleConfirmBooking();
                  }}
                  onBack={() => setCurrentStep(3)}
                />
              ) : (
                <Step6Confirmation
                  selectedService={state.selectedService!}
                  selectedProfessional={state.selectedProfessional!}
                  selectedDate={state.selectedDate!}
                  selectedTime={state.selectedSlot!}
                  selectedPrice={state.selectedServicePrice || 0}
                  userName={sanitizeUserInput(state.user?.name ?? "Cliente")}
                  isLoading={isLoading}
                  error={null}
                  appointment={appointment}
                  onConfirm={() => {}}
                  onBack={() => {
                    setAppointment(null);
                    setCurrentStep(1);
                    setState({
                      company: state.company,
                      selectedService: null,
                      selectedServicePrice: null,
                      selectedProfessional: null,
                      selectedDate: null,
                      selectedSlot: null,
                      user: isAuthenticated ? state.user : null,
                    });
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

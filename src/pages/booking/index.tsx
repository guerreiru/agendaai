import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
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
import { logDebug, logError } from "../../utils/logger";
import { sanitizeUserInput } from "../../utils/sanitize";
import { BookingDateTimeStep } from "./components/BookingDateTimeStep";
import { BookingWizardHeader } from "./components/BookingWizardHeader";
import { Step1SelectService } from "./steps/Step1SelectService";
import { Step2SelectProfessional } from "./steps/Step2SelectProfessional";
import { Step5Authentication } from "./steps/Step5Authentication";
import { Step6Confirmation } from "./steps/Step6Confirmation";

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

	useEffect(() => {
		if (!state.company || !state.selectedService) {
			return;
		}

		const loadServices = async () => {
			setIsLoading(true);
			setError(null);

			if (state.company?.id && state.selectedService?.id) {
				try {
					const services = await getProfessionalServicesForService(
						state.company?.id,
						state.selectedService?.id,
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
			}
		};

		loadServices();
	}, [state.company, state.selectedService]);

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
			const professionalId = state.selectedProfessional?.id;
			const serviceId = state.selectedService?.id;
			const selectedDate = state.selectedDate;

			if (professionalId && serviceId && selectedDate) {
				try {
					const slots = await getAvailableSlots(
						professionalId,
						serviceId,
						selectedDate,
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
				email: "",
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
			setCurrentStep(6);
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
				<BookingWizardHeader currentStep={currentStep} />

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
							<BookingDateTimeStep
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

					{currentStep === 5 &&
						state.selectedService &&
						state.selectedProfessional &&
						state.selectedDate && (
							<Step5Authentication
								selectedService={state.selectedService}
								selectedProfessional={state.selectedProfessional}
								selectedDate={state.selectedDate}
								isAuthenticated={isAuthenticated}
								onAuthSuccess={(accessToken, userId, name) => {
									handleAuthSuccess(accessToken, userId, name);
									setCurrentStep(6);
								}}
								onBack={() => setCurrentStep(3)}
								onSkip={handleSkipAuth}
							/>
						)}

					{currentStep === 6 &&
						state.selectedService &&
						state.selectedProfessional &&
						state.selectedDate &&
						state.selectedSlot &&
						(!appointment ? (
							<Step6Confirmation
								selectedService={state.selectedService}
								selectedProfessional={state.selectedProfessional}
								selectedDate={state.selectedDate}
								selectedTime={state.selectedSlot}
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
								selectedService={state.selectedService}
								selectedProfessional={state.selectedProfessional}
								selectedDate={state.selectedDate}
								selectedTime={state.selectedSlot}
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
						))}
				</div>
			</div>
		</div>
	);
}

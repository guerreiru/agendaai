import type {
	BookingProfessional,
	BookingService,
	CompanyPublicData,
	ProfessionalServiceLink,
} from "../../../types/booking";
import { formatCurrency } from "../../../utils/currency";
import { sanitizeUserInput } from "../../../utils/sanitize";

type Step2Props = {
	company: CompanyPublicData;
	selectedService: BookingService;
	selectedProfessional: BookingProfessional | null;
	professionalServices: ProfessionalServiceLink[];
	isLoading: boolean;
	error: string | null;
	onSelectProfessional: (
		professional: BookingProfessional,
		price: number,
	) => void;
	onBack: () => void;
	onNext: () => void;
};

export function Step2SelectProfessional({
	company,
	selectedService,
	selectedProfessional,
	professionalServices,
	isLoading,
	error,
	onSelectProfessional,
	onBack,
	onNext,
}: Step2Props) {
	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-96">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">Carregando profissionais...</p>
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

	// Get professionals that offer the selected service
	const availableProfessionals = company.professionals.filter((prof) => {
		return professionalServices.some((ps) => ps.professionalId === prof.id);
	});

	// Create a map of professional ID to service price
	const professionalPriceMap = new Map(
		professionalServices.map((ps) => [ps.professionalId, ps.price]),
	);

	return (
		<div className="space-y-8">
			{/* Service Summary */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p className="text-sm text-gray-600">Serviço selecionado:</p>
				<p className="font-semibold text-gray-900">
					{sanitizeUserInput(selectedService.name)}
				</p>
				<p className="text-sm text-gray-600">
					Duração: {selectedService.duration} minutos
				</p>
			</div>

			{/* Select Professional */}
			<div>
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">
					Escolha um Profissional
				</h2>

				{availableProfessionals.length === 0 ? (
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
						<p className="text-gray-600">
							Nenhum profissional disponível para este serviço no momento.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{availableProfessionals.map((professional) => (
							<button
								type="button"
								key={professional.id}
								onClick={() => {
									const price = professionalPriceMap.get(professional.id) || 0;
									onSelectProfessional(professional, price);
								}}
								className={`p-4 rounded-lg border-2 transition-all text-left ${
									selectedProfessional?.id === professional.id
										? "border-blue-600 bg-blue-50"
										: "border-gray-200 bg-white hover:border-blue-300"
								}`}
							>
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-semibold text-gray-900">
											{sanitizeUserInput(professional.displayName)}
										</h3>
										<p className="text-sm text-gray-600">
											{sanitizeUserInput(professional.name)}
										</p>
										{professionalPriceMap.get(professional.id) !==
											undefined && (
											<p className="text-sm font-semibold text-green-600 mt-2">
												{formatCurrency(
													professionalPriceMap.get(professional.id) || 0,
												)}
											</p>
										)}
									</div>
									{selectedProfessional?.id === professional.id && (
										<div className="shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
											<svg
												className="w-3 h-3 text-white"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<title>Profissional selecionado</title>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									)}
								</div>
							</button>
						))}
					</div>
				)}
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
					onClick={onNext}
					disabled={
						!selectedProfessional || availableProfessionals.length === 0
					}
					className={`px-6 py-3 rounded-lg font-semibold transition-all ${
						!selectedProfessional || availableProfessionals.length === 0
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

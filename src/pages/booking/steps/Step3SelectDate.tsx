import { useState } from "react";
import type {
	BookingProfessional,
	BookingService,
} from "../../../types/booking";
import { formatDateLong } from "../../../utils/formatDate";

type Step3Props = {
	selectedService: BookingService;
	selectedProfessional: BookingProfessional;
	selectedDate: string | null;
	onSelectDate: (date: string) => void;
	onBack: () => void;
	onNext: () => void;
};

export function Step3SelectDate({
	selectedService,
	selectedProfessional,
	selectedDate,
	onSelectDate,
	onBack,
	onNext,
}: Step3Props) {
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

			<div>
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">
					Escolha uma Data
				</h2>

				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<div className="flex items-center justify-between mb-6">
						<button
							type="button"
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
							type="button"
							onClick={nextMonth}
							className="p-2 hover:bg-gray-100 rounded"
							aria-label="Próximo mês"
						>
							→
						</button>
					</div>

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

					<div className="grid grid-cols-7 gap-2">
						{emptyDays.map((day) => (
							<div key={`empty-${day}`} />
						))}
						{days.map((day) => {
							const dateStr = formatDateForAPI(day);
							const isDisabled = isDateDisabled(day);
							const isSelected = selectedDate === dateStr;

							return (
								<button
									type="button"
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
							{formatDateLong(selectedDate)}
						</p>
					</div>
				)}
			</div>

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
					disabled={!selectedDate}
					className={`px-6 py-3 rounded-lg font-semibold transition-all ${
						!selectedDate
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

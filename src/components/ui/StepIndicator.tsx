type StepIndicatorProps = {
	currentStep: number;
	totalSteps: number;
};

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
	const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

	return (
		<div className="mb-5 flex flex-wrap items-center gap-2">
			{steps.map((step) => (
				<div className="flex items-center gap-2" key={step}>
					<span
						className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
							step <= currentStep
								? "bg-sky-600 text-white"
								: "bg-slate-200 text-slate-600"
						}`}
					>
						{step}
					</span>
					{step < totalSteps && <span className="h-0.5 w-6 bg-slate-200" />}
				</div>
			))}
		</div>
	);
}

type BookingWizardHeaderProps = {
  currentStep: number;
};

const WIZARD_STEPS = [1, 2, 3, 5, 6] as const;

function getDisplayStep(step: number) {
  return step === 5 ? 4 : step === 6 ? 5 : step;
}

function getTitle(currentStep: number) {
  if (currentStep === 1) return "Selecione um Serviço";
  if (currentStep === 2) return "Escolha um Profissional";
  if (currentStep === 3) return "Escolha uma Data e Horário";
  if (currentStep === 5) return "Autenticação";
  return "Confirmação";
}

function getProgressStep(currentStep: number) {
  if (currentStep === 1) return 1;
  if (currentStep === 2) return 2;
  if (currentStep === 3) return 3;
  if (currentStep === 5) return 4;
  return 5;
}

export function BookingWizardHeader({ currentStep }: BookingWizardHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {WIZARD_STEPS.map((step) => {
          const isActive =
            step === currentStep ||
            (step === 5 && currentStep > 3 && currentStep < 6);
          const isDone = step < currentStep || (step === 5 && currentStep > 4);

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
                {isDone ? "✓" : getDisplayStep(step)}
              </div>
              {step < 6 && (
                <div
                  className={`w-8 h-1 ${isDone ? "bg-green-600" : "bg-gray-300"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {getTitle(currentStep)}
        </h1>
        <p className="text-gray-600 mt-1">
          Etapa {getProgressStep(currentStep)} de 5
        </p>
      </div>
    </div>
  );
}

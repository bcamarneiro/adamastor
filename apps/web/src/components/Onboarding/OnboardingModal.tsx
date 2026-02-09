import DebaixoDolhoLogo from '@/components/ui/Icons/DebaixoDolhoLogo';
import { useOnboardingDismissed } from '@/hooks/useFirstVisit';
import { cn } from '@/utils/cn';
import { BarChart3, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    icon: null, // Will use logo
    title: "Bem-vindo ao Debaixo d'olho!",
    description:
      'Transparência parlamentar: acompanha o trabalho dos teus deputados em tempo real.',
    cta: 'Começar',
  },
  {
    id: 'deputies',
    icon: Users,
    title: 'Descobre o Teu Deputado',
    description: 'Insere o teu código postal e vê quem te representa na Assembleia da República.',
    link: '/report-card',
    cta: 'Ver Agora',
  },
  {
    id: 'explore',
    icon: BarChart3,
    title: 'Explora Mais',
    description:
      'Rankings, comparações entre partidos, batalhas de deputados e calculadora de desperdício.',
    cta: 'Explorar',
  },
];

export function OnboardingModal() {
  const { isDismissed, isLoading, dismiss } = useOnboardingDismissed();
  const [currentStep, setCurrentStep] = useState(0);

  // Don't render while loading or if dismissed
  if (isLoading || isDismissed) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      dismiss();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    dismiss();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-12/50 backdrop-blur-sm p-4">
      <div className="bg-neutral-1 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-4">
          <div className="flex items-center gap-2">
            <DebaixoDolhoLogo size="sm" className="text-accent-9" />
            <span className="font-medium text-neutral-12">Debaixo d'olho</span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-full hover:bg-neutral-3 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-neutral-9" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mb-4">
            {step.id === 'welcome' ? (
              <DebaixoDolhoLogo size="lg" className="mx-auto text-accent-9" />
            ) : (
              step.icon && (
                <div className="w-16 h-16 mx-auto rounded-full bg-accent-3 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-accent-9" />
                </div>
              )
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-neutral-12 mb-2">{step.title}</h2>

          {/* Description */}
          <p className="text-neutral-11 mb-6">{step.description}</p>

          {/* CTA Link for feature steps */}
          {step.link && (
            <Link
              to={step.link}
              onClick={dismiss}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 font-medium transition-colors mb-4"
            >
              {step.cta || 'Experimentar agora'}
            </Link>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {ONBOARDING_STEPS.map((onboardingStep, index) => (
            <button
              key={onboardingStep.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentStep ? 'bg-accent-9' : 'bg-neutral-5 hover:bg-neutral-6'
              )}
              aria-label={`Passo ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-4 bg-neutral-2 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isFirstStep
                  ? 'text-neutral-8 cursor-not-allowed'
                  : 'text-neutral-11 hover:text-neutral-12 hover:bg-neutral-3'
              )}
            >
              Anterior
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 text-sm font-medium bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors"
            >
              {isLastStep ? 'Começar' : 'Próximo'}
            </button>
          </div>

          <button
            onClick={handleSkip}
            className="w-full px-4 py-2 text-sm font-medium text-neutral-11 hover:text-neutral-12 border border-neutral-6 hover:border-neutral-7 rounded-lg transition-colors bg-neutral-1 hover:bg-neutral-2"
          >
            Não mostrar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

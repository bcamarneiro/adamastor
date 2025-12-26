import { Share2 } from 'lucide-react';
import { formatCurrency } from '../../services/waste/useCalculateWaste';
import { ConversionCard } from './ConversionCard';

interface WasteConversion {
  id: string;
  icon: string;
  label: string;
  quantity: number;
  unit: string;
}

interface WasteResultProps {
  irsAmount: number;
  wasteAmount: number;
  parliamentContribution: number;
  conversions: WasteConversion[];
  lowWorkersPercentage: number;
}

export function WasteResult({
  irsAmount,
  wasteAmount,
  parliamentContribution,
  conversions,
  lowWorkersPercentage,
}: WasteResultProps) {
  const handleShare = async () => {
    const text = `Do meu IRS de ${formatCurrency(irsAmount)}, cerca de ${formatCurrency(wasteAmount)} foi para deputados com baixo desempenho. Descobre quanto desperdicast em govperf.pt/desperdicio`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Calculadora de Desperdicio',
          text,
          url: window.location.href,
        });
      } catch (_err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert('Texto copiado!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Result */}
      <div className="bg-danger-3 rounded-xl p-6 border border-danger-6">
        <h3 className="text-lg font-medium text-danger-11 mb-2">O teu desperdicio estimado</h3>
        <div className="text-4xl font-bold text-danger-12 mb-2">{formatCurrency(wasteAmount)}</div>
        <p className="text-sm text-danger-11">
          {lowWorkersPercentage.toFixed(1)}% dos deputados tem nota D ou F
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5">
        <h4 className="font-medium text-neutral-12 mb-4">Como calculamos</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-11">IRS que pagaste</span>
            <span className="font-medium text-neutral-12">{formatCurrency(irsAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-11">Contribuicao para a AR</span>
            <span className="font-medium text-neutral-12">
              {formatCurrency(parliamentContribution)}
            </span>
          </div>
          <div className="flex justify-between border-t border-neutral-5 pt-3">
            <span className="text-danger-11 font-medium">Vai para baixo desempenho</span>
            <span className="font-bold text-danger-11">{formatCurrency(wasteAmount)}</span>
          </div>
        </div>
      </div>

      {/* Conversions Grid */}
      <div>
        <h4 className="font-medium text-neutral-12 mb-4">Com esse dinheiro podias comprar...</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {conversions.map((conversion) => (
            <ConversionCard
              key={conversion.id}
              icon={conversion.icon}
              quantity={conversion.quantity}
              label={conversion.label}
            />
          ))}
        </div>
      </div>

      {/* Share Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors font-medium"
        >
          <Share2 className="w-5 h-5" />
          Partilhar resultado
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-neutral-9 text-center">
        Nota: Este calculo e uma estimativa simplificada para fins ilustrativos. O orcamento
        parlamentar e a distribuicao real sao mais complexos.
      </p>
    </div>
  );
}

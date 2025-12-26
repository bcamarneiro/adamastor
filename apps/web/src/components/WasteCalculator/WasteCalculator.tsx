import { AlertCircle, Calculator } from 'lucide-react';
import { useState } from 'react';
import { useCalculateWaste } from '../../services/waste/useCalculateWaste';
import { useWasteStats } from '../../services/waste/useWasteStats';
import { WasteResult } from './WasteResult';

export function WasteCalculator() {
  const [inputValue, setInputValue] = useState('');
  const [submittedAmount, setSubmittedAmount] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading, error: statsError } = useWasteStats();
  const calculation = useCalculateWaste(submittedAmount, stats?.lowWorkersPercentage || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(inputValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!Number.isNaN(amount) && amount > 0) {
      setSubmittedAmount(amount);
    }
  };

  const handleReset = () => {
    setInputValue('');
    setSubmittedAmount(null);
  };

  if (statsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-neutral-4 rounded-xl" />
        <div className="h-48 bg-neutral-4 rounded-xl" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="bg-danger-3 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-danger-9 mx-auto mb-2" />
        <p className="text-danger-11">Erro ao carregar dados. Tenta novamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-warning-3 rounded-xl p-6 border border-warning-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-warning-12">{stats.lowWorkDeputies}</div>
            <div className="text-sm text-warning-11">deputados com nota D/F</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-warning-12">
              {stats.lowWorkersPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-warning-11">do parlamento</div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      {!calculation ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5">
            <label className="block text-lg font-medium text-neutral-12 mb-4">
              Quanto pagaste de IRS no ultimo ano?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-9">€</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="5000"
                className="w-full pl-10 pr-4 py-3 bg-neutral-2 border border-neutral-5 rounded-lg text-neutral-12 text-lg focus:ring-2 focus:ring-accent-9 focus:border-accent-9"
              />
            </div>
            <p className="text-sm text-neutral-9 mt-2">
              Encontras este valor no teu recibo de vencimento anual ou declaracao de IRS
            </p>
          </div>

          <button
            type="submit"
            disabled={!inputValue}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Calculator className="w-5 h-5" />
            Calcular Desperdicio
          </button>
        </form>
      ) : (
        <>
          <WasteResult
            irsAmount={calculation.irsAmount}
            wasteAmount={calculation.wasteAmount}
            parliamentContribution={calculation.parliamentContribution}
            conversions={calculation.conversions}
            lowWorkersPercentage={stats.lowWorkersPercentage}
          />

          <div className="text-center">
            <button
              onClick={handleReset}
              className="text-accent-9 hover:text-accent-10 font-medium"
            >
              Calcular novamente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

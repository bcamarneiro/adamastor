import { PartyComparison } from '@/components/Parties';
import { RotateCcw, Scale, Swords } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeputyDetail } from '../../lib/supabase';
import { useCompareDeputies } from '../../services/battle/useCompareDeputies';
import { BattleResults } from './BattleResults';
import { ComparisonBars } from './ComparisonBars';
import { DeputySelector } from './DeputySelector';

type BattleMode = 'deputies' | 'parties';

interface BattleRoyaleProps {
  initialDeputyA?: DeputyDetail | null;
  initialDeputyB?: DeputyDetail | null;
}

export function BattleRoyale({ initialDeputyA, initialDeputyB }: BattleRoyaleProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<BattleMode>('deputies');
  const [deputyA, setDeputyA] = useState<DeputyDetail | null>(initialDeputyA ?? null);
  const [deputyB, setDeputyB] = useState<DeputyDetail | null>(initialDeputyB ?? null);
  const [showResults, setShowResults] = useState(!!(initialDeputyA && initialDeputyB));

  const comparison = useCompareDeputies(deputyA, deputyB);

  // Auto-show results when deputies are loaded from URL params
  useEffect(() => {
    if (initialDeputyA && initialDeputyB) {
      setDeputyA(initialDeputyA);
      setDeputyB(initialDeputyB);
      setShowResults(true);
    }
  }, [initialDeputyA, initialDeputyB]);

  // Update URL when both deputies are selected and results are shown
  useEffect(() => {
    if (showResults && deputyA && deputyB) {
      navigate(`/batalha/deputado/${deputyA.id}/vs/${deputyB.id}`, { replace: true });
    } else if (!deputyA && !deputyB) {
      navigate('/batalha', { replace: true });
    }
  }, [showResults, deputyA, deputyB, navigate]);

  const handleCompare = () => {
    if (deputyA && deputyB) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setDeputyA(null);
    setDeputyB(null);
    setShowResults(false);
  };

  const handleModeChange = (newMode: BattleMode) => {
    setMode(newMode);
    // Reset state when changing modes
    setDeputyA(null);
    setDeputyB(null);
    setShowResults(false);
  };

  const canCompare = deputyA && deputyB && !showResults;

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="bg-neutral-3 rounded-xl p-1 flex gap-1">
        <button
          onClick={() => handleModeChange('deputies')}
          aria-label="Modo comparação de deputados"
          aria-pressed={mode === 'deputies'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            mode === 'deputies'
              ? 'bg-neutral-1 text-neutral-12 shadow-sm'
              : 'text-neutral-11 hover:text-neutral-12'
          }`}
        >
          <Swords className="w-4 h-4" />
          Deputados
        </button>
        <button
          onClick={() => handleModeChange('parties')}
          aria-label="Modo comparação de partidos"
          aria-pressed={mode === 'parties'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            mode === 'parties'
              ? 'bg-neutral-1 text-neutral-12 shadow-sm'
              : 'text-neutral-11 hover:text-neutral-12'
          }`}
        >
          <Scale className="w-4 h-4" />
          Partidos
        </button>
      </div>

      {/* Deputies Mode */}
      {mode === 'deputies' && (
        <>
          {/* Selection Phase */}
          {!showResults && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DeputySelector
                  label="Deputado 1"
                  selected={deputyA}
                  onSelect={setDeputyA}
                  excludeId={deputyB?.id}
                />
                <DeputySelector
                  label="Deputado 2"
                  selected={deputyB}
                  onSelect={setDeputyB}
                  excludeId={deputyA?.id}
                />
              </div>

              {canCompare && (
                <button
                  onClick={handleCompare}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent-9 text-monochrome-white rounded-xl hover:bg-accent-10 transition-colors font-bold text-lg"
                >
                  <Swords className="w-6 h-6" />
                  Comparar!
                </button>
              )}

              {!deputyA && !deputyB && (
                <div className="bg-neutral-3 rounded-xl p-6 text-center">
                  <Swords className="w-12 h-12 text-neutral-9 mx-auto mb-3" />
                  <h3 className="font-semibold text-neutral-12 mb-2">Escolhe dois deputados</h3>
                  <p className="text-neutral-11 text-sm">
                    Procura e seleciona dois deputados para comparar o seu desempenho
                  </p>
                </div>
              )}
            </>
          )}

          {/* Results Phase */}
          {showResults && comparison && (
            <div className="space-y-6">
              {/* Battle Results - Side by Side */}
              <BattleResults
                deputyA={comparison.deputyA}
                deputyB={comparison.deputyB}
                winsA={comparison.winsA}
                winsB={comparison.winsB}
                winner={comparison.winner}
              />

              {/* Comparison Details */}
              <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5">
                <h3 className="font-semibold text-neutral-12 mb-4 text-center">
                  Comparação Detalhada
                </h3>
                <ComparisonBars
                  metrics={comparison.metrics}
                  nameA={comparison.deputyA.short_name}
                  nameB={comparison.deputyB.short_name}
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-3 text-neutral-11 rounded-xl hover:bg-neutral-4 transition-colors font-medium"
              >
                <RotateCcw className="w-5 h-5" />
                Nova Batalha
              </button>
            </div>
          )}
        </>
      )}

      {/* Parties Mode */}
      {mode === 'parties' && <PartyComparison />}
    </div>
  );
}

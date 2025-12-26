import { RotateCcw, Swords } from 'lucide-react';
import { useState } from 'react';
import type { DeputyDetail } from '../../lib/supabase';
import { useCompareDeputies } from '../../services/battle/useCompareDeputies';
import { ComparisonBars } from './ComparisonBars';
import { DeputySelector } from './DeputySelector';
import { WinnerDeclaration } from './WinnerDeclaration';

export function BattleRoyale() {
  const [deputyA, setDeputyA] = useState<DeputyDetail | null>(null);
  const [deputyB, setDeputyB] = useState<DeputyDetail | null>(null);
  const [showResults, setShowResults] = useState(false);

  const comparison = useCompareDeputies(deputyA, deputyB);

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

  const canCompare = deputyA && deputyB && !showResults;

  return (
    <div className="space-y-6">
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
          {/* Winner Declaration */}
          {comparison.winner === 'tie' ? (
            <WinnerDeclaration
              winner={comparison.deputyA}
              loser={comparison.deputyB}
              winsCount={comparison.winsA}
              isTie={true}
            />
          ) : (
            <WinnerDeclaration
              winner={comparison.winner === 'A' ? comparison.deputyA : comparison.deputyB}
              loser={comparison.winner === 'A' ? comparison.deputyB : comparison.deputyA}
              winsCount={comparison.winner === 'A' ? comparison.winsA : comparison.winsB}
            />
          )}

          {/* Comparison Details */}
          <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5">
            <h3 className="font-semibold text-neutral-12 mb-4 text-center">Comparacao Detalhada</h3>
            <ComparisonBars
              metrics={comparison.metrics}
              nameA={comparison.deputyA.short_name}
              nameB={comparison.deputyB.short_name}
            />
          </div>

          {/* Score Summary */}
          <div className="bg-neutral-2 rounded-xl p-4 text-center">
            <div className="text-sm text-neutral-11 mb-1">Resultado final</div>
            <div className="text-lg font-bold text-neutral-12">
              {comparison.deputyA.short_name}: {comparison.winsA} vitoria
              {comparison.winsA !== 1 ? 's' : ''}
              <span className="text-neutral-9 mx-2">|</span>
              {comparison.deputyB.short_name}: {comparison.winsB} vitoria
              {comparison.winsB !== 1 ? 's' : ''}
              {comparison.ties > 0 && (
                <>
                  <span className="text-neutral-9 mx-2">|</span>
                  {comparison.ties} empate{comparison.ties !== 1 ? 's' : ''}
                </>
              )}
            </div>
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
    </div>
  );
}

import type { PartyStats } from '@/lib/supabase';
import { useCompareParties } from '@/services/parties';
import { RotateCcw, Scale, Trophy } from 'lucide-react';
import { useState } from 'react';
import { PartyComparisonBars } from './PartyComparisonBars';
import { PartySelector } from './PartySelector';

export function PartyComparison() {
  const [partyA, setPartyA] = useState<PartyStats | null>(null);
  const [partyB, setPartyB] = useState<PartyStats | null>(null);
  const [showResults, setShowResults] = useState(false);

  const comparison = useCompareParties(partyA, partyB);

  const handleCompare = () => {
    if (partyA && partyB) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setPartyA(null);
    setPartyB(null);
    setShowResults(false);
  };

  const canCompare = partyA && partyB && !showResults;

  return (
    <div className="space-y-6">
      {/* Selection Phase */}
      {!showResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PartySelector
              label="Partido 1"
              selected={partyA}
              onSelect={setPartyA}
              excludeId={partyB?.id}
            />
            <PartySelector
              label="Partido 2"
              selected={partyB}
              onSelect={setPartyB}
              excludeId={partyA?.id}
            />
          </div>

          {canCompare && (
            <button
              onClick={handleCompare}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent-9 text-monochrome-white rounded-xl hover:bg-accent-10 transition-colors font-bold text-lg"
            >
              <Scale className="w-6 h-6" />
              Comparar Partidos
            </button>
          )}

          {!partyA && !partyB && (
            <div className="bg-neutral-3 rounded-xl p-6 text-center">
              <Scale className="w-12 h-12 text-neutral-9 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-12 mb-2">Escolhe dois partidos</h3>
              <p className="text-neutral-11 text-sm">
                Procura e seleciona dois partidos para comparar o seu desempenho
              </p>
            </div>
          )}
        </>
      )}

      {/* Results Phase */}
      {showResults && comparison && (
        <div className="space-y-6">
          {/* Winner Declaration */}
          <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5">
            <div className="text-center">
              {comparison.winner === 'tie' ? (
                <>
                  <div className="text-4xl mb-2">🤝</div>
                  <h2 className="text-xl font-bold text-neutral-12 mb-1">Empate!</h2>
                  <p className="text-neutral-11">
                    {comparison.partyA.acronym} e {comparison.partyB.acronym} empataram
                  </p>
                </>
              ) : (
                <>
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-warning-9" />
                  <h2 className="text-xl font-bold text-neutral-12 mb-1">
                    {comparison.winner === 'A'
                      ? comparison.partyA.acronym
                      : comparison.partyB.acronym}{' '}
                    venceu!
                  </h2>
                  <p className="text-neutral-11">
                    Ganhou em {comparison.winner === 'A' ? comparison.winsA : comparison.winsB} de{' '}
                    {comparison.metrics.length} categorias
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Comparison Bars */}
          <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5">
            <h3 className="font-semibold text-neutral-12 mb-4 text-center">Comparacao Detalhada</h3>
            <PartyComparisonBars
              metrics={comparison.metrics}
              nameA={comparison.partyA.acronym}
              nameB={comparison.partyB.acronym}
              colorA={comparison.partyA.color}
              colorB={comparison.partyB.color}
            />
          </div>

          {/* Score Summary */}
          <div className="bg-neutral-2 rounded-xl p-4 text-center">
            <div className="text-sm text-neutral-11 mb-1">Resultado final</div>
            <div className="text-lg font-bold text-neutral-12">
              {comparison.partyA.acronym}: {comparison.winsA} vitoria
              {comparison.winsA !== 1 ? 's' : ''}
              <span className="text-neutral-9 mx-2">|</span>
              {comparison.partyB.acronym}: {comparison.winsB} vitoria
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
            Nova Comparacao
          </button>
        </div>
      )}
    </div>
  );
}

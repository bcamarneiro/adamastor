import type { DistrictStats } from '@/lib/supabase';
import { useCompareDistricts } from '@/services/districts/useCompareDistricts';
import { MapPin, RotateCcw, Scale, Trophy } from 'lucide-react';
import { useState } from 'react';
import { DistrictComparisonBars } from './DistrictComparisonBars';
import { DistrictSelector } from './DistrictSelector';

export function DistrictComparison() {
  const [districtA, setDistrictA] = useState<DistrictStats | null>(null);
  const [districtB, setDistrictB] = useState<DistrictStats | null>(null);
  const [showResults, setShowResults] = useState(false);

  const comparison = useCompareDistricts(districtA, districtB);

  const handleCompare = () => {
    if (districtA && districtB) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setDistrictA(null);
    setDistrictB(null);
    setShowResults(false);
  };

  const canCompare = districtA && districtB && !showResults;

  return (
    <div className="space-y-6">
      {/* Selection Phase */}
      {!showResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistrictSelector
              label="Distrito 1"
              selected={districtA}
              onSelect={setDistrictA}
              excludeId={districtB?.id}
            />
            <DistrictSelector
              label="Distrito 2"
              selected={districtB}
              onSelect={setDistrictB}
              excludeId={districtA?.id}
            />
          </div>

          {canCompare && (
            <button
              onClick={handleCompare}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent-9 text-monochrome-white rounded-xl hover:bg-accent-10 transition-colors font-bold text-lg"
            >
              <Scale className="w-6 h-6" />
              Comparar Distritos
            </button>
          )}

          {!districtA && !districtB && (
            <div className="bg-neutral-3 rounded-xl p-6 text-center">
              <MapPin className="w-12 h-12 text-neutral-9 mx-auto mb-3" />
              <h3 className="font-semibold text-neutral-12 mb-2">Escolhe dois distritos</h3>
              <p className="text-neutral-11 text-sm">
                Procura e seleciona dois distritos para comparar o desempenho dos seus deputados
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
                    {comparison.districtA.name} e {comparison.districtB.name} empataram
                  </p>
                </>
              ) : (
                <>
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-warning-9" />
                  <h2 className="text-xl font-bold text-neutral-12 mb-1">
                    {comparison.winner === 'A'
                      ? comparison.districtA.name
                      : comparison.districtB.name}{' '}
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
            <DistrictComparisonBars
              metrics={comparison.metrics}
              nameA={comparison.districtA.name}
              nameB={comparison.districtB.name}
            />
          </div>

          {/* Score Summary */}
          <div className="bg-neutral-2 rounded-xl p-4 text-center">
            <div className="text-sm text-neutral-11 mb-1">Resultado final</div>
            <div className="text-lg font-bold text-neutral-12">
              {comparison.districtA.name}: {comparison.winsA} vitoria
              {comparison.winsA !== 1 ? 's' : ''}
              <span className="text-neutral-9 mx-2">|</span>
              {comparison.districtB.name}: {comparison.winsB} vitoria
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

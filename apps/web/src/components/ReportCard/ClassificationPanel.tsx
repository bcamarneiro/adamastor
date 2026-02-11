import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ClassificationPanelProps {
  grade: string;
  score: number;
  proposalCount: number;
  interventionCount: number;
  questionCount: number;
  attendanceRate: number | null;
  nationalRank: number | null;
  districtRank: number | null;
}

const GRADE_THRESHOLDS = [
  { grade: 'A', min: 120, color: 'bg-success-9' },
  { grade: 'B', min: 90, color: 'bg-success-7' },
  { grade: 'C', min: 60, color: 'bg-warning-9' },
  { grade: 'D', min: 30, color: 'bg-warning-11' },
  { grade: 'F', min: 0, color: 'bg-danger-9' },
];

export function ClassificationPanel({
  grade,
  score,
  proposalCount,
  interventionCount,
  questionCount,
  attendanceRate,
  nationalRank,
  districtRank,
}: ClassificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-sm text-accent-9 hover:text-accent-11 transition-colors"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span>Ver como é calculada</span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-neutral-2 rounded-lg border border-neutral-5 space-y-4 text-sm">
          {/* Formula */}
          <div>
            <h4 className="font-medium text-neutral-12 mb-1">Fórmula</h4>
            <code className="block px-3 py-2 bg-neutral-3 rounded text-neutral-11 text-xs">
              Pontuação = (Propostas × 50%) + (Intervenções × 35%) + (Perguntas × 15%)
            </code>
          </div>

          {/* Inputs */}
          <div>
            <h4 className="font-medium text-neutral-12 mb-1">Inputs</h4>
            <ul className="space-y-1 text-neutral-11">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-9 flex-shrink-0" />
                Propostas apresentadas:{' '}
                <span className="font-medium text-neutral-12">{proposalCount}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-9 flex-shrink-0" />
                Intervenções em debates:{' '}
                <span className="font-medium text-neutral-12">{interventionCount}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-9 flex-shrink-0" />
                Perguntas ao Governo:{' '}
                <span className="font-medium text-neutral-12">{questionCount}</span>
              </li>
              {attendanceRate !== null && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-9 flex-shrink-0" />
                  Presença em plenário:{' '}
                  <span className="font-medium text-neutral-12">
                    {(attendanceRate * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-neutral-9">(não incluída na pontuação)</span>
                </li>
              )}
            </ul>
          </div>

          {/* Output */}
          <div>
            <h4 className="font-medium text-neutral-12 mb-1">Output</h4>
            <p className="text-neutral-11">
              Pontuação: <span className="font-medium text-neutral-12">{score.toFixed(0)} pts</span>{' '}
              → Nota <span className="font-bold text-neutral-12">{grade}</span>
              {nationalRank && (
                <span className="ml-2 text-neutral-9">
                  (#{nationalRank} nacional{districtRank ? `, #${districtRank} no distrito` : ''})
                </span>
              )}
            </p>
          </div>

          {/* Grade Scale */}
          <div>
            <h4 className="font-medium text-neutral-12 mb-2">Escala</h4>
            <div className="flex items-center gap-1">
              {GRADE_THRESHOLDS.slice()
                .reverse()
                .map((t) => (
                  <div key={t.grade} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full h-2 rounded-full ${t.color} ${
                        t.grade === grade ? 'ring-2 ring-offset-1 ring-neutral-12' : 'opacity-40'
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        t.grade === grade ? 'font-bold text-neutral-12' : 'text-neutral-9'
                      }`}
                    >
                      {t.grade}
                    </span>
                    <span className="text-[10px] text-neutral-9">≥{t.min}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

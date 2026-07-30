import {
  ArrowLeftRight,
  Award,
  Briefcase,
  Clock,
  Database,
  ExternalLink,
  Globe,
  GraduationCap,
  Info,
  User,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  DeputyDetail,
  DeputyPartyHistory,
  DeputyRole,
  DeputyStatusHistory,
  NationalAverages,
} from '../../lib/supabase';
import { useFeatureFlags } from '../../store/useFeatureFlags';
import { HELP_TEXTS, HelpTooltip } from '../ui/HelpTooltip';
import { GradeCircle } from './GradeCircle';
import { MetricBar } from './MetricBar';
import { MetricsTrajectoryPanel } from './MetricsTrajectoryPanel';
import type { TrajectoryMetric } from './MetricsTrajectoryPanel';

function SourceIndicator({
  sourceType,
  sourceUrl,
}: { sourceType?: 'api' | 'scraper' | null; sourceUrl?: string | null }) {
  const Icon = sourceType === 'api' ? Database : Globe;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-neutral-9 ml-2"
      title={`Fonte: ${sourceType === 'api' ? 'API Parlamento' : 'Scraper'}`}
    >
      <Icon className="w-3 h-3" />
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-11"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </span>
  );
}

interface ReportCardDetailProps {
  deputy: DeputyDetail;
  averages: NationalAverages | null;
  extendedInfo?: {
    roles: DeputyRole[];
    partyHistory: DeputyPartyHistory[];
    statusHistory: DeputyStatusHistory[];
  } | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'presente';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
}

/** Generate sample monthly trajectory data from current snapshot values.
 *  Once a monthly data pipeline exists, replace this with real data. */
function buildSampleTrajectories(deputy: DeputyDetail): TrajectoryMetric[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr'];
  const base = (v: number) => Math.max(1, Math.round(v * 0.8));
  const spread = (v: number) => {
    const b = base(v);
    return months.map((m, i) => ({ month: m, value: Math.round(b + (v - b) * ((i + 1) / months.length)) }));
  };

  return [
    { label: 'Propostas', data: spread(deputy.proposal_count), color: 'accent' },
    { label: 'Intervenções', data: spread(deputy.intervention_count), color: 'accent' },
    ...(deputy.attendance_rate !== null
      ? [{ label: 'Presença', data: spread(deputy.attendance_rate).map((d) => ({ ...d, value: Math.min(100, d.value) })), isPercentage: true as const, color: 'success' as const }]
      : []),
    { label: 'Trabalho', data: spread(deputy.work_score).map((d) => ({ ...d, value: Math.min(100, d.value) })), isPercentage: true as const, color: 'accent' },
  ];
}

export function ReportCardDetail({ deputy, averages, extendedInfo }: ReportCardDetailProps) {
  const { flags } = useFeatureFlags();
  const avgProposals = averages?.avg_proposal_count || 0;
  const avgInterventions = averages?.avg_intervention_count || 0;
  const avgQuestions = averages?.avg_question_count || 0;
  const avgAttendance = averages?.avg_attendance_rate || 0;

  return (
    <div className="bg-neutral-1 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-linear-to-r from-accent-9 to-accent-11">
        <div className="flex items-center gap-6">
          {deputy.photo_url ? (
            <img
              data-testid="deputy-photo"
              src={deputy.photo_url}
              alt={deputy.short_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-monochrome-white shadow-lg bg-neutral-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-neutral-5 border-4 border-monochrome-white shadow-lg flex items-center justify-center">
              <span className="text-neutral-9 text-3xl">?</span>
            </div>
          )}
          <div className="flex-1 text-monochrome-white">
            <h1 className="text-2xl font-bold">{deputy.short_name}</h1>
            <p className="text-accent-3">{deputy.name}</p>
            <div className="flex items-center gap-3 mt-2">
              {deputy.party_acronym && (
                <Link
                  to={`/partidos/${deputy.party_acronym.toLowerCase()}`}
                  data-testid="party-badge"
                  className="px-3 py-1 rounded-full text-sm font-medium bg-monochrome-white/20 hover:bg-monochrome-white/30 transition-colors"
                >
                  {deputy.party_acronym}
                </Link>
              )}
              {deputy.district_name && (
                <span className="text-accent-3">{deputy.district_name}</span>
              )}
            </div>
            {/* Biography badges */}
            {(deputy.profession || deputy.education) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {deputy.profession && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-monochrome-white/10 text-sm">
                    <Briefcase className="w-3 h-3" />
                    {deputy.profession}
                  </span>
                )}
                {deputy.education && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-monochrome-white/10 text-sm">
                    <GraduationCap className="w-3 h-3" />
                    {deputy.education}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grade Section */}
      <div className="p-6 border-b border-neutral-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-12 flex items-center gap-1">
              Classificacao
              <HelpTooltip content={HELP_TEXTS.grade} />
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-11">
              <span className="flex items-center gap-1" data-testid="national-rank">
                <span className="font-medium">#{deputy.national_rank}</span> nacional
                <HelpTooltip content={HELP_TEXTS.nationalRank} />
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">#{deputy.district_rank}</span> no distrito
                <HelpTooltip content={HELP_TEXTS.districtRank} />
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <GradeCircle grade={deputy.grade} score={deputy.work_score} size="lg" />
            <span className="text-xs text-neutral-9 mt-1 flex items-center gap-1">
              Pontuacao
              <HelpTooltip content={HELP_TEXTS.workScore} />
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="p-6 space-y-6">
        <h2 className="text-lg font-semibold text-neutral-12 flex items-center">
          Atividade Parlamentar
          <SourceIndicator sourceType="api" />
        </h2>

        <div data-testid="proposals-metric">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-sm font-medium text-neutral-11">Propostas apresentadas</span>
            <HelpTooltip content={HELP_TEXTS.proposals} />
          </div>
          <MetricBar label="" value={deputy.proposal_count} average={avgProposals} />
        </div>

        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-sm font-medium text-neutral-11">Intervencoes em debates</span>
            <HelpTooltip content={HELP_TEXTS.interventions} />
          </div>
          <MetricBar label="" value={deputy.intervention_count} average={avgInterventions} />
        </div>

        {flags.questionCount && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-sm font-medium text-neutral-11">Perguntas ao Governo</span>
              <HelpTooltip content={HELP_TEXTS.questions} />
            </div>
            <MetricBar label="" value={deputy.question_count} average={avgQuestions} />
          </div>
        )}

        {/* Attendance Section */}
        {deputy.attendance_rate !== null &&
          deputy.meetings_total !== null &&
          deputy.meetings_total > 0 && (
            <div className="pt-4 border-t border-neutral-5" data-testid="attendance-metric">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-accent-9" />
                <h3 className="text-base font-medium text-neutral-12 flex items-center gap-1">
                  Presenca em Plenario
                  <HelpTooltip content={HELP_TEXTS.attendance} />
                  <SourceIndicator sourceType="scraper" />
                </h3>
              </div>
              <MetricBar
                label={`Presente em ${deputy.meetings_attended ?? 0} de ${deputy.meetings_total} sessoes`}
                value={deputy.attendance_rate}
                average={avgAttendance}
                isPercentage={true}
              />
            </div>
          )}
      </div>

      {/* Monthly Trajectory Section */}
      {flags.monthlyTrajectory && (
        <div className="p-6 border-t border-neutral-5">
          <MetricsTrajectoryPanel metrics={buildSampleTrajectories(deputy)} />
        </div>
      )}

      {/* Extended Info Section */}
      {extendedInfo && (
        <>
          {/* Roles/Positions */}
          {extendedInfo.roles.length > 0 && (
            <div className="p-6 border-t border-neutral-5">
              <h2 className="text-lg font-semibold text-neutral-12 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent-9" />
                Cargos e Funcoes
              </h2>
              <div className="space-y-3">
                {extendedInfo.roles.map((role) => (
                  <div key={role.id} className="flex items-start gap-3 p-3 bg-neutral-2 rounded-lg">
                    <Award className="w-4 h-4 text-accent-9 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-12">{role.role_name}</div>
                      <div className="text-sm text-neutral-11">
                        {formatDate(role.start_date)} - {formatDate(role.end_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Party History */}
          {extendedInfo.partyHistory.length > 1 && (
            <div className="p-6 border-t border-neutral-5">
              <h2 className="text-lg font-semibold text-neutral-12 mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-warning-9" />
                Historico Partidario
              </h2>
              <div className="space-y-3">
                {extendedInfo.partyHistory.map((party) => (
                  <div
                    key={party.id}
                    className="flex items-center gap-3 p-3 bg-neutral-2 rounded-lg"
                  >
                    <span className="px-2 py-1 bg-accent-3 text-accent-11 rounded text-sm font-medium">
                      {party.party_acronym}
                    </span>
                    <div className="text-sm text-neutral-11">
                      {formatDate(party.start_date)} - {formatDate(party.end_date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          {extendedInfo.statusHistory.length > 0 && (
            <div className="p-6 border-t border-neutral-5 bg-neutral-2">
              <h2 className="text-lg font-semibold text-neutral-12 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-neutral-9" />
                Historico de Situacao
              </h2>
              <div className="space-y-2">
                {extendedInfo.statusHistory.map((status) => {
                  const isActive = status.status.toLowerCase().includes('efetivo');
                  const isSuspended = status.status.toLowerCase().includes('suspen');
                  return (
                    <div
                      key={status.id}
                      className="flex items-center gap-3 p-3 bg-neutral-1 rounded-lg"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-success-9' : isSuspended ? 'bg-warning-9' : 'bg-neutral-9'
                        }`}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-neutral-12">{status.status}</span>
                      </div>
                      <div className="text-sm text-neutral-11">
                        {formatDate(status.start_date)} - {formatDate(status.end_date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Biography Section */}
      {deputy.bio_narrative && (
        <div className="p-6 border-t border-neutral-5">
          <h2 className="text-lg font-semibold text-neutral-12 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-accent-9" />
            <span className="flex items-center">
              Biografia
              <SourceIndicator sourceType="scraper" sourceUrl={deputy.biography_source_url} />
            </span>
          </h2>
          <p className="text-neutral-11 text-sm leading-relaxed">{deputy.bio_narrative}</p>
        </div>
      )}

      {/* Data Sources Footer */}
      <div className="p-4 border-t border-neutral-5 bg-neutral-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-9">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              API: Dados base, votos
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Scraper: Presenca, biografia
            </span>
          </div>
          {deputy.last_synced_at && (
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Atualizado: {formatDate(deputy.last_synced_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

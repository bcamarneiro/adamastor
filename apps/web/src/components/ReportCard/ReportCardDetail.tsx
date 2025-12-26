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
import type {
  DeputyDetail,
  DeputyPartyHistory,
  DeputyRole,
  DeputyStatusHistory,
  NationalAverages,
} from '../../lib/supabase';
import { GradeCircle } from './GradeCircle';
import { MetricBar } from './MetricBar';

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

export function ReportCardDetail({ deputy, averages, extendedInfo }: ReportCardDetailProps) {
  const avgProposals = averages?.avg_proposals || 0;
  const avgInterventions = averages?.avg_interventions || 0;
  const avgQuestions = averages?.avg_questions || 0;
  const avgAttendance = averages?.avg_attendance || 0;

  const totalVotes = deputy.party_total_votes || 1;
  const favorPercent = ((deputy.party_votes_favor / totalVotes) * 100).toFixed(1);
  const againstPercent = ((deputy.party_votes_against / totalVotes) * 100).toFixed(1);
  const abstainPercent = ((deputy.party_votes_abstain / totalVotes) * 100).toFixed(1);

  return (
    <div className="bg-neutral-1 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-linear-to-r from-accent-9 to-accent-11">
        <div className="flex items-center gap-6">
          {deputy.photo_url ? (
            <img
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
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-monochrome-white/20">
                  {deputy.party_acronym}
                </span>
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
            <h2 className="text-lg font-semibold text-neutral-12">Classificacao</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-11">
              <span className="flex items-center gap-1">
                <span className="font-medium">#{deputy.national_rank}</span> nacional
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">#{deputy.district_rank}</span> no distrito
              </span>
            </div>
          </div>
          <GradeCircle grade={deputy.grade} score={deputy.work_score} size="lg" />
        </div>
      </div>

      {/* Metrics Section */}
      <div className="p-6 space-y-6">
        <h2 className="text-lg font-semibold text-neutral-12 flex items-center">
          Atividade Parlamentar
          <SourceIndicator sourceType="api" />
        </h2>

        <MetricBar
          label="Propostas apresentadas"
          value={deputy.proposal_count}
          average={avgProposals}
        />

        <MetricBar
          label="Intervencoes em debates"
          value={deputy.intervention_count}
          average={avgInterventions}
        />

        <MetricBar
          label="Perguntas ao Governo"
          value={deputy.question_count}
          average={avgQuestions}
        />

        {/* Attendance Section */}
        {deputy.attendance_rate !== null &&
          deputy.meetings_total !== null &&
          deputy.meetings_total > 0 && (
            <div className="pt-4 border-t border-neutral-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-accent-9" />
                <h3 className="text-base font-medium text-neutral-12 flex items-center">
                  Presenca em Plenario
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

      {/* Party Voting Section */}
      <div className="p-6 bg-neutral-2 border-t border-neutral-5">
        <h2 className="text-lg font-semibold text-neutral-12 mb-4">
          Votacoes do Partido ({deputy.party_acronym})
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-neutral-1 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-success-9">{favorPercent}%</div>
            <div className="text-sm text-neutral-11">A favor</div>
            <div className="text-xs text-neutral-9">{deputy.party_votes_favor} votos</div>
          </div>
          <div className="p-4 bg-neutral-1 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-danger-9">{againstPercent}%</div>
            <div className="text-sm text-neutral-11">Contra</div>
            <div className="text-xs text-neutral-9">{deputy.party_votes_against} votos</div>
          </div>
          <div className="p-4 bg-neutral-1 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-warning-9">{abstainPercent}%</div>
            <div className="text-sm text-neutral-11">Abstencao</div>
            <div className="text-xs text-neutral-9">{deputy.party_votes_abstain} votos</div>
          </div>
        </div>
      </div>

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

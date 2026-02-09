import Footer from '@/components/Footer';
import { LegislatureBadge } from '@/components/LegislatureBadge';
import MainNav from '@/components/MainNav';
import { PartyDeputyList } from '@/components/ReportCard/PartyDeputyList';
import { SEO } from '@/components/SEO';
import { usePartyStats } from '@/services/parties';
import { useDeputiesByParty } from '@/services/reportCard';
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export function PartyPage() {
  const navigate = useNavigate();
  const { partySlug } = useParams<{ partySlug: string }>();
  const { data: parties, isLoading, error } = usePartyStats();

  // Find party by slug (case-insensitive acronym match)
  const party = parties?.find((p) => p.acronym.toLowerCase() === partySlug?.toLowerCase());

  const { data: deputies = [], isLoading: deputiesLoading } = useDeputiesByParty(party?.id || null);

  // Calculate additional metrics from deputies
  // Filter out null attendance_rate values to avoid skewing averages downward
  const deputiesWithAttendance = deputies.filter((d) => d.attendance_rate != null);
  const avgAttendance =
    deputiesWithAttendance.length > 0
      ? deputiesWithAttendance.reduce((sum, d) => sum + d.attendance_rate!, 0) /
        deputiesWithAttendance.length
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-2 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-9" />
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-neutral-2 flex flex-col">
        <MainNav scrollY={0} />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div className="bg-danger-3 text-danger-11 p-4 rounded-xl text-center">
            Partido não encontrado
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate party ranking
  const partyRank = parties ? parties.findIndex((p) => p.id === party.id) + 1 : 0;

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO
        title={`${party.acronym} - ${party.name}`}
        description={`Estatísticas e desempenho do ${party.acronym} na Assembleia da República. ${party.deputy_count} deputados, ${party.avg_work_score?.toFixed(1) ?? 'N/A'} pontos de média.`}
        url={`/partidos/${partySlug}`}
      />
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        {/* Party Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-3 h-24 rounded-full shrink-0"
              style={{ backgroundColor: party.color || '#888' }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-neutral-12">{party.acronym}</h1>
                <LegislatureBadge />
              </div>
              <p className="text-lg text-neutral-11 mb-2">{party.name}</p>
              {partyRank > 0 && (
                <div className="flex items-center gap-2 text-sm text-neutral-11">
                  <TrendingUp className="w-4 h-4 text-accent-9" />
                  <span>
                    #{partyRank} no ranking de partidos ({parties?.length ?? 0} partidos)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-accent-9" />
            <div className="text-2xl font-bold text-neutral-12">{party.deputy_count}</div>
            <div className="text-sm text-neutral-11">Deputados</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <div className="text-2xl font-bold text-neutral-12">
              {party.avg_work_score?.toFixed(1) ?? 'N/A'}
            </div>
            <div className="text-sm text-neutral-11">Pontuação Média</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <FileText className="w-5 h-5 mx-auto mb-1 text-accent-9" />
            <div className="text-2xl font-bold text-neutral-12">{party.total_proposals ?? 0}</div>
            <div className="text-sm text-neutral-11">Propostas</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <MessageSquare className="w-5 h-5 mx-auto mb-1 text-accent-9" />
            <div className="text-2xl font-bold text-neutral-12">
              {party.total_interventions ?? 0}
            </div>
            <div className="text-sm text-neutral-11">Intervenções</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5 mb-8">
          <h2 className="text-xl font-semibold text-neutral-12 mb-4">Estatísticas Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-accent-9" />
              <div>
                <div className="text-2xl font-bold text-neutral-12">
                  {party.total_questions ?? 0}
                </div>
                <div className="text-sm text-neutral-11">Perguntas ao Governo</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-accent-9" />
              <div>
                <div className="text-2xl font-bold text-neutral-12">
                  {avgAttendance != null ? `${avgAttendance.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-neutral-11">Presença Média em Plenário</div>
              </div>
            </div>
          </div>
        </div>

        {/* Deputies List */}
        <PartyDeputyList
          partyAcronym={party.acronym}
          deputies={deputies}
          isLoading={deputiesLoading}
        />

        {/* Cross-links Section */}
        <div className="bg-neutral-1 rounded-xl p-6 border border-neutral-5 mt-8">
          <h2 className="text-xl font-semibold text-neutral-12 mb-4">Ver também</h2>
          <div className="space-y-3">
            <Link
              to="/initiatives"
              className="flex items-center justify-between p-4 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors group"
            >
              <div>
                <div className="text-neutral-12 font-medium">Iniciativas Legislativas</div>
                <div className="text-sm text-neutral-11">
                  Vê as propostas e iniciativas do {party.acronym}
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-neutral-11 group-hover:text-accent-9 transition-colors" />
            </Link>
            <Link
              to="/partidos/comparar"
              className="flex items-center justify-between p-4 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors group"
            >
              <div>
                <div className="text-neutral-12 font-medium">Comparar Partidos</div>
                <div className="text-sm text-neutral-11">
                  Compara o desempenho entre diferentes partidos
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-neutral-11 group-hover:text-accent-9 transition-colors" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PartyPage;

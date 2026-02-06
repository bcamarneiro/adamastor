import Footer from '@/components/Footer';
import { Leaderboard } from '@/components/Leaderboard';
import { LegislatureBadge } from '@/components/LegislatureBadge';
import MainNav from '@/components/MainNav';
import { SEO, SEO_CONFIGS } from '@/components/SEO';
import PageHeader from '@/components/layout/PageHeader';
import Section from '@/components/layout/Section';

export function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO {...SEO_CONFIGS.leaderboard} url="/ranking" />
      <MainNav scrollY={0} />

      <PageHeader
        variant="dark"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ranking' }]}
        title={
          <div className="flex flex-col gap-2">
            <span className="font-serif text-sm uppercase tracking-widest text-accent-11">
              Atividade Parlamentar
            </span>
            <div className="flex items-center gap-3">
              <span>Ranking de Atividade</span>
              <LegislatureBadge />
            </div>
          </div>
        }
        description="Compara a atividade parlamentar registada de todos os deputados"
      />

      <Section variant="muted" size="md">
        <div className="max-w-2xl mx-auto">
          <Leaderboard />
        </div>
      </Section>

      <Footer />
    </div>
  );
}

export default LeaderboardPage;

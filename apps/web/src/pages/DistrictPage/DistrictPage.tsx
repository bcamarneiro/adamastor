import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { DistrictDeputyList } from '@/components/ReportCard/DistrictDeputyList';
import { type District, supabase } from '@/lib/supabase';
import { useDeputiesByDistrict } from '@/services/reportCard/useDeputiesByDistrict';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

async function fetchDistrictBySlug(slug: string): Promise<District | null> {
  const { data, error } = await supabase.from('districts').select('*').eq('slug', slug).single();

  if (error) {
    console.error('Error fetching district:', error);
    return null;
  }
  return data;
}

export function DistrictPage() {
  const { districtSlug } = useParams<{ districtSlug: string }>();

  const { data: district, isLoading: districtLoading } = useQuery({
    queryKey: ['district', 'slug', districtSlug],
    queryFn: () => fetchDistrictBySlug(districtSlug!),
    enabled: !!districtSlug,
  });

  const { data: deputies = [], isLoading: deputiesLoading } = useDeputiesByDistrict(
    district?.id || null
  );

  if (districtLoading) {
    return (
      <div className="min-h-screen bg-neutral-2 flex flex-col">
        <MainNav scrollY={0} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-neutral-9">A carregar...</div>
        </main>
      </div>
    );
  }

  if (!district) {
    return (
      <div className="min-h-screen bg-neutral-2 flex flex-col">
        <MainNav scrollY={0} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-neutral-12 mb-4">Distrito nao encontrado</h1>
          <Link to="/report-card" className="text-accent-9 hover:underline">
            Voltar ao inicio
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link
          to="/report-card"
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        <DistrictDeputyList district={district} deputies={deputies} isLoading={deputiesLoading} />
      </main>

      <Footer />
    </div>
  );
}

export default DistrictPage;

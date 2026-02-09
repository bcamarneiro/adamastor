import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { PostalCodeInput } from '@/components/ReportCard/PostalCodeInput';
import { SEO, SEO_CONFIGS } from '@/components/SEO';
import { supabase } from '@/lib/supabase';
import { useDistrictByPostal } from '@/services/reportCard/useDistrictByPostal';
import { AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const [postalCode, setPostalCode] = useState<string | null>(null);

  const { data, isLoading, error } = useDistrictByPostal(postalCode);

  // Navigate when district is found and NOT ambiguous
  // Use replace so back button returns to the page before HomePage
  useEffect(() => {
    if (data?.district && !data.ambiguous) {
      navigate(`/distrito/${data.district.slug}`, { replace: true });
      setPostalCode(null); // Reset so back navigation doesn't re-trigger
    }
  }, [data?.district, data?.ambiguous, navigate]);

  const handleSubmit = (code: string) => {
    setPostalCode(code);
  };

  const handleDistrictChoice = (slug: string) => {
    setPostalCode(null);
    navigate(`/distrito/${slug}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-accent-2 to-neutral-1 flex flex-col">
      <SEO {...SEO_CONFIGS.reportCard} url="/report-card" />
      <MainNav scrollY={0} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-12 mb-4">
            O Teu Deputado em Números
          </h1>
          <p className="text-xl text-neutral-11 mb-8">
            Descobre quem te representa na Assembleia da República e avalia o trabalho do teu
            deputado.
          </p>

          <div className="bg-neutral-1 p-8 rounded-xl shadow-lg">
            <h2 className="text-lg font-medium text-neutral-12 mb-4">Quem te representa?</h2>
            <PostalCodeInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={data?.error || (error ? 'Erro ao procurar distrito' : null)}
            />
            <p className="text-sm text-neutral-11 mt-4">
              Para ver círculos internacionais, navega directamente para{' '}
              <Link
                to="/distrito/europa"
                className="text-accent-11 hover:text-accent-12 font-medium underline"
              >
                Europa
              </Link>{' '}
              e{' '}
              <Link
                to="/distrito/fora-da-europa"
                className="text-accent-11 hover:text-accent-12 font-medium underline"
              >
                Fora da Europa
              </Link>
              .
            </p>
          </div>

          {/* Ambiguous postal code — show district choice */}
          {data?.ambiguous && data.district && data.alternativeDistrict && (
            <AmbiguousPostalChoice
              postalCode={postalCode || ''}
              districtA={data.district}
              alternativeDistrictName={data.alternativeDistrict}
              onChoice={handleDistrictChoice}
            />
          )}

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <div className="text-4xl mb-2">1</div>
              <h3 className="font-semibold text-neutral-12 mb-2">Código Postal</h3>
              <p className="text-sm text-neutral-11">
                Introduz o teu código postal para encontrar o teu distrito
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-2">2</div>
              <h3 className="font-semibold text-neutral-12 mb-2">Deputados</h3>
              <p className="text-sm text-neutral-11">
                Vê a lista de deputados eleitos pelo teu distrito
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-2">3</div>
              <h3 className="font-semibold text-neutral-12 mb-2">Report Card</h3>
              <p className="text-sm text-neutral-11">
                Consulta o desempenho de cada deputado e partilha
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              to="/metodologia"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-1 border border-neutral-6 text-neutral-11 hover:text-neutral-12 hover:border-neutral-8 transition-colors shadow-sm"
            >
              <Info className="w-4 h-4" />
              <span className="font-medium">Como são calculados os pontos?</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * When a CP4 code spans two districts, let the user choose.
 */
function AmbiguousPostalChoice({
  postalCode,
  districtA,
  alternativeDistrictName,
  onChoice,
}: {
  postalCode: string;
  districtA: { name: string; slug: string };
  alternativeDistrictName: string;
  onChoice: (slug: string) => void;
}) {
  const [altSlug, setAltSlug] = useState<string | null>(null);

  // Fetch the slug for the alternative district
  useEffect(() => {
    supabase
      .from('districts')
      .select('slug')
      .eq('name', alternativeDistrictName)
      .single()
      .then(({ data }) => {
        if (data?.slug) setAltSlug(data.slug);
      });
  }, [alternativeDistrictName]);

  return (
    <div className="mt-6 bg-warning-2 border border-warning-6 rounded-xl p-6 text-left">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning-9 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-warning-11 mb-2">
            O código postal {postalCode} abrange dois distritos
          </h3>
          <p className="text-sm text-neutral-11 mb-4">
            Este código postal inclui localidades de distritos diferentes. Escolhe o teu distrito:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onChoice(districtA.slug)}
              className="flex-1 px-4 py-3 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors font-medium"
            >
              {districtA.name}
            </button>
            {altSlug && (
              <button
                onClick={() => onChoice(altSlug)}
                className="flex-1 px-4 py-3 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors font-medium"
              >
                {alternativeDistrictName}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

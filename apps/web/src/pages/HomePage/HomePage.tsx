import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { PostalCodeInput } from '@/components/ReportCard/PostalCodeInput';
import { useDistrictByPostal } from '@/services/reportCard/useDistrictByPostal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const [postalCode, setPostalCode] = useState<string | null>(null);

  const { data, isLoading, error } = useDistrictByPostal(postalCode);

  // Navigate when district is found
  if (data?.district) {
    navigate(`/distrito/${data.district.slug}`);
  }

  const handleSubmit = (code: string) => {
    setPostalCode(code);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-accent-2 to-neutral-1 flex flex-col">
      <MainNav scrollY={0} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-12 mb-4">
            O Teu Deputado em Numeros
          </h1>
          <p className="text-xl text-neutral-11 mb-8">
            Descobre quem te representa na Assembleia da Republica e avalia o trabalho do teu
            deputado.
          </p>

          <div className="bg-neutral-1 p-8 rounded-xl shadow-lg">
            <h2 className="text-lg font-medium text-neutral-12 mb-4">Quem te representa?</h2>
            <PostalCodeInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={data?.error || (error ? 'Erro ao procurar distrito' : null)}
            />
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <div className="text-4xl mb-2">1</div>
              <h3 className="font-semibold text-neutral-12 mb-2">Codigo Postal</h3>
              <p className="text-sm text-neutral-11">
                Introduz o teu codigo postal para encontrar o teu distrito
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-2">2</div>
              <h3 className="font-semibold text-neutral-12 mb-2">Deputados</h3>
              <p className="text-sm text-neutral-11">
                Ve a lista de deputados eleitos pelo teu distrito
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;

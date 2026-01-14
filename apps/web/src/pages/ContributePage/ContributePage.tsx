import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { SEO } from '@/components/SEO';
import { ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import contributePtMd from './contribute-pt.md';

const ContributePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO
        title="Contribuir | Debaixo d'Olho"
        description="Como podes ajudar o projeto Debaixo d'Olho. Reportar bugs, validar correções, sugerir melhorias ou contribuir com código."
        url="/contribuir"
      />
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        <article className="prose max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{contributePtMd}</Markdown>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ContributePage;

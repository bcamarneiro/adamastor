import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { SEO, SEO_CONFIGS } from '@/components/SEO';
import { ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import privacidadePtMd from './privacidade-pt.md';

const PrivacidadePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO {...SEO_CONFIGS.privacidade} url="/privacidade" />
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
          <Markdown remarkPlugins={[remarkGfm]}>{privacidadePtMd}</Markdown>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacidadePage;

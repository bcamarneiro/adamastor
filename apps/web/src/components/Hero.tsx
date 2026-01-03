import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center bg-neutral-50">
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.webp"
          alt="Assembleia da República Portuguesa"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/60" />
      </div>
      <div className="container px-6 md:px-8 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-medium mb-6 tracking-tight text-neutral-900">
            Acompanha o Teu Deputado
          </h1>

          <p className="text-lg md:text-xl text-neutral-800 mb-8 leading-relaxed font-medium">
            Acompanha a atividade dos deputados portugueses com dados reais do Parlamento. Descobre
            quem participa mais, quem falta e quanto do teu IRS paga salários.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/report-card"
              className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              Descobre o Teu Deputado
            </Link>
            <Link
              to="/ranking"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-neutral-900 border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Ver Ranking
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

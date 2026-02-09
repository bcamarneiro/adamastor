import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Database,
  Eye,
  FileText,
  Github,
  Radio,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import Hero from '../../components/Hero';
import KeyMetrics from '../../components/KeyMetrics';
import MainNav from '../../components/MainNav';
import { SEO, SEO_CONFIGS, getOrganizationSchema } from '../../components/SEO';

const featureCards = [
  {
    icon: BarChart3,
    title: 'Report Card',
    description: 'Descobre a nota do teu deputado com base na sua atividade parlamentar.',
    link: '/report-card',
    color: 'accent',
    preview: 'Notas de A a F para cada deputado',
  },
  {
    icon: Trophy,
    title: 'Ranking',
    description: 'Compara a atividade parlamentar de todos os deputados.',
    link: '/ranking',
    color: 'success',
    preview: 'Quem trabalha mais? Quem trabalha menos?',
  },
  {
    icon: Users,
    title: 'Todos os Deputados',
    description: 'Explora a lista completa de todos os deputados da Assembleia.',
    link: '/parliament',
    color: 'accent',
    preview: '230 deputados, todos os partidos',
  },
  {
    icon: FileText,
    title: 'Iniciativas',
    description: 'Pesquisa e acompanha iniciativas parlamentares e votações.',
    link: '/initiatives',
    color: 'accent',
    preview: 'Propostas, votos e debates',
  },
  {
    icon: Calculator,
    title: 'Calculadora',
    description: 'Calcula quanto do teu IRS vai para deputados com baixa atividade registada.',
    link: '/desperdicio',
    color: 'warning',
    preview: 'Quanto custa a inactividade?',
  },
  {
    icon: Swords,
    title: 'Battle Royale',
    description: 'Compara dois deputados lado a lado.',
    link: '/batalha',
    color: 'danger',
    preview: 'Deputado vs. Deputado',
  },
];

const pipelineSteps = [
  {
    icon: Radio,
    title: 'API do Parlamento',
    description: 'Dados públicos da Assembleia da República',
  },
  {
    icon: Eye,
    title: 'Watcher',
    description: 'Monitorização automática e contínua',
  },
  {
    icon: Database,
    title: 'Base de Dados',
    description: 'Processamento e análise dos dados',
  },
  {
    icon: Users,
    title: 'Tu',
    description: 'Informação clara e acessível',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-1 overflow-x-hidden">
      <SEO {...SEO_CONFIGS.landing} url="/" structuredData={getOrganizationSchema()} />
      <MainNav scrollY={scrollY} />

      <div className="flex flex-col overflow-x-hidden">
        {/* Hero */}
        <Hero />

        {/* Key Metrics */}
        <KeyMetrics />

        {/* Feature Cards Section */}
        <section className="bg-neutral-1 py-20 md:py-32 w-full">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="max-w-2xl mb-16"
            >
              <motion.div variants={fadeInUp} custom={0} className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent-9" />
                <span className="font-serif text-sm uppercase tracking-[0.2em] text-accent-11">
                  Ferramentas
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-12 mb-4"
              >
                Tudo o que precisas para
                <br />
                <span className="text-accent-11">acompanhar o Parlamento.</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-neutral-11 leading-relaxed"
              >
                Seis ferramentas construídas sobre dados reais do Parlamento português.
              </motion.p>
            </motion.div>

            {/* Cards Grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {featureCards.map((feature, index) => (
                <motion.div key={feature.title} variants={fadeInUp} custom={index}>
                  <Link
                    to={feature.link}
                    className="group relative flex flex-col h-full bg-neutral-1 border border-neutral-4 rounded-2xl p-8 hover:border-accent-7 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl bg-${feature.color}-3 flex items-center justify-center mb-5`}
                    >
                      <feature.icon className={`w-6 h-6 text-${feature.color}-9`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-neutral-12 mb-2 group-hover:text-accent-9 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral-11 mb-4 leading-relaxed flex-1">
                      {feature.description}
                    </p>

                    {/* Preview tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-9 bg-neutral-3 px-3 py-1 rounded-full">
                        {feature.preview}
                      </span>
                      <ArrowRight className="w-4 h-4 text-neutral-8 group-hover:text-accent-9 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works — Data Pipeline */}
        <section className="bg-neutral-12 py-20 md:py-32 w-full">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-16"
            >
              <motion.div
                variants={fadeInUp}
                custom={0}
                className="flex items-center justify-center gap-3 mb-4"
              >
                <div className="h-px w-8 bg-danger-9" />
                <span className="font-serif text-sm uppercase tracking-[0.2em] text-neutral-8">
                  Como Funciona
                </span>
                <div className="h-px w-8 bg-danger-9" />
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4"
              >
                Do Parlamento para ti.
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-neutral-8 max-w-xl mx-auto"
              >
                Recolhemos, processamos e apresentamos os dados parlamentares para que não tenhas de
                o fazer.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6"
            >
              {pipelineSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  custom={index}
                  className="relative text-center"
                >
                  {/* Connector line (hidden on mobile, shown between items on desktop) */}
                  {index < pipelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-neutral-7/40" />
                  )}

                  <div className="relative">
                    {/* Step number */}
                    <div className="text-xs font-bold text-neutral-9 mb-3">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-neutral-11/10 border border-neutral-7/30 flex items-center justify-center mx-auto mb-5">
                      <step.icon className="w-7 h-7 text-neutral-1" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-neutral-8">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Open Source CTA */}
        <section className="bg-neutral-2 py-20 md:py-32 w-full">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.div
                variants={fadeInUp}
                custom={0}
                className="inline-flex items-center gap-2 bg-neutral-1 border border-neutral-5 rounded-full px-4 py-2 mb-6"
              >
                <Github className="w-4 h-4 text-neutral-11" />
                <span className="text-sm font-medium text-neutral-11">Open Source</span>
              </motion.div>

              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-12 mb-6"
              >
                Código aberto.
                <br />
                Cidadania activa.
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-neutral-11 mb-10 leading-relaxed max-w-xl mx-auto"
              >
                O Debaixo d'olho é um projecto open-source. O código, os dados e a metodologia são
                abertos e transparentes — tal como o Parlamento deveria ser.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <a
                  href="https://github.com/bcamarneiro/adamastor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-14 items-center justify-center rounded-full bg-neutral-12 px-8 text-base font-semibold text-white hover:bg-neutral-11 transition-all duration-200"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Ver no GitHub
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link
                  to="/contribuir"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-neutral-6 px-8 text-base font-semibold text-neutral-12 hover:bg-neutral-3 transition-all duration-200"
                >
                  Como Contribuir
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;

import { Button } from '@radix-ui/themes';
import { motion } from 'framer-motion';
import { BarChart3, Calculator, FileText, Flag, Swords, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import Hero from '../../components/Hero';
import KeyMetrics from '../../components/KeyMetrics';
import MainNav from '../../components/MainNav';
import { SEO, SEO_CONFIGS, getOrganizationSchema } from '../../components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const featureCards = [
  {
    icon: BarChart3,
    title: 'Report Card',
    description: 'Descobre a nota do teu deputado com base na sua atividade parlamentar.',
    link: '/report-card',
    color: 'accent',
  },
  {
    icon: Trophy,
    title: 'Ranking',
    description: 'Compara a atividade parlamentar de todos os deputados.',
    link: '/ranking',
    color: 'success',
  },
  {
    icon: FileText,
    title: 'Iniciativas',
    description: 'Pesquisa e acompanha iniciativas parlamentares e votações.',
    link: '/initiatives',
    color: 'accent',
  },
  {
    icon: Calculator,
    title: 'Calculadora',
    description: 'Calcula quanto do teu IRS vai para deputados com baixa atividade registada.',
    link: '/desperdicio',
    color: 'warning',
  },
  {
    icon: Swords,
    title: 'Battle Royale',
    description: 'Compara dois deputados lado a lado.',
    link: '/batalha',
    color: 'danger',
  },
];

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
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

  return (
    <div className="min-h-screen bg-neutral-1 overflow-x-hidden">
      <SEO {...SEO_CONFIGS.landing} url="/" structuredData={getOrganizationSchema()} />
      <MainNav scrollY={scrollY} />

      <motion.div initial="hidden" animate="visible" className="flex flex-col overflow-x-hidden">
        <Hero />

        {/* Feature Cards Section */}
        <motion.section
          variants={fadeInUp}
          custom={1}
          className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 md:py-24"
        >
          <motion.div className="max-w-2xl mx-auto text-center mb-12">
            <motion.span
              variants={fadeInUp}
              custom={2}
              className="inline-block text-sm tracking-wide uppercase bg-accent-3 px-3 py-1 rounded-full mb-3 font-medium text-accent-11"
            >
              Acompanha o Teu Deputado
            </motion.span>

            <motion.h2
              variants={fadeInUp}
              custom={3}
              className="text-3xl md:text-4xl font-light mb-4 tracking-tight text-neutral-12"
            >
              Explora as Nossas Ferramentas
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              custom={4}
              className="text-neutral-11 md:text-lg leading-relaxed"
            >
              Descobre como os teus deputados trabalham com dados reais do Parlamento.
            </motion.p>
          </motion.div>

          {/* Feature Cards Grid */}
          <motion.div
            variants={fadeInUp}
            custom={5}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16"
          >
            {featureCards.map((feature) => (
              <Link
                key={feature.title}
                to={feature.link}
                className="group bg-neutral-1 rounded-xl p-6 border border-neutral-5 hover:border-accent-7 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-${feature.color}-3 flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-6 h-6 text-${feature.color}-9`} />
                </div>
                <h3 className="text-lg font-semibold text-neutral-12 mb-2 group-hover:text-accent-9 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-11">{feature.description}</p>
              </Link>
            ))}
          </motion.div>

          <KeyMetrics />

          <motion.div variants={fadeInUp} custom={8} className="mt-20 md:mt-32">
            <Tabs defaultValue="sectors" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="h-12">
                  <TabsTrigger value="sectors" className="text-sm md:text-base px-6">
                    Funcionalidades
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-sm md:text-base px-6">
                    Cronologia
                  </TabsTrigger>
                  <TabsTrigger value="promises" className="text-sm md:text-base px-6">
                    Iniciativas
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="sectors" className="focus-visible:outline-none">
                <div className="text-center py-10 px-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-3 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-neutral-9" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-neutral-12">
                    Ferramentas de Análise
                  </h3>
                  <p className="text-neutral-11 max-w-md mx-auto">
                    Report cards, rankings, calculadora de desperdício e comparador de deputados.
                    Todas as ferramentas que precisas para acompanhar o trabalho parlamentar.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="focus-visible:outline-none">
                <div className="text-center py-10 px-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-3 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-neutral-9" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-neutral-12">
                    Cronologia Legislativa
                  </h3>
                  <p className="text-neutral-11 max-w-md mx-auto">
                    Acompanha o progresso das iniciativas parlamentares através das diferentes fases
                    e visualiza a cronologia legislativa completa.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="promises" className="focus-visible:outline-none">
                <div className="text-center py-10 px-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-3 flex items-center justify-center">
                    <Flag className="w-8 h-8 text-neutral-9" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-neutral-12">
                    Iniciativas Parlamentares
                  </h3>
                  <p className="text-neutral-11 max-w-md mx-auto">
                    Pesquisa, filtra e acompanha iniciativas parlamentares, incluindo registos de
                    votação, transcrições de debates e documentos relacionados.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.section>

        <motion.section
          variants={fadeInUp}
          custom={9}
          className="bg-neutral-2 py-16 md:py-24 w-full"
        >
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center">
              <span className="inline-block text-sm tracking-wide uppercase bg-neutral-1 px-3 py-1 rounded-full mb-3 font-medium text-neutral-11">
                Objectivos do Projecto
              </span>
              <h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight text-neutral-12">
                Aumentar a Participação Civica
              </h2>
              <p className="text-neutral-11 mb-8">
                Junta-te a nossa missão de democratizar o acesso aos dados parlamentares, aumentar a
                participação civica e garantir a transparencia na governacao portuguesa.
              </p>
              <Link to="/contribuir">
                <Button className="rounded-full h-12 px-8 bg-accent-9 hover:bg-accent-10 transition-all duration-300">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>

        <Footer />
      </motion.div>
    </div>
  );
};

export default LandingPage;

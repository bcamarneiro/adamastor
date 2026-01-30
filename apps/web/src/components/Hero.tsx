import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CURRENT_LEGISLATURE_ROMAN, TOTAL_DEPUTIES } from 'shared';
import DebaixoDolhoLogo from './ui/Icons/DebaixoDolhoLogo';

const stats = [
  { value: `${TOTAL_DEPUTIES}`, label: 'Deputados' },
  { value: '1,500+', label: 'Iniciativas' },
  { value: CURRENT_LEGISLATURE_ROMAN, label: 'Legislatura' },
];

const Hero = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center bg-neutral-12 overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Accent glow */}
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-accent-9/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-success-9/8 blur-[100px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="grid lg:grid-cols-[1fr_auto] gap-16 lg:gap-20 items-center">
          {/* Text content */}
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="h-px w-8 bg-danger-9" />
              <span className="font-serif text-sm uppercase tracking-[0.2em] text-neutral-8">
                Transparência Parlamentar
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6"
            >
              O Parlamento
              <br />
              <span className="text-danger-9">debaixo d'olho.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-neutral-8 leading-relaxed mb-10 max-w-xl"
            >
              Dados reais. Atualização diária. A atividade de cada deputado português, analisada e
              aberta a todos.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <Link
                to="/report-card"
                className="group inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-neutral-12 hover:bg-neutral-3 transition-all duration-200"
              >
                Descobre o Teu Deputado
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/ranking"
                className="inline-flex h-14 items-center justify-center rounded-full border border-neutral-7 px-8 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200"
              >
                Ver Ranking
              </Link>
            </motion.div>

            {/* Inline stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex gap-10 md:gap-14"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-neutral-9 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Logo mark — large, floating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              {/* Glow behind logo */}
              <div className="absolute inset-0 bg-success-9/20 blur-[60px] rounded-full scale-150" />
              <DebaixoDolhoLogo size="lg" className="text-white relative w-40 h-40" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-12 to-transparent" />
    </section>
  );
};

export default Hero;

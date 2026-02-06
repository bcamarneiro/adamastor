import { HELP_TEXTS, HelpTooltip } from '@/components/ui/HelpTooltip';
import { motion } from 'framer-motion';
import { AlertTriangle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBottomWorkers } from '../../services/leaderboard/useBottomWorkers';
import { useTopWorkers } from '../../services/leaderboard/useTopWorkers';
import { LeaderboardCard } from './LeaderboardCard';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Leaderboard() {
  const { data: topWorkers = [], isLoading: topLoading } = useTopWorkers(3);
  const { data: bottomWorkers = [], isLoading: bottomLoading } = useBottomWorkers(3);

  const isLoading = topLoading || bottomLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-4 rounded w-48 mx-auto mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-neutral-4 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Workers Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div variants={fadeInUp} custom={0} className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-success-9" />
          <h2 className="text-xl font-bold text-neutral-12 flex items-center gap-1">
            Maior Atividade Parlamentar
            <HelpTooltip content={HELP_TEXTS.topWorkers} />
          </h2>
        </motion.div>
        <motion.p variants={fadeInUp} custom={1} className="text-neutral-11 mb-4">
          Os deputados com mais atividade registada na Assembleia da República
        </motion.p>
        <div className="space-y-3">
          {topWorkers.map((deputy, index) => (
            <motion.div key={deputy.id} variants={fadeInUp} custom={index + 2}>
              <LeaderboardCard deputy={deputy} position={index + 1} isTop={true} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Bottom Workers Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div variants={fadeInUp} custom={0} className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-danger-9" />
          <h2 className="text-xl font-bold text-neutral-12 flex items-center gap-1">
            Menor Atividade Parlamentar
            <HelpTooltip content={HELP_TEXTS.bottomWorkers} />
          </h2>
        </motion.div>
        <motion.p variants={fadeInUp} custom={1} className="text-neutral-11 mb-4">
          Os deputados com menos atividade registada na Assembleia da República
        </motion.p>
        <div className="space-y-3">
          {bottomWorkers.map((deputy, index) => (
            <motion.div key={deputy.id} variants={fadeInUp} custom={index + 2}>
              <LeaderboardCard deputy={deputy} position={index + 1} isTop={false} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Link to Full Rankings */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        custom={0}
        className="text-center pt-4"
      >
        <Link
          to="/ranking/completo"
          className="inline-flex items-center gap-2 bg-accent-9 hover:bg-accent-10 text-white font-semibold rounded-full h-12 px-8 transition-colors"
        >
          Ver Ranking Completo
        </Link>
      </motion.div>
    </div>
  );
}

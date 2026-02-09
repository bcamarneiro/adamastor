import { motion } from 'framer-motion';
import { CURRENT_LEGISLATURE_ROMAN, TOTAL_DEPUTIES } from 'shared';

const metrics = [
  {
    value: `${TOTAL_DEPUTIES}`,
    label: 'Deputados',
    description: 'monitorizados em tempo real',
  },
  {
    value: '1,500+',
    label: 'Iniciativas',
    description: 'parlamentares registadas',
  },
  {
    value: CURRENT_LEGISLATURE_ROMAN,
    label: 'Legislatura',
    description: 'dados da legislatura actual',
  },
  {
    value: '24h',
    label: 'Atualizações',
    description: 'ciclo de atualização diário',
  },
];

const KeyMetrics = () => {
  return (
    <section className="bg-neutral-2 py-20 md:py-28 w-full">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative text-center lg:text-left"
            >
              <div className="text-5xl md:text-6xl font-bold text-neutral-12 tracking-tight">
                {metric.value}
              </div>
              <div className="text-sm uppercase tracking-widest text-neutral-9 mt-3 font-semibold">
                {metric.label}
              </div>
              <div className="text-sm text-neutral-11 mt-1">{metric.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyMetrics;

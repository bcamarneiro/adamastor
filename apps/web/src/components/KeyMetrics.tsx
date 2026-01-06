import { CURRENT_LEGISLATURE_ROMAN, TOTAL_DEPUTIES } from '@/constants/parliament';
import { motion } from 'framer-motion';

const metrics = [
  {
    value: String(TOTAL_DEPUTIES),
    label: 'Deputados',
  },
  {
    value: '1,500+',
    label: 'Iniciativas',
  },
  {
    value: CURRENT_LEGISLATURE_ROMAN,
    label: 'Legislatura',
  },
  {
    value: 'Diariamente',
    label: 'Atualizações',
  },
];

const KeyMetrics = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="text-center"
        >
          <div className="text-3xl md:text-4xl font-light mb-2">{metric.value}</div>
          <div className="text-sm text-neutral-600">{metric.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default KeyMetrics;

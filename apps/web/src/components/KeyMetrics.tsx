import { motion } from 'framer-motion';

const metrics = [
  {
    value: '230+',
    label: 'Members of Parliament',
  },
  {
    value: '1,500+',
    label: 'Initiatives Tracked',
  },
  {
    value: '95%',
    label: 'Data Accuracy',
  },
  {
    value: '24/7',
    label: 'Real-time Updates',
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
          <div className="text-3xl md:text-4xl font-light mb-2">
            {metric.value}
          </div>
          <div className="text-sm text-neutral-600">{metric.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default KeyMetrics;

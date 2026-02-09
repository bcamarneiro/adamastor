import { motion } from 'framer-motion';
import { FileQuestion, Search, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant?: 'search' | 'data' | 'users' | 'custom';
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const defaultContent = {
  search: {
    icon: <Search className="h-12 w-12" />,
    title: 'Sem resultados',
    description: 'Não encontrámos nada com os critérios de pesquisa. Tenta ajustar os filtros.',
  },
  data: {
    icon: <FileQuestion className="h-12 w-12" />,
    title: 'Sem dados',
    description: 'Não há dados disponíveis de momento.',
  },
  users: {
    icon: <Users className="h-12 w-12" />,
    title: 'Sem deputados',
    description: 'Não há deputados que correspondam aos critérios.',
  },
  custom: {
    icon: <FileQuestion className="h-12 w-12" />,
    title: 'Vazio',
    description: '',
  },
};

export function EmptyState({
  variant = 'data',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const defaults = defaultContent[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <div className="mb-4 text-neutral-8">{icon || defaults.icon}</div>
      <h3 className="text-lg font-semibold text-neutral-12 mb-2">{title || defaults.title}</h3>
      {(description || defaults.description) && (
        <p className="text-neutral-11 max-w-md mb-6">{description || defaults.description}</p>
      )}
      {action}
    </motion.div>
  );
}

export default EmptyState;

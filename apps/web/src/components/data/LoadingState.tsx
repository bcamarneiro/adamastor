import { motion } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'card' | 'table' | 'grid' | 'inline';
  count?: number;
  className?: string;
}

export function LoadingState({ variant = 'card', count = 3, className }: LoadingStateProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-neutral-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        {/* Rows */}
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-4"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-neutral-4 bg-neutral-1 p-6"
          >
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-4 rounded-xl border border-neutral-4 bg-neutral-1 p-4"
        >
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-16" />
        </motion.div>
      ))}
    </div>
  );
}

export default LoadingState;

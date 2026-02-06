import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = 'Ocorreu um erro',
  message,
  error,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  const errorMessage = message || error?.message || 'Algo correu mal. Por favor tenta novamente.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-2">
        <AlertCircle className="h-8 w-8 text-danger-9" />
      </div>

      <h3 className="text-lg font-semibold text-neutral-12 mb-2">{title}</h3>

      <p className="text-neutral-11 max-w-md mb-6">{errorMessage}</p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
        {action}
      </div>
    </motion.div>
  );
}

export default ErrorState;

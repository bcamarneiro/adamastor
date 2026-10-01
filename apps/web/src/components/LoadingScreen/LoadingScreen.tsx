import { AnimatePresence, motion } from 'framer-motion';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';
import DebaixoDolhoLogo from '../ui/Icons/DebaixoDolhoLogo';

/**
 * LoadingScreen Component
 *
 * A branded loading screen that displays during React Query data fetches.
 * Features the Debaixo d'olho pixelated eye logo with a pulsing animation.
 *
 * Key features:
 * - Integrates with TanStack React Query via useGlobalLoading hook
 * - 200ms delay prevents flicker on fast requests
 * - Smooth enter/exit animations via Framer Motion
 * - Accessible with aria-live and role="status"
 * - Supports light and dark mode
 */
const LoadingScreen = () => {
  const { isLoading } = useGlobalLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading content"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Pulsing eye animation */}
            <motion.div
              animate={{
                scale: [0.95, 1, 0.95],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            >
              <DebaixoDolhoLogo size="lg" className="text-neutral-800 dark:text-neutral-100" />
            </motion.div>

            {/* Screen reader text */}
            <span className="sr-only">Loading...</span>

            {/* Visual loading text (subtle) */}
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
              className="text-sm text-neutral-500 dark:text-neutral-400"
            >
              A carregar...
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;

import { motion, useInView } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface StatCardProps {
  value: number | string;
  label: string;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  animate?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-neutral-2',
    text: 'text-neutral-12',
    icon: 'bg-neutral-3 text-neutral-11',
  },
  accent: {
    bg: 'bg-accent-2',
    text: 'text-accent-11',
    icon: 'bg-accent-3 text-accent-9',
  },
  success: {
    bg: 'bg-success-2',
    text: 'text-success-11',
    icon: 'bg-success-3 text-success-9',
  },
  warning: {
    bg: 'bg-warning-2',
    text: 'text-warning-11',
    icon: 'bg-warning-3 text-warning-9',
  },
  danger: {
    bg: 'bg-danger-2',
    text: 'text-danger-11',
    icon: 'bg-danger-3 text-danger-9',
  },
};

function AnimatedNumber({ value, animate }: { value: number; animate: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!animate || !isInView) {
      setDisplayValue(value);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();
    const startValue = 0;

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-expo)
      const eased = 1 - 2 ** (-10 * progress);
      const current = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, animate, isInView]);

  return <span ref={ref}>{displayValue.toLocaleString('pt-PT')}</span>;
}

export function StatCard({
  value,
  label,
  description,
  icon,
  trend,
  variant = 'default',
  animate = true,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isNumeric = typeof value === 'number';

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('rounded-2xl p-6 md:p-8', styles.bg, className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Value */}
          <div
            className={cn('text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight', styles.text)}
          >
            {isNumeric ? <AnimatedNumber value={value} animate={animate} /> : value}
          </div>

          {/* Label */}
          <div className="mt-2 text-sm md:text-base font-medium text-neutral-11">{label}</div>

          {/* Description */}
          {description && <div className="mt-1 text-sm text-neutral-9">{description}</div>}

          {/* Trend */}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success-9' : 'text-danger-9'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-neutral-9">vs. anterior</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', styles.icon)}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default StatCard;

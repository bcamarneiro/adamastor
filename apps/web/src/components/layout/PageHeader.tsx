import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  variant?: 'default' | 'dark';
  className?: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  variant = 'default',
  className,
}: PageHeaderProps) {
  const isDark = variant === 'dark';

  return (
    <header
      className={cn(
        'py-12 md:py-16 lg:py-20',
        isDark ? 'bg-neutral-12 text-white' : 'bg-neutral-1',
        className
      )}
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <motion.nav
              variants={fadeInUp}
              custom={0}
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm"
            >
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.label} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className={isDark ? 'text-neutral-8' : 'text-neutral-9'}>/</span>
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className={cn(
                        'hover:underline transition-colors',
                        isDark
                          ? 'text-neutral-8 hover:text-white'
                          : 'text-neutral-9 hover:text-neutral-12'
                      )}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={isDark ? 'text-white' : 'text-neutral-12'}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </motion.nav>
          )}

          {/* Title and Actions Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className={cn(
                'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
                isDark ? 'text-white' : 'text-neutral-12'
              )}
            >
              {title}
            </motion.h1>

            {actions && (
              <motion.div variants={fadeInUp} custom={2} className="flex items-center gap-3">
                {actions}
              </motion.div>
            )}
          </div>

          {/* Description */}
          {description && (
            <motion.p
              variants={fadeInUp}
              custom={2}
              className={cn('text-lg max-w-2xl', isDark ? 'text-neutral-8' : 'text-neutral-11')}
            >
              {description}
            </motion.p>
          )}
        </motion.div>
      </div>
    </header>
  );
}

export default PageHeader;

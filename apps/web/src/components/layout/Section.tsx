import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  variant?: 'light' | 'dark' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
  id?: string;
}

const sectionVariants = {
  light: 'bg-neutral-1',
  dark: 'bg-neutral-12',
  muted: 'bg-neutral-2',
};

const sizeVariants = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-24',
  lg: 'py-20 md:py-32',
};

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Section({
  children,
  variant = 'light',
  size = 'md',
  className,
  animate = true,
  id,
}: SectionProps) {
  const content = (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">{children}</div>
  );

  return (
    <section
      id={id}
      className={cn(sectionVariants[variant], sizeVariants[size], 'w-full', className)}
    >
      {animate ? (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeIn}
        >
          {content}
        </motion.div>
      ) : (
        content
      )}
    </section>
  );
}

export default Section;

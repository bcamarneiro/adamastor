import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BaseEntityCardProps {
  className?: string;
  animate?: boolean;
}

interface DeputyCardProps extends BaseEntityCardProps {
  name: string;
  photo?: string | null;
  party?: string;
  partyColor?: string;
  district?: string;
  href: string;
  score?: number;
  rank?: number;
}

interface PartyCardProps extends BaseEntityCardProps {
  name: string;
  acronym: string;
  color: string;
  deputyCount: number;
  href: string;
  logo?: string;
}

interface DistrictCardProps extends BaseEntityCardProps {
  name: string;
  deputyCount: number;
  href: string;
}

const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export function DeputyCard({
  name,
  photo,
  party,
  partyColor,
  district,
  href,
  score,
  rank,
  className,
  animate = true,
}: DeputyCardProps) {
  const content = (
    <Link
      to={href}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-neutral-4 bg-neutral-1 p-4',
        'hover:border-accent-7 hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      {/* Photo */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-3">
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-9">
            <Users className="h-6 w-6" />
          </div>
        )}
        {rank && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-12 text-xs font-bold text-white">
            {rank}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-12 truncate group-hover:text-accent-9 transition-colors">
            {name}
          </span>
          {party && (
            <Badge
              variant="secondary"
              className="shrink-0"
              style={{ backgroundColor: partyColor ? `${partyColor}20` : undefined }}
            >
              {party}
            </Badge>
          )}
        </div>
        {district && <div className="text-sm text-neutral-11 truncate">{district}</div>}
      </div>

      {/* Score */}
      {score !== undefined && (
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-neutral-12">{score}</div>
          <div className="text-xs text-neutral-9">pontos</div>
        </div>
      )}
    </Link>
  );

  if (!animate) return content;

  return <motion.div {...cardAnimation}>{content}</motion.div>;
}

export function PartyCard({
  name,
  acronym,
  color,
  deputyCount,
  href,
  logo,
  className,
  animate = true,
}: PartyCardProps) {
  const content = (
    <Link
      to={href}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-neutral-4 bg-neutral-1 p-4',
        'hover:border-accent-7 hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      {/* Logo/Color */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        {logo ? (
          <img src={logo} alt={acronym} className="h-8 w-8 object-contain" />
        ) : (
          <span className="text-lg font-bold" style={{ color }}>
            {acronym.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-neutral-12 group-hover:text-accent-9 transition-colors">
          {name}
        </div>
        <div className="text-sm text-neutral-11">
          {deputyCount} {deputyCount === 1 ? 'deputado' : 'deputados'}
        </div>
      </div>

      {/* Badge */}
      <Badge style={{ backgroundColor: color, color: 'white' }}>{acronym}</Badge>
    </Link>
  );

  if (!animate) return content;

  return <motion.div {...cardAnimation}>{content}</motion.div>;
}

export function DistrictCard({
  name,
  deputyCount,
  href,
  className,
  animate = true,
}: DistrictCardProps) {
  const content = (
    <Link
      to={href}
      className={cn(
        'group flex items-center justify-between rounded-xl border border-neutral-4 bg-neutral-1 p-4',
        'hover:border-accent-7 hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      <div className="font-semibold text-neutral-12 group-hover:text-accent-9 transition-colors">
        {name}
      </div>
      <Badge variant="secondary">
        {deputyCount} {deputyCount === 1 ? 'deputado' : 'deputados'}
      </Badge>
    </Link>
  );

  if (!animate) return content;

  return <motion.div {...cardAnimation}>{content}</motion.div>;
}

import type { DistrictStats } from '@/lib/supabase';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface PortugalMapProps {
  districts: DistrictStats[];
  className?: string;
}

// Map district slugs to SVG path IDs
const districtPaths: Record<string, string> = {
  'viana-do-castelo': 'M 85,20 L 95,15 L 110,20 L 115,35 L 100,45 L 85,40 Z',
  braga: 'M 100,45 L 115,35 L 135,40 L 140,55 L 120,65 L 100,55 Z',
  'vila-real': 'M 135,40 L 155,35 L 170,45 L 165,65 L 140,55 Z',
  braganca: 'M 155,35 L 180,30 L 200,40 L 195,60 L 170,55 L 165,45 Z',
  porto: 'M 85,40 L 100,55 L 120,65 L 115,85 L 90,80 L 80,60 Z',
  aveiro: 'M 80,60 L 90,80 L 85,100 L 65,95 L 60,75 Z',
  viseu: 'M 120,65 L 140,55 L 165,65 L 160,90 L 135,95 L 115,85 Z',
  guarda: 'M 165,65 L 195,60 L 210,75 L 205,100 L 175,100 L 160,90 Z',
  coimbra: 'M 85,100 L 115,85 L 135,95 L 130,120 L 100,125 L 80,115 Z',
  'castelo-branco': 'M 160,90 L 175,100 L 205,100 L 220,125 L 195,145 L 160,130 L 155,110 Z',
  leiria: 'M 65,95 L 85,100 L 80,115 L 100,125 L 95,150 L 65,145 L 55,120 Z',
  santarem: 'M 100,125 L 130,120 L 155,110 L 160,130 L 145,155 L 115,160 L 95,150 Z',
  portalegre: 'M 160,130 L 195,145 L 200,170 L 175,180 L 155,165 L 145,155 Z',
  lisboa: 'M 55,145 L 65,145 L 95,150 L 115,160 L 105,185 L 75,190 L 50,175 Z',
  setubal: 'M 75,190 L 105,185 L 120,210 L 100,235 L 70,230 L 60,205 Z',
  evora: 'M 115,160 L 145,155 L 155,165 L 160,195 L 140,215 L 120,210 L 105,185 Z',
  beja: 'M 100,235 L 120,210 L 140,215 L 155,245 L 130,270 L 95,265 Z',
  faro: 'M 70,230 L 100,235 L 95,265 L 130,270 L 145,290 L 100,300 L 65,285 L 55,255 Z',
  // Islands (positioned to the left of mainland)
  acores: 'M 15,80 L 45,80 L 45,110 L 15,110 Z',
  madeira: 'M 15,130 L 45,130 L 45,160 L 15,160 Z',
  europa: 'M 15,180 L 45,180 L 45,210 L 15,210 Z',
};

// Get color based on average work score
function getScoreColor(score: number | null): string {
  if (score === null) return 'fill-neutral-5';
  if (score >= 85) return 'fill-success-9';
  if (score >= 70) return 'fill-success-7';
  if (score >= 55) return 'fill-warning-9';
  if (score >= 40) return 'fill-warning-7';
  return 'fill-danger-9';
}

function getScoreColorHex(score: number | null): string {
  if (score === null) return '#e5e5e5';
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#4ade80';
  if (score >= 55) return '#f59e0b';
  if (score >= 40) return '#fbbf24';
  return '#ef4444';
}

export function PortugalMap({ districts, className }: PortugalMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictStats | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Create a lookup by slug
  const districtBySlug = districts.reduce(
    (acc, d) => {
      // Extract slug from name (lowercase, replace spaces with hyphens)
      const slug = d.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');
      acc[slug] = d;
      return acc;
    },
    {} as Record<string, DistrictStats>
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className={cn('relative', className)}>
      <svg viewBox="0 0 230 320" className="w-full h-auto" role="img" aria-label="Mapa de Portugal">
        <title>Mapa de Portugal por Distritos</title>

        {/* Legend */}
        <g transform="translate(170, 10)">
          <text x="0" y="0" className="text-[8px] fill-neutral-11" fontWeight="600">
            Pontuacao
          </text>
          <rect x="0" y="5" width="12" height="8" fill="#22c55e" rx="1" />
          <text x="16" y="12" className="text-[6px] fill-neutral-10">
            A (85+)
          </text>
          <rect x="0" y="16" width="12" height="8" fill="#4ade80" rx="1" />
          <text x="16" y="23" className="text-[6px] fill-neutral-10">
            B (70+)
          </text>
          <rect x="0" y="27" width="12" height="8" fill="#f59e0b" rx="1" />
          <text x="16" y="34" className="text-[6px] fill-neutral-10">
            C (55+)
          </text>
          <rect x="0" y="38" width="12" height="8" fill="#fbbf24" rx="1" />
          <text x="16" y="45" className="text-[6px] fill-neutral-10">
            D (40+)
          </text>
          <rect x="0" y="49" width="12" height="8" fill="#ef4444" rx="1" />
          <text x="16" y="56" className="text-[6px] fill-neutral-10">
            F (&lt;40)
          </text>
        </g>

        {/* Islands labels */}
        <text x="30" y="75" textAnchor="middle" className="text-[7px] fill-neutral-11">
          Acores
        </text>
        <text x="30" y="125" textAnchor="middle" className="text-[7px] fill-neutral-11">
          Madeira
        </text>
        <text x="30" y="175" textAnchor="middle" className="text-[7px] fill-neutral-11">
          Europa
        </text>

        {/* District paths */}
        {Object.entries(districtPaths).map(([slug, path]) => {
          const district = districtBySlug[slug];
          const score = district?.avg_work_score ?? null;

          return (
            <Link key={slug} to={`/distrito/${slug}`}>
              <path
                d={path}
                fill={getScoreColorHex(score)}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:stroke-2"
                onMouseEnter={() => district && setHoveredDistrict(district)}
                onMouseLeave={() => setHoveredDistrict(null)}
                onMouseMove={handleMouseMove}
              />
            </Link>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredDistrict && (
        <div
          className="fixed z-50 bg-neutral-12 text-neutral-1 px-3 py-2 rounded-lg shadow-lg pointer-events-none text-sm"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
          }}
        >
          <div className="font-semibold">{hoveredDistrict.name}</div>
          <div className="text-neutral-4 text-xs">
            {hoveredDistrict.active_deputies} deputados •{' '}
            {hoveredDistrict.avg_work_score?.toFixed(1) ?? 'N/A'} pts
          </div>
        </div>
      )}
    </div>
  );
}

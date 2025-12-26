import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DeputyDetail } from '../../lib/supabase';
import { useFullRankings } from '../../services/leaderboard/useFullRankings';
import { GradeCircle } from '../ReportCard/GradeCircle';

interface FullRankingsProps {
  partyId?: string | null;
  districtId?: string | null;
}

export function FullRankings({ partyId, districtId }: FullRankingsProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useFullRankings(page, pageSize, {
    partyId,
    districtId,
  });

  const { deputies = [], total = 0, totalPages = 1 } = data || {};

  if (isLoading && deputies.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-4 p-4 bg-neutral-1 rounded-lg"
          >
            <div className="w-10 h-6 bg-neutral-4 rounded" />
            <div className="w-12 h-12 bg-neutral-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-4 rounded w-1/3" />
              <div className="h-3 bg-neutral-4 rounded w-1/4" />
            </div>
            <div className="w-10 h-10 bg-neutral-4 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-neutral-11">
        <span>
          {total} deputado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </span>
        <span>
          Pagina {page} de {totalPages}
        </span>
      </div>

      {/* Rankings table */}
      <div className="bg-neutral-1 rounded-xl shadow-sm border border-neutral-5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-2 border-b border-neutral-5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-11 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-11 uppercase tracking-wider">
                Deputado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-11 uppercase tracking-wider hidden sm:table-cell">
                Partido
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-11 uppercase tracking-wider hidden md:table-cell">
                Distrito
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-11 uppercase tracking-wider">
                Nota
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-4">
            {deputies.map((deputy: DeputyDetail) => (
              <tr key={deputy.id} className="hover:bg-neutral-2 transition-colors">
                <td className="px-4 py-3 text-sm text-neutral-11 font-medium">
                  {deputy.national_rank}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/deputado/${deputy.id}`}
                    className="flex items-center gap-3 hover:text-accent-9"
                  >
                    {deputy.photo_url ? (
                      <img
                        src={deputy.photo_url}
                        alt={deputy.short_name}
                        className="w-10 h-10 rounded-full object-cover bg-neutral-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-5 flex items-center justify-center">
                        <span className="text-neutral-9 text-sm">?</span>
                      </div>
                    )}
                    <span className="font-medium text-neutral-12">{deputy.short_name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {deputy.party_acronym && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: deputy.party_color
                          ? `${deputy.party_color}20`
                          : 'var(--color-neutral-4)',
                        color: deputy.party_color || 'var(--color-neutral-11)',
                      }}
                    >
                      {deputy.party_acronym}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-11 hidden md:table-cell">
                  {deputy.district_name || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end">
                    <GradeCircle grade={deputy.grade} score={deputy.work_score} size="sm" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-neutral-3 text-neutral-11 hover:bg-neutral-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-accent-9 text-monochrome-white'
                      : 'bg-neutral-3 text-neutral-11 hover:bg-neutral-4'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-neutral-3 text-neutral-11 hover:bg-neutral-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

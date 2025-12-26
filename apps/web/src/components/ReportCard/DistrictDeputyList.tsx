import type { DeputyDetail, District } from '../../lib/supabase';
import { DeputyCard } from './DeputyCard';

interface DistrictDeputyListProps {
  district: District;
  deputies: DeputyDetail[];
  isLoading: boolean;
}

export function DistrictDeputyList({ district, deputies, isLoading }: DistrictDeputyListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-12">Deputados de {district.name}</h2>
          <p className="text-neutral-9">A carregar...</p>
        </div>
        {/* Skeleton loading */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-4 p-4 bg-neutral-1 rounded-lg shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-4" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-4 rounded w-1/3" />
              <div className="h-3 bg-neutral-4 rounded w-1/4" />
            </div>
            <div className="w-12 h-12 rounded-full bg-neutral-4" />
          </div>
        ))}
      </div>
    );
  }

  if (deputies.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-neutral-12">Deputados de {district.name}</h2>
        <p className="text-neutral-9 mt-2">
          Nao foram encontrados deputados ativos para este distrito.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-12">Deputados de {district.name}</h2>
        <p className="text-neutral-9">
          {deputies.length} deputado{deputies.length !== 1 ? 's' : ''} ativo
          {deputies.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-3">
        {deputies.map((deputy) => (
          <DeputyCard key={deputy.id} deputy={deputy} />
        ))}
      </div>
    </div>
  );
}

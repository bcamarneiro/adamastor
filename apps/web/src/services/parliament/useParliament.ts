import type { MP, ParliamentData } from '@/types/parliament';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

type ParliamentMetadata = {
  total: number;
  totalByParty: Record<string, number>;
  totalByDistrict: Record<string, number>;
  totalByStatus: Record<string, number>;
};

export const useParliament = () => {
  const fetchParliament = useCallback(async (): Promise<ParliamentData> => {
    const response = await fetch(import.meta.env.VITE_BASE_INFO_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch parliament data: ${response.status}`);
    }

    return response.json();
  }, []);

  const { isError, isFetching, isSuccess, data, error } = useQuery({
    queryKey: ['parliament'],
    queryFn: fetchParliament,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const parsedData = useMemo(() => {
    if (!data) return { CirculosEleitorais: [], Deputados: [] };

    // Parse dates in MP data
    const parsedMPs = data.Deputados.map((mp: MP) => ({
      ...mp,
      DepGP: mp.DepGP.map((group) => ({
        ...group,
        gpDtInicio: new Date(group.gpDtInicio),
        gpDtFim: new Date(group.gpDtFim),
      })),
      DepSituacao: mp.DepSituacao.map((situation) => ({
        ...situation,
        sioDtInicio: new Date(situation.sioDtInicio),
        sioDtFim: situation.sioDtFim ? new Date(situation.sioDtFim) : null,
      })),
    }));

    return {
      CirculosEleitorais: data.CirculosEleitorais,
      Deputados: parsedMPs,
    };
  }, [data]);

  const metadata = useMemo<ParliamentMetadata>(() => {
    if (!parsedData.Deputados.length) {
      return {
        total: 0,
        totalByParty: {},
        totalByDistrict: {},
        totalByStatus: {},
      };
    }

    const totalByParty = parsedData.Deputados.reduce(
      (acc, mp) => {
        // Get current party (most recent parliamentary group)
        const currentParty = mp.DepGP[mp.DepGP.length - 1]?.gpSigla;
        if (currentParty) {
          acc[currentParty] = (acc[currentParty] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalByDistrict = parsedData.Deputados.reduce(
      (acc, mp) => {
        acc[mp.DepCPDes] = (acc[mp.DepCPDes] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalByStatus = parsedData.Deputados.reduce(
      (acc, mp) => {
        // Get current status (most recent situation)
        const currentStatus = mp.DepSituacao[mp.DepSituacao.length - 1]?.sioDes;
        if (currentStatus) {
          acc[currentStatus] = (acc[currentStatus] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: parsedData.Deputados.length,
      totalByParty,
      totalByDistrict,
      totalByStatus,
    };
  }, [parsedData]);

  // Helper functions
  const getCurrentParty = useCallback((mp: MP) => {
    return mp.DepGP[mp.DepGP.length - 1]?.gpSigla || null;
  }, []);

  const getCurrentStatus = useCallback((mp: MP) => {
    return mp.DepSituacao[mp.DepSituacao.length - 1]?.sioDes || null;
  }, []);

  const getDistrictMPs = useCallback(
    (districtId: number) => {
      return parsedData.Deputados.filter((mp) => mp.DepCPId === districtId);
    },
    [parsedData.Deputados],
  );

  const getPartyMPs = useCallback(
    (partySigla: string) => {
      return parsedData.Deputados.filter(
        (mp) => mp.DepGP[mp.DepGP.length - 1]?.gpSigla === partySigla,
      );
    },
    [parsedData.Deputados],
  );

  return {
    parliament: parsedData,
    metadata,
    isLoading: isFetching,
    isError,
    isSuccess,
    error,
    // Helper functions
    getCurrentParty,
    getCurrentStatus,
    getDistrictMPs,
    getPartyMPs,
  };
};

/**
 * Type definitions for deputy transformation
 */

export interface ParliamentDeputado {
  DepId: number;
  DepCadId: number;
  DepNomeCompleto: string;
  DepNomeParlamentar: string;
  DepCPId: number;
  DepCPDes: string;
  DepGP: Array<{
    gpId: number;
    gpSigla: string;
    gpDtInicio: string;
    gpDtFim: string | null;
  }>;
  DepSituacao: Array<{
    sioDes: string;
    sioDtInicio: string;
    sioDtFim: string | null;
  }>;
  DepCargo: Array<{
    carId: number;
    carDes: string;
    carDtInicio: string;
    carDtFim: string | null;
  }> | null;
  LegDes: string;
}

export interface DeputyMaps {
  byDepId: Map<number, string>; // DepId -> UUID
  byCadastroId: Map<number, string>; // DepCadId -> UUID (for initiative authors)
}

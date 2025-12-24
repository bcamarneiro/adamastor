// Electoral District Interface
export interface ElectoralDistrict {
  cpDes: string; // District name
  cpId: number; // District ID
  legDes: string; // Legislature designation
}

// Parliamentary Group Interface
export interface ParliamentaryGroup {
  gpDtFim: string; // End date
  gpDtInicio: string; // Start date
  gpId: number; // Group ID
  gpSigla: string; // Group acronym
}

// MP Situation Interface
export interface MPSituation {
  sioDes: string; // Situation description (e.g., "Efetivo", "Suspenso", etc.)
  sioDtFim: string | null; // End date (can be null)
  sioDtInicio: string; // Start date
}

// Member of Parliament Interface
export interface MP {
  DepCadId: number; // MP registration ID
  DepCargo: string | null; // MP position/role
  DepCPDes: string; // Electoral district name
  DepCPId: number; // Electoral district ID
  DepGP: ParliamentaryGroup[]; // Parliamentary groups history
  DepId: number; // MP ID
  DepNomeCompleto: string; // Full name
  DepNomeParlamentar: string; // Parliamentary name
  DepSituacao: MPSituation[]; // Situations history
  LegDes: string; // Legislature designation
  Videos: any | null; // Videos (type can be refined based on actual data)
}

// Root Data Interface
export interface ParliamentData {
  CirculosEleitorais: ElectoralDistrict[];
  Deputados: MP[];
}

// Enums for common values
export enum MPStatus {
  EFETIVO = 'Efetivo',
  SUSPENSO_ELEITO = 'Suspenso(Eleito)',
  SUSPENSO_NAO_ELEITO = 'Suspenso(Não Eleito)',
  SUPLENTE = 'Suplente',
  EFETIVO_TEMPORARIO = 'Efetivo Temporário',
  RENUNCIOU = 'Renunciou',
}

// Helper type for party acronyms based on observed data
export type PartyAcronym = 'PSD' | 'PS' | 'IL' | 'PCP' | 'CDS-PP' | string;

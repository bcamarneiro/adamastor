// Parliament API types

export interface ParliamentDeputado {
  DepId: number;
  DepCadId: number;
  DepNomeCompleto: string;
  DepNomeParlamentar: string;
  DepCPId: number;
  DepCPDes: string;
  DepCargo: string | null;
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
  LegDes: string;
  Videos: unknown;
}

export interface ParliamentGrupoParlamentar {
  sigla: string;
  nome: string;
}

export interface ParliamentCirculoEleitoral {
  cpId: number;
  cpDes: string;
  legDes: string;
}

export interface ParliamentInformacaoBase {
  Deputados: ParliamentDeputado[];
  GruposParlamentares: ParliamentGrupoParlamentar[];
  CirculosEleitorais: ParliamentCirculoEleitoral[];
  DetalheLegislatura: {
    LegId: number;
    LegDes: string;
    LegDataInicio: string;
    LegDataFim: string | null;
  };
}

export interface ParliamentVotacao {
  id: string;
  data: string;
  descricao: string | null;
  detalhe: string;
  resultado: string;
  reuniao: string;
  tipoReuniao: string;
  unanime: string | null;
  ausencias: unknown;
  publicacao: unknown;
}

export interface ParliamentEvento {
  EvtId: string;
  OevId: string;
  Fase: string;
  CodigoFase: string;
  DataFase: string;
  Votacao: ParliamentVotacao[] | null;
  // ... other fields we don't need
}

export interface ParliamentIniciativa {
  IniId: number;
  IniDescTipo: string;
  IniNr: string;
  IniTitulo: string;
  DataInicioleg: string;
  DataFimleg: string | null;
  IniAutorDeputados: Array<{
    depId: number;
    depNome: string;
    depGP: string;
  }> | null;
  IniAutorGruposParlamentares: Array<{
    gpId: number;
    gpSigla: string;
  }> | null;
  IniAutorOutros: {
    nome: string;
    sigla: string;
  } | null;
  IniEventos: ParliamentEvento[];
}

export interface ParliamentDebate {
  DebateId: string;
  Assunto: string;
  AutoresDeputados: string | null;
  AutoresGP: string | null;
  DataDebate: string;
  DataEntrada: string;
  Intervencoes: string[];
  TipoDebateDesig: string;
}

export interface ParliamentAtividades {
  Debates: ParliamentDebate[];
  Audiencias: unknown[];
  // ... other types
}

// Database types

export interface DbParty {
  id?: string;
  external_id: number;
  acronym: string;
  name: string;
  color?: string;
}

export interface DbDistrict {
  id?: string;
  external_id: number;
  name: string;
  deputy_count?: number;
  postal_prefixes?: string[];
}

export interface DbDeputy {
  id?: string;
  external_id: number;
  name: string;
  short_name: string;
  photo_url?: string;
  party_id?: string;
  district_id?: string;
  is_active: boolean;
  mandate_start?: string;
  mandate_end?: string;
  legislature: string;
}

export interface DbInitiative {
  id?: string;
  external_id: number;
  type: string;
  number?: string;
  title?: string;
  status?: string;
  submitted_at?: string;
}

export interface DbPartyVote {
  id?: string;
  external_id: string;
  initiative_id?: string;
  session_number?: number;
  voted_at: string;
  result?: 'approved' | 'rejected';
  is_unanimous: boolean;
  parties_favor: string[];
  parties_against: string[];
  parties_abstain: string[];
}

export interface DbDeputyStats {
  deputy_id: string;
  proposal_count: number;
  intervention_count: number;
  question_count: number;
  party_votes_favor: number;
  party_votes_against: number;
  party_votes_abstain: number;
  party_total_votes: number;
}

import { supabase } from '../supabase.js';
import { getInitiativeStatus, parsePartyVoteDetail } from './initiatives-helpers.js';

interface ParliamentVotacao {
  id: string;
  data: string;
  descricao: string | null;
  detalhe: string;
  resultado: string;
  reuniao: string;
  tipoReuniao: string;
  unanime: string | null;
}

interface ParliamentEvento {
  EvtId: string;
  OevId: string;
  Fase: string;
  CodigoFase: string;
  DataFase: string;
  Votacao: ParliamentVotacao[] | null;
}

interface ParliamentIniciativa {
  IniId: number | string; // API returns string
  IniDescTipo: string;
  IniNr: string;
  IniTitulo: string;
  IniAutorDeputados: Array<{ idCadastro: string; nome: string; GP: string }> | null;
  IniAutorGruposParlamentares: Array<{ gpId: number; gpSigla: string }> | null;
  IniEventos: ParliamentEvento[];
}

interface DbPartyVote {
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

export async function transformInitiatives(
  iniciativas: ParliamentIniciativa[],
  deputyMap: Map<number, string>
): Promise<{
  initiativeMap: Map<string, string>;
  partyVotes: DbPartyVote[];
  authorCounts: Map<string, number>;
  questionCounts: Map<string, number>;
}> {
  console.log(`📦 Transforming ${iniciativas.length} initiatives...`);

  const initiativeMap = new Map<string, string>(); // external_id (string) -> uuid
  const partyVotes: DbPartyVote[] = [];
  const authorCounts = new Map<string, number>(); // deputy_id -> count (all initiatives)
  const questionCounts = new Map<string, number>(); // deputy_id -> count (questions only)

  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < iniciativas.length; i += batchSize) {
    const batch = iniciativas.slice(i, i + batchSize);
    const initiatives = batch.map((ini) => ({
      external_id: String(ini.IniId), // TEXT in database
      type: ini.IniDescTipo,
      number: ini.IniNr || undefined,
      title: (ini.IniTitulo || 'Sem título').substring(0, 500),
      status: getInitiativeStatus(ini),
      submitted_at: ini.IniEventos?.find((e) => e.CodigoFase === '10')?.DataFase || undefined,
    }));

    // Upsert initiatives
    const { data, error } = await supabase
      .from('initiatives')
      .upsert(initiatives, { onConflict: 'external_id' })
      .select('id, external_id');

    if (error) {
      console.error(`  ❌ Error upserting initiatives batch ${i}:`, error.message);
      continue;
    }

    // Map external IDs to UUIDs (use string keys since API returns string IDs)
    for (const ini of data || []) {
      initiativeMap.set(String(ini.external_id), ini.id);
    }

    // Process authors and votes
    for (const ini of batch) {
      const initiativeId = initiativeMap.get(String(ini.IniId));
      if (!initiativeId) continue;

      // Detect if this initiative is a question (Pergunta) or request (Requerimento)
      const isQuestion =
        ini.IniDescTipo?.toLowerCase().includes('pergunta') ||
        ini.IniDescTipo?.toLowerCase().includes('requerimento');

      // Count deputy authors (for proposals stat)
      if (ini.IniAutorDeputados) {
        for (const autor of ini.IniAutorDeputados) {
          // idCadastro is a string, but deputyMap uses DepId (number) as key
          const cadastroId = Number.parseInt(autor.idCadastro, 10);
          const deputyId = deputyMap.get(cadastroId);
          if (deputyId) {
            authorCounts.set(deputyId, (authorCounts.get(deputyId) || 0) + 1);

            // Count questions separately
            if (isQuestion) {
              questionCounts.set(deputyId, (questionCounts.get(deputyId) || 0) + 1);
            }
          }
        }
      }

      // Extract party votes
      for (const evento of ini.IniEventos || []) {
        if (evento.Votacao) {
          for (const voto of evento.Votacao) {
            const { favor, against, abstain } = parsePartyVoteDetail(voto.detalhe || '');

            partyVotes.push({
              external_id: voto.id,
              initiative_id: initiativeId,
              session_number: Number.parseInt(voto.reuniao) || undefined,
              voted_at: voto.data,
              result: voto.resultado?.toLowerCase().includes('aprovad') ? 'approved' : 'rejected',
              is_unanimous: voto.unanime === 'Sim',
              parties_favor: favor,
              parties_against: against,
              parties_abstain: abstain,
            });
          }
        }
      }
    }

    process.stdout.write(
      `  Processed ${Math.min(i + batchSize, iniciativas.length)}/${iniciativas.length}\r`
    );
  }

  console.log(`\n✅ Initiatives: ${initiativeMap.size} loaded, ${partyVotes.length} votes found`);
  console.log(`   Questions identified: ${questionCounts.size} deputies with questions\n`);

  return { initiativeMap, partyVotes, authorCounts, questionCounts };
}

export async function upsertPartyVotes(votes: DbPartyVote[]): Promise<void> {
  console.log(`📦 Upserting ${votes.length} party votes...`);

  const batchSize = 100;
  let upserted = 0;

  for (let i = 0; i < votes.length; i += batchSize) {
    const batch = votes.slice(i, i + batchSize);

    const { error } = await supabase
      .from('party_votes')
      .upsert(batch, { onConflict: 'external_id' });

    if (error) {
      console.error(`  ❌ Error upserting votes batch ${i}:`, error.message);
      continue;
    }

    upserted += batch.length;
    process.stdout.write(`  Upserted ${upserted}/${votes.length}\r`);
  }

  console.log(`\n✅ Party votes: ${upserted} upserted\n`);
}

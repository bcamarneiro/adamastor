import { cn } from '@/utils/cn';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface HelpTooltipProps {
  content: ReactNode;
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  iconClassName?: string;
  delayDuration?: number;
}

export function HelpTooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
  delayDuration = 200,
}: HelpTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center p-0.5 rounded-full text-neutral-9 hover:text-neutral-11 hover:bg-neutral-3 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-9',
                iconClassName
              )}
              aria-label="Ajuda"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={5}
            className={cn(
              'z-50 max-w-xs px-3 py-2 text-sm bg-neutral-12 text-neutral-1 rounded-lg shadow-lg',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              className
            )}
          >
            {content}
            <Tooltip.Arrow className="fill-neutral-12" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// Pre-defined help texts for common metrics
export const HELP_TEXTS = {
  workScore:
    'Pontuacao calculada com base em propostas (50%), intervencoes (35%) e perguntas (15%). Quanto maior, melhor o desempenho.',
  grade:
    'Nota atribuida com base na pontuacao: A (≥120), B (≥90), C (≥60), D (≥30), F (<30). A media nacional e 100.',
  nationalRank: 'Posicao do deputado entre os 230 deputados ativos da Assembleia da Republica.',
  districtRank: 'Posicao do deputado entre os deputados eleitos pelo mesmo circulo eleitoral.',
  attendance:
    'Percentagem de sessoes plenarias em que o deputado esteve presente, com base nos registos oficiais.',
  attendanceRate:
    'Percentagem de sessoes plenarias em que o deputado esteve presente, com base nos registos oficiais.',
  proposals:
    'Numero de iniciativas legislativas (projetos de lei, resolucao, etc.) em que o deputado e autor ou coautor.',
  interventions:
    'Numero de vezes que o deputado interveio em plenario, incluindo debates, declaracoes e perguntas.',
  questions: 'Numero de perguntas formais submetidas ao Governo ou a outras entidades.',
  partyVotes:
    'Como o deputado votou em relacao a posicao maioritaria do seu partido. Votos a favor, contra ou abstencao.',
  partyVoting:
    'Resumo de como o partido votou em todas as iniciativas parlamentares. Mostra a percentagem de votos a favor, contra e abstencoes.',
  avgScore: 'Media das pontuacoes de todos os deputados ativos do partido.',
  topWorkers:
    'Deputados com maior atividade parlamentar, considerando propostas apresentadas, intervencoes em debates e perguntas ao Governo.',
  bottomWorkers:
    'Deputados com menor atividade parlamentar. A pontuacao baixa pode indicar falta de participacao nos trabalhos da Assembleia.',
  partyRanking:
    'Ranking calculado com base na media de pontuacao de todos os deputados ativos de cada partido.',
  districtRanking:
    'Ranking calculado com base na media de pontuacao de todos os deputados ativos eleitos por cada circulo eleitoral.',
  fullRanking:
    'Lista completa de todos os deputados ordenados por pontuação de atividade parlamentar. Podes filtrar por partido, distrito ou nota.',
};

# Metodologia

Esta página explica como calculamos as pontuações, notas e rankings dos deputados no Debaixo d'Olho.

## Pontuação de Trabalho (pts)

A pontuação de trabalho é uma métrica composta que combina quatro indicadores da atividade parlamentar de cada deputado:

| Componente | Peso | Descrição |
|------------|------|-----------|
| **Assiduidade** | 40% | Percentagem de presenças nas sessões plenárias |
| **Propostas** | 30% | Iniciativas legislativas apresentadas (projetos de lei, resoluções, etc.) |
| **Intervenções** | 20% | Participações em debates parlamentares |
| **Perguntas** | 10% | Requerimentos e perguntas ao Governo |

### Como funciona o cálculo

Para cada componente (exceto assiduidade), comparamos a atividade do deputado com a **média nacional** de todos os deputados ativos:

- Se um deputado tem o dobro da média de propostas, recebe 200% nesse componente
- Se tem metade da média, recebe 50%
- Cada componente é **limitado a 200%** para evitar que outliers distorçam os resultados

**Fórmula simplificada:**
```
Pontuação = (Assiduidade × 0.40) +
            (Propostas/Média × 0.30) +
            (Intervenções/Média × 0.20) +
            (Perguntas/Média × 0.10)
```

### Nota sobre as Intervenções em Debates

A API do Parlamento fornece o número total de intervenções em debates apenas ao nível do partido — não por deputado individual. Para obter um valor por deputado, dividimos o total do partido de forma igual por todos os deputados ativos desse partido. Isto significa que o componente de intervenções é uma **estimativa ao nível do partido**, não uma contagem real das intervenções individuais de cada deputado. Um deputado que nunca interveio num debate recebe o mesmo valor que um colega de partido que falou dezenas de vezes.

## Sistema de Notas

As notas de A a F são atribuídas com base na pontuação de trabalho:

| Nota | Pontuação Mínima | Descrição |
|------|------------------|-----------|
| **A** | ≥ 85 pts | Excelente - Acima da média em todos os indicadores |
| **B** | ≥ 70 pts | Bom - Acima da média na maioria dos indicadores |
| **C** | ≥ 55 pts | Suficiente - Na média ou ligeiramente abaixo |
| **D** | ≥ 40 pts | Insuficiente - Abaixo da média |
| **F** | < 40 pts | Fraco - Muito abaixo da média |

## Rankings

### Ranking Nacional
Ordenamos todos os 230 deputados ativos por pontuação de trabalho, do mais alto para o mais baixo.

### Ranking Distrital
Dentro de cada círculo eleitoral, ordenamos os deputados locais pela mesma pontuação.

**Nota:** Apenas deputados ativos são incluídos nos rankings. Deputados suspensos, substituídos ou que deixaram funções não aparecem.

## Fontes de Dados

Todos os dados são obtidos de fontes públicas oficiais:

| Fonte | Dados |
|-------|-------|
| **API do Parlamento** | Deputados, partidos, círculos eleitorais |
| **parlamento.pt** | Iniciativas, votações, intervenções |
| **Registos Plenários** | Presenças e ausências |

### Frequência de Atualização

Os dados são atualizados **diariamente** através de um processo automático que:
1. Consulta as fontes oficiais
2. Processa e normaliza os dados
3. Recalcula todas as pontuações e rankings

## Limitações

É importante compreender o que esta metodologia **não mede**:

- **Qualidade das propostas** - Apenas contamos quantidade, não avaliamos mérito
- **Trabalho em comissões** - As comissões parlamentares não estão incluídas nesta versão
- **Trabalho no círculo** - Atividades locais fora do Parlamento não são captadas
- **Negociações** - Trabalho de bastidores e negociação entre partidos
- **Cargos governativos** - Deputados com cargos no Governo têm naturalmente menos atividade parlamentar

### Deputados com pontuação zero

Alguns deputados aparecem com 0 pontos. Isto pode acontecer quando:
- O deputado foi eleito recentemente e ainda não tem atividade registada
- O deputado está suspenso ou foi substituído
- O deputado é suplente e ainda não tomou posse efetiva

## Código Aberto

Todo o código que calcula estas métricas está disponível no nosso repositório GitHub:
- [Função de cálculo de pontuação](https://github.com/bcamarneiro/adamastor/blob/main/supabase/migrations/20241224000003_functions.sql)
- [Pipeline de dados](https://github.com/bcamarneiro/adamastor/tree/main/apps/watcher)

Qualquer pessoa pode verificar e auditar a metodologia.

---

*Última atualização: Dezembro 2025*

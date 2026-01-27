# QA Testing Workflow

> Workflow completo de coordenação entre Discussions, Issues e Project Board

## 🎯 Visão Geral

Este documento define como testers, maintainers e contributors colaboram através de GitHub Discussions, Issues e Project Board.

## 👥 Roles

### 1️⃣ TESTER (não-técnico)
**Objetivo**: Encontrar bugs e reportar problemas

**Ferramentas**:
- GitHub Discussions (reportar)
- PRODUÇÃO: https://adamastor-prod.vercel.app (testar)
- STAGING: https://adamastor-staging.vercel.app (validar correções)

**Workflow**:
1. Testa em PRODUÇÃO
2. Procura se o problema já foi reportado em Discussions
3. Cria nova discussion na categoria apropriada
4. Aguarda feedback do maintainer
5. (Opcional) Valida correção em STAGING quando pedido
6. Recebe notificação quando resolvido em PRODUÇÃO

**NÃO fazer**:
- ❌ Criar GitHub Issues (usa Discussions)
- ❌ Fazer PRs sem conversar primeiro
- ❌ Testar apenas em STAGING (testa em PRODUÇÃO)

---

### 2️⃣ MAINTAINER (tu)
**Objetivo**: Validar reports, criar issues, corrigir bugs

**Ferramentas**:
- GitHub Discussions (triagem)
- GitHub Issues (tracking)
- GitHub CLI (`gh`)
- Project Board (opcional, organização)

**Workflow diário** (10-15 min):

```bash
# 1. Ver discussions novas
gh api repos/bcamarneiro/adamastor/discussions \
  --jq '.[] | select(.category.name | contains("Testing")) | {number, title, url}'

# 2. Para cada discussion:
# - Ler descrição
# - Reproduzir bug em staging/prod
# - Procurar duplicados

# 3. Se válido, criar issue:
gh issue create \
  --title "Bug: [descrição]" \
  --body "Reportado em: https://github.com/bcamarneiro/adamastor/discussions/XXX

## Problema
[Copia da discussion]

## Validação
- [ ] Reproduzido em staging
- [ ] Corrigido e testado
- [ ] Deploy para produção" \
  --label "type:bug,status:from-qa,page:classificacao,severity:medium"

# 4. Comentar na discussion original:
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="✅ Issue criada: #YYY - Vou trabalhar nisto!"

# 5. Corrigir bug (branch, PR to staging, merge)

# 6. Após merge em staging, pedir validação:
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="🔧 **Correção implementada em STAGING**

Podes testar aqui: https://adamastor-staging.vercel.app/[página]

Se confirmares que está resolvido, faço deploy para PRODUÇÃO! 🚀"

# 7. Após validação, deploy para produção

# 8. Confirmar resolução:
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="✅ **Correção em PRODUÇÃO!**

O bug foi resolvido: https://adamastor-prod.vercel.app

Obrigado pelo report! 🎉"
```

**Labels a usar**:
- `status:from-qa` - Veio de testing comunitário
- `page:*` - classificacao, batalha-real, distritos, etc
- `type:*` - bug, ux, enhancement, data
- `severity:*` - critical, high, medium, low

**Project Board** (opcional):
- Adiciona issues ao board com `gh project item-add`
- Organiza por status, página, ou prioridade

---

### 3️⃣ CONTRIBUTOR (código)
**Objetivo**: Corrigir bugs identificados

**Ferramentas**:
- GitHub Issues (escolher trabalho)
- GitHub Project Board (ver prioridades)
- Local dev environment

**Workflow**:

```bash
# 1. Ver issues disponíveis
gh issue list --label "status:from-qa" --state open

# ou via Project Board:
# https://github.com/bcamarneiro/adamastor/projects/1

# 2. Escolher issue com labels claras

# 3. Seguir CONTRIBUTING.md:
git checkout staging
git pull origin staging
git checkout -b fix/issue-XXX-description

# 4. Corrigir bug, adicionar testes

# 5. Submeter PR
gh pr create --base staging --title "Fix #XXX: description"

# 6. Aguardar review e merge
```

---

## 📊 Fluxo Visual

```
┌─────────────────────────────────────────────────┐
│         TESTER reporta em Discussions           │
│   (categoria: Testing: Classificação)           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│    MAINTAINER lê e valida (reproduz bug)        │
│                                                  │
│  ✓ Válido?  →  Cria Issue + comenta discussion  │
│  ✗ Inválido? → Explica e fecha discussion       │
│  ✗ Duplicado? → Redireciona para existente      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      Issue criada (com labels apropriadas)      │
│   Adicionada ao Project Board (opcional)        │
└────────────────┬────────────────────────────────┘
                 │
                 ├──► MAINTAINER corrige
                 │    (ou)
                 └──► CONTRIBUTOR pega issue do board
                      │
                      ▼
                ┌─────────────────────────────┐
                │  PR submetido para staging  │
                │  Review → Merge             │
                └─────────┬───────────────────┘
                          │
                          ▼
                ┌─────────────────────────────┐
                │  MAINTAINER comenta:        │
                │  "Está em staging, valida?" │
                └─────────┬───────────────────┘
                          │
                          ▼
                ┌─────────────────────────────┐
                │  TESTER valida em STAGING   │
                │  ✓ Resolvido!               │
                └─────────┬───────────────────┘
                          │
                          ▼
                ┌─────────────────────────────┐
                │  Deploy staging → produção  │
                └─────────┬───────────────────┘
                          │
                          ▼
                ┌─────────────────────────────┐
                │  MAINTAINER comenta:        │
                │  "Resolvido em PRODUÇÃO! ✅" │
                │  Fecha issue                │
                └─────────────────────────────┘
```

---

## 🏷️ Sistema de Labels

### Labels de Origem
- `status:from-qa` - Reportado por testers (via Discussions)
- `status:needs-triage` - Precisa de validação
- `status:confirmed` - Bug confirmado

### Labels de Página
- `page:landing` - Página inicial
- `page:classificacao` - Ranking
- `page:deputy-profile` - Perfis de deputados
- `page:batalha-real` - Comparações
- `page:distritos` - Distritos
- `page:partidos` - Partidos
- `page:iniciativas` - Iniciativas legislativas
- `page:waste-calc` - Calculadora de desperdício
- `page:info` - Páginas de informação

### Labels de Tipo
- `type:bug` - Algo quebrado
- `type:ux` - Confusão de UX/UI
- `type:enhancement` - Melhoria
- `type:mobile` - Problema específico mobile
- `type:data` - Qualidade de dados

### Labels de Severidade
- `severity:critical` - Funcionalidade quebrada (bloqueador)
- `severity:high` - Problema importante
- `severity:medium` - Problema notável
- `severity:low` - Problema menor

---

## 🎯 Templates Rápidos

### Template: Comentar na discussion após criar issue
```bash
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="✅ **Issue criada: #YYY**

Obrigado pelo report! Vou investigar isto.

Podes acompanhar o progresso aqui: https://github.com/bcamarneiro/adamastor/issues/YYY"
```

### Template: Pedir validação em staging
```bash
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="🔧 **Correção implementada em STAGING**

Podes testar a correção aqui:
👉 https://adamastor-staging.vercel.app/[página-afetada]

Se confirmares que está resolvido, faço deploy para PRODUÇÃO! 🚀"
```

### Template: Confirmar correção em produção
```bash
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="✅ **Correção em PRODUÇÃO!**

O bug foi resolvido e está agora disponível em:
👉 https://adamastor-prod.vercel.app

Obrigado pelo report! O teu feedback ajuda a melhorar o Adamastor. 🎉"
```

### Template: Fechar como duplicado
```bash
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="Este problema já foi reportado em: #YYY

Vou fechar esta discussão como duplicado. Podes acompanhar o progresso lá!

Obrigado pelo report! 🙏"
```

### Template: Fechar como inválido
```bash
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments \
  -f body="Obrigado pelo report!

Testei isto e na verdade [explicação do comportamento esperado].

[Opcional: sugestão de como usar a funcionalidade corretamente]

Se ainda tiveres dúvidas, podes reabrir a discussão!"
```

---

## 📈 Project Board (Opcional)

Se criares o project board, organiza assim:

### View 1: By Status
- 📋 **Needs Testing** - Discussions não triadas
- 🔍 **Confirmed** - Issues criadas, aguardam correção
- 🚧 **In Progress** - Alguém está a trabalhar
- ✅ **Fixed in Staging** - Aguarda validação
- 🚀 **Deployed** - Resolvido em produção

### View 2: By Page
Agrupa por `page:*` label
- Vês quantos bugs por página
- Prioriza páginas mais problemáticas

### View 3: By Severity
Agrupa por `severity:*`
- Critical primeiro
- High, Medium, Low

---

## ⚡ Quick Commands

```bash
# Listar discussions novas (Testing categories)
gh api repos/bcamarneiro/adamastor/discussions \
  --jq '.[] | select(.category.name | contains("Testing")) | select(.locked == false) | {number, title, created: .createdAt}'

# Criar issue a partir de discussion
gh issue create --title "..." --body "..." --label "..."

# Comentar em discussion
gh api repos/bcamarneiro/adamastor/discussions/XXX/comments -f body="..."

# Listar issues de QA não resolvidas
gh issue list --label "status:from-qa" --state open

# Adicionar issue ao project board
gh project item-add <PROJECT_NUMBER> --owner bcamarneiro --url https://github.com/bcamarneiro/adamastor/issues/XXX
```

---

## 🎁 Benefícios deste Workflow

### Para Testers:
✅ Entrada fácil via Discussions (sem barreiras técnicas)
✅ Feedback rápido do maintainer
✅ Visibilidade do progresso (discussions + board)
✅ Validação em staging antes de produção

### Para Maintainer:
✅ Controlo de qualidade (validas antes de criar issues)
✅ Evita duplicados (procuras antes de criar)
✅ Organização clara (labels + board)
✅ Templates para respostas rápidas

### Para Contributors:
✅ Issues bem documentadas (vêm de reports reais)
✅ Prioridades claras (labels de severity)
✅ Contexto completo (link para discussion original)
✅ Workflow standard de PR (CONTRIBUTING.md)

---

**Última atualização**: 2026-01-27

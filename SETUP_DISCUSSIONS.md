# Setup Guide: Discussions & Project Board

This guide walks through setting up GitHub Discussions and Project Board for QA testing.

## ✅ Step 1: GitHub Discussions (Already Enabled)

Discussions are already enabled for this repository.

### Create Discussion Categories

Go to: https://github.com/bcamarneiro/adamastor/discussions/categories

Create these categories:

#### 1. Testing: Página Inicial
- **Emoji:** 🏠 (`:house:`)
- **Description:** Reporta problemas encontrados na página inicial
- **Format:** Open-ended discussion

#### 2. Testing: Classificação
- **Emoji:** 📊 (`:bar_chart:`)
- **Description:** Reporta problemas na página de ranking de deputados
- **Format:** Open-ended discussion

#### 3. Testing: Perfil de Deputado
- **Emoji:** 👤 (`:bust_in_silhouette:`)
- **Description:** Reporta problemas em perfis de deputados
- **Format:** Open-ended discussion

#### 4. Testing: Batalha Real
- **Emoji:** ⚔️ (`:crossed_swords:`)
- **Description:** Reporta problemas nas páginas de comparação (deputados, distritos, partidos)
- **Format:** Open-ended discussion

#### 5. Testing: Distritos & Partidos
- **Emoji:** 🗺️ (`:world_map:`)
- **Description:** Reporta problemas nas páginas de distritos e partidos
- **Format:** Open-ended discussion

#### 6. Testing: Outras Páginas
- **Emoji:** 📱 (`:iphone:`)
- **Description:** Reporta problemas em outras páginas (iniciativas, calculadora, etc.)
- **Format:** Open-ended discussion

#### 7. Sugestões
- **Emoji:** 💡 (`:bulb:`)
- **Description:** Partilha ideias de melhorias e novas funcionalidades
- **Format:** Open-ended discussion

#### 8. Perguntas
- **Emoji:** ❓ (`:question:`)
- **Description:** Faz perguntas sobre a plataforma
- **Format:** Q&A

### Pin a Welcome Discussion

Create a pinned discussion in "Announcements" category:

**Title:** Bem-vindo aos Testes do Adamastor! 🧪

**Content:**
```markdown
# Obrigado por ajudar a testar o Adamastor!

Esta é a área de testes e feedback da plataforma. Aqui podes reportar problemas, sugerir melhorias, e fazer perguntas.

## 📚 Como Começar

1. **Lê o guia:** [TESTING.md](../TESTING.md)
2. **Escolhe uma página** para testar
3. **Reporta problemas** na categoria apropriada
4. **Acompanha o progresso** no [Project Board](https://github.com/bcamarneiro/adamastor/projects)

## 🏷️ Categorias de Testing

- 🏠 **Testing: Página Inicial** - Problemas na homepage
- 📊 **Testing: Classificação** - Problemas no ranking
- 👤 **Testing: Perfil de Deputado** - Problemas em perfis
- ⚔️ **Testing: Batalha Real** - Problemas em comparações
- 🗺️ **Testing: Distritos & Partidos** - Problemas nessas secções
- 📱 **Testing: Outras Páginas** - Iniciativas, calculadora, etc.

## ✅ Template de Report

Usa este template ao reportar problemas:

**Página:** [Nome]
**Dispositivo:** [Desktop/Tablet/Mobile]
**Browser:** [Chrome, Firefox, Safari]
**Esperado:** [O que deveria acontecer]
**Atual:** [O que aconteceu]
**Passos:** [Como reproduzir]

## 🎯 Prioridades

- 🔴 **Crítico** - Funcionalidade quebrada
- 🟡 **Importante** - UX confuso ou problema visual
- 🟢 **Melhoria** - Sugestão de enhancement

Obrigado por contribuíres para a transparência democrática! 🙏
```

## ✅ Step 2: Create Project Board

### Option A: Via GitHub CLI (Requires Auth Refresh)

```bash
# Refresh auth with required scopes
gh auth refresh -s project,read:project

# Create project
gh project create --owner bcamarneiro --title "Adamastor QA & Feedback"

# Note the project number from output
```

### Option B: Via Web UI (Recommended)

1. Go to: https://github.com/bcamarneiro/adamastor/projects
2. Click **"New project"**
3. Choose **"Table"** template
4. Name: **"Adamastor QA & Feedback"**
5. Click **"Create project"**

### Configure Project Views

#### View 1: By Status (Default)

**Columns:**
- 📋 **Needs Testing** - Reported by testers, not yet validated
- 🔍 **Confirmed** - Validated as real issue
- 🚧 **In Progress** - Being worked on
- ✅ **Fixed** - Deployed to staging/production
- 🚫 **Won't Fix** - Not a bug or out of scope

**Setup:**
1. Click "+" next to views
2. Select "Board"
3. Group by: **Status**

#### View 2: By Page

**Setup:**
1. Create custom field: **Page**
  - Type: Single select
  - Options:
    - 🏠 Landing Page
    - 📊 Ranking
    - 👤 Deputy Profile
    - 🏛️ Parliament
    - ⚔️ Battle Royale
    - 🗺️ Districts
    - 🎯 Parties
    - 📜 Initiatives
    - 💰 Waste Calculator
    - ℹ️ Info Pages

2. Click "+" next to views
3. Select "Board"
4. Group by: **Page**

#### View 3: By Priority

**Setup:**
1. Create custom field: **QA Priority**
  - Type: Single select
  - Options:
    - 🔴 Critical (red)
    - 🟡 Important (yellow)
    - 🟢 Enhancement (green)

2. Click "+" next to views
3. Select "Board"
4. Group by: **QA Priority**

## ✅ Step 3: Configure Issue Labels

Run this script to create standardized labels:

```bash
# Page labels
gh label create "page:landing" --color "0E8A16" --description "Landing page issues"
gh label create "page:ranking" --color "0E8A16" --description "Ranking page issues"
gh label create "page:deputy-profile" --color "0E8A16" --description "Deputy profile issues"
gh label create "page:parliament" --color "0E8A16" --description "Parliament page issues"
gh label create "page:battle-royale" --color "0E8A16" --description "Battle Royale issues"
gh label create "page:districts" --color "0E8A16" --description "Districts page issues"
gh label create "page:parties" --color "0E8A16" --description "Parties page issues"
gh label create "page:initiatives" --color "0E8A16" --description "Initiatives page issues"
gh label create "page:waste-calc" --color "0E8A16" --description "Waste calculator issues"
gh label create "page:info" --color "0E8A16" --description "Info pages issues"

# Type labels
gh label create "type:bug" --color "D73A4A" --description "Something broken"
gh label create "type:ux" --color "FFA500" --description "UX/UI confusion"
gh label create "type:enhancement" --color "A2EEEF" --description "Improvement idea"
gh label create "type:mobile" --color "FF69B4" --description "Mobile-specific issue"
gh label create "type:data" --color "7057FF" --description "Data quality issue"

# Severity labels
gh label create "severity:critical" --color "B60205" --description "Critical - broken functionality"
gh label create "severity:high" --color "D93F0B" --description "High - important issue"
gh label create "severity:medium" --color "FBCA04" --description "Medium - noticeable issue"
gh label create "severity:low" --color "0E8A16" --description "Low - minor issue"

# Status labels
gh label create "status:needs-triage" --color "EDEDED" --description "Needs validation"
gh label create "status:confirmed" --color "C5DEF5" --description "Confirmed issue"
gh label create "status:from-qa" --color "5319E7" --description "Reported by QA testers"
```

## ✅ Step 4: Link Discussions to Project

### Manual Linking
When a discussion is validated and becomes an issue:

1. Create issue from discussion insights
2. Reference discussion: `From discussion #123`
3. Add to project board
4. Set appropriate page, priority, status
5. Reply in discussion with issue link

### Automation (Optional - GitHub Actions)

Create `.github/workflows/qa-automation.yml`:

```yaml
name: QA Issue Automation

on:
  discussion:
    types: [created]

jobs:
  label-discussion:
    runs-on: ubuntu-latest
    steps:
      - name: Add testing label
        if: contains(github.event.discussion.category.name, 'Testing')
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.discussion.number,
              labels: ['status:from-qa']
            })
```

## ✅ Step 5: Update README

Add this section to README.md:

```markdown
## 🧪 Testing & Feedback

We're actively collecting feedback from testers! Help improve Adamastor:

- 📖 **Testing Guide:** [TESTING.md](TESTING.md)
- 💬 **Report Issues:** [Discussions](https://github.com/bcamarneiro/adamastor/discussions)
- 📊 **Track Progress:** [QA Project Board](https://github.com/bcamarneiro/adamastor/projects/1)

Your feedback helps make democracy more transparent!
```

## ✅ Step 6: Promote to Testers

Once setup is complete, share with testers:

**Message template:**
```
🧪 Estamos a recrutar testadores para o Adamastor!

Ajuda a melhorar a transparência parlamentar testando a plataforma:
https://github.com/bcamarneiro/adamastor

📋 Lê o guia: TESTING.md
💬 Reporta problemas: Discussions
📊 Acompanha: Project Board

Cada bug que encontres torna a democracia mais transparente! 🇵🇹
```

## 📊 Success Metrics

Track these metrics to measure QA effectiveness:

- **Number of testers** - Unique discussion participants
- **Issues reported** - Total discussions in testing categories
- **Conversion rate** - Discussions → Issues created
- **Resolution time** - Time from report → fix
- **Duplicate rate** - % of duplicate reports (goal: <20%)

## 🔄 Workflow Summary

```
Tester finds issue
    ↓
Posts in Discussion (category-specific)
    ↓
You validate & search for duplicates
    ↓
If valid: Create GitHub Issue
    ↓
Add to Project Board
    ↓
Set page, priority, status
    ↓
Link back to discussion
    ↓
Work on fix
    ↓
Close issue when deployed
    ↓
Update discussion with fix
```

---

**Setup Status Checklist:**

- [x] Discussions enabled
- [ ] Discussion categories created
- [ ] Welcome discussion pinned
- [ ] Project board created
- [ ] Project views configured
- [ ] Labels created
- [ ] README updated
- [ ] Ready to invite testers

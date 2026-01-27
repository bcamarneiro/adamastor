# 📋 Passos Manuais Finais - Setup QA

## ✅ O Que Já Está Feito

- [x] GitHub Discussions ativadas
- [x] Welcome discussion criada: https://github.com/bcamarneiro/adamastor/discussions/203
- [x] 22 labels criadas (page:*, type:*, severity:*, status:*)
- [x] TESTING.md guia completo criado
- [x] Posts para redes sociais preparados (SOCIAL_MEDIA_POSTS.md)

## 📝 O Que Falta (5-10 minutos)

### 0. Atualizar Welcome Discussion 📝

**Tempo:** 1 minuto

A Discussion #203 ainda tem o template manual antigo. Precisa de ser atualizada para mencionar os formulários automáticos.

1. Vai para: https://github.com/bcamarneiro/adamastor/discussions/203
2. Clica em **"Edit"** (ícone lápis no topo direito)
3. Substitui o corpo da discussion pelo conteúdo de `welcome-discussion.md`:

   ```bash
   cat welcome-discussion.md
   ```

4. Copia todo o output e cola no editor
5. Clica em **"Update comment"**

✅ **Resultado:** Discussion menciona formulários automáticos em vez de template manual.

---

### 1. Pin Welcome Discussion ⭐
**Tempo:** 30 segundos

1. Vai para: https://github.com/bcamarneiro/adamastor/discussions/203
2. Clica nos `...` (três pontinhos) no topo direito
3. Clica em **"Pin discussion"**

✅ **Resultado:** Discussão de boas-vindas fica sempre no topo.

---

### 2. Criar Categorias de Discussão 📂
**Tempo:** 3-5 minutos

**URL:** https://github.com/bcamarneiro/adamastor/settings/discussions

Clica em **"New category"** para cada uma destas:

#### Categoria 1: Testing: Página Inicial
- **Name:** Testing: Página Inicial
- **Description:** Reporta problemas encontrados na página inicial
- **Emoji:** 🏠 (`:house:`)
- **Discussion format:** Open-ended discussion

#### Categoria 2: Testing: Classificação
- **Name:** Testing: Classificação
- **Description:** Reporta problemas na página de ranking de deputados
- **Emoji:** 📊 (`:bar_chart:`)
- **Discussion format:** Open-ended discussion

#### Categoria 3: Testing: Perfil de Deputado
- **Name:** Testing: Perfil de Deputado
- **Description:** Reporta problemas em perfis de deputados
- **Emoji:** 👤 (`:bust_in_silhouette:`)
- **Discussion format:** Open-ended discussion

#### Categoria 4: Testing: Batalha Real
- **Name:** Testing: Batalha Real
- **Description:** Reporta problemas nas páginas de comparação (deputados, distritos, partidos)
- **Emoji:** ⚔️ (`:crossed_swords:`)
- **Discussion format:** Open-ended discussion

#### Categoria 5: Testing: Distritos & Partidos
- **Name:** Testing: Distritos & Partidos
- **Description:** Reporta problemas nas páginas de distritos e partidos
- **Emoji:** 🗺️ (`:world_map:`)
- **Discussion format:** Open-ended discussion

#### Categoria 6: Testing: Outras Páginas
- **Name:** Testing: Outras Páginas
- **Description:** Reporta problemas em outras páginas (iniciativas, calculadora, etc.)
- **Emoji:** 📱 (`:iphone:`)
- **Discussion format:** Open-ended discussion

#### Categoria 7: Sugestões
- **Name:** Sugestões
- **Description:** Partilha ideias de melhorias e novas funcionalidades
- **Emoji:** 💡 (`:bulb:`)
- **Discussion format:** Open-ended discussion

#### Categoria 8: Perguntas
- **Name:** Perguntas
- **Description:** Faz perguntas sobre a plataforma
- **Emoji:** ❓ (`:question:`)
- **Discussion format:** Q&A

✅ **Resultado:** Discussões organizadas por tipo de página/feedback.

---

### 3. Criar Project Board (Opcional mas Recomendado) 📊
**Tempo:** 2-3 minutos

#### Opção A: Sem Project Board
Podes gerir tudo via Discussions + Issues. Salta este passo.

#### Opção B: Com Project Board (Recomendado para transparência)

**Passo 1:** Refresh auth
```bash
gh auth refresh -s project,read:project
```

**Passo 2:** Criar projeto
```bash
gh project create --owner bcamarneiro --title "Adamastor QA & Feedback"
```

**Passo 3:** Configurar views (via web UI)
1. Vai para o projeto criado
2. Clica em "+" próximo de "Views"
3. Cria 3 views:
   - **By Status:** Group by Status field
   - **By Page:** Group by custom "Page" field
   - **By Priority:** Group by custom "Priority" field

✅ **Resultado:** Transparência total do progresso de testing.

---

### 4. Atualizar README (Opcional) 📖
**Tempo:** 1 minuto

Adiciona esta secção ao README.md principal:

```markdown
## 🧪 Testing & Feedback

Estamos a recrutar testadores! Ajuda a melhorar o Adamastor:

- 📖 **Guia de Testing:** [TESTING.md](TESTING.md)
- 💬 **Reportar Problemas:** [Discussions](https://github.com/bcamarneiro/adamastor/discussions)
- 📊 **Acompanhar Progresso:** [Project Board](https://github.com/bcamarneiro/adamastor/projects/1)

O teu feedback torna a democracia mais transparente! 🇵🇹
```

✅ **Resultado:** Visitantes veem convite para testar logo no README.

---

## 🚀 Depois de Completar os Passos

### 1. Testa o Workflow Tu Mesmo
Antes de convidar outros:
1. Cria uma discussion de teste
2. Verifica que as categorias aparecem
3. Confirma que os labels existem
4. Testa criar um issue a partir de uma discussion

### 2. Publica nas Redes Sociais
Usa os posts preparados em [SOCIAL_MEDIA_POSTS.md](SOCIAL_MEDIA_POSTS.md):

**Ordem sugerida:**
1. **LinkedIn** (audiência profissional) - Manhã de terça/quarta
2. **X/Twitter** (viralização) - Hora de almoço
3. **Ponto Livre** (comunidade tech PT) - Tarde/noite

### 3. Responde Rápido aos Primeiros Reports
Os primeiros testadores vão ditar o tom. Se responderes rápido e bem:
- Outros vão querer participar
- Qualidade dos reports melhora
- Cria-se comunidade

---

## 📊 Métricas de Sucesso

Depois de 1 semana, avalia:
- **Quantos testadores únicos?** (Goal: 10+)
- **Quantas discussions criadas?** (Goal: 20+)
- **Conversão discussion → issue** (Goal: 30%+)
- **Taxa de duplicados** (Goal: <20%)

Se > 50% dos reports forem duplicados, significa que as categorias não estão claras.

---

## 🎯 Quick Start (Resumo)

Se quiseres fazer tudo de uma vez:

```bash
# 1. Pin discussion
Vai para: https://github.com/bcamarneiro/adamastor/discussions/203
Clica: ... → Pin discussion

# 2. Criar categorias
Vai para: https://github.com/bcamarneiro/adamastor/settings/discussions
Cria as 8 categorias listadas acima

# 3. (Opcional) Criar project board
gh auth refresh -s project,read:project
gh project create --owner bcamarneiro --title "Adamastor QA & Feedback"

# 4. Publicar nas redes
Copia posts de SOCIAL_MEDIA_POSTS.md
```

**Tempo total:** 5-10 minutos

---

## ✅ Checklist Final

Antes de convidar testadores, confirma:

- [ ] Welcome discussion está pinned
- [ ] 8 categorias de discussão criadas
- [ ] Testaste criar uma discussion de exemplo
- [ ] Testaste criar um issue a partir de discussion
- [ ] README atualizado (se aplicável)
- [ ] Project board criado (se quiseres usar)
- [ ] Posts para redes sociais preparados
- [ ] Estás pronto para responder rápido aos primeiros reports

---

**Tudo pronto! 🎉**

Quando completares estes passos, está tudo configurado para começar a recrutar testadores.

Boa sorte! 🚀

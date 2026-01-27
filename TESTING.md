# 🧪 Ajuda a Testar o Adamastor

Obrigado por ajudar a melhorar o Adamastor! Este guia explica como testar a plataforma e reportar problemas de forma eficaz.

## 🎯 O Que Procurar

Ao testar, presta atenção a:

- **Funcionalidades quebradas** - Botões que não funcionam, erros, páginas vazias
- **Confusão de UX** - Algo difícil de entender ou usar
- **Problemas visuais** - Elementos sobrepostos, texto cortado, cores estranhas
- **Erros de dados** - Informações incorretas ou desatualizadas
- **Problemas mobile/tablet** - Coisas que não funcionam bem em dispositivos pequenos

## 📱 Páginas a Testar

### 1. Página Inicial (`/`)
- Carregamento rápido
- Cartões de funcionalidades visíveis
- Navegação funciona

### 2. Classificação (`/classificacao`)
- Lista de deputados carrega
- Pesquisa funciona
- Ordenação por colunas
- Notas aparecem corretamente

### 3. Perfil de Deputado (`/deputados/[nome]`)
- Informação básica visível
- Métricas de performance
- Gráficos de assiduidade
- Links para páginas relacionadas

### 4. Parlamento (`/parlamento`)
- Estatísticas gerais
- Composição atual
- Divisão por partido

### 5. Batalha Real (`/batalha-real`)
- Comparação deputado vs deputado
- Comparação distrito vs distrito (`/distritos/comparar`)
- Resultados claros
- Botão de reset funciona

### 6. Distritos (`/distritos`)
- Lista de distritos
- Páginas de detalhe
- Link para comparação

### 7. Partidos (`/partidos`)
- Lista de partidos
- Navegação para comparação

### 8. Iniciativas (`/iniciativas`)
- Lista de propostas legislativas
- Filtros funcionam
- Detalhes das propostas

### 9. Calculadora de Desperdício (`/calculadora-desperdicio`)
- Inputs aceitam dados
- Cálculos corretos
- Resultados exibidos

### 10. Páginas de Info
- Sobre
- Privacidade
- Links no rodapé

## 🐛 Como Reportar Problemas

### Passo 1: Procura Primeiro
Antes de reportar, verifica as [Discussões](https://github.com/bcamarneiro/adamastor/discussions) para ver se alguém já reportou o mesmo problema.

### Passo 2: Escolhe a Categoria Certa
- **Testing: Página Inicial** - Problemas na homepage
- **Testing: Classificação** - Problemas na página de ranking
- **Testing: Perfil de Deputado** - Problemas em perfis
- **Testing: Batalha Real** - Problemas em comparações
- **Testing: Distritos & Partidos** - Problemas nessas secções
- **Testing: Outras Páginas** - Iniciativas, calculadora, etc.
- **Sugestões** - Ideias de melhorias
- **Perguntas** - Dúvidas sobre a plataforma

### Passo 3: Usa Este Template

Copia e cola isto na tua discussão:

```markdown
**Página:** [Nome da página]
**Dispositivo:** [Desktop / Tablet / Mobile]
**Browser:** [Chrome, Firefox, Safari, etc.]

**O que esperava:**
[Descreve o que deveria acontecer]

**O que aconteceu:**
[Descreve o que realmente aconteceu]

**Como reproduzir:**
1. Vou para a página X
2. Clico no botão Y
3. Vejo o erro Z

**Screenshot (opcional):**
[Se ajudar, anexa uma imagem]
```

## ✅ Exemplos de Bons Reports

### Exemplo 1: Bug Funcional
```markdown
**Página:** Batalha Real
**Dispositivo:** Mobile (iPhone 13)
**Browser:** Safari

**O que esperava:**
Poder selecionar dois distritos e comparar

**O que aconteceu:**
No mobile, os botões de seleção sobrepõem-se e não consigo clicar no segundo distrito

**Como reproduzir:**
1. Abrir /batalha-real no mobile
2. Clicar em "Comparar Distritos"
3. Selecionar primeiro distrito (Lisboa)
4. Tentar selecionar segundo distrito - botões sobrepostos
```

### Exemplo 2: Problema de UX
```markdown
**Página:** Classificação
**Dispositivo:** Desktop
**Browser:** Chrome

**O que esperava:**
Entender como a nota é calculada

**O que aconteceu:**
Não há explicação de como as notas (A, B, C, etc) são calculadas. Não sei o que significa um "B".

**Sugestão:**
Adicionar um tooltip ou link "Como são calculadas as notas?"
```

### Exemplo 3: Erro de Dados
```markdown
**Página:** Perfil de Deputado (André Ventura)
**Dispositivo:** Desktop
**Browser:** Firefox

**O que esperava:**
Ver a cor do partido correta (Chega)

**O que aconteceu:**
A cor do partido aparece como azul (PSD) em vez da cor do Chega

**Como reproduzir:**
1. Ir para /deputados/andre-ventura
2. Ver a cor do partido no cabeçalho
```

## ❌ O Que NÃO Reportar

**Não reportes:**
- "O site é lento" (preciso de especificar: que página? que ação? quanto tempo?)
- Pedidos de funcionalidades grandes (usa categoria "Sugestões" para isso)
- Bugs já reportados (procura primeiro!)
- Problemas no teu browser/dispositivo (testa noutro browser primeiro)

## 🎁 Benefícios de Ajudar

- **Impacto Cívico** - Estás a ajudar a melhorar a transparência democrática
- **Reconhecimento** - Vais aparecer nos agradecimentos do projeto
- **Aprendizagem** - Vês como funciona o desenvolvimento de software open-source
- **Comunidade** - Fazes parte de um projeto importante

## 🌐 Ambientes de Testing

### PRODUÇÃO (testa aqui!)
**URL**: https://adamastor-prod.vercel.app

- É aqui que deves testar e reportar bugs
- Versão pública da plataforma que todos usam

### STAGING (validação de correções)
**URL**: https://adamastor-staging.vercel.app

- Quando reportas um bug, a correção aparece primeiro aqui
- Podes testar aqui para confirmar que o bug foi resolvido
- Depois de confirmado, fazemos deploy para PRODUÇÃO

## 📊 O Que Acontece Depois do Teu Report

1. **Reportas** na discussion (categoria apropriada)
2. **Maintainer valida** se é bug real (testa, verifica duplicados)
3. **Issue criada** no GitHub se for válido
4. **Correção implementada** em STAGING primeiro
5. **Pedes-te validação** em STAGING (opcional mas útil!)
6. **Deploy para PRODUÇÃO** após confirmação
7. **Avisamos-te** na discussion quando estiver resolvido

💡 **Nota**: NÃO precisas de criar GitHub Issues. Usa apenas Discussions para reportar. Os issues são criados pelo maintainer após validação.

## 💡 Dicas para Testar Bem

1. **Testa em diferentes dispositivos** - Desktop, tablet, mobile
2. **Testa em diferentes browsers** - Chrome, Firefox, Safari
3. **Tenta quebrar coisas** - Clica rápido, deixa campos vazios, usa caracteres especiais
4. **Compara com o esperado** - Pensa "isto faz sentido?"
5. **Documenta tudo** - Quanto mais detalhe, melhor

## 🙋 Perguntas Frequentes

**Preciso de saber programar?**
Não! Só precisas de saber usar o site normalmente.

**Quanto tempo devo dedicar?**
O que puderes! Mesmo 10 minutos ajudam.

**Onde devo testar?**
Testa em PRODUÇÃO: https://adamastor-prod.vercel.app

**Devo testar em STAGING também?**
Só se te pedirmos para validar uma correção. Normalmente testa apenas em PRODUÇÃO.

**Devo criar GitHub Issues?**
Não! Usa apenas Discussions para reportar. Os issues são criados pelo maintainer após validar o teu report.

**E se não tiver a certeza se é um bug?**
Reporta na mesma! É melhor reportar demais que reportar de menos.

**Posso sugerir melhorias?**
Claro! Usa a categoria "Sugestões" nas discussões.

## 📞 Contacto

- **Discussões:** https://github.com/bcamarneiro/adamastor/discussions
- **Issues:** https://github.com/bcamarneiro/adamastor/issues
- **Project Board:** https://github.com/bcamarneiro/adamastor/projects

---

**Última atualização:** 2026-01-27

Obrigado por ajudares a melhorar o Adamastor! 🙏

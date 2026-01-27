# Bem-vindo aos Testes do Adamastor! 🧪

Obrigado por ajudar a testar o Adamastor e melhorar a transparência parlamentar em Portugal!

Esta é a área de testes e feedback da plataforma. Aqui podes reportar problemas, sugerir melhorias, e fazer perguntas sobre o funcionamento da plataforma.

## 📚 Como Começar

1. **Lê o guia completo:** [TESTING.md](https://github.com/bcamarneiro/adamastor/blob/staging/TESTING.md)
2. **Testa em PRODUÇÃO:** https://adamastor-prod.vercel.app
3. **Escolhe uma página** para testar da lista abaixo
4. **Reporta problemas** na categoria apropriada das Discussões
5. **Acompanha o progresso** - vamos criar issues para problemas validados

## 🌐 Ambientes de Testing

**PRODUÇÃO** (testa aqui!): https://adamastor-prod.vercel.app
- É aqui que deves testar e reportar bugs
- Versão pública da plataforma

**STAGING** (validação de correções): https://adamastor-staging.vercel.app
- Quando reportas um bug, a correção aparece primeiro aqui
- Podes testar para confirmar que o bug foi resolvido
- Depois de confirmado, fazemos deploy para PRODUÇÃO

## 🏷️ Categorias de Testing

Quando reportares um problema, escolhe a categoria certa:

- 🏠 **Testing: Página Inicial** - Problemas na homepage
- 📊 **Testing: Classificação** - Problemas na página de ranking
- 👤 **Testing: Perfil de Deputado** - Problemas em perfis de deputados
- ⚔️ **Testing: Batalha Real** - Problemas nas comparações (deputados, distritos, partidos)
- 🗺️ **Testing: Distritos & Partidos** - Problemas nessas secções
- 📱 **Testing: Outras Páginas** - Iniciativas, calculadora de desperdício, etc.
- 💡 **Sugestões** - Ideias de melhorias e novas funcionalidades
- ❓ **Perguntas** - Dúvidas sobre a plataforma

## ✅ Template para Reportar Problemas

Copia e cola isto quando reportares um problema:

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

## 📱 Páginas Principais para Testar

1. **Página Inicial** - `/`
2. **Classificação de Deputados** - `/classificacao`
3. **Perfil de Deputado** - `/deputados/[nome]`
4. **Parlamento** - `/parlamento`
5. **Batalha Real** - `/batalha-real`
6. **Distritos** - `/distritos` e `/distritos/comparar`
7. **Partidos** - `/partidos` e `/partidos/comparar`
8. **Iniciativas** - `/iniciativas`
9. **Calculadora de Desperdício** - `/calculadora-desperdicio`
10. **Páginas de Info** - Sobre, Privacidade, etc.

## 🎯 O Que Procurar

Ao testar, presta atenção a:

- **Funcionalidades quebradas** - Botões que não funcionam, erros, páginas vazias
- **Confusão de UX** - Algo difícil de entender ou usar
- **Problemas visuais** - Elementos sobrepostos, texto cortado, cores estranhas
- **Erros de dados** - Informações incorretas ou desatualizadas
- **Problemas mobile/tablet** - Coisas que não funcionam bem em ecrãs pequenos

## ✨ Exemplos de Bons Reports

### 🐛 Bug Funcional
> **Página:** Batalha Real
> **Dispositivo:** Mobile (iPhone)
> **Browser:** Safari
>
> **O que esperava:** Selecionar dois distritos e comparar
> **O que aconteceu:** Os botões sobrepõem-se no mobile e não consigo clicar
>
> **Como reproduzir:**
> 1. Abrir /batalha-real no mobile
> 2. Clicar em "Comparar Distritos"
> 3. Selecionar primeiro distrito
> 4. Tentar selecionar segundo - botões sobrepostos

### 🎨 Problema de UX
> **Página:** Classificação
> **Dispositivo:** Desktop
> **Browser:** Chrome
>
> **O que esperava:** Entender como a nota é calculada
> **O que aconteceu:** Não há explicação. Não sei o que significa um "B"
>
> **Sugestão:** Adicionar tooltip "Como são calculadas as notas?"

## 🔄 O Que Acontece Depois

1. **Reportas** um problema numa discussão
2. **Validamos** se é um bug real
3. **Criamos issue** no GitHub se for válido
4. **Trabalhamos** na resolução
5. **Avisamos-te** quando estiver corrigido

## 💡 Dicas para Testar Bem

- ✅ Testa em diferentes dispositivos (desktop, tablet, mobile)
- ✅ Testa em diferentes browsers (Chrome, Firefox, Safari)
- ✅ Tenta "quebrar" coisas - clica rápido, usa caracteres especiais
- ✅ Documenta tudo - quanto mais detalhe, melhor
- ✅ **Procura primeiro** se alguém já reportou o mesmo problema

## 🙋 Perguntas Frequentes

**Preciso de saber programar?**
Não! Só precisas de saber usar o site normalmente.

**Quanto tempo devo dedicar?**
O que puderes! Mesmo 10 minutos ajudam.

**Posso sugerir melhorias?**
Claro! Usa a categoria "Sugestões".

**E se não tiver a certeza se é um bug?**
Reporta na mesma! É melhor reportar demais que de menos.

## 🎁 Impacto do Teu Trabalho

Ao ajudar a testar o Adamastor, estás a:

- 🏛️ **Melhorar a transparência democrática** em Portugal
- 📊 **Tornar informação parlamentar acessível** a todos os cidadãos
- 🔍 **Responsabilizar deputados** através de dados objetivos
- 🇵🇹 **Contribuir para uma democracia mais informada**

---

**Obrigado por contribuíres para a transparência parlamentar!** 🙏

Se tiveres dúvidas, usa a categoria **Perguntas** ou comenta aqui nesta discussão.

Bons testes! 🚀

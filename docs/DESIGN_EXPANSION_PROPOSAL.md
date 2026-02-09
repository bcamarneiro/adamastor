# Adamastor Design Expansion Proposal

> Expandir o design da landing page a todas as páginas para UI/UX coeso.

---

## 1. Estado Atual

### ✅ Já Temos (PR #218)
- Design system documentado com filosofia "editorial, not corporate"
- Paleta de cores baseada em Radix (12-step scale)
- Cores semânticas alinhadas com bandeira PT (success/warning/danger)
- Typography: Montserrat (sans) + Merriweather (serif)
- Landing page redesenhada com hero dark, feature cards, animations

### 📦 Stack Atual
- TailwindCSS
- Radix UI primitives (`@radix-ui/react-tabs`, `tooltip`, `themes`)
- Framer Motion
- Headless UI
- cmdk (command palette)
- lucide-react (icons)

---

## 2. Recomendação: shadcn/ui

### Porquê shadcn?
1. **Já usa Radix** — shadcn é built on Radix, compatível com o que já tens
2. **Copy-paste, não package** — controlo total, sem dependências externas
3. **Customizável** — adapta-se ao design system existente
4. **Componentes que precisas:**
   - `Card` — para feature cards, deputy cards, party cards
   - `Table` — initiatives list, leaderboard
   - `Tabs` — já usas, mas mais polished
   - `Dialog/Sheet` — modals, sidebars
   - `Badge` — legislature badges, status tags
   - `Skeleton` — loading states
   - `Chart` (via recharts) — data viz

### Instalação
```bash
bunx shadcn@latest init
bunx shadcn@latest add card table tabs dialog badge skeleton
```

---

## 3. Design System Expandido

### 3.1 Page Templates

| Template | Páginas | Descrição |
|----------|---------|-----------|
| **Hero + Content** | Landing, About, Mission | Dark hero + alternating sections |
| **Data Dashboard** | Parliament, Leaderboard, Initiatives | Header + filters + data grid |
| **Entity Profile** | Deputy, District, Party | Hero card + stats + activity |
| **Comparison** | Battle, Waste Calculator | Side-by-side with visual comparisons |
| **Editorial** | Methodology, Contribute | Long-form content, serif accents |

### 3.2 Shared Components

```
components/
├── ui/                    # shadcn base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── table.tsx
│   └── ...
├── layout/
│   ├── PageHeader.tsx     # Consistent page headers
│   ├── Section.tsx        # Dark/light alternating sections
│   └── Container.tsx      # Max-width wrapper
├── data/
│   ├── StatCard.tsx       # Big number + label + trend
│   ├── DataTable.tsx      # Sortable, filterable tables
│   └── ComparisonBar.tsx  # Visual % comparisons
├── entity/
│   ├── DeputyCard.tsx     # Reusable deputy display
│   ├── PartyBadge.tsx     # Party with color
│   └── DistrictMap.tsx    # Geographic visualization
└── feedback/
    ├── LoadingState.tsx   # Skeleton loaders
    ├── EmptyState.tsx     # No data illustrations
    └── ErrorState.tsx     # Error with retry
```

### 3.3 Motion System

```typescript
// Consistent animations across all pages
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true }
};
```

---

## 4. Page-by-Page Redesign Priority

### Phase 1: High-Impact (1-2 weeks)
1. **Parliament/Leaderboard** — Most visited, data-heavy
2. **Deputy Profile** — Entity template, reusable patterns
3. **Party Profile** — Similar to deputy, solidifies template

### Phase 2: Core Experience (1 week)
4. **Initiatives List** — Complex table, filters
5. **Districts** — Map + data hybrid
6. **Comparison pages** — Battle, Districts comparison

### Phase 3: Polish (1 week)
7. **About/Mission/Methodology** — Editorial pages
8. **Contribute** — Call-to-action page
9. **404/Error states**

---

## 5. 2026 Design Trends to Incorporate

### ✅ Already Aligned
- **Data storytelling** — "Numbers are heroes"
- **Editorial layouts** — The Markup inspiration
- **Dark mode rhythm** — Alternating sections

### 🆕 To Add
- **Micro-interactions** — Hover states, button feedback, number animations
- **Skeleton loading** — Instead of spinners
- **Graphical-first** — More visual cues, less text
- **Contextual help** — Tooltips, inline explanations
- **Responsive data viz** — Charts that work on mobile

---

## 6. Implementation Approach

### Option A: Incremental (Recommended)
1. Merge PR #218 as foundation
2. Add shadcn components one by one
3. Refactor each page progressively
4. Keep app functional throughout

### Option B: Big Bang
1. Create feature branch
2. Redesign all pages
3. Merge when complete
4. Risk: long-lived branch, merge conflicts

**Recommendation: Option A** — Ship improvements continuously.

---

## 7. Next Steps

1. [ ] Merge PR #218 (landing page foundation)
2. [ ] Initialize shadcn/ui in project
3. [ ] Create shared layout components
4. [ ] Start with Parliament/Leaderboard redesign
5. [ ] Document patterns as we go

---

## 8. Visual References

### Inspiration
- [The Markup](https://themarkup.org/) — Investigative journalism, data-forward
- [Our World in Data](https://ourworldindata.org/) — Data visualization excellence
- [Politico](https://www.politico.eu/) — Political editorial design
- [FiveThirtyEight](https://fivethirtyeight.com/) — Data journalism

### shadcn Examples
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks) — Pre-built layouts
- [shadcn/ui Charts](https://ui.shadcn.com/charts) — Data viz components

---

*Proposta criada: 2026-02-06*

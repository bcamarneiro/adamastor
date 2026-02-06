# Debaixo d'olho — Design System

> Bold. Editorial. Civic. Think *The Markup* meets Portuguese municipal identity.

---

## 1. Identity & Vibe

**Debaixo d'olho** is a Portuguese Parliament transparency platform. The design should feel like an investigative newsroom, not a corporate SaaS dashboard. We're watching politicians — the visual language should convey authority, clarity, and civic urgency.

### Principles
- **Data-forward** — Numbers are heroes. Show them big, show them proud.
- **Editorial, not corporate** — Think newspaper front page, not admin panel.
- **Portuguese identity without kitsch** — Use the flag colors as accents, not decoration.
- **Dark/light rhythm** — Alternate dark and light sections for visual punch.
- **The eye sees all** — The pixelated eye logo (inspired by Camões, the one-eyed poet) is our mascot. Lean into it.

---

## 2. Color System

Colors use a 12-step scale (Radix-inspired), mapped as CSS custom properties and available as Tailwind utilities.

### Semantic Palettes

| Role | Token Prefix | Flag Color | Usage |
|------|-------------|------------|-------|
| **Neutral** | `neutral-` | — | Text, backgrounds, borders |
| **Accent** | `accent-` | Blue | Links, interactive elements, primary actions |
| **Success** | `success-` | 🟢 Green | Positive scores, good metrics, Portuguese green |
| **Warning** | `warning-` | 🟡 Yellow | Caution, mid-range scores, Portuguese yellow |
| **Danger** | `danger-` | 🔴 Red | Negative scores, errors, Portuguese red |

### Scale Usage

| Step | Role | Example Use |
|------|------|-------------|
| `1–2` | App/page backgrounds | `bg-neutral-1`, `bg-neutral-2` |
| `3–4` | Subtle backgrounds, hover states | `bg-accent-3`, card fills |
| `5–6` | Borders, separators | `border-neutral-5` |
| `7–8` | Stronger borders, icons | `border-accent-7`, `text-neutral-8` |
| `9` | **Solid colors** — the main swatch | `bg-accent-9`, `bg-danger-9` |
| `10` | Hover state for step 9 | `hover:bg-accent-10` |
| `11` | High-contrast text on light bg | `text-neutral-11`, `text-accent-11` |
| `12` | Maximum contrast text | `text-neutral-12` (near black/white) |

### Dark Sections
For dark hero/section backgrounds, use `bg-neutral-12` (light mode: `#202020`) or the literal `bg-[#0a0a0a]` for true black. Text on dark backgrounds uses `text-neutral-1` or `text-white`.

### ✅ Do
- Use `neutral-12` for primary text, `neutral-11` for secondary text
- Use `accent-9` for primary interactive elements
- Use flag colors (`success-9`, `warning-9`, `danger-9`) as semantic accents, not decoration
- Alternate dark (`neutral-12`) and light (`neutral-1`, `neutral-2`) sections

### ❌ Don't
- Don't use raw hex values — use the CSS variables / Tailwind tokens
- Don't use all three flag colors simultaneously as decoration (it looks like a Christmas tree)
- Don't use `neutral-400`, `neutral-900` etc. — those are Tailwind defaults, not our system
- Don't put colored text on colored backgrounds without checking contrast

---

## 3. Typography

### Font Stack

| Role | Font | Variable | Usage |
|------|------|----------|-------|
| **Sans** | Montserrat | `font-sans` | UI, headings, body text, navigation |
| **Serif** | Merriweather | `font-serif` | Editorial accents, pull quotes, section labels |

### Type Scale (via `--sizing-*`)

| Token | Size | Usage |
|-------|------|-------|
| `sizing-xs` | 0.75rem | Micro labels, version numbers |
| `sizing-sm` | 0.875rem | Small text, captions, metadata |
| `sizing-md` | 1rem | Body text (default) |
| `sizing-lg` | 1.125rem | Lead paragraphs, emphasized body |
| `sizing-xl` | 1.25rem | h3, card titles |
| `sizing-2xl` | 1.625rem | h2, section headings |
| `sizing-3xl` | 2.125rem | h1, page titles |
| `sizing-4xl` | 3rem | Hero headlines (mobile) |
| `sizing-5xl` | 4.75rem | Hero headlines (desktop), display numbers |

### Heading Guidelines
- **Hero headlines**: Big, bold, punchy. `text-4xl md:text-6xl font-bold tracking-tight`
- **Section headings**: `text-3xl md:text-4xl font-bold` — never `font-light` (we're editorial, not whisper-core)
- **Card titles**: `text-lg font-semibold`
- **Labels/kickers**: `text-sm uppercase tracking-widest font-semibold` in serif or colored accent

### ✅ Do
- Use `font-serif` for editorial kickers (section labels above headings)
- Use `tracking-tight` on large headings for density
- Use `uppercase tracking-widest` on small labels for authority

### ❌ Don't
- Don't use `font-light` on headings — it looks weak
- Don't mix serif body text with sans headings (reverse is fine)
- Don't go below `sizing-xs` — if you need smaller, rethink the hierarchy

---

## 4. Spacing & Layout

### Spacing Scale (`--spacing-*`)

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 0.25rem | Tight gaps (icon + label) |
| `2` | 0.375rem | Inline spacing |
| `3` | 0.75rem | Component internal padding |
| `4` | 1rem | Default gap, paragraph margin |
| `5` | 1.25rem | Card padding |
| `6` | 1.5rem | Section internal spacing |
| `7` | 2.25rem | Between components |
| `8` | 3rem | Section padding (mobile) |
| `9` | 3.5rem | Section padding (desktop) |

### Layout Patterns

- **Max content width**: `max-w-[1280px]` with `px-4 sm:px-6 lg:px-8`
- **Section vertical rhythm**: `py-20 md:py-32` for major sections, `py-12 md:py-16` for minor
- **Grid**: Feature cards use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (3-col max for readability)
- **Container**: Always center with `mx-auto w-full max-w-[1280px]`

### Section Rhythm Pattern
```
[Dark hero — bg-neutral-12, full bleed]
[Light section — bg-neutral-1, contained]
[Subtle section — bg-neutral-2, full bleed]
[Dark CTA — bg-neutral-12, full bleed]
[Footer — bg-neutral-12, full bleed]
```

---

## 5. Component Patterns

### Buttons

**Primary**: 
```
bg-accent-9 hover:bg-accent-10 text-white font-semibold rounded-full h-12 px-8
```

**Secondary/Ghost**:
```
border border-neutral-6 text-neutral-12 hover:bg-neutral-3 rounded-full h-12 px-8
```

**On dark backgrounds**:
```
bg-white text-neutral-12 hover:bg-neutral-3 rounded-full h-12 px-8
```

Always use `rounded-full` for CTAs. Always `h-12` minimum for touch targets.

### Cards

**Feature Card** (link card):
```
group relative bg-neutral-1 border border-neutral-4 rounded-2xl p-8
hover:border-accent-7 hover:shadow-lg transition-all
```

Each card should have:
- Colored icon container: `w-12 h-12 rounded-xl bg-{color}-3` with `text-{color}-9` icon
- Bold title: `text-lg font-semibold`
- Description: `text-sm text-neutral-11`
- Visual indicator of clickability (arrow, hover state)

### Badges / Kickers

Section kickers (above headings):
```
font-serif text-sm uppercase tracking-widest text-accent-11
```

Or with background:
```
inline-block bg-accent-3 text-accent-11 px-3 py-1 rounded-full text-sm font-medium
```

### Metric Display

Big numbers:
```
font-bold text-5xl md:text-6xl text-neutral-12 (or text-white on dark)
```

Label below:
```
text-sm uppercase tracking-widest text-neutral-9 mt-2
```

---

## 6. Motion

Using **framer-motion** throughout. Keep animations subtle and purposeful.

### Standard Animations

**Fade-in on scroll** (staggered):
```tsx
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};
```

**Use `whileInView`** for scroll-triggered animations:
```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  variants={fadeInUp}
  custom={0}
>
```

### ✅ Do
- Use `viewport={{ once: true }}` — animate once, not every scroll
- Stagger children with `custom={index}`
- Keep durations 0.4–0.8s
- Use the `[0.22, 1, 0.36, 1]` ease for smooth deceleration

### ❌ Don't
- Don't animate everything — pick key moments
- Don't use bounce or spring on text
- Don't animate layout shifts that cause content reflow
- Don't exceed 1s duration

---

## 7. Iconography

Using **lucide-react** exclusively. Default size: `w-5 h-5` inline, `w-6 h-6` in cards.

In colored containers:
```tsx
<div className="w-12 h-12 rounded-xl bg-accent-3 flex items-center justify-center">
  <BarChart3 className="w-6 h-6 text-accent-9" />
</div>
```

---

## 8. The Logo

The **DebaixoDolhoLogo** is a pixelated eye inspired by Camões. It comes in three sizes: `sm` (24px), `md` (32px), `lg` (48px).

- In the nav: `size="md"`, `text-neutral-12` (or `text-white` on dark)
- In the hero: `size="lg"` or a custom oversized version, `text-white`
- In the footer: `size="md"`, `text-white`

The logo should always be accompanied by the name "Debaixo d'olho" in text (except in very tight spaces like mobile nav).

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| Default | < 640px | Mobile-first base |
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets, 2-column grids |
| `lg` | 1024px | Desktop, 3-column grids |
| `xl` | 1280px | Wide desktop |

---

## 10. Accessibility

- All interactive elements must have visible focus states (`focus:ring-2 focus:ring-accent-7`)
- Color alone should never convey meaning — always pair with text/icons
- Minimum contrast ratio: 4.5:1 for text, 3:1 for large text
- All images/icons need alt text or `aria-label`
- Semantic HTML: use `<section>`, `<nav>`, `<main>`, `<footer>` correctly

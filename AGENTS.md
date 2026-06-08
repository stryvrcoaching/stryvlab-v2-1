# STRYVR

## Mission

Build a coach-first SaaS for training generation and morphological analysis.

## Priorities

1. Business logic accuracy
2. Data model integrity
3. Backend robustness
4. UI clarity

## Stack

- Next.js (App Router)
- TypeScript (strict)
- Prisma
- PostgreSQL (Supabase)
- Inngest (async job queue — durable, retry, timeout)

## Rules

- DB = runtime truth (`prisma/schema.prisma`)
- Seeds = version truth (idempotent upserts)
- English internal, FR/ES external via `*_translations` tables
- No n8n — all async jobs run via Inngest, all business logic stays in Next.js backend
- Update `CHANGELOG.md` after every code change
- Run `npx tsc --noEmit` after every change — 0 errors
- Update `project-state.md` automatically after every significant feature — no confirmation needed, no waiting for end of session

## Imports (Read in order at session start)

1. @docs/STRYVR_STRATEGIC_VISION_2026.md — **STRATEGIC NORTH STAR** (Vision, pillars, ecosystem, roadmap)
2. @.Codex/rules/project-state.md — Living project state, latest features, next steps
3. @docs/architecture/data-model.md — Data model (if changes needed)
4. @docs/DESIGN_SYSTEM_V2.0_QUICK_REFERENCE.md — Design system essentials (UI/UX alignment) — **condensed 2k tokens** instead of full 29k reference
5. @docs/product/PRD.md — Product requirements (if feature scope unclear)

**Full DS specs** → `DESIGN_SYSTEM_V2.0_REFERENCE.md` (detailed component patterns, animations, edge cases)

## DS v2.0 — Non-Negotiable Rules

**Two critical principles ALWAYS respected across sections (coach, client, etc.) :**

1. **TopBar = Unique Navigation/Header**
   - Use `useSetTopBar(topBarLeft, topBarRight)` hook
   - TopBarLeft: section label (`text-[9px] text-white/30`) + title (`text-[13px] text-white`)
   - TopBarRight: action buttons (usually "+ Nouveau" style)
   - NEVER duplicate header in main content — remove all sticky headers
   - Examples: `/coach/clients`, `/coach/assessments`

2. **App Background = ALWAYS #121212 (never intermediate)**
   - `<main>` tag: MUST use `bg-[#121212]`
   - Cards/content: use `bg-white/[0.02]` overlays only
   - Exception: Modals can use `bg-[#181818]` for card container ONLY
   - NEVER use #181818, #141414, or other grays as main background

## DS v3.0 — Non-Negotiable Rules (App client `/client` + landing `/stryvr`)

**Tokens stricts — NE JAMAIS dévier :**

| Token | Valeur | Usage |
|-------|--------|-------|
| Background | `#0d0d0d` | fond toutes pages client |
| Surface | `#161616` | cards, modals, sheets |
| Accent | `#ffe01e` | CTA jaune uniquement |
| Texte sur jaune | `#0d0d0d` | TOUJOURS sur bg-[#ffe01e] |
| Accent tempo | `#FFB800` | TempoGuideModal uniquement |
| Police | `font-barlow` (body) + `font-barlow-condensed` (labels uppercase) | |

**Radius — hiérarchie STRICTE :**
- `rounded-2xl` → modals, sheets, cards principales
- `rounded-xl` → inputs, boutons, items liste, cards secondaires
- `rounded-lg` → icônes, badges petits
- `rounded-full` → dots, pills, avatars
- **`rounded-[2px]` = INTERDIT dans `/client` et `/components/client`**

**Règles supplémentaires :**
- Aucune `shadow-*` colorée (pas de glow vert, pas de glow jaune)
- Aucun gradient coloré en fond de card (`from-[#1f8a65]`, `from-[#ffe01e]` etc.)
- Borders neutres : `border border-white/[0.08]` ou `border-[0.3px] border-white/[0.06]`
- Labels uppercase : `font-barlow-condensed font-bold uppercase tracking-[0.18em]`
- Grille table headers : même `gridTemplateColumns` ET même `gap-*` que les data rows

---

## Agents

- `biomech-architect` — biomechanics and hypertrophy analysis
- `explore-codebase` — codebase exploration before implementing a feature
- `explore-docs` — library documentation research via Context7
- `websearch` — quick web search
- `db-reviewer` — review schema, migrations, seeds
- `ui-ux-reviewer` — review UI components and flows

## Key Rules (read before working)

- `.Codex/rules/project-state.md` — living project state, module status, next steps
- `.Codex/rules/database-patterns.md` — Prisma patterns and gotchas
- `.Codex/rules/inngest-patterns.md` — Inngest job patterns and conventions
- `.Codex/rules/feature-delivery.md` — feature delivery order (schema first)
- `.Codex/rules/ui-design-system.md` — design tokens and components (DS v2.0 — Flat Dark)
- `.Codex/rules/changelog.md` — changelog format (mandatory after every change)
- `.Codex/rules/documentation-process.md` — session start/end process

## Key Skills

- `prisma-schema` — safe schema changes
- `seed-catalog` — exercise catalog seeds
- `migration-guard` — pre-migration checklist
- `training-engine-rules` — volume allocation invariants
- `morphology-rules` — MorphoPro bridge patterns
- `exercise-taxonomy` — exercise classification system
- `git-atomic-commits` — commit format and conventions

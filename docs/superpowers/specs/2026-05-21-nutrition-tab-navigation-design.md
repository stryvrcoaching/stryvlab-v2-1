# Nutrition Tab Navigation — Design Spec

**Date:** 2026-05-21
**Status:** Approved
**Scope:** Client PWA — `/client/nutrition`

---

## Problème

La page Nutrition accumule tous les composants sur une seule page scrollable : grille 7 jours, macros du jour, reste à consommer, régularité, protocole calculé, et journal des repas. L'UX devient dense. Le pattern tab de la section Programme (Séance / Performances / Historique) a prouvé son efficacité pour organiser du contenu hétérogène.

---

## Solution

Introduire une barre de 3 onglets dans la section Nutrition, avec le même design que `ProgrammeClientPage.tsx`. Refactoriser `page.tsx` (Server Component) pour déléguer l'état de navigation à un nouveau `NutritionClientPage.tsx` (Client Component).

---

## Architecture

### Avant
```
app/client/nutrition/page.tsx   ← Server Component, fetch + render tout
```

### Après
```
app/client/nutrition/page.tsx          ← Server Component, fetch uniquement
app/client/nutrition/NutritionClientPage.tsx  ← Client Component, tabs + render
```

`page.tsx` passe toutes les données en props à `NutritionClientPage`. Aucun fetch ne migre côté client.

---

## Onglets

### Onglet 1 — Aujourd'hui (défaut)

Composants, dans l'ordre :
1. `SmartAlertsFeed` — alertes nutrition du jour
2. `SmartNutritionHero` — macros cible vs consommé
3. `RemainingBreakdown` — reste à consommer (P / L / G / eau)
4. `NutritionMealsList` — journal des repas du jour (éditable)
5. `VoiceEntryFab` — FAB micro (uniquement sur cet onglet)

### Onglet 2 — Tendances

Composants, dans l'ordre :
1. `MacroWeekGrid` — grille 7 jours calories + macros
2. `TdeeChart` — courbe TDEE adaptative
3. `NutritionStreakCard` — streak régularité + calendrier 90 jours

### Onglet 3 — Protocole

Composants :
1. `ProtocolRationale` — décomposition TDEE, calcul macros cibles, source données

---

## Tab Bar Design

Pattern identique à `ProgrammeClientPage.tsx` :

```tsx
<div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
  {TABS.map(({ id, label }) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
        tab === id
          ? 'bg-[#f2f2f2] text-[#080808] shadow-sm font-barlow-condensed font-bold uppercase tracking-wide'
          : 'text-white/40 hover:text-white/70'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

- Pas de swipe gesture
- Onglet par défaut : `aujourd_hui`
- Pas de persistance URL (état local React uniquement)

---

## Props de NutritionClientPage

```tsx
interface Props {
  date: string
  target: NutritionMacros          // de SmartNutritionWidget
  consumed: NutritionMacros
  meals: NutritionMeal[]           // de lib/nutrition/food-items
  alerts: GenericAlert[]           // de SmartAlertsFeed
  trend: ReturnType<typeof buildTrend>  // tableau inline, inféré à l'implémentation
  loggedDates: Set<string>
  tdeeAdaptive: number | null
  tdeeDataSource: string | null
  bodyWeightKg: number | null
  protocolDay: any | null          // shape: { name, calories, protein_g, carbs_g, fat_g, hydration_ml, recommendations }
  lang: ClientLang
}
```

`NutritionMacros`, `NutritionMeal`, `GenericAlert`, `ClientLang` sont déjà importables depuis leurs modules respectifs. `trend` et `protocolDay` sont des shapes inline construites dans `page.tsx` — les types exacts seront inférés à l'implémentation.

---

## i18n

3 nouvelles clés à ajouter dans `lib/i18n/clientTranslations.ts` :

| Clé | FR | EN | ES |
|-----|----|----|-----|
| `nutrition.tab.aujourd_hui` | Aujourd'hui | Today | Hoy |
| `nutrition.tab.tendances` | Tendances | Trends | Tendencias |
| `nutrition.tab.protocole` | Protocole | Protocol | Protocolo |

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `app/client/nutrition/page.tsx` | Modifier — déléguer render à `NutritionClientPage` |
| `app/client/nutrition/NutritionClientPage.tsx` | Créer — Client Component avec tabs |
| `lib/i18n/clientTranslations.ts` | Modifier — ajouter 3 clés `nutrition.tab.*` |
| `CHANGELOG.md` | Mettre à jour |

---

## Ce qui ne change pas

- Tous les composants existants (`SmartNutritionHero`, `NutritionMealsList`, etc.) — aucune modification
- Le fetch server-side dans `page.tsx` — inchangé
- La route `/client/nutrition/log` et `/client/nutrition/journal` — inchangées
- Le `ClientTopBar` — inchangé (section "NUTRITION", titre = date)
- Le `VoiceEntryFab` existant — déplacé dans l'onglet Aujourd'hui uniquement

---

## Hors scope

- Swipe gesture entre onglets
- Persistance de l'onglet actif en URL
- Nouveaux composants ou nouvelles données

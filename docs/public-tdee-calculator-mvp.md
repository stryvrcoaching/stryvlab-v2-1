# Public TDEE Calculator MVP

## Positioning

Public-facing metabolic planner inspired by the coach nutrition studio, but rebuilt for a non-technical audience.

Core promise:
- guided flow
- day-specific TDEE
- explicit BMR / NEAT / EAT / TEF logic
- programmable deficit / maintenance / surplus
- exportable result

## Product Shape

Route:
- `/calculateur`

Flow:
1. Profile
2. Daily expenditure
3. Context
4. Plan

Outputs:
- training day target
- rest day target
- weekly average
- component waterfall
- provenance badges
- share / copy / JSON / print export

## Architecture

Engine:
- base scientific logic remains in `lib/formulas/macros.ts`
- public orchestration layer lives in `lib/nutrition/publicTdeePlanner.ts`

Public layer responsibilities:
- transform simple public inputs into macro engine inputs
- derive training-day and rest-day outputs
- apply a simple day-distribution mode
- keep a shareable/exportable result shape

UI:
- `app/calculateur/page.tsx`
- `app/calculateur/TdeePlannerPage.tsx`

## MVP Limits

Included:
- measured BMR priority
- Katch-McArdle / Mifflin fallback
- steps + occupation NEAT
- muscu/cardio EAT
- TEF
- goal-based adjustment
- training/rest split

Not included yet:
- coach weekly review engine
- adaptive TDEE from weight logs
- full protocol editor
- saved public sessions in database
- PDF layout generation beyond browser print

## Next Logical Iterations

1. Shareable URL state
2. PDF export template
3. Visual weekly planner
4. Adaptive TDEE from repeated weigh-ins
5. lead capture / CTA variant for Instagram campaigns

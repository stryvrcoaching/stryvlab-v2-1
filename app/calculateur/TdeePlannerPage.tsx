'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Copy,
  Download,
  Flame,
  Moon,
  Printer,
  Share2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Dumbbell,
} from 'lucide-react'

import {
  buildPublicTdeePlanner,
  formatPlannerSummary,
  type DayDistribution,
  type OccupationPreset,
  type PublicTdeePlannerInput,
  type PublicTdeePlannerResult,
} from '@/lib/nutrition/publicTdeePlanner'
import type { MacroGoal, MacroGender } from '@/lib/formulas/macros'

type StepId = 0 | 1 | 2 | 3

type FormState = {
  gender: MacroGender
  goal: MacroGoal
  age: string
  weight: string
  height: string
  bodyFat: string
  muscleMassKg: string
  bmrKcalMeasured: string
  visceralFatLevel: string
  steps: string
  occupationPreset: OccupationPreset
  workHoursPerWeek: string
  workouts: string
  sessionDurationMin: string
  cardioFrequency: string
  cardioDurationMin: string
  stressLevel: string
  sleepDurationH: string
  caffeineDaily: string
  alcoholWeekly: string
  menstrualPhase: 'unknown' | 'follicular' | 'luteal'
  distribution: DayDistribution
}

const STEPS = [
  { id: 0 as StepId, label: 'Profil' },
  { id: 1 as StepId, label: 'Depense' },
  { id: 2 as StepId, label: 'Contexte' },
  { id: 3 as StepId, label: 'Plan' },
]

const DEFAULT_FORM: FormState = {
  gender: 'male',
  goal: 'deficit',
  age: '',
  weight: '',
  height: '',
  bodyFat: '',
  muscleMassKg: '',
  bmrKcalMeasured: '',
  visceralFatLevel: '',
  steps: '8000',
  occupationPreset: 'moderate',
  workHoursPerWeek: '',
  workouts: '4',
  sessionDurationMin: '70',
  cardioFrequency: '0',
  cardioDurationMin: '30',
  stressLevel: '',
  sleepDurationH: '',
  caffeineDaily: '',
  alcoholWeekly: '',
  menstrualPhase: 'unknown',
  distribution: 'balanced',
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildPlannerInput(form: FormState): PublicTdeePlannerInput | null {
  const age = Number(form.age)
  const weight = Number(form.weight)
  const height = Number(form.height)
  const workouts = Number(form.workouts)

  if (!age || !weight || !height || Number.isNaN(workouts)) return null

  return {
    age,
    weight,
    height,
    gender: form.gender,
    goal: form.goal,
    bodyFat: parseOptionalNumber(form.bodyFat),
    muscleMassKg: parseOptionalNumber(form.muscleMassKg),
    bmrKcalMeasured: parseOptionalNumber(form.bmrKcalMeasured),
    visceralFatLevel: parseOptionalNumber(form.visceralFatLevel),
    steps: parseOptionalNumber(form.steps),
    occupationPreset: form.occupationPreset,
    workHoursPerWeek: parseOptionalNumber(form.workHoursPerWeek),
    workouts,
    sessionDurationMin: parseOptionalNumber(form.sessionDurationMin),
    trainingCaloriesWeekly: undefined,
    cardioFrequency: parseOptionalNumber(form.cardioFrequency),
    cardioDurationMin: parseOptionalNumber(form.cardioDurationMin),
    stressLevel: parseOptionalNumber(form.stressLevel),
    sleepDurationH: parseOptionalNumber(form.sleepDurationH),
    caffeineDaily: parseOptionalNumber(form.caffeineDaily),
    alcoholWeekly: parseOptionalNumber(form.alcoholWeekly),
    menstrualPhase: form.gender === 'female' ? form.menstrualPhase : undefined,
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f6d62]">
          {label}
        </span>
        {hint ? <span className="text-[11px] text-[#6f7f74]">{hint}</span> : null}
      </div>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-12 w-full rounded-2xl border border-[#d9e4da] bg-white px-4 text-[15px] font-semibold text-[#152018] outline-none transition focus:border-[#256b47] focus:ring-4 focus:ring-[#256b47]/10"
    />
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              active
                ? 'border-[#256b47] bg-[#256b47] text-white shadow-[0_16px_40px_-24px_rgba(37,107,71,0.75)]'
                : 'border-[#d9e4da] bg-white text-[#1d2a20] hover:border-[#b9c8bc]'
            }`}
          >
            <span className="text-[14px] font-semibold">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ResultCard({
  title,
  icon: Icon,
  calories,
  protein,
  carbs,
  fats,
  subtitle,
}: {
  title: string
  icon: typeof Dumbbell
  calories: number
  protein: number
  carbs: number
  fats: number
  subtitle: string
}) {
  return (
    <div className="rounded-[28px] border border-[#dbe7dd] bg-white p-5 shadow-[0_18px_50px_-35px_rgba(18,35,24,0.35)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d7c70]">
            {title}
          </p>
          <p className="mt-1 text-[13px] text-[#617064]">{subtitle}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6f0] text-[#256b47]">
          <Icon size={20} />
        </div>
      </div>

      <div className="mb-4 flex items-end gap-2">
        <span className="text-4xl font-black tracking-tight text-[#142118]">
          {calories}
        </span>
        <span className="pb-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6d7c70]">
          kcal
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Proteines', value: protein },
          { label: 'Glucides', value: carbs },
          { label: 'Lipides', value: fats },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-[#f5f8f5] p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#718075]">
              {item.label}
            </p>
            <p className="mt-1 text-[18px] font-bold text-[#142118]">{item.value}g</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TdeePlannerPage() {
  const [step, setStep] = useState<StepId>(0)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [result, setResult] = useState<PublicTdeePlannerResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plannerInput = useMemo(() => buildPlannerInput(form), [form])

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function calculate() {
    if (!plannerInput) {
      setError('Renseigne au minimum age, poids, taille et nombre de seances.')
      return
    }

    setError(null)
    setResult(buildPublicTdeePlanner(plannerInput, form.distribution))
  }

  async function copySummary() {
    if (!result) return
    await navigator.clipboard.writeText(formatPlannerSummary(result))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  async function shareSummary() {
    if (!result) return
    const text = formatPlannerSummary(result)
    if (navigator.share) {
      await navigator.share({
        title: 'Calculateur TDEE STRYV',
        text,
        url: window.location.href,
      })
      return
    }
    await copySummary()
  }

  function downloadJson() {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'tdee-plan.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const hasFemaleContext = form.gender === 'female'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(42,115,72,0.18),_transparent_28%),linear-gradient(180deg,_#fbfdfb_0%,_#f3f8f3_100%)] text-[#142118]">
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7e3d9] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#256b47]">
              <Sparkles size={14} />
              Version publique guidee
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-[#132017] sm:text-5xl">
              Calcule ton TDEE avec une logique coach, sans subir une interface coach.
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#536257]">
              Le flow reste simple. Le moteur garde la logique profonde:
              BMR, NEAT, EAT, TEF, contexte, jours entrainement et jours repos.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'BMR', value: 'priorise' },
              { label: 'TDEE', value: 'par jour' },
              { label: 'Plan', value: 'exportable' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-[#dce7de] bg-white/85 px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#728176]">
                  {item.label}
                </p>
                <p className="mt-1 text-[17px] font-bold text-[#142118]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className="rounded-[32px] border border-[#d8e4da] bg-white/80 p-5 shadow-[0_30px_80px_-45px_rgba(19,34,24,0.35)] backdrop-blur sm:p-7">
            <div className="mb-6 flex flex-wrap gap-2">
              {STEPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    step === item.id
                      ? 'bg-[#142118] text-white'
                      : 'bg-[#eef4ef] text-[#556358] hover:bg-[#e5efe7]'
                  }`}
                >
                  {item.id + 1}. {item.label}
                </button>
              ))}
            </div>

            {step === 0 ? (
              <div className="grid gap-6">
                <Segmented
                  value={form.goal}
                  onChange={(value) => patchForm('goal', value)}
                  options={[
                    { value: 'deficit', label: 'Deficit' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'surplus', label: 'Surplus' },
                  ]}
                />

                <Segmented
                  value={form.gender}
                  onChange={(value) => patchForm('gender', value)}
                  options={[
                    { value: 'male', label: 'Homme' },
                    { value: 'female', label: 'Femme' },
                  ]}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Age">
                    <TextInput value={form.age} onChange={(value) => patchForm('age', value)} placeholder="30" />
                  </Field>
                  <Field label="Poids" hint="kg">
                    <TextInput value={form.weight} onChange={(value) => patchForm('weight', value)} placeholder="80" />
                  </Field>
                  <Field label="Taille" hint="cm">
                    <TextInput value={form.height} onChange={(value) => patchForm('height', value)} placeholder="180" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Body fat" hint="% optionnel">
                    <TextInput value={form.bodyFat} onChange={(value) => patchForm('bodyFat', value)} placeholder="18" />
                  </Field>
                  <Field label="Masse musculaire" hint="kg optionnel">
                    <TextInput
                      value={form.muscleMassKg}
                      onChange={(value) => patchForm('muscleMassKg', value)}
                      placeholder="44"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pas quotidiens">
                    <TextInput value={form.steps} onChange={(value) => patchForm('steps', value)} placeholder="8000" />
                  </Field>
                  <Field label="Occupation">
                    <select
                      value={form.occupationPreset}
                      onChange={(event) => patchForm('occupationPreset', event.target.value as OccupationPreset)}
                      className="h-12 w-full rounded-2xl border border-[#d9e4da] bg-white px-4 text-[15px] font-semibold text-[#152018] outline-none transition focus:border-[#256b47] focus:ring-4 focus:ring-[#256b47]/10"
                    >
                      <option value="sedentary">Sedentaire</option>
                      <option value="light">Legerement actif</option>
                      <option value="moderate">Modere</option>
                      <option value="active">Tres actif</option>
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Seances / semaine">
                    <TextInput
                      value={form.workouts}
                      onChange={(value) => patchForm('workouts', value)}
                      placeholder="4"
                    />
                  </Field>
                  <Field label="Duree / seance" hint="min">
                    <TextInput
                      value={form.sessionDurationMin}
                      onChange={(value) => patchForm('sessionDurationMin', value)}
                      placeholder="70"
                    />
                  </Field>
                  <Field label="Heures de travail" hint="/ sem">
                    <TextInput
                      value={form.workHoursPerWeek}
                      onChange={(value) => patchForm('workHoursPerWeek', value)}
                      placeholder="40"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cardio / semaine">
                    <TextInput
                      value={form.cardioFrequency}
                      onChange={(value) => patchForm('cardioFrequency', value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Duree cardio" hint="min">
                    <TextInput
                      value={form.cardioDurationMin}
                      onChange={(value) => patchForm('cardioDurationMin', value)}
                      placeholder="30"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="BMR mesure" hint="kcal optionnel">
                    <TextInput
                      value={form.bmrKcalMeasured}
                      onChange={(value) => patchForm('bmrKcalMeasured', value)}
                      placeholder="1820"
                    />
                  </Field>
                  <Field label="Graisse viscerale" hint="optionnel">
                    <TextInput
                      value={form.visceralFatLevel}
                      onChange={(value) => patchForm('visceralFatLevel', value)}
                      placeholder="10"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Stress" hint="/10">
                    <TextInput
                      value={form.stressLevel}
                      onChange={(value) => patchForm('stressLevel', value)}
                      placeholder="5"
                    />
                  </Field>
                  <Field label="Sommeil" hint="h">
                    <TextInput
                      value={form.sleepDurationH}
                      onChange={(value) => patchForm('sleepDurationH', value)}
                      placeholder="7.5"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cafeine" hint="mg/j">
                    <TextInput
                      value={form.caffeineDaily}
                      onChange={(value) => patchForm('caffeineDaily', value)}
                      placeholder="200"
                    />
                  </Field>
                  <Field label="Alcool" hint="verres/sem">
                    <TextInput
                      value={form.alcoholWeekly}
                      onChange={(value) => patchForm('alcoholWeekly', value)}
                      placeholder="0"
                    />
                  </Field>
                </div>

                {hasFemaleContext ? (
                  <Field label="Phase actuelle">
                    <Segmented
                      value={form.menstrualPhase}
                      onChange={(value) => patchForm('menstrualPhase', value)}
                      options={[
                        { value: 'unknown', label: 'Inconnue' },
                        { value: 'follicular', label: 'Folliculaire' },
                        { value: 'luteal', label: 'Luteale' },
                      ]}
                    />
                  </Field>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-6">
                <Field label="Mode de repartition">
                  <Segmented
                    value={form.distribution}
                    onChange={(value) => patchForm('distribution', value)}
                    options={[
                      { value: 'balanced', label: 'Equilibre' },
                      { value: 'training_focus', label: 'Priorite training' },
                      { value: 'recovery_focus', label: 'Priorite repos' },
                    ]}
                  />
                </Field>

                <div className="rounded-[28px] bg-[#f4f8f4] p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#617064]">
                    Ce que tu vas obtenir
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        icon: Dumbbell,
                        title: 'Jour entrainement',
                        text: 'Calories et macros proteges autour de la depense sportive.',
                      },
                      {
                        icon: Moon,
                        title: 'Jour repos',
                        text: 'Cible specifique sans surpayer les jours plus calmes.',
                      },
                      {
                        icon: Target,
                        title: 'Moyenne hebdo',
                        text: 'Vision simple pour programmer ton deficit ou ton surplus.',
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-2xl bg-white p-4">
                        <item.icon size={18} className="text-[#256b47]" />
                        <p className="mt-3 text-[13px] font-bold text-[#142118]">{item.title}</p>
                        <p className="mt-2 text-[13px] leading-6 text-[#5d6b60]">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2ebe3] pt-6">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1) as StepId)}
                className="rounded-full border border-[#d9e4da] bg-white px-5 py-3 text-[14px] font-semibold text-[#223125] transition hover:border-[#bacabf]"
              >
                Retour
              </button>

              <div className="flex flex-wrap items-center gap-3">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => Math.min(3, current + 1) as StepId)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#142118] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1b2c20]"
                  >
                    Continuer
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={calculate}
                    className="inline-flex items-center gap-2 rounded-full bg-[#256b47] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_18px_40px_-22px_rgba(37,107,71,0.7)] transition hover:bg-[#215f3f]"
                  >
                    Calculer mon plan
                    <Sparkles size={16} />
                  </button>
                )}
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl border border-[#f0d6d6] bg-[#fff3f3] px-4 py-3 text-[13px] text-[#8c3f3f]">
                {error}
              </p>
            ) : null}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[32px] border border-[#d8e4da] bg-[#142118] p-5 text-white shadow-[0_30px_80px_-40px_rgba(18,33,24,0.6)] sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Resultat
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    {result ? `${result.weekly.averageCalories} kcal / jour` : 'En attente'}
                  </h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-[#8fe2ae]">
                  <Flame size={20} />
                </div>
              </div>

              {result ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                      Cible hebdo
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight">
                      {result.weekly.weeklyCalorieTarget} kcal
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-white/70">
                      {result.trainingDays} jours entrainement, {result.restDays} jours repos.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <ResultCard
                      title="Jour entrainement"
                      icon={Dumbbell}
                      calories={result.trainingDay.calories}
                      protein={result.trainingDay.protein}
                      carbs={result.trainingDay.carbs}
                      fats={result.trainingDay.fats}
                      subtitle={`${result.trainingDay.tdee} kcal de depense estimee`}
                    />

                    <ResultCard
                      title="Jour repos"
                      icon={Moon}
                      calories={result.restDay.calories}
                      protein={result.restDay.protein}
                      carbs={result.restDay.carbs}
                      fats={result.restDay.fats}
                      subtitle={`${result.restDay.tdee} kcal de depense estimee`}
                    />
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                      Waterfall moyen
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: 'BMR', value: result.average.breakdown.bmr },
                        { label: 'NEAT', value: result.average.breakdown.neat },
                        { label: 'EAT', value: result.average.breakdown.eat + result.average.breakdown.eatCardio },
                        { label: 'TEF', value: result.average.breakdown.tef },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-black/15 p-3">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                            {item.label}
                          </p>
                          <p className="mt-1 text-[20px] font-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                      Provenance
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        `BMR: ${result.average.dataProvenance.bmrSource}`,
                        `LBM: ${result.average.dataProvenance.lbmSource}`,
                        `NEAT: ${result.average.dataProvenance.neatSource}`,
                        `EAT: ${result.average.dataProvenance.eatSource}`,
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[11px] text-white/78"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={copySummary}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-[14px] font-semibold text-[#142118] transition hover:bg-[#edf3ee]"
                    >
                      <Copy size={16} />
                      {copied ? 'Copie' : 'Copier'}
                    </button>
                    <button
                      type="button"
                      onClick={shareSummary}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#256b47] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#215f3f]"
                    >
                      <Share2 size={16} />
                      Partager
                    </button>
                    <button
                      type="button"
                      onClick={downloadJson}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-white/14"
                    >
                      <Download size={16} />
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-white/14"
                    >
                      <Printer size={16} />
                      PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
                  <p className="text-[13px] leading-7 text-white/72">
                    Remplis les 4 etapes puis lance le calcul. Tu obtiendras un
                    jour entrainement, un jour repos, une moyenne hebdo et un
                    resume exportable.
                  </p>
                  <div className="mt-5 grid gap-3">
                    {[
                      { icon: User, text: 'Profil de base et objectif' },
                      { icon: TrendingUp, text: 'Depense quotidienne et sportive' },
                      { icon: TrendingDown, text: 'Contexte qui module la cible' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3 rounded-2xl bg-black/15 p-3">
                        <item.icon size={16} className="text-[#8fe2ae]" />
                        <span className="text-[13px] text-white/78">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

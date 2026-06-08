"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, BookOpen, X, Check } from "lucide-react";
import ClientTopBar from "@/components/client/ClientTopBar";

type MealTemplate = {
  id: string;
  name: string;
  description?: string | null;
  calories_kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fats_g?: number | null;
  fiber_g?: number | null;
};

type Meal = {
  id: string;
  name: string;
  logged_at: string;
  photo_url: string | null;
  quality_rating: number | null;
  notes: string | null;
  estimated_macros?: {
    calories_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
    fiber_g?: number;
  } | null;
};

function dateIso(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function MacroTag({ label, value, color }: { label: string; value: number | null | undefined; color: string }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-white/50">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label} <span className="text-white/70 font-semibold">{value}g</span>
    </span>
  );
}

const emptyForm = (mealNumber: number, dateIsoStr: string) => ({
  name: `Repas ${mealNumber}`,
  quality_rating: 3,
  notes: "",
  logged_at_date: dateIsoStr,
  logged_at_time: new Date().toTimeString().slice(0, 5),
  photo_url: "" as string,
  calories_kcal: "",
  protein_g: "",
  carbs_g: "",
  fats_g: "",
  fiber_g: "",
});

export default function ClientMealsPage() {
  const [selectedDate, setSelectedDate] = useState(dateIso(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm(1, dateIso(new Date())));

  async function loadMeals(date = selectedDate) {
    setLoading(true);
    const res = await fetch(`/api/client/meals?date=${date}&limit=100`);
    const data = await res.json();
    setMeals(data?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/client/meal-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    loadMeals(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  function openAddForm() {
    setForm(emptyForm(meals.length + 1, selectedDate));
    setShowTemplates(false);
    setAdding(true);
  }

  function applyTemplate(t: MealTemplate) {
    setForm((f) => ({
      ...f,
      name: t.name,
      calories_kcal: t.calories_kcal ? String(t.calories_kcal) : "",
      protein_g: t.protein_g ? String(t.protein_g) : "",
      carbs_g: t.carbs_g ? String(t.carbs_g) : "",
      fats_g: t.fats_g ? String(t.fats_g) : "",
      fiber_g: t.fiber_g ? String(t.fiber_g) : "",
      notes: t.description ?? "",
    }));
    setShowTemplates(false);
  }

  async function createMeal() {
    const loggedAt = new Date(`${form.logged_at_date}T${form.logged_at_time}:00`).toISOString();
    const res = await fetch("/api/client/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim() || `Repas ${meals.length + 1}`,
        quality_rating: form.quality_rating ?? null,
        notes: form.notes || null,
        logged_at: loggedAt,
        photo_url: form.photo_url || null,
        estimated_macros: {
          calories_kcal: form.calories_kcal ? Number(form.calories_kcal) : undefined,
          protein_g: form.protein_g ? Number(form.protein_g) : undefined,
          carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
          fats_g: form.fats_g ? Number(form.fats_g) : undefined,
          fiber_g: form.fiber_g ? Number(form.fiber_g) : undefined,
        },
      }),
    });
    if (res.ok) {
      setAdding(false);
      await loadMeals(selectedDate);
    }
  }

  async function deleteMeal(id: string) {
    const res = await fetch(`/api/client/meals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeletingId(null);
      await loadMeals(selectedDate);
    }
  }

  async function uploadPhoto(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/client/meals/upload-photo", { method: "POST", body });
    if (!res.ok) return;
    const data = await res.json();
    setForm((f) => ({ ...f, photo_url: data.url ?? "" }));
  }

  function shiftDay(delta: number) {
    const base = new Date(`${selectedDate}T12:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + delta);
    setSelectedDate(base.toISOString().slice(0, 10));
  }

  const sortedMeals = useMemo(
    () => [...meals].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()),
    [meals]
  );

  const totalMacros = useMemo(() => {
    return sortedMeals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + (m.estimated_macros?.calories_kcal ?? 0),
        p: acc.p + (m.estimated_macros?.protein_g ?? 0),
        c: acc.c + (m.estimated_macros?.carbs_g ?? 0),
        f: acc.f + (m.estimated_macros?.fats_g ?? 0),
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
  }, [sortedMeals]);

  const isToday = selectedDate === dateIso(new Date());

  return (
    <div className="min-h-screen bg-[#121212]">
      <ClientTopBar section="Nutrition" title="Journal alimentaire" />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-32 space-y-4">
        {/* Date nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDay(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[13px] font-semibold text-white capitalize">{formatDate(selectedDate)}</p>
            {isToday && <p className="text-[10px] text-[#1f8a65] font-semibold uppercase tracking-[0.12em]">Aujourd'hui</p>}
          </div>
          <button
            onClick={() => shiftDay(1)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Bilan macros du jour */}
        {totalMacros.kcal > 0 && (
          <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35 font-semibold mb-3">Bilan du jour</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "kcal", value: Math.round(totalMacros.kcal), color: "text-[#1f8a65]" },
                { label: "Prot.", value: Math.round(totalMacros.p), color: "text-blue-400" },
                { label: "Gluc.", value: Math.round(totalMacros.c), color: "text-amber-400" },
                { label: "Lip.", value: Math.round(totalMacros.f), color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/[0.02] rounded-xl p-2.5 text-center">
                  <p className={`text-[15px] font-black ${color} leading-none`}>{value}</p>
                  <p className="text-[9px] text-white/35 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste repas */}
        <div className="space-y-2">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-white/[0.06] shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-white/[0.06] rounded-full w-2/3" />
                  <div className="h-2.5 bg-white/[0.04] rounded-full w-1/2" />
                </div>
              </div>
            ))
          ) : !sortedMeals.length ? (
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-8 text-center">
              <p className="text-[12px] text-white/30">Aucun repas enregistré</p>
              <p className="text-[11px] text-white/20 mt-1">Appuyez sur + pour ajouter votre premier repas</p>
            </div>
          ) : (
            sortedMeals.map((meal, idx) => {
              const time = new Date(meal.logged_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={meal.id} className="relative">
                  {/* Swipe-to-delete bg */}
                  {deletingId === meal.id && (
                    <div className="absolute inset-0 rounded-2xl bg-red-500/15 border-[0.3px] border-red-500/30 flex items-center justify-end pr-4 z-0">
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="flex items-center gap-1.5 text-[11px] text-red-300 font-semibold"
                      >
                        <Trash2 size={13} />
                        Supprimer
                      </button>
                    </div>
                  )}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -90, right: 0 }}
                    onDragEnd={(_, info) => setDeletingId(info.offset.x < -50 ? meal.id : null)}
                    className="relative z-10 bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-3 flex items-start gap-3"
                  >
                    {meal.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={meal.photo_url} alt={meal.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white/[0.04] shrink-0 flex items-center justify-center">
                        <span className="text-[18px] font-black text-white/10">{idx + 1}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] text-white font-semibold leading-tight truncate">{meal.name}</p>
                        <p className="text-[10px] text-white/35 shrink-0 mt-0.5">{time}</p>
                      </div>
                      {meal.estimated_macros?.calories_kcal ? (
                        <p className="text-[13px] font-bold text-[#1f8a65] mt-0.5">{meal.estimated_macros.calories_kcal} kcal</p>
                      ) : null}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        <MacroTag label="P" value={meal.estimated_macros?.protein_g} color="bg-blue-500" />
                        <MacroTag label="G" value={meal.estimated_macros?.carbs_g} color="bg-amber-500" />
                        <MacroTag label="L" value={meal.estimated_macros?.fats_g} color="bg-red-500" />
                      </div>
                      {meal.notes ? <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{meal.notes}</p> : null}
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={openAddForm}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-[#1f8a65] flex items-center justify-center shadow-[0_8px_24px_rgba(31,138,101,0.4)] active:scale-[0.95] transition-transform z-30"
      >
        <Plus size={22} className="text-white" />
      </button>

      {/* Bottom sheet — Ajouter un repas */}
      <AnimatePresence>
        {adding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdding(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-[#181818] border-t-[0.3px] border-white/[0.08] flex flex-col"
              style={{ maxHeight: "88vh" }}
            >
              {/* Header fixe */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
                <p className="text-[14px] font-bold text-white">Nouveau repas</p>
                <div className="flex items-center gap-2">
                  {templates.length > 0 && (
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] text-white/60 text-[11px] font-semibold hover:bg-white/[0.10] transition-colors"
                    >
                      <BookOpen size={13} />
                      Repas types
                    </button>
                  )}
                  <button
                    onClick={() => setAdding(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/50"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Contenu scrollable */}
              <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-3">
                {/* Nom */}
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nom du repas"
                  className="w-full h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[13px] placeholder:text-white/25 outline-none"
                />

                {/* Date + heure */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={form.logged_at_date}
                    onChange={(e) => setForm((f) => ({ ...f, logged_at_date: e.target.value }))}
                    className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] outline-none"
                  />
                  <input
                    type="time"
                    value={form.logged_at_time}
                    onChange={(e) => setForm((f) => ({ ...f, logged_at_time: e.target.value }))}
                    className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] outline-none"
                  />
                </div>

                {/* Photo */}
                <label className="block rounded-xl border-[0.3px] border-dashed border-[#1f8a65]/40 bg-[#1f8a65]/[0.06] p-3 text-center cursor-pointer">
                  <span className="text-[12px] font-semibold text-[#1f8a65]">
                    {form.photo_url ? "✓ Photo ajoutée" : "Ajouter une photo (optionnel)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                    className="hidden"
                  />
                </label>

                {/* Qualité */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                    Qualité estimée — <span className="text-white/60">{form.quality_rating}/5</span>
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={form.quality_rating}
                    onChange={(e) => setForm((f) => ({ ...f, quality_rating: parseInt(e.target.value, 10) }))}
                    className="w-full h-2 appearance-none rounded-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #1f8a65 0%, #1f8a65 ${((form.quality_rating - 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((form.quality_rating - 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                </div>

                {/* Macros */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-2">
                    Valeurs nutritionnelles <span className="normal-case text-white/20">(optionnel)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={form.calories_kcal}
                      onChange={(e) => setForm((f) => ({ ...f, calories_kcal: e.target.value }))}
                      placeholder="Calories (kcal)"
                      inputMode="decimal"
                      className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] placeholder:text-white/20 outline-none"
                    />
                    <input
                      value={form.protein_g}
                      onChange={(e) => setForm((f) => ({ ...f, protein_g: e.target.value }))}
                      placeholder="Protéines (g)"
                      inputMode="decimal"
                      className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] placeholder:text-white/20 outline-none"
                    />
                    <input
                      value={form.carbs_g}
                      onChange={(e) => setForm((f) => ({ ...f, carbs_g: e.target.value }))}
                      placeholder="Glucides (g)"
                      inputMode="decimal"
                      className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] placeholder:text-white/20 outline-none"
                    />
                    <input
                      value={form.fats_g}
                      onChange={(e) => setForm((f) => ({ ...f, fats_g: e.target.value }))}
                      placeholder="Lipides (g)"
                      inputMode="decimal"
                      className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] placeholder:text-white/20 outline-none"
                    />
                    <input
                      value={form.fiber_g}
                      onChange={(e) => setForm((f) => ({ ...f, fiber_g: e.target.value }))}
                      placeholder="Fibres (g)"
                      inputMode="decimal"
                      className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] placeholder:text-white/20 outline-none col-span-2"
                    />
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes (optionnel)"
                  rows={2}
                  className="w-full min-h-[64px] px-3 py-2.5 rounded-xl bg-[#0a0a0a] border-[0.3px] border-white/[0.08] text-white text-[12px] placeholder:text-white/20 outline-none resize-none"
                />

                {/* Boutons action */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setAdding(false)}
                    className="h-11 px-4 rounded-xl bg-white/[0.06] text-white/60 text-[12px] font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={createMeal}
                    className="flex-1 h-11 rounded-xl bg-[#1f8a65] text-white text-[12px] font-bold flex items-center justify-center gap-2"
                  >
                    <Check size={15} />
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sheet repas types */}
      <AnimatePresence>
        {showTemplates && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplates(false)}
              className="fixed inset-0 bg-black/60 z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed left-0 right-0 bottom-0 z-[70] rounded-t-2xl bg-[#181818] border-t-[0.3px] border-white/[0.08] flex flex-col"
              style={{ maxHeight: "70vh" }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
                <p className="text-[14px] font-bold text-white">Repas types</p>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/50"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="px-4 pb-3 text-[11px] text-white/35 shrink-0">
                Sélectionnez un repas préconfiguré par votre coach pour auto-remplir les valeurs.
              </p>
              <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left bg-white/[0.03] border-[0.3px] border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.06] active:scale-[0.98] transition-all"
                  >
                    <p className="text-[13px] font-semibold text-white">{t.name}</p>
                    {t.description && <p className="text-[11px] text-white/40 mt-0.5">{t.description}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                      {t.calories_kcal ? <span className="text-[11px] font-bold text-[#1f8a65]">{t.calories_kcal} kcal</span> : null}
                      {t.protein_g ? <span className="text-[10px] text-blue-400">P {t.protein_g}g</span> : null}
                      {t.carbs_g ? <span className="text-[10px] text-amber-400">G {t.carbs_g}g</span> : null}
                      {t.fats_g ? <span className="text-[10px] text-red-400">L {t.fats_g}g</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

type FieldKey =
  | "neck_cm"
  | "shoulder_width_cm"
  | "chest_cm"
  | "waist_cm"
  | "hips_cm"
  | "arm_left_cm"
  | "arm_right_cm"
  | "thigh_left_cm"
  | "thigh_right_cm"
  | "calf_left_cm"
  | "calf_right_cm"
  | "glutes_cm"
  | "arm_cm";

const MEASUREMENT_FIELDS: Array<{
  key: FieldKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = [
  { key: "neck_cm", label: "Cou", min: 20, max: 70, step: 0.5, unit: "cm" },
  {
    key: "shoulder_width_cm",
    label: "Largeur d'épaule",
    min: 30,
    max: 80,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "chest_cm",
    label: "Poitrine",
    min: 60,
    max: 200,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "waist_cm",
    label: "Tour de taille",
    min: 40,
    max: 200,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "hips_cm",
    label: "Hanches",
    min: 40,
    max: 200,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "arm_left_cm",
    label: "Bras gauche",
    min: 15,
    max: 80,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "arm_right_cm",
    label: "Bras droit",
    min: 15,
    max: 80,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "thigh_left_cm",
    label: "Cuisse gauche",
    min: 30,
    max: 100,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "thigh_right_cm",
    label: "Cuisse droite",
    min: 30,
    max: 100,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "calf_left_cm",
    label: "Mollet gauche",
    min: 20,
    max: 60,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "calf_right_cm",
    label: "Mollet droit",
    min: 20,
    max: 60,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "glutes_cm",
    label: "Fessiers",
    min: 60,
    max: 180,
    step: 0.5,
    unit: "cm",
  },
  {
    key: "arm_cm",
    label: "Bras (moyenne)",
    min: 15,
    max: 80,
    step: 0.5,
    unit: "cm",
  },
];

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function ClientMeasurementSheet({ onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<FieldKey, string>>(
    MEASUREMENT_FIELDS.reduce(
      (acc, field) => {
        acc[field.key] = "";
        return acc;
      },
      {} as Record<FieldKey, string>,
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleChange(key: FieldKey, rawValue: string) {
    const normalized = rawValue.replace(",", ".");
    if (/^[0-9]*\.?[0-9]*$/.test(normalized) || normalized === "") {
      setValues((prev) => ({ ...prev, [key]: normalized }));
    }
  }

  async function handleSave() {
    const body: Record<string, number> = {};
    for (const field of MEASUREMENT_FIELDS) {
      const raw = values[field.key].trim();
      if (raw === "") continue;
      const parsed = parseFloat(raw);
      if (Number.isNaN(parsed)) continue;
      body[field.key] = parsed;
    }

    if (Object.keys(body).length === 0) {
      setError("Veuillez saisir au moins une mensuration");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/client/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erreur lors de l’enregistrement");
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l’enregistrement");
    } finally {
      setSaving(false);
    }
  }

  const filledCount = Object.values(values).filter(
    (v) => v.trim() !== "",
  ).length;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/60 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl bg-[#161616] overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <p className="text-[13px] font-barlow font-semibold text-white">
              Nouvelles mensurations
            </p>
            <p className="text-[11px] text-white/50 mt-1">
              Remplissez les champs souhaités et sauvegardez.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-white/40"
          >
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-4">
          {MEASUREMENT_FIELDS.map((field) => {
            const value = values[field.key];
            return (
              <div
                key={field.key}
                className="rounded-2xl border border-white/[0.08] bg-[#111111] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      {field.label}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">
                      {field.min}–{field.max} {field.unit}
                    </p>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value}
                      onChange={(event) =>
                        handleChange(field.key, event.target.value)
                      }
                      placeholder="—"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#080808] px-3 py-3 text-right text-white outline-none transition-colors focus:border-[#f2f2f2]"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {error && <p className="text-[12px] text-red-400">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-[#f2f2f2] px-4 py-3 text-[13px] font-barlow-condensed font-bold uppercase tracking-wide text-[#080808] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {saving
              ? "Enregistrement…"
              : `Sauvegarder${filledCount > 0 ? ` (${filledCount} champs)` : ""}`}
          </button>
        </div>
      </motion.div>
    </>
  );
}

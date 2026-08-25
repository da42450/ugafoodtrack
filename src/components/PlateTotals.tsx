"use client";

import { useCountUp } from "@/hooks/useCountUp";
import type { Nutrition } from "@/types";

export function PlateTotals({ totals }: { totals: Nutrition }) {
  const calories = useCountUp(totals.calories);

  return (
    <section className="bg-black text-white px-5 pt-6 pb-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/70">
        Plate total
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-6xl leading-none tabular-nums text-[var(--uga-red)]">
        {calories}
      </p>
      <p className="mt-1 text-sm text-white/80">calories</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Macro label="Protein" value={`${totals.protein}g`} />
        <Macro label="Carbs" value={`${totals.carbs}g`} />
        <Macro label="Fat" value={`${totals.fat}g`} />
      </div>
    </section>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 px-3 py-3">
      <p className="text-[10px] uppercase tracking-wider text-white/60">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

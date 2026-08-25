"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { PortionStepper } from "@/components/PortionStepper";
import { scaleNutrition } from "@/lib/nutrislice";
import type { PlateItem } from "@/types";

export function FoodRow({
  item,
  onPortions,
  onRemove,
  index,
}: {
  item: PlateItem;
  onPortions: (portions: number) => void;
  onRemove: () => void;
  index: number;
}) {
  const reduce = useReducedMotion();
  const scaled = scaleNutrition(
    item.food.nutritionPerServing,
    item.portions,
  );

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: reduce ? 0 : Math.min(index, 4) * 0.04 }}
      className="border-b border-[var(--uga-border)] bg-white px-5 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-black">
            {item.food.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--uga-muted)]">
            {item.food.servingLabel}
            {item.food.station ? ` · ${item.food.station}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.food.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--uga-muted)] transition-transform active:scale-[0.97] cursor-pointer touch-manipulation"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <PortionStepper value={item.portions} onChange={onPortions} />
        <p className="text-right">
          <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--uga-red)]">
            {scaled.calories}
          </span>
          <span className="ml-1 text-sm text-[var(--uga-muted)]">cal</span>
        </p>
      </div>
    </motion.article>
  );
}

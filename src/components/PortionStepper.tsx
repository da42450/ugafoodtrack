"use client";

import { Minus, Plus } from "lucide-react";
import { PressButton } from "@/components/PressButton";

export function PortionStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const step = 0.5;
  const dec = () => onChange(Math.max(step, Math.round((value - step) * 2) / 2));
  const inc = () => onChange(Math.round((value + step) * 2) / 2);

  return (
    <div className="flex items-center gap-3">
      <PressButton
        variant="secondary"
        className="!min-h-12 !w-12 !px-0 rounded-xl"
        aria-label="Decrease portions"
        onClick={dec}
      >
        <Minus className="h-5 w-5" strokeWidth={2.5} />
      </PressButton>
      <div className="min-w-16 text-center">
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-black">
          {value}
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--uga-muted)]">
          servings
        </p>
      </div>
      <PressButton
        variant="secondary"
        className="!min-h-12 !w-12 !px-0 rounded-xl"
        aria-label="Increase portions"
        onClick={inc}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </PressButton>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PortionStepper } from "@/components/PortionStepper";
import { PressButton } from "@/components/PressButton";
import { ScreenEnter } from "@/components/ScreenEnter";
import { scaleNutrition } from "@/lib/nutrislice";
import { usePlate } from "@/state/plate";

function MatchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const foodId = params.get("foodId");
  const { hydrated, hallSlug, foods, addItem } = usePlate();
  const [portions, setPortions] = useState(1);

  useEffect(() => {
    if (hydrated && !hallSlug) router.replace("/hall");
  }, [hydrated, hallSlug, router]);

  const food = useMemo(
    () => foods.find((f) => f.id === foodId),
    [foods, foodId],
  );

  if (!hydrated) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-[var(--uga-muted)]">Loading…</p>
      </main>
    );
  }

  if (!food) {
    return (
      <main className="flex flex-1 flex-col px-5 py-10">
        <p className="text-base text-black">Food not found in today’s menu.</p>
        <PressButton
          className="mt-6 rounded-xl"
          onClick={() => router.push("/search")}
        >
          Back to search
        </PressButton>
      </main>
    );
  }

  const scaled = scaleNutrition(food.nutritionPerServing, portions);

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-[var(--uga-border)] px-4 py-4">
        <Link
          href="/search"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center transition-transform active:scale-[0.97] touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">
          Confirm
        </h1>
      </header>

      <ScreenEnter className="flex flex-1 flex-col px-5 py-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--uga-muted)]">
          Official menu item
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight text-black">
          {food.name}
        </h2>
        <p className="mt-2 text-sm text-[var(--uga-muted)]">
          Serving size: {food.servingLabel}
          {food.station ? ` · ${food.station}` : ""}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 bg-[var(--uga-surface)] p-4">
          <Stat label="Per serving" value={`${food.nutritionPerServing.calories} cal`} />
          <Stat label="Protein" value={`${food.nutritionPerServing.protein}g`} />
          <Stat label="Carbs" value={`${food.nutritionPerServing.carbs}g`} />
          <Stat label="Fat" value={`${food.nutritionPerServing.fat}g`} />
        </div>

        <div className="mt-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--uga-muted)]">
            How much did you take?
          </p>
          <PortionStepper value={portions} onChange={setPortions} />
        </div>

        <div className="mt-auto pt-10">
          <div className="mb-4 flex items-end justify-between">
            <span className="text-sm text-[var(--uga-muted)]">This add</span>
            <span className="font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--uga-red)]">
              {scaled.calories}
              <span className="ml-1 text-base text-[var(--uga-muted)]">cal</span>
            </span>
          </div>
          <PressButton
            className="w-full rounded-xl"
            onClick={() => {
              addItem(food, portions);
              router.push("/plate");
            }}
          >
            Add to plate
          </PressButton>
        </div>
      </ScreenEnter>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--uga-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-[var(--uga-muted)]">Loading…</p>
        </main>
      }
    >
      <MatchContent />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Home, RefreshCw, Search, Trash2 } from "lucide-react";
import { FoodRow } from "@/components/FoodRow";
import { PlateTotals } from "@/components/PlateTotals";
import { PressButton, PressLink } from "@/components/PressButton";
import { ScreenEnter } from "@/components/ScreenEnter";
import { getHallBySlug } from "@/constants/halls";
import { usePlate } from "@/state/plate";

export default function PlatePage() {
  const router = useRouter();
  const {
    hydrated,
    hallSlug,
    items,
    totals,
    menuLoading,
    menuError,
    foods,
    menuDate,
    refreshMenu,
    updatePortions,
    removeItem,
    clearPlate,
  } = usePlate();

  useEffect(() => {
    if (hydrated && !hallSlug) router.replace("/hall");
  }, [hydrated, hallSlug, router]);

  const hall = getHallBySlug(hallSlug);

  if (!hydrated || !hallSlug) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-[var(--uga-muted)]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-1 flex-col pb-28">
      <PlateTotals totals={totals} />

      <div className="flex items-center justify-between gap-3 border-b border-[var(--uga-border)] bg-[var(--uga-surface)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/hall"
            aria-label="Home — change dining hall"
            className="flex h-11 shrink-0 items-center gap-1.5 border-2 border-black bg-white px-3 text-sm font-semibold text-black transition-transform active:scale-[0.97] touch-manipulation"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
            Home
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black">
              {hall?.shortName ?? "Dining hall"}
            </p>
            <p className="truncate text-xs text-[var(--uga-muted)]">
              {menuLoading
                ? "Loading today’s menu…"
                : menuError
                  ? menuError
                  : `${foods.length} items · ${menuDate ?? "today"}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void refreshMenu()}
            aria-label="Refresh menu"
            className="flex h-11 w-11 items-center justify-center text-black transition-transform active:scale-[0.97] cursor-pointer touch-manipulation"
          >
            <RefreshCw
              className={`h-5 w-5 ${menuLoading ? "animate-spin" : ""}`}
            />
          </button>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={clearPlate}
              aria-label="Clear plate"
              className="flex h-11 w-11 items-center justify-center text-black transition-transform active:scale-[0.97] cursor-pointer touch-manipulation"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <ScreenEnter className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center bg-[var(--uga-red)] text-white">
              <Camera className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-black">
              Empty plate
            </h2>
            <p className="mt-3 max-w-xs text-sm text-[var(--uga-muted)]">
              Scan a food label or search today’s menu, then set how many
              servings you took.
            </p>
          </div>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={item.lineId}>
                <FoodRow
                  item={item}
                  index={index}
                  onPortions={(p) => updatePortions(item.lineId, p)}
                  onRemove={() => removeItem(item.lineId)}
                />
              </li>
            ))}
          </ul>
        )}
      </ScreenEnter>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--uga-border)] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-lg gap-2">
          <PressLink
            href="/camera"
            className="flex-1 rounded-xl"
            variant="primary"
          >
            <Camera className="h-5 w-5" />
            Scan label
          </PressLink>
          <PressLink
            href="/search"
            className="flex-1 rounded-xl"
            variant="secondary"
          >
            <Search className="h-5 w-5" />
            Search
          </PressLink>
        </div>
        {menuError ? (
          <div className="mx-auto mt-2 max-w-lg">
            <PressButton
              variant="ghost"
              className="w-full rounded-xl text-sm"
              onClick={() => void refreshMenu()}
            >
              Retry menu load
            </PressButton>
          </div>
        ) : null}
      </div>
    </main>
  );
}

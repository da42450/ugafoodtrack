"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { ScreenEnter } from "@/components/ScreenEnter";
import { matchFoods } from "@/lib/fuzzy";
import { usePlate } from "@/state/plate";

function SearchParamsGate() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  return <SearchContent key={initial} initialQuery={initial} />;
}

function SearchContent({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const { hydrated, hallSlug, foods, menuLoading } = usePlate();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (hydrated && !hallSlug) router.replace("/hall");
  }, [hydrated, hallSlug, router]);

  const results = useMemo(
    () => (query.trim() ? matchFoods(foods, query, 20) : []),
    [foods, query],
  );

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--uga-border)] bg-white px-4 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <Link
            href="/plate"
            aria-label="Back to plate"
            className="flex h-11 w-11 items-center justify-center transition-transform active:scale-[0.97] touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-2xl">
            Search menu
          </h1>
        </div>
        <label className="relative mt-4 block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--uga-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chicken Tikka Masala"
            inputMode="search"
            className="min-h-12 w-full border-2 border-black bg-white pl-11 pr-4 text-base outline-none focus:border-[var(--uga-red)]"
          />
        </label>
      </header>

      <ScreenEnter className="flex-1">
        {menuLoading ? (
          <p className="px-5 py-8 text-sm text-[var(--uga-muted)]">
            Loading menu…
          </p>
        ) : !query.trim() ? (
          <p className="px-5 py-8 text-sm text-[var(--uga-muted)]">
            Type a food name from today’s stations.
          </p>
        ) : results.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--uga-muted)]">
            No matches. Try fewer words or check the hall.
          </p>
        ) : (
          <ul>
            {results.map(({ food }) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/match?foodId=${encodeURIComponent(food.id)}`)
                  }
                  className="flex w-full min-h-14 flex-col items-start border-b border-[var(--uga-border)] px-5 py-4 text-left transition-transform active:scale-[0.97] touch-manipulation cursor-pointer"
                >
                  <span className="font-semibold text-black">{food.name}</span>
                  <span className="mt-1 text-sm text-[var(--uga-muted)]">
                    {food.servingLabel}
                    {food.station ? ` · ${food.station}` : ""}
                    {" · "}
                    {food.nutritionPerServing.calories} cal
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScreenEnter>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-[var(--uga-muted)]">Loading…</p>
        </main>
      }
    >
      <SearchParamsGate />
    </Suspense>
  );
}

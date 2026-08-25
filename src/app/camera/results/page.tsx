"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PressButton } from "@/components/PressButton";
import { ScreenEnter } from "@/components/ScreenEnter";
import { usePlate } from "@/state/plate";

function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const { hydrated, hallSlug, foods } = usePlate();

  useEffect(() => {
    if (hydrated && !hallSlug) router.replace("/hall");
  }, [hydrated, hallSlug, router]);

  const matches = useMemo(
    () =>
      ids
        .map((id) => foods.find((f) => f.id === id))
        .filter((f): f is NonNullable<typeof f> => Boolean(f)),
    [foods, ids],
  );

  return (
    <main className="flex min-h-full flex-1 flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-[var(--uga-border)] px-4 py-4">
        <Link
          href="/camera"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center transition-transform active:scale-[0.97] touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl">
            Matches
          </h1>
          {q ? (
            <p className="text-sm text-[var(--uga-muted)] truncate max-w-[16rem]">
              Read as “{q}”
            </p>
          ) : null}
        </div>
      </header>

      <ScreenEnter className="flex-1">
        {matches.length === 0 ? (
          <div className="px-5 py-10">
            <p className="text-sm text-[var(--uga-muted)]">
              No confident matches. Search the menu instead.
            </p>
            <PressButton
              className="mt-6 w-full rounded-xl"
              onClick={() =>
                router.push(
                  q ? `/search?q=${encodeURIComponent(q)}` : "/search",
                )
              }
            >
              Open search
            </PressButton>
          </div>
        ) : (
          <ul>
            {matches.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/match?foodId=${encodeURIComponent(food.id)}`)
                  }
                  className="flex w-full min-h-14 flex-col items-start border-b border-[var(--uga-border)] px-5 py-4 text-left transition-transform active:scale-[0.97] touch-manipulation cursor-pointer"
                >
                  <span className="font-semibold">{food.name}</span>
                  <span className="mt-1 text-sm text-[var(--uga-muted)]">
                    {food.servingLabel} · {food.nutritionPerServing.calories}{" "}
                    cal
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-6">
          <PressButton
            variant="ghost"
            className="w-full rounded-xl"
            onClick={() =>
              router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
            }
          >
            None of these — search
          </PressButton>
        </div>
      </ScreenEnter>
    </main>
  );
}

export default function CameraResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-[var(--uga-muted)]">Loading…</p>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

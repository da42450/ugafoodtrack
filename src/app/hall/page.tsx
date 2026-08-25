"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { HALLS } from "@/constants/halls";
import { ScreenEnter } from "@/components/ScreenEnter";
import { usePlate } from "@/state/plate";

export default function HallPage() {
  const router = useRouter();
  const { hallSlug, setHallSlug } = usePlate();

  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-black px-5 pb-8 pt-12 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          UGA Dining
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight">
          UGA Plate
        </h1>
        <p className="mt-3 max-w-sm text-sm text-white/75">
          Pick your dining hall. We’ll load today’s menu so label scans match
          the real nutrition.
        </p>
      </header>

      <ScreenEnter className="flex-1 px-5 py-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--uga-muted)]">
          Dining halls
        </h2>
        <ul className="mt-4 space-y-2">
          {HALLS.map((hall) => {
            const selected = hall.slug === hallSlug;
            return (
              <li key={hall.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setHallSlug(hall.slug);
                    router.push("/plate");
                  }}
                  className={`flex w-full min-h-14 items-center justify-between gap-3 border-2 px-4 py-3 text-left transition-transform active:scale-[0.97] touch-manipulation cursor-pointer ${
                    selected
                      ? "border-[var(--uga-red)] bg-[var(--uga-red)] text-white"
                      : "border-black bg-white text-black"
                  }`}
                >
                  <span>
                    <span className="block text-base font-semibold">
                      {hall.shortName}
                    </span>
                    <span
                      className={`block text-sm ${selected ? "text-white/80" : "text-[var(--uga-muted)]"}`}
                    >
                      {hall.name}
                    </span>
                  </span>
                  {selected ? <Check className="h-5 w-5 shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </ScreenEnter>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlate } from "@/state/plate";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, hallSlug } = usePlate();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(hallSlug ? "/plate" : "/hall");
  }, [hydrated, hallSlug, router]);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm text-[var(--uga-muted)]">Loading…</p>
    </main>
  );
}

import Fuse from "fuse.js";
import type { MenuFood } from "@/types";

export type FoodMatch = {
  food: MenuFood;
  score: number;
};

export function matchFoods(
  foods: MenuFood[],
  query: string,
  limit = 5,
): FoodMatch[] {
  const cleaned = query.trim();
  if (!cleaned || foods.length === 0) return [];

  const fuse = new Fuse(foods, {
    keys: ["name", "station"],
    threshold: 0.45,
    includeScore: true,
    ignoreLocation: true,
  });

  return fuse
    .search(cleaned)
    .slice(0, limit)
    .map((r) => ({
      food: r.item,
      score: r.score ?? 1,
    }));
}

/** Prefer longer OCR lines as the food name candidate. */
export function pickOcrQuery(lines: string[]): string {
  const cleaned = lines
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 3)
    .filter((l) => !/^(contains|allergens?|calories|protein|serving)/i.test(l));

  if (cleaned.length === 0) return "";
  return [...cleaned].sort((a, b) => b.length - a.length)[0];
}

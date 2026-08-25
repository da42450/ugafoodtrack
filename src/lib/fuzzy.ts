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

const ALLERGEN_WORDS =
  /\b(peanuts?|tree\s*nuts?|wheat|soybeans?|soy|milk|eggs?|fish|shellfish|sesame|gluten|dairy|tree\s*nut)\b/i;

const NOISE_LINE =
  /^(contains|allergens?|calories|protein|serving|ingredients?|nutrition|net\s*carbs?|fat|sodium|fiber)$/i;

const ICON_ONLY = /^(gf|vg?|vegan|vegetarian|df|nf|halal|kosher)$/i;

function isNoiseLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 3) return true;
  if (ICON_ONLY.test(t)) return true;
  if (NOISE_LINE.test(t)) return true;
  if (/^allergens?/i.test(t)) return true;
  // Comma-heavy allergen rows: "Peanuts, Tree Nuts, Wheat, Soybeans"
  const commas = (t.match(/,/g) || []).length;
  if (commas >= 2 && ALLERGEN_WORDS.test(t)) return true;
  if (commas >= 1 && t.length < 70 && ALLERGEN_WORDS.test(t)) return true;
  // Pure barcode / numeric junk
  if (/^[\d\s\-|:]+$/.test(t)) return true;
  return false;
}

function looksLikeTitle(line: string): boolean {
  const letters = (line.match(/[A-Za-z]/g) || []).length;
  if (letters < 4) return false;
  return letters / line.length >= 0.45;
}

/**
 * Build a dish-name query from OCR lines.
 * Prefer early (top-of-crop) title lines; skip allergens / icons / barcode noise.
 */
export function pickOcrQuery(lines: string[]): string {
  const cleaned = lines
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => !isNoiseLine(l))
    .filter(looksLikeTitle);

  if (cleaned.length === 0) return "";

  // Title is at the top of the cropped label — keep reading order, don't sort by length
  const first = cleaned[0];
  const second = cleaned[1];

  if (!second) return first;

  const secondContinues =
    /^(with|w\/?|and|&|salad|sauce|bowl|rice|noodles?)/i.test(second) ||
    second.length <= 28 ||
    first.length < 22;

  if (secondContinues && `${first} ${second}`.length <= 90) {
    return `${first} ${second}`.replace(/\s+/g, " ").trim();
  }

  return first;
}

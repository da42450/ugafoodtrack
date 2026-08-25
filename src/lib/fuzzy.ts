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
  const commas = (t.match(/,/g) || []).length;
  if (commas >= 2 && ALLERGEN_WORDS.test(t)) return true;
  if (commas >= 1 && t.length < 70 && ALLERGEN_WORDS.test(t)) return true;
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

  const first = cleaned[0];
  const second = cleaned[1];

  if (!second) return first;

  const secondContinues =
    /^(with|w\/?|and|&|salad|sauce|bowl|rice|noodles?|sesame)/i.test(second) ||
    second.length <= 28 ||
    first.length < 22;

  if (secondContinues && `${first} ${second}`.length <= 90) {
    return `${first} ${second}`.replace(/\s+/g, " ").trim();
  }

  return first;
}

/** Build several OCR query guesses, score each against today's menu, pick best. */
export function resolveOcrAgainstMenu(
  lines: string[],
  foods: MenuFood[],
): { query: string; matches: FoodMatch[] } | null {
  const titleLines = lines
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => !isNoiseLine(l))
    .filter(looksLikeTitle);

  const candidates = new Set<string>();
  const primary = pickOcrQuery(lines);
  if (primary) candidates.add(primary);
  if (titleLines.length) {
    candidates.add(titleLines.slice(0, 2).join(" "));
    candidates.add(titleLines.slice(0, 3).join(" "));
    for (const line of titleLines.slice(0, 4)) candidates.add(line);
  }

  let best: { query: string; matches: FoodMatch[] } | null = null;

  for (const query of candidates) {
    if (query.trim().length < 4) continue;
    const matches = matchFoods(foods, query, 5);
    if (!matches.length) continue;
    const score = matches[0].score;
    if (!best || score < best.matches[0].score) {
      best = { query, matches };
    }
  }

  // Reject if even the best guess is very weak (likely OCR gibberish)
  if (!best || best.matches[0].score > 0.48) return null;
  return best;
}

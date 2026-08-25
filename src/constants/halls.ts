import type { Hall } from "@/types";

export const HALLS: Hall[] = [
  {
    slug: "dining-hall-1",
    name: "Bolton Dining Commons",
    shortName: "Bolton",
  },
  {
    slug: "hillside-dining-commons",
    name: "Hillside Dining Commons",
    shortName: "Hillside",
  },
  {
    slug: "dining-hall-2",
    name: "Oglethorpe Dining Commons",
    shortName: "Oglethorpe",
  },
  {
    slug: "dining-hall-3",
    name: "Snelling Dining Commons",
    shortName: "Snelling",
  },
  {
    slug: "dining-hall-4",
    name: "The Niche",
    shortName: "Niche",
  },
  {
    slug: "dining-hall-5",
    name: "The Village Summit",
    shortName: "Village Summit",
  },
];

export function getHallBySlug(slug: string | null | undefined): Hall | undefined {
  if (!slug) return undefined;
  return HALLS.find((h) => h.slug === slug);
}

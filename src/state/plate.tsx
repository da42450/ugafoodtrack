"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MenuFood, Nutrition, PlateItem } from "@/types";
import { scaleNutrition, sumNutrition } from "@/lib/nutrislice";

const HALL_KEY = "uga-plate-hall";
const PLATE_KEY = "uga-plate-items";

type PlateContextValue = {
  hallSlug: string | null;
  setHallSlug: (slug: string) => void;
  foods: MenuFood[];
  menuDate: string | null;
  menuLoading: boolean;
  menuError: string | null;
  refreshMenu: () => Promise<void>;
  items: PlateItem[];
  addItem: (food: MenuFood, portions: number) => void;
  updatePortions: (lineId: string, portions: number) => void;
  removeItem: (lineId: string) => void;
  clearPlate: () => void;
  totals: Nutrition;
  hydrated: boolean;
};

const PlateContext = createContext<PlateContextValue | null>(null);

function makeLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredHall(): string | null {
  try {
    return localStorage.getItem(HALL_KEY);
  } catch {
    return null;
  }
}

function readStoredPlate(): PlateItem[] {
  try {
    const raw = localStorage.getItem(PLATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlateItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PlateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [hallSlug, setHallSlugState] = useState<string | null>(null);
  const [items, setItems] = useState<PlateItem[]>([]);
  const [foods, setFoods] = useState<MenuFood[]>([]);
  const [menuDate, setMenuDate] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const menuRequest = useRef(0);
  const hallRef = useRef<string | null>(null);

  const loadMenu = useCallback(async (slug: string) => {
    const requestId = ++menuRequest.current;
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch(`/api/menu?hall=${encodeURIComponent(slug)}`);
      const data = (await res.json()) as {
        date?: string;
        foods?: MenuFood[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to load menu");
      if (requestId !== menuRequest.current) return;
      setFoods(data.foods ?? []);
      setMenuDate(data.date ?? null);
    } catch (e) {
      if (requestId !== menuRequest.current) return;
      setMenuError(e instanceof Error ? e.message : "Failed to load menu");
      setFoods([]);
    } finally {
      if (requestId === menuRequest.current) setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    const hall = readStoredHall();
    const plate = readStoredPlate();
    hallRef.current = hall;
    startTransition(() => {
      setHallSlugState(hall);
      setItems(plate);
      setHydrated(true);
    });
    if (hall) {
      queueMicrotask(() => {
        void loadMenu(hall);
      });
    }
  }, [loadMenu]);

  useEffect(() => {
    if (!hydrated) return;
    if (hallSlug) localStorage.setItem(HALL_KEY, hallSlug);
  }, [hallSlug, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PLATE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const setHallSlug = useCallback(
    (slug: string) => {
      hallRef.current = slug;
      setHallSlugState(slug);
      void loadMenu(slug);
    },
    [loadMenu],
  );

  const refreshMenu = useCallback(async () => {
    const slug = hallRef.current;
    if (!slug) return;
    await loadMenu(slug);
  }, [loadMenu]);

  const addItem = useCallback((food: MenuFood, portions: number) => {
    const safe = Math.max(0.5, Math.round(portions * 2) / 2);
    setItems((prev) => [
      ...prev,
      { lineId: makeLineId(), food, portions: safe },
    ]);
  }, []);

  const updatePortions = useCallback((lineId: string, portions: number) => {
    const safe = Math.max(0.5, Math.round(portions * 2) / 2);
    setItems((prev) =>
      prev.map((item) =>
        item.lineId === lineId ? { ...item, portions: safe } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const clearPlate = useCallback(() => setItems([]), []);

  const totals = useMemo(
    () =>
      sumNutrition(
        items.map((item) =>
          scaleNutrition(item.food.nutritionPerServing, item.portions),
        ),
      ),
    [items],
  );

  const value = useMemo(
    () => ({
      hallSlug,
      setHallSlug,
      foods,
      menuDate,
      menuLoading,
      menuError,
      refreshMenu,
      items,
      addItem,
      updatePortions,
      removeItem,
      clearPlate,
      totals,
      hydrated,
    }),
    [
      hallSlug,
      setHallSlug,
      foods,
      menuDate,
      menuLoading,
      menuError,
      refreshMenu,
      items,
      addItem,
      updatePortions,
      removeItem,
      clearPlate,
      totals,
      hydrated,
    ],
  );

  return (
    <PlateContext.Provider value={value}>{children}</PlateContext.Provider>
  );
}

export function usePlate() {
  const ctx = useContext(PlateContext);
  if (!ctx) throw new Error("usePlate must be used within PlateProvider");
  return ctx;
}

import type { MealPeriod, MenuFood, Nutrition } from "@/types";

const MEALS: MealPeriod[] = ["breakfast", "lunch", "dinner"];

type NutrisliceServing = {
  serving_size_amount?: string | number | null;
  serving_size_unit?: string | null;
};

type NutrisliceNutrition = {
  calories?: number | null;
  g_protein?: number | null;
  g_carbs?: number | null;
  g_fat?: number | null;
};

type NutrisliceFood = {
  id?: number | string;
  name?: string;
  serving_size_info?: NutrisliceServing | null;
  rounded_nutrition_info?: NutrisliceNutrition | null;
};

type NutrisliceMenuItem = {
  food?: NutrisliceFood | null;
  station?: string | null;
  menu_id?: number | string;
};

type NutrisliceDay = {
  date?: string;
  menu_items?: NutrisliceMenuItem[];
};

type NutrisliceWeek = {
  days?: NutrisliceDay[];
};

function num(value: number | null | undefined): number {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Number(value);
}

function servingLabel(info?: NutrisliceServing | null): string {
  if (!info) return "1 serving";
  const amount = info.serving_size_amount ?? "1";
  const unit = info.serving_size_unit ?? "serving";
  return `${amount} ${unit}`.trim();
}

function toNutrition(info?: NutrisliceNutrition | null): Nutrition {
  return {
    calories: num(info?.calories),
    protein: num(info?.g_protein),
    carbs: num(info?.g_carbs),
    fat: num(info?.g_fat),
  };
}

function todayParts(date = new Date()) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    iso: [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-"),
  };
}

export function parseDateParam(dateParam?: string | null) {
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [y, m, d] = dateParam.split("-").map(Number);
    return { year: y, month: m, day: d, iso: dateParam };
  }
  return todayParts();
}

async function fetchMealWeek(
  hallSlug: string,
  meal: MealPeriod,
  year: number,
  month: number,
  day: number,
): Promise<NutrisliceWeek> {
  const url = `https://uga.api.nutrislice.com/menu/api/weeks/school/${hallSlug}/menu-type/${meal}/${year}/${month}/${day}/?format=json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    throw new Error(`Nutrislice ${meal} failed (${res.status})`);
  }
  return res.json() as Promise<NutrisliceWeek>;
}

function foodsFromDay(
  day: NutrisliceDay | undefined,
  meal: MealPeriod,
): MenuFood[] {
  if (!day?.menu_items?.length) return [];
  const out: MenuFood[] = [];
  for (const item of day.menu_items) {
    const food = item.food;
    if (!food?.name || food.id == null) continue;
    out.push({
      id: String(food.id),
      name: food.name.trim(),
      station: item.station ?? undefined,
      meal,
      servingLabel: servingLabel(food.serving_size_info),
      nutritionPerServing: toNutrition(food.rounded_nutrition_info),
    });
  }
  return out;
}

export async function fetchTodayMenu(
  hallSlug: string,
  dateParam?: string | null,
): Promise<{ date: string; foods: MenuFood[] }> {
  const { year, month, day, iso } = parseDateParam(dateParam);
  const weeks = await Promise.all(
    MEALS.map((meal) => fetchMealWeek(hallSlug, meal, year, month, day)),
  );

  const byId = new Map<string, MenuFood>();
  MEALS.forEach((meal, i) => {
    const week = weeks[i];
    const day =
      week.days?.find((d) => d.date === iso) ??
      week.days?.find((d) => d.menu_items && d.menu_items.length > 0);
    for (const food of foodsFromDay(day, meal)) {
      if (!byId.has(food.id)) byId.set(food.id, food);
    }
  });

  const foods = Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return { date: iso, foods };
}

export function scaleNutrition(n: Nutrition, portions: number): Nutrition {
  return {
    calories: Math.round(n.calories * portions),
    protein: Math.round(n.protein * portions * 10) / 10,
    carbs: Math.round(n.carbs * portions * 10) / 10,
    fat: Math.round(n.fat * portions * 10) / 10,
  };
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      protein: Math.round((acc.protein + n.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + n.carbs) * 10) / 10,
      fat: Math.round((acc.fat + n.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

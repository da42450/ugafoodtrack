export type MealPeriod = "breakfast" | "lunch" | "dinner";

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MenuFood = {
  id: string;
  name: string;
  station?: string;
  meal: MealPeriod;
  servingLabel: string;
  nutritionPerServing: Nutrition;
};

export type PlateItem = {
  lineId: string;
  food: MenuFood;
  portions: number;
};

export type Hall = {
  slug: string;
  name: string;
  shortName: string;
};

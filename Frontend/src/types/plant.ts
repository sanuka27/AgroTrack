export type Sunlight = "Full Sun" | "Partial Sun" | "Low Light" | "Shade";
export type Category = "Indoor" | "Outdoor" | "Succulent" | "Herb" | "Flower" | "Tree";
export type Health = "Excellent" | "Good" | "Needs light" | "Needs water" | "Attention";

export interface Plant {
  id: string;
  name: string;
  category: Category;
  sunlight: Sunlight;
  ageYears?: number;
  wateringEveryDays: number;        // default 7
  fertilizerEveryWeeks?: number;
  soil?: string;
  notes?: string;
  imageUrl?: string;                // local preview only
  lastWatered?: string | null;      // ISO date string or null
  health: Health;                   // default "Good"
  growthRatePctThisMonth?: number;  // default 0
}

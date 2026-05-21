import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Feather>["name"];

export interface ItemCategory {
  key: string;
  label: string;
  icon: IconName;
  color: string;
}

export const CATEGORIES: ItemCategory[] = [
  { key: "dining", label: "dining", icon: "coffee", color: "#D87560" },
  { key: "sightseeing", label: "sightseeing", icon: "camera", color: "#4A6E6B" },
  { key: "hotel", label: "hotel", icon: "moon", color: "#5C6B5A" },
  { key: "transport", label: "transport", icon: "navigation", color: "#7C8290" },
  { key: "shopping", label: "shopping", icon: "shopping-bag", color: "#B8956A" },
  { key: "activity", label: "activity", icon: "sun", color: "#6B8A6E" },
  { key: "nightlife", label: "nightlife", icon: "music", color: "#7A6B8A" },
  { key: "wellness", label: "wellness", icon: "heart", color: "#9B7A7A" },
  { key: "other", label: "other", icon: "map-pin", color: "#7C8290" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<string, ItemCategory>;

export function getCategoryForItem(category?: string | null): ItemCategory {
  if (category && CATEGORY_MAP[category]) return CATEGORY_MAP[category];
  return CATEGORIES[CATEGORIES.length - 1]; // "other"
}

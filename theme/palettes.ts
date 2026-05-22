export type ThemeKey = "riviera" | "mocha" | "forest";

export interface Palette {
  key: ThemeKey;
  label: string;
  description: string;
  swatches: [string, string, string];
  bg: string;
  pearl: string;
  ink: string;
  accent: string;
  accent2: string;
  sand: string;
  stone: string;
  mist: string;
  gold: string;
}

export const PALETTES: Record<ThemeKey, Palette> = {
  riviera: {
    key: "riviera",
    label: "Riviera",
    description: "navy + coral · summer water",
    swatches: ["#1E2A3A", "#D87560", "#ECE6D6"],
    bg: "#ECE6D6",
    pearl: "#F7F2E2",
    ink: "#1E2A3A",
    accent: "#D87560",
    accent2: "#4A6E6B",
    sand: "#D6C6A2",
    stone: "#7C8290",
    mist: "#DED7C5",
    gold: "#B8956A",
  },
  mocha: {
    key: "mocha",
    label: "Mocha",
    description: "mocha + clay · earth & coffee",
    swatches: ["#3A2A1A", "#8E5A3A", "#ECE3CF"],
    bg: "#ECE3CF",
    pearl: "#F5EBD5",
    ink: "#3A2A1A",
    accent: "#8E5A3A",
    accent2: "#6B5A3A",
    sand: "#D5C49A",
    stone: "#847565",
    mist: "#DED2B5",
    gold: "#A67D50",
  },
  forest: {
    key: "forest",
    label: "Forest",
    description: "forest + sage · a quiet garden",
    swatches: ["#1F2A22", "#5C6E4F", "#E8E2D0"],
    bg: "#E8E2D0",
    pearl: "#F2EDDB",
    ink: "#1F2A22",
    accent: "#5C6E4F",
    accent2: "#7A6E58",
    sand: "#C7B795",
    stone: "#7A8073",
    mist: "#D6D0BC",
    gold: "#9E8A60",
  },
} as const;

export const DEFAULT_THEME: ThemeKey = "riviera";

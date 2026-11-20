"use client";
import type { CaptionFont, CaptionPreset } from "@/lib/types";

export type BrandKit = {
  logo: string | null; // data URL
  accent: string;
  preset: CaptionPreset;
  font: CaptionFont | null;
  highlight: string | null;
};

const KEY = "hookcut.brand.v1";
export const DEFAULT_BRAND: BrandKit = { logo: null, accent: "#ffe14a", preset: "bold-pop", font: null, highlight: null };

export function loadBrand(): BrandKit {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch {
    /* storage may be blocked */
  }
  return DEFAULT_BRAND;
}

export function saveBrand(b: BrandKit) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

export interface PhotoFilter {
  id: string;
  label: string;
  /** CSS filter value — applied directly for preview, and baked into the
   *  exported image via canvas's ctx.filter (same syntax) on download/print. */
  css: string;
}

export const FILTERS: PhotoFilter[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.05)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.35) saturate(1.2) contrast(0.95) brightness(1.05)" },
  { id: "vivid", label: "Vivid", css: "saturate(1.5) contrast(1.1)" },
  { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(15deg) brightness(1.02)" },
  { id: "warm", label: "Warm", css: "saturate(1.15) hue-rotate(-10deg) brightness(1.03) sepia(0.15)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.3) brightness(0.9)" },
  { id: "fade", label: "Fade", css: "contrast(0.85) brightness(1.08) saturate(0.85)" },
  { id: "dramatic", label: "Dramatic", css: "contrast(1.25) saturate(1.3) brightness(0.97)" },
  { id: "soft", label: "Soft", css: "contrast(0.92) brightness(1.05) saturate(1.05) blur(0.4px)" },
];

export function getFilter(id: string): PhotoFilter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

export interface Adjustments {
  brightness: number; // -50..50
  contrast: number; // -50..50
  saturation: number; // -50..50
}

export const DEFAULT_ADJUSTMENTS: Adjustments = { brightness: 0, contrast: 0, saturation: 0 };

function adjustmentsToCss(adj: Adjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 0) parts.push(`brightness(${1 + adj.brightness / 100})`);
  if (adj.contrast !== 0) parts.push(`contrast(${1 + adj.contrast / 100})`);
  if (adj.saturation !== 0) parts.push(`saturate(${1 + adj.saturation / 100})`);
  return parts.join(" ");
}

/** Combines a preset filter with the fine-tune sliders into one CSS filter string. */
export function buildFilterCss(filterId: string, adjustments: Adjustments): string {
  const preset = getFilter(filterId).css;
  const extra = adjustmentsToCss(adjustments);
  if (preset === "none") return extra || "none";
  return extra ? `${preset} ${extra}` : preset;
}

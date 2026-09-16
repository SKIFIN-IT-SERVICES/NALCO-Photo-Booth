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
];

export function getFilter(id: string): PhotoFilter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

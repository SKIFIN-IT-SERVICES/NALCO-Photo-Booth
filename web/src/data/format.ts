export type AspectRatioId = "square" | "portrait" | "landscape";
export type QualityId = "standard" | "hd" | "2k" | "4k";

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;
  description: string;
  /** Value sent to the backend / Gemini's generationConfig.imageConfig.aspectRatio */
  ratio: string;
  /** CSS aspect-ratio for the preview swatch */
  previewRatio: string;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: "square",
    label: "Square",
    description: "Instagram / social post",
    ratio: "1:1",
    previewRatio: "1 / 1",
  },
  {
    id: "portrait",
    label: "Portrait",
    description: "Vertical, phone-friendly",
    ratio: "4:5",
    previewRatio: "4 / 5",
  },
  {
    id: "landscape",
    label: "Landscape",
    description: "Widescreen, great for printing",
    ratio: "16:9",
    previewRatio: "16 / 9",
  },
];

export interface QualityOption {
  id: QualityId;
  label: string;
  description: string;
}

// Standard routes to the fast/cheap Flash model; HD/2K/4K route to the
// Pro model (only one that supports resolution control) at that size —
// see functions/src/gemini.ts for where this mapping actually happens.
export const QUALITIES: QualityOption[] = [
  { id: "standard", label: "Standard", description: "Fastest, ~10s" },
  { id: "hd", label: "HD", description: "Sharper, ~30-60s" },
  { id: "2k", label: "2K", description: "High detail, ~30-60s" },
  { id: "4k", label: "4K", description: "Best quality, ~30-60s" },
];

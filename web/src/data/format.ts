export type AspectRatioId =
  | "square"
  | "portrait"
  | "story"
  | "landscape"
  | "classic"
  | "classicPortrait"
  | "photo";
export type QualityId = "standard" | "hd" | "2k" | "4k";

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;
  description: string;
  /** Value sent to the backend / Gemini's generationConfig.imageConfig.aspectRatio */
  ratio: string;
  /** CSS aspect-ratio for the preview swatch */
  previewRatio: string;
  /**
   * Approximate output pixel dimensions at each quality tier for this
   * ratio. "standard"/"hd" are real measured Gemini output (confirmed via
   * direct API probes) — note they land at nearly the same pixel count,
   * since Flash's fixed native output happens to match Pro's smallest
   * imageSize tier (1K); HD's real advantage there is Pro's better
   * detail/lighting/prompt-adherence, not more pixels. "2k"/"4k" are
   * calculated from the confirmed 1K→2K→4K doubling pattern (verified on
   * the square ratio: 1024²→2048²→4096²).
   */
  dimensions: Record<QualityId, string>;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: "square",
    label: "Square",
    description: "Instagram / social post",
    ratio: "1:1",
    previewRatio: "1 / 1",
    dimensions: { standard: "1024×1024", hd: "1024×1024", "2k": "2048×2048", "4k": "4096×4096" },
  },
  {
    id: "portrait",
    label: "Portrait",
    description: "Instagram portrait post",
    ratio: "4:5",
    previewRatio: "4 / 5",
    dimensions: { standard: "928×1152", hd: "928×1152", "2k": "1856×2304", "4k": "3712×4608" },
  },
  {
    id: "story",
    label: "Story / Reel",
    description: "Vertical, phone-friendly",
    ratio: "9:16",
    previewRatio: "9 / 16",
    dimensions: { standard: "768×1376", hd: "768×1376", "2k": "1536×2752", "4k": "3072×5504" },
  },
  {
    id: "landscape",
    label: "Landscape",
    description: "Widescreen, great for printing",
    ratio: "16:9",
    previewRatio: "16 / 9",
    dimensions: { standard: "1376×768", hd: "1376×768", "2k": "2752×1536", "4k": "5504×3072" },
  },
  {
    id: "classic",
    label: "Classic",
    description: "Traditional photo, landscape",
    ratio: "4:3",
    previewRatio: "4 / 3",
    dimensions: { standard: "1200×896", hd: "1200×896", "2k": "2400×1792", "4k": "4800×3584" },
  },
  {
    id: "classicPortrait",
    label: "Classic Portrait",
    description: "Traditional photo, upright",
    ratio: "3:4",
    previewRatio: "3 / 4",
    dimensions: { standard: "896×1200", hd: "896×1200", "2k": "1792×2400", "4k": "3584×4800" },
  },
  {
    id: "photo",
    label: "DSLR Photo",
    description: "Classic camera ratio",
    ratio: "3:2",
    previewRatio: "3 / 2",
    dimensions: { standard: "1264×848", hd: "1264×848", "2k": "2528×1696", "4k": "5056×3392" },
  },
];

export interface QualityOption {
  id: QualityId;
  label: string;
  description: string;
}

// Standard routes to the fast/cheap Flash model; HD/2K/4K route to the
// Pro model (only one that supports resolution control) at that size —
// see functions/src/format.ts for where this mapping actually happens.
// Standard and HD land at nearly the same pixel count (see the note on
// `dimensions` above) — HD's value over Standard is Pro's better detail
// and prompt-adherence at that size, not more pixels; 2K is the first
// tier with a visibly larger image.
export const QUALITIES: QualityOption[] = [
  { id: "standard", label: "Standard", description: "Fastest, ~10-20s" },
  { id: "hd", label: "HD", description: "Sharper detail, ~20-60s" },
  { id: "2k", label: "2K", description: "Visibly larger image, ~20-60s" },
  { id: "4k", label: "4K", description: "Best quality, ~20-60s" },
];

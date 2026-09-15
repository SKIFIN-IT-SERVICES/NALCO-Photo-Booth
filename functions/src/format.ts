export type AspectRatioId =
  | "square"
  | "portrait"
  | "story"
  | "landscape"
  | "classic"
  | "classicPortrait"
  | "photo";
export type QualityId = "standard" | "hd" | "2k" | "4k";

// Must mirror web/src/data/format.ts (ids and the ratio values Gemini
// accepts for generationConfig.imageConfig.aspectRatio) — all 7 confirmed
// accepted via direct API probes.
const ASPECT_RATIOS: Record<AspectRatioId, string> = {
  square: "1:1",
  portrait: "4:5",
  story: "9:16",
  landscape: "16:9",
  classic: "4:3",
  classicPortrait: "3:4",
  photo: "3:2",
};

// Standard uses the fast/cheap Flash model, which ignores imageSize and
// stays at its native ~1MP output. HD/2K/4K need the Pro model — it's the
// only one that supports resolution control at all.
//
// Note: HD ("1K") and Standard land at roughly the same ~1MP pixel count —
// Flash's fixed native output happens to match Pro's smallest imageSize
// tier. Gemini only exposes 1K/2K/4K as size buckets, so that overlap is a
// real ceiling of the API, not something this mapping can route around.
// The two are still meaningfully different: HD runs the Pro model, which
// produces visibly better detail/lighting/prompt-adherence than Flash at
// the same pixel count — it's a quality difference, not a resolution one.
const QUALITY_CONFIG: Record<QualityId, { model: string; imageSize: string | null }> = {
  standard: { model: "gemini-3.1-flash-image-preview", imageSize: null },
  hd: { model: "gemini-3-pro-image-preview", imageSize: "1K" },
  "2k": { model: "gemini-3-pro-image-preview", imageSize: "2K" },
  "4k": { model: "gemini-3-pro-image-preview", imageSize: "4K" },
};

export function isAspectRatioId(value: unknown): value is AspectRatioId {
  return typeof value === "string" && value in ASPECT_RATIOS;
}

export function isQualityId(value: unknown): value is QualityId {
  return typeof value === "string" && value in QUALITY_CONFIG;
}

export function resolveAspectRatio(id: AspectRatioId): string {
  return ASPECT_RATIOS[id];
}

export function resolveQuality(id: QualityId): { model: string; imageSize: string | null } {
  return QUALITY_CONFIG[id];
}

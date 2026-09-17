/** A crop rectangle as fractions (0..1) of the image's natural dimensions. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

function isFullCrop(crop: CropRect): boolean {
  return crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1;
}

/**
 * Renders `imageUrl` through a canvas with the given CSS filter and crop
 * applied in one pass (canvas's ctx.filter accepts the same syntax as the
 * CSS property) — so edits chosen in the viewer bake into an actual
 * exportable file instead of only being a visual overlay.
 */
export async function bakeEditToBlob(
  imageUrl: string,
  filterCss: string,
  crop: CropRect = FULL_CROP
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const sx = isFullCrop(crop) ? 0 : Math.round(crop.x * img.naturalWidth);
  const sy = isFullCrop(crop) ? 0 : Math.round(crop.y * img.naturalHeight);
  const sw = isFullCrop(crop) ? img.naturalWidth : Math.round(crop.w * img.naturalWidth);
  const sh = isFullCrop(crop) ? img.naturalHeight : Math.round(crop.h * img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.filter = filterCss === "none" ? "none" : filterCss;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export image"))),
      "image/jpeg",
      0.92
    );
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

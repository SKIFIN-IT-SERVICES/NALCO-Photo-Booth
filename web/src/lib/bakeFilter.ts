/**
 * Renders `imageUrl` through a canvas with the given CSS filter applied
 * (canvas's ctx.filter accepts the same syntax as the CSS property), so a
 * filter chosen in the preview can be baked into an actual downloadable/
 * printable file instead of only being a visual overlay.
 */
export async function bakeFilterToBlob(imageUrl: string, filterCss: string): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.filter = filterCss === "none" ? "none" : filterCss;
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export image"))),
      "image/jpeg",
      0.95
    );
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

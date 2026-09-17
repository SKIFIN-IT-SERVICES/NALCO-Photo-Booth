import { useLayoutEffect, useRef, useState } from "react";
import { useZoomPan } from "../hooks/useZoomPan";
import { FILTERS, buildFilterCss, DEFAULT_ADJUSTMENTS, type Adjustments } from "../data/filters";
import { bakeEditToBlob, blobToBase64, FULL_CROP, type CropRect } from "../lib/bakeFilter";
import { updatePhoto } from "../firebase";

type Tab = "zoom" | "crop" | "filters";

interface CropPreset {
  id: string;
  label: string;
  ratio: number | null; // width/height in pixels, null = free
}

const CROP_PRESETS: CropPreset[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "square", label: "Square", ratio: 1 },
  { id: "portrait", label: "Portrait", ratio: 4 / 5 },
  { id: "landscape", label: "Landscape", ratio: 16 / 9 },
];

const MIN_CROP_FRACTION = 0.15;

function cropForAspect(targetRatio: number, natW: number, natH: number): CropRect {
  const imgRatio = natW / natH;
  let cropWpx: number, cropHpx: number;
  if (targetRatio > imgRatio) {
    cropWpx = natW;
    cropHpx = natW / targetRatio;
  } else {
    cropHpx = natH;
    cropWpx = natH * targetRatio;
  }
  return {
    x: (natW - cropWpx) / 2 / natW,
    y: (natH - cropHpx) / 2 / natH,
    w: cropWpx / natW,
    h: cropHpx / natH,
  };
}

interface PhotoEditorProps {
  sessionId: string;
  imageUrl: string;
  initialFilterId: string;
  onSaved: (newImageUrl: string) => void;
  onClose: () => void;
}

export default function PhotoEditor({
  sessionId,
  imageUrl,
  initialFilterId,
  onSaved,
  onClose,
}: PhotoEditorProps) {
  const [tab, setTab] = useState<Tab>("zoom");
  const [filterId, setFilterId] = useState(initialFilterId);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [crop, setCrop] = useState<CropRect>(FULL_CROP);
  const [cropPresetId, setCropPresetId] = useState("free");
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { scale, translate, reset, zoomIn, zoomOut, handlers } = useZoomPan();
  const filterCss = buildFilterCss(filterId, adjustments);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  }

  function pickCropPreset(preset: CropPreset) {
    setCropPresetId(preset.id);
    if (preset.ratio && naturalSize) {
      setCrop(cropForAspect(preset.ratio, naturalSize.w, naturalSize.h));
    } else if (preset.id === "free") {
      // keep current box, just unlock the ratio for future drags
    }
  }

  async function handleDone() {
    setError(null);
    setSaving(true);
    try {
      const blob = await bakeEditToBlob(imageUrl, filterCss, crop);
      const base64 = await blobToBase64(blob);
      const res = await updatePhoto({ sessionId, imageBase64: base64, mimeType: "image/jpeg" });
      onSaved(res.data.imageUrl);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Couldn't save your edits — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen-fade fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} disabled={saving} className="rounded-full bg-white/15 px-6 py-3 text-white disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={handleDone}
          disabled={saving}
          className="rounded-full bg-nalco-orange px-6 py-3 font-semibold text-nalco-navy disabled:opacity-60"
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </div>

      {/* Tool tabs */}
      <div className="flex justify-center gap-2 py-3">
        {(["zoom", "crop", "filters"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-nalco-orange text-nalco-navy" : "bg-white/10 text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="px-6 text-center text-xs text-red-400">{error}</p>}

      {tab === "zoom" && (
        <ZoomTab
          imageUrl={imageUrl}
          filterCss={filterCss}
          scale={scale}
          translate={translate}
          handlers={handlers}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          reset={reset}
        />
      )}

      {tab === "crop" && (
        <CropTab
          imageUrl={imageUrl}
          filterCss={filterCss}
          crop={crop}
          setCrop={setCrop}
          cropPresetId={cropPresetId}
          onPickPreset={pickCropPreset}
          onImageLoad={handleImageLoad}
          naturalSize={naturalSize}
        />
      )}

      {tab === "filters" && (
        <FiltersTab
          imageUrl={imageUrl}
          filterId={filterId}
          setFilterId={setFilterId}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
          crop={crop}
        />
      )}
    </div>
  );
}

function ZoomTab({
  imageUrl,
  filterCss,
  scale,
  translate,
  handlers,
  zoomIn,
  zoomOut,
  reset,
}: {
  imageUrl: string;
  filterCss: string;
  scale: number;
  translate: { x: number; y: number };
  handlers: ReturnType<typeof useZoomPan>["handlers"];
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}) {
  return (
    <div
      className="relative flex flex-1 touch-none items-center justify-center overflow-hidden"
      onWheel={handlers.onWheel}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
      onMouseLeave={handlers.onMouseUp}
    >
      <img
        src={imageUrl}
        alt="Zoom preview"
        draggable={false}
        className="max-h-full max-w-full select-none"
        style={{
          filter: filterCss,
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: scale === 1 ? "transform 150ms ease-out" : undefined,
        }}
      />
      <div className="absolute bottom-4 right-4 flex flex-col gap-3">
        <button onClick={zoomIn} aria-label="Zoom in" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white">
          +
        </button>
        <button onClick={zoomOut} aria-label="Zoom out" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white">
          −
        </button>
        <button onClick={reset} aria-label="Reset zoom" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xs text-white">
          1:1
        </button>
      </div>
    </div>
  );
}

type DragMode = { kind: "move" } | { kind: "resize"; corner: "tl" | "tr" | "bl" | "br" };

function CropTab({
  imageUrl,
  filterCss,
  crop,
  setCrop,
  cropPresetId,
  onPickPreset,
  onImageLoad,
  naturalSize,
}: {
  imageUrl: string;
  filterCss: string;
  crop: CropRect;
  setCrop: (c: CropRect) => void;
  cropPresetId: string;
  onPickPreset: (p: CropPreset) => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  naturalSize: { w: number; h: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [displayRect, setDisplayRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const dragRef = useRef<{ mode: DragMode; startCrop: CropRect; startX: number; startY: number } | null>(null);
  const lockedRatio = CROP_PRESETS.find((p) => p.id === cropPresetId)?.ratio ?? null;

  function measure() {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current.getBoundingClientRect();
    const parent = containerRef.current.getBoundingClientRect();
    setDisplayRect({ left: img.left - parent.left, top: img.top - parent.top, width: img.width, height: img.height });
  }

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function clamp01(v: number) {
    return Math.min(1, Math.max(0, v));
  }

  function startDrag(mode: DragMode) {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = { mode, startCrop: crop, startX: e.clientX, startY: e.clientY };
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !displayRect) return;
    const dxFrac = (e.clientX - drag.startX) / displayRect.width;
    const dyFrac = (e.clientY - drag.startY) / displayRect.height;
    const { startCrop } = drag;

    if (drag.mode.kind === "move") {
      const x = clamp01(Math.min(1 - startCrop.w, Math.max(0, startCrop.x + dxFrac)));
      const y = clamp01(Math.min(1 - startCrop.h, Math.max(0, startCrop.y + dyFrac)));
      setCrop({ ...startCrop, x, y });
      return;
    }

    // Resize from one corner, anchored at the opposite corner.
    const corner = drag.mode.corner;
    const anchorX = corner.includes("l") ? startCrop.x + startCrop.w : startCrop.x;
    const anchorY = corner.includes("t") ? startCrop.y + startCrop.h : startCrop.y;
    const movingX = clamp01((corner.includes("l") ? startCrop.x : startCrop.x + startCrop.w) + dxFrac);
    const movingY = clamp01((corner.includes("t") ? startCrop.y : startCrop.y + startCrop.h) + dyFrac);

    let w = Math.abs(movingX - anchorX);
    let h = Math.abs(movingY - anchorY);

    if (lockedRatio && naturalSize) {
      // Fraction-space width/height aren't proportional to pixel width/
      // height unless the source image itself is square, so the locked
      // *pixel* ratio has to be converted through the image's natural
      // dimensions: (w*natW)/(h*natH) = lockedRatio.
      h = (w * naturalSize.w) / (lockedRatio * naturalSize.h);
    }

    if (w < MIN_CROP_FRACTION) w = MIN_CROP_FRACTION;
    if (h < MIN_CROP_FRACTION) h = MIN_CROP_FRACTION;

    const x = corner.includes("l") ? anchorX - w : anchorX;
    const y = corner.includes("t") ? anchorY - h : anchorY;
    const finalX = clamp01(Math.min(x, anchorX));
    const finalY = clamp01(Math.min(y, anchorY));
    const finalW = Math.min(w, 1 - finalX);
    const finalH = Math.min(h, 1 - finalY);
    setCrop({ x: finalX, y: finalY, w: finalW, h: finalH });
  }

  function endDrag() {
    dragRef.current = null;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Crop preview"
          draggable={false}
          onLoad={(e) => {
            onImageLoad(e);
            measure();
          }}
          className="max-h-full max-w-full select-none"
          style={{ filter: filterCss }}
        />

        {displayRect && (
          <>
            {/* Dim everything outside the crop box */}
            <div
              className="pointer-events-none absolute bg-black/60"
              style={{
                left: displayRect.left,
                top: displayRect.top,
                width: displayRect.width,
                height: crop.y * displayRect.height,
              }}
            />
            <div
              className="pointer-events-none absolute bg-black/60"
              style={{
                left: displayRect.left,
                top: displayRect.top + (crop.y + crop.h) * displayRect.height,
                width: displayRect.width,
                height: (1 - crop.y - crop.h) * displayRect.height,
              }}
            />
            <div
              className="pointer-events-none absolute bg-black/60"
              style={{
                left: displayRect.left,
                top: displayRect.top + crop.y * displayRect.height,
                width: crop.x * displayRect.width,
                height: crop.h * displayRect.height,
              }}
            />
            <div
              className="pointer-events-none absolute bg-black/60"
              style={{
                left: displayRect.left + (crop.x + crop.w) * displayRect.width,
                top: displayRect.top + crop.y * displayRect.height,
                width: (1 - crop.x - crop.w) * displayRect.width,
                height: crop.h * displayRect.height,
              }}
            />

            {/* Crop box itself — drag inside to move */}
            <div
              onPointerDown={startDrag({ kind: "move" })}
              className="absolute cursor-move border-2 border-white"
              style={{
                left: displayRect.left + crop.x * displayRect.width,
                top: displayRect.top + crop.y * displayRect.height,
                width: crop.w * displayRect.width,
                height: crop.h * displayRect.height,
              }}
            >
              {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                <div
                  key={corner}
                  onPointerDown={startDrag({ kind: "resize", corner })}
                  className="absolute h-7 w-7 rounded-full border-2 border-nalco-navy bg-white"
                  style={{
                    left: corner.includes("l") ? -14 : undefined,
                    right: corner.includes("r") ? -14 : undefined,
                    top: corner.includes("t") ? -14 : undefined,
                    bottom: corner.includes("b") ? -14 : undefined,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        {CROP_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPickPreset(p)}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              cropPresetId === p.id ? "bg-nalco-orange text-nalco-navy" : "bg-white/10 text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FiltersTab({
  imageUrl,
  filterId,
  setFilterId,
  adjustments,
  setAdjustments,
  crop,
}: {
  imageUrl: string;
  filterId: string;
  setFilterId: (id: string) => void;
  adjustments: Adjustments;
  setAdjustments: (a: Adjustments) => void;
  crop: CropRect;
}) {
  const previewFilterCss = buildFilterCss(filterId, adjustments);
  const isCropped = crop.w < 1 || crop.h < 1;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <div
          className="h-full max-h-full w-full max-w-full overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            filter: previewFilterCss,
            backgroundPosition: isCropped
              ? `${(crop.x + crop.w / 2) * 100}% ${(crop.y + crop.h / 2) * 100}%`
              : "center",
            backgroundSize: isCropped ? `${100 / crop.w}% ${100 / crop.h}%` : "contain",
          }}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterId(f.id)}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-2 ${
              filterId === f.id ? "border-nalco-orange" : "border-transparent"
            }`}
          >
            <div className="h-14 w-14 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})`, filter: f.css }} />
            <span className="text-xs text-white/80">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <AdjustSlider
          label="Brightness"
          value={adjustments.brightness}
          onChange={(v) => setAdjustments({ ...adjustments, brightness: v })}
        />
        <AdjustSlider
          label="Contrast"
          value={adjustments.contrast}
          onChange={(v) => setAdjustments({ ...adjustments, contrast: v })}
        />
        <AdjustSlider
          label="Saturation"
          value={adjustments.saturation}
          onChange={(v) => setAdjustments({ ...adjustments, saturation: v })}
        />
      </div>
    </div>
  );
}

function AdjustSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-white/80">
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={-50}
        max={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-nalco-orange"
      />
      <span className="w-8 shrink-0 text-right text-xs text-white/50">{value}</span>
    </label>
  );
}

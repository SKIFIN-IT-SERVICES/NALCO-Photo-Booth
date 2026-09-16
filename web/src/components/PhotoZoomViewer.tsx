import { useState } from "react";
import { useZoomPan } from "../hooks/useZoomPan";
import { FILTERS, getFilter } from "../data/filters";

interface PhotoZoomViewerProps {
  imageUrl: string;
  initialFilterId: string;
  onApply: (filterId: string) => void;
  onClose: () => void;
}

export default function PhotoZoomViewer({
  imageUrl,
  initialFilterId,
  onApply,
  onClose,
}: PhotoZoomViewerProps) {
  const [filterId, setFilterId] = useState(initialFilterId);
  const { scale, translate, reset, zoomIn, zoomOut, handlers } = useZoomPan();

  return (
    <div className="screen-fade fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="rounded-full bg-white/15 px-6 py-3 text-white">
          Cancel
        </button>
        <button
          onClick={() => onApply(filterId)}
          className="rounded-full bg-nalco-orange px-6 py-3 font-semibold text-nalco-navy"
        >
          Done
        </button>
      </div>

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
            filter: getFilter(filterId).css,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: scale === 1 ? "transform 150ms ease-out" : undefined,
          }}
        />

        <div className="absolute bottom-4 right-4 flex flex-col gap-3">
          <button
            onClick={zoomIn}
            aria-label="Zoom in"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            aria-label="Zoom out"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
          >
            −
          </button>
          <button
            onClick={reset}
            aria-label="Reset zoom"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xs text-white"
          >
            1:1
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterId(f.id)}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-2 ${
              filterId === f.id ? "border-nalco-orange" : "border-transparent"
            }`}
          >
            <div
              className="h-14 w-14 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})`, filter: f.css }}
            />
            <span className="text-xs text-white/80">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

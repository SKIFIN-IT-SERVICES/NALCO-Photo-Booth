import { useState } from "react";
import { useBooth } from "../state/BoothContext";
import { ASPECT_RATIOS, QUALITIES, type AspectRatioId, type QualityId } from "../data/format";

export default function FormatPicker() {
  const { setFormat, goTo } = useBooth();
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("portrait");
  const [quality, setQuality] = useState<QualityId>("hd");

  return (
    <div className="flex h-full w-full flex-col items-center gap-6 overflow-y-auto bg-nalco-navy p-8">
      <h2 className="text-3xl font-semibold text-white">Choose Your Format</h2>

      <div className="w-full max-w-4xl">
        <p className="mb-3 text-center text-lg text-white/70">Shape</p>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {ASPECT_RATIOS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAspectRatio(opt.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition ${
                aspectRatio === opt.id
                  ? "border-nalco-orange bg-white/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className="w-12 rounded-md border-2 border-white/40 bg-white/20"
                style={{ aspectRatio: opt.previewRatio }}
              />
              <span className="text-sm font-semibold text-white">{opt.label}</span>
              <span className="text-[11px] text-white/50">{opt.ratio}</span>
              <span className="text-[11px] text-white/40">{opt.dimensions[quality]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <p className="mb-3 text-center text-lg text-white/70">Quality</p>
        <div className="flex flex-wrap justify-center gap-4">
          {QUALITIES.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setQuality(opt.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-6 py-4 transition ${
                quality === opt.id ? "border-nalco-orange bg-white/10" : "border-white/10 bg-white/5"
              }`}
            >
              <span className="text-base font-semibold text-white">{opt.label}</span>
              <span className="text-xs text-white/50">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex gap-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <button
          onClick={() => goTo("scene")}
          className="rounded-full bg-white/20 px-10 py-4 text-lg text-white"
        >
          Back
        </button>
        <button
          onClick={() => setFormat(aspectRatio, quality)}
          className="rounded-full bg-nalco-orange px-14 py-4 text-xl font-semibold text-nalco-navy shadow-lg"
        >
          Generate My Photo
        </button>
      </div>
    </div>
  );
}

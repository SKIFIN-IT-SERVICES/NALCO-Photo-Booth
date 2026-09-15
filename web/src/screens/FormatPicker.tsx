import { useState } from "react";
import { useBooth } from "../state/BoothContext";
import { ASPECT_RATIOS, QUALITIES, type AspectRatioId, type QualityId } from "../data/format";

export default function FormatPicker() {
  const { setFormat, goTo } = useBooth();
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("portrait");
  const [quality, setQuality] = useState<QualityId>("hd");

  return (
    <div className="flex h-full w-full flex-col items-center gap-8 bg-nalco-navy p-10">
      <h2 className="text-3xl font-semibold text-white">Choose Your Format</h2>

      <div className="w-full max-w-2xl">
        <p className="mb-4 text-center text-lg text-white/70">Shape</p>
        <div className="flex justify-center gap-6">
          {ASPECT_RATIOS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAspectRatio(opt.id)}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition ${
                aspectRatio === opt.id
                  ? "border-nalco-orange bg-white/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className="w-20 rounded-md border-2 border-white/40 bg-white/20"
                style={{ aspectRatio: opt.previewRatio }}
              />
              <span className="text-base font-semibold text-white">{opt.label}</span>
              <span className="text-xs text-white/50">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <p className="mb-4 text-center text-lg text-white/70">Quality</p>
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

      <div className="mt-auto flex gap-6">
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

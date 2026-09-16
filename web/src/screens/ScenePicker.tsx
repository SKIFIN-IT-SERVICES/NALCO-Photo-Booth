import { useState } from "react";
import { useBooth } from "../state/BoothContext";
import { SCENES, type SceneOption } from "../data/scenes";

export default function ScenePicker() {
  const { setScene, goTo } = useBooth();
  const [preview, setPreview] = useState<SceneOption | null>(null);

  return (
    <div className="flex h-full w-full flex-col items-center gap-8 bg-nalco-navy p-10">
      <h2 className="text-3xl font-semibold text-white">Choose Your Scene</h2>
      <p className="-mt-6 text-sm text-white/50">Tap a scene for a closer look</p>

      <div className="grid w-full max-w-5xl flex-1 grid-cols-3 gap-6 overflow-y-auto">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setPreview(scene)}
            className="group flex flex-col overflow-hidden rounded-2xl border-2 border-white/10 bg-white/5 text-left shadow-lg transition active:scale-95"
          >
            <img
              src={scene.thumbnail}
              alt={scene.name}
              className="h-40 w-full object-cover"
            />
            <div className="p-4">
              <p className="text-lg font-semibold text-white">{scene.name}</p>
              <p className="text-sm text-white/60">{scene.description}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => goTo("confirm")}
        className="rounded-full bg-white/20 px-10 py-4 text-lg text-white"
      >
        Back
      </button>

      {preview && (
        <div className="screen-fade fixed inset-0 z-40 flex flex-col bg-black/95">
          <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
            <img
              src={preview.thumbnail}
              alt={preview.name}
              className="h-full w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
          <div className="flex flex-col items-center gap-1 px-6 pb-2 text-center">
            <p className="text-2xl font-semibold text-white">{preview.name}</p>
            <p className="text-white/60">{preview.description}</p>
          </div>
          <div className="flex justify-center gap-6 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
            <button
              onClick={() => setPreview(null)}
              className="rounded-full bg-white/15 px-10 py-4 text-lg text-white"
            >
              Back
            </button>
            <button
              onClick={() => setScene(preview.id)}
              className="rounded-full bg-nalco-orange px-14 py-4 text-xl font-semibold text-nalco-navy shadow-lg"
            >
              Choose This Scene
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

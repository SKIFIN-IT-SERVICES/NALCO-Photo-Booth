import { useBooth } from "../state/BoothContext";
import { SCENES } from "../data/scenes";

export default function ScenePicker() {
  const { setScene, goTo } = useBooth();

  return (
    <div className="flex h-full w-full flex-col items-center gap-8 bg-nalco-navy p-10">
      <h2 className="text-3xl font-semibold text-white">Choose Your Scene</h2>

      <div className="grid w-full max-w-5xl flex-1 grid-cols-3 gap-6 overflow-y-auto">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setScene(scene.id)}
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
    </div>
  );
}

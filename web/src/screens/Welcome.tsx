import { useBooth } from "../state/BoothContext";

export default function Welcome() {
  const { goTo } = useBooth();

  return (
    <button
      onClick={() => goTo("capture")}
      className="flex h-full w-full flex-col items-center justify-center gap-8 bg-gradient-to-b from-nalco-navy to-nalco-blue text-white"
    >
      <div className="text-center">
        <p className="text-2xl tracking-[0.3em] text-nalco-amber">NALCO</p>
        <h1 className="mt-4 text-6xl font-bold">See Yourself at the Mine</h1>
        <p className="mt-6 text-xl text-white/70">
          Take a selfie, pick a scene, get your AI photo instantly
        </p>
      </div>
      <div className="mt-12 rounded-full bg-nalco-orange px-16 py-6 text-3xl font-semibold text-nalco-navy shadow-lg">
        Tap to Start
      </div>
    </button>
  );
}

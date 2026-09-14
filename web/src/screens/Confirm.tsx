import { useBooth } from "../state/BoothContext";

export default function Confirm() {
  const { selfieDataUrl, goTo } = useBooth();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-nalco-navy p-8">
      <h2 className="text-3xl font-semibold text-white">Use this photo?</h2>
      {selfieDataUrl && (
        <img
          src={selfieDataUrl}
          alt="Your selfie"
          className="max-h-[60vh] rounded-2xl border-4 border-white/20 shadow-xl"
        />
      )}
      <div className="flex gap-6">
        <button
          onClick={() => goTo("capture")}
          className="rounded-full bg-white/20 px-10 py-5 text-xl text-white"
        >
          Retake
        </button>
        <button
          onClick={() => goTo("scene")}
          className="rounded-full bg-nalco-orange px-14 py-5 text-xl font-semibold text-nalco-navy shadow-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
